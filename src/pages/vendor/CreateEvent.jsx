import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useEventStore from '../../store/eventStore';
import ImageUpload from '../../components/common/ImageUpload';
import { categories } from '../../data/events';

const emptyForm = {
  title: '', category: 'Music', date: '', time: '18:00', endTime: '21:00',
  venue: '', city: '', image: '', price: '', vipPrice: '',
  totalTickets: '', description: '', tags: '', featured: false, status: 'on_sale',
};

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addEvent } = useEventStore();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await addEvent({
      ...form,
      vendorId: user?.id || user?.vendorId,
      vendorName: user?.name || 'My Company',
      price: Number(form.price),
      vipPrice: Number(form.vipPrice) || Number(form.price) * 2,
      totalTickets: Number(form.totalTickets),
      soldTickets: 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/vendor/events'), 2000);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-full py-20 px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Created!</h2>
          <p className="text-gray-500">Your event has been listed. Redirecting to your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create New Event</h1>
          <p className="text-gray-500">Fill in the details to list your event.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Summer Music Festival 2026" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Johannesburg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue *</label>
              <input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input-field" placeholder="Venue name and address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" placeholder="Tell attendees what to expect..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="Music, Outdoor, Family" />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Date & Time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Tickets & Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Tickets & Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Price (R) *</label>
              <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">VIP Price (R)</label>
              <input type="number" min="0" value={form.vipPrice} onChange={(e) => setForm({ ...form, vipPrice: e.target.value })} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Tickets *</label>
              <input type="number" required min="1" value={form.totalTickets} onChange={(e) => setForm({ ...form, totalTickets: e.target.value })} className="input-field" placeholder="500" />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Event Image</h2>
          <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        </div>

        {/* Feature toggle */}
        <div className="card p-5 flex items-center gap-4">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            className="w-5 h-5 accent-primary-600"
          />
          <label htmlFor="featured" className="flex-1 cursor-pointer">
            <p className="font-semibold text-gray-900">Feature this event</p>
            <p className="text-sm text-gray-500">Request to appear in the hero carousel on the homepage (subject to admin approval)</p>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-70">
            {loading ? 'Publishing...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
