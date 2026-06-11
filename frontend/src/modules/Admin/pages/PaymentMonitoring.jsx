import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, AlertTriangle, Calendar } from 'lucide-react';
import { paymentsApi } from '../../../api';

const PaymentMonitoring = () => {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.list()
      .then(({ payments: data }) => setPayments(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) || payment.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesDate = dateFilter === '' || payment.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'success': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Success</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
      case 'failed': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Failed</span>;
      case 'flagged': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Flagged</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Monitoring</h1>
        <p className="text-gray-500 mt-1">Track transactions and flagged payments.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search by ID or customer..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-full lg:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
        <div className="relative w-full lg:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="date" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading payments...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Transaction</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Shop Name</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Method</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-sm text-gray-800">{payment.id}</td>
                    <td className="p-4 text-gray-700 font-medium">{payment.customer}</td>
                    <td className="p-4 text-gray-700">{payment.shopName}</td>
                    <td className="p-4 font-bold text-gray-900">₹{payment.amount}</td>
                    <td className="p-4 text-gray-600 uppercase text-xs">{payment.method}</td>
                    <td className="p-4 text-gray-600 text-sm">{payment.date}</td>
                    <td className="p-4">{getStatusBadge(payment.status)}</td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <Eye className="w-5 h-5" />
                      </button>
                      {payment.status === 'flagged' && (
                        <button className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg ml-1" title="Review">
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      )}
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

export default PaymentMonitoring;
