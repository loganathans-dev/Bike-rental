import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Calendar, XCircle } from 'lucide-react';
import { bookingsApi, shopsApi } from '../../../api';

const AdminBookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsApi.list(), shopsApi.list()])
      .then(([{ bookings: data }, { shops }]) => {
        setBookings(data);
        setShopMap(Object.fromEntries(shops.map((s) => [s.id, s.name])));
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = bookings.map((b) => ({
    id: b.id,
    customer: b.customerName || 'Customer',
    shop: shopMap[b.shopId] || 'Partner Shop',
    date: b.startDate,
    status: b.status,
  })).filter(booking => {
    const matchesSearch = booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) || booking.shop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesDate = dateFilter === '' || booking.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'upcoming':
      case 'active': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
      case 'completed': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Completed</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Cancelled</span>;
      case 'pending_payment': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Pending Payment</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Booking History</h1>
        <p className="text-gray-500 mt-1">Monitor all platform bookings.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search customer or shop..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-full lg:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="relative w-full lg:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="date" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading bookings...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Booking ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Shop</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-sm">{booking.id}</td>
                    <td className="p-4 text-gray-700">{booking.customer}</td>
                    <td className="p-4 text-gray-700">{booking.shop}</td>
                    <td className="p-4 text-gray-600 text-sm">{booking.date}</td>
                    <td className="p-4">{getStatusBadge(booking.status)}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-5 h-5" /></button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingHistory;
