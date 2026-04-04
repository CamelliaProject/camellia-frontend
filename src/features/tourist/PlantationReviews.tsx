import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ReviewReplies from '../../components/reviews/ReviewReplies';
import type { Review, ReviewReply } from '../../services/reviewService';


const PLANTATION_DATA: Record<string, any> = {
  '1': {
    name: 'Pedro Tea Estate',
    address: 'Nuwara Eliya, Sri Lanka',
    rating: 4.8,
    reviews: 245,
    reviewsList: [
      {
        id: 1,
        author: 'Sarah Johnson',
        rating: 5,
        date: 'January 15, 2025',
        text: 'Absolutely fantastic experience! The staff was welcoming and knowledgeable. Our guide explained every detail of tea production beautifully. The views were breathtaking!',
        verified: true,
        authorUsername: 'sarahj',
        replies: [
          {
            id: 'reply_1_1',
            author: 'Pedro Estate Team',
            authorRole: 'plantationadmin' as const,
            authorPlantationId: '1',
            text: 'Thank you so much for the wonderful review, Sarah! We are delighted that you enjoyed your tea tasting experience. We look forward to welcoming you again!',
            date: 'January 16, 2025',
            verified: true,
            plantationId: '1',
          },
        ],
      },
      {
        id: 2,
        author: 'Michael Chen',
        rating: 5,
        date: 'January 10, 2025',
        text: 'Best plantation tour I\'ve done in Sri Lanka. The tea tasting was excellent and authentic. The team made us feel very welcome throughout the visit.',
        verified: true,
        authorUsername: 'michaelc',
        replies: [],
      },
      {
        id: 3,
        author: 'Emma Williams',
        rating: 4,
        date: 'January 5, 2025',
        text: 'Great experience overall. The factory tour was impressive. Only minor issue was the tour duration was shorter than expected, but still worth visiting!',
        verified: true,
        authorUsername: 'emmaw',
        replies: [
          {
            id: 'reply_3_1',
            author: 'Pedro Estate Team',
            authorRole: 'plantationadmin' as const,
            authorPlantationId: '1',
            text: 'We appreciate your feedback regarding the tour duration. We have taken this into account and adjusted our standard tour packages. Thank you for visiting!',
            date: 'January 6, 2025',
            verified: true,
            plantationId: '1',
          },
        ],
      },
      {
        id: 4,
        author: 'John Smith',
        rating: 5,
        date: 'December 28, 2024',
        text: 'Exceptional service and amazing hospitality. The tea tasting session was educational and delicious. Highly recommend!',
        verified: true,
        authorUsername: 'johnsmith',
        replies: [],
      },
      {
        id: 5,
        author: 'Maria Garcia',
        rating: 4,
        date: 'December 20, 2024',
        text: 'Beautiful plantation with knowledgeable guides. Food could have been better but overall very good experience.',
        verified: true,
        authorUsername: 'mariagarcia',
        replies: [],
      },
    ],
  },
  '2': {
    name: 'Bluefield Tea Garden',
    address: 'Ramboda, Sri Lanka',
    rating: 4.7,
    reviews: 198,
    reviewsList: [
      {
        id: 1,
        author: 'James Rodriguez',
        rating: 5,
        date: 'January 12, 2025',
        text: 'The waterfall trek was spectacular! The tea blending workshop was the highlight. Highly recommended for nature lovers.',
        verified: true,
        authorUsername: 'jamesrod',
        replies: [],
      },
      {
        id: 2,
        author: 'Lisa Anderson',
        rating: 4,
        date: 'January 8, 2025',
        text: 'Beautiful location with wonderful hospitality. The farm-fresh meals were delicious and authentic.',
        verified: true,
        authorUsername: 'lisaand',
        replies: [],
      },
    ],
  },
  '3': {
    name: 'Haputale Estate',
    address: 'Haputale, Sri Lanka',
    rating: 4.6,
    reviews: 176,
    reviewsList: [
      {
        id: 1,
        author: 'David Thompson',
        rating: 5,
        date: 'January 11, 2025',
        text: 'Absolutely breathtaking views from the estate. The heritage tour was very informative. A must-visit!',
        verified: true,
        authorUsername: 'davidthompson',
        replies: [],
      },
    ],
  },
  '4': {
    name: 'Uda Pussellawa',
    address: 'Kandy, Sri Lanka',
    rating: 4.5,
    reviews: 152,
    reviewsList: [
      {
        id: 1,
        author: 'Robert Davis',
        rating: 4,
        date: 'January 9, 2025',
        text: 'Great tea picking experience! The guides were very knowledgeable. Would recommend for anyone interested in authentic tea farming.',
        verified: true,
        authorUsername: 'robertdavis',
        replies: [],
      },
    ],
  },
  '5': {
    name: 'Dambulla Tea Valley',
    address: 'Dambulla, Sri Lanka',
    rating: 4.4,
    reviews: 128,
    reviewsList: [
      {
        id: 1,
        author: 'Patricia Miller',
        rating: 5,
        date: 'January 7, 2025',
        text: 'Cultural experience was amazing! The traditional tea-making demonstration was enlightening. Very authentic!',
        verified: true,
        authorUsername: 'patriciamiller',
        replies: [],
      },
    ],
  },
  '6': {
    name: 'Ella Ridge Plantation',
    address: 'Ella, Sri Lanka',
    rating: 4.9,
    reviews: 267,
    reviewsList: [
      {
        id: 1,
        author: 'Jennifer White',
        rating: 5,
        date: 'January 14, 2025',
        text: 'Outstanding views and exceptional service! The gourmet tea-paired meals were exquisite. Highly recommended!',
        verified: true,
        authorUsername: 'jenniferw',
        replies: [],
      },
      {
        id: 2,
        author: 'Christopher Brown',
        rating: 5,
        date: 'January 6, 2025',
        text: 'The tea spa was incredibly relaxing. The hikes offer some of the best views in Sri Lanka. Worth every penny!',
        verified: true,
        authorUsername: 'chrisbrown',
        replies: [],
      },
    ],
  },
};

export default function PlantationReviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plantation = id ? PLANTATION_DATA[id] : null;
  const [reviewsList, setReviewsList] = useState<Review[]>(
    plantation?.reviewsList || []
  );

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

  if (!plantation) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1B4332]">
        <Navbar />
        <main className="py-16 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Plantation not found</h1>
          <button
            onClick={() => navigate('/plantations')}
            className="bg-[#2D6A4F] text-white px-6 py-3 rounded-lg hover:bg-[#1B4332] transition"
          >
            Back to Plantations
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="py-16 px-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/plantation/${id}`)}
            className="flex items-center gap-2 text-[#2D6A4F] hover:text-[#1B4332] font-semibold mb-8"
          >
            <ArrowLeft size={20} />
            Back to Plantation
          </button>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-serif mb-4">{plantation.name}</h1>
            <div className="flex items-center gap-2 text-lg text-gray-600 mb-6">
              <MapPin size={24} />
              <span>{plantation.address}</span>
            </div>

            {/* Rating Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(plantation.rating) ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}>
                      ★
                    </span>
                  ))}
                </div>
                <div>
                  <span className="text-2xl font-bold">{plantation.rating}</span>
                  <span className="text-gray-600 ml-2">({plantation.reviews} reviews)</span>
                </div>
              </div>
              <p className="text-gray-700">Based on verified guest reviews</p>
            </div>
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
              onClick={() => navigate(`/plantation/${id}`)}
              className="text-[#2D6A4F] hover:text-[#1B4332] font-semibold text-lg underline"
            >
              ← Back to {plantation.name}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
