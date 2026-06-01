import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Clock, XCircle, X, Eye, Search,
  User, Mail, Phone, Globe, Users, Calendar, Tag,
  Wallet, StickyNote, Loader2, ArrowUpDown,
} from 'lucide-react';
import { adminApi } from '../../services/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  bookingReference: string;
  plantationId: string;
  date: string;
  time: string;
  numAdults: number;
  numChildren: number;
  experiences: string[];
  totalUSD: number | null;
  totalLKR: number | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  tourist: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    username: string;
  };
  specialNotes: string;
}

interface Props { plantationId: string; }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(raw: any) {
  if (!raw) return '—';
  try {
    const iso = raw instanceof Date ? raw.toISOString() : String(raw);
    const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !mo || !d) return String(raw);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return String(raw); }
}

function fmtTime(raw: any) {
  if (!raw) return '—';
  const str = raw instanceof Date ? raw.toTimeString().slice(0, 8) : String(raw);
  const [h, m] = str.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return str;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function mapRow(raw: any): Booking {
  return {
    id: raw.id,
    bookingReference: raw.booking_reference || raw.id,
    plantationId: raw.plantation_id,
    date: raw.booking_date || '',
    time: raw.booking_time || '',
    numAdults: raw.num_adults ?? 1,
    numChildren: raw.num_children ?? 0,
    experiences: Array.isArray(raw.experience_names) ? raw.experience_names : [],
    totalUSD: raw.total_price_usd != null ? Number(raw.total_price_usd) : null,
    totalLKR: raw.total_price_lkr != null ? Number(raw.total_price_lkr) : null,
    status: raw.status ?? 'upcoming',
    tourist: {
      fullName: raw.tourist_full_name || raw.tourist_username || 'Guest',
      email: raw.tourist_email || '',
      phone: raw.tourist_phone || '',
      country: raw.tourist_country || '',
      username: raw.tourist_username || '',
    },
    specialNotes: raw.special_notes || '',
  };
}

const STATUS_STYLES: Record<string, string> = {
  upcoming:  'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  upcoming:  <Clock size={14} />,
  completed: <CheckCircle size={14} />,
  cancelled: <XCircle size={14} />,
};

// ── Detail Modal ───────────────────────────────────────────────────────────
interface DetailModalProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: 'completed' | 'cancelled') => Promise<void>;
}

