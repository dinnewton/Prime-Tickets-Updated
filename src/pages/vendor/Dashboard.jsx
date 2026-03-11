import { Link } from 'react-router-dom';
import { TrendingUp, Ticket, CalendarDays, DollarSign, Plus, ArrowUpRight, Users } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useEventStore from '../../store/eventStore';

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const { events } = useEventStore();

  const vendorId = user?.vendorId || 'v1';
  const myEvents = events.filter((e) => e.vendorId === vendorId);
  const totalRevenue = myEvents.reduce((sum, e) => sum + e.soldTickets * e.price, 0);
  const totalSold = myEvents.reduce((sum, e) => sum + e.soldTickets, 0);

  const stats = [
    {
      label: 'Total Revenue',
      value: `R${(totalRevenue / 1000).toFixed(1)}K`,
      change: '+18%',
      icon: DollarSign,
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      label: 'Tickets Sold',
      value: totalSold.toLocaleString(),
      change: '+12%',
      icon: Ticket,
      bg: 'bg-primary-50',
      text: 'text-primary-700',
    },
    {
      label: 'Active Events',
      value: myEvents.filter((e) => e.status !== 'sold_out').length,
      change: `${myEvents.length} total`,
      icon: CalendarDays,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    {
      label: 'Total Attendees',
      value: totalSold.toLocaleString(),
      change: 'Across all events',
      icon: Users,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500">Here's how your events are performing.</p>
        </div>
        <Link to="/vendor/events/create" className="btn-primary">
          <Plus className="w-5 h-5" />
          New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${stat.text}`}>
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Events table */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">My Events</h2>
          <Link to="/vendor/events" className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
            Manage all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {myEvents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">No events yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first event to start selling tickets.</p>
            <Link to="/vendor/events/create" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Event</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden md:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4">Sold</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden sm:table-cell">Revenue</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myEvents.slice(0, 5).map((event) => {
                  const soldPct = Math.round((event.soldTickets / event.totalTickets) * 100);
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={event.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">{event.title}</p>
                            <p className="text-xs text-gray-500">{event.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{event.soldTickets.toLocaleString()} <span className="text-gray-400 font-normal">/ {event.totalTickets.toLocaleString()}</span></p>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1 w-24">
                            <div
                              className={`h-full rounded-full ${soldPct >= 90 ? 'bg-red-500' : soldPct >= 70 ? 'bg-amber-500' : 'bg-primary-500'}`}
                              style={{ width: `${soldPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-900 hidden sm:table-cell">
                        R{(event.soldTickets * event.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge ${
                          event.status === 'on_sale' ? 'badge-green' :
                          event.status === 'almost_sold_out' ? 'badge-red' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
