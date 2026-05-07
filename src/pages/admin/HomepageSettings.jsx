import { useEffect, useState, useRef } from 'react';
import {
  Image, Eye, EyeOff, ArrowUp, ArrowDown, Star, StarOff,
  Pin, Loader2, CheckCircle, AlertCircle, Upload, X, Search,
} from 'lucide-react';
import { eventsApi } from '../../services/api';

function useToken() {
  try {
    const raw = localStorage.getItem('prime-auth');
    return JSON.parse(raw)?.state?.token || null;
  } catch { return null; }
}

async function uploadImage(file, token) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/api/uploads/event-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || 'Upload failed');
  return d.url;
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  if (!msg) return null;
  const ok = msg.ok;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      {msg.text}
      <button onClick={onClose}><X className="w-4 h-4 ml-1" /></button>
    </div>
  );
}

export default function HomepageSettings() {
  const token = useToken();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // event id being saved
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('hero'); // 'hero' | 'order'
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const fileInputRef = useRef({});

  const notify = (ok, text) => setToast({ ok, text });

  useEffect(() => {
    eventsApi.list()
      .then((data) => {
        // Fetch all events including hidden (admin view) — need a separate call
        return fetch('/api/events/admin/all', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : data).catch(() => data);
      })
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Reload from server
  const reload = () => {
    fetch('/api/events/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : eventsApi.list())
      .then(setEvents)
      .catch(() => eventsApi.list().then(setEvents));
  };

  const patch = async (id, updates) => {
    setSaving(id);
    try {
      const updated = await eventsApi.update(id, updates);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      notify(true, 'Saved');
    } catch (e) {
      notify(false, e.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (event, file) => {
    if (!file) return;
    setSaving(event.id);
    try {
      const url = await uploadImage(file, token);
      await patch(event.id, { image: url });
    } catch (e) {
      notify(false, e.message || 'Image upload failed');
      setSaving(null);
    }
  };

  // Reorder helpers — swap priorities of adjacent items in sorted list
  const moveInList = (sortedList, idx, dir) => {
    const target = sortedList[idx];
    const swap = sortedList[idx + dir];
    if (!swap) return;
    const tPriority = target.priority || 0;
    const sPriority = swap.priority || 0;
    // Ensure distinct priorities
    const newT = sPriority + (dir < 0 ? 1 : -1);
    const newS = tPriority + (dir < 0 ? -1 : 1);
    patch(target.id, { priority: newT });
    patch(swap.id, { priority: newS });
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === target.id) return { ...e, priority: newT };
        if (e.id === swap.id) return { ...e, priority: newS };
        return e;
      })
    );
  };

  // ─── Hero carousel tab ────────────────────────────────────────────────────────
  const featuredEvents = events
    .filter((e) => e.featured)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const nonFeatured = events
    .filter((e) => !e.featured)
    .filter((e) => !addSearch || e.title.toLowerCase().includes(addSearch.toLowerCase()));

  // ─── Event order tab ──────────────────────────────────────────────────────────
  const allSorted = [...events]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .filter((e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase())
    );

  const maxPriority = Math.max(0, ...events.map((e) => e.priority || 0));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage the hero carousel and event listing order on the public homepage.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {[
          { id: 'hero', label: 'Hero Carousel', icon: Image },
          { id: 'order', label: 'Event Order & Visibility', icon: Eye },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Hero Carousel Tab ──────────────────────────────────────────────────── */}
      {tab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {featuredEvents.length} event{featuredEvents.length !== 1 ? 's' : ''} in hero carousel · Use ↑↓ to reorder
            </p>
            <button
              onClick={() => { setAddModal(true); setAddSearch(''); }}
              className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-2"
            >
              <Star className="w-4 h-4" /> Add to Carousel
            </button>
          </div>

          {featuredEvents.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Image className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No events in the hero carousel</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add to Carousel" to feature an event</p>
            </div>
          )}

          {featuredEvents.map((event, idx) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-0">
              {/* Image */}
              <div className="relative w-48 shrink-0">
                <img
                  src={event.image || 'https://via.placeholder.com/192x128?text=No+Image'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '120px', maxHeight: '120px' }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white">
                    <Upload className="w-3.5 h-3.5" />
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(event, e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{event.venue} · {event.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Priority: {event.priority || 0}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Reorder */}
                  <button
                    onClick={() => moveInList(featuredEvents, idx, -1)}
                    disabled={idx === 0 || saving === event.id}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move earlier in carousel"
                  >
                    <ArrowUp className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => moveInList(featuredEvents, idx, 1)}
                    disabled={idx === featuredEvents.length - 1 || saving === event.id}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move later in carousel"
                  >
                    <ArrowDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Remove from hero */}
                  <button
                    onClick={() => patch(event.id, { featured: false })}
                    disabled={saving === event.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold disabled:opacity-50"
                    title="Remove from hero carousel"
                  >
                    {saving === event.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <StarOff className="w-4 h-4" />}
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Event Order & Visibility Tab ──────────────────────────────────────── */}
      {tab === 'order' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10 !py-2.5 !text-sm"
              />
            </div>
            <p className="text-sm text-gray-500">{allSorted.length} events</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visible</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hero</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSorted.map((event, idx) => (
                  <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${event.hiddenFromHome ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-400 truncate">{event.venue}</p>
                        </div>
                        {(event.priority || 0) > 0 && (
                          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                            #{event.priority}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{event.date}</td>

                    {/* Visibility toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => patch(event.id, { hiddenFromHome: !event.hiddenFromHome })}
                        disabled={saving === event.id}
                        className={`p-2 rounded-lg transition-colors ${
                          event.hiddenFromHome
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={event.hiddenFromHome ? 'Hidden from homepage — click to show' : 'Visible on homepage — click to hide'}
                      >
                        {saving === event.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : event.hiddenFromHome
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Hero toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => patch(event.id, { featured: !event.featured })}
                        disabled={saving === event.id}
                        className={`p-2 rounded-lg transition-colors ${
                          event.featured
                            ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        title={event.featured ? 'In hero carousel — click to remove' : 'Not in hero — click to add'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Order controls */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            patch(event.id, { priority: maxPriority + 10 });
                            setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, priority: maxPriority + 10 } : e));
                          }}
                          disabled={saving === event.id}
                          className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 disabled:opacity-30"
                          title="Pin to top of homepage"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveInList(allSorted, idx, -1)}
                          disabled={idx === 0 || saving === event.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveInList(allSorted, idx, 1)}
                          disabled={idx === allSorted.length - 1 || saving === event.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add to Hero Modal ──────────────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Event to Hero Carousel</h2>
              <button onClick={() => setAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="input-field !pl-10 !py-2.5 !text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {nonFeatured.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No events found</p>
              )}
              {nonFeatured.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100"
                  onClick={async () => {
                    await patch(event.id, { featured: true });
                    setAddModal(false);
                  }}
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-gray-400 truncate">{event.venue} · {event.date}</p>
                  </div>
                  <Star className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}
