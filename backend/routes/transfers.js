const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware } = require('../middleware/auth');
const { sendTicketConfirmation } = require('../services/notifications');

/**
 * POST /api/transfers
 * Transfer a ticket to another registered user by email
 * Body: { bookingId, recipientEmail }
 */
router.post('/', authMiddleware, (req, res) => {
  const { bookingId, recipientEmail } = req.body;
  const senderId = req.user.id;

  if (!bookingId || !recipientEmail) {
    return res.status(400).json({ message: 'bookingId and recipientEmail are required' });
  }

  const booking = db.getBookingById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.userId !== senderId) return res.status(403).json({ message: 'You do not own this booking' });
  if (booking.status !== 'active') {
    return res.status(400).json({ message: `Ticket is ${booking.status} and cannot be transferred` });
  }

  // Find recipient
  const recipient = db.getUserByEmail(recipientEmail);
  if (!recipient) {
    return res.status(404).json({ message: 'No PrimeTickets account found for that email address' });
  }
  if (recipient.id === senderId) {
    return res.status(400).json({ message: 'You cannot transfer a ticket to yourself' });
  }

  // Mark original booking as transferred
  db.updateBooking(bookingId, { status: 'transferred', transferredTo: recipient.id });

  // Create new booking for recipient
  const newBooking = db.createBooking({
    userId: recipient.id,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    eventDate: booking.eventDate,
    eventTime: booking.eventTime,
    venue: booking.venue,
    image: booking.image,
    ticketType: booking.ticketType,
    quantity: booking.quantity,
    unitPrice: booking.unitPrice,
    totalPrice: booking.totalPrice,
    mpesaCode: booking.mpesaCode,
    orderRef: booking.orderRef,
    customerName: recipient.name,
    customerEmail: recipient.email,
    transferredFrom: senderId,
  });

  // Record transfer
  const transfer = db.createTransfer({
    bookingId,
    newBookingId: newBooking.id,
    fromUserId: senderId,
    fromName: req.user.name,
    toUserId: recipient.id,
    toEmail: recipientEmail,
    toName: recipient.name,
    eventTitle: booking.eventTitle,
    status: 'completed',
  });

  // Notify recipient by email (non-blocking)
  sendTicketConfirmation({
    customerEmail: recipient.email,
    customerName: recipient.name,
    phone: null,
    orderRef: newBooking.orderRef,
    mpesaCode: newBooking.mpesaCode,
    amount: newBooking.totalPrice,
    cart: [{
      eventTitle: newBooking.eventTitle,
      ticketType: newBooking.ticketType,
      quantity: newBooking.quantity,
      price: newBooking.unitPrice,
    }],
  }).catch((e) => console.error('[Transfer] Notification error:', e.message));

  res.json({
    message: `Ticket transferred to ${recipient.name} (${recipientEmail})`,
    transfer,
    newBookingId: newBooking.id,
  });
});

module.exports = router;
