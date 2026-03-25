require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const DIST = path.join(__dirname, '../dist');

// ─── Middleware ────────────────────────────────────────────────────────────────
if (!isProd) {
  // Dev: allow Vite dev server origin
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api')) return next(); // skip static asset logs
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/vendors',  require('./routes/vendors'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin',    require('./routes/admin'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.MPESA_ENV });
});

// ─── Serve React (production) ─────────────────────────────────────────────────
if (isProd) {
  app.use(express.static(DIST));
  // SPA fallback — send index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  PrimeTickets API — Running on :${PORT}     ║
║  M-Pesa Env : ${(process.env.MPESA_ENV || 'sandbox').padEnd(27)}║
╚═══════════════════════════════════════════╝
  `);
});
