import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, Send } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface Review {
  id: string;
  site_id: string;
  user_id: string;
  rating: number;
  comment: string;
  images: string[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  is_anonymous: boolean;
}

interface LocationReviewsProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
}

export const LocationReviews: React.FC<LocationReviewsProps> = ({ 
  siteId, 
  isOpen, 
  onClose,
  locationName 
}) => {
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (isOpen && siteId) {
      fetchReviews();
    }
  }, [isOpen, siteId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const url = user?.id 
        ? `${API_BASE_URL}/api/reviews/${siteId}?user_id=${user.id}`
        : `${API_BASE_URL}/api/reviews/${siteId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setUserHasReviewed(data.user_has_reviewed || false);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user?.id) {
      alert('Vui lòng đăng nhập để viết đánh giá');
      return;
    }

    if (!comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          user_id: user.id,
          rating,
          comment: comment.trim(),
          images: [],
          is_anonymous: isAnonymous,
          user_name: user.fullName || user.firstName || 'Người dùng',
          user_email: user.primaryEmailAddress?.emailAddress || ''
        }),
      });

      if (response.ok) {
        alert('Đánh giá của bạn đã được gửi thành công!');
        setComment('');
        setRating(5);
        setIsAnonymous(false);
        setShowReviewForm(false);
        fetchReviews();
      } else {
        const error = await response.json();
        alert(error.detail || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={28} />
            <h2 className="text-2xl font-bold">Đánh giá</h2>
          </div>
          <p className="text-indigo-100">{locationName}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Write Review Button */}
          {!userHasReviewed && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Viết đánh giá của bạn
            </button>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-indigo-200">
              <h3 className="font-bold text-gray-900 mb-4">Đánh giá của bạn</h3>
              
              {/* Rating Stars */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đánh giá sao:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét (Chất lượng quán, WiFi, thái độ nhân viên...):
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !comment.trim()}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setComment('');
                    setRating(5);
                    setIsAnonymous(false);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Hủy
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3 italic bg-blue-50 border border-blue-200 rounded-lg p-3">
                ℹ️ <strong>Lưu ý:</strong> Tên và email của bạn sẽ được hiển thị cùng đánh giá.<br/>
                💎 Nâng cấp lên Premium để có thể đánh giá ẩn danh.
              </p>
            </div>
          )}

          {/* Reviews List */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Đánh giá từ cộng đồng ({reviews.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải đánh giá...
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors"
                  >
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* User Info */}
                    {!review.is_anonymous && (review.user_name || review.user_email) && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-indigo-600">
                          {review.user_name || 'Người dùng'}
                        </p>
                        {review.user_email && (
                          <p className="text-xs text-gray-500">{review.user_email}</p>
                        )}
                      </div>
                    )}
                    {review.is_anonymous && (
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-500 italic">
                          Người dùng ẩn danh
                        </p>
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Chưa có đánh giá nào cho địa điểm này</p>
                <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
