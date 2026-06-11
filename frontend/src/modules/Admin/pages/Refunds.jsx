import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, IndianRupee, Eye } from 'lucide-react';
import { cancellationsApi } from '../../../api';

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);

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
    const loadRefunds = async () => {
      await fetchRefunds();
    };
    loadRefunds();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const processedRefunds = refunds.filter(r => r.refundStatus === 'processed');
  const totalRefundAmount = processedRefunds.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Refund Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all platform cancellations and refunds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRefunds}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors font-semibold shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
          <button
            onClick={async () => { if (!window.confirm('Accept all pending refunds?')) return; try { await cancellationsApi.acceptAllRefunds(); fetchRefunds(); } catch (err) { setError(err.message || 'Failed to accept all refunds'); } }}
            className="flex items-center text-sm text-white bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl transition-colors font-semibold shadow-sm active:scale-95"
          >
            Accept All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Successful Refunds</p>
            <p className="text-2xl font-bold text-gray-900">{processedRefunds.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Total Amount Refunded</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalRefundAmount}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Refund ID / Date</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Booking Total</th>
                <th className="p-4 font-semibold">Refund Amount</th>
                <th className="p-4 font-semibold">Reason</th>
                <th className="p-4 font-semibold">Refund Method</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    No refunds found.
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-xs text-gray-500">{refund.id}</div>
                      <div className="text-gray-900 mt-1 font-medium">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{refund.customerName}</div>
                      <div className="text-gray-500 text-xs">{refund.customerEmail}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-600 hover:underline cursor-pointer">
                      {refund.bookingId}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      ₹{refund.bookingTotal}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-600 text-base">
                        ₹{refund.refundAmount}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-800 capitalize font-medium">
                        {refund.customerReason ? (
                          <>
                            <div className="text-xs font-semibold text-gray-500 mb-1">User Reason:</div>
                            <div className="text-sm">{refund.customerReason}</div>
                          </>
                        ) : (
                          refund.reason.replace(/_/g, ' ')
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {refund.refundPercentage}% Rule
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold capitalize text-gray-800">
                        {refund.refundMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {refund.refundMethod === 'upi'
                          ? refund.refundDetails?.upiId || '—'
                          : refund.refundDetails?.accountNumber
                          ? `****${refund.refundDetails.accountNumber.slice(-4)}`
                          : '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          refund.refundStatus === 'processed'
                            ? 'bg-green-100 text-green-700'
                            : refund.refundStatus === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {refund.refundStatus === 'processed' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        {refund.refundStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5 sticky top-0 flex justify-between items-start text-white">
              <div>
                <p className="text-xs text-blue-200 mb-1">Refund Details</p>
                <h3 className="text-xl font-extrabold">{selectedRefund.id}</h3>
              </div>
              <button onClick={() => setSelectedRefund(null)} className="text-white/80 hover:text-white transition">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Refund Status</p>
                  <p className="font-bold text-gray-800 capitalize">{selectedRefund.refundStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Refund Amount</p>
                  <p className="font-bold text-green-600 text-lg">₹{selectedRefund.refundAmount}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold text-gray-900">{selectedRefund.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900">{selectedRefund.customerEmail}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cancellation Reason</p>
                <p className="text-gray-800 bg-gray-50 rounded-lg p-3">
                  {selectedRefund.customerReason || 'No reason provided'}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Refund Method & Details</p>
                {selectedRefund.refundMethod === 'upi' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Method:</span>
                      <span className="font-bold text-blue-700">UPI</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                      <span className="text-gray-600 font-medium">UPI ID:</span>
                      <span className="font-mono font-semibold text-gray-900">{selectedRefund.refundDetails?.upiId || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Method:</span>
                      <span className="font-bold text-purple-700">Bank Transfer</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-purple-200 pt-2">
                      <span className="text-gray-600 font-medium">Bank Name:</span>
                      <span className="font-semibold text-gray-900">{selectedRefund.refundDetails?.bankName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Account Holder:</span>
                      <span className="font-semibold text-gray-900">{selectedRefund.refundDetails?.accountHolderName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Account Number:</span>
                      <span className="font-mono font-semibold text-gray-900">{selectedRefund.refundDetails?.accountNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">IFSC Code:</span>
                      <span className="font-mono font-semibold text-gray-900">{selectedRefund.refundDetails?.ifscCode || '—'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Refund Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Percentage:</span>
                    <span className="font-semibold text-gray-900">{selectedRefund.refundPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-blue-600 font-semibold">{selectedRefund.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed At:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedRefund.processedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!window.confirm('Accept this refund and apply 5% commission?')) return;
                    try {
                      const { refund } = await cancellationsApi.decideRefund(selectedRefund.id, 'accept');
                      setSelectedRefund(refund);
                      fetchRefunds();
                    } catch (err) {
                      setError(err.message || 'Failed to accept refund');
                    }
                  }}
                  disabled={selectedRefund.refundStatus === 'processed'}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition ${selectedRefund.refundStatus === 'processed' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Accept
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Deny this refund?')) return;
                    try {
                      const { refund } = await cancellationsApi.decideRefund(selectedRefund.id, 'deny');
                      setSelectedRefund(refund);
                      fetchRefunds();
                    } catch (err) {
                      setError(err.message || 'Failed to deny refund');
                    }
                  }}
                  disabled={selectedRefund.refundStatus === 'failed'}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition ${selectedRefund.refundStatus === 'failed' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Deny
                </button>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;
