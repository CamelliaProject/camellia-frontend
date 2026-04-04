
import { X } from 'lucide-react';

interface ExperienceBooking {
  id: string;
  bookingReference: string;
  plantationName: string;
  date: string;
  time: string;
  guests: string;
  experiences: string[];
  totalPaid: string;
  status: 'upcoming' | 'completed';
}

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ExperienceBooking;
  onWriteReview?: (booking: ExperienceBooking) => void; 
}

export default function BookingDetailsModal({ isOpen, onClose, booking, onWriteReview }: BookingDetailsModalProps) {
  if (!isOpen) return null;

  
  const formatDate = (dateString: string) => {
    try {
      
      if (dateString.includes(',')) {
        return dateString;
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString; 
    }
  };

  const isCompleted = booking.status === 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">{booking.plantationName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Booking Details Content */}
        <div className="p-6">
          <div className="bg-[#E8F5E9] border-2 border-[#B7E4C7] rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 gap-4 text-gray-700">
              <div>
                <p className="font-semibold text-sm">Booking Reference</p>
                <p className="text-base">{booking.bookingReference}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Status</p>
                <p className={`text-base font-medium ${isCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                  {booking.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm">Date</p>
                <p className="text-base">{formatDate(booking.date)}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Time</p>
                <p className="text-base">{booking.time}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Guests</p>
                <p className="text-base">{booking.guests}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Experiences</p>
                <p className="text-base">{booking.experiences.join(', ')}</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Total Paid</p>
                <p className="text-xl font-bold text-[#2D6A4F]">{booking.totalPaid}</p>
              </div>
            </div>
          </div>

          {/* Action button for completed experiences */}
          {isCompleted && onWriteReview && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  onWriteReview(booking);
                  onClose(); 
                }}
                className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 px-8 rounded-lg transition text-lg"
              >
                Write a Review
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#f0f0f0] font-semibold py-3 px-6 rounded-lg transition text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
