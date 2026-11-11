import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';

const DEFAULTS = {
  tagline: 'Your premier destination for live events across Kenya. Concerts, sport, theatre, and more — all in one place.',
  email: 'support@primeticketsoko.com',
  phone: '',
  address: 'Westlands, Nairobi, Kenya',
  copyright: 'PrimeTickets Ltd',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
};

const SOCIAL = [
  { key: 'facebook', Icon: Facebook },
  { key: 'twitter',  Icon: Twitter  },
  { key: 'instagram',Icon: Instagram},
  { key: 'youtube',  Icon: Youtube  },
];

export default function Footer() {
  const [s, setS] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/settings/footer')
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Logo onDark />
            </Link>
            <p className="text-sm leading-relaxed">{s.tagline}</p>
            <div className="flex items-center gap-3 pt-2">
              {/* Only networks the admin has filled in under Footer settings */}
              {SOCIAL.filter(({ key }) => s[key]).map(({ key, Icon }) => {
                const href = s[key];
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Browse Events', to: '/events' },
                { label: 'This Weekend', to: '/events?when=weekend' },
                { label: 'Music', to: '/events?category=Music' },
                { label: 'Sports', to: '/events?category=Sports' },
                { label: 'Comedy', to: '/events?category=Comedy' },
                { label: 'Resale Market', to: '/market' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary-400 transition-colors">
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
                { label: 'Door Check-in', to: '/checkin' },
                { label: 'Help Centre', to: '/help' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary-400 transition-colors">
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
                <a href={`mailto:${s.email}`} className="hover:text-primary-400 transition-colors">{s.email}</a>
              </li>
              {s.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                  <a href={`tel:${s.phone.replace(/[^+d]/g, '')}`} className="hover:text-primary-400 transition-colors">{s.phone}</a>
                </li>
              )}
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>{s.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} {s.copyright}. All rights reserved. Payments secured by Paystack.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/help" className="hover:text-primary-400 transition-colors">Help</Link>
            <Link to="/refunds" className="hover:text-primary-400 transition-colors">Refunds</Link>
            <Link to="/terms" className="hover:text-primary-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
