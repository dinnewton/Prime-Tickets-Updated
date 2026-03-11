import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, Ticket } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function Confirmation() {
  const { state } = useLocation();
  const orderRef = `PT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-8">
            Your tickets are on their way.{state?.email && (
              <> Check <span className="font-semibold text-gray-700">{state.email}</span> for your e-tickets.</>
            )}
          </p>

          {/* Order card */}
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Ticket className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Order Reference</span>
            </div>
            <div className="bg-primary-50 rounded-2xl px-8 py-4 mb-4">
              <p className="text-3xl font-black text-primary-700 tracking-widest">{orderRef}</p>
            </div>
            {state?.total && (
              <p className="text-gray-500 text-sm">
                Total paid: <span className="font-bold text-gray-900">Ksh {state.total.toLocaleString()}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary">
              <Download className="w-5 h-5" />
              Download Tickets
            </button>
            <Link to="/" className="btn-secondary">
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
