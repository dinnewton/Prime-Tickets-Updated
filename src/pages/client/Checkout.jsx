import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Calendar, MapPin, ArrowLeft,
  Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw,
  Shield, Clock,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useEventStore from '../../store/eventStore';

// M-Pesa STK push states
const MPESA_STATE = {
  IDLE: 'idle',
  SENDING: 'sending',
  WAITING: 'waiting',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart, cartTotal } = useEventStore();
  const [step, setStep] = useState(1); // 1 = cart, 2 = details, 3 = mpesa
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaState, setMpesaState] = useState(MPESA_STATE.IDLE);
  const [countdown, setCountdown] = useState(60);
  const [pushRef, setPushRef] = useState('');

  const subtotal = cartTotal();
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  // Countdown timer while waiting for M-Pesa push
  useEffect(() => {
    if (mpesaState !== MPESA_STATE.WAITING) return;
    if (countdown <= 0) {
      setMpesaState(MPESA_STATE.TIMEOUT);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mpesaState, countdown]);

  const sendStkPush = async () => {
    if (!mpesaPhone.match(/^(07|01|\+2547|\+2541|2547|2541)\d{8}$/)) {
      alert('Please enter a valid Safaricom number (e.g. 0712 345 678)');
      return;
    }

    setMpesaState(MPESA_STATE.SENDING);
    setPushRef('');

    // Simulate API call to M-Pesa STK push endpoint
    await new Promise((r) => setTimeout(r, 2000));

    const ref = `PT${Date.now().toString().slice(-8)}`;
    setPushRef(ref);
    setMpesaState(MPESA_STATE.WAITING);
    setCountdown(60);

    // Simulate user approving the push after ~5 seconds
    setTimeout(() => {
      setMpesaState(MPESA_STATE.SUCCESS);
    }, 5000);
  };

  const handleConfirmPayment = () => {
    clearCart();
    navigate('/confirmation', { state: { total, email: form.email, ref: pushRef, mpesa: true } });
  };

  const formatPhone = (val) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('254')) cleaned = '0' + cleaned.slice(3);
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) cleaned = '0' + cleaned;
    return cleaned.slice(0, 10);
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
          {/* Header */}
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
            {['Cart', 'Your Details', 'M-Pesa Payment'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i + 1 < step
                      ? 'bg-green-500 text-white'
                      : i + 1 === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    i + 1 === step ? 'text-primary-700' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                {i < 2 && (
                  <div className={`h-px w-8 sm:w-12 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: steps */}
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
                        <img
                          src={item.image}
                          alt={item.eventTitle}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">{item.eventTitle}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.eventDate).toLocaleDateString('en-KE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {item.eventTime}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {item.venue}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`badge ${
                                item.ticketType === 'vip' ? 'badge-amber' : 'badge-purple'
                              }`}
                            >
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
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary w-full justify-center mt-6"
                  >
                    Continue to Details
                  </button>
                </div>
              )}

              {/* Step 2: Personal details */}
              {step === 2 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Pre-fill mpesa phone from contact phone
                    setMpesaPhone(formatPhone(form.phone));
                    setStep(3);
                  }}
                  className="card p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Your Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        First name
                      </label>
                      <input
                        name="firstName"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="input-field"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Last name
                      </label>
                      <input
                        name="lastName"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="input-field"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      M-Pesa phone number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field"
                      placeholder="0712 345 678"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your Safaricom M-Pesa number for payment
                    </p>
                  </div>
                  <button type="submit" className="btn-primary w-full justify-center">
                    Continue to Payment
                  </button>
                </form>
              )}

              {/* Step 3: M-Pesa Payment */}
              {step === 3 && (
                <div className="card p-6">
                  {/* M-Pesa header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Pay via M-Pesa</h2>
                      <p className="text-sm text-gray-500">Lipa Na M-Pesa · STK Push</p>
                    </div>
                    {/* M-Pesa logo colours */}
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-red-600" />
                      <div className="w-4 h-4 rounded-full bg-green-600" />
                      <span className="text-xs font-black text-gray-700 ml-1">M-PESA</span>
                    </div>
                  </div>

                  {/* IDLE — phone input */}
                  {mpesaState === MPESA_STATE.IDLE && (
                    <div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
                        <strong>How it works:</strong> Enter your M-Pesa number below. We'll send a
                        push notification to your phone. Enter your M-Pesa PIN to confirm.
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          M-Pesa Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium">🇰🇪 +254</span>
                            <div className="w-px h-5 bg-gray-300" />
                          </div>
                          <input
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(formatPhone(e.target.value))}
                            className="input-field !pl-24"
                            placeholder="0712 345 678"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Safaricom numbers only (07xx or 01xx)
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between text-sm font-bold text-gray-900">
                          <span>Amount to pay</span>
                          <span className="text-green-700 text-lg">Ksh {total.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Includes 5% service fee (Ksh {serviceFee.toLocaleString()})
                        </p>
                      </div>
                      <button
                        onClick={sendStkPush}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-base"
                      >
                        <Smartphone className="w-5 h-5" />
                        Send M-Pesa Push — Ksh {total.toLocaleString()}
                      </button>
                    </div>
                  )}

                  {/* SENDING */}
                  {mpesaState === MPESA_STATE.SENDING && (
                    <div className="text-center py-10">
                      <Loader2 className="w-14 h-14 text-green-600 animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Sending Push Request...</h3>
                      <p className="text-gray-500 text-sm">
                        Connecting to M-Pesa servers. Please wait.
                      </p>
                    </div>
                  )}

                  {/* WAITING */}
                  {mpesaState === MPESA_STATE.WAITING && (
                    <div className="text-center py-8">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 rounded-full border-4 border-green-100 flex items-center justify-center">
                          <Smartphone className="w-9 h-9 text-green-600" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-green-600 border-transparent animate-spin" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Check Your Phone!
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        A push notification has been sent to
                      </p>
                      <p className="font-bold text-gray-900 text-lg mb-4">{mpesaPhone}</p>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
                        <p className="text-xs font-bold text-green-800 mb-2 uppercase tracking-wide">
                          On your phone:
                        </p>
                        <ol className="text-sm text-green-900 space-y-1 list-decimal list-inside">
                          <li>Open the M-Pesa prompt</li>
                          <li>Confirm amount: <strong>Ksh {total.toLocaleString()}</strong></li>
                          <li>Enter your M-Pesa PIN</li>
                          <li>Press OK to complete payment</li>
                        </ol>
                      </div>

                      {/* Reference */}
                      {pushRef && (
                        <p className="text-xs text-gray-400 mb-4">
                          Reference: <span className="font-mono font-bold text-gray-600">{pushRef}</span>
                        </p>
                      )}

                      {/* Countdown */}
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                        <Clock className="w-4 h-4" />
                        Expires in{' '}
                        <span className={`font-bold ${countdown < 15 ? 'text-red-500' : 'text-gray-900'}`}>
                          {countdown}s
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setMpesaState(MPESA_STATE.IDLE);
                          setCountdown(60);
                        }}
                        className="text-sm text-primary-600 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend push
                      </button>
                    </div>
                  )}

                  {/* SUCCESS */}
                  {mpesaState === MPESA_STATE.SUCCESS && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed!</h3>
                      <p className="text-gray-500 mb-1">
                        M-Pesa payment of{' '}
                        <span className="font-bold text-gray-900">Ksh {total.toLocaleString()}</span>{' '}
                        received.
                      </p>
                      {pushRef && (
                        <p className="text-xs text-gray-400 mb-6">
                          M-Pesa Ref:{' '}
                          <span className="font-mono font-bold text-gray-600 uppercase">{pushRef}</span>
                        </p>
                      )}
                      <button
                        onClick={handleConfirmPayment}
                        className="btn-primary !bg-green-600 hover:!bg-green-700 !shadow-green-600/30 px-10"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Get My Tickets
                      </button>
                    </div>
                  )}

                  {/* FAILED / TIMEOUT */}
                  {(mpesaState === MPESA_STATE.FAILED ||
                    mpesaState === MPESA_STATE.TIMEOUT) && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <XCircle className="w-12 h-12 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {mpesaState === MPESA_STATE.TIMEOUT
                          ? 'Payment Timed Out'
                          : 'Payment Failed'}
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {mpesaState === MPESA_STATE.TIMEOUT
                          ? "The payment request expired. Please try again."
                          : "Your payment was not completed. Please try again."}
                      </p>
                      <button
                        onClick={() => {
                          setMpesaState(MPESA_STATE.IDLE);
                          setCountdown(60);
                        }}
                        className="btn-primary"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Footer trust bar */}
                  {mpesaState === MPESA_STATE.IDLE && (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                      <Shield className="w-3.5 h-3.5" />
                      Secured by Safaricom M-Pesa · No card details stored
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Order summary */}
            <div>
              <div className="card p-6 sticky top-24">
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

                {/* M-Pesa badge */}
                <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                  </div>
                  <span className="text-xs font-bold text-green-800">
                    Pay via M-Pesa STK Push
                  </span>
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
