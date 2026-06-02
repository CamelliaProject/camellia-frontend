import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, Music, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1B4332] text-white">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="bg-white rounded-xl p-1.5 shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Camellia"
                  className="h-12 w-12 object-contain"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="leading-tight">
                <p className="text-xl font-bold text-white leading-none">Camellia</p>
                <p className="text-[0.65rem] text-green-300 tracking-wide">Ceylon Tea Tourism</p>
              </div>
            </Link>
            <p className="text-green-200 text-sm leading-relaxed mb-5">
              Connecting travellers with Sri Lanka's finest tea plantation experiences since 2024.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { href: '#', icon: <Facebook size={16} />, label: 'Facebook' },
                { href: '#', icon: <Instagram size={16} />, label: 'Instagram' },
                { href: '#', icon: <Youtube size={16} />, label: 'YouTube' },
                { href: '#', icon: <Music size={16} />, label: 'TikTok' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#2D6A4F] flex items-center justify-center transition"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-green-300 mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm text-green-100">
              {[
                { to: '/',             label: 'Home' },
                { to: '/plantations',  label: 'All Plantations' },
                { to: '/about',        label: 'About Us' },
                { to: '/contact',      label: 'Contact' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Plantation Owners */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-green-300 mb-4">For Owners</h4>
            <ul className="space-y-2.5 text-sm text-green-100">
              <li>
                <Link to="/plantation-request" className="hover:text-white transition">
                  Register Your Plantation
                </Link>
              </li>
              <li>
                <Link to="/plantation-admin/dashboard" className="hover:text-white transition">
                  Plantation Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Subscription Plans</a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Get Support</Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-green-300 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-green-100">
              <li className="flex items-start gap-2.5">
                <Mail size={14} className="text-green-300 mt-0.5 shrink-0" />
                <span>camelliaceylonplatform@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="text-green-300 mt-0.5 shrink-0" />
                <span>+94 (0) 11 234 5678</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-green-300 mt-0.5 shrink-0" />
                <span>Camellia Platform,<br />Colombo, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-green-300">
          <p>© 2025 Camellia – Ceylon Tea Tourism. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
