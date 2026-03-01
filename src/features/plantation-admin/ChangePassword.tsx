import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    if (!user || user.role !== 'plantationadmin') {
      // if somehow a non-admin reaches this route, send them away
      navigate('/');
      return;
    }
    // check whether the user already changed password
    const plantations: any[] = JSON.parse(
      localStorage.getItem('superAdminPlantations') || '[]'
    );
    const me = plantations.find((p) => p.adminUsername === user.username);
    if (me && me.passwordChanged) {
      // nothing to do; go to dashboard
      navigate('/plantation-admin/dashboard');
    }
  }, [user, navigate]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!password) errs.password = 'New password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const plantations: any[] = JSON.parse(
      localStorage.getItem('superAdminPlantations') || '[]'
    );
    const idx = plantations.findIndex((p) => p.adminUsername === user!.username);
    if (idx !== -1) {
      plantations[idx].passwordChanged = true;
      // clear the visible password so superadmin can't read it anymore
      plantations[idx].adminPassword = '';
      localStorage.setItem('superAdminPlantations', JSON.stringify(plantations));
    }

    // update password map
    const map = JSON.parse(localStorage.getItem('plantationPasswords') || '{}');
    map[user!.username] = password;
    localStorage.setItem('plantationPasswords', JSON.stringify(map));

    alert('Password has been updated. You may now use the new password going forward.');
    navigate('/plantation-admin/dashboard');
  };

  // If user is not set yet we can render null or a loader
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Change Password</h2>
        <p className="mb-6 text-gray-700">
          Since this is your first time signing in as the plantation administrator,
          you must choose a new password. This password will only be known by you and
          cannot be viewed by the super administrator.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-4 rounded-lg"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
