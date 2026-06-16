import { useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TouristLoginModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      signIn({
        uid: result.user.uid,
        email: result.user.email ?? '',
        name: result.user.displayName ?? result.user.email?.split('@')[0] ?? 'User',
        role: 'tourist',
        token,
      });

      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-10"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <X size={22} />
        </button>

        <h1 className="text-3xl font-bold text-[#1B4332] mb-4">Tourist Login</h1>
        <p className="text-gray-600 mb-8">
          Use your Google account to book plantation experiences and manage your reservations.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-700 font-semibold hover:border-gray-400 transition bg-gray-50 hover:bg-gray-100"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
