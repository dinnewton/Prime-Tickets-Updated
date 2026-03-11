import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, ShoppingCart, Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useEventStore from '../../store/eventStore';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useEventStore((s) => s.cartCount());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const dashboardLink =
    user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : null;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:bg-primary-700 transition-colors">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Prime<span className="text-primary-600">Tickets</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-sm transition-all">
              Events
            </Link>
            <Link to="/?category=Music" className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-sm transition-all">
              Music
            </Link>
            <Link to="/?category=Sports" className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-sm transition-all">
              Sports
            </Link>
            <Link to="/?category=Comedy" className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-sm transition-all">
              Comedy
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link
              to="/checkout"
              className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    {dashboardLink && (
                      <Link
                        to={dashboardLink}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Tickets
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {['/', '/?category=Music', '/?category=Sports', '/?category=Comedy'].map((path, i) => (
              <Link
                key={i}
                to={path}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-xl font-medium transition-all"
              >
                {['All Events', 'Music', 'Sports', 'Comedy'][i]}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
