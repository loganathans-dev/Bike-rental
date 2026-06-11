import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, CheckCircle2 } from 'lucide-react';
import { bikesApi } from '../../../api';
import { BikeThumbnail } from '../../../components/BikeThumbnail';
import { isLoggedIn } from '../../../utils/auth';

const BikeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bikesApi
      .get(id)
      .then(({ bike: data }) => setBike(data))
      .catch((err) => setError(err.message || 'Failed to load bike'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading bike details...</p>
      </div>
    );
  }

  if (error || !bike) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{error || 'Bike not found.'}</p>
      </div>
    );
  }

  const handleCheckAvailability = () => {
    if (!bike.isAvailable) {
      alert('Sorry, this bike is currently not available.');
      return;
    }
    if (!isLoggedIn()) {
      localStorage.setItem('pending_bike_id', bike.id);
      navigate(`/customer/signin?redirect=/customer/booking/${bike.id}`);
      return;
    }
    navigate(`/customer/booking/${bike.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans pb-12">
      <header className="bg-blue-600 text-white py-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Bike Details</h1>
          <button onClick={() => navigate(-1)} className="text-sm underline">← Back</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md overflow-hidden md:flex md:h-[60vh] md:max-h-[500px]">
          <div className="h-56 sm:h-72 md:h-auto md:w-1/2 bg-gray-100 relative flex justify-center items-center overflow-hidden p-4">
            <BikeThumbnail bike={bike} className="w-full h-full object-contain" iconClassName="w-16 h-16 text-gray-300" />
            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bike.isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {bike.isAvailable ? 'Available' : 'Booked'}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {bike.rating}
            </div>
          </div>

          <div className="p-6 md:w-1/2 flex flex-col justify-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{bike.name}</h2>
            <p className="text-gray-600 mb-4">{bike.brand} • {bike.category}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500 block">Location</span>
                <span className="text-gray-800 flex items-center gap-1"><MapPin className="w-4 h-4" /> {bike.location}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Mileage</span>
                <span className="text-gray-800">{bike.mileage}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Fuel Type</span>
                <span className="text-gray-800">{bike.fuelType}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Daily Rate</span>
                <span className="text-gray-800 font-bold text-blue-600">₹{bike.pricePerDay}/day</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Hourly Rate</span>
                <span className="text-gray-800 font-bold text-blue-600">₹{bike.pricePerHour}/hr</span>
              </div>
            </div>

            <div className="mt-8 flex justify-start">
              <button onClick={handleCheckAvailability}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${bike.isAvailable ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
                disabled={!bike.isAvailable}
              >
                <CheckCircle2 className="w-4 h-4" /> Check Availability & Book
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BikeDetails;
