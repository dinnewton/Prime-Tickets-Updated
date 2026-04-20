/**
 * PrimeTickets API client
 * All calls go through /api  which Vite proxies to http://localhost:5000
 */

const BASE = '/api';

function getToken() {
  try {
    // Zustand persists auth in localStorage under "prime-auth"
    const raw = localStorage.getItem('prime-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  vendorLogin: (email, password) => request('POST', '/auth/vendor/login', { email, password }),
  register: (data) => request('POST', '/auth/register', data),
  vendorRegister: (data) => request('POST', '/auth/vendor/register', data),
  googleLogin: (credential) => request('POST', '/auth/google', { credential }),
  me: () => request('GET', '/auth/me'),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/events${qs ? '?' + qs : ''}`);
  },
  get: (id) => request('GET', `/events/${id}`),
  create: (data) => request('POST', '/events', data),
  update: (id, data) => request('PUT', `/events/${id}`, data),
  delete: (id) => request('DELETE', `/events/${id}`),
  mine: () => request('GET', '/events/vendor/mine'),
};

// ─── Payments (M-Pesa) ────────────────────────────────────────────────────────
export const paymentsApi = {
  stkPush: (data) => request('POST', '/payments/mpesa/stk-push', data),
  pollStatus: (checkoutRequestId) =>
    request('GET', `/payments/mpesa/status/${checkoutRequestId}`),
};

// ─── Bookings (current user) ──────────────────────────────────────────────────
export const bookingsApi = {
  mine: () => request('GET', '/payments/bookings/mine'),
};

// ─── Resale Market ────────────────────────────────────────────────────────────
export const marketApi = {
  list: () => request('GET', '/market'),
  createListing: (data) => request('POST', '/market/list', data),
  cancelListing: (id) => request('DELETE', `/market/${id}`),
  buy: (id, phone) => request('POST', `/market/${id}/buy`, { phone }),
};

// ─── Transfers ────────────────────────────────────────────────────────────────
export const transfersApi = {
  transfer: (bookingId, recipientEmail) =>
    request('POST', '/transfers', { bookingId, recipientEmail }),
};

// ─── Networking ───────────────────────────────────────────────────────────────
export const networkApi = {
  updateProfile:  (data)           => request('PATCH', '/auth/profile', data),
  attendees:      (eventId)        => request('GET',   `/network/attendees/${eventId}`),
  connections:    ()               => request('GET',   '/network/connections'),
  requests:       ()               => request('GET',   '/network/requests'),
  connect:        (toUserId, eventId) => request('POST', '/network/connect', { toUserId, eventId }),
  respond:        (id, action)     => request('PATCH', `/network/connect/${id}`, { action }),
  thread:         (userId)         => request('GET',   `/network/messages/${userId}`),
  send:           (toUserId, text) => request('POST',  '/network/messages', { toUserId, text }),
  unread:         ()               => request('GET',   '/network/unread'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => request('GET', '/admin/dashboard'),
  users: () => request('GET', '/admin/users'),
  setUserStatus: (id, status) => request('PATCH', `/admin/users/${id}/status`, { status }),
  vendors: () => request('GET', '/vendors'),
  getVendor: (id) => request('GET', `/vendors/${id}`),
  updateVendor: (id, data) => request('PATCH', `/vendors/${id}`, data),
  setVendorStatus: (id, status) => request('PATCH', `/vendors/${id}/status`, { status }),
  toggleVerify: (id) => request('PATCH', `/vendors/${id}/verify`),
  setCommission: (id, commission) => request('PATCH', `/vendors/${id}/commission`, { commission }),
  deleteVendor: (id) => request('DELETE', `/vendors/${id}`),
  vendorEvents: (id) => request('GET', `/vendors/${id}/events`),
  payments: () => request('GET', '/payments'),
  bookings: () => request('GET', '/payments/bookings'),
};
