import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, MessageCircle, UserCheck, UserX, Send, Settings,
  Loader2, Bell, ChevronRight, Wifi, X,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useAuthStore from '../../store/authStore';
import { networkApi } from '../../services/api';
import { getVisitorSocket } from '../../services/socket';

const INTEREST_OPTIONS = [
  'Music', 'Sports', 'Comedy', 'Tech', 'Business', 'Arts', 'Food & Drink',
  'Networking', 'Startups', 'Film', 'Fashion', 'Gaming', 'Travel',
];

export default function Network() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab]               = useState('connections'); // connections | requests | profile
  const [connections, setConnections] = useState([]);
  const [requests, setRequests]     = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { connectionId, user }
  const [thread, setThread]         = useState([]);
  const [msgText, setMsgText]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef(null);

  // Profile edit state
  const [profile, setProfile]   = useState({ bio: '', profession: '', interests: [], networkingOptIn: true, phone: '' });
  const [saving, setSaving]     = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setProfile({
      bio: user?.bio || '',
      profession: user?.profession || '',
      interests: user?.interests || [],
      networkingOptIn: user?.networkingOptIn !== false,
      phone: user?.phone || '',
    });
    loadAll();
  }, [isAuthenticated]);

  async function loadAll() {
    setLoading(true);
    try {
      const [conns, reqs] = await Promise.all([networkApi.connections(), networkApi.requests()]);
      setConnections(conns);
      setRequests(reqs);
    } catch {}
    setLoading(false);
  }

  // Socket — receive real-time DMs and connection notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getVisitorSocket();

    socket.on('network:dm', (msg) => {
      setThread((prev) => {
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      // Update unread badge on connection list
      setConnections((prev) =>
        prev.map((c) => {
          if (c.user?.id !== msg.fromUserId) return c;
          if (activeChat?.user?.id === msg.fromUserId) return c; // already open
          return { ...c, unread: (c.unread || 0) + 1 };
        })
      );
    });

    socket.on('network:connection_request', () => {
      networkApi.requests().then(setRequests).catch(() => {});
    });

    socket.on('network:connection_accepted', () => {
      networkApi.connections().then(setConnections).catch(() => {});
    });

    return () => {
      socket.off('network:dm');
      socket.off('network:connection_request');
      socket.off('network:connection_accepted');
    };
  }, [isAuthenticated, activeChat]);

  // Load thread when chat opens
  useEffect(() => {
    if (!activeChat) return;
    networkApi.thread(activeChat.user.id)
      .then(setThread)
      .catch(() => {});
    // Clear unread
    setConnections((prev) =>
      prev.map((c) => (c.user?.id === activeChat.user.id ? { ...c, unread: 0 } : c))
    );
  }, [activeChat]);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!msgText.trim() || !activeChat) return;
    setSending(true);
    try {
      await networkApi.send(activeChat.user.id, msgText.trim());
      setMsgText('');
    } catch {}
    setSending(false);
  }

  async function respond(id, action) {
    try {
      await networkApi.respond(id, action);
      setRequests((prev) => prev.filter((r) => r.connectionId !== id));
      if (action === 'accept') loadAll();
    } catch {}
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await networkApi.updateProfile(profile);
      setSavedMsg('Profile saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('Failed to save.');
    }
    setSaving(false);
  }

  function toggleInterest(i) {
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i],
    }));
  }

  const totalUnread = connections.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wifi className="w-6 h-6 text-primary-600" /> Attendee Network
              </h1>
              <p className="text-gray-500 text-sm mt-1">Connect and message people at your events</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {[
                    { key: 'connections', label: 'Connections', icon: Users, badge: totalUnread },
                    { key: 'requests',    label: 'Requests',    icon: Bell,  badge: requests.length },
                    { key: 'profile',     label: 'Profile',     icon: Settings },
                  ].map(({ key, label, icon: Icon, badge }) => (
                    <button
                      key={key}
                      onClick={() => { setTab(key); setActiveChat(null); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative ${
                        tab === key ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {badge > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>}

                {/* Connections list */}
                {!loading && tab === 'connections' && (
                  <div>
                    {connections.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No connections yet.</p>
                        <Link to="/" className="text-xs text-primary-600 underline mt-1 block">Browse events to meet people</Link>
                      </div>
                    ) : (
                      connections.map((c) => (
                        <button
                          key={c.connectionId}
                          onClick={() => setActiveChat(c)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${
                            activeChat?.connectionId === c.connectionId ? 'bg-primary-50' : ''
                          }`}
                        >
                          <Avatar name={c.user?.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{c.user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{c.user?.profession || 'Attendee'}</p>
                          </div>
                          {c.unread > 0 && (
                            <span className="w-5 h-5 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              {c.unread}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Pending requests */}
                {!loading && tab === 'requests' && (
                  <div>
                    {requests.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No pending requests</p>
                      </div>
                    ) : (
                      requests.map((r) => (
                        <div key={r.connectionId} className="p-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar name={r.from?.name} size="sm" />
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{r.from?.name}</p>
                              <p className="text-xs text-gray-400">{r.from?.profession || 'Attendee'}</p>
                            </div>
                          </div>
                          {r.from?.bio && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{r.from.bio}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => respond(r.connectionId, 'accept')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => respond(r.connectionId, 'decline')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Profile settings */}
                {tab === 'profile' && (
                  <form onSubmit={saveProfile} className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Profession / Title</label>
                      <input value={profile.profession} onChange={(e) => setProfile((p) => ({ ...p, profession: e.target.value }))} placeholder="e.g. Software Engineer" className="input-field !text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Bio <span className="font-normal text-gray-400">(max 300 chars)</span></label>
                      <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} maxLength={300} rows={3} placeholder="Tell other attendees about yourself..." className="input-field !text-sm resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Interests</label>
                      <div className="flex flex-wrap gap-1.5">
                        {INTEREST_OPTIONS.map((i) => (
                          <button key={i} type="button" onClick={() => toggleInterest(i)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              profile.interests.includes(i)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >{i}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone (for ticket notifications)</label>
                      <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="07XXXXXXXX" className="input-field !text-sm" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={profile.networkingOptIn} onChange={(e) => setProfile((p) => ({ ...p, networkingOptIn: e.target.checked }))} className="accent-primary-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">Appear in event attendee lists</span>
                    </label>
                    <button type="submit" disabled={saving} className="btn-primary w-full !py-2 !text-sm">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Profile'}
                    </button>
                    {savedMsg && <p className="text-center text-sm text-green-600 font-medium">{savedMsg}</p>}
                  </form>
                )}
              </div>
            </div>

            {/* Right panel — chat or empty state */}
            <div className="lg:col-span-2">
              {!activeChat ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full min-h-80 flex flex-col items-center justify-center text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Select a conversation</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Choose a connection from the left to start chatting, or browse event attendees to meet new people.
                  </p>
                  <Link to="/" className="btn-primary mt-6 !py-2 !px-5 !text-sm">Browse Events</Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[560px]">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <Avatar name={activeChat.user?.name} />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{activeChat.user?.name}</p>
                      <p className="text-xs text-gray-400">{activeChat.user?.profession || 'Attendee'}</p>
                    </div>
                    <button onClick={() => setActiveChat(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Interest tags */}
                  {activeChat.user?.interests?.length > 0 && (
                    <div className="flex gap-1.5 px-5 py-2 border-b border-gray-50 flex-wrap">
                      {activeChat.user.interests.map((i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{i}</span>
                      ))}
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {thread.length === 0 && (
                      <div className="text-center text-sm text-gray-400 pt-8">No messages yet. Say hello!</div>
                    )}
                    {thread.map((m) => {
                      const mine = m.fromUserId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                            mine
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}>
                            {m.text}
                            <p className={`text-[10px] mt-1 ${mine ? 'text-primary-200' : 'text-gray-400'}`}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  {/* Message input */}
                  <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
                    <input
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder={`Message ${activeChat.user?.name}...`}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                    <button type="submit" disabled={sending || !msgText.trim()} className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const cls = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className={`${cls} rounded-full bg-primary-600 text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}
