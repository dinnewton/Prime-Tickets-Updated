const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware } = require('../middleware/auth');

// ─── Attendee Directory ───────────────────────────────────────────────────────

/**
 * GET /api/network/attendees/:eventId
 * Returns opted-in attendees of an event (requires caller to also have a ticket)
 */
router.get('/attendees/:eventId', authMiddleware, (req, res) => {
  const { eventId } = req.params;
  const myId = req.user.id;

  // Caller must have a booking for this event
  const myBookings = db.getBookingsByUser(myId);
  const hasTicket = myBookings.some(
    (b) => b.eventId === eventId && b.status === 'active'
  );
  if (!hasTicket) {
    return res.status(403).json({ message: 'You need a ticket to this event to view attendees' });
  }

  // All bookings for this event
  const eventBookings = db.getBookings().filter(
    (b) => b.eventId === eventId && b.status === 'active' && b.userId !== myId
  );

  // Unique user IDs
  const userIds = [...new Set(eventBookings.map((b) => b.userId))];

  // Return only opted-in users, strip sensitive fields
  const attendees = userIds
    .map((uid) => db.getUserById(uid))
    .filter((u) => u && u.networkingOptIn)
    .map(({ id, name, bio, profession, interests, avatar }) => ({ id, name, bio, profession, interests, avatar }));

  // Annotate with connection status relative to caller
  const withStatus = attendees.map((a) => {
    const conn = db.getConnectionBetween(myId, a.id);
    return { ...a, connectionStatus: conn?.status || null, connectionId: conn?.id || null };
  });

  res.json(withStatus);
});

// ─── Connections ──────────────────────────────────────────────────────────────

/** GET /api/network/connections — accepted connections */
router.get('/connections', authMiddleware, (req, res) => {
  const myId = req.user.id;
  const conns = db.getConnectionsForUser(myId).filter((c) => c.status === 'accepted');

  const enriched = conns.map((c) => {
    const otherId = c.fromUserId === myId ? c.toUserId : c.fromUserId;
    const other = db.getUserById(otherId);
    const unread = other ? db.getThread(myId, otherId).filter((m) => m.toUserId === myId && !m.read).length : 0;
    return {
      connectionId: c.id,
      connectedAt: c.updatedAt || c.createdAt,
      eventId: c.eventId,
      unread,
      user: other
        ? { id: other.id, name: other.name, bio: other.bio, profession: other.profession, interests: other.interests, avatar: other.avatar }
        : null,
    };
  });

  res.json(enriched);
});

/** GET /api/network/requests — pending requests sent TO me */
router.get('/requests', authMiddleware, (req, res) => {
  const pending = db.getConnectionsForUser(req.user.id).filter(
    (c) => c.status === 'pending' && c.toUserId === req.user.id
  );

  const enriched = pending.map((c) => {
    const from = db.getUserById(c.fromUserId);
    return {
      connectionId: c.id,
      createdAt: c.createdAt,
      eventId: c.eventId,
      from: from
        ? { id: from.id, name: from.name, bio: from.bio, profession: from.profession, interests: from.interests }
        : null,
    };
  });

  res.json(enriched);
});

/** POST /api/network/connect — send a connection request */
router.post('/connect', authMiddleware, (req, res) => {
  const { toUserId, eventId } = req.body;
  const myId = req.user.id;

  if (!toUserId) return res.status(400).json({ message: 'toUserId is required' });
  if (toUserId === myId) return res.status(400).json({ message: 'Cannot connect with yourself' });

  const target = db.getUserById(toUserId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const existing = db.getConnectionBetween(myId, toUserId);
  if (existing) {
    return res.status(409).json({ message: `Connection already ${existing.status}`, connection: existing });
  }

  const conn = db.createConnection({
    fromUserId: myId,
    fromName: req.user.name,
    toUserId,
    toName: target.name,
    eventId: eventId || null,
  });

  // Real-time notification to recipient
  const io = req.app.get('io');
  io?.to(`user:${toUserId}`).emit('network:connection_request', {
    connectionId: conn.id,
    from: { id: myId, name: req.user.name },
  });

  res.status(201).json(conn);
});

/** PATCH /api/network/connect/:id — accept or decline */
router.patch('/connect/:id', authMiddleware, (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'
  const conn = db.getConnectionById(req.params.id);

  if (!conn) return res.status(404).json({ message: 'Connection request not found' });
  if (conn.toUserId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (conn.status !== 'pending') return res.status(400).json({ message: 'Request already handled' });

  const status = action === 'accept' ? 'accepted' : 'declined';
  const updated = db.updateConnection(conn.id, { status, updatedAt: new Date().toISOString() });

  if (action === 'accept') {
    const io = req.app.get('io');
    io?.to(`user:${conn.fromUserId}`).emit('network:connection_accepted', {
      connectionId: conn.id,
      by: { id: req.user.id, name: req.user.name },
    });
  }

  res.json(updated);
});

// ─── Direct Messages ──────────────────────────────────────────────────────────

/** GET /api/network/messages/:userId — full thread */
router.get('/messages/:userId', authMiddleware, (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.userId;

  // Must be connected
  const conn = db.getConnectionBetween(myId, otherId);
  if (!conn || conn.status !== 'accepted') {
    return res.status(403).json({ message: 'You are not connected with this user' });
  }

  db.markThreadRead(myId, otherId);
  res.json(db.getThread(myId, otherId));
});

/** POST /api/network/messages — send a message */
router.post('/messages', authMiddleware, (req, res) => {
  const { toUserId, text } = req.body;
  const myId = req.user.id;

  if (!toUserId || !text?.trim()) {
    return res.status(400).json({ message: 'toUserId and text are required' });
  }

  const conn = db.getConnectionBetween(myId, toUserId);
  if (!conn || conn.status !== 'accepted') {
    return res.status(403).json({ message: 'You can only message your connections' });
  }

  const msg = db.createMessage({ fromUserId: myId, toUserId, text: text.trim() });

  // Real-time delivery
  const io = req.app.get('io');
  io?.to(`user:${toUserId}`).emit('network:dm', msg);
  io?.to(`user:${myId}`).emit('network:dm', msg); // echo to sender's other tabs

  res.status(201).json(msg);
});

/** GET /api/network/unread — total unread DM count */
router.get('/unread', authMiddleware, (req, res) => {
  res.json({ unread: db.getUnreadCount(req.user.id) });
});

module.exports = router;
