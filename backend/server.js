require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const chat = require('./services/chat');

const app = express();
// Behind nginx on the same host: take the client IP nginx passes on, so rate
// limits apply per visitor instead of to everyone at once.
app.set('trust proxy', 'loopback');
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';
const DIST = path.join(__dirname, '../dist');

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'https://primeticketsoko.com', 'https://www.primeticketsoko.com'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const auth = socket.handshake.auth || {};

  // Identity comes only from a verified login token — never from fields the
  // client claims. A requested admin/vendor role is granted only if the
  // token proves it; everyone else is a visitor.
  let account = null;
  try { if (auth.token) account = jwt.verify(auth.token, process.env.JWT_SECRET); } catch {}
  const role =
    auth.role === 'admin' && account?.role === 'admin' ? 'admin'
    : auth.role === 'vendor' && account?.role === 'vendor' ? 'vendor'
    : 'visitor';
  const userId = account && account.role !== 'vendor' ? account.id : null;
  const vendorId = role === 'vendor' ? account.id : null;
  const vendorName = role === 'vendor' ? account.name : null;
  const sessionId = typeof auth.sessionId === 'string' && auth.sessionId ? auth.sessionId.slice(0, 64) : socket.id;
  const visitorName = account?.name || String(auth.visitorName || 'Visitor').slice(0, 60);

  // Each authenticated user joins their personal room for DMs + notifications
  if (userId) socket.join(`user:${userId}`);

  if (role === 'admin') {
    socket.join('admin-room');
    console.log(`[Chat] Admin connected`);

  } else if (role === 'vendor' && vendorId) {
    // Vendor joins their own room
    socket.join(`vendor:${vendorId}`);
    chat.getOrCreateVendor(vendorId, vendorName);
    console.log(`[Chat] Vendor connected: ${vendorName} (${vendorId})`);

    // Send history to vendor
    const vConvo = chat.getVendorConversation(vendorId);
    socket.emit('chat:vendor_history', vConvo?.messages || []);

    // Notify admins
    io.to('admin-room').emit('chat:vendor_connected', {
      vendorId,
      vendorName,
      unread: vConvo?.unread || 0,
    });

  } else {
    // Visitor joining their own room
    socket.join(sessionId);
    chat.getOrCreate(sessionId, visitorName);
    console.log(`[Chat] Visitor connected: ${visitorName} (${sessionId})`);

    // Send history on connect
    const convo = chat.getConversation(sessionId);
    socket.emit('chat:history', convo?.messages || []);

    // Notify admin of new/returning visitor
    io.to('admin-room').emit('chat:visitor_connected', {
      sessionId,
      visitorName,
      unread: convo?.unread || 0,
    });
  }

  // ─── Visitor messages ────────────────────────────────────────────────────────
  socket.on('chat:visitor_message', ({ text }) => {
    if (!sessionId || !text?.trim()) return;
    const convo = chat.getOrCreate(sessionId, visitorName);
    const msg = chat.addMessage(sessionId, { sender: 'visitor', senderName: visitorName, text: text.trim() });
    io.to(sessionId).emit('chat:message', msg);
    io.to('admin-room').emit('chat:message', { ...msg, sessionId, visitorName, unread: convo.unread });
  });

  // ─── Admin → visitor reply ───────────────────────────────────────────────────
  socket.on('chat:admin_reply', ({ targetSessionId, text }) => {
    if (role !== 'admin' || !targetSessionId || !text?.trim()) return;
    const msg = chat.addMessage(targetSessionId, { sender: 'admin', senderName: 'Support', text: text.trim() });
    if (!msg) return;
    chat.markRead(targetSessionId);
    io.to(targetSessionId).emit('chat:message', msg);
    io.to('admin-room').emit('chat:message', { ...msg, sessionId: targetSessionId });
  });

  socket.on('chat:mark_read', ({ targetSessionId }) => {
    if (role !== 'admin') return;
    chat.markRead(targetSessionId);
    io.to('admin-room').emit('chat:read', { sessionId: targetSessionId });
  });

  // ─── Vendor messages ─────────────────────────────────────────────────────────
  socket.on('chat:vendor_message', ({ text }) => {
    if (!vendorId || !text?.trim()) return;
    const convo = chat.getOrCreateVendor(vendorId, vendorName);
    const msg = chat.addVendorMessage(vendorId, { sender: 'vendor', senderName: vendorName, text: text.trim() });
    io.to(`vendor:${vendorId}`).emit('chat:vendor_message', msg);
    io.to('admin-room').emit('chat:vendor_message', { ...msg, vendorId, vendorName, unread: convo.unread });
  });

  // ─── Admin → vendor reply ────────────────────────────────────────────────────
  socket.on('chat:admin_vendor_reply', ({ targetVendorId, text }) => {
    if (role !== 'admin' || !targetVendorId || !text?.trim()) return;
    const vConvo = chat.getVendorConversation(targetVendorId);
    if (!vConvo) return;
    const msg = chat.addVendorMessage(targetVendorId, { sender: 'admin', senderName: 'Support', text: text.trim() });
    if (!msg) return;
    chat.markVendorRead(targetVendorId);
    io.to(`vendor:${targetVendorId}`).emit('chat:vendor_message', msg);
    io.to('admin-room').emit('chat:vendor_message', { ...msg, vendorId: targetVendorId });
  });

  socket.on('chat:mark_vendor_read', ({ targetVendorId }) => {
    if (role !== 'admin') return;
    chat.markVendorRead(targetVendorId);
    io.to('admin-room').emit('chat:vendor_read', { vendorId: targetVendorId });
  });

  // ─── Disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (role === 'vendor' && vendorId) {
      io.to('admin-room').emit('chat:vendor_disconnected', { vendorId });
    } else if (role !== 'admin') {
      io.to('admin-room').emit('chat:visitor_disconnected', { sessionId });
      // Most visitors never type anything; don't keep an empty chat for each
      // of them (unless another of their tabs is still open)
      if (!io.sockets.adapter.rooms.get(sessionId)?.size) chat.forgetIfEmpty(sessionId);
    }
  });
});

