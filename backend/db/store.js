/**
 * File-persisted data store.
 * Reads from db/data.json on startup; writes back on every mutation.
 * Falls back to seed data if the file doesn't exist yet.
 */
const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data.json');

// ─── SEED DATA (used only when no data.json exists) ──────────────────────────
const seedUsers = [
  {
    id: 'u1',
    name: 'James Kamau',
    email: 'client@primetickets.co.ke',
    password: bcrypt.hashSync('client123', 10),
    role: 'client',
    avatar: null,
    totalSpent: 12500,
    ticketsBought: 5,
    joinedAt: '2025-08-15',
    status: 'active',
  },
  {
    id: 'u2',
    name: 'Wanjiku Mwangi',
    email: 'wanjiku@example.com',
    password: bcrypt.hashSync('pass123', 10),
    role: 'client',
    avatar: null,
    totalSpent: 8200,
    ticketsBought: 3,
    joinedAt: '2025-09-22',
    status: 'active',
  },
  {
    id: 'u3',
    name: 'Otieno Ochieng',
    email: 'otieno@example.com',
    password: bcrypt.hashSync('pass123', 10),
    role: 'client',
    avatar: null,
    totalSpent: 5500,
    ticketsBought: 2,
    joinedAt: '2025-11-10',
    status: 'active',
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@primetickets.co.ke',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    avatar: null,
    joinedAt: '2025-01-01',
    status: 'active',
  },
];

const seedVendors = [
  {
    id: 'v1',
    name: 'SoundWave Events',
    ownerName: 'Brian Otieno',
    email: 'vendor@primetickets.co.ke',
    password: bcrypt.hashSync('vendor123', 10),
    phone: '0722100200',
    category: 'Music & Festivals',
    description: "East Africa's leading music event organiser.",
    logo: null,
    totalRevenue: 9550000,
    totalEvents: 12,
    status: 'active',
    commission: 5,
    joinedAt: '2025-03-10',
    verified: true,
  },
  {
    id: 'v2',
    name: 'Laugh Factory KE',
    ownerName: 'Grace Njeri',
    email: 'grace@laughfactory.co.ke',
    password: bcrypt.hashSync('pass123', 10),
    phone: '0733200300',
    category: 'Comedy & Entertainment',
    description: 'Bringing laughter to Nairobi and beyond.',
    logo: null,
    totalRevenue: 2100000,
    totalEvents: 6,
    status: 'active',
    commission: 5,
    joinedAt: '2025-05-20',
    verified: true,
  },
  {
    id: 'v3',
    name: 'KE Sports Events',
    ownerName: 'Peter Maina',
    email: 'peter@kesports.co.ke',
    password: bcrypt.hashSync('pass123', 10),
    phone: '0700300400',
    category: 'Sports',
    description: 'Sports event management and ticketing.',
    logo: null,
    totalRevenue: 24100000,
    totalEvents: 8,
    status: 'active',
    commission: 5,
    joinedAt: '2025-04-05',
    verified: false,
  },
  {
    id: 'v4',
    name: 'TechHub Africa',
    ownerName: 'Amina Hassan',
    email: 'amina@techhub.africa',
    password: bcrypt.hashSync('pass123', 10),
    phone: '0711400500',
    category: 'Tech & Business',
    description: "Africa's premier tech conference organiser.",
    logo: null,
    totalRevenue: 15300000,
    totalEvents: 4,
    status: 'suspended',
    commission: 5,
    joinedAt: '2025-06-15',
    verified: true,
  },
];

const seedEvents = [
  {
    id: 'e1',
    title: 'Neon Pulse Music Festival',
    category: 'Music',
    vendorId: 'v1',
    vendorName: 'SoundWave Events',
    date: '2026-04-12',
    time: '18:00',
    endTime: '23:59',
    venue: 'KICC Grounds, Nairobi',
    city: 'Nairobi',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    price: 2500,
    vipPrice: 7500,
    description: 'Experience the ultimate music festival featuring top DJs and live acts from across Africa and beyond.',
    totalTickets: 5000,
    soldTickets: 3820,
    featured: true,
    status: 'on_sale',
    tags: ['DJ', 'Live Music', 'Outdoor'],
    createdAt: '2025-12-01',
  },
  {
    id: 'e2',
    title: 'Nairobi Comedy Nights',
    category: 'Comedy',
    vendorId: 'v2',
    vendorName: 'Laugh Factory KE',
    date: '2026-04-18',
    time: '20:00',
    endTime: '22:30',
    venue: 'Kenya National Theatre, Nairobi',
    city: 'Nairobi',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop',
    price: 1500,
    vipPrice: 3500,
    description: "Kenya's funniest comedians take the stage for an unforgettable night of laughter.",
    totalTickets: 800,
    soldTickets: 710,
    featured: true,
    status: 'almost_sold_out',
    tags: ['Stand-up', 'Comedy', 'Indoor'],
    createdAt: '2025-12-10',
  },
  {
    id: 'e3',
    title: 'Harambee Stars vs Cranes',
    category: 'Sports',
    vendorId: 'v3',
    vendorName: 'KE Sports Events',
    date: '2026-05-02',
    time: '15:00',
    endTime: '17:00',
    venue: 'Kasarani Stadium, Nairobi',
    city: 'Nairobi',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
    price: 500,
    vipPrice: 3000,
    description: 'Watch Harambee Stars take on Uganda Cranes in this fiercely contested AFCON qualifier.',
    totalTickets: 60000,
    soldTickets: 48200,
    featured: true,
    status: 'on_sale',
    tags: ['Football', 'Sport', 'International'],
    createdAt: '2025-12-15',
  },
  {
    id: 'e4',
    title: 'AfriTech Summit 2026',
    category: 'Tech & Business',
    vendorId: 'v4',
    vendorName: 'TechHub Africa',
    date: '2026-05-14',
    time: '09:00',
    endTime: '17:00',
    venue: 'Sarit Expo Centre, Nairobi',
    city: 'Nairobi',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    price: 8500,
    vipPrice: 25000,
    description: "Africa's premier technology conference returns with keynote speakers and startup showcases.",
    totalTickets: 3000,
    soldTickets: 1800,
    featured: false,
    status: 'on_sale',
    tags: ['Technology', 'Startup', 'Conference'],
    createdAt: '2026-01-05',
  },
  {
    id: 'e5',
    title: 'Afropunk Nairobi',
    category: 'Festivals',
    vendorId: 'v1',
    vendorName: 'SoundWave Events',
    date: '2026-06-20',
    time: '12:00',
    endTime: '23:00',
    venue: 'Ngong Racecourse, Nairobi',
    city: 'Nairobi',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop',
    price: 3000,
    vipPrice: 8000,
    description: 'The iconic Afropunk festival comes to Nairobi! A celebration of Black culture, art, music and identity.',
    totalTickets: 8000,
    soldTickets: 5600,
    featured: true,
    status: 'on_sale',
    tags: ['Festival', 'Afro', 'Culture', 'Music'],
    createdAt: '2026-01-20',
  },
];

