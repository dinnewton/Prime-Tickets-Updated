import { useState } from 'react';
import { Search, MoreVertical, Ban, Trash2, Eye, X } from 'lucide-react';
import { users as initialUsers } from '../../data/users';

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) =>
    setUsers(users.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));

  const remove = (id) => setUsers(users.filter((u) => u.id !== id));

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Users</h1>
          <p className="text-gray-500">
            {users.filter((u) => u.status === 'active').length} active ·{' '}
            {users.filter((u) => u.status === 'inactive').length} inactive
          </p>
        </div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field !pl-10 !py-2.5 !text-sm"
          placeholder="Search users..."
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">User</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden md:table-cell">Contact</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden lg:table-cell">Tickets</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4 hidden lg:table-cell">Spent</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-4">Status</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">Joined {new Date(user.joinedDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <p className="text-sm text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-500">{user.phone}</p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900 hidden lg:table-cell">{user.ticketsPurchased}</td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900 hidden lg:table-cell">Ksh {user.totalSpent.toLocaleString()}</td>
                <td className="px-4 py-4">
                  <span className={`badge ${user.status === 'active' ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenu === user.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                        <button
                          onClick={() => { setViewUser(user); setActionMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" /> View Profile
                        </button>
                        <button
                          onClick={() => { toggleStatus(user.id); setActionMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                        >
                          <Ban className="w-4 h-4" />
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => { remove(user.id); setActionMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No users found.</div>
        )}
      </div>

      {/* View user modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
              <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 font-black text-2xl flex items-center justify-center mx-auto mb-3">
                {viewUser.avatar}
              </div>
              <p className="text-xl font-bold text-gray-900">{viewUser.name}</p>
              <span className={`mt-1 inline-block badge ${viewUser.status === 'active' ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                {viewUser.status}
              </span>
            </div>
            <div className="space-y-3 text-sm bg-gray-50 rounded-2xl p-4">
              {[
                { label: 'Email', value: viewUser.email },
                { label: 'Phone', value: viewUser.phone },
                { label: 'Tickets purchased', value: viewUser.ticketsPurchased },
                { label: 'Total spent', value: `Ksh ${viewUser.totalSpent.toLocaleString()}` },
                { label: 'Member since', value: new Date(viewUser.joinedDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
