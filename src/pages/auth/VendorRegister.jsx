import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const categoryOptions = [
  'Music & Festivals', 'Sports', 'Comedy & Entertainment',
  'Arts & Theatre', 'Food & Drink', 'Tech & Business', 'Other',
];

export default function VendorRegister() {
  const navigate = useNavigate();
  const { registerVendor } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    company: '', category: '', bio: '',
  });
  const [loading, setLoading] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    registerVendor(form);
    navigate('/vendor');
  };

  const perks = [
    'List unlimited events',
    'Real-time sales dashboard',
    'Instant ticket QR codes',
    'Payout within 24 hours',
    'Dedicated support team',
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-5/12 bg-hero-pattern flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">PrimeTickets</span>
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 bg-accent-500/20 text-accent-400 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            <Building2 className="w-4 h-4" />
            For Event Organisers
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Sell tickets to<br />your events</h2>
          <p className="text-white/70 mb-8">Join 500+ event organisers already using PrimeTickets to sell out their shows.</p>
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-white/80">
                <CheckCircle className="w-5 h-5 text-accent-400 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/50 text-sm">© {new Date().getFullYear()} PrimeTickets</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Prime<span className="text-primary-600">Tickets</span></span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {['Account Details', 'Business Info'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${i + 1 === step ? 'text-primary-700' : 'text-gray-500'}`}>{label}</span>
                {i < 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {step === 1 ? 'Create vendor account' : 'Business information'}
          </h1>
          <p className="text-gray-500 mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+27 82 000 0000" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min. 6 characters" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center !py-3.5">
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Trading name</label>
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field" placeholder="My Events Company (Pty) Ltd" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event category</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  <option value="">Select a category...</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">About your company</label>
                <textarea
                  required
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Tell us about the kind of events you organise..."
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Note:</strong> Your account will be reviewed by our admin team before you can publish events. This usually takes 24–48 hours.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-70">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
