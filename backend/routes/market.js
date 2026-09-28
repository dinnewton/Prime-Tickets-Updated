const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware } = require('../middleware/auth');
const paystack = require('../services/paystack');
const { SITE_URL } = require('../services/notifications');

/**
 * GET /api/market
 * Public: browse active resale listings
 */
router.get('/', (req, res) => {
  const listings = db.getActiveListings().map((l) => {
    const { checkoutRequestId, ...safe } = l; // strip internal payment refs
    return safe;
  });
  res.json(listings);
});

/**
 * POST /api/market/list
 * Authenticated: list a ticket for resale
 * Body: { bookingId, askingPrice }
 */
router.post('/list', authMiddleware, (req, res) => {
  const { bookingId, askingPrice } = req.body;
  const sellerId = req.user.id;

  if (!bookingId || !askingPrice || askingPrice <= 0) {
    return res.status(400).json({ message: 'bookingId and a positive askingPrice are required' });
  }

  const booking = db.getBookingById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.userId !== sellerId) return res.status(403).json({ message: 'You do not own this booking' });
  if (booking.status !== 'active') {
    return res.status(400).json({ message: `Ticket is already ${booking.status} and cannot be listed` });
  }
  if (booking.checkedIn > 0) {
    return res.status(400).json({ message: 'This ticket has already been used at the door and cannot be resold' });
  }

  // Cap resale price at 150 % of original to prevent price gouging
  const maxPrice = Math.ceil(booking.unitPrice * 1.5);
  if (askingPrice > maxPrice) {
    return res.status(400).json({ message: `Asking price cannot exceed Ksh ${maxPrice} (150% of original price)` });
  }

  const listing = db.createListing({
    bookingId,
    sellerId,
    sellerName: req.user.name,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    eventDate: booking.eventDate,
    eventTime: booking.eventTime,
    venue: booking.venue,
    image: booking.image,
    ticketType: booking.ticketType,
    quantity: booking.quantity,
    askingPrice: Number(askingPrice),
    originalPrice: booking.unitPrice,
  });

  db.updateBooking(bookingId, { status: 'listed', listingId: listing.id });

  res.status(201).json(listing);
});

/**
 * DELETE /api/market/:id
 * Authenticated: cancel your own listing
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const listing = db.getListingById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.sellerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (listing.status !== 'active') return res.status(400).json({ message: 'Listing is no longer active' });

  db.updateListing(listing.id, { status: 'cancelled' });
  db.updateBooking(listing.bookingId, { status: 'active', listingId: null });

  res.json({ message: 'Listing cancelled' });
});

/**
 * POST /api/market/:id/buy
 * Authenticated: start a Paystack payment for a resale listing
 * Returns { authorizationUrl, reference } — send the buyer to that URL
 */
router.post('/:id/buy', authMiddleware, async (req, res) => {
  if (!paystack.isConfigured()) {
    return res.status(503).json({ message: 'Payments are not set up yet. Please try again later.' });
  }

  const listing = db.getListingById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.status !== 'active') return res.status(400).json({ message: 'This ticket is no longer available' });
  if (listing.sellerId === req.user.id) return res.status(400).json({ message: 'You cannot buy your own listing' });

  // Price comes from the listing in the database, never from the browser
  const amount = listing.askingPrice;
  const reference = `PTR${Date.now().toString().slice(-7)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  db.savePayment(reference, {
    reference,
    orderRef: reference,
    provider: 'paystack',
    type: 'resale',
    listingId: listing.id,
    userId: req.user.id,
    phone: req.body?.phone,
    amount,
    cart: [{
      eventId: listing.eventId,
      eventTitle: listing.eventTitle,
      eventDate: listing.eventDate,
      eventTime: listing.eventTime,
      venue: listing.venue,
      image: listing.image,
      ticketType: listing.ticketType,
      quantity: listing.quantity,
      price: amount,
    }],
    customerName: req.user.name,
    customerEmail: req.user.email,
    status: 'pending',
    paymentRef: null,
  });

  try {
    const tx = await paystack.initializeTransaction({
      email: req.user.email,
      amount,
      reference,
      callbackUrl: `${SITE_URL}/payment/complete`,
      metadata: { orderRef: reference, resaleListingId: listing.id, customerName: req.user.name },
    });
    res.json({ authorizationUrl: tx.authorization_url, reference, amount });
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error('[Paystack] resale init failed:', detail);
    db.updatePayment(reference, { status: 'failed', failureReason: detail });
    res.status(502).json({ message: 'Could not start the payment. Please try again.' });
  }
});

module.exports = router;
