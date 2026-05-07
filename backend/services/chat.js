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

module.exports = chat;
