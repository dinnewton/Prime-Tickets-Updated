const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware } = require('../middleware/auth');
const { stkPush } = require('../services/mpesa');

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

  // Cap resale price at 150 % of original to prevent price gouging
  const maxPrice = Math.ceil(booking.unitPrice * 1.5);
  if (askingPrice > maxPrice) {
    return res.status(400).json({ message: `Asking price cannot exceed R${maxPrice} (150% of original price)` });
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
 * Authenticated: initiate M-Pesa purchase of a resale listing
 * Body: { phone }
 */
router.post('/:id/buy', authMiddleware, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'phone is required' });

  const listing = db.getListingById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.status !== 'active') return res.status(400).json({ message: 'This ticket is no longer available' });
  if (listing.sellerId === req.user.id) return res.status(400).json({ message: 'You cannot buy your own listing' });

  const orderRef = `PTR${Date.now().toString().slice(-7)}`;

  try {
    const mpesaRes = await stkPush(phone, listing.askingPrice, orderRef, 'PrimeTickets Resale');

    if (mpesaRes.ResponseCode !== '0') {
      return res.status(502).json({ message: mpesaRes.ResponseDescription || 'M-Pesa request failed' });
    }

    // Save payment with resale metadata so the callback can handle it
    db.savePayment(mpesaRes.CheckoutRequestID, {
      checkoutRequestId: mpesaRes.CheckoutRequestID,
      merchantRequestId: mpesaRes.MerchantRequestID,
      orderRef,
      phone,
      amount: listing.askingPrice,
      type: 'resale',
      listingId: listing.id,
      buyerId: req.user.id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      cart: [{
        eventId: listing.eventId,
        eventTitle: listing.eventTitle,
        eventDate: listing.eventDate,
        eventTime: listing.eventTime,
        venue: listing.venue,
        image: listing.image,
        ticketType: listing.ticketType,
        quantity: listing.quantity,
        price: listing.askingPrice,
      }],
      customerName: req.user.name,
      customerEmail: req.user.email,
      status: 'pending',
      mpesaCode: null,
    });

    // Reserve listing so another buyer can't start a purchase simultaneously
    db.updateListing(listing.id, { pendingCheckoutRequestId: mpesaRes.CheckoutRequestID });

    res.json({
      checkoutRequestId: mpesaRes.CheckoutRequestID,
      orderRef,
      message: 'STK push sent. Awaiting payment confirmation.',
    });
  } catch (err) {
    console.error('Resale STK Push error:', err?.response?.data || err.message);
    res.status(502).json({ message: err?.response?.data?.errorMessage || 'Could not initiate payment' });
  }
});

module.exports = router;
