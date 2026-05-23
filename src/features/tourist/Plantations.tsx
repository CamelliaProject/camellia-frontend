
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import apiClient from '../../services/apiClient';

const DEFAULT_PLACEHOLDER_IMAGE = '/images/tea-plantation-default.jpg';

interface PlantationsApiResponse {
  id: string;
  name: string;
  address: string;
  description?: string;
  main_image_url?: string;
  is_disabled?: boolean;
}

export default function Plantations() {
  const navigate = useNavigate();
  const [activePlantations, setActivePlantations] = useState<PlantationsApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlantations = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/plantations');
        const plantations: PlantationsApiResponse[] = response.data?.data || [];
        setActivePlantations(plantations.filter((plantation) => !plantation.is_disabled));
      } catch (error) {
        console.error('Failed to load plantations:', error);
        setActivePlantations([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlantations();
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

        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading plantations...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {activePlantations.length > 0 ? (
              activePlantations.map((plantation) => (
                <div
                  key={plantation.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/plantation/${plantation.id}`)}
                >
                  <img
                    src={plantation.main_image_url || DEFAULT_PLACEHOLDER_IMAGE}
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
                    <p className="text-gray-600 text-sm mb-4">{plantation.description ?? 'Explore the plantation details and book an experience.'}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/plantation/${plantation.id}`);
                      }}
                      className="w-full bg-[#52B788] text-white py-2 rounded-md font-medium hover:bg-[#40916c] transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600 text-lg">No tea plantations are currently available.</p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
