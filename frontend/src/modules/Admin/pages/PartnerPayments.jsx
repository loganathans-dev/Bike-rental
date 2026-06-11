import React, { useEffect, useState } from 'react';
import { IndianRupee, ChevronDown, ChevronUp, Store, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { adminApi } from '../../../api';
import { loadRazorpayScript, openRazorpayCheckout } from '../../../utils/razorpay';

const PartnerPayments = () => {
  const [shopPayments, setShopPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedShopId, setExpandedShopId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);

  const fetchShopPayments = async () => {
    try {
      setLoading(true);
      const { shopPayments: data } = await adminApi.shopPayments();
      setShopPayments(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load partner payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopPayments();
    loadRazorpayScript().catch(console.error);
  }, []);

  const handleProcessPayment = async () => {
    if (!selectedShop) return;
    
    try {
      setProcessingId(selectedShop.id);
      
      // 1. Create Razorpay order
      const order = await adminApi.createPayoutOrder(selectedShop.id);
      
      // 2. Open Razorpay Checkout
      openRazorpayCheckout({
        order,
        onSuccess: async (response) => {
          try {
            // 3. Mark as paid in backend
            await adminApi.payShop(selectedShop.id);
            await fetchShopPayments();
            setSelectedShop(null);
            alert('Payout successful and marked as paid!');
          } catch (err) {
            alert('Payment was successful but failed to update status on server. Please contact support.');
          }
        },
        onDismiss: (reason) => {
          alert(reason || 'Payment cancelled');
        }
      });
      
    } catch (err) {
      alert(err.message || 'Failed to initialize payout');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && shopPayments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and settle commissions with shop owners.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {shopPayments.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500">No shops found.</p>
          </div>
        ) : (
          shopPayments.map((shop) => (
            <div key={shop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div 
                className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedShopId(expandedShopId === shop.id ? null : shop.id)}
              >
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{shop.shopName}</h3>
                    <p className="text-sm text-gray-500">{shop.ownerName} • {shop.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="flex-1 md:flex-none">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-lg font-bold text-gray-900">₹{shop.totalPaidPayout}</p>
                  </div>
                  <div className="flex-1 md:flex-none">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Payout</p>
                    <p className="text-lg font-bold text-orange-600">₹{shop.totalPendingPayout}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShop(shop);
                      }}
                      disabled={shop.totalPendingPayout === 0}
                      className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center
                        ${shop.totalPendingPayout === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'}`}
                    >
                      <IndianRupee className="w-4 h-4 mr-1.5" />
                      Send Amount
                    </button>
                    {expandedShopId === shop.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedShopId === shop.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Commission Details</h4>
                  
                  {shop.commissions.length === 0 ? (
                    <p className="text-sm text-gray-500">No transactions found for this shop.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100/50 text-gray-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="p-3 font-semibold rounded-l-lg">Booking ID</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Total Payment</th>
                            <th className="p-3 font-semibold text-orange-600">Admin Comm.</th>
                            <th className="p-3 font-semibold text-green-600">Shop Payout</th>
                            <th className="p-3 font-semibold rounded-r-lg">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {shop.commissions.map((comm) => (
                            <tr key={comm.id} className="hover:bg-white transition-colors">
                              <td className="p-3 font-mono text-xs text-blue-600">{comm.bookingId?.slice(-8) || 'N/A'}</td>
                              <td className="p-3 text-gray-600">
                                {new Date(comm.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-semibold text-gray-900">₹{comm.totalPayment}</td>
                              <td className="p-3 font-medium text-orange-600">-₹{comm.adminCommission}</td>
                              <td className="p-3 font-bold text-green-600">₹{comm.payableToShop}</td>
                              <td className="p-3">
                                {comm.status === 'paid' ? (
                                  <span className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bank Details Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Process Payout</h3>
                <p className="text-blue-100 text-sm mt-1">Review shop bank details</p>
              </div>
              <button 
                onClick={() => setSelectedShop(null)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedShop.shopName}</h4>
                  <p className="text-sm text-gray-500">Amount to pay: <span className="font-bold text-green-600">₹{selectedShop.totalPendingPayout}</span></p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Bank Name</span>
                  <span className="font-semibold text-gray-900">{selectedShop.bank?.bank_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Account Holder</span>
                  <span className="font-semibold text-gray-900">{selectedShop.bank?.account_holder_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Account Number</span>
                  <span className="font-mono font-semibold text-gray-900 tracking-wider">{selectedShop.bank?.account_number || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">IFSC Code</span>
                  <span className="font-mono font-semibold text-gray-900 tracking-wider">{selectedShop.bank?.ifsc_code || 'Not provided'}</span>
                </div>
              </div>

              {(!selectedShop.bank?.account_number || !selectedShop.bank?.ifsc_code) && (
                <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <p>Bank details are incomplete. Proceeding with Razorpay might fail if verification is required.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedShop(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={processingId === selectedShop.id}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
                >
                  {processingId === selectedShop.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Pay ₹{selectedShop.totalPendingPayout}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerPayments;

