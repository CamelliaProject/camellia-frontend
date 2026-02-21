// Type definitions for reviews and replies
export interface ReviewReply {
  id: string;
  author: string;
  authorRole: 'plantationadmin' | 'tourist';
  authorPlantationId?: string;
  text: string;
  date: string;
  verified: boolean;
  plantationId: string; // For permission checks
}

export interface Review {
  id: string | number;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  replies?: ReviewReply[];
  authorUsername?: string; // To track who wrote the review
}

export interface PlantationReviewData {
  [key: string]: {
    name: string;
    address: string;
    rating: number;
    reviews: number;
    reviewsList: Review[];
  };
}

// Review service class for managing reviews and replies
export class ReviewService {
  /**
   * Check if a user can reply to a review
   * @param userRole - The role of the current user
   * @param userPlantationId - The plantation ID of the current user (if plantation admin)
   * @param reviewPlantationId - The plantation ID where the review was made
   * @param targetReviewId - The ID of the review being replied to
   * @returns boolean - Whether the user can reply
   */
  static canUserReply(
    userRole: 'superadmin' | 'plantationadmin' | 'tourist' | null,
    userPlantationId: string | undefined,
    reviewPlantationId: string
  ): boolean {
    if (!userRole) return false;

    // Superadmin can always reply
    if (userRole === 'superadmin') return true;

    // Plantation admin can reply if they manage this plantation
    if (userRole === 'plantationadmin') {
      return userPlantationId === reviewPlantationId;
    }

    // Tourist can reply if they are verified
    // In a real app, you'd check against a verified bookings list
    if (userRole === 'tourist') return true;

    return false;
  }

  /**
   * Check if a user can delete a reply
   */
  static canUserDeleteReply(
    userRole: 'superadmin' | 'plantationadmin' | 'tourist' | null,
    userPlantationId: string | undefined,
    replyAuthor: string,
    currentUsername: string | undefined,
    isReplyAuthorAdmin: boolean,
    adminPlantationId?: string
  ): boolean {
    if (!userRole || !currentUsername) return false;

    // Superadmin can delete any reply
    if (userRole === 'superadmin') return true;

    // The author can delete their own reply
    if (replyAuthor === currentUsername) return true;

    // Plantation admin can delete replies on their own plantation
    // (including admin replies)
    if (userRole === 'plantationadmin' && isReplyAuthorAdmin) {
      return userPlantationId === adminPlantationId;
    }

    return false;
  }

  /**
   * Add a reply to a review
   */
  static addReplyToReview(
    reviews: Review[],
    reviewId: string | number,
    newReply: ReviewReply
  ): Review[] {
    return reviews.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          replies: [...(review.replies || []), newReply],
        };
      }
      return review;
    });
  }

  /**
   * Delete a reply from a review
   */
  static deleteReplyFromReview(
    reviews: Review[],
    reviewId: string | number,
    replyId: string
  ): Review[] {
    return reviews.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          replies: (review.replies || []).filter((reply) => reply.id !== replyId),
        };
      }
      return review;
    });
  }

  /**
   * Generate a unique ID for a reply
   */
  static generateReplyId(): string {
    return `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get formatted date string
   */
  static getFormattedDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return now.toLocaleDateString('en-US', options);
  }
}
