import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, LogOut, PlusCircle, ChevronDown, Menu, X } from 'lucide-react';
import TouristLoginModal from '../../features/auth/TouristLoginModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-[#2D6A4F] font-semibold'
      : 'text-gray-600 hover:text-[#2D6A4F]';

  const dashboardPath =
    user?.role === 'superadmin'
      ? '/super-admin/dashboard'
      : user?.role === 'plantationadmin'
      ? '/plantation-admin/dashboard'
      : '/dashboard';

  const displayName = user?.username || user?.name || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  function handleLogOut() {
    logOut();
    setDropdownOpen(false);
    navigate('/');
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { to: '/',            label: 'Home' },
    { to: '/plantations', label: 'Plantations' },
    { to: '/about',       label: 'About' },
    { to: '/contact',     label: 'Contact' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 hover:opacity-90 transition">
          <img
            src="/images/logo.png"
            alt="Camellia"
            className="h-14 w-14 object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="leading-tight">
            <p className="text-xl font-bold text-[#1B4332] leading-none">Camellia</p>
            <p className="text-[0.7rem] text-gray-400 tracking-wide">Ceylon Tea Tourism</p>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={`transition ${isActive(l.to)}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/plantation-request"
                className="flex items-center gap-1.5 text-sm font-medium text-[#2D6A4F] border border-[#2D6A4F] px-3.5 py-2 rounded-lg hover:bg-[#f0faf4] transition"
              >
                <PlusCircle size={14} />
                Register Plantation
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 bg-[#f0faf4] hover:bg-[#e0f2e9] border border-[#b7dfc8] text-[#1B4332] rounded-lg px-3 py-2 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <span className="max-w-[120px] truncate text-sm font-semibold">{displayName}</span>
                  <ChevronDown size={14} className={`transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-[#1B4332] truncate">{displayName}</p>
                    </div>
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <LayoutDashboard size={15} className="text-[#2D6A4F]" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100"
                    >
                      <LogOut size={15} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="text-sm font-semibold text-[#2D6A4F] px-4 py-2 rounded-lg hover:bg-[#f0faf4] transition"
              >
                Sign In
              </button>
              <Link
                to="/plantation-request"
                className="text-sm font-semibold bg-[#2D6A4F] text-white px-4 py-2 rounded-lg hover:bg-[#1B4332] transition"
              >
                Register Plantation
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-600 hover:text-[#2D6A4F] transition"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-1.5 ${isActive(l.to)}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-[#1B4332] truncate max-w-[180px]">{displayName}</span>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-700 py-1.5"
                >
                  <LayoutDashboard size={14} className="text-[#2D6A4F]" /> My Dashboard
                </Link>
                <Link
                  to="/plantation-request"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-[#2D6A4F] py-1.5"
                >
                  <PlusCircle size={14} /> Register Plantation
                </Link>
                <button
                  onClick={handleLogOut}
                  className="flex items-center gap-2 text-sm text-red-600 py-1.5"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); setLoginModalOpen(true); }}
                  className="block text-sm font-semibold text-[#2D6A4F] py-1.5"
                >
                  Sign In
                </button>
                <Link
                  to="/plantation-request"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold text-[#2D6A4F] py-1.5"
                >
                  Register Plantation
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {loginModalOpen && <TouristLoginModal onClose={() => setLoginModalOpen(false)} />}
    </nav>
  );
}
