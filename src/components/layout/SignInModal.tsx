import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export default function SignInModal({ isOpen, onClose, redirectPath }: SignInModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const auth = getAuth();
      const userCredential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        const token = await userCredential.user.getIdToken();
        signIn({
          uid: userCredential.user.uid,
          email: userCredential.user.email ?? email,
          name: userCredential.user.displayName ?? email.split('@')[0],
          role: 'tourist',
          token,
        });
        resetForm();
        onClose();
        navigate(redirectPath || '/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || 'Authentication failed.';
      if (message.includes('auth/user-not-found')) setError('No account found for that email.');
      else if (message.includes('auth/wrong-password')) setError('Invalid password.');
      else if (message.includes('auth/email-already-in-use')) setError('Email already in use.');
      else if (message.includes('auth/weak-password')) setError('Password must be at least 6 characters.');
      else setError(message);
    } finally {
      setIsLoading(false);
    }
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
            {isSignUp ? 'Create an account' : 'Sign In'}
          </h2>
          <p className="text-gray-600">Use your email and password or Google to sign in.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#1B4332] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#1B4332] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-white font-semibold hover:bg-[#1B4332] transition disabled:bg-gray-400"
          >
            {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-700 font-semibold hover:border-gray-400 transition bg-gray-50 hover:bg-gray-100"
        >
          Sign in with Google
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#2D6A4F] font-semibold hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
