const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/events — public, supports ?category=&city=&search=
router.get('/', (req, res) => {
  let list = db.getEvents();
  const { category, city, search, featured } = req.query;

  if (category && category !== 'All') list = list.filter((e) => e.category === category);
  if (city) list = list.filter((e) => e.city.toLowerCase() === city.toLowerCase());
  if (featured === 'true') list = list.filter((e) => e.featured);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// GET /api/events/:id — public
router.get('/:id', (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// POST /api/events — vendor or admin
router.post('/', authMiddleware, requireRole('vendor', 'admin'), (req, res) => {
  const { title, category, date, time, endTime, venue, city, price, vipPrice, description, totalTickets, image, tags } = req.body;

  if (!title || !date || !venue || !price || !totalTickets) {
    return res.status(400).json({ message: 'Missing required event fields' });
  }

  const vendorId = req.user.role === 'vendor' ? req.user.id : req.body.vendorId;
  const vendor = db.getVendorById(vendorId);
  const vendorName = vendor ? vendor.name : 'PrimeTickets Admin';

  const event = db.createEvent({
    title, category, vendorId, vendorName, date, time, endTime,
    venue, city, price: Number(price), vipPrice: Number(vipPrice) || Number(price) * 2,
    description, totalTickets: Number(totalTickets), image, tags: tags || [],
  });

  // Update vendor event count
  if (vendor) db.updateVendor(vendorId, { totalEvents: vendor.totalEvents + 1 });

  res.status(201).json(event);
});

// PUT /api/events/:id — vendor (own events) or admin
router.put('/:id', authMiddleware, requireRole('vendor', 'admin'), (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  // Vendor can only edit own events
  if (req.user.role === 'vendor' && event.vendorId !== req.user.id) {
    return res.status(403).json({ message: 'Not your event' });
  }

  const updated = db.updateEvent(req.params.id, req.body);
  res.json(updated);
});

// DELETE /api/events/:id — vendor (own) or admin
router.delete('/:id', authMiddleware, requireRole('vendor', 'admin'), (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (req.user.role === 'vendor' && event.vendorId !== req.user.id) {
    return res.status(403).json({ message: 'Not your event' });
  }

  db.deleteEvent(req.params.id);
  res.json({ message: 'Event deleted' });
});

// GET /api/events/vendor/mine — vendor's own events
router.get('/vendor/mine', authMiddleware, requireRole('vendor'), (req, res) => {
  const list = db.getEventsByVendor(req.user.id);
  res.json(list);
});

module.exports = router;
