import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Bike, Eye, Search, SlidersHorizontal,
  LogOut, User, X, Star, Compass, ShieldCheck, Clock,
  LogIn
} from 'lucide-react';
import { bikesApi } from '../../../api';
import { BikeThumbnail } from '../../../components/BikeThumbnail';
import { isLoggedIn, logout } from '../../../utils/auth';

const CustomerHome = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [bikes, setBikes] = useState([]);
  const [locations, setLocations] = useState(['All Locations']);
  const [categories, setCategories] = useState(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [maxPrice, setMaxPrice]                 = useState(3000);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [selectedBike, setSelectedBike]         = useState(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [showLoginPrompt, setShowLoginPrompt]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    bikesApi
      .list({
        search: searchTerm || undefined,
        location: selectedLocation,
        category: selectedCategory,
        maxPrice: String(maxPrice),
        availableOnly: availabilityOnly ? 'true' : undefined,
      })
      .then(({ bikes: data, meta }) => {
        if (cancelled) return;
        setBikes(data);
        if (meta?.locations?.length) setLocations(meta.locations);
        if (meta?.categories?.length) setCategories(meta.categories);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load bikes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchTerm, selectedLocation, selectedCategory, maxPrice, availabilityOnly]);

  const filteredBikes = bikes;

  // ── "Book Now" handler – guard with login ──────────────────────────────────
  const handleBookNow = () => {
    if (!loggedIn) {
      // Save the intended bike so we can resume after login
      localStorage.setItem('pending_bike_id', selectedBike.id);
      navigate('/customer/signin?redirect=/');
      return;
    }
    navigate(`/customer/booking/${selectedBike.id}`);
    setSelectedBike(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans pb-12">

      {/* ── Navigation Header ─────────────────────────────────────────────── */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 flex-shrink-0" />
              <span className="font-bold text-lg sm:text-xl tracking-tight">BikeRide</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/consultancy/signin')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-700/50 hover:bg-blue-700 rounded-xl text-xs font-medium text-blue-100 transition-colors mr-2"
              >
                 Partners Login
              </button>
              {loggedIn ? (
                <>
                  <button
                    onClick={() => navigate('/customer/bookings')}
                    className="flex items-center gap-1.5 text-xs text-blue-100 font-medium px-3 py-1.5 bg-blue-700/50 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    My Bookings
                  </button>
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-blue-100 font-medium px-3 py-1.5 bg-blue-700/50 rounded-xl">
                    <User className="w-3.5 h-3.5 flex-shrink-0" /> My Account
                  </span>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all">
                    <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/customer/signin?redirect=/')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
                    <LogIn className="w-4 h-4 flex-shrink-0" /> Sign In
                  </button>
                  <button onClick={() => navigate('/customer/signup')}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 max-w-2xl text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Find Your Perfect Ride</h1>
            <p className="mt-2 text-blue-100 text-sm sm:text-base">
              Browse verified bikes. Sign in only when you're ready to book — no account needed to explore!
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 mb-8">
          <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-3 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="text-base">Search & Filter Bikes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Brand or model..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 transition-all shadow-sm" />
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
              <div className="relative">
                <Bike className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            {/* Max Price */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Price / Day</label>
                <span className="text-xs font-bold text-blue-600">₹{maxPrice}</span>
              </div>
              <input type="range" min="300" max="3000" step="50"
                value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
            <input type="checkbox" id="availability" checked={availabilityOnly}
              onChange={e => setAvailabilityOnly(e.target.checked)}
              className="w-5 h-5 accent-blue-600 cursor-pointer flex-shrink-0" />
            <label htmlFor="availability" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Show available vehicles only
            </label>
          </div>
        </div>

        {loadError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading bikes...</div>
        ) : filteredBikes.length === 0 ? (
          <div className="bg-blue-50/40 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No rides matching filters</h3>
            <p className="text-gray-500 text-sm mt-1">Try resetting or broadening your search parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBikes.map(bike => (
              <div key={bike.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-[0_10px_30px_-10px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col group">
                <div className="h-44 bg-gray-100 relative overflow-hidden">
                  <BikeThumbnail
                    bike={bike}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    iconClassName="w-10 h-10 text-gray-300"
                  />
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bike.isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {bike.isAvailable ? 'Available' : 'Booked'}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {bike.rating}
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{bike.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{bike.brand} • {bike.category}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span>{bike.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-extrabold text-blue-600 text-base">₹{bike.pricePerDay}</span>
                        <span className="text-[9px] text-gray-400 font-semibold uppercase">/day</span>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-semibold text-gray-500 text-xs">₹{bike.pricePerHour}</span>
                        <span className="text-[9px] text-gray-400 font-semibold uppercase">/hr</span>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/customer/bike/${bike.id}`)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                      <Eye className="w-3.5 h-3.5 flex-shrink-0" /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Bike Detail Modal ──────────────────────────────────────────────── */}
      {selectedBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

            {/* Modal Image */}
            <div className="h-52 sm:h-60 relative bg-gray-100 flex-shrink-0">
              <BikeThumbnail
                bike={selectedBike}
                className="w-full h-full object-cover"
                iconClassName="w-12 h-12 text-gray-300"
              />
              <button onClick={() => setSelectedBike(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                  ₹{selectedBike.pricePerDay} / day
                </div>
                <div className="bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                  ₹{selectedBike.pricePerHour} / hr
                </div>
              </div>
            </div>

            {/* Scrollable Details */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-5 text-left">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedBike.brand} • {selectedBike.category}</span>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{selectedBike.name}</h3>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" /> {selectedBike.location}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" /> {selectedBike.rating}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedBike.isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {selectedBike.isAvailable ? 'Available Now' : 'Not Available'}
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm">
                {[['Mileage', selectedBike.mileage], ['Fuel Type', selectedBike.fuelType], ['Hourly Rate', `₹${selectedBike.pricePerHour}/hr`], ['Daily Rate', `₹${selectedBike.pricePerDay}/day`]].map(([label, val]) => (
                  <div key={label}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{label}</span>
                    <span className="font-semibold text-gray-800">{val}</span>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex gap-2.5 items-start">
                  <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>Helmet Provided:</strong> One premium sterilized helmet included. Extra available on request.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>Flexible Pickups:</strong> Pick up from station or opt for home delivery at checkout.
                  </p>
                </div>
              </div>

              {/* Login Prompt (shown when not logged in and user tries to book) */}
              {showLoginPrompt && !loggedIn && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Sign in to confirm your booking</p>
                    <p className="text-xs text-blue-600 mt-0.5">Your selected bike will be reserved after login.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => navigate('/customer/signin?redirect=/')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
                      Sign In
                    </button>
                    <button onClick={() => navigate('/customer/signup')}
                      className="flex-1 sm:flex-none px-4 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all">
                      Sign Up
                    </button>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <div className="pt-1">
                {selectedBike.isAvailable ? (
                  <button onClick={() => {
                    if (!loggedIn) { setShowLoginPrompt(true); return; }
                    handleBookNow();
                  }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-95">
                    {loggedIn ? 'Confirm & Book Now' : 'Book Now'}
                  </button>
                ) : (
                  <button disabled
                    className="w-full bg-gray-200 text-gray-400 font-bold py-3.5 px-6 rounded-2xl text-sm cursor-not-allowed">
                    Currently Rented Out
                  </button>
                )}
                {!loggedIn && selectedBike.isAvailable && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    You'll be asked to sign in when you book.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
