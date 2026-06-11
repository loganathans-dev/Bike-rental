import { useEffect, useState } from 'react';
import { bookingsApi, staffApi, cancellationsApi } from '../../../api';
import { isPartnerLoggedIn } from '../../../utils/auth';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Bike, Filter, Eye, XCircle, Download,
  Search, ChevronDown, X, Clock, User, Phone,
  CheckCircle2, RotateCcw, TrendingUp, MapPin, Map as MapIcon
} from 'lucide-react';
import LocationMap from '../../../components/LocationMap';

const STATUS_CONFIG = {
  Upcoming:  { label: 'Upcoming',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',   icon: <Clock className="w-3.5 h-3.5" /> },
  Ready:     { label: 'Ready',      color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  OnTheWay:  { label: 'On The Way', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500',  icon: <Bike className="w-3.5 h-3.5" /> },
  Delivered: { label: 'Delivered',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',  icon: <MapPin className="w-3.5 h-3.5" /> },
  Completed: { label: 'Completed',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-500',   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Cancelled: { label: 'Cancelled',  color: 'bg-red-100 text-red-700',       dot: 'bg-red-400',     icon: <XCircle className="w-3.5 h-3.5" /> },
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
};

const mapApiBooking = (b) => ({
  id: b.id,
  customerName: b.customerName || 'Customer',
  phone: b.customerMobile || '—',
  bike: b.bikeName,
  vehicleNo: b.vehicleNumber || '—',
  fromDate: formatDate(b.startDate),
  toDate: formatDate(b.endDate),
  hours: null,
  totalAmount: b.totalAmount,
  status:
    b.status === 'upcoming' || b.status === 'booked' ? 'Upcoming'
    : b.status === 'ready' ? 'Ready'
    : b.status === 'on_the_way' ? 'OnTheWay'
    : b.status === 'delivered' ? 'Delivered'
    : b.status === 'completed' ? 'Completed'
    : b.status === 'cancelled' ? 'Cancelled'
    : 'Upcoming',
  rawStatus: b.status,
  apiId: b.id,
  isDeliveryRequested: b.is_delivery_requested || false,
  deliveryAddress: b.delivery_address || '',
  deliveryStaffId: b.delivery_staff_id,
  shopLat: b.shopLat || null,
  shopLng: b.shopLng || null,
  customerLat: b.customerLat || null,
  customerLng: b.customerLng || null,
  location: b.pickupLocation || b.pickup_location || '',
});
const STATUSES = ['All Status', 'Upcoming', 'Ready', 'OnTheWay', 'Delivered', 'Completed', 'Cancelled'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const BookingModal = ({ booking, onClose, onUpdateStatus, staffList, onAssignStaff }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(booking?.deliveryStaffId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;
  const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.Upcoming;
  const isCancellable = booking.status !== 'Completed' && booking.status !== 'Cancelled';
  const availableStaff = staffList.filter(st => st.role === 'Delivery Boy' && st.status === 'Active');
  const hasStatusChange = selectedStatus && selectedStatus !== booking.rawStatus;
  const hasStaffChange = selectedStaffId && selectedStaffId !== (booking?.deliveryStaffId || '');
  const hasChanges = hasStatusChange || hasStaffChange;
  const buttonDisabled = !hasChanges || saving;

  const handleSave = async () => {
    if (!hasChanges) return;
    setError('');
    setSaving(true);
    try {
      if (hasStatusChange) {
        await onUpdateStatus(booking.apiId, selectedStatus);
      }
      if (hasStaffChange) {
        await onAssignStaff(booking.apiId, selectedStaffId);
      }
      setSelectedStatus('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-5 rounded-t-2xl flex justify-between items-center text-white flex-shrink-0">
          <div>
            <p className="text-xs text-purple-200 mb-1">Booking ID</p>
            <h3 className="text-xl font-extrabold">{booking.id}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Details & Amount */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-500">Current Status</span>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
                  {s.icon} {s.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-5 text-sm bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-inner">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5"><User className="w-4 h-4 text-purple-400 flex-shrink-0" />{booking.customerName}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5"><Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />{booking.phone}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bike</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5"><Bike className="w-4 h-4 text-purple-400 flex-shrink-0" />{booking.bike}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vehicle No.</span>
                  <span className="font-semibold text-gray-800">{booking.vehicleNo}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From</span>
                  <span className="font-semibold text-gray-800">{booking.fromDate}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To</span>
                  <span className="font-semibold text-gray-800">{booking.toDate}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</span>
                  <span className="font-semibold text-gray-800">{booking.hours ? `${booking.hours} hrs` : `${Math.round((new Date(booking.toDate) - new Date(booking.fromDate)) / 86400000) + 1} days`}</span>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-purple-900 uppercase tracking-wider">Total Amount</span>
                <span className="text-3xl font-black text-purple-700">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Right Column: Actions & Map */}
            <div className="space-y-6">
              {isCancellable && (
                <div className="flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <label className="text-sm font-bold text-gray-700">Update Booking Status</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-sm font-medium bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    value={selectedStatus}
                  >
                    <option value="" disabled>-- Select New Status --</option>
                    <option value="ready">Ready for Pickup/Delivery</option>
                    <option value="on_the_way">On The Way</option>
                    <option value="delivered">Delivered / Handed Over</option>
                    <option value="completed">Completed / Returned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {booking.isDeliveryRequested && (
                <div className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <label className="text-sm font-bold text-blue-900">Assign Delivery Staff</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-blue-300 text-sm font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    value={selectedStaffId || ''}
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.filter(st => st.role === 'Delivery Boy').length === 0 ? (
                      <option value="" disabled>No Delivery Staff Found</option>
                    ) : (
                      staffList.filter(st => st.role === 'Delivery Boy').map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name} {staff.status !== 'Active' ? '(Inactive)' : ''}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {booking.isDeliveryRequested && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="px-4 py-3 flex items-center justify-between gap-2 text-gray-800 font-bold bg-gray-50 border-b border-gray-200">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Delivery Location</span>
                    <a 
                      href={booking.shopLat && booking.customerLat 
                        ? `https://www.google.com/maps/dir/?api=1&origin=${booking.shopLat},${booking.shopLng}&destination=${booking.customerLat},${booking.customerLng}`
                        : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.location)}&destination=${encodeURIComponent(booking.deliveryAddress)}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <MapIcon className="w-3.5 h-3.5" /> Get Directions
                    </a>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-3 bg-gray-50 p-2 rounded border border-gray-100">{booking.deliveryAddress}</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden relative flex-1 min-h-[220px]">
                      <LocationMap 
                        shopAddress={booking.location} 
                        customerAddress={booking.deliveryAddress}
                        shopCoords={booking.shopLat ? [booking.shopLat, booking.shopLng] : null}
                        customerCoords={booking.customerLat ? [booking.customerLat, booking.customerLng] : null}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 font-medium">{error}</div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm transition-colors shadow-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={buttonDisabled}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${buttonDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'}`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BookingHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings]       = useState([]);
  const [search, setSearch]           = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [bikeFilter, setBikeFilter]   = useState('All Bikes');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [staffList, setStaffList] = useState([]);

  const loadData = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setLoadError('');
    Promise.all([bookingsApi.list(), staffApi.list()])
      .then(([bRes, sRes]) => {
        setBookings(bRes.bookings.map(mapApiBooking));
        setStaffList(sRes.staff || []);
      })
      .catch((err) => {
        if (showLoader) setBookings([]);
        setLoadError(err.message || 'Failed to load data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const initialize = async () => {
      if (!isPartnerLoggedIn()) {
        navigate('/consultancy/signin');
        return;
      }
      await loadData();
    };

    initialize();
  }, [navigate]);

  const BIKES = ['All Bikes', ...new Set(bookings.map(b => b.bike))];

  // ── Filter Logic ───────────────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.customerName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchBike   = bikeFilter === 'All Bikes' || b.bike === bikeFilter;
    const matchStatus = statusFilter === 'All Status' || b.status === statusFilter;
    const matchFrom   = !dateFrom || new Date(b.fromDate) >= new Date(dateFrom);
    const matchTo     = !dateTo   || new Date(b.toDate)   <= new Date(dateTo);
    return matchSearch && matchBike && matchStatus && matchFrom && matchTo;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     bookings.length,
    active:    bookings.filter(b => ['Upcoming', 'Ready', 'OnTheWay', 'Delivered'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    revenue:   bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + b.totalAmount, 0),
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    try {
      await cancellationsApi.cancelBooking({ bookingId: id });
      loadData(false);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => ({ ...prev, rawStatus: 'cancelled', status: 'Cancelled' }));
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await bookingsApi.updateStatus(id, newStatus);
    loadData(false);
    
    const statusMap = {
      'ready': 'Ready',
      'on_the_way': 'OnTheWay',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    
    if (selectedBooking && selectedBooking.apiId === id) {
      setSelectedBooking(prev => ({ ...prev, rawStatus: newStatus, status: statusMap[newStatus] || 'Upcoming' }));
    }
  };


  const handleAssignStaff = async (id, staffId) => {
    try {
      await bookingsApi.assignStaff(id, staffId);
      loadData(false);
      if (selectedBooking && selectedBooking.apiId === id) {
        setSelectedBooking(prev => ({ ...prev, deliveryStaffId: staffId }));
      }
    } catch (err) {
      alert(err.message || 'Failed to assign staff');
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Booking ID', 'Customer', 'Phone', 'Bike', 'Vehicle No', 'From', 'To', 'Amount', 'Status'];
    const rows = filtered.map(b => [b.id, b.customerName, b.phone, b.bike, b.vehicleNo, b.fromDate, b.toDate, `₹${b.totalAmount}`, b.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'booking_history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setBikeFilter('All Bikes'); setStatusFilter('All Status'); };
  const hasActiveFilters = search || dateFrom || dateTo || bikeFilter !== 'All Bikes' || statusFilter !== 'All Status';

  return (
    <div className="w-full font-sans space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Booking History</h2>
          <p className="text-gray-500 text-sm mt-1">Track, manage and export all rental bookings.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md active:scale-95 transition-all whitespace-nowrap"
        >
          <Download className="w-4 h-4 flex-shrink-0" /> Export CSV
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Filter className="w-6 h-6 text-purple-600" />}    label="Total Bookings"  value={stats.total}     color="bg-purple-100" />
        <StatCard icon={<Clock className="w-6 h-6 text-blue-600" />}       label="Active Now"      value={stats.active}    color="bg-blue-100" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} label="Completed"     value={stats.completed} color="bg-green-100" />
        <StatCard icon={<TrendingUp className="w-6 h-6 text-amber-600" />} label="Total Revenue"   value={`₹${stats.revenue.toLocaleString()}`} color="bg-amber-100" />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text" placeholder="Search by customer name or booking ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300 transition-all"
          />
        </div>

        {/* Row 2 – Dropdowns + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bike Filter */}
          <div className="relative">
            <Bike className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={bikeFilter} onChange={e => setBikeFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 cursor-pointer hover:border-purple-300 transition-all"
            >
              {BIKES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 cursor-pointer hover:border-purple-300 transition-all"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300 transition-all cursor-pointer"
              placeholder="From Date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300 transition-all cursor-pointer"
              placeholder="To Date"
            />
          </div>
        </div>

        {/* Active filters row */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-gray-500">{filtered.length} result(s)</span>
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold ml-auto">
              <RotateCcw className="w-3 h-3" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{loadError}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading bookings from server...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-purple-50/40 border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No bookings found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Booking ID', 'Customer', 'Bike', 'Duration', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => {
                  const s = STATUS_CONFIG[b.status];
                  return (
                    <tr key={b.id} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-4 py-3.5 font-mono font-bold text-purple-700 text-xs">{b.id}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-800">{b.customerName}</p>
                        <p className="text-xs text-gray-400">{b.phone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-700">{b.bike}</p>
                        <p className="text-xs text-gray-400">{b.vehicleNo}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        <p>{b.fromDate}</p>
                        <p className="text-xs text-gray-400">→ {b.toDate}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedBooking(b)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                            <button onClick={() => handleCancel(b.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(b => {
              const s = STATUS_CONFIG[b.status];
              return (
                <div key={b.id} className="bg-white/80 border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-purple-700">{b.id}</span>
                      <p className="font-bold text-gray-800">{b.customerName}</p>
                      <p className="text-xs text-gray-400">{b.phone}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />{s.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 mb-3">
                    <div><span className="text-gray-400 block text-[10px] uppercase font-semibold">Bike</span>{b.bike}</div>
                    <div><span className="text-gray-400 block text-[10px] uppercase font-semibold">Amount</span><span className="font-bold text-gray-800">₹{b.totalAmount.toLocaleString()}</span></div>
                    <div><span className="text-gray-400 block text-[10px] uppercase font-semibold">From</span>{b.fromDate}</div>
                    <div><span className="text-gray-400 block text-[10px] uppercase font-semibold">To</span>{b.toDate}</div>
                  </div>
                  <div className="flex gap-2 border-t border-gray-50 pt-3">
                    <button onClick={() => setSelectedBooking(b)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                      <button onClick={() => handleCancel(b.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Booking Detail Modal ────────────────────────────────────────── */}
      <BookingModal 
        key={selectedBooking?.id}
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        onUpdateStatus={handleUpdateStatus} 
        staffList={staffList}
        onAssignStaff={handleAssignStaff}
      />
    </div>
  );
};

export default BookingHistory;
