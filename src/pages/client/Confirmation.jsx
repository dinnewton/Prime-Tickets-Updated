import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, Ticket, Users, X, Wifi, QrCode } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useAuthStore from '../../store/authStore';

export default function Confirmation() {
  const { state } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [networkDismissed, setNetworkDismissed] = useState(false);

  const ref = state?.ref || `PT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const events = state?.cart
    ? [...new Map(state.cart.map((i) => [i.eventId, i])).values()]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">

          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-500">
              Your tickets are on their way.{state?.email && (
                <> Check <span className="font-semibold text-gray-700">{state.email}</span> for your e-tickets.</>
              )}
            </p>
          </div>

          {/* Order card */}
          <div className="card p-8 mb-5">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Ticket className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Order Reference</span>
            </div>
            <div className="bg-primary-50 rounded-2xl px-8 py-4 mb-4">
              <p className="text-3xl font-black text-primary-700 tracking-widest">{ref}</p>
            </div>
            {state?.total && (
              <p className="text-gray-500 text-sm text-center">
                Total paid: <span className="font-bold text-gray-900">Ksh {state.total.toLocaleString()}</span>
              </p>
            )}
            {isAuthenticated ? (
              <Link
                to="/my-tickets"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <QrCode className="w-5 h-5" /> View your ticket QR codes
              </Link>
            ) : (
              <p className="mt-6 text-sm text-gray-500 text-center">
                Keep your order reference — show it with your ID at the entrance.
              </p>
            )}
          </div>

          {/* ── Networking prompt ─────────────────────────────────────── */}
          {!networkDismissed && events.length > 0 && (
            <div className="card p-5 mb-5 border-2 border-primary-100 bg-gradient-to-br from-primary-50 to-white relative">
              <button
                onClick={() => setNetworkDismissed(true)}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Meet people going to {events[0].eventTitle}{events.length > 1 ? ` & ${events.length - 1} more` : ''}!
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Other attendees are already connecting. Want to network with people heading to the same event?
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {events.map((e) => (
                      <Link
                        key={e.eventId}
                        to={`/events/${e.eventId}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 bg-primary-100 hover:bg-primary-200 px-3 py-2 rounded-xl transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        See who's going
                        {events.length > 1 && <span className="text-xs text-primary-400 truncate max-w-[100px]">· {e.eventTitle}</span>}
                      </Link>
                    ))}
                    {isAuthenticated && (
                      <Link to="/network" className="text-sm text-gray-400 hover:text-primary-600 font-medium transition-colors">
                        My Network →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If not logged in, nudge to sign up for networking */}
          {!networkDismissed && !isAuthenticated && events.length > 0 && (
            <div className="card p-5 mb-5 border border-dashed border-primary-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold">Sign in</span> to connect with other attendees going to the same event.
              </p>
              <Link to="/login" className="btn-primary !py-2 !px-5 !text-sm">
                Sign in to Network
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary w-full sm:w-auto justify-center">
              <Download className="w-5 h-5" />
              Download Tickets
            </button>
            <Link to="/" className="btn-secondary w-full sm:w-auto justify-center">
              <Home className="w-5 h-5" />
              Back to Events
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
