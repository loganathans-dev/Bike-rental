import React, { useEffect, useState } from 'react';
import { Users, Store, Bike, DollarSign, UserPlus, Activity } from 'lucide-react';
import { adminApi } from '../../../api';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const typeBadge = (type) => {
  const styles = {
    customer: 'bg-blue-100 text-blue-700',
    partner: 'bg-purple-100 text-purple-700',
    shop: 'bg-indigo-100 text-indigo-700',
    booking: 'bg-sky-100 text-sky-700',
    payment: 'bg-emerald-100 text-emerald-700',
    bike: 'bg-orange-100 text-orange-700',
  };
  const labels = {
    customer: 'Customer',
    partner: 'Partner',
    shop: 'Shop',
    booking: 'Booking',
    payment: 'Payment',
    bike: 'Bike',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
      {labels[type] || type}
    </span>
  );
};

const statusBadge = (status) => {
  const s = (status || '').toLowerCase();
  const map = {
    approved: 'text-green-700 bg-green-50',
    pending: 'text-amber-700 bg-amber-50',
    rejected: 'text-red-700 bg-red-50',
    registered: 'text-blue-700 bg-blue-50',
    success: 'text-green-700 bg-green-50',
    booked: 'text-blue-700 bg-blue-50',
    completed: 'text-gray-700 bg-gray-100',
    cancelled: 'text-red-700 bg-red-50',
    failed: 'text-red-700 bg-red-50',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${map[s] || 'text-gray-600 bg-gray-100'}`}>
      {status}
    </span>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi
      .stats()
      .then(({ stats: data }) => setStats(data))
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const registrations = stats?.recentRegistrations ?? [];
  const activity = stats?.recentActivity ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back to the admin portal.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats ? stats.totalUsers.toLocaleString() : '—'}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Active Shops"
          value={stats ? stats.activeShops : '—'}
          icon={<Store className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Pending Verifications"
          value={stats ? stats.pendingVerifications : '—'}
          icon={<Bike className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Total Revenue"
          value={stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—'}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Recent Registrations</h3>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm py-6 text-center">Loading...</p>
          ) : registrations.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">No registrations yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {registrations.map((row) => (
                <li key={`${row.type}-${row.id}`} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeBadge(row.type)}
                      {statusBadge(row.status)}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mt-1 truncate">{row.name}</p>
                    <p className="text-xs text-gray-500 truncate">{row.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{row.atLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-800">System Activity</h3>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm py-6 text-center">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activity.map((row) => (
                <li key={`${row.type}-${row.id}`} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeBadge(row.type)}
                      {statusBadge(row.status)}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mt-1 truncate">{row.title}</p>
                    <p className="text-xs text-gray-500 truncate">{row.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{row.atLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
