const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db/store');
const paystack = require('../services/paystack');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');
const { sendTicketConfirmation } = require('../services/notifications');
const { SITE_URL } = require('../services/notifications');

const SERVICE_FEE_RATE = 0.05;   // shown to the customer as "service fee (5%)"
const MAX_PER_TICKET_TYPE = 10;
const HOLD_MS = 15 * 60 * 1000;  // how long an unfinished payment keeps its tickets reserved
const NOT_ON_SALE = ['cancelled', 'suspended', 'draft', 'ended', 'sold_out', 'paused'];

/**
 * Tickets for an event that other buyers are in the middle of paying for.
 * They are held for HOLD_MS so two people cannot both pay for the last one.
 * The buyer's own unfinished attempts are not counted, so they can retry.
 */
function heldTickets(eventId, buyer = {}) {
  const since = Date.now() - HOLD_MS;
  const email = String(buyer.email || '').toLowerCase();
  return db.getAllPayments().reduce((sum, p) => {
    if (p.status !== 'pending' || p.type === 'resale') return sum;
    if (new Date(p.createdAt).getTime() < since) return sum;
    if (buyer.userId && p.userId === buyer.userId) return sum;
    if (email && String(p.customerEmail || '').toLowerCase() === email) return sum;
    return sum + (p.cart || []).reduce((n, i) => n + (i.eventId === eventId ? i.quantity : 0), 0);
  }, 0);
}

/**
 * The money arrived but the tickets cannot be issued (sold to someone else
 * in the meantime). No ticket is created; the payment is flagged so the
 * admin refunds it from the Paystack dashboard.
 */
function markRefundDue(payment, { paymentRef, channel, io }, reason) {
  const updated = db.updatePayment(payment.reference, {
    status: 'refund_due',
    refundReason: reason,
    paymentRef,
    channel,
    paidAt: new Date().toISOString(),
  });
  const notif = db.createNotification({
    type: 'refund_due',
    title: 'Refund needed',
    message: `${payment.customerName} paid Ksh ${Number(payment.amount).toLocaleString()} (${payment.orderRef}) but no ticket was issued: ${reason}. Refund this payment in Paystack.`,
    meta: { orderRef: payment.orderRef, amount: payment.amount },
  });
  if (io) io.to('admin-room').emit('admin:notification', notif);
  console.error(`[Payments] REFUND DUE ${payment.orderRef} (${paymentRef}) Ksh ${payment.amount} — ${reason}`);
  return updated;
}

/**
 * Price the cart from the database — never from the browser, or a customer
 * could edit the request and pay Ksh 1. Throws with a customer-safe message.
 */
