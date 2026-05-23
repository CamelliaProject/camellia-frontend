import { useState, useEffect } from 'react';
import { Filter, CheckCircle, Clock, XCircle, X, Eye } from 'lucide-react';
import { PLANTATION_DATA } from '../tourist/PlantationDetail';
import { adminApi } from '../../services/api';

interface Booking {
  id: string;
  bookingReference: string;
  plantationId: string;
  date: string;
  time: string;
  guests: string;
  experiences: string[];
  totalPaid: string;
  status: 'upcoming' | 'completed' | 'cancelled' | string;
  touristDetails: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
  };
  adults?: number;
  children?: number;
}

interface PlantationBookingManagementProps {
  plantationId: string;
}

// Helper to format date for display
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error('Invalid date string:', dateString);
    return dateString;
  }
};

export default function PlantationBookingManagement({ plantationId }: PlantationBookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getPlantationBookings(plantationId);
        const fetched: Booking[] = (response.data?.bookings || []).map((item: any) => ({
          id: item.id || item.booking_reference || item.created_at || 'unknown',
          bookingReference: item.booking_reference || item.id || 'N/A',
          plantationId: item.plantation_id || plantationId,
          date: item.booking_date || item.date || '',
          time: item.booking_time || item.time || '',
          guests: item.guest_count ? `${item.guest_count} guest${item.guest_count === 1 ? '' : 's'}` : 'N/A',
          experiences: item.experiences || [],
          totalPaid: item.total_paid ? String(item.total_paid) : 'N/A',
          status: item.status || 'upcoming',
          touristDetails: {
            fullName: item.tourist_username || item.tourist_email || 'Guest',
            email: item.tourist_email || '',
            phone: item.tourist_phone || '',
            country: item.tourist_country || '',
          },
          adults: item.adults,
          children: item.children,
        }));

        setBookings(fetched);
      } catch (error) {
        console.error('Failed to load bookings:', error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBookings();
  }, [plantationId]);

  const getFilteredAndSortedBookings = () => {
    let filtered = bookings;
    if (filterStatus !== 'all') {
      filtered = bookings.filter((b) => b.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const displayedBookings = getFilteredAndSortedBookings();

  const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-[#1B4332] mb-6">Manage Bookings</h2>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading bookings...</p>
        </div>
      ) : (
        <>
          {/* Booking Summary Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
              <Clock size={24} className="text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Upcoming Bookings</p>
                <p className="text-2xl font-bold text-blue-800">{upcomingCount}</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">Completed Bookings</p>
                <p className="text-2xl font-bold text-green-800">{completedCount}</p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
              <XCircle size={24} className="text-red-600" />
              <div>
                <p className="text-sm text-red-700 font-medium">Cancelled Bookings</p>
                <p className="text-2xl font-bold text-red-800">{cancelledCount}</p>
              </div>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <label htmlFor="statusFilter" className="font-semibold text-gray-700">Filter by Status:</label>
              <select
                id="statusFilter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sortOrder" className="font-semibold text-gray-700">Sort by Date:</label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {displayedBookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No bookings found for this plantation with the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-left text-sm font-semibold text-gray-700">
                    <th className="py-3 px-4 rounded-tl-lg">Reference</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Tourist</th>
                    <th className="py-3 px-4">Guests</th>
                    <th className="py-3 px-4">Experiences</th>
                    <th className="py-3 px-4">Total Paid</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#2D6A4F]">{booking.bookingReference}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(booking.date)} <br/> {booking.time}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <p className="font-medium">{booking.touristDetails.fullName}</p>
                        <p className="text-xs text-gray-500">{booking.touristDetails.email}</p>
                        <p className="text-xs text-gray-500">{booking.touristDetails.phone}</p>
                        <p className="text-xs text-gray-500">{booking.touristDetails.country}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{booking.guests}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{booking.experiences.join(', ')}</td>
                      <td className="py-3 px-4 font-bold text-[#1B4332]">
                        {booking.totalPaid}
                        {(() => {
                          // Show LKR equivalent if totalPaid is in USD
                          try {
                            const rate = 365;
                            const t = String(booking.totalPaid || '');
                            const usdMatch = t.match(/\$\s?(\d+(?:\.\d+)?)/);
                            if (usdMatch) {
                              const usd = Number(usdMatch[1]);
                              const lkr = usd * rate;
                              return <div className="text-xs text-gray-500">Rs {lkr.toLocaleString()}</div>;
                            }
                          } catch (e) {}
                          return null;
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => { setSelectedBooking(booking); setIsDetailModalOpen(true); }}
                          className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={isDetailModalOpen}
        booking={selectedBooking}
        onClose={() => { setIsDetailModalOpen(false); setSelectedBooking(null); }}
        plantationId={plantationId}
      />
    </div>
  );
}

// Booking Detail Modal
interface BookingDetailModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  plantationId: string;
}

function BookingDetailModal({ isOpen, booking, onClose, plantationId }: BookingDetailModalProps) {
  if (!isOpen || !booking) return null;

  const plantation = PLANTATION_DATA[plantationId];
  const USD_TO_LKR = 365;

  // Parse totalPaid to extract amount and currency
  const parseTotalPaid = (totalPaid: string) => {
    const usdMatch = totalPaid.match(/\$\s?(\d+(?:\.\d+)?)/);
    const lkrMatch = totalPaid.match(/Rs\s?(\d+(?:\.\d+)?)/);
    if (usdMatch) {
      const usd = Number(usdMatch[1]);
      return { usd, lkr: usd * USD_TO_LKR, currency: 'USD' };
    }
    if (lkrMatch) {
      const lkr = Number(lkrMatch[1]);
      return { usd: lkr / USD_TO_LKR, lkr, currency: 'LKR' };
    }
    return { usd: 0, lkr: 0, currency: 'UNKNOWN' };
  };

  const { usd, lkr, currency } = parseTotalPaid(booking.totalPaid);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Booking Summary */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-bold text-[#1B4332] mb-3">Booking Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Booking Reference</p>
                <p className="font-semibold text-[#2D6A4F]">{booking.bookingReference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${
                  booking.status === 'upcoming' ? 'text-blue-700' :
                  booking.status === 'completed' ? 'text-green-700' :
                  'text-red-700'
                }`}>{booking.status.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{new Date(booking.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">{booking.time || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Tourist Details */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-bold text-[#1B4332] mb-3">Tourist Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{booking.touristDetails.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-sm">{booking.touristDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{booking.touristDetails.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-semibold">{booking.touristDetails.country}</p>
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-bold text-[#1B4332] mb-3">Guests</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Adults</p>
                <p className="text-2xl font-bold text-blue-700">{booking.adults || 0}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Children</p>
                <p className="text-2xl font-bold text-blue-700">{booking.children || 0}</p>
              </div>
            </div>
          </div>

          {/* Experiences */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-bold text-[#1B4332] mb-3">Selected Experiences</h3>
            <div className="space-y-3">
              {booking.experiences.map((expName, idx) => {
                const exp = plantation?.experiences?.find((e: any) => e.name === expName);
                if (!exp) return <div key={idx} className="text-sm text-gray-600">{expName}</div>;
                return (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="font-semibold text-[#2D6A4F]">{exp.name}</p>
                    {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="font-medium">Adult: ${exp.priceUSD?.adult || 0}</span>
                      <span className="font-medium">Child: ${exp.priceUSD?.child || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-bold text-[#1B4332] mb-3">Pricing</h3>
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Total Paid (Original)</span>
                <span className="font-bold text-[#2D6A4F]">{booking.totalPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Equivalent in {currency === 'USD' ? 'LKR' : 'USD'}</span>
                <span className="font-bold text-[#2D6A4F]">{currency === 'USD' ? `Rs ${lkr.toLocaleString()}` : `$${usd.toFixed(2)}`}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}