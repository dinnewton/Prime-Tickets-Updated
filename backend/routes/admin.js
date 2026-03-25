const router = require('express').Router();
const db = require('../db/store');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require admin
router.use(authMiddleware, requireRole('admin'));

/**
 * GET /api/admin/dashboard
 * Revenue analytics, event performance, company earnings
 */
router.get('/dashboard', (req, res) => {
  const events = db.getEvents();
  const vendors = db.getVendors();
  const users = db.getUsers().filter((u) => u.role === 'client');
  const payments = db.getAllPayments();
  const bookings = db.getBookings();

  // Total revenue from all events
  const totalTicketRevenue = events.reduce(
    (sum, e) => sum + e.soldTickets * e.price, 0
  );

  // Company earnings = 5% commission of all vendor revenue
  const companyEarnings = Math.round(
    vendors.reduce((sum, v) => sum + v.totalRevenue, 0) * 0.05
  );

  // Successful payments
  const successfulPayments = payments.filter((p) => p.status === 'success');
  const totalMpesaCollected = successfulPayments.reduce((s, p) => s + (p.paidAmount || p.amount), 0);

  // Top 5 events by revenue
  const topEvents = [...events]
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      soldTickets: e.soldTickets,
      totalTickets: e.totalTickets,
      revenue: e.soldTickets * e.price,
      vendorName: e.vendorName,
      percentSold: Math.round((e.soldTickets / e.totalTickets) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Events by category breakdown
  const byCategory = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.soldTickets * e.price;
    return acc;
  }, {});

  // Vendor performance
  const vendorPerformance = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    totalRevenue: v.totalRevenue,
    commission: v.commission,
    earned: Math.round(v.totalRevenue * (v.commission / 100)),
    totalEvents: v.totalEvents,
    status: v.status,
  }));

  // Monthly revenue (last 6 months simulated from bookings)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('en-KE', { month: 'short', year: '2-digit' });
    months.push({ label, revenue: 0 });
  }

  res.json({
    summary: {
      totalRevenue: totalTicketRevenue,
      companyEarnings,
      totalMpesaCollected,
      totalEvents: events.length,
      totalVendors: vendors.length,
      activeVendors: vendors.filter((v) => v.status === 'active').length,
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalTicketsSold: events.reduce((s, e) => s + e.soldTickets, 0),
    },
    topEvents,
    byCategory,
    vendorPerformance,
    monthlyRevenue: months,
  });
});

/**
 * GET /api/admin/users — all client users
 */
router.get('/users', (req, res) => {
  const users = db.getUsers()
    .filter((u) => u.role === 'client')
    .map(({ password, ...u }) => u);
  res.json(users);
});

/**
 * PATCH /api/admin/users/:id/status — suspend or activate user
 */
router.patch('/users/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const updated = db.updateUser(req.params.id, { status });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  const { password, ...safe } = updated;
  res.json(safe);
});

module.exports = router;
