
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
import PlantationAdminDashboard from './features/plantation-admin/PlantationAdminDashboard';
import ChangePassword from './features/plantation-admin/ChangePassword';
import SuperAdminDashboard from './features/super-admin/SuperAdminDashboard';
import TouristLogin from './features/auth/TouristLogin';
import PlantationAdminLogin from './features/auth/PlantationAdminLogin';
import SuperAdminLogin from './features/auth/SuperAdminLogin';
import PlantationRequestPage from './features/auth/PlantationRequest';
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
  if (loading) return null;
  if (!user || user.role !== role) return <Navigate to={loginPath} replace />;
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
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
