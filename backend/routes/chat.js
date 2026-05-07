const router = require('express').Router();
const chat = require('../services/chat');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/chat/conversations — admin: all conversations
router.get('/conversations', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(chat.getAllConversations());
});

// GET /api/chat/conversations/:sessionId — admin: single conversation
router.get('/conversations/:sessionId', authMiddleware, requireRole('admin'), (req, res) => {
  const convo = chat.getConversation(req.params.sessionId);
  if (!convo) return res.status(404).json({ message: 'Conversation not found' });
  chat.markRead(req.params.sessionId);
  res.json(convo);
});

// PATCH /api/chat/conversations/:sessionId/close — admin
router.patch('/conversations/:sessionId/close', authMiddleware, requireRole('admin'), (req, res) => {
  chat.closeConversation(req.params.sessionId);
  res.json({ message: 'Conversation closed' });
});

// GET /api/chat/unread — admin: visitor + vendor unread count
router.get('/unread', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ unread: chat.totalUnread() + chat.totalVendorUnread() });
});

// GET /api/chat/vendor-conversations — admin: all vendor conversations
router.get('/vendor-conversations', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(chat.getAllVendorConversations());
});

// GET /api/chat/vendor-conversations/:vendorId — admin: single vendor conversation
router.get('/vendor-conversations/:vendorId', authMiddleware, requireRole('admin'), (req, res) => {
  const convo = chat.getVendorConversation(req.params.vendorId);
  if (!convo) return res.status(404).json({ message: 'Conversation not found' });
  chat.markVendorRead(req.params.vendorId);
  res.json(convo);
});

module.exports = router;
