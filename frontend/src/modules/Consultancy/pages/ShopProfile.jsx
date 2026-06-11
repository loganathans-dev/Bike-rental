import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Clock, ShieldCheck,
  Landmark, Phone, Mail, FileText, Edit2, CheckCircle2,
  Calendar, AlertTriangle, Building2, User, Hash, Banknote, Loader2
} from 'lucide-react';
import { shopsApi } from '../../../api';
import { isPartnerLoggedIn } from '../../../utils/auth';

const Field = ({ label, value, icon, full = false }) => (
  <div className={`flex flex-col gap-1 ${full ? 'col-span-full' : ''}`}>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
      {icon && React.cloneElement(icon, { className: 'w-3 h-3' })} {label}
    </span>
    <span className="text-sm font-semibold text-gray-800 leading-snug">{value || '—'}</span>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-purple-50/60">
      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
        {React.cloneElement(icon, { className: 'w-4 h-4 text-purple-600' })}
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">{children}</div>
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = {
    approved: { text: 'Verified Shop', className: 'bg-green-100 text-green-700' },
    pending: { text: 'Pending Approval', className: 'bg-amber-100 text-amber-700' },
    rejected: { text: 'Rejected', className: 'bg-red-100 text-red-700' },
    blocked: { text: 'Blocked', className: 'bg-gray-100 text-gray-700' },
  };
  return map[status] || map.pending;
};

const ShopProfile = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPartnerLoggedIn()) {
      navigate('/consultancy/signin');
      return;
    }
    shopsApi
      .getMine()
      .then(({ shop: data }) => setShop(data))
      .catch((err) => {
        if (err.status === 404) {
          setError('Shop not found. Please register your shop.');
        } else {
          setError(err.message || 'Failed to load shop');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const fmt12h = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${((h % 12) || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading shop profile...
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Shop not found'}</p>
        <button
          onClick={() => navigate('/consultancy/shop-registration')}
          className="text-purple-600 font-semibold hover:underline"
        >
          Register your shop →
        </button>
      </div>
    );
  }

  const badge = statusBadge(shop.status);

  return (
    <div className="w-full font-sans space-y-6">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-purple-700 to-indigo-800 relative overflow-hidden">
          {shop.shopBanner && (
            <img src={shop.shopBanner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => navigate('/consultancy/shop-registration')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-xl border border-white/20 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 flex-shrink-0" /> Edit Profile
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-purple-100 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
              {shop.shopLogo ? (
                <img src={shop.shopLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-9 h-9 text-purple-500" />
              )}
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl ${badge.className}`}>
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> {badge.text}
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-gray-900">{shop.shopName}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400 flex-shrink-0" /> {shop.ownerName}
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <a href={`tel:${shop.contactNumber}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-700 transition-colors">
                <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" /> {shop.contactNumber}
              </a>
              <a href={`mailto:${shop.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-700 transition-colors">
                <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" /> {shop.email}
              </a>
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" /> {shop.city}, {shop.state}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Basic Information" icon={<Store />}>
          <Field label="Shop Name" value={shop.shopName} icon={<Store />} />
          <Field label="Owner Name" value={shop.ownerName} icon={<User />} />
          <Field label="Contact" value={shop.contactNumber} icon={<Phone />} />
          <Field label="Email" value={shop.email} icon={<Mail />} />
          <Field label="GST Number" value={shop.gstNumber} icon={<Hash />} />
        </Section>

        <Section title="Location Details" icon={<MapPin />}>
          <Field label="City" value={shop.city} icon={<MapPin />} />
          <Field label="State" value={shop.state} icon={<MapPin />} />
          <Field label="Pincode" value={shop.pincode} icon={<Hash />} />
          <Field label="Full Address" value={shop.address} icon={<Building2 />} full />
        </Section>

        <Section title="Operating Hours" icon={<Clock />}>
          <Field label="Opening Time" value={fmt12h(shop.openingTime)} icon={<Clock />} />
          <Field label="Closing Time" value={fmt12h(shop.closingTime)} icon={<Clock />} />
          <Field label="Working Days" value={shop.workingDays} icon={<Calendar />} full />
        </Section>

        <Section title="Bank Details" icon={<Landmark />}>
          <Field label="Account Holder" value={shop.accountHolderName} icon={<User />} />
          <Field label="Account Number" value={shop.accountNumber} icon={<Banknote />} />
          <Field label="IFSC Code" value={shop.ifscCode} icon={<Hash />} />
          <Field label="Bank Name" value={shop.bankName} icon={<Landmark />} />
        </Section>

        <div className="lg:col-span-2">
          <Section title="Rental Policies" icon={<ShieldCheck />}>
            <Field label="Minimum Age" value={`${shop.minimumAge} years`} icon={<User />} />
            <Field label="License Required" value={shop.licenseRequired} icon={<FileText />} />
            <Field label="Security Deposit Rules" value={shop.securityDepositRules} icon={<ShieldCheck />} full />
            <Field label="Late Return Charges" value={shop.lateReturnCharges} icon={<AlertTriangle />} full />
          </Section>
        </div>
      </div>
    </div>
  );
};

export default ShopProfile;
