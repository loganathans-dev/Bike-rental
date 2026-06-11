import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { paymentsApi } from '../../../api';
import { loadRazorpayScript, openRazorpayCheckout } from '../../../utils/razorpay';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = location.state?.bookingId;
  const amount = location.state?.amount;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleRazorpayPay = async () => {
    if (!bookingId) {
      setError('No booking found. Please complete the booking form first.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await loadRazorpayScript();
      const order = await paymentsApi.createRazorpayOrder({ bookingId });

      openRazorpayCheckout({
        order,
        onSuccess: async (response) => {
          try {
            await paymentsApi.verifyRazorpay({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate('/customer/bookings', { state: { newBooking: true } });
          } catch (err) {
            setError(err.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        onDismiss: (message) => {
          if (message) setError(message);
          setIsProcessing(false);
        },
      });
    } catch (err) {
      setError(err.message || 'Could not start payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 py-4 px-6 border-b border-gray-200 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Complete Payment</h1>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Secure Checkout</h2>
                <p className="text-gray-500 text-sm">
                  Pay with Razorpay — UPI, cards, netbanking, and wallets.
                </p>
                {amount != null && (
                  <p className="text-blue-600 font-bold mt-1">Amount due: ₹{amount}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Test mode</p>
              <p>
                Use Razorpay test cards/UPI in the checkout popup. Payment is verified on the server
                before your booking is confirmed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRazorpayPay}
              disabled={isProcessing || !bookingId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Opening Razorpay...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay with Razorpay
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
