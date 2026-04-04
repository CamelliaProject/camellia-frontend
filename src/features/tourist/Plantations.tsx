
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';


import type { Plantation as SuperAdminPlantation } from '../super-admin/SuperAdminDashboard';

const DEFAULT_PLACEHOLDER_IMAGE = '/images/tea-plantation-default.jpg'; 

const INITIAL_FALLBACK_PLANTATIONS: SuperAdminPlantation[] = [
  {
    id: '1',
    name: 'Pedro Tea Estate',
    address: 'Nuwara Eliya, Sri Lanka',
    image: '/images/pedro.jpg', 
    description: 'Experience the charm of Pedro Tea Estate with breathtaking views of tea plantations.',
    owner: 'Pedro Es', businessReg: 'BRN-001-2020', adminUsername: 'pedroadmin',
    email: 'pedro@estate.com', telephone: '0342256789',
    isDisabled: false, registeredYear: 2025
  },
  {
    id: '2',
    name: 'Bluefield Tea Garden',
    address: 'Ramboda, Sri Lanka',
    image: '/images/bluefield-tea-garden.jpg', 
    description: 'Discover the tranquility and beauty of Bluefield Tea Garden.',
    owner: 'Bluefield Co.', businessReg: 'BRN-001-2021', adminUsername: 'bluefieldadmin',
    email: 'bluefield@garden.com', telephone: '0522267890',
    isDisabled: false, registeredYear: 2025
  },
  {
    id: '3',
    name: 'Haputale Estate',
    address: 'Haputale, Sri Lanka',
    image: '/images/haputale-estate.jpg', 
    description: 'Explore the historic Haputale Estate with stunning mountain views.',
    owner: 'Haputale PLC', businessReg: 'BRN-001-2018', adminUsername: 'haputaleadmin',
    email: 'haputale@estate.com', telephone: '0711234567',
    isDisabled: false, registeredYear: 2024
  },
  {
    id: '4',
    name: 'Uda Pussellawa',
    address: 'Kandy, Sri Lanka',
    image: '/images/uda-pussellawa.jpg', 
    description: 'Visit the lush green plantations of Uda Pussellawa.',
    owner: 'Uda Pussellawa Co.', businessReg: 'BRN-001-2017', adminUsername: 'udapussellawaadmin',
    email: 'uda@pussellawa.com', telephone: '0812345678',
    isDisabled: false, registeredYear: 2023
  },
  {
    id: '5',
    name: 'Dambulla Tea Valley',
    address: 'Dambulla, Sri Lanka',
    image: '/images/dambulla-tea-valley.jpg', 
    description: 'Immerse yourself in the scenic Dambulla Tea Valley with traditional tea-making experiences.',
    owner: 'Dambulla Valley Ltd.', businessReg: 'BRN-001-2022', adminUsername: 'dambullaadmin',
    email: 'dambulla@valley.com', telephone: '0661234567',
    isDisabled: false, registeredYear: 2026
  },
  {
    id: '6',
    name: 'Ella Ridge Plantation',
    address: 'Ella, Sri Lanka',
    image: '/images/ella-ridge-plantation.jpg', 
    description: 'Enjoy panoramic views and authentic Ceylon tea at Ella Ridge Plantation.',
    owner: 'Ella Ridge Farms', businessReg: 'BRN-001-2023', adminUsername: 'ellaadmin',
    email: 'ella@ridge.com', telephone: '0761234567',
    isDisabled: false, registeredYear: 2027
  }
];

export default function Plantations() {
  const navigate = useNavigate();
  const [activePlantations, setActivePlantations] = useState<SuperAdminPlantation[]>([]);

  useEffect(() => {
    const storedPlantations = localStorage.getItem('superAdminPlantations');
    let allPlantations: SuperAdminPlantation[] = [];

    if (storedPlantations) {
      allPlantations = JSON.parse(storedPlantations);
    } else {
      
      allPlantations = INITIAL_FALLBACK_PLANTATIONS;
      localStorage.setItem('superAdminPlantations', JSON.stringify(INITIAL_FALLBACK_PLANTATIONS));
    }

    const filteredPlantations = allPlantations.filter(
      (plantation) => !plantation.isDisabled
    );
    setActivePlantations(filteredPlantations);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center px-12 text-white">
        <img
          src="/images/landing.jpg" 
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          alt="Tea Background"
        />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Tea Plantations</h1>
          <p className="text-lg">Explore all our premium Ceylon tea estates</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-16 px-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#1B4332] mb-4 font-serif">Our Tea Plantations</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our collection of premium tea estates across Sri Lanka's finest tea-growing regions.
          </p>
        </div>

        {/* Plantations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activePlantations.length > 0 ? (
            activePlantations.map((plantation) => (
              <div
                key={plantation.id}
                className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/plantation/${plantation.id}`)}
              >
                <img
                 
                  src={plantation.image || DEFAULT_PLACEHOLDER_IMAGE}
                  onError={(e) => {
                    
                    (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE;
                  }}
                  className="h-48 w-full object-cover"
                  alt={plantation.name}
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#1B4332]">{plantation.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 mb-3">
                    <MapPin size={16} />
                    <span className="text-sm">{plantation.address}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{plantation.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/plantation/${plantation.id}`);
                    }}
                    className="w-full bg-[#52B788] text-white py-2 rounded-md font-medium hover:bg-[#40916c] transition">
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600 text-lg">No tea plantations are currently available.</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
