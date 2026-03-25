const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All vendor management routes require admin
// GET /api/vendors
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const vendors = db.getVendors().map(({ password, ...v }) => v);
  res.json(vendors);
});

// GET /api/vendors/:id
router.get('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const vendor = db.getVendorById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const { password, ...safe } = vendor;
  res.json(safe);
});

// GET /api/vendors/:id/events — vendor's events (admin)
router.get('/:id/events', authMiddleware, requireRole('admin'), (req, res) => {
  const events = db.getEventsByVendor(req.params.id);
  res.json(events);
});

// PATCH /api/vendors/:id — admin update vendor details
router.patch('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const vendor = db.getVendorById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

  // Strip password from updates for safety
  const { password, ...updates } = req.body;
  const updated = db.updateVendor(req.params.id, updates);
  const { password: _, ...safe } = updated;
  res.json(safe);
});

// PATCH /api/vendors/:id/status — suspend or activate
router.patch('/:id/status', authMiddleware, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or suspended' });
  }

  const vendor = db.getVendorById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

  const updated = db.updateVendor(req.params.id, { status });
  const { password, ...safe } = updated;
  res.json(safe);
});

// PATCH /api/vendors/:id/verify — verify vendor
router.patch('/:id/verify', authMiddleware, requireRole('admin'), (req, res) => {
  const vendor = db.getVendorById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

  const updated = db.updateVendor(req.params.id, { verified: !vendor.verified });
  const { password, ...safe } = updated;
  res.json(safe);
});

// PATCH /api/vendors/:id/commission — update commission rate
router.patch('/:id/commission', authMiddleware, requireRole('admin'), (req, res) => {
  const { commission } = req.body;
  const rate = Number(commission);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    return res.status(400).json({ message: 'Commission must be 0–100' });
  }

  const vendor = db.getVendorById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

  const updated = db.updateVendor(req.params.id, { commission: rate });
  const { password, ...safe } = updated;
  res.json(safe);
});

// DELETE /api/vendors/:id
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const deleted = db.deleteVendor(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Vendor not found' });
  res.json({ message: 'Vendor deleted' });
});

// GET /api/vendors/me/profile — vendor views own profile
router.get('/me/profile', authMiddleware, requireRole('vendor'), (req, res) => {
  const vendor = db.getVendorById(req.user.id);
  if (!vendor) return res.status(404).json({ message: 'Not found' });
  const { password, ...safe } = vendor;
  res.json(safe);
});

module.exports = router;
