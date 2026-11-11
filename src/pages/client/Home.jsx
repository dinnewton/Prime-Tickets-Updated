import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, CalendarPlus, Smartphone, QrCode, Repeat, ScanLine, BarChart3, Wallet,
  ArrowRight, Ticket, MessageCircle, Tags,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import HeroSection from '../../components/client/HeroSection';
import EventCard from '../../components/common/EventCard';
import useEventStore from '../../store/eventStore';
import usePageTitle from '../../hooks/usePageTitle';
import { categories } from '../../data/events';
import { filterEvents, sortEvents } from '../../utils/eventFilters';

const HOW_IT_WORKS = [
  { Icon: Search,     title: 'Find your event',      text: 'Browse concerts, sports, comedy, theatre and festivals happening across Kenya.' },
  { Icon: Smartphone, title: 'Pay your way',         text: 'Check out in under a minute with M-Pesa, Visa or Mastercard, secured by Paystack.' },
  { Icon: QrCode,     title: 'Get your QR ticket',   text: 'Your ticket arrives by email straight away. Show the QR code at the door and walk in.' },
  { Icon: Repeat,     title: "Plans changed? Resell", text: "Can't make it? List your ticket on the Resale Market or transfer it to a friend." },
];

const ORGANISER_TOOLS = [
  { Icon: Wallet,        title: 'M-Pesa and card sales',   text: 'Buyers pay the way they prefer. Payments are processed securely by Paystack.' },
  { Icon: Tags,          title: 'Standard and VIP tickets', text: 'Set your own prices and ticket numbers for each event.' },
  { Icon: BarChart3,     title: 'Live sales dashboard',    text: 'See tickets sold and revenue for every event as it happens.' },
  { Icon: ScanLine,      title: 'QR check-in at the door', text: 'Scan tickets with any phone. Each ticket is accepted once, so copies are turned away.' },
  { Icon: Ticket,        title: 'Instant e-tickets',       text: 'Every buyer gets a QR ticket by email the moment they pay.' },
  { Icon: MessageCircle, title: 'Direct support chat',     text: 'Message the PrimeTickets team from your dashboard whenever you need help.' },
];

const ORGANISER_STEPS = ['Create your organiser account', 'Add your event, prices and ticket numbers', 'Share your event link and start selling'];

function CardSkeleton() {
  return (
    <div className="card animate-pulse" aria-hidden="true">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-9 bg-gray-200 rounded-xl w-1/2 mt-4" />
      </div>
    </div>
  );
}

/** A titled row of events: swipeable on phones, a grid on larger screens. */
function EventRow({ title, subtitle, events, seeAllTo }) {
  if (!events.length) return null;
  return (
    <section className="mb-12 last:mb-0">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
        <Link to={seeAllTo} className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
          See all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 -mx-4 px-4 pb-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-6 md:overflow-visible">
        {events.map((event) => (
          <div key={event.id} className="snap-start shrink-0 w-[82%] sm:w-[46%] md:w-auto">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { events, loading, fetchEvents } = useEventStore();
  const [query, setQuery] = useState('');
  usePageTitle();

  useEffect(() => { fetchEvents({ upcoming: 'true' }); }, []);

  // Old links such as /?category=Music now live on the events page
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) navigate(`/events?category=${encodeURIComponent(cat)}`, { replace: true });
  }, [searchParams, navigate]);

  const rows = useMemo(() => {
    const soonest = sortEvents(events);
    return {
      featured: soonest.filter((e) => e.featured).slice(0, 4),
      weekend: filterEvents(soonest, { when: 'weekend' }).slice(0, 4),
      soon: soonest.slice(0, 8),
      // only categories that currently have events, busiest first
      categories: categories
        .filter((c) => c !== 'All')
        .map((c) => ({ name: c, count: events.filter((e) => e.category === c).length }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [events]);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/events?q=${encodeURIComponent(query.trim())}` : '/events');
  };

  const firstLoad = loading && events.length === 0;
  const nothingListed = !loading && events.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        <div id="events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-16">
          {/* Search */}
          {!nothingListed && (
            <form onSubmit={submitSearch} className="flex gap-2 max-w-2xl mx-auto mb-10" role="search">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  aria-label="Search events"
                  placeholder="Search events, venues, towns..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-field !pl-12"
                />
              </div>
              <button type="submit" className="btn-primary !px-5">Search</button>
            </form>
          )}

          {firstLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : nothingListed ? (
            <>
              <h2 className="section-title mb-8">Upcoming Events</h2>
              <div className="card text-center px-6 py-14 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">New events are on the way</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  We're lining up the next round of events. Check back soon — or if you're hosting
                  one, list it today and be first on the page.
                </p>
                <Link to="/vendor/register" className="btn-primary">List Your Event</Link>
              </div>
            </>
          ) : (
            <>
              <EventRow title="Featured" subtitle="Hand-picked by the PrimeTickets team" events={rows.featured} seeAllTo="/events" />
              <EventRow title="This weekend" subtitle="Friday to Sunday" events={rows.weekend} seeAllTo="/events?when=weekend" />
              <EventRow title="Happening soon" subtitle="The next events on the calendar" events={rows.soon} seeAllTo="/events" />

              {/* Browse by category */}
              {rows.categories.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">Browse by category</h2>
                  <div className="flex flex-wrap gap-3">
                    {rows.categories.map((c) => (
                      <Link
                        key={c.name}
                        to={`/events?category=${encodeURIComponent(c.name)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-600 text-sm font-semibold text-gray-700 transition-colors"
                      >
                        {c.name}
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 rounded-full px-2 py-0.5">{c.count}</span>
                      </Link>
                    ))}
                    <Link to="/events" className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors">
                      All events <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* How it works */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <h2 className="section-title text-center mb-2">How PrimeTickets works</h2>
            <p className="text-gray-500 text-center mb-10">From finding an event to walking through the door.</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map(({ Icon, title, text }, i) => (
                <li key={title} className="relative rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <span className="absolute top-5 right-5 text-4xl font-black text-gray-200 leading-none">{i + 1}</span>
                  <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For organisers */}
        <section id="organisers" className="bg-hero-pattern scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-accent-400 text-xs font-bold uppercase tracking-widest mb-4">
                For organisers
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Sell out your event with PrimeTickets
              </h2>
              <p className="text-white/80 text-lg mb-6">
                Set up your event in minutes and start selling the same day. We handle payments,
                tickets and door check-in so you can focus on the show.
              </p>
              <ol className="space-y-3 mb-8">
                {ORGANISER_STEPS.map((step, i) => (
                  <li key={step} className="flex items-center gap-3 text-white/90">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-accent-500 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-3 flex-wrap">
                <Link to="/vendor/register" className="btn-primary !py-3.5 !px-8 !bg-accent-500 hover:!bg-accent-600 !shadow-accent-500/30">
                  Start Selling Tickets
                </Link>
                <Link to="/login" className="btn-secondary !py-3.5 !px-8 !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                  Organiser Sign In
                </Link>
              </div>
            </div>

            <ul className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ORGANISER_TOOLS.map(({ Icon, title, text }) => (
                <li key={title} className="rounded-2xl bg-white/10 border border-white/10 p-5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-accent-400" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
