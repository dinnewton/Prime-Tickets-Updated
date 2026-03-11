import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';

const statusConfig = {
  on_sale: { label: 'On Sale', class: 'badge-green' },
  almost_sold_out: { label: 'Almost Sold Out', class: 'badge-red' },
  sold_out: { label: 'Sold Out', class: 'bg-gray-100 text-gray-500 badge' },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return {
    day: date.toLocaleDateString('en-ZA', { day: '2-digit' }),
    month: date.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase(),
    year: date.getFullYear(),
    full: date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

function soldPercent(sold, total) {
  return Math.min(Math.round((sold / total) * 100), 100);
}

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const date = formatDate(event.date);
  const sold = soldPercent(event.soldTickets, event.totalTickets);
  const status = statusConfig[event.status] || statusConfig.on_sale;

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="card group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image with floating date badge */}
      <div className="relative overflow-hidden h-48">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Floating date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-xl shadow-lg text-center px-3 py-2 min-w-[52px]">
          <p className="text-xs font-bold text-primary-600 leading-none">{date.month}</p>
          <p className="text-2xl font-black text-gray-900 leading-tight">{date.day}</p>
          <p className="text-xs text-gray-500 leading-none">{date.year}</p>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={status.class}>{status.label}</span>
        </div>

        {/* Category */}
        <div className="absolute bottom-3 left-3">
          <span className="badge bg-black/60 text-white backdrop-blur-sm">{event.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg leading-snug mb-3 group-hover:text-primary-700 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4 shrink-0 text-primary-500" />
            <span>{date.full} · {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 shrink-0 text-primary-500" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        {/* Tickets sold bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.soldTickets.toLocaleString()} sold
            </span>
            <span>{sold}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                sold >= 90 ? 'bg-red-500' : sold >= 70 ? 'bg-amber-500' : 'bg-primary-500'
              }`}
              style={{ width: `${sold}%` }}
            />
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">From</p>
            <p className="text-2xl font-black text-gray-900">
              R{event.price.toLocaleString()}
            </p>
          </div>
          <button className="btn-primary !py-2.5 !px-5 !text-sm">
            Get Tickets
          </button>
        </div>
      </div>
    </div>
  );
}