// Expose io to routes
app.set('io', io);

// ─── Rate limiting ─────────────────────────────────────────────────────────────
// Door scanning is one device making many requests, so it gets its own higher limit
// Mobile networks, offices and campuses put many people behind one address,
// so limits per address are generous for plain browsing and strict only where
// abuse costs something.
const isBrowsing = (req) => req.method === 'GET' && (req.path.startsWith('/events') || req.path.startsWith('/settings') || req.path === '/market' || req.path === '/health');
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, skip: (req) => isBrowsing(req) || req.path.startsWith('/checkin') || req.path === '/payments/paystack/webhook' });
const browseLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 6000, standardHeaders: true, legacyHeaders: false, skip: (req) => !isBrowsing(req) });
const checkinLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000, standardHeaders: true, legacyHeaders: false });
// Password guessing is limited per account from each address (10 tries), with
// a wider cap per address so a crowd on one network can still all sign in
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Too many login attempts, try again in 15 minutes' },
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email || '').trim().toLowerCase().slice(0, 120)}` });
const loginAddressLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 150, message: { message: 'Too many login attempts from this network, try again in 15 minutes' } });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many password reset attempts, try again in 15 minutes' } });
const payLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { message: 'Too many payment attempts, try again in 15 minutes' }, skip: (req) => req.method === 'GET' });

// ─── Middleware ────────────────────────────────────────────────────────────────
if (!isProd) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
}
// Paystack signs the exact bytes it sends, so this route needs the raw body
app.use('/api/payments/paystack/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);
app.use('/api/', browseLimiter);
app.use(['/api/auth/login', '/api/auth/vendor/login'], loginAddressLimiter, loginLimiter);
app.use(['/api/auth/forgot-password', '/api/auth/reset-password'], resetLimiter);
app.use(['/api/payments/paystack/init', '/api/market'], payLimiter);
app.use('/api/checkin', checkinLimiter);

// Guard against malformed URIs from security scanners (prevents crash-restart loops)
app.use((req, res, next) => {
  try { decodeURIComponent(req.path); next(); } catch { res.status(400).end(); }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api')) return next();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/events',    require('./routes/events'));
app.use('/api/vendors',   require('./routes/vendors'));
app.use('/api/payments',  require('./routes/payments').router);
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/uploads',   require('./routes/uploads'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/network',   require('./routes/network'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/checkin',   require('./routes/checkin'));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    payments: require('./services/paystack').isConfigured() ? (require('./services/paystack').isLiveMode() ? 'paystack-live' : 'paystack-test') : 'not-configured',
    emailConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
});

// ─── Serve React (production) ─────────────────────────────────────────────────
const seo = require('./services/seo');
app.get('/robots.txt', seo.robotsTxt);
app.get('/sitemap.xml', seo.sitemapXml);

if (isProd) {
  app.use(express.static(DIST));
  // Event pages get their own title, picture and description in the HTML so
  // shared links preview properly on WhatsApp, Facebook and Google
  app.get('*', seo.serveApp(DIST));
} else {
  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Errors that carry their own status (e.g. 503 when sign-ins are queued up) are safe to show
  if (err.status === 503) return res.status(503).json({ message: err.message });
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const paystack = require('./services/paystack');
  const payMode = !paystack.isConfigured() ? 'not configured' : paystack.isLiveMode() ? 'Paystack LIVE' : 'Paystack test';
  console.log(`
╔═══════════════════════════════════════════╗
║  PrimeTickets API — Running on :${PORT}     ║
║  Socket.io  : enabled (live chat)         ║
║  Payments   : ${payMode.padEnd(27)}║
╚═══════════════════════════════════════════╝
  `);

  if (!paystack.isConfigured())    console.warn('[WARN] PAYSTACK_SECRET_KEY not set — checkout is disabled');
  else if (!paystack.isLiveMode()) console.warn('[WARN] Paystack is in TEST mode — no real payments');
  if (!process.env.SMTP_USER)    console.warn('[WARN] SMTP_USER not set — confirmation emails disabled');
  if (!process.env.TWILIO_ACCOUNT_SID) console.warn('[WARN] TWILIO_ACCOUNT_SID not set — SMS/WhatsApp disabled');
  if (!process.env.JWT_SECRET)   console.warn('[WARN] JWT_SECRET not set — using insecure default');
});
