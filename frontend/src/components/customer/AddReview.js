import React, { useState } from 'react';
import { 
  StarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AddReview = ({ requestId, mechanicId, mechanicName, onClose, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const reviewCategories = [
    { id: 'professionalism', label: 'Professionalism', icon: '👔' },
    { id: 'punctuality', label: 'Punctuality', icon: '⏰' },
    { id: 'quality', label: 'Service Quality', icon: '🔧' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'pricing', label: 'Fair Pricing', icon: '💰' },
    { id: 'cleanliness', label: 'Cleanliness', icon: '🧹' }
  ];

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        requestId,
        mechanicId,
        customerId: user.id,
        rating,
        comment: comment.trim(),
        categories: selectedCategories,
        timestamp: new Date().toISOString()
      };

      // This would be replaced with actual API call
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Review submitted successfully!');
        onReviewSubmitted && onReviewSubmitted(data.review);
        onClose();
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => handleRatingChange(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none"
        >
          <StarIcon
            className={`h-8 w-8 transition-colors ${
              isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-gray-600">Help other customers by sharing your experience</p>
            </div>
            <Button
              variant="secondary"
              onClick={onClose}
              icon={<XMarkIcon className="h-4 w-4" />}
            >
              Close
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mechanic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mechanic:</span>
                  <span className="ml-2 font-medium text-gray-900">{mechanicName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Request ID:</span>
                  <span className="ml-2 font-medium text-gray-900">#{requestId?.slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  {renderStars()}
                </div>
                {rating > 0 && (
                  <span className="text-sm font-medium text-gray-900">
                    {rating}/5 - {ratingLabels[rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What went well? (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {reviewCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedCategories.includes(category.id)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this mechanic. What did you like or dislike? Any suggestions for improvement?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                maxLength={500}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Be specific and helpful to other customers
                </p>
                <span className="text-xs text-gray-500">
                  {comment.length}/500
                </span>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Review Guidelines</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Be honest and constructive in your feedback</li>
                    <li>• Focus on the service quality and experience</li>
                    <li>• Avoid personal attacks or inappropriate language</li>
                    <li>• Your review helps other customers make informed decisions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                icon={!submitting && <CheckIcon className="h-4 w-4" />}
              >
                Submit Review
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddReview;
