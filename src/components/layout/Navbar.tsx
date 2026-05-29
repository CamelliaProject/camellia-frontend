import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { user, logOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#2D6A4F] font-bold' : 'text-gray-600 hover:text-[#52B788]';
  };

  const handleLogOut = () => {
    logOut();
    navigate('/');
  };

  const dashboardPath = user?.role === 'superadmin'
    ? '/super-admin/dashboard'
    : user?.role === 'plantationadmin'
    ? '/plantation-admin/dashboard'
    : '/dashboard';


  return (
    <>
      <nav className="flex items-center justify-between px-12 py-6 bg-white shadow-sm">
        <Link to="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition">
          <div className="w-12 h-12 bg-[#2D6A4F]"></div>
          <div>
            <h1 className="text-3xl font-bold leading-none text-[#2D6A4F]">Camellia</h1>
            <p className="text-xs text-gray-500">Ceylon Tea Tourism</p>
          </div>
        </Link>
        <div className="hidden md:flex gap-10 text-lg font-medium">
          <Link to="/" className={`transition ${isActive('/')}`}>Home</Link>
          <Link to="/plantations" className={`transition ${isActive('/plantations')}`}>Plantations</Link>
          <Link to="/about" className={`transition ${isActive('/about')}`}>About</Link>
          <Link to="/contact" className={`transition ${isActive('/contact')}`}>Contact</Link>
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Welcome, {user.username || user.name}!</span>
            <Link to={dashboardPath} className="bg-[#2D6A4F] text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-[#1B4332] transition">
              My Dashboard
            </Link>
            <Link
              to="/plantation-request"
              className="bg-white border border-[#2D6A4F] text-[#2D6A4F] px-8 py-3 rounded-md text-lg font-medium hover:bg-[#ECF3EC] transition"
            >
              Register Plantation
            </Link>
            <button
              onClick={handleLogOut}
              className="bg-gray-100 text-gray-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-200 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="bg-[#2D6A4F] text-white px-10 py-3 rounded-md text-lg font-medium hover:bg-[#1B4332] transition"
            >
              Sign In
            </Link>
            <Link
              to="/plantation-request"
              className="bg-white border border-[#2D6A4F] text-[#2D6A4F] px-10 py-3 rounded-md text-lg font-medium hover:bg-[#ECF3EC] transition"
            >
              Register Plantation
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}