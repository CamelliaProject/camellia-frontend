// --- START OF FILE App.tsx ---

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './features/tourist/LandingPage';
import Plantations from './features/tourist/Plantations';
import PlantationDetail from './features/tourist/PlantationDetail';
import PlantationReviews from './features/tourist/PlantationReviews';
import OnePageBooking from './features/tourist/OnePageBooking';
import About from './features/tourist/About';
import Contact from './features/tourist/Contact';
import Dashboard from './features/tourist/Dashboard'; // Tourist Dashboard
import PaymentPage from './features/tourist/PaymentPage';
import BookingConfirmationPage from './features/tourist/BookingConfirmationPage';
import PlantationAdminDashboard from './features/plantation-admin/PlantationAdminDashboard';
import ChangePassword from './features/plantation-admin/ChangePassword';
import SuperAdminDashboard from './features/super-admin/SuperAdminDashboard'; // NEW: Super Admin Dashboard

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
        <Route path="/dashboard" element={<Dashboard />} /> {/* Tourist Dashboard */}
        <Route path="/plantation-admin/dashboard" element={<PlantationAdminDashboard />} /> {/* Plantation Admin Dashboard */}
        <Route path="/plantation-admin/change-password" element={<ChangePassword />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} /> {/* NEW: Super Admin Dashboard */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
