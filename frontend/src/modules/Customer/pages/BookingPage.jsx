import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Mail, Phone, IdCard, Home, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { bikesApi, bookingsApi } from '../../../api';
import { getAuthUser, isLoggedIn } from '../../../utils/auth';
import LocationPicker from '../../../components/LocationPicker';

function buildDateTime(date, time) {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const today = () => new Date().toISOString().slice(0, 10);

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rentalType, setRentalType] = useState('daily');
  const [pickupLocation, setPickupLocation] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [licence, setLicence] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [licenceFile, setLicenceFile] = useState(null);
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerLat, setCustomerLat] = useState(null);
  const [customerLng, setCustomerLng] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      localStorage.setItem('pending_bike_id', id);
      navigate(`/customer/signin?redirect=/customer/booking/${id}`);
      return;
    }

    const user = getAuthUser('customer') || getAuthUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }

    bikesApi
      .get(id)
      .then(({ bike: data }) => setBike(data))
      .catch(() => setBike(null))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Bike not found.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!bike.isAvailable) {
      setError('This bike is not available right now. Pick another bike from the home page.');
      return;
    }

    let missing = [];
    if (!startDate) missing.push(rentalType === 'hourly' ? 'Date' : 'Start Date');
    if (!startTime) missing.push('Start Time');
    if (rentalType === 'daily' && !endDate) missing.push('End Date');
    if (!endTime) missing.push('End Time');
    if (isDeliveryRequested && !deliveryAddress) missing.push('Delivery Address');
    if (isDeliveryRequested && (!customerLat || !customerLng)) missing.push('Pinpoint Exact Delivery Location');
    if (!isDeliveryRequested && !pickupLocation) missing.push('Pickup Location');
    if (!name) missing.push('Full Name');
    if (!email) missing.push('Email');
    if (!mobile) missing.push('Mobile Number');
    if (!licence) missing.push('Driving Licence ID');
    if (!address) missing.push('Address');
    if (!aadhaar) missing.push('Aadhaar Number');

    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    if (mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    const start = buildDateTime(startDate, startTime);
    const end = buildDateTime(endDate, endTime);
    if (!start || !end) {
      setError('Invalid date or time. Please check your entries.');
      return;
    }
    if (end <= start) {
      setError('End date and time must be after start date and time.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { booking } = await bookingsApi.create({
        bikeId: bike.id,
        startDate,
        startTime,
        endDate,
        endTime,
        pickupLocation,
        customerName: name,
        customerEmail: email,
        customerMobile: mobile,
        licence,
        address,
        aadhaar,
        isDeliveryRequested,
        deliveryAddress,
        rentalType,
        customerLat,
        customerLng
      });
      navigate(`/customer/payment/${bike.id}`, { state: { bookingId: booking.id, amount: booking.totalAmount } });
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans pb-12">
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Book {bike.name}</h1>
          <button onClick={() => navigate(-1)} className="text-sm underline">← Back</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-md p-6 space-y-5">
          {!bike.isAvailable && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              This bike is marked as unavailable. You cannot complete a booking until it is available again.
            </p>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2">Rental Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="daily" checked={rentalType === 'daily'} onChange={(e) => setRentalType(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span>Per Day (₹{bike.pricePerDay})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="hourly" checked={rentalType === 'hourly'} onChange={(e) => {
                    setRentalType(e.target.value);
                    setEndDate(startDate);
                  }} className="w-4 h-4 text-blue-600" />
                  <span>Per Hour (₹{bike.pricePerHour})</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Calendar className="inline-block w-4 h-4 mr-1" />{rentalType === 'hourly' ? 'Date' : 'Start Date'}</label>
              <input type="date" min={today()} value={startDate} onChange={e => {
                setStartDate(e.target.value);
                if (rentalType === 'hourly') setEndDate(e.target.value);
              }} className="p-2 border rounded" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Clock className="inline-block w-4 h-4 mr-1" />Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 border rounded" required />
            </div>
            {rentalType === 'daily' && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1"><Calendar className="inline-block w-4 h-4 mr-1" />End Date</label>
                <input type="date" min={startDate || today()} value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded" required />
              </div>
            )}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Clock className="inline-block w-4 h-4 mr-1" />End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 border rounded" required />
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-blue-900 mb-3">
              <input type="checkbox" checked={isDeliveryRequested} onChange={e => setIsDeliveryRequested(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
              Request Bike Delivery (₹100)
            </label>

            {isDeliveryRequested ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1"><MapPin className="inline-block w-4 h-4 mr-1" />Delivery Address</label>
                  <textarea placeholder="Enter your full delivery address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="p-2 border rounded border-blue-200" rows={2} required={isDeliveryRequested} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Pinpoint Exact Delivery Location</label>
                  <LocationPicker 
                    initialPosition={customerLat ? { lat: customerLat, lng: customerLng } : null}
                    onLocationSelect={(pos) => { setCustomerLat(pos.lat); setCustomerLng(pos.lng); }}
                    onAddressSelect={(addressData) => {
                      if (addressData.fullAddress) setDeliveryAddress(addressData.fullAddress);
                    }}
                  />
                  {customerLat && customerLng && bike.shopLat && bike.shopLng && (
                    <div className="mt-3 bg-blue-100/50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800 font-medium">
                      {(() => {
                        const R = 6371;
                        const dLat = (bike.shopLat - customerLat) * Math.PI / 180;
                        const dLon = (bike.shopLng - customerLng) * Math.PI / 180;
                        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(customerLat * Math.PI / 180) * Math.cos(bike.shopLat * Math.PI / 180) * 
                          Math.sin(dLon/2) * Math.sin(dLon/2); 
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                        const distanceKm = R * c;
                        const mins = distanceKm <= 5 ? 10 : distanceKm <= 15 ? 20 : 30;
                        return `Delivery Info: After booking, the bike will be delivered within ${mins} minutes.`;
                      })()}
                    </div>
                  )}
                  {(!customerLat || !customerLng) && (
                    <div className="mt-3 bg-blue-100/50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800 font-medium">
                      Delivery Info: After booking, the bike will be delivered within 30 minutes.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1"><MapPin className="inline-block w-4 h-4 mr-1" />Pickup Location</label>
                <input type="text" placeholder="e.g. Main Street, Bangalore" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="p-2 border rounded" required={!isDeliveryRequested} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><User className="inline-block w-4 h-4 mr-1" />Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value.replace(/[^a-zA-Z\\s]/g, ''))} className="p-2 border rounded" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Mail className="inline-block w-4 h-4 mr-1" />Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 border rounded" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Phone className="inline-block w-4 h-4 mr-1" />Mobile Number</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className="p-2 border rounded" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><IdCard className="inline-block w-4 h-4 mr-1" />Driving Licence ID</label>
              <input type="text" value={licence} onChange={e => setLicence(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className="p-2 border rounded" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><Home className="inline-block w-4 h-4 mr-1" />Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} className="p-2 border rounded" rows={2} required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1"><ShieldCheck className="inline-block w-4 h-4 mr-1" />Aadhaar Number</label>
              <input type="text" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\\D/g, '').slice(0, 12))} className="p-2 border rounded" required />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1"><Upload className="inline-block w-4 h-4 mr-1" />Licence ID Proof (PDF/Image)</label>
            <input type="file" accept="image/*,application/pdf" onChange={e => setLicenceFile(e.target.files[0])} className="p-2 border rounded" />
            {licenceFile && <p className="text-sm text-gray-600 mt-1">Selected: {licenceFile.name}</p>}
          </div>

          {(() => {
            const start = buildDateTime(startDate, startTime);
            const end = buildDateTime(endDate, endTime);
            if (start && end && end > start) {
              const ms = end - start;
              const hours = Math.ceil(ms / (1000 * 60 * 60));
              const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
              const basePrice = rentalType === 'hourly' ? hours * bike.pricePerHour : days * bike.pricePerDay;
              const deliveryCharge = isDeliveryRequested ? 100 : 0;
              const total = basePrice + deliveryCharge;
              return (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-semibold mb-1">Live Calculation</p>
                    <p className="text-xs text-green-700">
                      {rentalType === 'hourly' ? `${hours} Hours x ₹${bike.pricePerHour}` : `${days} Days x ₹${bike.pricePerDay}`}
                      {isDeliveryRequested && ' + ₹100 Delivery'}
                    </p>
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    ₹{total}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex items-center justify-between pt-4">
            <button type="submit" disabled={submitting || !bike.isAvailable} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-md disabled:opacity-70">
              <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Saving...' : 'Confirm Booking'}
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStartDate(''); setStartTime(''); setEndDate(''); setEndTime('');
                  setPickupLocation(''); setMobile(''); setLicence(''); setAddress('');
                  setAadhaar(''); setLicenceFile(null); setIsDeliveryRequested(false); setDeliveryAddress('');
                  const user = getAuthUser('customer') || getAuthUser();
                  setName(user?.name || ''); setEmail(user?.email || '');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Clear Data
              </button>
              <button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:underline font-medium">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BookingPage;
