/**
 * In-memory chat store.
 * Visitor conversations keyed by sessionId.
 * Vendor conversations keyed by vendorId.
 */
const { v4: uuidv4 } = require('uuid');

const conversations = {};      // visitor chats
const vendorConversations = {}; // vendor chats

const chat = {
  // ─── Visitor conversations ───────────────────────────────────────────────────
  getOrCreate(sessionId, visitorName) {
    if (!conversations[sessionId]) {
      conversations[sessionId] = {
        id: sessionId,
        sessionId,
        visitorName: visitorName || 'Visitor',
        startedAt: new Date().toISOString(),
        messages: [],
        status: 'open',
        unread: 0,
      };
    }
    return conversations[sessionId];
  },

  addMessage(sessionId, { sender, senderName, text }) {
    const convo = conversations[sessionId];
    if (!convo) return null;
    const msg = { id: uuidv4(), sender, senderName, text, timestamp: new Date().toISOString() };
    convo.messages.push(msg);
    if (sender === 'visitor') convo.unread += 1;
    return msg;
  },

  getConversation(sessionId)  { return conversations[sessionId] || null; },

  /** Drop a visitor chat that never had a message. */
  forgetIfEmpty(sessionId) {
    const convo = conversations[sessionId];
    if (convo && convo.messages.length === 0) delete conversations[sessionId];
  },

  /** Drop visitor chats with no activity for maxAgeDays. Returns how many were removed. */
  pruneOld(maxAgeDays = 14) {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let removed = 0;
    for (const [id, convo] of Object.entries(conversations)) {
      const last = convo.messages.length ? convo.messages[convo.messages.length - 1].timestamp : convo.startedAt;
      if (new Date(last).getTime() < cutoff) { delete conversations[id]; removed++; }
    }
    return removed;
  },
  getAllConversations()        { return Object.values(conversations).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)); },
  markRead(sessionId)         { if (conversations[sessionId]) conversations[sessionId].unread = 0; },
  closeConversation(sessionId){ if (conversations[sessionId]) conversations[sessionId].status = 'closed'; },
  totalUnread()               { return Object.values(conversations).reduce((s, c) => s + c.unread, 0); },

  // ─── Vendor conversations ────────────────────────────────────────────────────
  getOrCreateVendor(vendorId, vendorName) {
    if (!vendorConversations[vendorId]) {
      vendorConversations[vendorId] = {
        id: vendorId,
        vendorId,
        vendorName: vendorName || 'Vendor',
        startedAt: new Date().toISOString(),
        messages: [],
        status: 'open',
        unread: 0,
      };
    }
    return vendorConversations[vendorId];
  },

  addVendorMessage(vendorId, { sender, senderName, text }) {
    const convo = vendorConversations[vendorId];
    if (!convo) return null;
    const msg = { id: uuidv4(), sender, senderName, text, timestamp: new Date().toISOString() };
    convo.messages.push(msg);
    if (sender === 'vendor') convo.unread += 1;
    return msg;
  },

  getVendorConversation(vendorId)  { return vendorConversations[vendorId] || null; },
  getAllVendorConversations()       { return Object.values(vendorConversations).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)); },
  markVendorRead(vendorId)         { if (vendorConversations[vendorId]) vendorConversations[vendorId].unread = 0; },
  totalVendorUnread()              { return Object.values(vendorConversations).reduce((s, c) => s + c.unread, 0); },
};

// Old conversations are cleared hourly so memory does not grow without limit
setInterval(() => chat.pruneOld(), 60 * 60 * 1000).unref();

module.exports = chat;
