import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Bike, ArrowLeft, CheckCircle2, Map as MapIcon } from 'lucide-react';
import { bookingsApi, cancellationsApi } from '../../../api';
import { BikeThumbnail } from '../../../components/BikeThumbnail';
import { isLoggedIn } from '../../../utils/auth';
import LocationMap from '../../../components/LocationMap';

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const STATUS_DISPLAY = {
  upcoming:   { label: 'Upcoming',    color: 'bg-amber-500' },
  ready:      { label: 'Ready',       color: 'bg-blue-500' },
  on_the_way: { label: 'On The Way',  color: 'bg-indigo-500' },
  delivered:  { label: 'Delivered',   color: 'bg-purple-500' },
  completed:  { label: 'Completed',   color: 'bg-green-500' },
  cancelled:  { label: 'Cancelled',   color: 'bg-red-500' },
};

const getDeliveryEstimateText = (booking) => {
  if (!booking.is_delivery_requested) return '';
  if (!booking.customerLat || !booking.customerLng || !booking.shopLat || !booking.shopLng) {
    return 'The bike will be delivered shortly after booking.';
  }
  const R = 6371;
  const dLat = (booking.shopLat - booking.customerLat) * Math.PI / 180;
  const dLon = (booking.shopLng - booking.customerLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(booking.customerLat * Math.PI / 180) * Math.cos(booking.shopLat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distanceKm = R * c;
  const mins = distanceKm <= 5 ? 10 : distanceKm <= 15 ? 20 : 30;
  return `Estimated delivery time is ${mins} minutes based on your current location.`;
};

const BookingHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('bank');
  const [refundDetails, setRefundDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
  });
  const [cancelError, setCancelError] = useState('');

  const loadBookings = () => {
    setLoading(true);
    return bookingsApi
      .list()
      .then(({ bookings: data }) => setBookings(data))
      .catch((err) => setError(err.message || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const initialize = async () => {
      if (!isLoggedIn()) {
        navigate('/customer/signin?redirect=/customer/bookings');
        return;
      }
      await loadBookings();
    };

    initialize();
  }, [navigate]);

  const openCancelModal = (booking) => {
    setCancelError('');
    setCancelModalBooking(booking);
    setCancelReason('');
    setRefundMethod('bank');
    setRefundDetails({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '' });
  };

  const closeCancelModal = () => {
    setCancelModalBooking(null);
    setCancelError('');
  };

  const submitCancel = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }
    if (refundMethod === 'bank') {
      const { accountHolderName, accountNumber, ifscCode, bankName } = refundDetails;
      if (!accountHolderName.trim() || !accountNumber.trim() || !ifscCode.trim() || !bankName.trim()) {
        setCancelError('Please fill in all bank refund details.');
        return;
      }
    } else if (refundMethod === 'upi') {
      if (!refundDetails.upiId.trim()) {
        setCancelError('Please enter your UPI ID.');
        return;
      }
    }

    setCancelError('');
    setCancelingBookingId(cancelModalBooking.id);

    try {
      await cancellationsApi.cancelBooking({
        bookingId: cancelModalBooking.id,
        cancellationReason: cancelReason.trim(),
        refundMethod,
        refundDetails: refundMethod === 'bank'
          ? {
              accountHolderName: refundDetails.accountHolderName.trim(),
              accountNumber: refundDetails.accountNumber.trim(),
              ifscCode: refundDetails.ifscCode.trim(),
              bankName: refundDetails.bankName.trim(),
            }
          : { upiId: refundDetails.upiId.trim() },
      });
      await loadBookings();
      closeCancelModal();
    } catch (err) {
      setCancelError(err.message || 'Failed to submit cancellation');
    } finally {
      setCancelingBookingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-10 py-4 px-4 sm:px-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 text-gray-500 hover:text-gray-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">My Bookings</h1>
          </div>
          <Link to="/" className="text-blue-600 font-semibold hover:underline text-sm">Rent Another Bike</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 mt-4">
        {location.state?.newBooking && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800">Booking Confirmed!</h3>
              <p className="text-green-700 text-sm mt-1">Your payment was successful and your bike is ready for pickup.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No bookings yet.</p>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition">
                <div className="h-48 sm:h-auto sm:w-1/3 bg-gray-100 relative">
                  <BikeThumbnail
                    bike={{ image: booking.image, name: booking.bikeName }}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${STATUS_DISPLAY[booking.status]?.color || 'bg-gray-500'}`}>
                    {STATUS_DISPLAY[booking.status]?.label || booking.status}
                  </div>
                </div>
                <div className="p-5 sm:p-6 sm:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{booking.bikeName}</h2>
                        <p className="text-gray-500 text-sm">{booking.brand}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total Paid</span>
                        <span className="font-extrabold text-blue-600 text-lg">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {booking.is_delivery_requested ? 'Delivery Address' : 'Pickup Location'}
                          </p>
                          <p className="font-medium mt-0.5">
                            {booking.is_delivery_requested ? booking.delivery_address : booking.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-gray-700">
                        <Bike className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking ID</p>
                          <p className="font-mono mt-0.5">{booking.id}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-gray-700 sm:col-span-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rental Duration</p>
                          <p className="font-medium mt-0.5 text-blue-700">
                            {formatDateTime(booking.startDate)} <span className="text-gray-400 mx-1">→</span> {formatDateTime(booking.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {['upcoming', 'ready', 'on_the_way'].includes(booking.status) && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-amber-800 leading-relaxed font-medium">
                          <span className="font-bold uppercase tracking-wider text-[11px] block text-amber-600 mb-0.5">Important Note</span>
                          Please bring your original Aadhaar card or ID proof. The bike will only be handed over after verifying the original ID. Once you return the bike, your ID proof will be securely returned to you. 
                          {booking.is_delivery_requested && (
                            <strong className="block mt-1">Delivery Info: {getDeliveryEstimateText(booking)}</strong>
                          )}
                        </p>
                      </div>
                    )}

                    {['upcoming', 'ready', 'on_the_way', 'delivered'].includes(booking.status) && (
                      <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                             <MapIcon className="w-4 h-4 text-blue-600" />
                             <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Live Route Map</span>
                           </div>
                           <a 
                             href={booking.shopLat && booking.customerLat 
                               ? `https://www.google.com/maps/dir/?api=1&origin=${booking.shopLat},${booking.shopLng}&destination=${booking.customerLat},${booking.customerLng}`
                               : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.location)}&destination=${encodeURIComponent(booking.is_delivery_requested ? booking.delivery_address : booking.pickupLocation || booking.location)}`
                             } 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wider"
                           >
                             <MapIcon className="w-3 h-3" /> Get Directions
                           </a>
                        </div>
                        <LocationMap 
                          shopAddress={booking.location} 
                          customerAddress={booking.is_delivery_requested ? booking.delivery_address : booking.pickupLocation || booking.location}
                          shopCoords={booking.shopLat ? [booking.shopLat, booking.shopLng] : null}
                          customerCoords={booking.customerLat ? [booking.customerLat, booking.customerLng] : null}
                        />
                      </div>
                    )}
                  </div>
                  
                  {booking.status === 'delivered' && !booking.pickup_requested && (
                    <div className="mt-5 flex justify-end">
                      <button 
                        onClick={async () => {
                          if (!window.confirm('Request pickup for this bike?')) return;
                          try {
                            await bookingsApi.requestPickup(booking.id);
                            loadBookings();
                          } catch (err) { alert(err.message); }
                        }}
                        className="text-indigo-600 font-semibold text-sm border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-colors shadow-sm active:scale-95"
                      >
                        Request Pickup
                      </button>
                    </div>
                  )}

                  {booking.pickup_requested && booking.status !== 'completed' && (
                    <div className="mt-5 text-right">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-2 rounded-xl">
                        Pickup Requested
                      </span>
                    </div>
                  )}

                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="mt-5 flex justify-end">
                      <button 
                        onClick={() => openCancelModal(booking)}
                        className="text-red-600 font-semibold text-sm border border-red-200 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-xl transition-colors shadow-sm active:scale-95"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-6 py-5 bg-purple-700 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Cancel Booking</h2>
                  <p className="text-sm text-purple-200">Provide cancellation reason and refund details.</p>
                </div>
                <button onClick={closeCancelModal} className="text-white/80 hover:text-white transition">
                  <span className="sr-only">Close</span>✕
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl text-sm font-medium shadow-sm">
                  <strong>Note:</strong> A 5% commission charge will be deducted from the refundable amount when this booking is cancelled.
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for cancellation</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-gray-200 p-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    placeholder="Tell us why you are cancelling this booking..."
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Refund method</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundMethod('bank')}
                      className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${refundMethod === 'bank' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'}`}
                    >
                      Bank transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundMethod('upi')}
                      className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${refundMethod === 'upi' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'}`}
                    >
                      UPI
                    </button>
                  </div>
                </div>

                {refundMethod === 'bank' ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account holder name</label>
                      <input
                        value={refundDetails.accountHolderName}
                        onChange={(e) => setRefundDetails(prev => ({ ...prev, accountHolderName: e.target.value.replace(/[^a-zA-Z\\s]/g, '') }))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account number</label>
                      <input
                        value={refundDetails.accountNumber}
                        onChange={(e) => setRefundDetails(prev => ({ ...prev, accountNumber: e.target.value.replace(/\\D/g, '') }))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC code</label>
                      <input
                        value={refundDetails.ifscCode}
                        onChange={(e) => setRefundDetails(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="ABCD0123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bank name</label>
                      <input
                        value={refundDetails.bankName}
                        onChange={(e) => setRefundDetails(prev => ({ ...prev, bankName: e.target.value.replace(/[^a-zA-Z\\s]/g, '') }))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="Example Bank"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID</label>
                    <input
                      value={refundDetails.upiId}
                      onChange={(e) => setRefundDetails(prev => ({ ...prev, upiId: e.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      placeholder="example@upi"
                    />
                  </div>
                )}

                {cancelError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{cancelError}</div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={submitCancel}
                    disabled={cancelingBookingId === cancelModalBooking.id}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-white font-semibold transition ${cancelingBookingId === cancelModalBooking.id ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    {cancelingBookingId === cancelModalBooking.id ? 'Submitting...' : 'Submit Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingHistory;
