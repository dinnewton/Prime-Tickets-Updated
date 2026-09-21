import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../services/api';
import AuthPanel from '../../components/auth/AuthPanel';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setError('');
    const result = await googleLogin(credentialResponse.credential);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  return (
    <AuthPanel heading="Locked out?" blurb="We'll email you a link to choose a new password — or sign in with Google right away.">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Forgot password</h1>

      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-6">
          <MailCheck className="w-8 h-8 text-green-600 mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Check your email</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            If an account exists for <strong>{email}</strong>, we've sent a link to reset the password.
            It expires in 1 hour. Not there? Check your spam folder.
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-8">Enter the email you signed up with and we'll send you a reset link.</p>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center !py-3.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </>
      )}

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or skip the wait</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogle}
          onError={() => setError('Google sign-in failed. Please try again.')}
          width="368"
          text="signin_with"
          shape="rectangular"
          theme="outline"
        />
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        Works if your account uses a Gmail / Google email.
      </p>
    </AuthPanel>
  );
}
