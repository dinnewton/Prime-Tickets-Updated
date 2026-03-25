/**
 * In-memory chat store.
 * Each conversation is keyed by sessionId (visitor) or userId (logged-in).
 */
const { v4: uuidv4 } = require('uuid');

// conversations[sessionId] = { id, sessionId, visitorName, startedAt, messages[], status, unread }
const conversations = {};

const chat = {
  // Get or create a conversation for a session
  getOrCreate(sessionId, visitorName) {
    if (!conversations[sessionId]) {
      conversations[sessionId] = {
        id: sessionId,
        sessionId,
        visitorName: visitorName || 'Visitor',
        startedAt: new Date().toISOString(),
        messages: [],
        status: 'open',   // open | closed
        unread: 0,        // unread by admin
      };
    }
    return conversations[sessionId];
  },

  addMessage(sessionId, { sender, senderName, text }) {
    const convo = conversations[sessionId];
    if (!convo) return null;
    const msg = {
      id: uuidv4(),
      sender,       // 'visitor' | 'admin'
      senderName,
      text,
      timestamp: new Date().toISOString(),
    };
    convo.messages.push(msg);
    if (sender === 'visitor') convo.unread += 1;
    return msg;
  },

  getConversation(sessionId) {
    return conversations[sessionId] || null;
  },

  getAllConversations() {
    return Object.values(conversations).sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
    );
  },

  markRead(sessionId) {
    if (conversations[sessionId]) conversations[sessionId].unread = 0;
  },

  closeConversation(sessionId) {
    if (conversations[sessionId]) conversations[sessionId].status = 'closed';
  },

  totalUnread() {
    return Object.values(conversations).reduce((s, c) => s + c.unread, 0);
  },
};

module.exports = chat;
