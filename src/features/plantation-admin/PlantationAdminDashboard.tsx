import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, plantationApi } from '../../services/api';
import PlantationDetailsManagement from './PlantationDetailsManagement';
import PlantationMediaManagement from '../plantation-admin/PlantationMediaManagement';
import PlantationExperienceManagement from './PlantationExperienceManagement';
import PlantationBookingManagement from '../plantation-admin/PlantationBookingManagement';
import PlantationSetup from './PlantationSetup';
import { Image, GalleryHorizontal, Package, CalendarCheck, Wallet, LogOut, Leaf, LayoutDashboard, Settings } from 'lucide-react'; 
import PlantationPayments from './PlantationPayments';

interface PlantationAdminUser {
  username: string;
  email: string;
  plantationId: string; 
}


// Map flat DB row → nested format that PlantationDetailsManagement expects
function mapDbToNested(raw: any) {
  return {
    id:                  raw.id,
    name:                raw.name                || '',
    address:             raw.address             || '',
    description:         raw.description         || '',
    detailedDescription: raw.detailed_description || raw.detailedDescription || '',
    bestTime:            raw.best_time_to_visit  || raw.bestTime || '',
    contact: {
      phone: raw.phone || raw.contact?.phone || '',
      email: raw.email || raw.contact?.email || '',
    },
    highlights: {
      altitude:    raw.altitude    || raw.highlights?.altitude    || '',
      area:        raw.area        || raw.highlights?.area        || '',
      visitors:    raw.highlights?.visitors || '0',
      established: raw.established_year
        ? String(raw.established_year)
        : (raw.highlights?.established || ''),
    },
    activities: raw.activities || [],
    gallery:    raw.gallery    || [],
    experiences:raw.experiences || [],
    main_image_url: raw.main_image_url || '',
    rating:  raw.rating  || 0,
  };
}

