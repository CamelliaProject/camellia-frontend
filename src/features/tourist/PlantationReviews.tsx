import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Loader2, ImageIcon } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ReviewReplies from '../../components/reviews/ReviewReplies';
import { useAuth } from '../../context/AuthContext';
import { reviewApi, plantationApi, bookingApi } from '../../services/api';
import { mapReview, type Review, type ReviewReply } from '../../services/reviewService';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-4xl transition-colors ${
            star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PlantationReviews() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plantation, setPlantation] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    void loadData();
  }, [id, user?.id]);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [plantationRes, reviewsRes] = await Promise.all([
        plantationApi.getById(id!),
        reviewApi.getByPlantation(id!),
      ]);

      setPlantation(plantationRes.data.data);

      const rawReviews = reviewsRes.data.data || [];
      const mapped = rawReviews.map((r: any) => mapReview(r, id!));
      setReviews(mapped);

      if (user) {
        const alreadyReviewed = rawReviews.some((r: any) => r.tourist_id === user.id);
        setHasAlreadyReviewed(alreadyReviewed);

        const bookingsRes = await bookingApi.getAll();
        const allBookings: any[] = bookingsRes.data?.data ?? [];
        const hasBooking = allBookings.some(
          (b) => b.plantation_id === id && b.status === 'completed'
        );
        setHasCompletedBooking(hasBooking);
      }
    } catch (err) {
      console.error('Failed to load plantation reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setSubmitError('Please select a rating.'); return; }
    if (!content.trim()) { setSubmitError('Please write your experience.'); return; }
    setSubmitError('');
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await reviewApi.uploadImage(fd);
        imageUrl = uploadRes.data.url;
      }

      await reviewApi.create({
        plantation_id: id,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        image_url: imageUrl,
      });

      const reviewsRes = await reviewApi.getByPlantation(id!);
      setReviews((reviewsRes.data.data || []).map((r: any) => mapReview(r, id!)));
      setHasAlreadyReviewed(true);
      setShowReviewForm(false);
      setRating(0);
      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReplyAdded(reviewId: string, reply: ReviewReply) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r
      )
    );
  }

  function handleReplyDeleted(reviewId: string, replyId: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, replies: (r.replies || []).filter((rp) => rp.id !== replyId) }
          : r
      )
    );
  }

  function handleReviewReacted(reviewId: string, newCount: number) {
    setReviews((prev) =>
      prev.map((r) => r.id === reviewId ? { ...r, helpful_count: newCount } : r)
    );
  }

  const canWriteReview = !!user && user.role === 'tourist' && hasCompletedBooking && !hasAlreadyReviewed;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute top-3 right-3 bg-white text-black p-1.5 rounded-full hover:bg-gray-200 transition z-10"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxSrc}
              alt="Review photo"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      <Navbar />

      <main className="py-12 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(id ? `/plantation/${id}` : '/plantations')}
            className="flex items-center gap-2 text-[#2D6A4F] hover:text-[#1B4332] font-semibold mb-8"
          >
            <ArrowLeft size={20} />
            Back to {plantation?.name || 'Plantation'}
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold font-serif mb-1">
              {plantation?.name ? `${plantation.name} Reviews` : 'Plantation Reviews'}
            </h1>

            {!isLoading && (
              <div className="mt-3">
                {reviews.length > 0 ? (() => {
                  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                  const rounded = Math.round(avg);
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-xl ${star <= rounded ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-[#1B4332]">{avg.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">· {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                    </div>
                  );
                })() : (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-xl text-gray-300">★</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">No reviews yet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {user && user.role === 'tourist' && (
            <div className="mb-8">
              {hasAlreadyReviewed && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 text-sm font-medium">
                  ✓ You have already reviewed this plantation. Thank you for your feedback!
                </div>
              )}
              {!hasAlreadyReviewed && !hasCompletedBooking && !isLoading && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-5 py-4 text-sm">
                  Complete a visit to this plantation to leave a review.
                </div>
              )}
              {canWriteReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  + Write a Review
                </button>
              )}
            </div>
          )}

          {showReviewForm && (
            <div className="mb-10 bg-[#F5FAF7] border border-[#B7E4C7] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-[#1B4332]">Share Your Experience</h2>
                <button
                  onClick={() => { setShowReviewForm(false); setSubmitError(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your visit"
                    maxLength={200}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Experience <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tell others what you loved, what you saw, and why they should visit…"
                    rows={5}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none text-sm"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Photo <span className="text-gray-400 font-normal">(optional, max 5 MB)</span>
                  </label>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="reviewImage"
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <ImageIcon size={28} className="text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Click to upload a photo</span>
                    </label>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="reviewImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {submitError && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {isSubmitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReviewForm(false); setSubmitError(''); }}
                    className="border border-gray-300 text-gray-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mr-3" size={24} />
              Loading reviews…
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-center">
              {error}
              <button onClick={loadData} className="ml-3 underline text-sm">Retry</button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <p className="text-5xl mb-3">🌿</p>
                  <p className="text-gray-600 text-lg font-medium">No reviews yet</p>
                  <p className="text-gray-400 text-sm mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-bold text-lg shrink-0">
                          {review.author[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1B4332]">{review.author}</h3>
                          <p className="text-xs text-gray-400">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400 text-lg' : 'text-gray-200 text-lg'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-[#1B4332] mb-2">{review.title}</h4>
                    )}

                    <p className="text-gray-700 leading-relaxed mb-3">{review.text}</p>

                    {review.image_url && (
                      <div className="mb-3">
                        <img
                          src={review.image_url}
                          alt="Review photo"
                          className="max-w-[180px] w-auto h-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition"
                          onClick={() => setLightboxSrc(review.image_url!)}
                        />
                      </div>
                    )}

                    {review.verified && (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm mb-3">
                        <span>✓</span>
                        <span>Verified Guest</span>
                      </div>
                    )}

                    <ReviewReplies
                      review={review}
                      plantationId={id || ''}
                      hasCompletedBooking={hasCompletedBooking}
                      onReplyAdded={handleReplyAdded}
                      onReplyDeleted={handleReplyDeleted}
                      onReviewReacted={handleReviewReacted}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
