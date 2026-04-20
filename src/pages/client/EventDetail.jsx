import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Clock, Users, Tag, ArrowLeft,
  Share2, Heart, CheckCircle, Ticket, Star, Wifi, UserPlus, UserCheck,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getEventById } from '../../data/events';
import { getVendorById } from '../../data/vendors';
import useEventStore from '../../store/eventStore';
import useAuthStore from '../../store/authStore';
import { networkApi } from '../../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function soldPercent(sold, total) {
  return Math.min(Math.round((sold / total) * 100), 100);
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = getEventById(id);
  const { addToCart } = useEventStore();
  const { isAuthenticated, user } = useAuthStore();

  const [selectedType, setSelectedType] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const [attendees, setAttendees] = useState([]);
  const [connectingId, setConnectingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    networkApi.attendees(id).then(setAttendees).catch(() => {});
  }, [id, isAuthenticated]);

  async function handleConnect(attendee) {
    setConnectingId(attendee.id);
    try {
      await networkApi.connect(attendee.id, id);
      setAttendees((prev) =>
        prev.map((a) => a.id === attendee.id ? { ...a, connectionStatus: 'pending' } : a)
      );
    } catch {}
    setConnectingId(null);
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Event not found</h2>
            <Link to="/" className="btn-primary mt-4">Back to Events</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const vendor = getVendorById(event.vendorId);
  const sold = soldPercent(event.soldTickets, event.totalTickets);
  const price = selectedType === 'vip' ? event.vipPrice : event.price;

  const handleAddToCart = () => {
    addToCart(event, selectedType, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(event, selectedType, quantity);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all"
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: event info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="badge-purple">{event.category}</span>
                  {event.tags.map((tag) => (
                    <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{event.title}</h1>
                <p className="text-gray-500">Organised by <span className="font-semibold text-primary-700">{event.vendorName}</span></p>
              </div>

              {/* Key info */}
              <div className="card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Date</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Time</p>
                    <p className="font-semibold text-gray-900 text-sm">{event.time} — {event.endTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Venue</p>
                    <p className="font-semibold text-gray-900 text-sm">{event.venue}</p>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>

              {/* Ticket availability */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Ticket Availability</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    {event.soldTickets.toLocaleString()} / {event.totalTickets.toLocaleString()} sold
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sold >= 90 ? 'bg-red-500' : sold >= 70 ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${sold}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{100 - sold}% of tickets remaining</p>
              </div>

              {/* Organiser */}
              {vendor && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Organiser</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
                      {vendor.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-500 mb-2">{vendor.category}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{vendor.bio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendee Networking */}
              {isAuthenticated && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-primary-600" /> Who's Going
                    </h2>
                    <Link to="/network" className="text-xs text-primary-600 font-semibold hover:underline">My Network</Link>
                  </div>

                  {attendees.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      {user?.networkingOptIn === false
                        ? 'Enable networking in your profile to see other attendees.'
                        : 'No opted-in attendees yet — be the first to connect!'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendees.slice(0, 6).map((a) => (
                        <div key={a.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {a.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{a.name}</p>
                            {a.profession && <p className="text-xs text-gray-400 truncate">{a.profession}</p>}
                            {a.interests?.length > 0 && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {a.interests.slice(0, 3).map((i) => (
                                  <span key={i} className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full">{i}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {a.connectionStatus === 'accepted' ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                              <UserCheck className="w-3.5 h-3.5" /> Connected
                            </span>
                          ) : a.connectionStatus === 'pending' ? (
                            <span className="text-xs text-gray-400 font-medium">Pending</span>
                          ) : (
                            <button
                              onClick={() => handleConnect(a)}
                              disabled={connectingId === a.id}
                              className="flex items-center gap-1 text-xs font-semibold text-primary-600 border border-primary-200 hover:border-primary-400 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Connect
                            </button>
                          )}
                        </div>
                      ))}
                      {attendees.length > 6 && (
                        <p className="text-xs text-gray-400 text-center pt-1">+{attendees.length - 6} more attendees</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Ticket purchase widget */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Select Tickets</h2>

                {/* Ticket type */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-gray-700">Ticket Type</p>

                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedType === 'standard' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="ticketType"
                        value="standard"
                        checked={selectedType === 'standard'}
                        onChange={() => setSelectedType('standard')}
                        className="accent-primary-600"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-primary-600" />
                          Standard
                        </p>
                        <p className="text-xs text-gray-500">General admission</p>
                      </div>
                    </div>
                    <span className="font-black text-lg text-gray-900">Ksh {event.price.toLocaleString()}</span>
                  </label>

                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedType === 'vip' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="ticketType"
                        value="vip"
                        checked={selectedType === 'vip'}
                        onChange={() => setSelectedType('vip')}
                        className="accent-primary-600"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                          VIP
                        </p>
                        <p className="text-xs text-gray-500">Priority access + perks</p>
                      </div>
                    </div>
                    <span className="font-black text-lg text-gray-900">Ksh {event.vipPrice.toLocaleString()}</span>
                  </label>
                </div>

                {/* Quantity */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="text-2xl font-black text-gray-900 w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{quantity}x {selectedType === 'vip' ? 'VIP' : 'Standard'} ticket</span>
                    <span>Ksh {(price * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Service fee</span>
                    <span>Ksh {Math.round(price * quantity * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-black text-lg text-gray-900">
                    <span>Total</span>
                    <span>Ksh {Math.round(price * quantity * 1.05).toLocaleString()}</span>
                  </div>
                </div>

                {/* Buttons */}
                <button
                  onClick={handleBuyNow}
                  className="btn-primary w-full justify-center mb-3"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className={`w-full justify-center flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition-all ${
                    added
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-primary-600 text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Added to Cart!
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Secure checkout · Instant e-ticket delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
