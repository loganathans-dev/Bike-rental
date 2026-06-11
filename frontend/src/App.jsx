import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Admin Pages
import AdminLayout from './modules/Admin/pages/AdminLayout'
import AdminSignin from './modules/Admin/pages/AdminSignin'
import AdminDashboard from './modules/Admin/pages/Dashboard'
import ShopVerification from './modules/Admin/pages/ShopVerification'
import BikeVerification from './modules/Admin/pages/BikeVerification'
import PaymentMonitoring from './modules/Admin/pages/PaymentMonitoring'
import AdminBookingHistory from './modules/Admin/pages/BookingHistory'
import AdminRefunds from './modules/Admin/pages/Refunds'
import PartnerPayments from './modules/Admin/pages/PartnerPayments'

// Consultancy Pages
import ConsultancySignin from './modules/Consultancy/pages/Signin'
import ConsultancySignup from './modules/Consultancy/pages/Signup'
import ShopRegistration from './modules/Consultancy/pages/ShopRegistration'
import ConsultancyHome from './modules/Consultancy/pages/ConsultancyHome'
import ShopProfile from './modules/Consultancy/pages/ShopProfile'
import BikeManagement from './modules/Consultancy/pages/BikeManagement'
import BookingHistory from './modules/Consultancy/pages/BookingHistory'
import StaffList from './modules/Consultancy/pages/StaffList'
import Extensions from './modules/Consultancy/pages/Extensions'
import Inspections from './modules/Consultancy/pages/Inspections'
import Payments from './modules/Consultancy/pages/Payments'
import RefundsList from './modules/Consultancy/pages/RefundsList'
import Reviews from './modules/Consultancy/pages/Reviews'

// Customer Pages
import CustomerSignin from './modules/Customer/pages/Signin'
import CustomerSignup from './modules/Customer/pages/Signup'
import CustomerHome from './modules/Customer/pages/Home'
import BikeDetails from './modules/Customer/pages/BikeDetails'
import BookingPage from './modules/Customer/pages/BookingPage'
import PaymentPage from './modules/Customer/pages/PaymentPage'
import CustomerBookingHistory from './modules/Customer/pages/BookingHistory'

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Customer-facing routes ─────────────────────────────── */}
        {/* Root → Customer Bike Listing (public, no login required) */}
        <Route path="/" element={<CustomerHome />} />
        <Route path="/customer/signin" element={<CustomerSignin />} />
        <Route path="/customer/signup" element={<CustomerSignup />} />
        {/* Customer Detail & Booking Routes */}
        <Route path="/customer/bike/:id" element={<BikeDetails />} />
        <Route path="/customer/booking/:id" element={<BookingPage />} />
        <Route path="/customer/payment/:id" element={<PaymentPage />} />
        <Route path="/customer/bookings" element={<CustomerBookingHistory />} />

        {/* ── Consultancy / Partner routes ───────────────────────── */}
        <Route path="/consultancy/signin" element={<ConsultancySignin />} />
        <Route path="/consultancy/signup" element={<ConsultancySignup />} />
        <Route path="/consultancy/shop-registration" element={<ShopRegistration />} />
        <Route path="/consultancy" element={<ConsultancyHome />}>
          <Route path="shop-profile" element={<ShopProfile />} />
          <Route path="bike-management" element={<BikeManagement />} />
          <Route path="booking-history" element={<BookingHistory />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="extensions" element={<Extensions />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="payments" element={<Payments />} />
          <Route path="refunds" element={<RefundsList />} />
          <Route path="reviews" element={<Reviews />} />
          <Route index element={<Navigate to="shop-profile" replace />} />
        </Route>

        {/* ── Admin routes ───────────────────────────────────────── */}
        <Route path="/admin/signin" element={<AdminSignin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="shop-verification" element={<ShopVerification />} />
          <Route path="bike-verification" element={<BikeVerification />} />
          <Route path="payments" element={<PaymentMonitoring />} />
          <Route path="partner-payments" element={<PartnerPayments />} />
          <Route path="bookings" element={<AdminBookingHistory />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App
