import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const MOCK_PLANTATIONS = [
  {
    id: '1',
    name: 'Pedro Tea Estate',
    address: 'Nuwara Eliya, Sri Lanka',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbbJISbGQn4noP42c9q4Sha96Z4OKv_kpKeg&s'
  },
  {
    id: '2',
    name: 'Bluefield Tea Garden',
    address: 'Ramboda, Sri Lanka',
    image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800'
  }
];

export default function FeaturedPlantations() {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-12 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#1B4332] mb-4 font-serif">Featured Tea Plantations</h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Explore our carefully selected tea estates, each offering unique experiences and exceptional Ceylon tea.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {MOCK_PLANTATIONS.map((p) => (
          <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-transform hover:scale-105">
            <img src={p.image} className="h-64 w-full object-cover" alt={p.name} />
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 text-[#1B4332]">{p.name}</h3>
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={16} />
                <span className="text-base">{p.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
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