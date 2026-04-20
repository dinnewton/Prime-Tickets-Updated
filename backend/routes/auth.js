const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/store');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/login  — client or admin
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = db.getUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.status === 'suspended') {
    return res.status(403).json({ message: 'Account suspended. Contact support.' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.json({ token, user: safeUser(user) });
});

// POST /api/auth/vendor/login
router.post('/vendor/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const vendor = db.getVendorByEmail(email);
  if (!vendor) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, vendor.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  if (vendor.status === 'suspended') {
    return res.status(403).json({ message: 'Account suspended. Contact admin.' });
  }

  const token = signToken({ id: vendor.id, email: vendor.email, role: 'vendor', name: vendor.name });
  res.json({ token, vendor: safeUser(vendor) });
});

// POST /api/auth/register — new client account
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

  if (db.getUserByEmail(email)) return res.status(409).json({ message: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const user = db.createUser({ name, email, password: hashed, role: 'client' });

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.status(201).json({ token, user: safeUser(user) });
});

// POST /api/auth/vendor/register — new vendor application
router.post('/vendor/register', async (req, res) => {
  const { name, ownerName, email, password, phone, category, description } = req.body;
  if (!name || !ownerName || !email || !password || !phone) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  if (db.getVendorByEmail(email)) return res.status(409).json({ message: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const vendor = db.createVendor({ name, ownerName, email, password: hashed, phone, category, description });

  const token = signToken({ id: vendor.id, email: vendor.email, role: 'vendor', name: vendor.name });
  res.status(201).json({ token, vendor: safeUser(vendor) });
});

// PATCH /api/auth/profile — update networking profile fields
const { authMiddleware } = require('../middleware/auth');
router.patch('/profile', authMiddleware, (req, res) => {
  const { bio, profession, interests, networkingOptIn, phone } = req.body;
  const allowed = {};
  if (bio          !== undefined) allowed.bio = String(bio).slice(0, 300);
  if (profession   !== undefined) allowed.profession = String(profession).slice(0, 80);
  if (Array.isArray(interests))   allowed.interests = interests.slice(0, 10).map(String);
  if (networkingOptIn !== undefined) allowed.networkingOptIn = Boolean(networkingOptIn);
  if (phone        !== undefined) allowed.phone = String(phone).slice(0, 20);

  const updated = db.updateUser(req.user.id, allowed);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  const { password, ...safe } = updated;
  res.json(safe);
});

// POST /api/auth/google — verify Google credential token, find-or-create user
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Google credential required' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ message: 'Google login not configured on this server' });

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    const { email, name, sub: googleId } = payload;
    if (!email) return res.status(400).json({ message: 'Google account has no email' });

    // Find existing user or create one
    let user = db.getUserByEmail(email);
    if (!user) {
      user = db.createUser({
        name,
        email,
        googleId,
        password: bcrypt.hashSync(googleId + process.env.JWT_SECRET, 10), // unusable password
        role: 'client',
      });
    } else if (!user.googleId) {
      db.updateUser(user.id, { googleId });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact support.' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const { password, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) {
    console.error('[Google Auth]', err.message);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authMiddleware, (req, res) => {
  const { id, role } = req.user;
  if (role === 'vendor') {
    const vendor = db.getVendorById(id);
    if (!vendor) return res.status(404).json({ message: 'Not found' });
    const { password, ...safe } = vendor;
    return res.json(safe);
  }
  const user = db.getUserById(id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

module.exports = router;
