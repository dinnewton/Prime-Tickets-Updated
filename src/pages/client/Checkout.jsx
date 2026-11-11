import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Calendar, MapPin, ArrowLeft,
  Loader2, Shield, CreditCard, Smartphone, AlertCircle, Lock,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useEventStore from '../../store/eventStore';
import useAuthStore from '../../store/authStore';
import { paymentsApi } from '../../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, cartTotal } = useEventStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1); // 1 = cart, 2 = details, 3 = payment
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Shown as a guide — the server prices the order again before charging
  const subtotal = cartTotal();
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const payWithPaystack = async () => {
    setError('');
    setSending(true);
    try {
      const res = await paymentsApi.init({
        cart: cart.map((item) => ({
          eventId: item.eventId || item.id,
          ticketType: item.ticketType,
          quantity: item.quantity,
        })),
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        phone: form.phone,
      });
      // Remember the order so the return page can finish up even on a new tab
      sessionStorage.setItem('pt-pending-payment', res.reference);
      if (res.accessKey) sessionStorage.setItem('pt-payment-key', `${res.reference}:${res.accessKey}`);
      window.location.href = res.authorizationUrl;
    } catch (err) {
      setError(err.message || 'Could not start the payment. Please try again.');
      setSending(false);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Find an event and add tickets to get started.</p>
            <Link to="/" className="btn-primary">Browse Events</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {['Cart', 'Your Details', 'Payment'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i + 1 < step ? 'bg-green-500 text-white'
                      : i + 1 === step ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i + 1 === step ? 'text-primary-700' : 'text-gray-500'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`h-px w-8 sm:w-12 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Step 1: Cart */}
              {step === 1 && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Your Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </h2>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        <img src={item.image} alt={item.eventTitle} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">{item.eventTitle}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.eventDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}{item.eventTime}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {item.venue}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`badge ${item.ticketType === 'vip' ? 'badge-amber' : 'badge-purple'}`}>
                              {item.ticketType.toUpperCase()} × {item.quantity}
                            </span>
                            <span className="font-bold text-gray-900">
                              Ksh {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} className="btn-primary w-full justify-center mt-6">
                    Continue to Details
                  </button>
                </div>
              )}

              {/* Step 2: Personal details */}
              {step === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Your Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                      <input
                        required value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="input-field" placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                      <input
                        required value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="input-field" placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input
                      type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field" placeholder="john@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your tickets and QR codes are sent here</p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                    <input
                      type="tel" required value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field" placeholder="0712 345 678"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for your M-Pesa prompt and ticket SMS</p>
                  </div>
                  <button type="submit" className="btn-primary w-full justify-center">Continue to Payment</button>
                </form>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Pay for your tickets</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    You'll be taken to our payment partner Paystack to finish securely, then brought
                    straight back with your tickets.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                      <Smartphone className="w-6 h-6 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">M-Pesa</p>
                        <p className="text-xs text-gray-500">Pay from your phone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                      <CreditCard className="w-6 h-6 text-primary-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Card</p>
                        <p className="text-xs text-gray-500">Visa & Mastercard</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Paying as</span>
                      <span className="font-medium text-gray-900">{form.email}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900">
                      <span>Amount</span>
                      <span>Ksh {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={payWithPaystack}
                    disabled={sending}
                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-base"
                  >
                    {sending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Taking you to Paystack...</>
                    ) : (
                      <><Lock className="w-5 h-5" /> Pay Ksh {total.toLocaleString()}</>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                    <Shield className="w-3.5 h-3.5" />
                    Secured by Paystack · We never see your card or PIN
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div>
              <div className="card p-6 lg:sticky lg:top-24">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 line-clamp-1 pr-2">
                        {item.eventTitle} ({item.ticketType.toUpperCase()}) ×{item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900 shrink-0">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>Ksh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service fee (5%)</span>
                    <span>Ksh {serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>Ksh {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
