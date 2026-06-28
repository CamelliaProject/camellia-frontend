import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { plantationApi } from '../../services/api';
import PlantationDetailsManagement from './PlantationDetailsManagement';
import PlantationMediaManagement from '../plantation-admin/PlantationMediaManagement';
import PlantationExperienceManagement from './PlantationExperienceManagement';
import PlantationBookingManagement from '../plantation-admin/PlantationBookingManagement';
import PlantationSetup from './PlantationSetup';
import { Image, GalleryHorizontal, Package, CalendarCheck, Wallet, LogOut, LayoutDashboard, Settings, CalendarOff, Menu, X } from 'lucide-react';
import PlantationPayments from './PlantationPayments';
import PlantationAvailabilityManagement from './PlantationAvailabilityManagement';

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
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'availability' | 'experiences' | 'bookings' | 'payments'>('payments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plantationAdmin, setPlantationAdmin] = useState<PlantationAdminUser | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [rawPlantation, setRawPlantation] = useState<any>(null);   // flat DB row
  const [plantation, setPlantation] = useState<any>(null);          // nested for components
  const [plantationLoading, setPlantationLoading] = useState(true);
  const plantationIdRef = React.useRef<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);

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
    setActiveTab('payments');
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

  const TAB_ITEMS = [
    { key: 'payments',     icon: <Wallet size={20} />,          label: 'Payments' },
    { key: 'bookings',     icon: <CalendarCheck size={20} />,   label: 'View Bookings' },
    { key: 'details',      icon: <Image size={20} />,           label: 'Details' },
    { key: 'media',        icon: <GalleryHorizontal size={20} />,label: 'Media Gallery' },
    { key: 'availability', icon: <CalendarOff size={20} />,     label: 'Date & Time' },
    { key: 'experiences',  icon: <Package size={20} />,         label: 'Experiences' },
  ] as const;

  const SidebarContent = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {TAB_ITEMS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); onSelect?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === t.key
                ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-[#2D6A4F]">
        <button
          onClick={() => navigate('/plantation-admin/change-password')}
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
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans text-[#1B4332]">

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between bg-[#1B4332] text-white px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-green-300" />
          <span className="font-bold font-serif text-base truncate max-w-[180px]">{plantation.name}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-[#2D6A4F] transition">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile slide-out drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="w-64 bg-[#1B4332] text-white flex flex-col pt-16 shadow-2xl">
            <SidebarContent onSelect={() => setMobileMenuOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#1B4332] text-white min-h-screen sticky top-0 shadow-xl z-20">
        <div className="p-6 border-b border-[#2D6A4F]">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-green-300" />
            <h1 className="text-xl font-bold font-serif">Admin</h1>
          </div>
          <p className="text-green-200 text-xs mt-2 pl-11 truncate">{plantation.name}</p>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
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
          <header className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-3xl font-bold text-[#1B4332] font-serif">
                {activeTab === 'details' && 'Plantation Details'}
                {activeTab === 'media' && 'Media Gallery'}
                {activeTab === 'experiences' && 'Manage Experiences'}
                {activeTab === 'availability' && 'Available Date and Time'}
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
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
            {activeTab === 'details' && (
              <PlantationDetailsManagement plantation={plantation} />
            )}
            {activeTab === 'media' && (
              <PlantationMediaManagement plantation={plantation} onSaved={refreshPlantation} />
            )}
            {activeTab === 'experiences' && (
              <PlantationExperienceManagement plantation={plantation} onSaved={refreshPlantation} />
            )}
            {activeTab === 'availability' && (
              <PlantationAvailabilityManagement plantationId={plantationAdmin.plantationId} />
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