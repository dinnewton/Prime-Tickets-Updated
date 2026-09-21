/**
 * Door check-in: look up a ticket by the code in its QR and admit people.
 * Allowed for admins (any event) and the vendor who owns the event.
 */
const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware, requireRole('admin', 'vendor'));

const INVALID = {
  transferred: 'This ticket was transferred to someone else — this QR code is no longer valid.',
  sold:        'This ticket was resold — this QR code is no longer valid.',
  listed:      'This ticket is listed for resale. The owner must cancel the listing before entry.',
  cancelled:   'This ticket was cancelled.',
};

// Resolves the ticket and checks the caller may manage its event
function findTicket(req, res) {
  const input = String(req.params.code || '').trim();
  let booking = db.getBookingByTicketCode(input);
  let byOrderRef = false;

  // Guests without an account have no QR, only their order reference (PT…).
  // Staff can type it in; they must then check the name against an ID.
  if (!booking && /^PT\d{6,}$/i.test(input)) {
    const mine = db.getBookings().filter((b) =>
      b.orderRef?.toUpperCase() === input.toUpperCase() &&
      (req.user.role === 'admin' || db.getEventById(b.eventId)?.vendorId === req.user.id));
    booking = mine.find((b) => b.status === 'active' && (b.checkedIn || 0) < b.quantity) || mine[0];
    byOrderRef = !!booking;
  }

  if (!booking) {
    res.status(404).json({ message: 'No ticket found for this code. It may be fake or mistyped.' });
    return null;
  }
  const event = db.getEventById(booking.eventId);
  if (req.user.role === 'vendor' && event?.vendorId !== req.user.id) {
    res.status(403).json({ message: 'This ticket is for an event you do not manage.' });
    return null;
  }
  return { booking, event, byOrderRef };
}

function summary(booking, event, byOrderRef = false) {
  const remaining = Math.max(0, booking.quantity - (booking.checkedIn || 0));
  const reason =
    booking.status !== 'active' ? (INVALID[booking.status] || `This ticket is ${booking.status}.`)
    : remaining === 0 ? 'All tickets on this booking have already been checked in.'
    : null;
  return {
    valid: !reason,
    reason,
    eventTitle: event?.title || booking.eventTitle,
    eventDate: event?.date || booking.eventDate,
    eventTime: event?.time || booking.eventTime,
    venue: event?.venue || booking.venue,
    ticketType: booking.ticketType,
    quantity: booking.quantity,
    checkedIn: booking.checkedIn || 0,
    remaining,
    customerName: booking.customerName,
    orderRef: booking.orderRef,
    status: booking.status,
    checkIns: booking.checkIns || [],
    byOrderRef,
  };
}

// GET /api/checkin/:code — inspect a ticket without admitting anyone
router.get('/:code', (req, res) => {
  const found = findTicket(req, res);
  if (found) res.json(summary(found.booking, found.event, found.byOrderRef));
});

// POST /api/checkin/:code  { count } — admit `count` people (default: all remaining)
router.post('/:code', (req, res) => {
  const found = findTicket(req, res);
  if (!found) return;
  const { booking, event, byOrderRef } = found;

  const before = summary(booking, event, byOrderRef);
  if (!before.valid) return res.status(409).json(before);

  const count = req.body?.count === undefined ? before.remaining : Number(req.body.count);
  if (!Number.isInteger(count) || count < 1 || count > before.remaining) {
    return res.status(400).json({ ...before, message: `Can admit between 1 and ${before.remaining}.` });
  }

  // Single-threaded Node + synchronous store: no two scans can both pass the check above
  const updated = db.updateBooking(booking.id, {
    checkedIn: before.checkedIn + count,
    checkIns: [...before.checkIns, { at: new Date().toISOString(), count, by: req.user.name || req.user.email }],
  });
  res.json({ ...summary(updated, event, byOrderRef), admitted: count });
});

module.exports = router;
