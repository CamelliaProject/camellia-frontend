import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ReviewReplies from '../../components/reviews/ReviewReplies';
import type { Review, ReviewReply } from '../../services/reviewService';


export default function PlantationReviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const plantationRoute = id ? `/plantation/${id}` : '/plantations';

  const handleReplyAdded = (reviewId: string | number, reply: ReviewReply) => {
    setReviewsList((reviews) =>
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: [...(review.replies || []), reply],
          };
        }
        return review;
      })
    );
  };

  const handleReplyDeleted = (reviewId: string | number, replyId: string) => {
    setReviewsList((reviews) =>
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: (review.replies || []).filter((r) => r.id !== replyId),
          };
        }
        return review;
      })
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="py-16 px-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(plantationRoute)}
            className="flex items-center gap-2 text-[#2D6A4F] hover:text-[#1B4332] font-semibold mb-8"
          >
            <ArrowLeft size={20} />
            Back to Plantations
          </button>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-serif mb-4">Plantation Reviews</h1>
            <p className="text-gray-600 text-lg">View reviews once they are available for this plantation.</p>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviewsList.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{review.author}</h3>
                    <p className="text-sm text-gray-500">{review.date}</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{review.text}</p>

                {review.verified && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                    <span>✓</span>
                    <span>Verified Guest</span>
                  </div>
                )}

                {/* Replies Section */}
                <ReviewReplies
                  review={review}
                  plantationId={id || ''}
                  onReplyAdded={handleReplyAdded}
                  onReplyDeleted={handleReplyDeleted}
                />
              </div>
            ))}
          </div>

          {/* No More Reviews Message */}
          {reviewsList.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No reviews yet</p>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-16">
            <button
              onClick={() => navigate(plantationRoute)}
              className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold text-lg underline"
            >
              ← Back to Plantations
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
