import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import HeroSection from '../../components/client/HeroSection';
import EventCard from '../../components/common/EventCard';
import useEventStore from '../../store/eventStore';
import { categories } from '../../data/events';

export default function Home() {
  const [searchParams] = useSearchParams();
  const { selectedCategory, searchQuery, setCategory, setSearch, getFilteredEvents, fetchEvents } = useEventStore();

  useEffect(() => { fetchEvents(); }, []);

  // Handle URL-driven category
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(decodeURIComponent(cat));
  }, [searchParams, setCategory]);

  const filtered = getFilteredEvents();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="section-title">Upcoming Events</h2>
              <p className="text-gray-500 mt-1">{filtered.length} events available</p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10 !py-2.5 !text-sm"
              />
            </div>
          </div>

          {/* Category tabs */}
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

          {/* Events grid */}
          {filtered.length > 0 ? (
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

        {/* CTA Banner — become a vendor */}
        <div className="bg-hero-pattern py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Host Your Event on PrimeTickets
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of event organisers selling tickets to thousands of fans. Easy setup, powerful tools, instant payouts.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="/vendor/register" className="btn-primary !py-3.5 !px-8 !bg-accent-500 hover:!bg-accent-600 !shadow-accent-500/30">
                Start Selling Tickets
              </a>
              <a href="/login" className="btn-secondary !py-3.5 !px-8 !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                Sign In as Vendor
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
