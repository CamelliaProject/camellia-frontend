import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { PLANTATION_DATA } from '../tourist/PlantationDetail'; // Re-using existing mock data for now
import PlantationDetailsManagement from './PlantationDetailsManagement';
import PlantationMediaManagement from '../plantation-admin/PlantationMediaManagement';
import PlantationExperienceManagement from './PlantationExperienceManagement';
import PlantationBookingManagement from '../plantation-admin/PlantationBookingManagement';
import PlantationSetup from './PlantationSetup';
import { Image, GalleryHorizontal, Package, CalendarCheck, Wallet } from 'lucide-react'; // Added Wallet icon
import PlantationPayments from './PlantationPayments';

// Define a type for a simplified plantation admin user (can be extended)
interface PlantationAdminUser {
  username: string;
  email: string;
  plantationId: string; // The ID of the plantation this admin manages
}


// Extend AuthContext to include the admin user if authenticated as one
// (This is a simplified approach, a real app would have more robust role management)
// For this example, we'll assume a user object with a 'plantationId' property implies a plantation admin.

export default function PlantationAdminDashboard() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth(); // Assuming useAuth provides the logged-in user
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'experiences' | 'bookings' | 'payments'>('details');
  const [plantationAdmin, setPlantationAdmin] = useState<PlantationAdminUser | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [plantation, setPlantation] = useState<any>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);

  const isPlantationIncomplete = (plant: any) => {
    // Check if essential fields are missing or empty
    return !plant || !plant.name || !plant.address || !plant.contact?.email || 
           !plant.detailedDescription || !plant.highlights?.altitude || !plant.highlights?.area;
  };

  useEffect(() => {
    // In a real app, this would involve validating the user's role and associated plantation.
    // For this mock, check localStorage list and also enforce password-change requirement.
    if (user) {
      const plantations: any[] = JSON.parse(
        localStorage.getItem('superAdminPlantations') || '[]'
      );
      const found = plantations.find((p) => p.adminUsername === user.username);
      if (found) {
        setPlantationAdmin({
          username: found.adminUsername,
          email: user.email,
          plantationId: found.id,
        });
        if (!found.passwordChanged) {
          // force them to update their password first
          navigate('/plantation-admin/change-password');
        }

        // Check plantation data
        let plantData = PLANTATION_DATA[found.id];
        
        // Also check localStorage for updated plantation data
        try {
          const storedPlantations = JSON.parse(localStorage.getItem('plantations') || '{}');
          if (storedPlantations[found.id]) {
            plantData = storedPlantations[found.id];
          }
        } catch (e) {
          console.error('Failed to load plantation from localStorage:', e);
        }

        setPlantation(plantData);

        // If plantation details are incomplete, show setup form
        if (isPlantationIncomplete(plantData)) {
          setShowSetup(true);
        }
      } else {
        // If logged in but not a plantation admin, redirect or show error
        alert("You don't have permission to access the admin dashboard.");
        navigate('/dashboard'); // Redirect to tourist dashboard or home
      }
    } else {
      // If not logged in, redirect to sign-in or home
      navigate('/');
    }
  }, [user, navigate]);

  const handleSetupComplete = (completePlantation: any) => {
    setShowSetup(false);
    setPlantation(completePlantation);
    setSetupSuccess(true);
    setActiveTab('details');
    
    // Hide success message after 3 seconds
    setTimeout(() => setSetupSuccess(false), 3000);
  };


  if (!user || !plantationAdmin) {
    // Optionally show a loading spinner or a message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Loading dashboard or redirecting...</p>
      </div>
    );
  }

  // Show setup form if plantation details are incomplete
  if (showSetup) {
    return (
      <PlantationSetup 
        plantationId={plantationAdmin.plantationId} 
        onSetupComplete={handleSetupComplete}
      />
    );
  }

  if (!plantation) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1B4332]">
        <Navbar />
        <main className="py-16 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Plantation data not found for your account.</h1>
          <p className="text-lg text-gray-600 mb-6">Please contact support.</p>
          <button
            onClick={logOut}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      <Navbar />
      {setupSuccess && (
        <div className="bg-green-50 border-b-4 border-green-500 px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-green-600 text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-800">Setup Complete!</p>
                <p className="text-sm text-green-700">Your plantation profile has been created successfully. You can now upload images, create experiences, and manage bookings.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="py-16 px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold font-serif text-center mb-4">
              {plantation.name} Admin Dashboard
            </h1>
            <p className="text-gray-600 text-center">
              Manage your plantation's details, media, experiences, and bookings.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'details'
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Image size={20} /> Plantation Details
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'media'
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GalleryHorizontal size={20} /> Media Gallery
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'experiences'
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} /> Manage Experiences
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'bookings'
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CalendarCheck size={20} /> View Bookings
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'payments'
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Wallet size={20} /> Payments
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
            {activeTab === 'details' && (
              <PlantationDetailsManagement plantation={plantation} />
            )}
            {activeTab === 'media' && (
              <PlantationMediaManagement plantation={plantation} />
            )}
            {activeTab === 'experiences' && (
              <PlantationExperienceManagement plantation={plantation} />
            )}
            {activeTab === 'bookings' && (
              <PlantationBookingManagement plantationId={plantationAdmin.plantationId} />
            )}
            {activeTab === 'payments' && (
              <PlantationPayments plantationId={plantationAdmin.plantationId} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}