import { useState } from 'react';
import { Trash2, Loader2, ThumbsUp, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Review, ReviewReply } from '../../services/reviewService';
import { ReviewService, mapReply } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import SignInModal from '../../components/layout/SignInModal';
import { reviewApi } from '../../services/api';

// LocalStorage key for tracking which items this device has already reacted to
const REACTIONS_KEY = 'camellia_reactions';

function getReacted(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(REACTIONS_KEY) || '{}'); }
  catch { return {}; }
}
function markReacted(key: string) {
  const r = getReacted();
  r[key] = true;
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(r));
}

// ── Reaction button shared by reviews and replies ─────────────────────────
interface ThumbsProps {
  count: number;
  reactionKey: string;
  onReact: () => Promise<void>;
}
function ThumbsButton({ count, reactionKey, onReact }: ThumbsProps) {
  const reacted = getReacted()[reactionKey] ?? false;
  const [localCount, setLocalCount] = useState(count);
  const [hasReacted, setHasReacted] = useState(reacted);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (hasReacted || loading) return;
    setLoading(true);
    try {
      await onReact();
      markReacted(reactionKey);
      setHasReacted(true);
      setLocalCount((c) => c + 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={hasReacted || loading}
      title={hasReacted ? 'You already reacted' : 'Helpful'}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition
        ${hasReacted
          ? 'border-[#2D6A4F] bg-[#F0FAF4] text-[#2D6A4F] cursor-default'
          : 'border-gray-200 text-gray-400 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-[#F0FAF4]'
        }`}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <ThumbsUp size={11} />}
      <span>{localCount}</span>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface ReviewRepliesProps {
  review: Review;
  plantationId: string;
  hasCompletedBooking?: boolean;
  onReplyAdded: (reviewId: string, reply: ReviewReply) => void;
  onReplyDeleted: (reviewId: string, replyId: string) => void;
  onReviewReacted: (reviewId: string, newCount: number) => void;
}

export default function ReviewReplies({
  review,
  plantationId,
  hasCompletedBooking = false,
  onReplyAdded,
  onReplyDeleted,
  onReviewReacted,
}: ReviewRepliesProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const canUserReply = user
    ? ReviewService.canUserReply(user.role, user.plantationId, plantationId, hasCompletedBooking)
    : false;

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !canUserReply) return;
    setIsSubmitting(true);
    try {
      const res = await reviewApi.addReply(review.id as string, replyText.trim());
      const newReply = mapReply(res.data.data, plantationId);
      onReplyAdded(review.id as string, newReply);
      setReplyText('');
      setShowReplyForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (reply: ReviewReply) => {
    if (!user) return;
    const canDelete = ReviewService.canUserDeleteReply(user.role, user.id, reply.author_id, user.username, reply.author);
    if (!canDelete) { alert('You do not have permission to delete this reply.'); return; }
    if (!window.confirm('Delete this reply?')) return;
    setDeletingId(reply.id);
    try {
      await reviewApi.deleteReply(review.id as string, reply.id);
      onReplyDeleted(review.id as string, reply.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete reply.');
    } finally {
      setDeletingId(null);
    }
  };

  const hasReplies = (review.replies?.length ?? 0) > 0;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* ── Review action bar ── */}
      <div className="flex items-center gap-3 mb-3">
        {/* 👍 on the review */}
        <ThumbsButton
          count={review.helpful_count}
          reactionKey={`review:${review.id}`}
          onReact={async () => {
            const res = await reviewApi.reactToReview(review.id as string);
            onReviewReacted(review.id as string, res.data.data.helpful_count);
          }}
        />

        {/* Reply trigger */}
        {canUserReply ? (
          <button
            onClick={() => setShowReplyForm((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#2D6A4F] font-semibold transition px-2 py-1 rounded-full border border-gray-200 hover:border-[#2D6A4F]"
          >
            <Send size={11} />
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        ) : !user ? (
          <button
            onClick={() => setIsSignInOpen(true)}
            className="text-xs text-gray-400 hover:text-[#2D6A4F] transition"
          >
            Sign in to reply
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">
            Visited guests &amp; admins can reply
          </span>
        )}
      </div>

      {/* ── Reply composer ── */}
      {showReplyForm && canUserReply && (
        <form onSubmit={handleAddReply} className="mb-4 ml-2">
          <div className="flex gap-2 items-start bg-gray-50 border border-gray-200 rounded-xl p-3">
            <textarea
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              maxLength={500}
              rows={2}
              required
              disabled={isSubmitting}
              className="flex-1 bg-transparent resize-none text-sm focus:outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="shrink-0 bg-[#2D6A4F] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#1B4332] disabled:opacity-40 transition flex items-center gap-1"
            >
              {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {isSubmitting ? '…' : 'Post'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-3">{replyText.length}/500</p>
        </form>
      )}

      {/* ── Existing replies ── */}
      {hasReplies && (
        <div className="space-y-2 ml-2">
          {review.replies!.map((reply) => {
            const canDelete = user && ReviewService.canUserDeleteReply(user.role, user.id, reply.author_id, user.username, reply.author);
            return (
              <div key={reply.id} className="bg-gray-50 rounded-xl px-4 py-3 border-l-4 border-[#2D6A4F]">
                {/* Reply header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-xs">{reply.author}</span>
                    {reply.authorRole === 'plantationadmin' && (
                      <span className="bg-[#2D6A4F] text-white text-[10px] px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                    <span className="text-[10px] text-gray-400">{reply.date}</span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteReply(reply)}
                      disabled={deletingId === reply.id}
                      className="text-gray-300 hover:text-red-400 transition ml-1"
                      title="Delete"
                    >
                      {deletingId === reply.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  )}
                </div>

                {/* Reply text */}
                <p className="text-sm text-gray-700 mb-2">{reply.text}</p>

                {/* 👍 on reply */}
                <ThumbsButton
                  count={reply.helpful_count}
                  reactionKey={`reply:${reply.id}`}
                  onReact={() => reviewApi.reactToReply(review.id as string, reply.id).then(() => {})}
                />
              </div>
            );
          })}
        </div>
      )}

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} redirectPath={location.pathname} />
    </div>
  );
}
