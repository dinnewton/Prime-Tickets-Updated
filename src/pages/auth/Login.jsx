import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Eye, EyeOff, AlertCircle, Users, Building2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      if (result.role === 'admin') navigate('/admin');
      else if (result.role === 'vendor') navigate('/vendor');
      else navigate('/');
    } else {
      setError(result.error);
    }
  };

  const demoAccounts = [
    {
      label: 'Vendor Demo',
      icon: Building2,
      email: 'vendor@primetickets.co.ke',
      password: 'vendor123',
      color: 'text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100',
    },
    {
      label: 'Client Demo',
      icon: Users,
      email: 'client@primetickets.co.ke',
      password: 'client123',
      color: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">PrimeTickets</span>
        </Link>
        <div>
          <h2 className="text-4xl font-black text-white mb-4">Welcome back!</h2>
          <p className="text-white/80 text-lg">
            Sign in to manage your tickets, track your events, and more.
          </p>
        </div>
        <p className="text-white/50 text-sm">© {new Date().getFullYear()} PrimeTickets</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Prime<span className="text-primary-600">Tickets</span>
            </span>
          </Link>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Sign in</h1>
          <p className="text-gray-500 mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo accounts — vendor and client only */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => setForm({ email: acc.email, password: acc.password })}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${acc.color}`}
                >
                  <acc.icon className="w-4 h-4" />
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field !pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <a href="#" className="text-sm text-primary-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center !py-3.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Are you an event organiser?{' '}
            <Link to="/vendor/register" className="text-primary-600 font-semibold hover:underline">
              Register as Vendor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