export default function PlantationAdminDashboard() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'experiences' | 'bookings' | 'payments'>('details');
  const [plantationAdmin, setPlantationAdmin] = useState<PlantationAdminUser | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [rawPlantation, setRawPlantation] = useState<any>(null);   // flat DB row
  const [plantation, setPlantation] = useState<any>(null);          // nested for components
  const [plantationLoading, setPlantationLoading] = useState(true);
  const plantationIdRef = React.useRef<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);

  useEffect(() => {
    // Fetch plantation-specific bookings and reviews when plantation admin loads
    if (plantationAdmin?.plantationId) {
      fetchAdminData(plantationAdmin.plantationId);
    }
  }, [plantationAdmin?.plantationId]);

  const fetchAdminData = async (plantationId: string) => {
    setAdminDataLoading(true);
    try {
      // Fetch bookings for this plantation
      const bookingsRes = await adminApi.getPlantationBookings(plantationId);
      setBookings(bookingsRes.data.bookings || []);

      // Fetch reviews for this plantation
      const reviewsRes = await adminApi.getPlantationReviews(plantationId);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Fall back to mock data if API calls fail
    } finally {
      setAdminDataLoading(false);
    }
  };

  
  const isPlantationIncomplete = (raw: any) => !raw?.detailed_description;

  const refreshPlantation = useCallback(async () => {
    const pid = plantationIdRef.current;
    if (!pid) return;
    try {
      const response = await plantationApi.getById(pid);
      const raw = response.data?.data;
      setRawPlantation(raw);
      setPlantation(mapDbToNested(raw));
    } catch (error) {
      console.error('Failed to refresh plantation:', error);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'plantationadmin') {
      // First login: force password change before anything else
      if (!user.passwordChanged) {
        setPlantationLoading(false);
        navigate('/plantation-admin/change-password');
        return;
      }

      if (!user.plantationId) {
        alert("Your account is not associated with any plantation.");
        navigate('/');
        return;
      }

      plantationIdRef.current = user.plantationId;

      setPlantationAdmin({
        username: user.username || user.email,
        email: user.email,
        plantationId: user.plantationId,
      });

      const loadPlantationData = async () => {
        try {
          const response = await plantationApi.getById(user.plantationId!);
          const raw = response.data?.data;
          setRawPlantation(raw);
          if (isPlantationIncomplete(raw)) {
            setShowSetup(true);
          } else {
            setPlantation(mapDbToNested(raw));
          }
        } catch (error) {
          console.error('Failed to load plantation from backend:', error);
          setShowSetup(true);
        } finally {
          setPlantationLoading(false);
        }
      };

      void loadPlantationData();

    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSetupComplete = (raw: any) => {
    setRawPlantation(raw);
    setPlantation(mapDbToNested(raw));
    setShowSetup(false);
    setPlantationLoading(false);
    setSetupSuccess(true);
    setActiveTab('details');
    setTimeout(() => setSetupSuccess(false), 3000);
  };


  // Loading state — covers both the auth/setup check AND the plantation fetch
  if (!user || !plantationAdmin || plantationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5]">
        <svg className="w-10 h-10 animate-spin text-[#2D6A4F]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (showSetup) {
    return (
      <PlantationSetup
        plantationId={plantationAdmin.plantationId}
        existingData={rawPlantation}
        onSetupComplete={handleSetupComplete}
      />
    );
  }

  if (!plantation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans text-[#1B4332]">
        <div className="bg-white p-12 rounded-xl shadow-sm text-center max-w-lg">
          <h1 className="text-3xl font-bold mb-4 font-serif">Data Not Found</h1>
          <p className="text-lg text-gray-600 mb-8">Plantation data could not be found for your account. Please contact support.</p>
          <button
            onClick={logOut}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition inline-flex items-center gap-2"
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-[#1B4332]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B4332] text-white flex flex-col min-h-screen sticky top-0 shadow-xl z-20">
        <div className="p-6 border-b border-[#2D6A4F]">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-green-300" />
            <h1 className="text-xl font-bold font-serif whitespace-nowrap overflow-hidden text-ellipsis" title={plantation.name}>
              Admin
            </h1>
          </div>
          <p className="text-green-200 text-xs mt-2 pl-11 truncate">{plantation.name}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'details'
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            <Image size={20} /> Details
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'media'
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            <GalleryHorizontal size={20} /> Media Gallery
          </button>
          <button
            onClick={() => setActiveTab('experiences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'experiences'
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            <Package size={20} /> Experiences
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'bookings'
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            <CalendarCheck size={20} /> View Bookings
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'payments'
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            <Wallet size={20} /> Payments
          </button>
        </nav>
        
        <div className="p-4 border-t border-[#2D6A4F]">
          <button
            onClick={() => {
              navigate('/plantation-admin/change-password');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white transition-colors mb-2"
          >
            <Settings size={20} /> Settings
          </button>
          <button
            onClick={() => logOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
        {setupSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <span className="text-green-600 text-2xl bg-green-100 rounded-full w-8 h-8 flex items-center justify-center">✓</span>
            <div>
              <p className="font-semibold text-green-800">Setup Complete!</p>
              <p className="text-sm text-green-700">Your plantation profile has been created successfully. You can now manage your information.</p>
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <header className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1B4332] font-serif">
                {activeTab === 'details' && 'Plantation Details'}
                {activeTab === 'media' && 'Media Gallery'}
                {activeTab === 'experiences' && 'Manage Experiences'}
                {activeTab === 'bookings' && 'View Bookings'}
                {activeTab === 'payments' && 'Payments & Payouts'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage your plantation's operations.</p>
            </div>
            <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-800">Active</span>
            </div>
          </header>

          {/* Tab Content */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
            {activeTab === 'details' && (
              <PlantationDetailsManagement plantation={plantation} />
            )}
            {activeTab === 'media' && (
              <PlantationMediaManagement plantation={plantation} onSaved={refreshPlantation} />
            )}
            {activeTab === 'experiences' && (
              <PlantationExperienceManagement plantation={plantation} onSaved={refreshPlantation} />
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
    </div>
  );
}