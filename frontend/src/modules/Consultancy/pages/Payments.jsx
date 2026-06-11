import React, { useEffect, useState } from 'react';
import { RefreshCw, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import { paymentsApi } from '../../../api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { payments: data } = await paymentsApi.list();
      setPayments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const totalEarnings = payments.reduce((acc, p) => acc + (p.status === 'success' ? p.amount : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payments & Earnings</h1>
        <button
          onClick={fetchPayments}
          className="flex items-center text-sm text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">Recent Transactions</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-purple-600">{payment.transactionId}</td>
                    <td className="p-4 font-mono text-xs text-gray-600">{payment.bookingId}</td>
                    <td className="p-4 font-semibold text-gray-800">{payment.customer}</td>
                    <td className="p-4 text-gray-600">{payment.date}</td>
                    <td className="p-4 font-bold text-green-600">₹{payment.amount.toLocaleString()}</td>
                    <td className="p-4 text-gray-600 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> {payment.method}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
