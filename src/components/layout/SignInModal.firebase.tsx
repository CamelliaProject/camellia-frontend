import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export default function SignInModal({ isOpen, onClose, redirectPath }: SignInModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      setErrors({});
      setIsLoading(false);
      onClose();
      if (redirectPath) navigate(redirectPath);
      else navigate('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || 'Authentication failed';
      if (errorMessage.includes('user-not-found')) {
        setErrors({ email: 'User not found' });
      } else if (errorMessage.includes('wrong-password')) {
        setErrors({ password: 'Invalid password' });
      } else if (errorMessage.includes('email-already-in-use')) {
        setErrors({ email: 'Email already in use' });
      } else if (errorMessage.includes('weak-password')) {
        setErrors({ password: 'Password is too weak' });
      } else {
        setErrors({ form: errorMessage });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setEmail('');
      setPassword('');
      setErrors({});
      setIsLoading(false);
      onClose();
      if (redirectPath) navigate(redirectPath);
      else navigate('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || 'Google sign-in failed';
      setErrors({ form: errorMessage });
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setErrors({});
    setIsSignUp(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1B4332] mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600">Welcome to Camellia Tea Tourism</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#1B4332] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#1B4332] mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition mb-4 flex items-center justify-center gap-2"
        >
          🔷 Sign in with Google
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#2D6A4F] font-semibold hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
