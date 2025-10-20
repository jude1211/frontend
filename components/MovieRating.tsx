import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface MovieRatingProps {
  movieId: string;
  showUserRating?: boolean;
  className?: string;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: {
    rating: number;
    review?: string;
    createdAt: string;
  };
}

const MovieRating: React.FC<MovieRatingProps> = ({ 
  movieId, 
  showUserRating = false, 
  className = '' 
}) => {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatingData();
  }, [movieId]);

  const fetchRatingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getMovieRating(movieId);
      
      if (response.success) {
        setRatingData(response.data);
      } else {
        setError(response.error || 'Failed to fetch rating');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rating');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !ratingData) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <i className="fas fa-star text-gray-400"></i>
        <span className="text-gray-400 text-sm">0/10</span>
      </div>
    );
  }

  const { averageRating, totalRatings, userRating } = ratingData;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <i className="fas fa-star text-yellow-400"></i>
      <span className="text-white font-medium">
        {averageRating > 0 ? `${averageRating}/10` : '0/10'}
      </span>
      {totalRatings > 0 && (
        <span className="text-gray-400 text-xs">
          ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </span>
      )}
      {showUserRating && userRating && (
        <span className="text-blue-400 text-xs">
          (Your rating: {userRating.rating}/10)
        </span>
      )}
    </div>
  );
};

export default MovieRating;
