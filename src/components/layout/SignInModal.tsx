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

  const handleDismiss = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-xl"
          aria-label="Close"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🌿
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Welcome to Camellia</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Sign in with Google to book plantation experiences and leave reviews. You can also browse freely without signing in.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 font-semibold hover:border-gray-400 transition bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-full mt-3 py-3 text-sm text-gray-400 hover:text-gray-600 transition font-medium"
        >
          Browse without signing in
        </button>
      </div>
    </div>
  );
}
