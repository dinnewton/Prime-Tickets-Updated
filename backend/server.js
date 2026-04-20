require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const chat = require('./services/chat');

const app = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';
const DIST = path.join(__dirname, '../dist');

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const { sessionId, visitorName, role, userId } = socket.handshake.auth;

  // Each authenticated user joins their personal room for DMs + notifications
  if (userId) socket.join(`user:${userId}`);

  if (role === 'admin') {
    socket.join('admin-room');
    console.log(`[Chat] Admin connected`);
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

  // Visitor sends a message
  socket.on('chat:visitor_message', ({ text }) => {
    if (!sessionId || !text?.trim()) return;
    const convo = chat.getOrCreate(sessionId, visitorName);
    const msg = chat.addMessage(sessionId, { sender: 'visitor', senderName: visitorName, text: text.trim() });
    // Echo back to visitor
    io.to(sessionId).emit('chat:message', msg);
    // Forward to admin room with conversation context
    io.to('admin-room').emit('chat:message', { ...msg, sessionId, visitorName, unread: convo.unread });
  });

  // Admin sends a reply
  socket.on('chat:admin_reply', ({ targetSessionId, text }) => {
    if (!targetSessionId || !text?.trim()) return;
    const msg = chat.addMessage(targetSessionId, { sender: 'admin', senderName: 'Support', text: text.trim() });
    if (!msg) return;
    chat.markRead(targetSessionId);
    // Send to visitor
    io.to(targetSessionId).emit('chat:message', msg);
    // Echo to all admin tabs
    io.to('admin-room').emit('chat:message', { ...msg, sessionId: targetSessionId });
  });

  // Admin marks conversation as read
  socket.on('chat:mark_read', ({ targetSessionId }) => {
    chat.markRead(targetSessionId);
    io.to('admin-room').emit('chat:read', { sessionId: targetSessionId });
  });

  socket.on('disconnect', () => {
    if (role !== 'admin') {
      io.to('admin-room').emit('chat:visitor_disconnected', { sessionId });
    }
  });
});

// Expose io to routes
app.set('io', io);

// ─── Middleware ────────────────────────────────────────────────────────────────
if (!isProd) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/uploads',   require('./routes/uploads'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/network',   require('./routes/network'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.MPESA_ENV });
});

// ─── Serve React (production) ─────────────────────────────────────────────────
if (isProd) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
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
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  PrimeTickets API — Running on :${PORT}     ║
║  Socket.io  : enabled (live chat)         ║
║  M-Pesa Env : ${(process.env.MPESA_ENV || 'sandbox').padEnd(27)}║
╚═══════════════════════════════════════════╝
  `);
});
