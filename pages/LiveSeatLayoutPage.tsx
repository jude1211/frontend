import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import SeatLayoutBuilder, { SeatLayoutConfig } from '../components/SeatLayoutBuilder';
import BookNViewLoader from '../components/BookNViewLoader';

interface Movie {
  _id: string;
  title: string;
  posterUrl: string;
  genre: string;
  language: string;
  duration: string;
  status: string;
}

interface Screen {
  screenId: string;
  screenName?: string;
  screenType?: string;
  showGroups: ShowGroup[];
}

interface ShowGroup {
  bookingDate: string;
  showtimes: string[];
  theatre?: string;
  theatreId?: string;
  availableSeats?: number;
}

const LiveSeatLayoutPage: React.FC = () => {
  const { movieId, screenId, bookingDate, showtime } = useParams<{
    movieId: string;
    screenId: string;
    bookingDate: string;
    showtime: string;
  }>();
  
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [seatLayout, setSeatLayout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) return;
      
      try {
        setIsLoading(true);
        const response = await apiService.getMovie(movieId);
        if (response.success && response.data) {
          setMovie({
            _id: response.data._id,
            title: response.data.title,
            posterUrl: response.data.posterUrl,
            genre: Array.isArray(response.data.genre) ? response.data.genre.join('/') : (response.data.genre || ''),
            language: response.data.movieLanguage || 'English',
            duration: response.data.duration,
            status: response.data.status
          });
        } else {
          setError('Movie not found');
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Failed to fetch movie details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  // Fetch screen details and showtimes
  useEffect(() => {
    const fetchScreenDetails = async () => {
      if (!movieId) return;
      
      try {
        const response = await apiService.getMovieShowtimes(movieId);
        if (response.success && Array.isArray(response.data)) {
          const foundScreen = response.data.find((s: any) => s.screenId === screenId);
          if (foundScreen) {
            setScreen(foundScreen);
          } else {
            setError('Screen not found');
          }
        } else {
          setError('Failed to fetch screen details');
        }
      } catch (err) {
        console.error('Error fetching screen details:', err);
        setError('Failed to fetch screen details');
      }
    };

    fetchScreenDetails();
  }, [movieId, screenId]);

  // Fetch seat layout
  useEffect(() => {
    const fetchSeatLayout = async () => {
      if (!screenId) return;

      try {
        setIsLoadingLayout(true);
        const response = await apiService.getPublicScreenLayout(screenId);
        if (response.success && response.data) {
          setSeatLayout(response.data);
          console.log('Fetched seat layout for screen:', screenId, response.data);
        } else {
          setError('Seat layout not available');
        }
      } catch (err) {
        console.error('Error fetching seat layout:', err);
        setError('Failed to fetch seat layout');
      } finally {
        setIsLoadingLayout(false);
      }
    };

    fetchSeatLayout();
  }, [screenId]);

  // Convert seat layout data to SeatLayoutBuilder format
  const seatLayoutConfig: SeatLayoutConfig | null = useMemo(() => {
    if (!seatLayout) return null;

    return {
      numRows: seatLayout.meta?.rows || 8,
      numCols: seatLayout.meta?.columns || 12,
      aisleColumns: seatLayout.meta?.aisles || [5, 9],
      seatClassRules: (seatLayout.seatClasses || []).map((seatClass: any) => ({
        rows: seatClass.rows || 'A-C',
        className: seatClass.className || 'Gold',
        price: seatClass.price || 250,
        tier: seatClass.tier || 'Premium',
        color: seatClass.color || '#f59e0b'
      }))
    };
  }, [seatLayout]);

  // Get available seats count
  const availableSeats = useMemo(() => {
    if (!seatLayout?.seats) return 0;
    return Object.values(seatLayout.seats).filter((seat: any) => 
      seat.isActive !== false && seat.status === 'available'
    ).length;
  }, [seatLayout]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <BookNViewLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => navigate(`/movie/${movieId}`)} 
            className="bg-brand-red text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Movie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/movie/${movieId}`)}
            className="flex items-center text-brand-light-gray hover:text-white transition-colors"
          >
            <i className="fa fa-arrow-left mr-2"></i>
            Back to Movie
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">Live Seat Layout</h1>
            <p className="text-brand-light-gray text-sm">
              {screen?.screenName || `Screen ${screenId}`} • {bookingDate} • {showtime}
            </p>
          </div>
        </div>

        {/* Movie Info */}
        {movie && (
          <div className="bg-gradient-to-r from-brand-gray to-brand-dark rounded-2xl p-6 border border-brand-dark/40 shadow-2xl mb-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <img
                  src={movie.posterUrl || '/placeholder-movie.jpg'}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                  }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-brand-light-gray mb-3">
                  <span>🎭 {movie.genre}</span>
                  <span>🌍 {movie.language}</span>
                  <span>⏱️ {movie.duration}</span>
                </div>
                <div className="text-brand-light-gray">
                  <span className="text-green-400">●</span> {availableSeats} Seats Available
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Seat Layout */}
        <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40 shadow-2xl">
          <div className="text-center mb-6">
            <p className="text-brand-light-gray">
              {showtime} • {bookingDate} • {screen?.screenName || `Screen ${screenId}`}
            </p>
          </div>

          {isLoadingLayout ? (
            <div className="flex justify-center py-12">
              <BookNViewLoader />
            </div>
          ) : seatLayoutConfig ? (
            <div className="w-full">
              <div className="flex justify-center">
                <div className="bg-white/5 rounded-xl p-8 border border-brand-dark/30 w-full max-w-6xl">
                  <SeatLayoutBuilder
                    config={seatLayoutConfig}
                    editMode={false}
                    processedSeats={new Map(Object.entries(seatLayout.seats || {}))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-brand-light-gray text-lg">
                No seat layout available for this screen
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => navigate(`/select-seats/${movieId}/${screenId}/${bookingDate}/${encodeURIComponent(showtime || '')}`)}
              className="bg-brand-red text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 font-medium"
            >
              🎫 Book Tickets
            </button>
            <button
              onClick={() => navigate(`/movie/${movieId}`)}
              className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
            >
              ← Back to Movie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSeatLayoutPage;
