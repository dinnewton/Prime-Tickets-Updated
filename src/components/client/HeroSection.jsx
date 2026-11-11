import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight, Smartphone, QrCode, ShieldCheck } from 'lucide-react';
import { eventsApi } from '../../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Shown when no event is featured — introduces PrimeTickets itself. */
function BrandHero() {
  return (
    <section className="relative w-full bg-hero-pattern overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-primary-500/30 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-accent-400 text-xs font-bold uppercase tracking-widest mb-5">
            Event tickets in Kenya
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            Your next great night out <span className="text-gradient">starts here.</span>
          </h1>
          <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl">
            Concerts, sports, comedy, theatre and festivals. Pay with M-Pesa or card and your
            QR ticket lands in your inbox in seconds.
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-10">
            <a href="#events" className="btn-primary !py-3.5 !px-8 !bg-accent-500 hover:!bg-accent-600 !shadow-accent-500/30 group">
              Browse Events
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link to="/vendor/register" className="btn-secondary !py-3.5 !px-8 !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
              Sell Tickets for Your Event
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-accent-400" /> M-Pesa &amp; card</li>
            <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-accent-400" /> Instant QR e-ticket</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent-400" /> Secure checkout by Paystack</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function HeroSection() {
  // null while loading, so the brand hero doesn't flash before featured events arrive
  const [featured, setFeatured] = useState(null);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    eventsApi.list({ featured: 'true', upcoming: 'true' })
      .then((data) => setFeatured(Array.isArray(data) ? data : []))
      .catch(() => setFeatured([]));
  }, []);

  const count = featured?.length || 0;

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count]);

  if (featured === null) {
    return <section className="w-full h-[500px] sm:h-[560px] md:h-[640px] bg-hero-pattern" aria-busy="true" />;
  }
  if (!count) return <BrandHero />;

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);
  const event = featured[current % count];

  return (
    <section className="relative w-full h-[500px] sm:h-[560px] md:h-[640px] overflow-hidden">
      {/* Background images */}
      {featured.map((e, i) => (
        <div
          key={e.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={e.image}
            alt={e.title}
            loading={i === 0 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
        <div className="max-w-2xl">
          {/* Hot badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg">
              <Flame className="w-3 h-3" />
              Featured
            </span>
            <span className="badge bg-white/20 text-white backdrop-blur-sm">{event.category}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 drop-shadow-lg">
            {event.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-accent-400 shrink-0" />
              {formatDate(event.date)} · {event.time}
            </div>
            <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          </div>

          {/* Description — hidden on small screens to save space */}
          <p className="hidden sm:block text-white/80 text-base leading-relaxed mb-6 line-clamp-2 max-w-xl">
            {event.description}
          </p>

          {/* Price + CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Tickets from</p>
              <p className="text-3xl sm:text-4xl font-black text-white">Ksh {Number(event.price).toLocaleString()}</p>
            </div>
            <button
              onClick={() => navigate(`/events/${event.id}`)}
              className="btn-primary !py-3 !px-6 !text-sm sm:!py-3.5 sm:!px-8 sm:!text-base group"
            >
              Get Tickets
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        {count > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="p-2"
                aria-label={`Slide ${i + 1}`}
              >
                <span className={`block rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-2.5 bg-accent-500'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arrow controls */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous event"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            aria-label="Next event"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </section>
  );
}
