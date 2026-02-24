import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// User data type
interface UserData {
  username: string;
  email: string;
  role: 'superadmin' | 'plantationadmin' | 'tourist';
  plantationId?: string;
}

// Mock admin users
const MOCK_PLANTATION_ADMINS: Record<string, { username: string; plantationId: string }> = {
  pedroadmin: { username: 'pedroadmin', plantationId: '1' },
  bluefieldadmin: { username: 'bluefieldadmin', plantationId: '2' },
};

// Super Admin credentials
const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = 'super123';

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = () => {
    alert('Forgot password feature not implemented yet.');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      let userRole: UserData['role'] = 'tourist';
      let userData: UserData = { username, email: `${username}@camellia.com`, role: 'tourist' };

      // Super Admin
      if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
        userRole = 'superadmin';
        userData.role = 'superadmin';
      }
      // Plantation Admin
      else if (MOCK_PLANTATION_ADMINS[username] && password === 'password123') {
        userRole = 'plantationadmin';
        userData = {
          ...userData,
          role: 'plantationadmin',
          plantationId: MOCK_PLANTATION_ADMINS[username].plantationId,
        };
      }

      signIn(userData);

      setUsername('');
      setPassword('');
      setErrors({});
      setIsLoading(false);
      onClose();

      // Navigate to the correct dashboard
      if (userRole === 'superadmin') navigate('/super-admin/dashboard');
      else if (userRole === 'plantationadmin') navigate('/plantation-admin/dashboard');
      else navigate('/dashboard');
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);

    setTimeout(() => {
      const userData: UserData = {
        username: 'Google User',
        email: 'user@google.com',
        role: 'tourist',
      };
      signIn(userData);
      setIsLoading(false);
      onClose();
      navigate('/dashboard');
    }, 1000);
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setErrors({});
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
          <h2 className="text-3xl font-bold text-[#1B4332] mb-2">Sign In</h2>
          <p className="text-gray-600">Welcome to Camellia Tea Tourism</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5 mb-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-[#1B4332] mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
              }}
              placeholder="Enter your username"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.username
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
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

          <div className="text-right mb-4">
            <button type="button" onClick={handleForgotPassword} className="text-sm text-[#2D6A4F] hover:text-[#1B4332]">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition bg-gray-50 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>{isLoading ? 'Signing In...' : 'Sign in with Google'}</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <button className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold">Sign Up</button>
        </p>
      </div>
    </div>
  );
}
