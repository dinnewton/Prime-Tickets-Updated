import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Circle, Users, Clock, CheckCheck, Building2 } from 'lucide-react';
import { getAdminSocket } from '../../services/socket';
import useAuthStore from '../../store/authStore';

export default function AdminChatInbox({ onUnreadChange }) {
  const { token } = useAuthStore();
  const [tab, setTab] = useState('visitors'); // 'visitors' | 'vendors'

  // ─── Visitor state ────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineVisitors, setOnlineVisitors] = useState(new Set());

  // ─── Vendor state ─────────────────────────────────────────────────────────────
  const [vendorConvos, setVendorConvos] = useState([]);
  const [activeVendor, setActiveVendor] = useState(null);
  const [vendorMessages, setVendorMessages] = useState([]);
  const [onlineVendors, setOnlineVendors] = useState(new Set());

  const [reply, setReply] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getAdminSocket(token);
    socketRef.current = socket;

    // Load initial conversations
    fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setConversations(d); }).catch(() => {});

    fetch('/api/chat/vendor-conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setVendorConvos(d); }).catch(() => {});

    // ── Visitor events ──
    socket.on('chat:visitor_connected', ({ sessionId, visitorName, unread }) => {
      setOnlineVisitors((prev) => new Set([...prev, sessionId]));
      setConversations((prev) => {
        const exists = prev.find((c) => c.sessionId === sessionId);
        if (exists) return prev.map((c) => c.sessionId === sessionId ? { ...c, unread } : c);
        return [{ sessionId, visitorName, messages: [], unread, status: 'open', startedAt: new Date().toISOString() }, ...prev];
      });
      if (onUnreadChange) onUnreadChange();
    });

    socket.on('chat:visitor_disconnected', ({ sessionId }) => {
      setOnlineVisitors((prev) => { const n = new Set(prev); n.delete(sessionId); return n; });
    });

    socket.on('chat:message', (msg) => {
      const sid = msg.sessionId;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.sessionId !== sid) return c;
          const msgs = [...(c.messages || [])];
          if (!msgs.find((m) => m.id === msg.id)) msgs.push(msg);
          return { ...c, messages: msgs, unread: msg.sender === 'visitor' ? (c.unread || 0) + 1 : c.unread };
        })
      );
      setActive((cur) => {
        if (cur === sid) setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        return cur;
      });
      if (onUnreadChange) onUnreadChange();
    });

    socket.on('chat:read', ({ sessionId }) => {
      setConversations((prev) => prev.map((c) => c.sessionId === sessionId ? { ...c, unread: 0 } : c));
    });

    // ── Vendor events ──
    socket.on('chat:vendor_connected', ({ vendorId, vendorName, unread }) => {
      setOnlineVendors((prev) => new Set([...prev, vendorId]));
      setVendorConvos((prev) => {
        const exists = prev.find((c) => c.vendorId === vendorId);
        if (exists) return prev.map((c) => c.vendorId === vendorId ? { ...c, unread } : c);
        return [{ vendorId, vendorName, messages: [], unread, status: 'open', startedAt: new Date().toISOString() }, ...prev];
      });
      if (onUnreadChange) onUnreadChange();
    });

    socket.on('chat:vendor_disconnected', ({ vendorId }) => {
      setOnlineVendors((prev) => { const n = new Set(prev); n.delete(vendorId); return n; });
    });

    socket.on('chat:vendor_message', (msg) => {
      const vid = msg.vendorId;
      setVendorConvos((prev) =>
        prev.map((c) => {
          if (c.vendorId !== vid) return c;
          const msgs = [...(c.messages || [])];
          if (!msgs.find((m) => m.id === msg.id)) msgs.push(msg);
          return { ...c, messages: msgs, unread: msg.sender === 'vendor' ? (c.unread || 0) + 1 : c.unread };
        })
      );
      setActiveVendor((cur) => {
        if (cur === vid) setVendorMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        return cur;
      });
      if (onUnreadChange) onUnreadChange();
    });

    socket.on('chat:vendor_read', ({ vendorId }) => {
      setVendorConvos((prev) => prev.map((c) => c.vendorId === vendorId ? { ...c, unread: 0 } : c));
    });

    return () => {
      ['chat:visitor_connected','chat:visitor_disconnected','chat:message','chat:read',
       'chat:vendor_connected','chat:vendor_disconnected','chat:vendor_message','chat:vendor_read',
      ].forEach((e) => socket.off(e));
    };
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, vendorMessages]);

  // ─── Visitor actions ──────────────────────────────────────────────────────────
  const openConversation = (convo) => {
    setActive(convo.sessionId);
    setActiveVendor(null);
    setMessages(convo.messages || []);
    setReply('');
    socketRef.current?.emit('chat:mark_read', { targetSessionId: convo.sessionId });
    setConversations((prev) => prev.map((c) => c.sessionId === convo.sessionId ? { ...c, unread: 0 } : c));
  };

  const sendVisitorReply = () => {
    const t = reply.trim();
    if (!t || !active) return;
    socketRef.current?.emit('chat:admin_reply', { targetSessionId: active, text: t });
    setReply('');
  };

  // ─── Vendor actions ───────────────────────────────────────────────────────────
  const openVendorConversation = (convo) => {
    setActiveVendor(convo.vendorId);
    setActive(null);
    setVendorMessages(convo.messages || []);
    setReply('');
    socketRef.current?.emit('chat:mark_vendor_read', { targetVendorId: convo.vendorId });
    setVendorConvos((prev) => prev.map((c) => c.vendorId === convo.vendorId ? { ...c, unread: 0 } : c));
  };

  const sendVendorReply = () => {
    const t = reply.trim();
    if (!t || !activeVendor) return;
    socketRef.current?.emit('chat:admin_vendor_reply', { targetVendorId: activeVendor, text: t });
    setReply('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      tab === 'vendors' ? sendVendorReply() : sendVisitorReply();
    }
  };

  const visitorUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);
  const vendorUnread  = vendorConvos.reduce((s, c) => s + (c.unread || 0), 0);
  const isActiveConvo = tab === 'visitors' ? active : activeVendor;
  const currentMessages = tab === 'visitors' ? messages : vendorMessages;

  const activeConvoData = tab === 'visitors'
    ? conversations.find((c) => c.sessionId === active)
    : vendorConvos.find((c) => c.vendorId === activeVendor);

  const isOnline = tab === 'visitors'
    ? onlineVisitors.has(active)
    : onlineVendors.has(activeVendor);

  const activeName = tab === 'visitors'
    ? activeConvoData?.visitorName
    : activeConvoData?.vendorName;

  return (
    <div className="flex h-full min-h-[600px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-lg">Live Chat</h2>
            {(visitorUnread + vendorUnread) > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {visitorUnread + vendorUnread}
              </span>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('visitors')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'visitors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Visitors
              {visitorUnread > 0 && <span className="bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{visitorUnread}</span>}
            </button>
            <button
              onClick={() => setTab('vendors')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'vendors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Vendors
              {vendorUnread > 0 && <span className="bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{vendorUnread}</span>}
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {tab === 'visitors' && (
            <>
              {conversations.length === 0 && (
                <div className="p-6 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No visitor chats yet</p>
                </div>
              )}
              {conversations.map((convo) => {
                const last = convo.messages?.[convo.messages.length - 1];
                const isOnline = onlineVisitors.has(convo.sessionId);
                const isActive = active === convo.sessionId;
                return (
                  <ConvoRow
                    key={convo.sessionId}
                    name={convo.visitorName}
                    last={last}
                    isOnline={isOnline}
                    isActive={isActive}
                    unread={convo.unread}
                    startedAt={convo.startedAt}
                    onClick={() => openConversation(convo)}
                  />
                );
              })}
            </>
          )}

          {tab === 'vendors' && (
            <>
              {vendorConvos.length === 0 && (
                <div className="p-6 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No vendor chats yet</p>
                  <p className="text-xs text-gray-300 mt-1">Vendors can open a chat from their dashboard</p>
                </div>
              )}
              {vendorConvos.map((convo) => {
                const last = convo.messages?.[convo.messages.length - 1];
                const isOnline = onlineVendors.has(convo.vendorId);
                const isActive = activeVendor === convo.vendorId;
                return (
                  <ConvoRow
                    key={convo.vendorId}
                    name={convo.vendorName}
                    last={last}
                    isOnline={isOnline}
                    isActive={isActive}
                    unread={convo.unread}
                    startedAt={convo.startedAt}
                    onClick={() => openVendorConversation(convo)}
                    isVendor
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Conversation pane */}
      <div className="flex-1 flex flex-col">
        {!isActiveConvo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-400">Pick a chat from the left to start replying</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${tab === 'vendors' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                    {(activeName || '?').charAt(0).toUpperCase()}
                  </div>
                  <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activeName}</p>
                  <p className="text-xs text-gray-400">
                    {tab === 'vendors' ? 'Vendor · ' : ''}{isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setActive(null); setActiveVendor(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {currentMessages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {!isAdmin && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1 text-xs font-bold ${tab === 'vendors' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                        {(msg.senderName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[70%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isAdmin ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                        {new Date(msg.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        {isAdmin && <CheckCheck className="w-3 h-3 text-primary-400" />}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  placeholder={`Reply to ${activeName}...`}
                  className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent max-h-24"
                />
                <button
                  onClick={tab === 'vendors' ? sendVendorReply : sendVisitorReply}
                  disabled={!reply.trim()}
                  className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConvoRow({ name, last, isOnline, isActive, unread, startedAt, onClick, isVendor }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-primary-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isVendor ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
            {(name || '?').charAt(0).toUpperCase()}
          </div>
          <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{name}</p>
            {unread > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {unread}
              </span>
            )}
          </div>
          {last && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {last.sender === 'admin' ? 'You: ' : ''}{last.text}
            </p>
          )}
          <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(startedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </button>
  );
}
