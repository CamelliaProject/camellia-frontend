import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PlantationAdminLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    signIn({ username, email: `${username}@camellia.com`, role: 'plantationadmin', plantationId: '1', token: undefined });
    navigate('/plantation-admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-bold text-[#1B4332] mb-4">Plantation Admin Login</h1>
        <p className="text-gray-600 mb-8">Login here to manage plantation details, bookings, and reviews.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              placeholder="admin username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-white font-semibold hover:bg-[#1B4332] transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
