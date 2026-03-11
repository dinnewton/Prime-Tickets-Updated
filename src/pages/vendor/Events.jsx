import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Calendar, Users } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useEventStore from '../../store/eventStore';

export default function VendorEvents() {
  const { user } = useAuthStore();
  const { events, deleteEvent } = useEventStore();
  const vendorId = user?.vendorId || 'v1';
  const myEvents = events.filter((e) => e.vendorId === vendorId);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Events</h1>
          <p className="text-gray-500">{myEvents.length} events listed</p>
        </div>
        <Link to="/vendor/events/create" className="btn-primary">
          <Plus className="w-5 h-5" />
          Create Event
        </Link>
      </div>

      {myEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">No events yet</h3>
          <p className="text-gray-500 text-sm mb-6">Get started by creating your first event.</p>
          <Link to="/vendor/events/create" className="btn-primary">Create Event</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {myEvents.map((event) => {
            const soldPct = Math.round((event.soldTickets / event.totalTickets) * 100);
            return (
              <div key={event.id} className="card overflow-hidden">
                <div className="relative h-44">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${
                      event.status === 'on_sale' ? 'badge-green' :
                      event.status === 'almost_sold_out' ? 'badge-red' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-bold text-white line-clamp-2 text-sm">{event.title}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span>·</span>
                    <span>{event.venue}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.soldTickets.toLocaleString()} sold</span>
                      <span>{soldPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${soldPct >= 90 ? 'bg-red-500' : soldPct >= 70 ? 'bg-amber-500' : 'bg-primary-500'}`}
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-gray-900">Ksh {event.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Ksh {(event.soldTickets * event.price).toLocaleString()} revenue</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={`/events/${event.id}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                      <Eye className="w-4 h-4" /> Preview
                    </a>
                    <Link to="/vendor/events/create" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
