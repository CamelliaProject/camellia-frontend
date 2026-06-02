import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ReviewModal from './ReviewModal';
import BookingDetailsModal, { type ExperienceBooking } from './BookingDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { bookingApi, reviewApi } from '../../services/api';
import { Loader2, MessageCircle } from 'lucide-react';

interface MyReview {
  id: string;
  plantation_id: string;
  plantation_name: string;
  plantation_image?: string;
  rating: number;
  title?: string;
  content: string;
  image_url?: string;
  created_at: string;
  replies: Array<{
    id: string;
    author_name: string;
    author_role: string;
    content: string;
    created_at: string;
  }>;
}

interface MyReply {
  id: string;
  review_id: string;
  content: string;
  created_at: string;
  author_role: string;
  review_content: string;
  review_rating: number;
  plantation_name: string;
  plantation_id: string;
}

function mapBooking(raw: any): ExperienceBooking {
  const adults = raw.num_adults ?? 1;
  const children = raw.num_children ?? 0;
  const guestParts = [`${adults} Adult${adults !== 1 ? 's' : ''}`];
  if (children > 0) guestParts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);

  const experienceNames: string[] = Array.isArray(raw.experience_names) ? raw.experience_names : [];

  const totalPaid = raw.total_price_lkr
    ? `Rs ${Number(raw.total_price_lkr).toLocaleString()}`
    : raw.total_price_usd
    ? `$ ${Number(raw.total_price_usd).toLocaleString()}`
    : '—';

  return {
    id: raw.id,
    bookingReference: raw.booking_reference,
    plantationId: raw.plantation_id,
    plantationName: raw.plantation_name || 'Unknown Plantation',
    date: raw.booking_date || '',
    guests: guestParts.join(', '),
    experiences: experienceNames,
    totalPaid,
    status: raw.status ?? 'upcoming',
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews'>('bookings');
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [myReplies, setMyReplies] = useState<MyReply[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsSubTab, setReviewsSubTab] = useState<'mine' | 'replies'>('mine');

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<ExperienceBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ExperienceBooking | null>(null);

  // Fetch bookings
  useEffect(() => {
    const load = async () => {
      setIsLoadingBookings(true);
      setLoadError('');
      try {
        const res = await bookingApi.getAll();
        const rows: any[] = res.data?.data ?? [];
        setBookings(rows.map(mapBooking));
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setLoadError('Unable to load your bookings. Please try again.');
      } finally {
        setIsLoadingBookings(false);
      }
    };
    void load();
  }, []);

  // Fetch reviews on mount so the "Reviewed" tag is visible on the bookings tab too
  useEffect(() => {
    void loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await reviewApi.getMyReviews();
      setMyReviews(res.data?.data?.reviews ?? []);
      setMyReplies(res.data?.data?.myReplies ?? []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    await bookingApi.cancel(bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
  };

  const handleOpenReviewModal = (booking: ExperienceBooking | null = null) => {
    setSelectedBookingForReview(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    // Refresh reviews list after successful modal submit
    await loadReviews();
    setIsReviewModalOpen(false);
    setSelectedBookingForReview(null);
    setActiveTab('reviews');
  };

  // Derived
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Unique completed plantations with id+name for the modal
  const reviewedPlantationIds = new Set(myReviews.map((r) => r.plantation_name));
  const experiencedPlantations = completedBookings
    .filter((b) => !reviewedPlantationIds.has(b.plantationName))
    .reduce<Array<{ id: string; name: string }>>((acc, b) => {
      if (!acc.find((p) => p.id === b.plantationId)) {
        acc.push({ id: b.plantationId, name: b.plantationName });
      }
      return acc;
    }, []);

  const displayName = user?.name || user?.username || 'Traveller';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'T';

  const stats = [
    { label: 'Total Bookings', value: bookings.filter((b) => b.status !== 'cancelled').length, color: 'bg-[#D8F3DC] text-[#1B4332]' },
    { label: 'Upcoming', value: upcomingBookings.length, color: 'bg-[#B7E4C7] text-[#1B4332]' },
    { label: 'Completed', value: completedBookings.length, color: 'bg-[#95D5B2] text-[#1B4332]' },
    { label: 'Reviews', value: myReviews.length, color: 'bg-amber-100 text-amber-800' },
  ];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400 text-base' : 'text-gray-200 text-base'}>★</span>
      ))}
    </div>
  );

  const fmtDate = (raw: any) => {
    if (!raw) return '—';
    try {
      const iso = raw instanceof Date ? raw.toISOString() : String(raw);
      const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
      if (!y || !mo || !d) return String(raw);
      return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return String(raw); }
  };



  const STATUS_BADGE: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] font-sans text-[#1B4332]">
      <Navbar />

      {/* Profile banner */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white">
        <div className="max-w-6xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-24 h-24 rounded-full bg-[#52B788] flex items-center justify-center text-4xl font-bold shadow-lg ring-4 ring-white/20 shrink-0">
            {avatarLetter}
          </div>
          <div className="text-center md:text-left">
            <p className="text-[#95D5B2] text-sm font-medium uppercase tracking-widest mb-1">My Account</p>
            <h1 className="text-4xl font-bold leading-tight">{displayName}</h1>
            {user?.email && <p className="text-[#B7E4C7] mt-1 text-sm">{user.email}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-6">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-5 shadow-md text-center`}>
              <p className="text-3xl font-bold">{isLoadingBookings ? '—' : stat.value}</p>
              <p className="text-sm font-medium mt-1 opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1 w-fit mb-8">
          {([['bookings', 'Booking History'], ['reviews', 'My Reviews']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl font-semibold text-sm transition ${
                activeTab === tab ? 'bg-[#2D6A4F] text-white shadow' : 'text-gray-500 hover:text-[#2D6A4F]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Bookings tab ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-10">
            {isLoadingBookings && (
              <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading your bookings…</span>
              </div>
            )}
            {!isLoadingBookings && loadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
                {loadError}
                <button onClick={() => window.location.reload()} className="ml-3 underline text-sm">Retry</button>
              </div>
            )}
            {!isLoadingBookings && !loadError && (
              <>
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-1 h-6 bg-[#52B788] rounded-full" />
                    <h2 className="text-xl font-bold">Upcoming Experiences</h2>
                    <span className="ml-auto bg-[#D8F3DC] text-[#1B4332] text-xs font-bold px-3 py-1 rounded-full">
                      {upcomingBookings.length}
                    </span>
                  </div>
                  {upcomingBookings.length > 0 ? (
                    <div className="grid gap-3">
                      {upcomingBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBooking(b); setIsDetailsOpen(true); }}
                          className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-5 text-left w-full hover:shadow-md hover:border-[#52B788] border border-transparent transition"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#D8F3DC] flex items-center justify-center text-2xl shrink-0">🌿</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1B4332] truncate">{b.plantationName}</p>
                            <p className="text-gray-500 text-sm mt-0.5">{fmtDate(b.date)}</p>
                            {b.experiences.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{b.experiences.join(', ')}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">Upcoming</span>
                            <p className="text-gray-700 font-semibold text-sm mt-1">{b.totalPaid}</p>
                            <p className="text-gray-400 text-xs mt-0.5">#{b.bookingReference}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-[#B7E4C7]">
                      <p className="text-4xl mb-3">🌱</p>
                      <p className="text-gray-500 font-medium">No upcoming experiences</p>
                      <button onClick={() => navigate('/plantations')} className="mt-4 text-[#2D6A4F] font-semibold text-sm underline underline-offset-2">
                        Browse plantations →
                      </button>
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-1 h-6 bg-gray-300 rounded-full" />
                    <h2 className="text-xl font-bold">Past Experiences</h2>
                    <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                      {pastBookings.length}
                    </span>
                  </div>
                  {pastBookings.length > 0 ? (
                    <div className="grid gap-3">
                      {pastBookings.map((b) => {
                        const isReviewed = b.status === 'completed' && myReviews.some((r) => r.plantation_id === b.plantationId);
                        return (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBooking(b); setIsDetailsOpen(true); }}
                          className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-5 text-left w-full hover:shadow-md border border-transparent hover:border-gray-200 transition"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 opacity-60">🌿</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#1B4332] truncate">{b.plantationName}</p>
                              {isReviewed && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                                  ⭐ Reviewed
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-0.5">{fmtDate(b.date)}</p>
                            {b.experiences.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{b.experiences.join(', ')}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-500'}`}>
                              {b.status}
                            </span>
                            <p className="text-gray-500 font-semibold text-sm mt-1">{b.totalPaid}</p>
                            <p className="text-gray-400 text-xs mt-0.5">#{b.bookingReference}</p>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                      <p className="text-gray-400">No past experiences yet.</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1 h-6 bg-amber-400 rounded-full" />
                <h2 className="text-xl font-bold">My Reviews</h2>
              </div>
              {experiencedPlantations.length > 0 && (
                <button
                  onClick={() => handleOpenReviewModal(null)}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm"
                >
                  + Write a Review
                </button>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
              {([['mine', 'My Reviews'], ['replies', 'My Comments']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setReviewsSubTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                    reviewsSubTab === tab ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {isLoadingReviews && (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading…
              </div>
            )}

            {!isLoadingReviews && reviewsSubTab === 'mine' && (
              <>
                {myReviews.length > 0 ? (
                  <div className="space-y-5">
                    {myReviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-bold text-[#1B4332] text-lg">{review.plantation_name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{fmtDate(review.created_at)}</p>
                          </div>
                          {renderStars(review.rating)}
                        </div>

                        {review.title && (
                          <p className="font-semibold text-gray-800 mb-1">{review.title}</p>
                        )}

                        <p className="text-gray-600 leading-relaxed text-sm italic">"{review.content}"</p>

                        {review.image_url && (
                          <img src={review.image_url} alt="Review" className="max-w-[90px] max-h-[90px] w-auto h-auto object-contain rounded-lg mt-2" />
                        )}

                        {/* Replies on this review */}
                        {review.replies.length > 0 && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                              <MessageCircle size={13} />
                              {review.replies.length} {review.replies.length === 1 ? 'Reply' : 'Replies'}
                            </p>
                            <div className="space-y-2">
                              {review.replies.map((reply) => (
                                <div key={reply.id} className="ml-3 bg-gray-50 rounded-xl p-3 border-l-4 border-[#2D6A4F]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-700">{reply.author_name}</span>
                                    {reply.author_role === 'plantationadmin' && (
                                      <span className="bg-[#2D6A4F] text-white text-xs px-1.5 py-0.5 rounded-full">Admin</span>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">{fmtDate(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-200">
                    <p className="text-5xl mb-4">⭐</p>
                    <p className="text-gray-500 font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {completedBookings.length > 0
                        ? 'Share your experience by writing a review!'
                        : 'Complete an experience and share your thoughts!'}
                    </p>
                  </div>
                )}
              </>
            )}

            {!isLoadingReviews && reviewsSubTab === 'replies' && (
              <>
                {myReplies.length > 0 ? (
                  <div className="space-y-4">
                    {myReplies.map((reply) => (
                      <div key={reply.id} className="bg-white rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-[#1B4332]">{reply.plantation_name}</p>
                          <p className="text-xs text-gray-400">{fmtDate(reply.created_at)}</p>
                        </div>
                        <p className="text-xs text-gray-400 mb-2 italic">
                          On a review: "{reply.review_content.slice(0, 100)}{reply.review_content.length > 100 ? '…' : ''}"
                        </p>
                        <div className="bg-[#F5FAF7] border-l-4 border-[#2D6A4F] rounded-r-xl px-4 py-2.5">
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-200">
                    <p className="text-5xl mb-4">💬</p>
                    <p className="text-gray-500 font-medium">No comments yet</p>
                    <p className="text-gray-400 text-sm mt-1">Reply to reviews on plantations you have visited.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-14 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate('/plantations')}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-3 px-8 rounded-xl transition"
          >
            Explore Plantations
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 font-semibold py-3 px-8 rounded-xl transition"
          >
            Back to Home
          </button>
        </div>
      </main>

      <Footer />

      {isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => { setIsReviewModalOpen(false); setSelectedBookingForReview(null); }}
          onSubmit={handleReviewSubmit}
          experiencedPlantations={experiencedPlantations}
          initialSelectedPlantationId={selectedBookingForReview?.plantationId || ''}
        />
      )}

      {isDetailsOpen && selectedBooking && (
        <BookingDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => { setIsDetailsOpen(false); setSelectedBooking(null); }}
          booking={selectedBooking}
          onWriteReview={(b) => { setIsDetailsOpen(false); handleOpenReviewModal(b); }}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