function priceCart(rawCart, buyer = {}) {
  if (!Array.isArray(rawCart) || rawCart.length === 0) throw new Error('Your cart is empty');

  const wanted = {}; // tickets asked for per event, across regular and VIP lines

  const items = rawCart.map((line) => {
    const event = db.getEventById(line.eventId);
    if (!event) throw new Error('One of these events is no longer available');
    // Events are created as 'on_sale' but seeded as 'active' — block only the
    // statuses that clearly mean "not selling"
    if (NOT_ON_SALE.includes(event.status)) throw new Error(`${event.title} is no longer on sale`);

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_TICKET_TYPE) {
      throw new Error(`Choose between 1 and ${MAX_PER_TICKET_TYPE} tickets per type`);
    }

    const ticketType = line.ticketType === 'vip' ? 'vip' : 'regular';
    const price = ticketType === 'vip' ? (event.vipPrice ?? event.price) : event.price;
    if (!(price > 0)) throw new Error(`${event.title} has no price set for ${ticketType} tickets`);

    wanted[event.id] = (wanted[event.id] || 0) + quantity;
    if (event.totalTickets != null) {
      const unsold = event.totalTickets - (event.soldTickets ?? 0);
      const left = unsold - heldTickets(event.id, buyer);
      if (wanted[event.id] > left) {
        if (left > 0) throw new Error(`Only ${left} ticket${left === 1 ? '' : 's'} left for ${event.title}`);
        throw new Error(unsold > 0
          ? `The last tickets for ${event.title} are being paid for right now. Please try again in a few minutes.`
          : `${event.title} is sold out`);
      }
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      venue: event.venue,
      image: event.image,
      ticketType,
      quantity,
      price,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return { items, subtotal, serviceFee, total: subtotal + serviceFee };
}

/**
 * Turn a paid payment into bookings, tickets and notifications.
 * Safe to call more than once: the webhook and the customer's return both
 * land here, and only the first call does the work.
 */
function fulfilPayment(stalePayment, { paymentRef, channel, io }) {
  // Always work from the stored record: the caller may have looked the
  // payment up before waiting on Paystack, and the webhook may have
  // fulfilled it in the meantime. Without this, tickets are issued twice.
  const payment = db.getPayment(stalePayment.reference) || stalePayment;
  if (payment.status === 'success' || payment.status === 'refund_due') return payment;

  const isResale = payment.type === 'resale';

  if (isResale) {
    const listing = payment.listingId && db.getListingById(payment.listingId);
    if (!listing || listing.status !== 'active') {
      return markRefundDue(payment, { paymentRef, channel, io }, 'the resale ticket was already sold or withdrawn');
    }
  } else {
    // Paid after the hold ran out and the tickets went to someone else
    const needed = {};
    payment.cart.forEach((i) => { needed[i.eventId] = (needed[i.eventId] || 0) + i.quantity; });
    for (const [eventId, quantity] of Object.entries(needed)) {
      const event = db.getEventById(eventId);
      if (event && event.totalTickets != null && quantity > event.totalTickets - (event.soldTickets ?? 0)) {
        return markRefundDue(payment, { paymentRef, channel, io }, `${event.title} sold out before the payment arrived`);
      }
    }
  }

  db.updatePayment(payment.reference, {
    status: 'success',
    paymentRef,
    channel,
    paidAt: new Date().toISOString(),
  });

  const created = [];

  // A resale moves an existing ticket: it is not a new sale for the event
  // or the organiser, so it is handled separately below
  if (!isResale) payment.cart.forEach((item) => {
    created.push(db.createBooking({
      userId: payment.userId || 'guest',
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      eventDate: item.eventDate,
      eventTime: item.eventTime,
      venue: item.venue,
      image: item.image,
      ticketType: item.ticketType,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      paymentRef,
      orderRef: payment.orderRef,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
    }));

    const event = db.getEventById(item.eventId);
    if (event) {
      db.updateEvent(item.eventId, { soldTickets: (event.soldTickets || 0) + item.quantity });
      const vendor = db.getVendorById(event.vendorId);
      if (vendor) {
        db.updateVendor(vendor.id, { totalRevenue: (vendor.totalRevenue || 0) + item.price * item.quantity });
      }
    }
  });

  // Resale purchase: the seller's ticket is retired and a fresh one issued
  if (isResale) {
    const listing = db.getListingById(payment.listingId);
    db.updateBooking(listing.bookingId, { status: 'sold', soldTo: payment.userId });
    created.push(db.createBooking({
      userId: payment.userId,
      eventId: listing.eventId,
      eventTitle: listing.eventTitle,
      eventDate: listing.eventDate,
      eventTime: listing.eventTime,
      venue: listing.venue,
      image: listing.image,
      ticketType: listing.ticketType,
      quantity: listing.quantity,
      unitPrice: listing.askingPrice,
      totalPrice: listing.askingPrice,
      paymentRef,
      orderRef: payment.orderRef,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      purchasedViaResale: true,
    }));
    db.updateListing(listing.id, { status: 'sold', soldTo: payment.userId, soldAt: new Date().toISOString() });
  }

  if (io) {
    const eventTitles = [...new Set(payment.cart.map((i) => i.eventTitle))].join(', ');
    const totalQty = payment.cart.reduce((s, i) => s + i.quantity, 0);
    const notif = db.createNotification({
      type: 'ticket_purchase',
      title: 'Tickets Purchased',
      message: `${payment.customerName} bought ${totalQty} ticket${totalQty !== 1 ? 's' : ''} for ${eventTitles} — Ksh ${Number(payment.amount).toLocaleString()}`,
      meta: { orderRef: payment.orderRef, amount: payment.amount },
    });
    io.to('admin-room').emit('admin:notification', notif);
  }

  sendTicketConfirmation({
    customerEmail: payment.customerEmail,
    customerName: payment.customerName,
    phone: payment.phone,
    orderRef: payment.orderRef,
    paymentRef,
    amount: payment.amount,
    cart: payment.cart,
    bookings: created,
  }).catch((err) => console.error('[Notifications] Failed:', err.message));

  console.log(`[Payments] Fulfilled ${payment.orderRef} (${paymentRef}) — ${created.length} booking(s)`);
  return db.getPayment(payment.reference);
}

/**
 * POST /api/payments/paystack/init
 * Prices the cart here, starts a Paystack payment and returns the URL to send
 * the customer to. Body: { cart, customerName, customerEmail, phone }
 */
router.post('/paystack/init', optionalAuth, async (req, res) => {
  if (!paystack.isConfigured()) {
    return res.status(503).json({ message: 'Card and mobile payments are not set up yet. Please try again later.' });
  }

  const { cart, customerName, customerEmail, phone } = req.body || {};
  const email = String(customerEmail || req.user?.email || '').trim();
  if (!email.includes('@')) return res.status(400).json({ message: 'A valid email address is required' });

  let priced;
  try {
    priced = priceCart(cart, { email, userId: req.user?.id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }

  const reference = `PT${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  // Secret known only to the buyer's browser. The order reference is printed
  // on receipts, so it must not be enough on its own to fetch ticket QR codes.
  const accessKey = crypto.randomBytes(24).toString('hex');

  db.savePayment(reference, {
    reference,
    orderRef: reference,
    accessKey,
    provider: 'paystack',
    userId: req.user && req.user.role !== 'vendor' ? req.user.id : null,
    phone,
    amount: priced.total,
    subtotal: priced.subtotal,
    serviceFee: priced.serviceFee,
    cart: priced.items,
    customerName: String(customerName || req.user?.name || '').trim() || 'Guest',
    customerEmail: email,
    status: 'pending',
    paymentRef: null,
  });

  try {
    const tx = await paystack.initializeTransaction({
      email,
      amount: priced.total,
      reference,
      callbackUrl: `${SITE_URL}/payment/complete`,
      metadata: {
        orderRef: reference,
        customerName,
        cart: priced.items.map((i) => `${i.eventTitle} ${i.ticketType} x${i.quantity}`).join(', '),
      },
    });
    res.json({
      authorizationUrl: tx.authorization_url,
      reference,
      accessKey,
      amount: priced.total,
      subtotal: priced.subtotal,
      serviceFee: priced.serviceFee,
    });
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error('[Paystack] init failed:', detail);
    db.updatePayment(reference, { status: 'failed', failureReason: detail });
    res.status(502).json({ message: 'Could not start the payment. Please try again.' });
  }
});

/**
 * POST /api/payments/paystack/webhook
 * Paystack calls this when a payment finishes. Mounted with a raw body in
 * server.js so the signature can be checked against the exact bytes sent.
 */
router.post('/paystack/webhook', (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  if (!paystack.isValidWebhookSignature(raw, req.headers['x-paystack-signature'])) {
    console.warn('[Paystack] webhook rejected — bad signature');
    return res.sendStatus(401);
  }

  // Always answer quickly; Paystack retries anything that is not a 200
  res.sendStatus(200);

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return; }
  if (event?.event !== 'charge.success') return;

  const data = event.data || {};
  const payment = db.getPayment(data.reference);
  if (!payment) return console.warn(`[Paystack] webhook for unknown reference ${data.reference}`);

  // Guard against a tampered or partial payment
  const paid = Number(data.amount) / 100;
  // Prices are in Kenya shillings: the same number in another currency is not full payment
  if (data.currency && data.currency !== paystack.CURRENCY) {
    db.updatePayment(payment.reference, { status: 'underpaid', paidAmount: paid, paidCurrency: data.currency });
    return console.error(`[Paystack] ${payment.orderRef}: paid in ${data.currency}, expected ${paystack.CURRENCY}`);
  }
  if (paid + 0.01 < Number(payment.amount)) {
    db.updatePayment(payment.reference, { status: 'underpaid', paidAmount: paid });
    return console.error(`[Paystack] ${payment.orderRef}: paid ${paid} but expected ${payment.amount}`);
  }

  try {
    fulfilPayment(payment, { paymentRef: data.reference, channel: data.channel, io: req.app.get('io') });
  } catch (err) {
    console.error('[Paystack] webhook fulfilment failed:', err.message);
  }
});

/**
 * GET /api/payments/paystack/verify/:reference
 * Used by the page the customer lands on after paying. Asks Paystack what
 * happened, so tickets appear even if the webhook is slow.
 */
router.get('/paystack/verify/:reference', optionalAuth, async (req, res) => {
  const payment = db.getPayment(req.params.reference);
  if (!payment) return res.status(404).json({ message: 'We could not find that payment' });

  // Ticket QR codes go only to the buyer: the browser that started the
  // payment (it holds the access key) or the signed-in account that paid
  const key = String(req.query.key || '');
  const hasKey = !!payment.accessKey && key.length === payment.accessKey.length &&
    crypto.timingSafeEqual(Buffer.from(key), Buffer.from(payment.accessKey));
  const isOwner = !!req.user && !!payment.userId && req.user.id === payment.userId;

  const tickets = () => db.getBookings()
    .filter((b) => b.orderRef === payment.orderRef && b.status === 'active' && b.ticketCode)
    .map((b) => ({
      ticketCode: b.ticketCode, orderRef: b.orderRef, eventTitle: b.eventTitle, eventDate: b.eventDate,
      eventTime: b.eventTime, venue: b.venue, ticketType: b.ticketType, quantity: b.quantity,
      customerName: b.customerName,
    }));

  const summary = () => {
    const current = db.getPayment(payment.reference);
    return {
      status: current.status,
      orderRef: payment.orderRef,
      amount: payment.amount,
      email: payment.customerEmail,
      cart: payment.cart,
      paymentRef: current.paymentRef,
      ...(current.status === 'success' && (hasKey || isOwner) ? { tickets: tickets() } : {}),
    };
  };

  const REFUND_MESSAGE = 'Your payment was received, but the tickets were sold to someone else just before it arrived. We will refund you in full.';
  if (payment.status === 'success') return res.json(summary());
  if (payment.status === 'refund_due') return res.json({ ...summary(), message: REFUND_MESSAGE });

  try {
    const tx = await paystack.verifyTransaction(payment.reference);
    if (tx.status === 'success') {
      const wrongCurrency = !!tx.currency && tx.currency !== paystack.CURRENCY;
      if (wrongCurrency || tx.amount + 0.01 < Number(payment.amount)) {
        db.updatePayment(payment.reference, { status: 'underpaid', paidAmount: tx.amount, paidCurrency: tx.currency });
        return res.json({ ...summary(), message: 'The amount paid was less than the ticket price. Please contact support.' });
      }
      const done = fulfilPayment(payment, { paymentRef: tx.reference, channel: tx.channel, io: req.app.get('io') });
      if (done.status === 'refund_due') return res.json({ ...summary(), message: REFUND_MESSAGE });
    } else if (['failed', 'abandoned', 'reversed'].includes(tx.status)) {
      db.updatePayment(payment.reference, { status: 'failed', failureReason: tx.gatewayResponse });
    }
    res.json(summary());
  } catch (err) {
    console.error('[Paystack] verify failed:', err.response?.data?.message || err.message);
    res.json(summary()); // still pending — the page keeps checking
  }
});

/**
 * GET /api/payments/bookings/mine — current user's bookings
 */
router.get('/bookings/mine', authMiddleware, (req, res) => {
  const mine = db.getBookingsByUser(req.user.id).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(mine);
});

/**
 * GET /api/payments — admin: all payments
 */
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(db.getAllPayments());
});

/**
 * GET /api/payments/bookings — admin: all bookings, supports ?page=&limit=
 */
router.get('/bookings', authMiddleware, requireRole('admin'), (req, res) => {
  let list = db.getBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const { page, limit } = req.query;
  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const total = list.length;
    list = list.slice((pageNum - 1) * pageSize, pageNum * pageSize);
    return res.json({ data: list, total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) });
  }
  res.json(list);
});

module.exports = { router, fulfilPayment, priceCart };
