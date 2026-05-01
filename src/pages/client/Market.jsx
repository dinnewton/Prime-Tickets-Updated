import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Calendar, MapPin, User, Search, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useAuthStore from '../../store/authStore';
import { marketApi, paymentsApi } from '../../services/api';

export default function Market() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Buy modal
  const [buyModal, setBuyModal] = useState(null);
  const [phone, setPhone] = useState('');
  const [buyStep, setBuyStep] = useState('form'); // form | polling | done | error
  const [buyMsg, setBuyMsg] = useState('');
  const [checkoutId, setCheckoutId] = useState(null);

  useEffect(() => {
    marketApi.list()
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll M-Pesa status
  useEffect(() => {
    if (buyStep !== 'polling' || !checkoutId) return;
    const id = setInterval(async () => {
      try {
        const res = await paymentsApi.pollStatus(checkoutId);
        if (res.status === 'success') {
          clearInterval(id);
          setBuyStep('done');
          setListings((prev) => prev.filter((l) => l.id !== buyModal?.id));
        } else if (['failed', 'cancelled', 'timeout'].includes(res.status)) {
          clearInterval(id);
          setBuyStep('error');
          setBuyMsg('Payment failed or was cancelled. Please try again.');
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(id);
  }, [buyStep, checkoutId, buyModal]);

  function openBuy(listing) {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBuyModal(listing);
    setPhone(user?.phone || '');
    setBuyStep('form');
    setBuyMsg('');
    setCheckoutId(null);
  }

  async function submitBuy(e) {
    e.preventDefault();
    setBuyStep('polling');
    try {
      const res = await marketApi.buy(buyModal.id, phone);
      setCheckoutId(res.checkoutRequestId);
    } catch (err) {
      setBuyStep('error');
      setBuyMsg(err.message);
    }
  }

  const filtered = listings.filter((l) =>
    !search ||
    l.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.venue?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Tag className="w-4 h-4" /> Resale Market
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Fan-to-Fan Ticket Resale</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              Buy tickets from other fans at fair prices. All listings are verified and capped at 150% of face value.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Search */}
          <div className="relative max-w-sm mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-10 !py-2.5 !text-sm"
            />
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Tag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings yet</h3>
              <p className="text-gray-400">Check back later — fans list tickets here when they can't attend.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {listing.image && (
                  <img src={listing.image} alt={listing.eventTitle} className="w-full h-36 object-cover" />
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{listing.eventTitle}</h3>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                      {listing.ticketType?.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                    {listing.eventDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmt(listing.eventDate)}{listing.eventTime ? ` · ${listing.eventTime}` : ''}
                      </div>
                    )}
                    {listing.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {listing.venue}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Seller: {listing.sellerName}
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-black text-primary-700">Ksh {listing.askingPrice?.toLocaleString()}</p>
                      {listing.originalPrice && listing.askingPrice !== listing.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">Ksh {listing.originalPrice?.toLocaleString()} face value</p>
                      )}
                    </div>
                    <button
                      onClick={() => openBuy(listing)}
                      className="btn-primary !py-2 !px-4 !text-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Buy Modal */}
      {buyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBuyModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Buy Ticket</h2>
              <button onClick={() => setBuyModal(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="font-semibold text-gray-900 text-sm">{buyModal.eventTitle}</p>
              <p className="text-xs text-gray-500">{buyModal.venue} · {buyModal.ticketType?.toUpperCase()}</p>
              <p className="text-2xl font-black text-primary-700 mt-2">Ksh {buyModal.askingPrice?.toLocaleString()}</p>
            </div>

            {buyStep === 'form' && (
              <form onSubmit={submitBuy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa phone number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">You will receive an STK push on this number</p>
                </div>
                <button type="submit" className="btn-primary w-full">Pay Ksh {buyModal.askingPrice?.toLocaleString()} via M-Pesa</button>
              </form>
            )}

            {buyStep === 'polling' && (
              <div className="text-center py-6">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
                <p className="font-semibold text-gray-800">Waiting for M-Pesa confirmation...</p>
                <p className="text-sm text-gray-500 mt-1">Check your phone and enter your M-Pesa PIN</p>
              </div>
            )}

            {buyStep === 'done' && (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-gray-900">Payment confirmed!</p>
                <p className="text-sm text-gray-500 mt-1">Your ticket has been added to My Tickets.</p>
                <button
                  onClick={() => { setBuyModal(null); navigate('/my-tickets'); }}
                  className="btn-primary mt-5 !py-2.5 !px-6"
                >
                  View My Tickets
                </button>
              </div>
            )}

            {buyStep === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{buyMsg || 'Payment failed'}</p>
                  <button onClick={() => setBuyStep('form')} className="text-xs underline mt-1">Try again</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
