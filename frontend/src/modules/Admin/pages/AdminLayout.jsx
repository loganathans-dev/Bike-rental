import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Bike, CreditCard, Calendar, LogOut, Shield, IndianRupee } from 'lucide-react';
import { clearAdminAuth, getAuthUser, isAdminLoggedIn } from '../../../utils/auth';

const AdminLayout = () => {
  const navigate = useNavigate();
  const user = getAuthUser('admin') || getAuthUser();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/signin', { replace: true });
      return;
    }

    const onStorage = (e) => {
      if (e.key === 'admin_auth_token' || e.key === 'admin_auth_user') {
        if (!isAdminLoggedIn()) {
          navigate('/admin/signin', { replace: true });
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Shop Verification', path: '/admin/shop-verification', icon: <Store className="w-5 h-5" /> },
    { name: 'Bike Verification', path: '/admin/bike-verification', icon: <Bike className="w-5 h-5" /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Partner Payments', path: '/admin/partner-payments', icon: <IndianRupee className="w-5 h-5" /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Refunds', path: '/admin/refunds', icon: <IndianRupee className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="w-6 h-6 text-blue-500 mr-2" />
          <span className="text-xl font-bold tracking-wider">ADMIN PANEL</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="ml-3 font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => { clearAdminAuth(); navigate('/admin/signin'); }} 
            className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3 font-medium">Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Admin Portal</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              A
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
