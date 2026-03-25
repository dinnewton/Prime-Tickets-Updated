import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Loader2, CheckCheck } from 'lucide-react';
import { getVisitorSocket, getSessionId } from '../../services/socket';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [minimised, setMinimised] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getVisitorSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (history) => {
      setMessages(history);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        // avoid duplicate messages
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender === 'admin' && !open) {
        setUnread((n) => n + 1);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat:history');
      socket.off('chat:message');
    };
  }, [open]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
    setUnread(0);
    socketRef.current?.emit('chat:mark_read', { targetSessionId: getSessionId() });
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('chat:visitor_message', { text });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && !minimised && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-gray-200 bg-white"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-primary-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-primary-600 ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">PrimeTickets Support</p>
                <p className="text-white/70 text-xs">{connected ? 'Online — typically replies instantly' : 'Connecting...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimised(true)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Hi there! 👋</p>
                <p className="text-xs text-gray-500 mt-1">How can we help you today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'admin' && (
                  <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.sender === 'visitor' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    msg.sender === 'visitor'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                    {new Date(msg.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'visitor' && <CheckCheck className="w-3 h-3" />}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            {!connected && (
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting to support...
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={!connected}
                rows={1}
                placeholder="Type a message..."
                className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 max-h-24"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !connected}
                className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg shadow-primary-600/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open support chat"
      >
        {open && !minimised ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
