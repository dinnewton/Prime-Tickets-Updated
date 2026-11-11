import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, CalendarPlus, Smartphone, QrCode, Repeat, ScanLine, BarChart3, Wallet } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import HeroSection from '../../components/client/HeroSection';
import EventCard from '../../components/common/EventCard';
import useEventStore from '../../store/eventStore';
import usePageTitle from '../../hooks/usePageTitle';
import { categories } from '../../data/events';

const HOW_IT_WORKS = [
  { Icon: Search,     title: 'Find your event',      text: 'Browse concerts, sports, comedy, theatre and festivals happening across Kenya.' },
  { Icon: Smartphone, title: 'Pay your way',         text: 'Check out in under a minute with M-Pesa, Visa or Mastercard, secured by Paystack.' },
  { Icon: QrCode,     title: 'Get your QR ticket',   text: 'Your ticket arrives by email straight away. Show the QR code at the door and walk in.' },
  { Icon: Repeat,     title: "Plans changed? Resell", text: "Can't make it? List your ticket on the Resale Market or transfer it to a friend." },
];

const ORGANISER_PERKS = [
  { Icon: Wallet,    text: 'Sell with M-Pesa and card' },
  { Icon: ScanLine,  text: 'Scan QR tickets at the door' },
  { Icon: BarChart3, text: 'Track sales live' },
];

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

export default function Home() {
  const [searchParams] = useSearchParams();
  const { events, loading, selectedCategory, searchQuery, setCategory, setSearch, getFilteredEvents, fetchEvents } = useEventStore();
  usePageTitle();

  useEffect(() => { fetchEvents({ upcoming: 'true' }); }, []);

  // Handle URL-driven category
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(decodeURIComponent(cat));
  }, [searchParams, setCategory]);

  const filtered = getFilteredEvents();
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
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="section-title">Upcoming Events</h2>
              {!firstLoad && !nothingListed && (
                <p className="text-gray-500 mt-1">
                  {filtered.length} {filtered.length === 1 ? 'event' : 'events'} available
                </p>
              )}
            </div>

            {/* Search bar */}
            {!nothingListed && (
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  aria-label="Search events"
                  placeholder="Search events, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field !pl-10 !py-2.5 !text-sm"
                />
              </div>
            )}
          </div>

          {/* Category tabs */}
          {!nothingListed && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Events grid */}
          {firstLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : nothingListed ? (
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
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">Try a different category or search term.</p>
              <button
                onClick={() => { setCategory('All'); setSearch(''); }}
                className="btn-outline"
              >
                Clear filters
              </button>
            </div>
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

        {/* CTA Banner — become a vendor */}
        <div className="bg-hero-pattern py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Host Your Event on PrimeTickets
            </h2>
            <p className="text-white/80 text-lg mb-6 max-w-xl mx-auto">
              Set up your event in minutes and start selling the same day. We handle payments,
              tickets and door check-in so you can focus on the show.
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/90 mb-8">
              {ORGANISER_PERKS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-accent-400" /> {text}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/vendor/register" className="btn-primary !py-3.5 !px-8 !bg-accent-500 hover:!bg-accent-600 !shadow-accent-500/30">
                Start Selling Tickets
              </Link>
              <Link to="/login" className="btn-secondary !py-3.5 !px-8 !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                Sign In as Vendor
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
