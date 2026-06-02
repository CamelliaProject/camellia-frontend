
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import LandingPage from './features/tourist/LandingPage';
import Plantations from './features/tourist/Plantations';
import PlantationDetail from './features/tourist/PlantationDetail';
import PlantationReviews from './features/tourist/PlantationReviews';
import OnePageBooking from './features/tourist/OnePageBooking';
import About from './features/tourist/About';
import Contact from './features/tourist/Contact';
import Dashboard from './features/tourist/Dashboard';
import PaymentPage from './features/tourist/PaymentPage';
import BookingConfirmationPage from './features/tourist/BookingConfirmationPage';
import PaymentReturnPage from './features/tourist/PaymentReturnPage';
import PlantationAdminDashboard from './features/plantation-admin/PlantationAdminDashboard';
import ChangePassword from './features/plantation-admin/ChangePassword';
import SuperAdminDashboard from './features/super-admin/SuperAdminDashboard';
import TouristLogin from './features/auth/TouristLogin';
import PlantationAdminLogin from './features/auth/PlantationAdminLogin';
import SuperAdminLogin from './features/auth/SuperAdminLogin';
import PlantationRequestPage from './features/auth/PlantationRequest';
import SubscriptionPaymentPage from './features/auth/SubscriptionPaymentPage';
import SubscriptionPaymentReturnPage from './features/auth/SubscriptionPaymentReturnPage';
import SubscriptionRenewalPage from './features/auth/SubscriptionRenewalPage';
import SubscriptionRenewalReturnPage from './features/auth/SubscriptionRenewalReturnPage';
import { useAuth } from './context/AuthContext';

// Redirects to `loginPath` when the user is not authenticated or lacks the required role.
function ProtectedRoute({
  role,
  loginPath,
  children,
}: {
  role: string;
  loginPath: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5]">
        <svg className="w-8 h-8 animate-spin text-[#2D6A4F]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }
  if (!user || user.role !== role) {
    return <Navigate to={loginPath} replace state={{ authRequired: true }} />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/plantations" element={<Plantations />} />
        <Route path="/plantation/:id" element={<PlantationDetail />} />
        <Route path="/plantation/:id/reviews" element={<PlantationReviews />} />
        <Route path="/plantation/:id/booking" element={<OnePageBooking />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/plantation-admin/dashboard"
          element={
            <ProtectedRoute role="plantationadmin" loginPath="/plantationadmin">
              <PlantationAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plantation-admin/change-password"
          element={
            <ProtectedRoute role="plantationadmin" loginPath="/plantationadmin">
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute role="superadmin" loginPath="/superadmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<TouristLogin />} />
        <Route path="/plantationadmin" element={<PlantationAdminLogin />} />
        <Route path="/superadmin" element={<SuperAdminLogin />} />
        <Route path="/plantation-request" element={<PlantationRequestPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-return" element={<PaymentReturnPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
        <Route path="/subscription-payment" element={<SubscriptionPaymentPage />} />
        <Route path="/subscription-payment-return" element={<SubscriptionPaymentReturnPage />} />
        <Route path="/subscription-renew" element={<SubscriptionRenewalPage />} />
        <Route path="/subscription-renew-return" element={<SubscriptionRenewalReturnPage />} />
      </Routes>
    </Router>
  );
}

export default App;
