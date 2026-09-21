const express = require('express');
const router = express.Router();
const db = require('../db/store');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public — footer reads on every page load
router.get('/footer', (req, res) => {
  res.json(db.getFooterSettings());
});

// Admin only — update footer
router.put('/footer', authMiddleware, requireRole('admin'), (req, res) => {
  const allowed = ['tagline', 'email', 'phone', 'address', 'copyright', 'facebook', 'twitter', 'instagram', 'youtube'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
  }
  const settings = db.updateFooterSettings(updates);
  res.json(settings);
});

module.exports = router;
