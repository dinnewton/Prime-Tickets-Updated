import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Tag, Ticket, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';

// Pages that have their own bottom bar or are staff tools — no nav there
const HIDDEN_ON = [/^\/events\/[^/]+/, /^\/checkout/, /^\/payment\//, /^\/admin/, /^\/vendor(\/(?!register)|$)/, /^\/checkin/, /^\/secure\//];

/** App-style bottom bar, phones only. */
export default function MobileNav() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const hidden = HIDDEN_ON.some((re) => re.test(pathname));

  // Lets the page and the chat button make room for the bar (see index.css)
  useEffect(() => {
    document.body.classList.toggle('has-mobile-nav', !hidden);
    return () => document.body.classList.remove('has-mobile-nav');
  }, [hidden]);

  if (hidden) return null;

  const account = !isAuthenticated
    ? { to: '/login', label: 'Sign in' }
    : user?.role === 'admin' ? { to: '/admin', label: 'Admin' }
    : user?.role === 'vendor' ? { to: '/vendor', label: 'Dashboard' }
    : { to: '/network', label: 'Account' };

  const items = [
    { to: '/', label: 'Home', Icon: Home, end: true },
    { to: '/events', label: 'Search', Icon: Search },
    { to: '/market', label: 'Resale', Icon: Tag },
    { to: '/my-tickets', label: 'Tickets', Icon: Ticket },
    { ...account, Icon: User },
  ];

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, Icon, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
