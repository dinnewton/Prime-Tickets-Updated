import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../services/api';
import AuthPanel from '../../components/auth/AuthPanel';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('The two passwords do not match');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel heading="Choose a new password" blurb="Use at least 8 characters. A mix of words and numbers is hard to guess and easy to remember.">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Set a new password</h1>

      {!token ? (
        <p className="text-gray-600 mt-4">
          This page needs the link from your reset email.{' '}
          <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">Request a new link</Link>
        </p>
      ) : done ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-6">
          <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Password updated</p>
          <p className="text-sm text-gray-600 mb-4">
            You've been signed out everywhere else. Sign in with your new password.
          </p>
          <Link to="/login" className="btn-primary !py-2.5 !px-6">Sign in</Link>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-8">Enter your new password twice.</p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {error}
                {/expired|invalid/i.test(error) && (
                  <> <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link></>
                )}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pr-12"
                  placeholder="At least 8 characters"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Type it again"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center !py-3.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        </>
      )}
    </AuthPanel>
  );
}
