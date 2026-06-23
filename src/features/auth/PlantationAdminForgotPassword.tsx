import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { validateUsername } from '../../utils/validators';

export default function PlantationAdminForgotPassword() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    if (!validateUsername(username)) {
      setError('Username is required.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(username.trim());
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-[#2D6A4F] rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your admin username and we'll send a password reset link to your registered email.
          </p>
        </div>

        {submitted ? (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 text-sm">
              If that account exists, a reset link has been sent to its registered email.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
                disabled={isLoading}
                className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 disabled:bg-gray-50 transition ${
                  error ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your username"
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
              className="w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-white font-semibold hover:bg-[#1B4332] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending…
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/plantationadmin" className="text-[#2D6A4F] font-semibold hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
