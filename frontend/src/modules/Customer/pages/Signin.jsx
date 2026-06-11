import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../../api';
import { setAuth } from '../../../utils/auth';

const CustomerSignin = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password, role: 'customer' });
      setAuth({ token, user });

      const pendingBike = localStorage.getItem('pending_bike_id');
      const redirect = searchParams.get('redirect')
        || (pendingBike ? `/customer/booking/${pendingBike}` : '/');
      if (pendingBike) localStorage.removeItem('pending_bike_id');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[0_20px_30px_-10px_rgba(37,99,235,0.2)] transition-all duration-300">

        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your customer account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        {searchParams.get('redirect') && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl mb-5 text-sm border border-blue-100 text-center">
            Please sign in to complete your booking.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="email" className="text-sm font-semibold text-gray-600">Email Address</label>
            <input
              type="email" id="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@test.com"
              className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-blue-300"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="password" className="text-sm font-semibold text-gray-600">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password123"
              className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-blue-300"
              required
            />
          </div>

          <button type="submit" disabled={loading}
            className="mt-2 bg-blue-600 text-white rounded-xl p-3.5 text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-blue-700 active:scale-95 shadow-md disabled:opacity-70">
            {loading ? 'Signing in...' : 'Sign In & Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/customer/signup" className="text-blue-600 font-semibold hover:text-blue-400 hover:underline transition-colors">
            Sign Up
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to Bike Listing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignin;