// ─── LOAD OR INITIALISE ───────────────────────────────────────────────────────
let _data;
try {
  if (fs.existsSync(DATA_FILE)) {
    _data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('[DB] Loaded data.json');
  }
} catch (e) {
  console.error('[DB] Failed to load data.json, using seed data:', e.message);
}

if (!_data) {
  _data = {
    users: seedUsers,
    vendors: seedVendors,
    events: seedEvents,
    payments: {},
    bookings: [],
  };
}

// Live references — mutations to these are reflected in _data
const users    = _data.users;
const vendors  = _data.vendors;
const events   = _data.events;
const payments = _data.payments;   // object keyed by checkoutRequestId
const bookings = _data.bookings;

// ─── PERSIST ─────────────────────────────────────────────────────────────────
function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(_data, null, 2));
  } catch (e) {
    console.error('[DB] Failed to write data.json:', e.message);
  }
}

// Persist seed data on first run
if (!fs.existsSync(DATA_FILE)) save();

// ─── STORE API ────────────────────────────────────────────────────────────────
const db = {
  // Users
  getUsers:        ()     => users,
  getUserById:     (id)   => users.find((u) => u.id === id),
  getUserByEmail:  (email)=> users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (data) => {
    const user = { id: uuidv4(), joinedAt: new Date().toISOString().split('T')[0], totalSpent: 0, ticketsBought: 0, status: 'active', ...data };
    users.push(user);
    save();
    return user;
  },
  updateUser: (id, updates) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    save();
    return users[idx];
  },

  // Vendors
  getVendors:       ()     => vendors,
  getVendorById:    (id)   => vendors.find((v) => v.id === id),
  getVendorByEmail: (email)=> vendors.find((v) => v.email.toLowerCase() === email.toLowerCase()),
  createVendor: (data) => {
    const vendor = { id: uuidv4(), joinedAt: new Date().toISOString().split('T')[0], totalRevenue: 0, totalEvents: 0, status: 'active', commission: 5, verified: false, ...data };
    vendors.push(vendor);
    save();
    return vendor;
  },
  updateVendor: (id, updates) => {
    const idx = vendors.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    vendors[idx] = { ...vendors[idx], ...updates };
    save();
    return vendors[idx];
  },
  deleteVendor: (id) => {
    const idx = vendors.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    vendors.splice(idx, 1);
    save();
    return true;
  },

  // Events
  getEvents:          ()         => events,
  getEventById:       (id)       => events.find((e) => e.id === id),
  getEventsByVendor:  (vendorId) => events.filter((e) => e.vendorId === vendorId),
  createEvent: (data) => {
    const event = { id: uuidv4(), soldTickets: 0, createdAt: new Date().toISOString().split('T')[0], status: 'on_sale', featured: false, ...data };
    events.push(event);
    save();
    return event;
  },
  updateEvent: (id, updates) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates };
    save();
    return events[idx];
  },
  deleteEvent: (id) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    events.splice(idx, 1);
    save();
    return true;
  },

  // Payments (keyed by CheckoutRequestID)
  savePayment: (checkoutRequestId, data) => {
    payments[checkoutRequestId] = { ...data, createdAt: new Date().toISOString() };
    save();
  },
  getPayment:    (id)  => payments[id],
  updatePayment: (id, updates) => {
    if (!payments[id]) return null;
    payments[id] = { ...payments[id], ...updates, updatedAt: new Date().toISOString() };
    save();
    return payments[id];
  },
  getAllPayments: () => Object.values(payments),

  // Bookings
  createBooking: (data) => {
    const booking = { id: uuidv4(), createdAt: new Date().toISOString(), ...data };
    bookings.push(booking);
    save();
    return booking;
  },
  getBookings:        ()       => bookings,
  getBookingsByUser:  (userId) => bookings.filter((b) => b.userId === userId),
};

module.exports = db;
