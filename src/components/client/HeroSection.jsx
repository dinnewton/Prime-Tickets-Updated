import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight } from 'lucide-react';
import { getFeaturedEvents } from '../../data/events';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HeroSection() {
  const featured = getFeaturedEvents();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const prev = () => setCurrent((c) => (c - 1 + featured.length) % featured.length);
  const next = () => setCurrent((c) => (c + 1) % featured.length);

  const event = featured[current];

  if (!featured.length || !event) return null;

  return (
    <section className="relative w-full h-[580px] md:h-[640px] overflow-hidden">
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            {event.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4 text-accent-400" />
              {formatDate(event.date)} · {event.time}
            </div>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin className="w-4 h-4 text-accent-400" />
              {event.venue}
            </div>
          </div>

          {/* Description */}
          <p className="text-white/80 text-base leading-relaxed mb-8 line-clamp-2 max-w-xl">
            {event.description}
          </p>

          {/* Price + CTA */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Tickets from</p>
              <p className="text-4xl font-black text-white">Ksh {event.price.toLocaleString()}</p>
            </div>
            <button
              onClick={() => navigate(`/events/${event.id}`)}
              className="btn-primary !py-3.5 !px-8 !text-base group"
            >
              Get Tickets
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate(`/events/${event.id}`)}
              className="btn-secondary !py-3.5 !px-8 !text-base !bg-white/10 !text-white !border-white/30 hover:!bg-white/20"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-accent-500'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arrow controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}
