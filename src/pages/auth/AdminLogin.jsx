import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = await adminLogin(form.email, form.password);
    setLoading(false);
    if (result.success && result.role === 'admin') {
      navigate('/admin');
    } else if (result.success && result.role !== 'admin') {
      setError('Access denied. Admin credentials required.');
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-600/40">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Restricted area — authorised personnel only</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-700/40 text-amber-400 rounded-xl px-4 py-3 mb-6 text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            This page is not publicly accessible. Do not share this URL.
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-600 transition-all"
                placeholder="admin@primetickets.co.ke"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-600 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          PrimeTickets Admin · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
