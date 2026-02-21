import { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Review, ReviewReply } from '../../services/reviewService';
import { ReviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

interface ReviewRepliesProps {
  review: Review;
  plantationId: string;
  onReplyAdded: (reviewId: string | number, reply: ReviewReply) => void;
  onReplyDeleted: (reviewId: string | number, replyId: string) => void;
}

export default function ReviewReplies({
  review,
  plantationId,
  onReplyAdded,
  onReplyDeleted,
}: ReviewRepliesProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !replyText.trim()) {
      alert('Please sign in and enter your reply.');
      return;
    }

    // Check if user can reply
    const canReply = ReviewService.canUserReply(
      user.role,
      user.plantationId,
      plantationId
    );

    if (!canReply) {
      alert('You do not have permission to reply to this review.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the reply object
      const newReply: ReviewReply = {
        id: ReviewService.generateReplyId(),
        author: user.username,
        authorRole: user.role === 'plantationadmin' ? 'plantationadmin' : 'tourist',
        authorPlantationId: user.plantationId,
        text: replyText,
        date: ReviewService.getFormattedDate(),
        verified: true,
        plantationId: plantationId,
      };

      // Call the callback to add the reply
      onReplyAdded(review.id, newReply);

      // Reset form
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    if (!user) return;

    const reply = review.replies?.find((r) => r.id === replyId);
    if (!reply) return;

    const canDelete = ReviewService.canUserDeleteReply(
      user.role,
      user.plantationId,
      reply.author,
      user.username,
      reply.authorRole === 'plantationadmin',
      reply.authorPlantationId
    );

    if (!canDelete) {
      alert('You do not have permission to delete this reply.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this reply?')) {
      onReplyDeleted(review.id, replyId);
    }
  };

  const hasReplies = review.replies && review.replies.length > 0;
  const canUserReply = user && ReviewService.canUserReply(user.role, user.plantationId, plantationId);

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {/* Replies List */}
      {hasReplies && review.replies && (
        <div className="space-y-3 mb-4">
          {review.replies.map((reply) => (
            <div key={reply.id} className="ml-4 bg-gray-50 p-4 rounded-lg border-l-4 border-[#2D6A4F]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">{reply.author}</h4>
                  {reply.authorRole === 'plantationadmin' && (
                    <span className="bg-[#2D6A4F] text-white text-xs px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  {reply.verified && (
                    <span className="text-green-600 text-xs">
                      ✓ Verified
                    </span>
                  )}
                </div>
                {user && ReviewService.canUserDeleteReply(
                  user.role,
                  user.plantationId,
                  reply.author,
                  user.username,
                  reply.authorRole === 'plantationadmin',
                  reply.authorPlantationId
                ) && (
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Delete reply"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{reply.date}</p>
              <p className="text-gray-700">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form or Button */}
      {!showReplyForm ? (
        <button
          onClick={() => {
            if (!user) {
              alert('Please sign in to reply.');
              return;
            }
            if (!canUserReply) {
              alert('Only verified guests and plantation admins can reply.');
              return;
            }
            setShowReplyForm(true);
          }}
          className="flex items-center gap-2 text-[#2D6A4F] hover:text-[#1B4332] font-semibold text-sm transition"
        >
          <MessageCircle size={16} />
          Reply
        </button>
      ) : (
        <form onSubmit={handleAddReply} className="ml-4 bg-gray-50 p-4 rounded-lg">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
            rows={3}
            required
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg hover:bg-[#1B4332] disabled:bg-gray-400 transition text-sm font-semibold"
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
              disabled={isSubmitting}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{replyText.length}/500</p>
        </form>
      )}
    </div>
  );
}
