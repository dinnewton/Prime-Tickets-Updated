import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Circle, Users, Clock, CheckCheck } from 'lucide-react';
import { getAdminSocket } from '../../services/socket';
import useAuthStore from '../../store/authStore';

export default function AdminChatInbox({ onUnreadChange }) {
  const { token } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); // sessionId of open conversation
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [onlineVisitors, setOnlineVisitors] = useState(new Set());
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getAdminSocket(token);
    socketRef.current = socket;

    // Load existing conversations from API on mount
    fetch('/api/chat/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {});

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
      setOnlineVisitors((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
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
      // If this conversation is active, push to messages
      setActive((cur) => {
        if (cur === sid) {
          setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
        return cur;
      });
      if (onUnreadChange) onUnreadChange();
    });

    socket.on('chat:read', ({ sessionId }) => {
      setConversations((prev) =>
        prev.map((c) => c.sessionId === sessionId ? { ...c, unread: 0 } : c)
      );
    });

    return () => {
      socket.off('chat:visitor_connected');
      socket.off('chat:visitor_disconnected');
      socket.off('chat:message');
      socket.off('chat:read');
    };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (convo) => {
    setActive(convo.sessionId);
    setMessages(convo.messages || []);
    // Mark read
    socketRef.current?.emit('chat:mark_read', { targetSessionId: convo.sessionId });
    setConversations((prev) =>
      prev.map((c) => c.sessionId === convo.sessionId ? { ...c, unread: 0 } : c)
    );
  };

  const sendReply = () => {
    const text = reply.trim();
    if (!text || !active) return;
    socketRef.current?.emit('chat:admin_reply', { targetSessionId: active, text });
    setReply('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="flex h-full min-h-[600px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">Live Chat</h2>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{conversations.length} conversations · {onlineVisitors.size} online</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {conversations.length === 0 && (
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          )}
          {conversations.map((convo) => {
            const last = convo.messages?.[convo.messages.length - 1];
            const isOnline = onlineVisitors.has(convo.sessionId);
            const isActive = active === convo.sessionId;
            return (
              <button
                key={convo.sessionId}
                onClick={() => openConversation(convo)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                      {(convo.visitorName || 'V').charAt(0).toUpperCase()}
                    </div>
                    <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${convo.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {convo.visitorName}
                      </p>
                      {convo.unread > 0 && (
                        <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {convo.unread}
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
                      {new Date(convo.startedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation pane */}
      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-400">Pick a chat from the left to start replying</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            {(() => {
              const convo = conversations.find((c) => c.sessionId === active);
              const isOnline = onlineVisitors.has(active);
              return (
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                        {(convo?.visitorName || 'V').charAt(0).toUpperCase()}
                      </div>
                      <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{convo?.visitorName}</p>
                      <p className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActive(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'visitor' && (
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                      <span className="text-primary-700 text-xs font-bold">
                        {(msg.senderName || 'V').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      msg.sender === 'admin'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                      {new Date(msg.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender === 'admin' && <CheckCheck className="w-3 h-3 text-primary-400" />}
                    </span>
                  </div>
                </div>
              ))}
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
                  placeholder="Type a reply..."
                  className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent max-h-24"
                />
                <button
                  onClick={sendReply}
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
