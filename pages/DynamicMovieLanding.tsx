import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import SeatLayoutBuilder, { SeatLayoutConfig } from '../components/SeatLayoutBuilder';
import BookNViewLoader from '../components/BookNViewLoader';
import { filterValidScreens, getShowtimeStatus } from '../utils/showtimeValidation';

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

interface MovieBundle {
  movie: Movie;
  screens: Screen[];
}

interface SelectedShow {
  movieId: string;
  screenId: string;
  date: string;
  showtime: string;
  theatreId?: string;
}

const DynamicMovieLanding: React.FC = () => {
  const [movieBundles, setMovieBundles] = useState<MovieBundle[]>([]);
  const [selectedShow, setSelectedShow] = useState<SelectedShow | null>(null);
  const [seatLayout, setSeatLayout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch all movies with their assigned screens and showtimes
  useEffect(() => {
    const fetchMoviesWithShows = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiService.getActiveMoviesWithShows();
        if (response.success && Array.isArray(response.data)) {
          // Filter out past showtimes for each movie bundle
          const filteredBundles = response.data.map(bundle => ({
            ...bundle,
            screens: filterValidScreens(bundle.screens)
          })).filter(bundle => bundle.screens.length > 0);
          
          setMovieBundles(filteredBundles);
          console.log('Fetched movie bundles:', filteredBundles);
        } else {
          setError('Failed to fetch movies');
          setMovieBundles([]);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to fetch movies');
        setMovieBundles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesWithShows();
  }, []);

  // Fetch seat layout when a show is selected
  useEffect(() => {
    const fetchSeatLayout = async () => {
      if (!selectedShow?.screenId) {
        setSeatLayout(null);
        return;
      }

      try {
        setIsLoadingLayout(true);
        const response = await apiService.getPublicScreenLayout(selectedShow.screenId);
        if (response.success && response.data) {
          setSeatLayout(response.data);
          console.log('Fetched seat layout for screen:', selectedShow.screenId, response.data);
        } else {
          setSeatLayout(null);
        }
      } catch (err) {
        console.error('Error fetching seat layout:', err);
        setSeatLayout(null);
      } finally {
        setIsLoadingLayout(false);
      }
    };

    fetchSeatLayout();
  }, [selectedShow?.screenId]);

  // Handle showtime selection
  const handleShowtimeClick = (movieId: string, screenId: string, date: string, showtime: string, theatreId?: string) => {
    setSelectedShow({
      movieId,
      screenId,
      date,
      showtime,
      theatreId
    });
  };

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

  // Get today's date in ISO format
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Get available dates for a movie (filter out past dates)
  const getAvailableDates = (screens: Screen[]) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dates = new Set<string>();
    screens.forEach(screen => {
      screen.showGroups.forEach(group => {
        // Only include future dates
        if (group.bookingDate >= today) {
          dates.add(group.bookingDate);
        }
      });
    });
    return Array.from(dates).sort();
  };

  // Get screens for a specific date
  const getScreensForDate = (screens: Screen[], date: string) => {
    return screens.filter(screen => 
      screen.showGroups.some(group => group.bookingDate === date)
    );
  };

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
            onClick={() => window.location.reload()} 
            className="bg-brand-red text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎬 Live Movie Experience
          </h1>
          <p className="text-brand-light-gray text-lg">
            Real-time seat layouts • Live showtimes • Interactive booking
          </p>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {movieBundles.map((bundle) => {
            const availableDates = getAvailableDates(bundle.screens);
            const selectedDate = availableDates.includes(todayIso) ? todayIso : availableDates[0];
            const screensForDate = getScreensForDate(bundle.screens, selectedDate);

            return (
              <div key={bundle.movie._id} className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-6 border border-brand-dark/40 shadow-2xl">
                {/* Movie Info */}
                <div className="flex gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <img
                      src={bundle.movie.posterUrl || '/placeholder-movie.jpg'}
                      alt={bundle.movie.title}
                      className="w-24 h-36 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{bundle.movie.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-brand-light-gray mb-3">
                      <span>🎭 {bundle.movie.genre}</span>
                      <span>🌍 {bundle.movie.language}</span>
                      <span>⏱️ {bundle.movie.duration}</span>
                    </div>
                    <div className="text-brand-light-gray">
                      <span className="text-green-400">●</span> {screensForDate.length} Screen(s) Available
                    </div>
                  </div>
                </div>

                {/* Screens and Showtimes */}
                <div className="space-y-4">
                  {screensForDate.map((screen) => (
                    <div key={screen.screenId} className="bg-black/20 rounded-xl p-4 border border-brand-dark/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          🖥️ {screen.screenName || `Screen ${screen.screenId}`}
                          {screen.screenType && (
                            <span className="ml-2 text-sm text-brand-light-gray">({screen.screenType})</span>
                          )}
                        </h3>
                        {screen.showGroups[0]?.theatre && (
                          <span className="text-sm text-brand-light-gray">
                            🏢 {screen.showGroups[0].theatre}
                          </span>
                        )}
                      </div>

                      {/* Showtimes */}
                      <div className="flex flex-wrap gap-2">
                        {screen.showGroups[0]?.showtimes.map((showtime, index) => {
                          const showtimeStatus = getShowtimeStatus(selectedDate, showtime);
                          return (
                            <button
                              key={index}
                              onClick={() => !showtimeStatus.disabled && handleShowtimeClick(
                                bundle.movie._id,
                                screen.screenId,
                                selectedDate,
                                showtime,
                                screen.showGroups[0]?.theatreId
                              )}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                showtimeStatus.disabled
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                                  : selectedShow?.movieId === bundle.movie._id && 
                                    selectedShow?.screenId === screen.screenId && 
                                    selectedShow?.showtime === showtime
                                    ? 'bg-brand-red text-white shadow-lg transform scale-105'
                                    : 'bg-brand-dark text-white hover:bg-brand-red hover:text-white hover:scale-105'
                              }`}
                              disabled={showtimeStatus.disabled}
                              title={showtimeStatus.tooltip}
                            >
                              ⏰ {showtime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Seat Layout */}
        {selectedShow && (
          <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">💺 Live Seat Layout</h2>
              <p className="text-brand-light-gray">
                {selectedShow.showtime} • {selectedShow.date}
              </p>
            </div>

            {isLoadingLayout ? (
              <div className="flex justify-center py-12">
                <BookNViewLoader />
              </div>
            ) : seatLayoutConfig ? (
              <div className="flex justify-center">
                <div className="bg-white/5 rounded-xl p-6 border border-brand-dark/30">
                  <SeatLayoutBuilder
                    config={seatLayoutConfig}
                    editMode={false}
                    processedSeats={new Map(Object.entries(seatLayout.seats || {}))}
                  />
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
                onClick={() => navigate(`/movie/${selectedShow.movieId}`)}
                className="bg-brand-red text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 font-medium"
              >
                🎫 Book Tickets
              </button>
              <button
                onClick={() => setSelectedShow(null)}
                className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}

        {/* No movies message */}
        {movieBundles.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Movies Available</h2>
            <p className="text-brand-light-gray text-lg">
              Check back later for new releases and showtimes!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicMovieLanding;
