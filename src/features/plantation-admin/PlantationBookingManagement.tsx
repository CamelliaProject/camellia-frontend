import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Clock, XCircle, X, Eye, Search,
  User, Mail, Phone, Globe, Users, Calendar, Tag,
  Wallet, StickyNote, Loader2, ArrowUpDown, AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../services/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface ExperienceSlot {
  name: string;
  slot_time: string | null; // HH:MM:SS or null when no slot was booked
}

interface Booking {
  id: string;
  bookingReference: string;
  plantationId: string;
  date: string;
  numAdults: number;
  numChildren: number;
  /** Names only — kept for search/filter convenience */
  experiences: string[];
  /** Full detail: name + booked time slot */
  experienceSlots: ExperienceSlot[];
  totalUSD: number | null;
  totalLKR: number | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  cancelledBy: 'admin' | 'tourist' | null;
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

function fmt12h(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function mapRow(raw: any): Booking {
  // API now returns experience_slots: [{name, slot_time}]
  // Fall back to experience_names array for backwards compat
  const slots: ExperienceSlot[] = Array.isArray(raw.experience_slots)
    ? raw.experience_slots
    : (Array.isArray(raw.experience_names) ? raw.experience_names.map((n: string) => ({ name: n, slot_time: null })) : []);

  return {
    id: raw.id,
    bookingReference: raw.booking_reference || raw.id,
    plantationId: raw.plantation_id,
    date: raw.booking_date || '',
    numAdults: raw.num_adults ?? 1,
    numChildren: raw.num_children ?? 0,
    experiences: slots.map(s => s.name),
    experienceSlots: slots,
    totalUSD: raw.total_price_usd != null ? Number(raw.total_price_usd) : null,
    totalLKR: raw.total_price_lkr != null ? Number(raw.total_price_lkr) : null,
    status: raw.status ?? 'upcoming',
    cancelledBy: raw.cancelled_by === 'admin' ? 'admin' : raw.status === 'cancelled' ? 'tourist' : null,
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

/** Returns the common visit time if all booked slots share the same time, otherwise null. */
function commonVisitTime(slots: ExperienceSlot[]): string | null {
  const times = [...new Set(slots.map(s => s.slot_time).filter(Boolean))];
  return times.length === 1 ? times[0]! : null;
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const booking = new Date(dateStr);
  booking.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((booking.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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

function cancelledLabel(cancelledBy: 'admin' | 'tourist' | null): string {
  if (cancelledBy === 'admin')   return 'Cancelled by Plantation';
  if (cancelledBy === 'tourist') return 'Cancelled by Customer';
  return 'Cancelled';
}

function cancelledStyle(cancelledBy: 'admin' | 'tourist' | null): string {
  if (cancelledBy === 'tourist') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

// ── Cancel Reason Modal ────────────────────────────────────────────────────
interface CancelReasonModalProps {
  bookingRef: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  submitting: boolean;
}

function CancelReasonModal({ bookingRef, onConfirm, onClose, submitting }: CancelReasonModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-900">Cancel Booking</h3>
          </div>
          <button onClick={onClose} disabled={submitting} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to cancel booking <span className="font-semibold text-gray-900">#{bookingRef}</span>.
            An email will be sent to the guest explaining the cancellation and confirming their refund will be processed within 24 hours.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Unforeseen plantation closure, extreme weather conditions…"
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            The guest will be notified by email and their refund will be processed within 24 hours.
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition text-sm"
          >
            Go Back
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={submitting || !reason.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition text-sm"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
interface DetailModalProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: 'completed' | 'cancelled', reason?: string) => Promise<void>;
}

function DetailModal({ booking, onClose, onStatusChange }: DetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const days = daysUntil(booking.date);
  const canCancel = days >= 7;

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this booking as Completed?')) return;
    setUpdating(true);
    await onStatusChange(booking.id, 'completed');
    setUpdating(false);
    onClose();
  };

  const handleCancelConfirm = async (reason: string) => {
    setUpdating(true);
    await onStatusChange(booking.id, 'cancelled', reason);
    setUpdating(false);
    setShowCancelModal(false);
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
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
              booking.status === 'cancelled' ? cancelledStyle(booking.cancelledBy) : STATUS_STYLES[booking.status]
            }`}>
              {STATUS_ICON[booking.status]}
              {booking.status === 'cancelled' ? cancelledLabel(booking.cancelledBy) : booking.status}
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
              {(() => {
                const t = commonVisitTime(booking.experienceSlots);
                return t ? <Field icon={<Clock size={15} />} label="Visit Time" value={fmt12h(t)} /> : null;
              })()}
              <Field icon={<Users size={15} />} label="Adults" value={booking.numAdults} />
              {booking.numChildren > 0 && (
                <Field icon={<Users size={15} />} label="Children" value={booking.numChildren} />
              )}
            </div>
          </Section>

          {/* Experiences */}
          <Section title="Experiences Booked">
            {booking.experienceSlots.length > 0 ? (
              <div className="space-y-2">
                {booking.experienceSlots.map((slot, i) => {
                  const hasDiffTime = !commonVisitTime(booking.experienceSlots) && slot.slot_time;
                  return (
                    <div key={i} className="flex items-center justify-between bg-[#f0faf4] border border-[#B7E4C7] rounded-xl px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-[#1B4332]">
                        <Tag size={12} className="shrink-0" /> {slot.name}
                      </span>
                      {hasDiffTime && (
                        <span className="flex items-center gap-1 text-xs text-[#2D6A4F] font-semibold ml-3 shrink-0">
                          <Clock size={11} /> {fmt12h(slot.slot_time)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No experiences recorded</p>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <div className="bg-[#f0faf4] rounded-xl p-4 flex flex-col gap-2">
              {booking.totalUSD != null ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={14} /> Amount Paid (USD)</span>
                    <span className="font-bold text-lg text-[#2D6A4F]">$ {booking.totalUSD.toLocaleString()}</span>
                  </div>
                  {booking.totalLKR != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400 flex items-center gap-2"><Wallet size={14} /> LKR Equivalent</span>
                      <span className="text-sm text-gray-500">Rs {booking.totalLKR.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : booking.totalLKR != null ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={14} /> Amount Paid (LKR)</span>
                  <span className="font-bold text-lg text-[#2D6A4F]">Rs {booking.totalLKR.toLocaleString()}</span>
                </div>
              ) : (
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
          <div className="p-5 border-t border-gray-100 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                {updating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Mark Completed
              </button>
              <div className="flex-1 relative group">
                <button
                  onClick={() => canCancel && setShowCancelModal(true)}
                  disabled={updating || !canCancel}
                  className={`w-full flex items-center justify-center gap-2 border-2 font-semibold py-2.5 rounded-xl transition text-sm
                    ${canCancel
                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'}`}
                >
                  <XCircle size={15} /> Cancel Booking
                </button>
                {!canCancel && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 text-center opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    Cancellations must be made at least 7 days before the booking date.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>
            {!canCancel && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertTriangle size={13} className="shrink-0" />
                This booking is {days} day{days === 1 ? '' : 's'} away — cancellation is only allowed 7 or more days before the booking date.
              </p>
            )}
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

      {showCancelModal && (
        <CancelReasonModal
          bookingRef={booking.bookingReference}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelModal(false)}
          submitting={updating}
        />
      )}
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
  const handleStatusChange = async (id: string, status: 'completed' | 'cancelled', reason?: string) => {
    await adminApi.updateBookingStatus(plantationId, id, status, reason);
    setBookings(prev => prev.map(b =>
      b.id === id
        ? { ...b, status, cancelledBy: status === 'cancelled' ? 'admin' : b.cancelledBy }
        : b
    ));
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
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      b.status === 'cancelled' ? cancelledStyle(b.cancelledBy) : STATUS_STYLES[b.status]
                    }`}>
                      {STATUS_ICON[b.status]}
                      {b.status === 'cancelled' ? cancelledLabel(b.cancelledBy) : b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{b.tourist.email} {b.tourist.country ? `· ${b.tourist.country}` : ''}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {fmtDate(b.date)}
                      {(() => {
                        const t = commonVisitTime(b.experienceSlots);
                        return t ? <span className="ml-1 text-[#2D6A4F] font-medium flex items-center gap-1"><Clock size={12} />{fmt12h(t)}</span> : null;
                      })()}
                    </span>
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
                  {b.totalUSD != null ? (
                    <>
                      <p className="font-bold text-[#2D6A4F]">$ {b.totalUSD.toLocaleString()}</p>
                      {b.totalLKR != null && <p className="text-xs text-gray-400">≈ Rs {b.totalLKR.toLocaleString()}</p>}
                    </>
                  ) : b.totalLKR != null ? (
                    <p className="font-bold text-[#2D6A4F]">Rs {b.totalLKR.toLocaleString()}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">—</p>
                  )}
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
