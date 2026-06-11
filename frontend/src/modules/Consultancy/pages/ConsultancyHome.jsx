import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Store, Bike, CalendarDays, LogOut, Users, Clock, Search, CreditCard, RefreshCcw, Star } from 'lucide-react';
import { logout } from '../../../utils/auth';

const ConsultancyHome = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/consultancy/signup');
  };

  const navLinks = [
    { name: 'Shop Profile', path: '/consultancy/shop-profile', icon: <Store className="w-4 h-4 mr-2 flex-shrink-0" /> },
    { name: 'Bike Management', path: '/consultancy/bike-management', icon: <Bike className="w-4 h-4 mr-2 flex-shrink-0" /> },
    { name: 'Booking History', path: '/consultancy/booking-history', icon: <CalendarDays className="w-4 h-4 mr-2 flex-shrink-0" /> },
    { name: 'Staff Management', path: '/consultancy/staff', icon: <Users className="w-4 h-4 mr-2 flex-shrink-0" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top App Bar */}
      <header className="bg-purple-700 text-white shadow-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-lg sm:text-xl tracking-tight">Consultancy Dashboard</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-2 items-center">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'bg-purple-800 text-white shadow-inner' 
                      : 'hover:bg-purple-600'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              <div className="h-6 w-px bg-purple-500 mx-1"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors text-purple-100 hover:bg-purple-600 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                Logout
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-purple-600 focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'} overflow-hidden bg-purple-800 shadow-xl absolute w-full left-0 top-16`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center w-full px-3 py-3 rounded-md text-base font-medium ${
                  isActive(link.path) 
                    ? 'bg-purple-900 text-white' 
                    : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <div className="border-t border-purple-700 my-1"></div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-purple-100 hover:bg-purple-700 hover:text-white text-left"
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ConsultancyHome;
