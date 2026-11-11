import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import EventCard from '../../components/common/EventCard';
import useEventStore from '../../store/eventStore';
import usePageTitle from '../../hooks/usePageTitle';
import { categories } from '../../data/events';
import { WHEN_OPTIONS, PRICE_OPTIONS, SORT_OPTIONS, filterEvents, sortEvents } from '../../utils/eventFilters';

const PAGE_SIZE = 12;
const DEFAULTS = { q: '', category: 'All', when: 'all', price: 'any', sort: 'soonest', page: '1' };

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

export default function Events() {
  const [params, setParams] = useSearchParams();
  const { events, loading, fetchEvents } = useEventStore();

  useEffect(() => { fetchEvents({ upcoming: 'true' }); }, []);

  // Filters live in the address bar, so a filtered view can be shared or bookmarked
  const f = Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, params.get(k) || d]));
  usePageTitle(f.category !== 'All' ? `${f.category} events` : 'All events');

  const update = (changes) => {
    const next = { ...f, page: '1', ...changes };
    const clean = Object.fromEntries(Object.entries(next).filter(([k, v]) => v && v !== DEFAULTS[k]));
    setParams(clean, { replace: true });
  };

  const results = useMemo(() => sortEvents(filterEvents(events, f), f.sort),
    [events, f.q, f.category, f.when, f.price, f.sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(f.page, 10) || 1));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToPage = (p) => {
    update({ page: String(p) });
    window.scrollTo({ top: 0 });
  };

  const filtersActive = ['q', 'category', 'when', 'price'].some((k) => f[k] !== DEFAULTS[k]);
  const firstLoad = loading && events.length === 0;
  const nothingListed = !loading && events.length === 0;
  const selectClass = 'input-field !py-2.5 !text-sm !w-auto min-w-[10rem] cursor-pointer';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header with search */}
      <div className="bg-hero-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {f.category !== 'All' ? `${f.category} events` : 'All events'}
          </h1>
          <p className="text-white/70 mb-6">Find something to do, then pay with M-Pesa or card.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              aria-label="Search events"
              placeholder="Search events, venues, towns..."
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              className="input-field !pl-12"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Date tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4" role="tablist" aria-label="When">
            {WHEN_OPTIONS.map((w) => (
              <button
                key={w.id}
                role="tab"
                aria-selected={f.when === w.id}
                onClick={() => update({ when: w.id })}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  f.when === w.id
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Dropdown filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select aria-label="Category" value={f.category} onChange={(e) => update({ category: e.target.value })} className={selectClass}>
              {categories.map((c) => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
            </select>
            <select aria-label="Price" value={f.price} onChange={(e) => update({ price: e.target.value })} className={selectClass}>
              {PRICE_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <select aria-label="Sort" value={f.sort} onChange={(e) => update({ sort: e.target.value })} className={selectClass}>
              {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {filtersActive && (
              <button onClick={() => setParams({}, { replace: true })} className="text-sm font-semibold text-primary-600 hover:underline">
                Clear filters
              </button>
            )}
            {!firstLoad && !nothingListed && (
              <p className="text-sm text-gray-500 sm:ml-auto">
                {results.length} {results.length === 1 ? 'event' : 'events'}
              </p>
            )}
          </div>

          {/* Results */}
          {firstLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : nothingListed ? (
            <div className="card text-center px-6 py-14 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarPlus className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">New events are on the way</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We're lining up the next round of events. Check back soon — or if you're hosting
                one, list it today and be first on the page.
              </p>
              <Link to="/vendor/register" className="btn-primary">List Your Event</Link>
            </div>
          ) : shown.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shown.map((event) => <EventCard key={event.id} event={event} />)}
              </div>

              {pages > 1 && (
                <nav className="flex items-center justify-center gap-4 mt-10" aria-label="Pages">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="btn-secondary !py-2.5 !px-4 !text-sm disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {pages}</span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pages}
                    className="btn-secondary !py-2.5 !px-4 !text-sm disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No events match those filters</h2>
              <p className="text-gray-500 mb-6">Try a different date, category or price.</p>
              <button onClick={() => setParams({}, { replace: true })} className="btn-outline">Clear filters</button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
