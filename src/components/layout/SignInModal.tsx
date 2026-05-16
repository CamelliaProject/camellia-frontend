import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

// User data type
interface UserData {
  username: string;
  email: string;
  role: 'superadmin' | 'plantationadmin' | 'tourist';
  plantationId?: string;
}


// Super Admin credentials
const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = 'super123';

export default function SignInModal({ isOpen, onClose, redirectPath }: SignInModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  // Forgot password / OTP flow states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [resetAllowed, setResetAllowed] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
      let loginAllowed = true;

      // Super Admin
      if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
        userRole = 'superadmin';
        userData.role = 'superadmin';
      } else {
        // check dynamic plantation admins
        const plantations: any[] = JSON.parse(
          localStorage.getItem('superAdminPlantations') || '[]'
        );
        const matched = plantations.find((p) => p.adminUsername === username);
        if (matched) {
          const pwMap: Record<string, string> = JSON.parse(
            localStorage.getItem('plantationPasswords') || '{}'
          );
          const storedPw = pwMap[username] || matched.adminPassword || 'password123';
          if (password === storedPw) {
            userRole = 'plantationadmin';
            userData = {
              ...userData,
              role: 'plantationadmin',
              plantationId: matched.id,
            };
          } else {
            // wrong password for known plantation admin
            loginAllowed = false;
          }
        }
        // otherwise if no match we treat as tourist and allow
      }

      if (!loginAllowed) {
        setErrors({ password: 'Invalid username or password' });
        setIsLoading(false);
        return;
      }

      signIn(userData);

      // reset form
      setUsername('');
      setPassword('');
      setErrors({});
      setIsLoading(false);
      onClose();

      // Redirect logic depending on role and password change status
      if (userRole === 'superadmin') {
        navigate('/super-admin/dashboard');
      } else if (userRole === 'plantationadmin') {
        // check flag
        const plantations: any[] = JSON.parse(
          localStorage.getItem('superAdminPlantations') || '[]'
        );
        const matched = plantations.find((p) => p.adminUsername === username);
        const changed = matched?.passwordChanged;
        if (!changed) {
          // force password update
          navigate('/plantation-admin/change-password');
        } else {
          navigate('/plantation-admin/dashboard');
        }
      } else {
        if (redirectPath) navigate(redirectPath);
        else navigate('/dashboard');
      }
    }, 1000);
  };

  // --- Forgot Password / OTP Handlers ---
  const handleStartForgot = () => {
    setForgotMode(true);
    setForgotUsername('');
    setOtpSent(false);
    setOtpInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotErrors({});
  };

  const handleSendOTP = async () => {
    setForgotErrors({});
    if (!forgotUsername.trim()) {
      setForgotErrors({ username: 'Username is required' });
      return;
    }

    const plantations: any[] = JSON.parse(localStorage.getItem('superAdminPlantations') || '[]');
    const matched = plantations.find((p) => p.adminUsername === forgotUsername);
    if (!matched) {
      setForgotErrors({ username: 'No plantation admin found with that username' });
      return;
    }

    setIsSendingOtp(true);
    const to = matched.email || `${matched.adminUsername}@example.com`;

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, email: to }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setOtpSent(true);
          setIsSendingOtp(false);
          return;
        }
      }
      // fallthrough to local fallback if server returns non-OK
    } catch (err) {
      // network or server error: fall back to local OTP for demo
    }

    // Local fallback: generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpMap = JSON.parse(localStorage.getItem('otpMap') || '{}');
    otpMap[forgotUsername] = { code, expires: Date.now() + 5 * 60 * 1000 }; // 5 minutes
    localStorage.setItem('otpMap', JSON.stringify(otpMap));
    alert(`OTP sent to ${to}: ${code} (simulated)`);
    setOtpSent(true);
    setIsSendingOtp(false);
  };

  const handleVerifyOTP = async () => {
    setForgotErrors({});
    if (!otpInput.trim()) {
      setForgotErrors({ otp: 'Please enter the OTP' });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, code: otpInput }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const resetMap = JSON.parse(localStorage.getItem('resetMap') || '{}');
          resetMap[forgotUsername] = { allowed: true, expires: Date.now() + 10 * 60 * 1000 };
          localStorage.setItem('resetMap', JSON.stringify(resetMap));
          setResetAllowed(true);
          setOtpSent(false);
          setOtpInput('');
          setIsVerifyingOtp(false);
          alert('OTP verified. You may now set a new password.');
          return;
        }
      }
    } catch (err) {
      // fall back to local verification
    }

    // Local fallback verification
    const otpMap = JSON.parse(localStorage.getItem('otpMap') || '{}');
    const entry = otpMap[forgotUsername];
    if (!entry) {
      setForgotErrors({ otp: 'No OTP found. Please request a new one.' });
      setIsVerifyingOtp(false);
      return;
    }
    if (Date.now() > entry.expires) {
      setForgotErrors({ otp: 'OTP expired. Request a new one.' });
      delete otpMap[forgotUsername];
      localStorage.setItem('otpMap', JSON.stringify(otpMap));
      setIsVerifyingOtp(false);
      return;
    }
    if (entry.code !== otpInput) {
      setForgotErrors({ otp: 'Invalid OTP' });
      setIsVerifyingOtp(false);
      return;
    }

    const resetMap = JSON.parse(localStorage.getItem('resetMap') || '{}');
    resetMap[forgotUsername] = { allowed: true, expires: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem('resetMap', JSON.stringify(resetMap));
    setResetAllowed(true);
    setOtpSent(false);
    setOtpInput('');
    setIsVerifyingOtp(false);
    alert('OTP verified. You may now set a new password.');
  };

  const handleSetNewPassword = async () => {
    setForgotErrors({});
    if (!newPassword.trim()) {
      setForgotErrors({ newPassword: 'Password is required' });
      return;
    }
    if (newPassword.length < 6) {
      setForgotErrors({ newPassword: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotErrors({ confirmNewPassword: 'Passwords do not match' });
      return;
    }

    // Ensure reset allowed
    const resetMap = JSON.parse(localStorage.getItem('resetMap') || '{}');
    const allowed = resetMap[forgotUsername];
    if (!allowed || Date.now() > allowed.expires) {
      setForgotErrors({ otp: 'Reset not authorized or expired. Please request OTP again.' });
      return;
    }

    setIsResetting(true);
    let serverOk = false;
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, newPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) serverOk = true;
      }
    } catch (err) {
      // network error — fall back to local behavior
    }

    // Persist new password in password map (server may already have done this)
    const pwMap: Record<string, string> = JSON.parse(localStorage.getItem('plantationPasswords') || '{}');
    pwMap[forgotUsername] = newPassword;
    localStorage.setItem('plantationPasswords', JSON.stringify(pwMap));

    // Mark plantation record as passwordChanged and clear visible adminPassword
    const plantations: any[] = JSON.parse(localStorage.getItem('superAdminPlantations') || '[]');
    const idx = plantations.findIndex((p) => p.adminUsername === forgotUsername);
    if (idx !== -1) {
      plantations[idx].passwordChanged = true;
      plantations[idx].adminPassword = '';
      localStorage.setItem('superAdminPlantations', JSON.stringify(plantations));
    }

    // Clean up maps
    delete resetMap[forgotUsername];
    localStorage.setItem('resetMap', JSON.stringify(resetMap));
    const otpMap = JSON.parse(localStorage.getItem('otpMap') || '{}');
    delete otpMap[forgotUsername];
    localStorage.setItem('otpMap', JSON.stringify(otpMap));

    setIsResetting(false);
    alert('Password updated successfully. You can now sign in with your new password.');
    // auto-fill and switch back to sign-in view
    setPassword(newPassword);
    setForgotMode(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotUsername('');
    setResetAllowed(false);
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
      if (redirectPath) navigate(redirectPath);
      else navigate('/dashboard');
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

        {!forgotMode ? (
          <>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-right mt-2">
                <button type="button" onClick={handleStartForgot} className="text-sm text-[#2D6A4F] hover:underline">
                  Forgot password?
                </button>
              </div>
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
          </>
        ) : (
          <div className="space-y-5 mb-6">
            <h3 className="text-lg font-semibold text-[#1B4332]">Reset Password</h3>
            {!otpSent && !resetAllowed && (
              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Username</label>
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={(e) => {
                    setForgotUsername(e.target.value);
                    if (forgotErrors.username) setForgotErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-green-500"
                />
                {forgotErrors.username && <p className="text-red-500 text-sm mt-1">{forgotErrors.username}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSendOTP} className="bg-[#2D6A4F] text-white py-2 px-4 rounded-lg">
                    Send OTP
                  </button>
                  <button onClick={() => setForgotMode(false)} className="py-2 px-4 rounded-lg border">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {otpSent && !resetAllowed && (
              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value);
                    if (forgotErrors.otp) setForgotErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  placeholder="6-digit code"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-green-500"
                />
                {forgotErrors.otp && <p className="text-red-500 text-sm mt-1">{forgotErrors.otp}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={handleVerifyOTP} className="bg-[#2D6A4F] text-white py-2 px-4 rounded-lg">
                    Verify OTP
                  </button>
                  <button onClick={() => { setOtpSent(false); setForgotUsername(''); }} className="py-2 px-4 rounded-lg border">
                    Back
                  </button>
                </div>
              </div>
            )}

            {resetAllowed && (
              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (forgotErrors.newPassword) setForgotErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-green-500"
                />
                {forgotErrors.newPassword && <p className="text-red-500 text-sm mt-1">{forgotErrors.newPassword}</p>}

                <label className="block text-sm font-semibold text-[#1B4332] mb-2 mt-3">Confirm Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (forgotErrors.confirmNewPassword) setForgotErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                  }}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-green-500"
                />
                {forgotErrors.confirmNewPassword && <p className="text-red-500 text-sm mt-1">{forgotErrors.confirmNewPassword}</p>}

                <div className="flex gap-2 mt-3">
                  <button onClick={handleSetNewPassword} className="bg-[#2D6A4F] text-white py-2 px-4 rounded-lg">
                    Set New Password
                  </button>
                  <button onClick={() => { setForgotMode(false); setResetAllowed(false); }} className="py-2 px-4 rounded-lg border">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <button className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold">Sign Up</button>
        </p>
      </div>
    </div>
  );
}
