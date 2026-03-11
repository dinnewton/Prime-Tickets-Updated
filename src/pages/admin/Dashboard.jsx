import { Link } from 'react-router-dom';
import {
  TrendingUp, Ticket, Building2, Users, DollarSign, CalendarDays,
  ArrowUpRight, Percent, Crown, AlertTriangle, BarChart3,
} from 'lucide-react';
import { events } from '../../data/events';
import { vendors } from '../../data/vendors';
import { users } from '../../data/users';

const COMMISSION_RATE = 0.05;

// Compute analytics
const totalGrossRevenue = events.reduce((sum, e) => sum + e.soldTickets * e.price, 0);
const totalCommission = Math.round(totalGrossRevenue * COMMISSION_RATE);
const totalTicketsSold = events.reduce((sum, e) => sum + e.soldTickets, 0);

const topEvents = [...events]
  .map((e) => ({
    ...e,
    revenue: e.soldTickets * e.price,
    commission: Math.round(e.soldTickets * e.price * COMMISSION_RATE),
    soldPct: Math.round((e.soldTickets / e.totalTickets) * 100),
  }))
  .sort((a, b) => b.revenue - a.revenue);

// Simulated monthly revenue data (last 6 months)
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const monthlyRevenue = [1850000, 2340000, 3100000, 2700000, 3850000, totalGrossRevenue];
const maxMonthly = Math.max(...monthlyRevenue);

const categoryRevenue = events.reduce((acc, e) => {
  acc[e.category] = (acc[e.category] || 0) + e.soldTickets * e.price;
  return acc;
}, {});
const topCategories = Object.entries(categoryRevenue)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5);
const maxCategoryRevenue = Math.max(...topCategories.map(([, v]) => v));

function formatKsh(val) {
  if (val >= 1_000_000) return `Ksh ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `Ksh ${(val / 1_000).toFixed(0)}K`;
  return `Ksh ${val}`;
}

const getStatusBadge = (status) => {
  const map = {
    on_sale: 'badge-green',
    almost_sold_out: 'badge-red',
    sold_out: 'bg-gray-100 text-gray-500 badge',
  };
  return map[status] || 'badge-green';
};

export default function AdminDashboard() {
  const pendingVendors = vendors.filter((v) => v.status === 'pending');

  const stats = [
    {
      label: 'Total Gross Revenue',
      value: formatKsh(totalGrossRevenue),
      sub: 'All ticket sales',
      change: '+14.2%',
      icon: BarChart3,
      bg: 'bg-primary-50',
      text: 'text-primary-700',
      border: 'border-primary-100',
    },
    {
      label: 'Our Commission (5%)',
      value: formatKsh(totalCommission),
      sub: '5% of gross revenue',
      change: '+14.2%',
      icon: Percent,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-100',
    },
    {
      label: 'Tickets Sold',
      value: totalTicketsSold.toLocaleString(),
      sub: 'Across all events',
      change: '+9.8%',
      icon: Ticket,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    {
      label: 'Active Vendors',
      value: vendors.filter((v) => v.status === 'active').length,
      sub: `${pendingVendors.length} pending review`,
      change: pendingVendors.length > 0 ? `${pendingVendors.length} pending` : 'All clear',
      icon: Building2,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-500">PrimeTickets earnings & event performance overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl text-sm font-semibold text-green-700">
          <Percent className="w-4 h-4" />
          5% Commission Model
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl p-6 border ${stat.border} shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${stat.text}`}>
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-0.5">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly revenue bar chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Monthly Revenue</h2>
              <p className="text-xs text-gray-500">Gross ticket sales (last 6 months)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block" /> Gross</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Commission</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {monthlyRevenue.map((rev, i) => {
              const commission = Math.round(rev * COMMISSION_RATE);
              const heightPct = (rev / maxMonthly) * 100;
              const commPct = (commission / maxMonthly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full relative flex flex-col items-center" style={{ height: '160px' }}>
                    {/* Gross revenue bar */}
                    <div
                      className="w-full bg-primary-100 rounded-t-lg absolute bottom-0 transition-all duration-500 group-hover:bg-primary-200"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Commission overlay */}
                    <div
                      className="w-full bg-green-500 rounded-t-lg absolute bottom-0 transition-all duration-500"
                      style={{ height: `${commPct}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {formatKsh(rev)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{months[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-black text-gray-900">{formatKsh(totalGrossRevenue)}</p>
              <p className="text-xs text-gray-500">Total Gross</p>
            </div>
            <div>
              <p className="text-sm font-black text-green-700">{formatKsh(totalCommission)}</p>
              <p className="text-xs text-gray-500">Our Earnings</p>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{formatKsh(totalGrossRevenue - totalCommission)}</p>
              <p className="text-xs text-gray-500">Vendor Payouts</p>
            </div>
          </div>
        </div>

        {/* Revenue by category */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Top Categories</h2>
          <p className="text-xs text-gray-500 mb-5">By total ticket revenue</p>
          <div className="space-y-4">
            {topCategories.map(([cat, rev], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700 flex items-center gap-1.5">
                    {i === 0 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    {cat}
                  </span>
                  <span className="font-bold text-gray-900">{formatKsh(rev)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      i === 0 ? 'bg-primary-600' :
                      i === 1 ? 'bg-primary-400' :
                      i === 2 ? 'bg-primary-300' : 'bg-gray-300'
                    }`}
                    style={{ width: `${(rev / maxCategoryRevenue) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  Commission: {formatKsh(Math.round(rev * COMMISSION_RATE))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top events + right panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top performing events */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Performing Events</h2>
              <p className="text-xs text-gray-500">Ranked by total revenue</p>
            </div>
            <Link to="/admin/events" className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
              All events <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topEvents.slice(0, 6).map((event, i) => (
              <div key={event.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <img src={event.image} alt={event.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getStatusBadge(event.status)}>{event.status.replace('_', ' ')}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-24">
                      <div
                        className={`h-full rounded-full ${event.soldPct >= 90 ? 'bg-red-500' : event.soldPct >= 70 ? 'bg-amber-500' : 'bg-primary-500'}`}
                        style={{ width: `${event.soldPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{event.soldPct}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-gray-900 text-sm">{formatKsh(event.revenue)}</p>
                  <p className="text-xs text-green-600 font-semibold">+{formatKsh(event.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Pending vendors */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pending Vendors
              </h2>
              <span className="badge-amber">{pendingVendors.length}</span>
            </div>
            {pendingVendors.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-gray-500">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingVendors.map((v) => (
                  <div key={v.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {v.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.category}</p>
                    </div>
                    <Link to="/admin/vendors" className="text-xs text-primary-600 font-semibold hover:underline">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform summary */}
          <div className="card p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">Platform Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Users', value: users.length, icon: Users },
                { label: 'Total Events', value: events.length, icon: CalendarDays },
                { label: 'Active Vendors', value: vendors.filter((v) => v.status === 'active').length, icon: Building2 },
                { label: 'Avg. Commission/Event', value: formatKsh(Math.round(totalCommission / events.length)), icon: DollarSign },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <item.icon className="w-4 h-4 text-primary-400" />
                    {item.label}
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
