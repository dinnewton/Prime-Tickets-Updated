import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, ArrowRightLeft, Tag, X, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useAuthStore from '../../store/authStore';
import { bookingsApi, transfersApi, marketApi } from '../../services/api';

const STATUS_STYLE = {
  active:      'bg-green-100 text-green-700',
  listed:      'bg-amber-100 text-amber-700',
  transferred: 'bg-blue-100 text-blue-700',
  sold:        'bg-purple-100 text-purple-700',
};

export default function MyTickets() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer modal state
  const [transferModal, setTransferModal] = useState(null); // booking
  const [transferEmail, setTransferEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState(null);

  // Sell modal state
  const [sellModal, setSellModal] = useState(null); // booking
  const [askingPrice, setAskingPrice] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    bookingsApi.mine()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  // ─── Transfer ─────────────────────────────────────────────────────────────
  function openTransfer(booking) {
    setTransferModal(booking);
    setTransferEmail('');
    setTransferMsg(null);
  }

  async function submitTransfer(e) {
    e.preventDefault();
    setTransferLoading(true);
    setTransferMsg(null);
    try {
      await transfersApi.transfer(transferModal.id, transferEmail);
      setTransferMsg({ ok: true, text: `Ticket transferred to ${transferEmail}` });
      setBookings((prev) =>
        prev.map((b) => (b.id === transferModal.id ? { ...b, status: 'transferred' } : b))
      );
    } catch (e) {
      setTransferMsg({ ok: false, text: e.message });
    } finally {
      setTransferLoading(false);
    }
  }

  // ─── Sell ─────────────────────────────────────────────────────────────────
  function openSell(booking) {
    setSellModal(booking);
    setAskingPrice(String(booking.unitPrice));
    setSellMsg(null);
  }

  async function submitSell(e) {
    e.preventDefault();
    setSellLoading(true);
    setSellMsg(null);
    try {
      await marketApi.createListing({ bookingId: sellModal.id, askingPrice: Number(askingPrice) });
      setSellMsg({ ok: true, text: 'Ticket listed on the resale market!' });
      setBookings((prev) =>
        prev.map((b) => (b.id === sellModal.id ? { ...b, status: 'listed' } : b))
      );
    } catch (e) {
      setSellMsg({ ok: false, text: e.message });
    } finally {
      setSellLoading(false);
    }
  }

  async function cancelListing(booking) {
    try {
      await marketApi.cancelListing(booking.listingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'active', listingId: null } : b))
      );
    } catch (e) {
      alert(e.message);
    }
  }

  const active = bookings.filter((b) => !['transferred', 'sold'].includes(b.status));
  const past   = bookings.filter((b) => ['transferred', 'sold'].includes(b.status));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
              <p className="text-gray-500 text-sm mt-1">{active.length} active ticket{active.length !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/market" className="btn-outline !py-2 !px-4 !text-sm">
              Browse Resale Market
            </Link>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h3>
              <p className="text-gray-400 mb-6">Book your first event and your tickets will appear here.</p>
              <Link to="/" className="btn-primary !py-2.5 !px-6">Browse Events</Link>
            </div>
          )}

          {/* Active tickets */}
          {active.length > 0 && (
            <section className="space-y-4 mb-10">
              {active.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onTransfer={() => openTransfer(b)}
                  onSell={() => openSell(b)}
                  onCancelListing={() => cancelListing(b)}
                />
              ))}
            </section>
          )}

          {/* Past / transferred tickets */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Past & Transferred</h2>
              <div className="space-y-4">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} readOnly />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* Transfer Modal */}
      {transferModal && (
        <Modal title="Transfer Ticket" onClose={() => setTransferModal(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Transfer <strong>{transferModal.eventTitle}</strong> ({transferModal.ticketType?.toUpperCase()}) to another PrimeTickets user.
            This action is <span className="font-semibold text-red-600">irreversible</span>.
          </p>
          {transferMsg ? (
            <Feedback ok={transferMsg.ok} text={transferMsg.text} />
          ) : (
            <form onSubmit={submitTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient email</label>
                <input
                  type="email"
                  required
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={transferLoading} className="btn-primary w-full">
                {transferLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Transfer Ticket'}
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Sell Modal */}
      {sellModal && (
        <Modal title="List for Resale" onClose={() => setSellModal(null)}>
          <p className="text-sm text-gray-600 mb-1">
            <strong>{sellModal.eventTitle}</strong> · {sellModal.ticketType?.toUpperCase()}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Original price: R{sellModal.unitPrice?.toLocaleString()} · Max allowed: R{Math.ceil(sellModal.unitPrice * 1.5)?.toLocaleString()}
          </p>
          {sellMsg ? (
            <Feedback ok={sellMsg.ok} text={sellMsg.text} />
          ) : (
            <form onSubmit={submitSell} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your asking price (R)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Math.ceil(sellModal.unitPrice * 1.5)}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">Capped at 150 % of original to protect buyers</p>
              </div>
              <button type="submit" disabled={sellLoading} className="btn-primary w-full">
                {sellLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'List on Market'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

function BookingCard({ booking, onTransfer, onSell, onCancelListing, readOnly }) {
  const fmt = (d) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const isUpcoming = booking.eventDate && new Date(booking.eventDate) >= new Date();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
      {booking.image && (
        <img src={booking.image} alt={booking.eventTitle} className="w-full sm:w-36 h-32 sm:h-auto object-cover flex-shrink-0" />
      )}
      <div className="flex-1 p-5 flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{booking.eventTitle}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{booking.venue}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.eventDate ? fmt(booking.eventDate) : ''}{booking.eventTime ? ` · ${booking.eventTime}` : ''}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${STATUS_STYLE[booking.status] || 'bg-gray-100 text-gray-600'}`}>
            {booking.status === 'listed' ? 'On Market' : booking.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">{booking.ticketType?.toUpperCase()}</span>
          <span>×{booking.quantity}</span>
          <span className="font-semibold text-gray-900">R{booking.totalPrice?.toLocaleString()}</span>
          {booking.orderRef && <span className="text-xs text-gray-400">Ref: {booking.orderRef}</span>}
          {booking.mpesaCode && <span className="text-xs text-gray-400">MPesa: {booking.mpesaCode}</span>}
          {booking.purchasedViaResale && (
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Resale purchase</span>
          )}
          {booking.transferredFrom && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Transferred to you</span>
          )}
        </div>

        {!readOnly && booking.status === 'active' && isUpcoming && (
          <div className="flex items-center gap-2 mt-1">
            <button onClick={onTransfer} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-all">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
            </button>
            <button onClick={onSell} className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-all">
              <Tag className="w-3.5 h-3.5" /> Sell
            </button>
          </div>
        )}
        {!readOnly && booking.status === 'listed' && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-amber-600 font-medium">Listed on resale market</span>
            <button onClick={onCancelListing} className="text-xs text-red-500 hover:text-red-700 underline">Cancel listing</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Feedback({ ok, text }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
