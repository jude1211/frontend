
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Movie } from '../types';
import TrailerPlayer from '../components/TrailerPlayer';
import CastScroller from '../components/CastScroller';
import MovieRating from '../components/MovieRating';
import { filterValidScreens, getShowtimeStatus, validateShowtime } from '../utils/showtimeValidation';
import { generateDateOptionsFromShows, getNextAvailableDate, formatDateForDisplay } from '../utils/dateUtils';


const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [cast, setCast] = useState<Array<{ name:string; character:string; profilePath?: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateOptions, setDateOptions] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getMovie(id!);
        if (res.success && res.data) {
          setMovie({
            id: res.data._id,
            title: res.data.title,
            genre: Array.isArray(res.data.genre) ? res.data.genre.join('/') : (res.data.genre || ''),
            rating: res.data.rating || 0,
            posterUrl: res.data.posterUrl,
            bannerUrl: res.data.bannerUrl || '',
            duration: res.data.duration,
            description: res.data.description || '',
            trailerUrl: res.data.trailerUrl || '',
            status: res.data.status,
            runtimeDays: res.data.runtimeDays,
            releaseDate: res.data.releaseDate,
            advanceBookingEnabled: res.data.advanceBookingEnabled
          });
        } else {
          setError('Movie not found!');
        }
      } catch {
        setError('Failed to fetch movie.');
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id]);

  // Fetch cast from TMDB using backend proxy (IPv4 + CORS-safe)
  useEffect(() => {
    const fetchCast = async () => {
      try {
        // Reuse movie endpoint to get tmdbId (already fetched above), else try details with credits
        const res = await apiService.getMovie(id!);
        const tmdbId = res?.data?.tmdbId;
        let fetchedCast: any[] = [];
        if (tmdbId) {
          const apiKey = (import.meta as any).env?.VITE_TMDB_API_KEY;
          if (apiKey) {
            const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
            const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${apiKey}`;
            const resp = await fetch(`${API_BASE}/proxy/tmdb?url=${encodeURIComponent(tmdbUrl)}`);
            const data = await resp.json();
            fetchedCast = Array.isArray(data?.cast) ? data.cast.slice(0, 12) : [];
          }
        }
        setCast((fetchedCast || []).map((c:any) => ({ name: c.name, character: c.character, profilePath: c.profile_path })));
      } catch {
        setCast([]);
      }
    };
    if (id) fetchCast();
  }, [id]);

  // Generate date options from available show dates
  useEffect(() => {
    if (availableDates.length > 0) {
      const options = generateDateOptionsFromShows(availableDates, selectedDate);
      setDateOptions(options);
    } else {
      setDateOptions([]);
    }
  }, [availableDates, selectedDate]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const res = await apiService.getMovieShowtimes(id!);
        if (res.success && Array.isArray(res.data)) {
          // Filter out past showtimes using the validation utility
          const validScreens = filterValidScreens(res.data);
          setScreens(validScreens);
          
          // Extract unique dates from the showtimes data
          const dates = new Set<string>();
          validScreens.forEach(screen => {
            screen.showGroups.forEach((group: any) => {
              dates.add(group.bookingDate);
            });
          });
          
          const sortedDates = Array.from(dates).sort();
          setAvailableDates(sortedDates);
          
          // Set the first available date as selected if no date is currently selected
          if (sortedDates.length > 0 && !selectedDate) {
            setSelectedDate(sortedDates[0]);
          }
        } else {
          setScreens([]);
          setAvailableDates([]);
        }
      } catch {
        setScreens([]);
        setAvailableDates([]);
      }
    };
    fetchShowtimes();
  }, [id, selectedDate]);

  const handleShowtimeSelect = (screenId: string, bookingDate: string, time: string) => {
    // Navigate to live seat layout page
    navigate(`/live-seats/${movie?.id}/${screenId}/${bookingDate}/${encodeURIComponent(time)}`);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Filter screens to show only showtimes for the selected date
  const getFilteredScreens = () => {
    return screens.map(screen => ({
      ...screen,
      showGroups: screen.showGroups.filter((group: any) => group.bookingDate === selectedDate)
    })).filter(screen => screen.showGroups.length > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <div className="text-2xl text-gray-400">Loading movie details...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch the movie information</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <div className="text-2xl text-red-400 mb-2">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!movie) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {/* Custom Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Home
          </button>
      {/* Trailer Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
            <i className="fas fa-play-circle text-red-600 mr-3"></i>
            Movie Trailer
          </h2>
          {movie.trailerUrl && (
            <div className="text-sm text-gray-400">
              <i className="fas fa-video mr-1"></i>
              Official Trailer
            </div>
          )}
        </div>
        <TrailerPlayer 
          trailerUrl={movie.trailerUrl || ''} 
          title={movie.title}
          className="mb-8"
        />
      </div>

      {/* Movie Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
            {movie.status === 'Now Showing' && (
              <span className="bg-brand-red text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold">Now Showing{movie.runtimeDays ? ` • Day ${movie.runtimeDays}` : ''}</span>
            )}
            {movie.status === 'Coming Soon' && (
              <span className="bg-yellow-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold">Coming Soon{movie.releaseDate ? ` • Releases ${movie.releaseDate}` : ''}</span>
            )}
            {movie.advanceBookingEnabled && movie.status === 'Coming Soon' && (
              <span className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold">Advance Booking Open</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300 text-sm sm:text-base">
            <MovieRating movieId={movie.id} showUserRating={true} />
            <span>{movie.genre}</span>
            <span>{movie.duration}</span>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-300">{movie.description}</p>
          {/* Cast Section */}
          <CastScroller cast={cast} />
        </div>
        <div className="flex justify-center md:justify-start">
          <img src={movie.posterUrl} alt={movie.title} className="rounded-lg shadow-lg w-full max-w-xs md:max-w-none" />
        </div>
      </div>

      {/* Date Selection Bar */}
      <div className="bg-brand-gray p-4 sm:p-6 rounded-lg">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-white">Select Date & Showtimes</h2>
        
        {/* Date Selection Bar */}
        {dateOptions.length > 0 ? (
          <div className="bg-brand-dark rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <i className="fas fa-chevron-left text-base sm:text-lg"></i>
              </button>
              
              <div className="flex space-x-1 sm:space-x-2 flex-wrap justify-center flex-1 overflow-x-auto">
                {dateOptions.map((dateOption) => (
                  <button
                    key={dateOption.value}
                    onClick={() => handleDateSelect(dateOption.value)}
                    className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      dateOption.isSelected
                        ? 'bg-red-600 text-white shadow-lg transform scale-105'
                        : dateOption.isToday
                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {dateOption.label}
                  </button>
                ))}
              </div>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <i className="fas fa-chevron-right text-base sm:text-lg"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-brand-dark rounded-lg p-4 mb-6">
            <div className="text-center text-gray-400">
              <i className="fas fa-calendar-times text-2xl mb-2"></i>
              <p>No show dates available</p>
            </div>
          </div>
        )}

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">
              Showtimes for {formatDateForDisplay(selectedDate)}
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full mr-1 sm:mr-2"></div>
                <span>Fast Filling</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full mr-1 sm:mr-2"></div>
                <span>Past Showtime</span>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {!selectedDate ? (
            <div className="text-gray-400">Please select a date to view showtimes.</div>
          ) : getFilteredScreens().length === 0 ? (
            <div className="text-gray-400">No showtimes available for {formatDateForDisplay(selectedDate)}.</div>
          ) : (
            getFilteredScreens().map((screen) => (
              <div key={screen.screenId} className="bg-brand-dark p-3 sm:p-4 rounded-md mb-4">
                <div className="text-white font-semibold mb-2 text-sm sm:text-base">Screen {screen.screenNumber || screen.screenId} {screen.screenType && <span className="text-xs text-gray-400 ml-2">({screen.screenType})</span>}</div>
                {screen.showGroups.map((group: any, idx: number) => (
                  <div key={idx} className="mb-2">
                    <div className="text-xs text-gray-300 mb-1">{group.theatre}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.showtimes.map((t: string) => {
                        const showtimeStatus = getShowtimeStatus(group.bookingDate, t);
                        return (
                          <button
                            key={`${screen.screenId}-${group.bookingDate}-${t}`}
                            onClick={() => !showtimeStatus.disabled && handleShowtimeSelect(screen.screenId, group.bookingDate, t)}
                            className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                              showtimeStatus.disabled
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-md'
                            }`}
                            disabled={showtimeStatus.disabled}
                            title={showtimeStatus.tooltip}
                          >
                            <span className="flex items-center">
                              {!showtimeStatus.disabled && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1.5 sm:mr-2"></div>
                              )}
                              <i className="fas fa-clock mr-1 text-xs"></i>
                              {t}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
