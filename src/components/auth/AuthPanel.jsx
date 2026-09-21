import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

// Two-panel layout used by the password pages (matches Login/Register)
export default function AuthPanel({ heading, blurb, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="lg" onDark />
        </Link>
        <div>
          <h2 className="text-4xl font-black text-white mb-4">{heading}</h2>
          <p className="text-white/80 text-lg">{blurb}</p>
        </div>
        <p className="text-white/50 text-sm">© {new Date().getFullYear()} PrimeTickets</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
