import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export default function SignInModal({ isOpen, onClose, redirectPath }: SignInModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

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
      resetForm();
      onClose();
      navigate(redirectPath || '/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1B4332] mb-2">
            Sign In
          </h2>
          <p className="text-gray-600">
            Use your Google account to sign in and continue booking plantation experiences.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-700 font-semibold hover:border-gray-400 transition bg-gray-50 hover:bg-gray-100"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
