import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

interface PlantationPreview {
  id: string;
  name: string;
  address: string;
  main_image_url?: string;
}

const DEFAULT_IMAGE = '/images/tea-plantation-default.jpg';

export default function FeaturedPlantations() {
  const navigate = useNavigate();
  const [plantations, setPlantations] = useState<PlantationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlantations = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/plantations');
        setPlantations(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load featured plantations:', error);
        setPlantations([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlantations();
  }, []);

  const displayPlantations = plantations.slice(0, 2);

  return (
    <section className="py-16 px-12 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#1B4332] mb-4 font-serif">Featured Tea Plantations</h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Explore our carefully selected tea estates, each offering unique experiences and exceptional Ceylon tea.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-600">Loading featured plantations...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {displayPlantations.length > 0 ? (
            displayPlantations.map((plantation) => (
              <div
                key={plantation.id}
                className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-transform hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/plantation/${plantation.id}`)}
              >
                <img
                  src={plantation.main_image_url || DEFAULT_IMAGE}
                  className="h-64 w-full object-cover"
                  alt={plantation.name}
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-[#1B4332]">{plantation.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={16} />
                    <span className="text-base">{plantation.address}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-600">No featured plantations are available right now.</div>
          )}
        </div>
      )}

      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/plantations')}
          className="border border-[#52B788] text-[#52B788] px-8 py-3 rounded-md text-lg font-medium hover:bg-[#52B788] hover:text-white transition"
        >
          Explore More Plantations →
        </button>
      </div>
    </section>
  );
}
