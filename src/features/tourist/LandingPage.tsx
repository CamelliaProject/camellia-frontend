import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Hero from './Hero';
import Legacy from '../../components/sections/Legacy';
import FeaturedPlantations from './FeaturedPlantations';
import Services from '../../components/sections/Services';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      
      <Navbar />

      
      <Hero />

      
      <main>
      
        <Legacy />


        <FeaturedPlantations />

        <Services />
      </main>

      <Footer />
    </div>
  );
}