import { X, Calendar, Users, Star, AlertTriangle } from 'lucide-react';

export interface ExperienceBooking {
  id: string;
  bookingReference: string;
  plantationId: string;
  plantationName: string;
  date: string;
  guests: string;
  experiences: string[];
  totalPaid: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  cancelledBy: 'admin' | 'tourist' | null;
}

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ExperienceBooking;
  onWriteReview?: (booking: ExperienceBooking) => void;
  onCancel?: (bookingId: string) => Promise<void>;
}

function formatDate(raw: any) {
  if (!raw) return '—';
  try {
    const iso = raw instanceof Date ? raw.toISOString() : String(raw);
    const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !mo || !d) return String(raw);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return String(raw); }
}

const STATUS_STYLES: Record<string, string> = {
  upcoming:  'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

function bookingStatusLabel(status: string, cancelledBy: 'admin' | 'tourist' | null) {
  if (status !== 'cancelled') return status;
  if (cancelledBy === 'admin')   return 'Cancelled by Plantation';
  if (cancelledBy === 'tourist') return 'Cancelled by You';
  return 'Cancelled';
}

function bookingStatusStyle(status: string, cancelledBy: 'admin' | 'tourist' | null) {
  if (status !== 'cancelled') return STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  if (cancelledBy === 'tourist') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export default function BookingDetailsModal({
  isOpen, onClose, booking, onWriteReview, onCancel,
}: BookingDetailsModalProps) {
  if (!isOpen) return null;

  const isUpcoming = booking.status === 'upcoming';
  const isCompleted = booking.status === 'completed';

  const handleCancel = async () => {
    if (!onCancel) return;
    if (!window.confirm(
      'Are you sure you want to cancel this booking?\n\nPlease note: Tourist-initiated cancellations are non-refundable. This action cannot be undone.'
    )) return;
    await onCancel(booking.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#1B4332]">{booking.plantationName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ref: {booking.bookingReference}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <X size={20} />
          </button>
        </div>

        {/* Status badge */}
        <div className="px-6 pt-4">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${bookingStatusStyle(booking.status, booking.cancelledBy)}`}>
            {bookingStatusLabel(booking.status, booking.cancelledBy)}
          </span>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#52B788] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Date</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(booking.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <Users size={18} className="text-[#52B788] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Guests</p>
                <p className="text-sm font-semibold text-gray-800">{booking.guests}</p>
              </div>
            </div>
          </div>

          {/* Experiences */}
          {booking.experiences.length > 0 && (
            <div className="bg-[#f0faf4] rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Experiences Booked</p>
              <ul className="space-y-1">
                {booking.experiences.map((exp, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#1B4332] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] shrink-0" />
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-[#2D6A4F]">{booking.totalPaid}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {isCompleted && onWriteReview && (
            <button
              onClick={() => { onWriteReview(booking); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 rounded-xl transition"
            >
              <Star size={16} /> Write a Review
            </button>
          )}

          {isUpcoming && onCancel && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Tourist-initiated cancellations are <strong>non-refundable</strong>. Only cancellations made by the plantation include a refund.
              </p>
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 border-2 border-red-400 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition text-sm"
              >
                <AlertTriangle size={15} /> Cancel Booking (No Refund)
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
