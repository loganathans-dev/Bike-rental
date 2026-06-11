import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api';
import { setAuth, isPartnerLoggedIn } from '../../../utils/auth';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPartnerLoggedIn()) {
      navigate('/consultancy/shop-profile');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authApi.register({ name: name || 'Partner', email, password, role: 'consultancy' });
      setAuth({ token, user });
      navigate('/consultancy/shop-registration');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-purple-50 p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_20px_30px_-10px_rgba(170,59,255,0.2),0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all duration-300">
        <h2 className="text-center mb-6 text-gray-900 text-3xl font-semibold">Consultancy Sign Up</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-5 text-sm border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="name" className="text-sm font-medium text-gray-600">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="p-3 border border-gray-200 rounded-lg bg-gray-50" required />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="email" className="text-sm font-medium text-gray-600">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email"
              className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-sans text-base outline-none transition-all duration-300 focus:border-purple-500 focus:ring-3 focus:ring-purple-100"
              required 
            />
          </div>
          
          <div className="flex flex-col gap-2 text-left relative">
            <label htmlFor="password" className="text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Create a password"
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-sans text-base outline-none transition-all duration-300 focus:border-purple-500 focus:ring-3 focus:ring-purple-100"
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 text-left relative">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-600">Confirm Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm your password"
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-sans text-base outline-none transition-all duration-300 focus:border-purple-500 focus:ring-3 focus:ring-purple-100"
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="mt-2 bg-purple-600 text-white border-none rounded-lg p-3.5 text-base font-semibold disabled:opacity-70">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/consultancy/signin" className="text-purple-600 font-semibold no-underline transition-colors duration-300 hover:text-purple-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
