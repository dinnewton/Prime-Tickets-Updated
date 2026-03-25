import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Calendar, MapPin, X } from 'lucide-react';
import useEventStore from '../../store/eventStore';
import { vendors } from '../../data/vendors';
import { categories } from '../../data/events';
import ImageUpload from '../../components/common/ImageUpload';

const statusOptions = ['on_sale', 'almost_sold_out', 'sold_out'];

const emptyForm = {
  title: '', category: 'Music', vendorId: 'v1', date: '', time: '18:00', endTime: '21:00',
  venue: '', city: '', image: '', price: '', vipPrice: '', description: '',
  totalTickets: '', soldTickets: '0', featured: false, status: 'on_sale',
  tags: '',
};

export default function AdminEvents() {
  const { events, addEvent, updateEvent, deleteEvent } = useEventStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setForm({
      ...event,
      tags: event.tags?.join(', ') || '',
    });
    setEditingId(event.id);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: Number(form.price),
      vipPrice: Number(form.vipPrice),
      totalTickets: Number(form.totalTickets),
      soldTickets: Number(form.soldTickets),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      vendorName: vendors.find((v) => v.id === form.vendorId)?.name || '',
    };
    if (editingId) {
      updateEvent(editingId, data);
    } else {
      addEvent(data);
    }
    setModalOpen(false);
  };

  const confirmDelete = (id) => {
    deleteEvent(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Events</h1>
          <p className="text-gray-500">{events.length} total events</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field !pl-10 !py-2.5 !text-sm"
          placeholder="Search events..."
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Event</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden md:table-cell">Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden lg:table-cell">Venue</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4">Price</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden sm:table-cell">Status</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={event.image} alt={event.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(event.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900">Ksh {event.price.toLocaleString()}</td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className={`badge ${
                    event.status === 'on_sale' ? 'badge-green' :
                    event.status === 'almost_sold_out' ? 'badge-red' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(event)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(event.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No events found.</div>
        )}
      </div>

      {/* Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Event' : 'Add New Event'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor</label>
                  <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="input-field">
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue *</label>
                  <input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input-field" placeholder="Venue Name, City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Price (R) *</label>
                  <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">VIP Price (R)</label>
                  <input type="number" min="0" value={form.vipPrice} onChange={(e) => setForm({ ...form, vipPrice: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Tickets *</label>
                  <input type="number" required min="1" value={form.totalTickets} onChange={(e) => setForm({ ...form, totalTickets: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Image</label>
                  <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="Music, Outdoor, Festival" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">Feature this event on hero carousel</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{editingId ? 'Save Changes' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The event and all its ticket data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
