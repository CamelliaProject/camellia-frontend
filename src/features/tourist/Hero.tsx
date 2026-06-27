import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="relative h-[700px] flex items-center px-12 text-white">
      <img
        src="/images/landing.jpg"
        className="absolute inset-0 w-full h-full object-cover brightness-75"
        alt="Tea Background"
      />
      <div className="relative z-10 max-w-2xl">
        <p className="text-sm font-semibold mb-4">Discover the Heritage of Ceylon Tea</p>
        <h2 className="text-4xl font-bold mb-6 leading-tight">
          Immerse yourself in the rich history and breathtaking beauty of Sri Lanka's finest tea plantations.
        </h2>
        <button
          onClick={() => navigate('/plantations')}
          className="bg-white/90 text-[#2D6A4F] px-8 py-3 rounded-md font-bold hover:bg-white transition"
        >
          Explore Plantations
        </button>
      </div>
    </div>
  );
}
