import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import usePageTitle from '../../hooks/usePageTitle';

const PAGES = [
  { to: '/help', label: 'Help centre' },
  { to: '/refunds', label: 'Refund policy' },
  { to: '/terms', label: 'Terms of use' },
  { to: '/privacy', label: 'Privacy policy' },
];

/** The support address set by the admin under Footer settings. */
export function useSupportEmail() {
  const [email, setEmail] = useState('support@primeticketsoko.com');
  useEffect(() => {
    fetch('/api/settings/footer')
      .then((r) => r.json())
      .then((s) => { if (s?.email) setEmail(s.email); })
      .catch(() => {});
  }, []);
  return email;
}

export function SupportEmail() {
  const email = useSupportEmail();
  return <a href={`mailto:${email}`} className="text-primary-600 font-semibold hover:underline">{email}</a>;
}

export function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-gray-800">
        {children}
      </div>
    </section>
  );
}

/** Shared frame for the help and policy pages. */
export default function InfoLayout({ title, intro, updated, current, children }) {
  usePageTitle(title);
  useEffect(() => { window.scrollTo(0, 0); }, [current]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-hero-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{title}</h1>
          {intro && <p className="text-white/75 max-w-2xl">{intro}</p>}
          {updated && <p className="text-white/50 text-sm mt-3">Last updated: {updated}</p>}
        </div>
      </div>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex flex-wrap gap-2 mb-8" aria-label="Help and policies">
            {PAGES.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                aria-current={p.to === current ? 'page' : undefined}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  p.to === current
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="card p-6 sm:p-10">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
