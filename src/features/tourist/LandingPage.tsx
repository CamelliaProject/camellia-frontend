import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Hero from './Hero';
import Legacy from '../../components/sections/Legacy';
import FeaturedPlantations from './FeaturedPlantations';
import Services from '../../components/sections/Services';
import SignInModal from '../../components/layout/SignInModal';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (loading || isAuthenticated) return;
    if (sessionStorage.getItem('signInPromptDismissed')) return;

    const timer = setTimeout(() => setShowSignIn(true), 1500);
    return () => clearTimeout(timer);
  }, [loading, isAuthenticated]);

  const handleClose = () => {
    setShowSignIn(false);
    sessionStorage.setItem('signInPromptDismissed', '1');
  };

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

      <SignInModal isOpen={showSignIn} onClose={handleClose} redirectPath="/dashboard" />
    </div>
  );
}