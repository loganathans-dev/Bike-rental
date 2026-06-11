import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cancellationsApi } from '../../../api';

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const { refunds: data } = await cancellationsApi.listRefunds();
      setRefunds(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Refund Management</h1>
        <button
          onClick={fetchRefunds}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold">Refund ID / Date</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Booking Total</th>
                <th className="p-4 font-semibold">Refund Amount</th>
                <th className="p-4 font-semibold">Reason / Percentage</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No refunds found.
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-xs text-gray-500">{refund.id}</div>
                      <div className="text-gray-900 mt-1">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{refund.customerName}</div>
                      <div className="text-gray-500 text-xs">{refund.customerEmail}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-600">
                      {refund.bookingId}
                    </td>
                    <td className="p-4 text-gray-600">
                      ₹{refund.bookingTotal}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-600 text-lg">
                        ₹{refund.refundAmount}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-800 capitalize">
                        {refund.reason.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {refund.refundPercentage}% Rule
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          refund.refundStatus === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : refund.refundStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {refund.refundStatus === 'processed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {refund.refundStatus}
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

export default RefundManagement;
