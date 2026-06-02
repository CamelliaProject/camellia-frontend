export interface ReviewReply {
  id: string;
  review_id?: string;
  author: string;       // maps from author_name
  author_name?: string;
  authorRole: 'plantationadmin' | 'tourist' | 'superadmin';
  author_role?: string;
  author_id?: string;
  authorPlantationId?: string;
  text: string;         // maps from content
  content?: string;
  date: string;         // maps from created_at
  created_at?: string;
  verified: boolean;
  plantationId: string;
  helpful_count: number;
}

export interface Review {
  id: string;
  plantation_id?: string;
  tourist_id?: string;
  author: string;           // maps from tourist_username
  tourist_username?: string;
  rating: number;
  date: string;             // maps from created_at
  created_at?: string;
  title?: string;
  text: string;             // maps from content
  content?: string;
  image_url?: string;
  verified: boolean;
  is_verified?: boolean;
  helpful_count: number;
  replies?: ReviewReply[];
  authorUsername?: string;
}

export interface MyReviewData {
  reviews: Array<Review & { plantation_name: string; plantation_image?: string }>;
  myReplies: Array<{
    id: string;
    review_id: string;
    content: string;
    created_at: string;
    author_role: string;
    review_content: string;
    review_rating: number;
    plantation_name: string;
    plantation_id: string;
  }>;
}

// Map raw DB review row to display Review shape
export function mapReview(raw: any, plantationId: string): Review {
  return {
    ...raw,
    id: raw.id,
    plantation_id: raw.plantation_id ?? plantationId,
    tourist_id: raw.tourist_id,
    author: raw.tourist_username || raw.tourist_email?.split('@')[0] || 'Visitor',
    rating: raw.rating,
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    title: raw.title,
    text: raw.content,
    image_url: raw.image_url,
    verified: raw.is_verified ?? false,
    helpful_count: raw.helpful_count ?? 0,
    replies: (raw.replies || []).map((r: any) => mapReply(r, plantationId)),
  };
}

// Map raw DB reply row to display ReviewReply shape
export function mapReply(raw: any, plantationId: string): ReviewReply {
  return {
    id: raw.id,
    review_id: raw.review_id,
    author: raw.author_name || 'User',
    author_name: raw.author_name,
    authorRole: (raw.author_role || 'tourist') as ReviewReply['authorRole'],
    author_role: raw.author_role,
    author_id: raw.author_id,
    text: raw.content,
    content: raw.content,
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    created_at: raw.created_at,
    verified: raw.is_verified ?? false,
    helpful_count: raw.helpful_count ?? 0,
    plantationId,
  };
}

export class ReviewService {
  static canUserReply(
    userRole: 'superadmin' | 'plantationadmin' | 'tourist' | null,
    userPlantationId: string | undefined,
    reviewPlantationId: string,
    hasCompletedBooking = false
  ): boolean {
    if (!userRole) return false;
    if (userRole === 'superadmin') return true;
    if (userRole === 'plantationadmin') return userPlantationId === reviewPlantationId;
    if (userRole === 'tourist') return hasCompletedBooking;
    return false;
  }

  static canUserDeleteReply(
    userRole: 'superadmin' | 'plantationadmin' | 'tourist' | null,
    currentUserId: string | undefined,
    replyAuthorId: string | undefined,
    currentUsername: string | undefined,
    replyAuthorName: string
  ): boolean {
    if (!userRole) return false;
    if (userRole === 'superadmin') return true;
    if (currentUserId && replyAuthorId && currentUserId === replyAuthorId) return true;
    if (currentUsername && replyAuthorName === currentUsername) return true;
    return false;
  }

  static getFormattedDate(): string {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
