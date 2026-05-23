import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ReviewModal from './ReviewModal';
import BookingDetailsModal from './BookingDetailsModal'; 

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

interface Review {
  id: number;
  plantationName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  image?: string;
  author: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews'>('bookings');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<ExperienceBooking | null>(null);
  const [isBookingDetailsModalOpen, setIsBookingDetailsModalOpen] = useState(false); // New state for booking details modal
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<ExperienceBooking | null>(null); // New state for selected booking details

  const allBookings: ExperienceBooking[] = [];

  const upcomingExperiences = allBookings.filter(b => b.status === 'upcoming');
  const pastExperiences = allBookings.filter(b => b.status === 'completed');

  const [reviews, setReviews] = useState<Review[]>([]);

  const handleOpenReviewModal = (booking: ExperienceBooking | null = null) => { 
    setSelectedBookingForReview(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (newReview: Omit<Review, 'id' | 'reviewDate' | 'author'> & { plantationName: string }) => {
    
    const existingReview = reviews.find(r => r.plantationName === newReview.plantationName && r.author === 'Current User');
    if (existingReview) {
      alert(`You have already submitted a review for ${newReview.plantationName}.`);
     
      return;
    }

    const newReviewWithId: Review = {
      ...newReview,
      id: reviews.length + 1,
      reviewDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      author: 'Current User', 
    };
    setReviews((prev) => [...prev, newReviewWithId]);
    setIsReviewModalOpen(false);
    setSelectedBookingForReview(null);
    setActiveTab('reviews');
  };

  const handleOpenBookingDetails = (booking: ExperienceBooking) => {
    setSelectedBookingDetails(booking);
    setIsBookingDetailsModalOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  // Get unique plantation names from past experiences for the review modal dropdown
  const experiencedPlantationNames = Array.from(new Set(pastExperiences.map(booking => booking.plantationName)));

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="py-16 px-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold font-serif text-center mb-4">My Dashboard</h1>
            <p className="text-gray-600 text-center">View your bookings and reviews from Camellia plantations</p>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-4 mb-12 justify-center">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-8 py-3 rounded-full font-semibold transition ${
                activeTab === 'bookings'
                  ? 'bg-[#52B788] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Booking History
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-8 py-3 rounded-full font-semibold transition ${
                activeTab === 'reviews'
                  ? 'bg-[#52B788] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Reviews
            </button>
          </div>

          {/* Content Sections */}
          {activeTab === 'bookings' && (
            <div className="space-y-12">
              {/* Upcoming Experiences */}
              <section>
                <h2 className="text-3xl font-bold mb-6 text-[#1B4332]">Upcoming Experiences</h2>
                {upcomingExperiences.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingExperiences.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white border-l-4 border-[#52B788] rounded-r-lg shadow-sm p-5 cursor-pointer hover:shadow-md transition"
                        onClick={() => handleOpenBookingDetails(booking)}
                      >
                        <p className="font-semibold text-xl text-[#1B4332]">{booking.plantationName}</p>
                        <p className="text-gray-600 text-sm mt-1">{booking.date} at {booking.time}</p>
                        <p className="text-gray-500 text-xs mt-1">Ref: {booking.bookingReference}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-lg">No upcoming experiences found.</p>
                  </div>
                )}
              </section>

              {/* Past Experiences */}
              <section className="mt-12">
                <h2 className="text-3xl font-bold mb-6 text-[#1B4332]">Past Experiences</h2>
                {pastExperiences.length > 0 ? (
                  <div className="space-y-4">
                    {pastExperiences.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white border-l-4 border-[#2D6A4F] rounded-r-lg shadow-sm p-5 cursor-pointer hover:shadow-md transition"
                        onClick={() => handleOpenBookingDetails(booking)}
                      >
                        <p className="font-semibold text-xl text-[#1B4332]">{booking.plantationName}</p>
                        <p className="text-gray-600 text-sm mt-1">{booking.date} at {booking.time}</p>
                        <p className="text-gray-500 text-xs mt-1">Ref: {booking.bookingReference}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-lg">No past experiences yet.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold mb-6 text-[#1B4332]">My Reviews</h2>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-6">
                    <div className="flex gap-6">
                      {/* Avatar/Placeholder */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                        {review.author[0]}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-[#1B4332]">{review.author}</h3>
                            <p className="text-sm text-gray-500">{review.plantationName} - 📅 {review.reviewDate}</p>
                          </div>
                          <div className="text-right">
                            {renderStars(review.rating)}
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed italic mb-4">"{review.reviewText}"</p>
                        {review.image && (
                          <img
                            src={review.image}
                            alt="Review"
                            className="w-32 h-32 object-cover rounded-lg mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-lg">No reviews yet.</p>
                  <p className="text-gray-500 mt-2">Complete an experience and share your thoughts!</p>
                </div>
              )}

              {/* Add New Review button in 'My Reviews' tab */}
              <div className="text-center mt-8">
                <button
                  onClick={() => handleOpenReviewModal(null)} 
                  className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 px-8 rounded-lg transition text-lg"
                >
                  Write a New Review
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-16 flex gap-6 justify-center">
            <button
              onClick={() => navigate('/plantations')}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Explore More Plantations
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleReviewSubmit}
         
          experiencedPlantations={experiencedPlantationNames}
          initialSelectedPlantation={selectedBookingForReview?.plantationName || ''} 
        />
      )}

      {/* Booking Details Modal */}
      {isBookingDetailsModalOpen && selectedBookingDetails && (
        <BookingDetailsModal
          isOpen={isBookingDetailsModalOpen}
          onClose={() => setIsBookingDetailsModalOpen(false)}
          booking={selectedBookingDetails}
        
          onWriteReview={(bookingToReview) => {
            setIsBookingDetailsModalOpen(false); 
            handleOpenReviewModal(bookingToReview);
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}