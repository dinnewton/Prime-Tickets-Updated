import { Link } from 'react-router-dom';
import { Ticket, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Prime<span className="text-primary-400">Tickets</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              Your premier destination for live events across South Africa. Concerts, sport, theatre, and more — all in one place.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Browse Events', to: '/' },
                { label: 'Music', to: '/?category=Music' },
                { label: 'Sports', to: '/?category=Sports' },
                { label: 'Comedy', to: '/?category=Comedy' },
                { label: 'Arts & Theatre', to: '/?category=Arts+%26+Theatre' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For organisers */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Organisers</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'List Your Event', to: '/vendor/register' },
                { label: 'Vendor Login', to: '/login' },
                { label: 'Pricing', to: '#' },
                { label: 'Help Centre', to: '#' },
                { label: 'Terms of Service', to: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>support@primetickets.co.za</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>0800 PRIME (77463)</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>14 Sandton Drive, Sandton, Johannesburg, 2196</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} PrimeTickets (Pty) Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
