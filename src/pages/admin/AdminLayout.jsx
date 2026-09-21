import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Building2, Users,
  LogOut, Menu, X, Bell, ChevronDown, MessageCircle, LayoutGrid, FileText,
  ShoppingCart, UserPlus, CheckCheck,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getAdminSocket } from '../../services/socket';
import Logo from '../../components/common/Logo';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/events', icon: CalendarDays, label: 'Events' },
  { to: '/admin/homepage', icon: LayoutGrid, label: 'Homepage' },
  { to: '/admin/vendors', icon: Building2, label: 'Vendors' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/chat', icon: MessageCircle, label: 'Live Chat' },
  { to: '/admin/footer', icon: FileText, label: 'Footer' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Fetch notifications on mount
  useEffect(() => {
    fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => {});
  }, [token]);

  // Real-time notifications via socket
  useEffect(() => {
    if (!token) return;
    const socket = getAdminSocket(token);
    socket.on('admin:notification', (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
    });
    return () => socket.off('admin:notification');
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function markAllRead() {
    fetch('/api/admin/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markOneRead(id) {
    fetch(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  // Poll unread chat count every 15s
  useEffect(() => {
    const fetchUnread = () => {
      fetch('/api/chat/unread', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setChatUnread(d.unread || 0))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      ${mobile
        ? 'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
        : 'hidden lg:flex flex-col w-64 shrink-0'}
      bg-gray-900 text-white flex flex-col
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <Logo onDark subtitle="Admin Panel" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
            {label === 'Live Chat' && chatUnread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {chatUnread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:bg-red-900/30 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Sidebar mobile */}
      <Sidebar mobile />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {unreadNotifs > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markOneRead(n.id)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-50/50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'vendor_joined' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {n.type === 'vendor_joined'
                              ? <UserPlus className="w-4 h-4 text-blue-600" />
                              : <ShoppingCart className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold text-gray-900 ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center">
                {user?.name?.charAt(0)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
