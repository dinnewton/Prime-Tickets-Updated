import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Client pages
import Home from './pages/client/Home';
import EventDetail from './pages/client/EventDetail';
import Checkout from './pages/client/Checkout';
import Confirmation from './pages/client/Confirmation';
import MyTickets from './pages/client/MyTickets';
import Market from './pages/client/Market';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VendorRegister from './pages/auth/VendorRegister';
import AdminLogin from './pages/auth/AdminLogin';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminVendors from './pages/admin/Vendors';
import AdminUsers from './pages/admin/Users';

// Vendor pages
import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorEvents from './pages/vendor/Events';
import CreateEvent from './pages/vendor/CreateEvent';

// Chat
import ChatWidget from './components/chat/ChatWidget';
import AdminChat from './pages/admin/Chat';

// Admin route guard — redirects to the hidden admin login, not the public one
function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin')
    return <Navigate to="/secure/admin/login" replace />;
  return children;
}

// Vendor/client route guard
function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to="/" replace />;
  return children;
}

function ClientChatWidget() {
  const { user } = useAuthStore();
  if (user?.role === 'admin' || user?.role === 'vendor') return null;
  return <ChatWidget />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ClientChatWidget />
      <Routes>
        {/* Public / Client */}
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/market" element={<Market />} />

        {/* Public Auth — vendor & client only */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendor/register" element={<VendorRegister />} />

        {/* Hidden Admin Login — not linked from anywhere public */}
        <Route path="/secure/admin/login" element={<AdminLogin />} />

        {/* Admin — protected, redirects to hidden login */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>

        {/* Vendor */}
        <Route
          path="/vendor"
          element={
            <RequireAuth allowedRoles={['vendor']}>
              <VendorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="events" element={<VendorEvents />} />
          <Route path="events/create" element={<CreateEvent />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