function DetailModal({ booking, onClose, onStatusChange }: DetailModalProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status: 'completed' | 'cancelled') => {
    const label = status === 'completed' ? 'mark as Completed' : 'cancel';
    if (!window.confirm(`Are you sure you want to ${label} this booking?`)) return;
    setUpdating(true);
    await onStatusChange(booking.id, status);
    setUpdating(false);
    onClose();
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</h4>
      {children}
    </div>
  );

  const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null | undefined }) => (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#52B788] shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-1">Booking Reference</p>
            <h2 className="text-xl font-bold text-[#1B4332]">{booking.bookingReference}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[booking.status]}`}>
              {STATUS_ICON[booking.status]} {booking.status}
            </span>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Tourist */}
          <Section title="Guest Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={<User size={15} />} label="Full Name" value={booking.tourist.fullName} />
              <Field icon={<Mail size={15} />} label="Email" value={booking.tourist.email} />
              <Field icon={<Phone size={15} />} label="Phone" value={booking.tourist.phone} />
              <Field icon={<Globe size={15} />} label="Country" value={booking.tourist.country} />
            </div>
          </Section>

          {/* Visit details */}
          <Section title="Visit Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={<Calendar size={15} />} label="Date" value={fmtDate(booking.date)} />
              <Field icon={<Clock size={15} />} label="Time" value={fmtTime(booking.time)} />
              <Field icon={<Users size={15} />} label="Adults" value={booking.numAdults} />
              <Field icon={<Users size={15} />} label="Children" value={booking.numChildren} />
            </div>
          </Section>

          {/* Experiences */}
          <Section title="Experiences Booked">
            {booking.experiences.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {booking.experiences.map((exp, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-[#f0faf4] text-[#1B4332] text-sm font-medium px-3 py-1.5 rounded-full border border-[#B7E4C7]">
                    <Tag size={12} /> {exp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No experiences recorded</p>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <div className="bg-[#f0faf4] rounded-xl p-4 flex flex-col gap-2">
              {booking.totalLKR != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={14} /> LKR (Local)</span>
                  <span className="font-bold text-lg text-[#2D6A4F]">Rs {booking.totalLKR.toLocaleString()}</span>
                </div>
              )}
              {booking.totalUSD != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={14} /> USD (Foreign)</span>
                  <span className="font-bold text-lg text-[#2D6A4F]">$ {booking.totalUSD.toLocaleString()}</span>
                </div>
              )}
              {booking.totalLKR == null && booking.totalUSD == null && (
                <p className="text-sm text-gray-400 italic">No payment recorded</p>
              )}
            </div>
          </Section>

          {/* Special notes */}
          {booking.specialNotes && (
            <Section title="Special Notes">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <StickyNote size={15} className="shrink-0 mt-0.5" />
                <span>{booking.specialNotes}</span>
              </div>
            </Section>
          )}
        </div>

        {/* Footer actions */}
        {booking.status === 'upcoming' && (
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => handleStatus('completed')}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {updating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Mark Completed
            </button>
            <button
              onClick={() => handleStatus('cancelled')}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition text-sm"
            >
              <XCircle size={15} /> Cancel Booking
            </button>
          </div>
        )}

        {booking.status !== 'upcoming' && (
          <div className="p-5 border-t border-gray-100">
            <button onClick={onClose} className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition text-sm">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PlantationBookingManagement({ plantationId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [selected, setSelected] = useState<Booking | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await adminApi.getPlantationBookings(plantationId);
        setBookings((res.data?.bookings || []).map(mapRow));
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setLoadError('Unable to load bookings. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [plantationId]);

  // ── Status update ────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: 'completed' | 'cancelled') => {
    await adminApi.updateBookingStatus(plantationId, id, status);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    upcoming:  bookings.filter(b => b.status === 'upcoming').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  const displayed = useMemo(() => {
    let list = bookings;
    if (filterStatus !== 'all') list = list.filter(b => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.tourist.fullName.toLowerCase().includes(q) ||
        b.tourist.email.toLowerCase().includes(q) ||
        b.bookingReference.toLowerCase().includes(q) ||
        b.experiences.some(e => e.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });
  }, [bookings, filterStatus, search, sortOrder]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1B4332] mb-6">Booking Management</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Upcoming',  value: counts.upcoming,  icon: <Clock size={20} />,        style: 'bg-blue-50 text-blue-800',   icon_color: 'text-blue-500' },
          { label: 'Completed', value: counts.completed, icon: <CheckCircle size={20} />,  style: 'bg-green-50 text-green-800', icon_color: 'text-green-500' },
          { label: 'Cancelled', value: counts.cancelled, icon: <XCircle size={20} />,      style: 'bg-red-50 text-red-800',     icon_color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className={`${s.style} rounded-2xl p-5 flex items-center gap-4`}>
            <span className={s.icon_color}>{s.icon}</span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, reference, experience…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowUpDown size={15} />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
          <Loader2 className="animate-spin" size={22} /> Loading bookings…
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center text-sm">{loadError}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">{search || filterStatus !== 'all' ? 'No bookings match your filters.' : 'No bookings yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(b => (
            <div
              key={b.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition cursor-pointer"
              onClick={() => setSelected(b)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-bold text-base shrink-0">
                  {(b.tourist.fullName || 'G')[0].toUpperCase()}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#1B4332] truncate">{b.tourist.fullName}</p>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                      {STATUS_ICON[b.status]} {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{b.tourist.email} {b.tourist.country ? `· ${b.tourist.country}` : ''}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(b.date)}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} />{fmtTime(b.time)}</span>
                    <span className="flex items-center gap-1.5"><Users size={13} />
                      {b.numAdults} adult{b.numAdults !== 1 ? 's' : ''}
                      {b.numChildren > 0 ? `, ${b.numChildren} child${b.numChildren !== 1 ? 'ren' : ''}` : ''}
                    </span>
                  </div>

                  {b.experiences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {b.experiences.map((exp, i) => (
                        <span key={i} className="text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#B7E4C7] px-2 py-0.5 rounded-full">{exp}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: payment + ref */}
                <div className="text-right shrink-0">
                  {b.totalLKR != null && <p className="font-bold text-[#2D6A4F]">Rs {b.totalLKR.toLocaleString()}</p>}
                  {b.totalUSD != null && <p className="font-bold text-[#2D6A4F]">$ {b.totalUSD.toLocaleString()}</p>}
                  {b.totalLKR == null && b.totalUSD == null && <p className="text-gray-400 text-sm">—</p>}
                  <p className="text-xs text-gray-400 mt-1">#{b.bookingReference}</p>
                  <button className="mt-2 flex items-center gap-1 text-xs text-[#52B788] font-semibold ml-auto">
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
