import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const FIELDS = [
  { key: 'tagline',   label: 'Tagline / Description', type: 'textarea' },
  { key: 'email',     label: 'Contact Email',          type: 'email'    },
  { key: 'phone',     label: 'Contact Phone',          type: 'text'     },
  { key: 'address',   label: 'Address',                type: 'text'     },
  { key: 'copyright', label: 'Copyright Company Name', type: 'text'     },
];

const SOCIAL_FIELDS = [
  { key: 'facebook',  label: 'Facebook URL'  },
  { key: 'twitter',   label: 'Twitter / X URL' },
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'youtube',   label: 'YouTube URL'   },
];

export default function FooterSettings() {
  const { token } = useAuthStore();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/settings/footer')
      .then((r) => r.json())
      .then((data) => { setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Save failed');
      const data = await res.json();
      setForm(data);
      setMsg({ ok: true, text: 'Footer settings saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Footer Settings</h1>
          <p className="text-sm text-gray-500">Edit the content shown in the site footer</p>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{msg.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact & Branding */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Branding & Contact</h2>
          {FIELDS.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form?.[key] ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  className="input-field resize-none"
                />
              ) : (
                <input
                  type={type}
                  value={form?.[key] ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  className="input-field"
                />
              )}
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Social Media Links</h2>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to disable a link</p>
          </div>
          {SOCIAL_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="url"
                value={form?.[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder="https://"
                className="input-field"
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Footer Settings'}
        </button>
      </form>
    </div>
  );
}
