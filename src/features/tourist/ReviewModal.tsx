import { useState } from 'react';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { reviewApi } from '../../services/api';

interface ReviewableBooking {
  bookingId: string;
  plantationId: string;
  plantationName: string;
  date: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  reviewableBookings: ReviewableBooking[];
  initialSelectedBookingId?: string;
}

function fmtDate(raw: string) {
  if (!raw) return '';
  try {
    const [y, mo, d] = raw.slice(0, 10).split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return raw; }
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  reviewableBookings,
  initialSelectedBookingId = '',
}: ReviewModalProps) {
  const [selectedBookingId, setSelectedBookingId] = useState(initialSelectedBookingId);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedBooking = reviewableBookings.find((b) => b.bookingId === selectedBookingId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || rating === 0 || !reviewText.trim()) {
      setSubmitError('Please select a visit, provide a rating, and write your experience.');
      return;
    }
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
        booking_id: selectedBookingId,
        rating,
        content: reviewText.trim(),
        image_url: imageUrl,
      });

      onSubmit();
      onClose();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">Write a Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Visit Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Visit <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
              required
              disabled={!!initialSelectedBookingId}
            >
              <option value="" disabled>Choose a visit to review</option>
              {reviewableBookings.map((b) => (
                <option key={b.bookingId} value={b.bookingId}>
                  {b.plantationName} — {fmtDate(b.date)}
                </option>
              ))}
            </select>
            {selectedBooking && (
              <p className="text-xs text-gray-400 mt-1">{selectedBooking.plantationName}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className={`text-4xl transition-colors ${
                    star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Experience <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share what you loved about the visit…"
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none text-sm"
              required
            />
            <p className="text-xs text-gray-400 text-right mt-1">{reviewText.length}/2000</p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Photo <span className="text-gray-400 font-normal">(optional, max 5 MB)</span>
            </label>
            <label
              htmlFor="reviewModalImage"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">Click to upload</span>
                </>
              )}
            </label>
            <input
              type="file"
              id="reviewModalImage"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imageFile && (
              <p className="text-xs text-gray-400 mt-1 truncate">{imageFile.name}</p>
            )}
          </div>

          {/* Error */}
          {submitError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {submitError}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs">
            Reviews cannot be edited or deleted once submitted. Please review your feedback carefully.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
