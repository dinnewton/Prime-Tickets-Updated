import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronDown, Headphones } from 'lucide-react';
import { getVendorSocket } from '../../services/socket';
import useAuthStore from '../../store/authStore';

export default function VendorChatWidget() {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !token) return;

    const socket = getVendorSocket(token, user.id, user.name);
    socketRef.current = socket;

    socket.on('chat:vendor_history', (history) => {
      setMessages(history || []);
    });

    socket.on('chat:vendor_message', (msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      if (msg.sender === 'admin' && !open) setUnread((n) => n + 1);
    });

    return () => {
      socket.off('chat:vendor_history');
      socket.off('chat:vendor_message');
    };
  }, [user?.id, token]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    socketRef.current?.emit('chat:vendor_message', { text: t });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-primary-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">PrimeTickets Support</p>
                <p className="text-white/70 text-xs">We typically reply in minutes</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Headphones className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Chat with the admin team</p>
                <p className="text-xs text-gray-300 mt-1">Ask about payouts, events, or platform support</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === 'admin'
                    ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    : 'bg-primary-600 text-white rounded-br-sm'
                }`}>
                  {msg.text}
                  <p className={`text-xs mt-0.5 ${msg.sender === 'admin' ? 'text-gray-400' : 'text-white/60'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Type a message..."
              className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent max-h-24"
            />
            <button
              onClick={send}
              disabled={!text.trim()}
              className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 relative"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
