import { useState, useEffect } from 'react';
import {
  Search, Plus, CheckCircle, XCircle, Trash2, Eye, X, Mail, Phone,
  Pencil, PauseCircle, PlayCircle, TrendingUp, DollarSign, CalendarDays,
  Building2, AlertTriangle, Loader2,
} from 'lucide-react';
import { adminApi } from '../../services/api';

const COMMISSION_RATE = 0.05;

const categoryOptions = [
  'Music & Festivals', 'Sports', 'Comedy & Entertainment',
  'Arts & Theatre', 'Food & Drink', 'Tech & Business', 'Other',
];

const emptyForm = {
  name: '', ownerName: '', email: '', phone: '', company: '',
  category: 'Music & Festivals', bio: '', mpesaNumber: '',
};

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewVendor, setViewVendor] = useState(null);
  const [editVendor, setEditVendor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);

  // Load vendors from API
  useEffect(() => {
    adminApi.vendors()
      .then(setVendors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && v.status === 'active') ||
      (statusFilter === 'suspended' && v.status === 'suspended') ||
      (statusFilter === 'pending' && v.status === 'pending');
    return matchSearch && matchStatus;
  });

  const approve = async (id) => {
    await adminApi.setVendorStatus(id, 'active').catch(() => {});
    setVendors(vendors.map((v) => (v.id === id ? { ...v, status: 'active' } : v)));
  };

  const reject = async (id) => {
    await adminApi.setVendorStatus(id, 'suspended').catch(() => {});
    setVendors(vendors.map((v) => (v.id === id ? { ...v, status: 'suspended' } : v)));
  };

  const toggleSuspend = async (id) => {
    const v = vendors.find((x) => x.id === id);
    const newStatus = v.status === 'suspended' ? 'active' : 'suspended';
    await adminApi.setVendorStatus(id, newStatus).catch(() => {});
    setVendors(vendors.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
  };

  const remove = async (id) => {
    await adminApi.deleteVendor(id).catch(() => {});
    setVendors(vendors.filter((v) => v.id !== id));
    setDeleteConfirm(null);
  };

  const openEdit = (vendor) => {
    setEditVendor(vendor);
    setEditForm({
      name: vendor.name,
      ownerName: vendor.ownerName || '',
      email: vendor.email,
      phone: vendor.phone || '',
      company: vendor.name,
      category: vendor.category || '',
      bio: vendor.description || '',
      mpesaNumber: vendor.mpesaNumber || '',
    });
    setModalOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await adminApi.updateVendor(editVendor.id, { ...editForm, description: editForm.bio }).catch(() => {});
    setVendors(vendors.map((v) => (v.id === editVendor.id ? { ...v, ...editForm } : v)));
    setModalOpen(false);
    setEditVendor(null);
  };

  const saveAdd = async (e) => {
    e.preventDefault();
    // New vendor via auth register — for now do optimistic add
    const newVendor = {
      ...addForm,
      id: `v${Date.now()}`,
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      totalEvents: 0,
      totalRevenue: 0,
      commission: 5,
    };
    setVendors([...vendors, newVendor]);
    setAddModalOpen(false);
    setAddForm(emptyForm);
  };

  const getVendorCommission = (vendor) => Math.round((vendor.totalRevenue || 0) * COMMISSION_RATE);

  const statusBadge = (vendor) => {
    const map = { active: 'badge-green', pending: 'badge-amber', rejected: 'badge-red', suspended: 'bg-orange-100 text-orange-700 badge' };
    return map[vendor.status] || 'badge-purple';
  };

  const statusLabel = (vendor) => vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1);

  // Summary stats
  const totalCommission = vendors.reduce((s, v) => s + getVendorCommission(v), 0);
  const pendingCount = vendors.filter((v) => v.status === 'pending').length;
  const activeCount = vendors.filter((v) => v.status === 'active').length;

  const FormFields = ({ form, setForm }) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Name *</label>
          <input required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
          <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+254 7xx xxx xxx" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Registered Company</label>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
          <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
            {categoryOptions.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">M-Pesa Payout Number</label>
          <input value={form.mpesaNumber} onChange={(e) => setForm({ ...form, mpesaNumber: e.target.value })} className="input-field" placeholder="2547xxxxxxxx" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / About</label>
          <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input-field resize-none" />
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6">
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Vendors</h1>
          <p className="text-gray-500">
            {activeCount} active · {pendingCount} pending review
          </p>
        </div>
        <button onClick={() => setAddModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Vendors', value: vendors.length, icon: Building2, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Review', value: pendingCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Commission Earned', value: `Ksh ${(totalCommission / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field !pl-10 !py-2.5 !text-sm" placeholder="Search vendors..." />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((vendor) => {
          const commission = getVendorCommission(vendor);
          return (
            <div
              key={vendor.id}
              className={`card p-5 ${vendor.status === 'suspended' ? 'opacity-75 border-orange-200' : ''}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 ${vendor.status === 'suspended' ? 'bg-gray-200 text-gray-500' : 'bg-primary-100 text-primary-700'}`}>
                    {(vendor.name || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.ownerName}</p>
                  </div>
                </div>
                <span className={statusBadge(vendor)}>{statusLabel(vendor)}</span>
              </div>

              {/* Contact */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5 shrink-0" />{vendor.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{vendor.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  {vendor.category} · {vendor.totalEvents} events
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-base font-black text-gray-900">{vendor.totalEvents || 0}</p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-base font-black text-gray-900">
                    Ksh {(vendor.totalRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2.5 text-center">
                  <p className="text-base font-black text-green-700">
                    Ksh {(commission / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-green-600">Our 5%</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setViewVendor(vendor)} className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(vendor)} className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>

                {vendor.status === 'pending' && (
                  <>
                    <button onClick={() => approve(vendor.id)} className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => reject(vendor.id)} className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}

                {(vendor.status === 'active' || vendor.status === 'suspended') && (
                  <button
                    onClick={() => toggleSuspend(vendor.id)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
                      vendor.status === 'suspended'
                        ? 'text-green-700 bg-green-50 hover:bg-green-100'
                        : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                    }`}
                  >
                    {vendor.status === 'suspended' ? (
                      <><PlayCircle className="w-3.5 h-3.5" /> Activate</>
                    ) : (
                      <><PauseCircle className="w-3.5 h-3.5" /> Suspend</>
                    )}
                  </button>
                )}

                <button onClick={() => setDeleteConfirm(vendor.id)} className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-500">No vendors found.</div>
        )}
      </div>

      {/* View vendor modal */}
      {viewVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vendor Profile</h2>
              <button onClick={() => setViewVendor(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 font-black text-2xl flex items-center justify-center">
                {(viewVendor.name || '?').charAt(0)}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{viewVendor.name}</p>
                <p className="text-sm text-gray-500">{viewVendor.category}</p>
                <span className={`mt-1 inline-block ${statusBadge(viewVendor)}`}>{statusLabel(viewVendor)}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[
                { label: 'Owner', value: viewVendor.ownerName },
                { label: 'Email', value: viewVendor.email },
                { label: 'Phone', value: viewVendor.phone },
                { label: 'Company', value: viewVendor.company },
                { label: 'M-Pesa Payout', value: viewVendor.mpesaNumber || '—' },
                { label: 'Joined', value: viewVendor.joinedAt ? new Date(viewVendor.joinedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-xs truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Commission breakdown */}
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Commission Breakdown (5%)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gross Revenue', value: `Ksh ${viewVendor.totalRevenue.toLocaleString()}` },
                  { label: 'Our Commission', value: `Ksh ${Math.round(viewVendor.totalRevenue * 0.05).toLocaleString()}`, highlight: true },
                  { label: 'Events Listed', value: viewVendor.totalEvents },
                  { label: 'Vendor Payout', value: `Ksh ${Math.round(viewVendor.totalRevenue * 0.95).toLocaleString()}` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-lg p-2.5 ${highlight ? 'bg-green-100' : 'bg-white/70'}`}>
                    <p className={`text-base font-black ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {viewVendor.bio && (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">{viewVendor.bio}</div>
            )}
          </div>
        </div>
      )}

      {/* Edit vendor modal */}
      {modalOpen && editVendor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <FormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add vendor modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveAdd} className="p-6 space-y-4">
              <FormFields form={addForm} setForm={setAddForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Vendor Account?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently remove the vendor and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => remove(deleteConfirm)} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
