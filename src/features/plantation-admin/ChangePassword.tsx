import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [errors, setErrors]       = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'plantationadmin') {
      navigate('/');
    }
  }, [user, navigate]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!password)               errs.password = 'New password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (password !== confirm)    errs.confirm  = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.changePassword(password);
      navigate('/plantation-admin/dashboard');
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F5] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-[#1B4332] rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Set Your Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Choose a new password for your plantation admin account. This replaces the
            system-generated password and will not be visible to anyone else.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors({}); }}
              disabled={isLoading}
              className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 disabled:bg-gray-50 transition ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors({}); }}
              disabled={isLoading}
              className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 disabled:bg-gray-50 transition ${
                errors.confirm ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Repeat new password"
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
          </div>

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
            className="w-full rounded-2xl bg-[#1B4332] px-4 py-3 text-white font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Updating…
              </span>
            ) : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
