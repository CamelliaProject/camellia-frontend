import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { validatePassword, validateUsername } from '../../utils/validators';

interface FieldErrors {
  username?: string;
  password?: string;
}

export default function PlantationAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const authRequired = (location.state as any)?.authRequired === true;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!validateUsername(username)) {
      errors.username = 'Username is required.';
    } else if (username.length > 50) {
      errors.username = 'Username must be 50 characters or fewer.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      // 1. Validate credentials with backend — receive a Firebase custom token
      const res = await authApi.adminLogin({ username: username.trim(), password });
      const { customToken, user: userData } = res.data;

      // 2. Exchange custom token for a real Firebase ID token
      const auth = getAuth();
      const credential = await signInWithCustomToken(auth, customToken);
      const idToken = await credential.user.getIdToken();

      // 3. Persist user + token so apiClient attaches it to every request
      signIn({
        id: userData.id,
        uid: userData.uid,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        plantationId: userData.plantationId,
        token: idToken,
        passwordChanged: userData.passwordChanged,
      });

      navigate('/plantation-admin/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setServerError('Too many login attempts. Please wait 15 minutes and try again.');
      } else if (status === 401) {
        setServerError('Invalid username or password. Please check your credentials.');
      } else {
        setServerError(
          err?.response?.data?.error || err?.message || 'Login failed. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-[#2D6A4F] rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-xl font-bold">PA</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1B4332]">Plantation Admin</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your plantation details, bookings, and reviews.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Auth-required notice */}
          {authRequired && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a7 7 0 1114 0v2a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2h2zm8-2v2H7V7a5 5 0 0110 0z" clipRule="evenodd" />
              </svg>
              <p className="text-amber-800 text-sm">Please sign in to access the admin panel.</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setFieldErrors(f => ({ ...f, username: undefined })); }}
              autoComplete="username"
              disabled={isLoading}
              className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 disabled:bg-gray-50 transition ${
                fieldErrors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your username"
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })); }}
                autoComplete="current-password"
                disabled={isLoading}
                className={`w-full rounded-2xl border px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 disabled:bg-gray-50 transition ${
                  fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
            )}
            <div className="mt-2 text-right">
              <Link to="/plantationadmin/forgot-password" className="text-sm text-[#2D6A4F] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Server-level error */}
          {serverError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-white font-semibold hover:bg-[#1B4332] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
