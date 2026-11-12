import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle, AlertCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import useEventStore from '../../store/eventStore';
import { paymentsApi } from '../../services/api';

// Where Paystack sends the customer back to. The payment is confirmed with
// our server (which asks Paystack), never from anything in the URL.
export default function PaymentComplete() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearCart } = useEventStore();
  const [state, setState] = useState('checking'); // checking | failed | missing
  const [message, setMessage] = useState('');
  const tries = useRef(0);

  const reference = params.get('reference') || params.get('trxref') || sessionStorage.getItem('pt-pending-payment');

  useEffect(() => {
    if (!reference) { setState('missing'); return; }
    let stop = false;

    const check = async () => {
      try {
        // The key is only sent for the payment it was issued for
        const [keyRef, key] = (sessionStorage.getItem('pt-payment-key') || '').split(':');
        const res = await paymentsApi.verify(reference, keyRef === reference ? key : undefined);
        if (stop) return;
        if (res.status === 'success') {
          sessionStorage.removeItem('pt-pending-payment');
          sessionStorage.removeItem('pt-payment-key');
          clearCart();
          navigate('/confirmation', {
            replace: true,
            state: { ref: res.orderRef, total: res.amount, email: res.email, cart: res.cart, paymentRef: res.paymentRef, tickets: res.tickets || [] },
          });
          return;
        }
        if (['failed', 'cancelled'].includes(res.status)) {
          setState('failed');
          setMessage(res.message || 'The payment did not go through. No money was taken.');
          return;
        }
        if (res.status === 'refund_due') {
          sessionStorage.removeItem('pt-pending-payment');
          sessionStorage.removeItem('pt-payment-key');
          setState('refund');
          setMessage(`${res.message || 'Your payment was received but the tickets are no longer available. We will refund you in full.'} Your reference is ${res.orderRef}.`);
          return;
        }
        if (res.status === 'underpaid') {
          setState('failed');
          setMessage(res.message || 'The amount paid was less than the ticket price. Please contact support.');
          return;
        }
        // still pending — Paystack may take a few seconds to settle
        if (++tries.current > 20) {
          setState('failed');
          setMessage("We haven't had confirmation yet. If money left your account, your tickets will appear in My Tickets shortly — please check your email.");
          return;
        }
        setTimeout(check, 3000);
      } catch (err) {
        if (stop) return;
        if (err.status === 404) { setState('missing'); return; }
        if (++tries.current > 20) { setState('failed'); setMessage(err.message); return; }
        setTimeout(check, 3000);
      }
    };

    check();
    return () => { stop = true; };
  }, [reference, navigate, clearCart]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          {state === 'checking' && (
            <>
              <Loader2 className="w-14 h-14 text-primary-600 animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your payment</h1>
              <p className="text-gray-500">This takes a few seconds. Please don't close this page.</p>
            </>
          )}

          {state === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment not completed</h1>
              <p className="text-gray-500 mb-8">{message}</p>
              <div className="flex gap-3 justify-center">
                <Link to="/checkout" className="btn-primary">Try again</Link>
                <Link to="/my-tickets" className="btn-outline">My Tickets</Link>
              </div>
            </>
          )}

          {state === 'refund' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Tickets no longer available</h1>
              <p className="text-gray-500 mb-8">{message}</p>
              <div className="flex gap-3 justify-center">
                <Link to="/events" className="btn-primary">Browse events</Link>
                <Link to="/help" className="btn-outline">Get help</Link>
              </div>
            </>
          )}

          {state === 'missing' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Nothing to confirm</h1>
              <p className="text-gray-500 mb-8">
                We couldn't find a payment to check. If you've just paid, your tickets are in My Tickets and your email.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/my-tickets" className="btn-primary">My Tickets</Link>
                <Link to="/" className="btn-outline">Browse events</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
