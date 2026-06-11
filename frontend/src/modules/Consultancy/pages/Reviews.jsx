import React, { useEffect, useState } from 'react';
import { RefreshCw, Star, AlertCircle } from 'lucide-react';
import { reviewsApi } from '../../../api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { reviews: data } = await reviewsApi.list();
      setReviews(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customer Reviews</h1>
        <button
          onClick={fetchReviews}
          className="flex items-center text-sm text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          No reviews found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{review.customerName}</h3>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" /> {review.rating}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mt-2 flex-grow">
                {review.comment ? `"${review.comment}"` : <span className="italic text-gray-400">No comment provided</span>}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400 font-mono">
                Booking: {review.bookingId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
