
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Movie } from '../types';
import TrailerPlayer from '../components/TrailerPlayer';
import CastScroller from '../components/CastScroller';


const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [cast, setCast] = useState<Array<{ name:string; character:string; profilePath?: string }>>([]);

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

  // Fetch cast from TMDB using the backend movie's tmdbId if present in payload
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
            const resp = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${apiKey}`);
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

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const res = await apiService.getMovieShowtimes(id!);
        if (res.success && Array.isArray(res.data)) {
          setScreens(res.data);
        } else {
          setScreens([]);
        }
      } catch {
        setScreens([]);
      }
    };
    fetchShowtimes();
  }, [id]);

  const handleShowtimeSelect = (screenId: string, bookingDate: string, time: string) => {
    // Navigate to live seat layout page
    navigate(`/live-seats/${movie?.id}/${screenId}/${bookingDate}/${encodeURIComponent(time)}`);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            {movie.status === 'Now Showing' && (
              <span className="bg-brand-red text-white px-3 py-1 rounded-full text-xs font-bold">Now Showing{movie.runtimeDays ? ` • Day ${movie.runtimeDays}` : ''}</span>
            )}
            {movie.status === 'Coming Soon' && (
              <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold">Coming Soon{movie.releaseDate ? ` • Releases ${movie.releaseDate}` : ''}</span>
            )}
            {movie.advanceBookingEnabled && movie.status === 'Coming Soon' && (
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold ml-2">Advance Booking Open</span>
            )}
          </div>
          <h1 className="text-5xl font-bold text-white">{movie.title}</h1>
          <div className="flex items-center space-x-4 text-gray-300">
            <span className="flex items-center"><i className="fa fa-star text-yellow-400 mr-2"></i> {movie.rating}/10</span>
            <span>{movie.genre}</span>
            <span>{movie.duration}</span>
          </div>
          <p className="text-lg text-gray-300">{movie.description}</p>
          {/* Cast Section */}
          <CastScroller cast={cast} />
        </div>
        <div>
          <img src={movie.posterUrl} alt={movie.title} className="rounded-lg shadow-lg w-full" />
        </div>
      </div>

      {/* Showtimes */}
      <div className="bg-brand-gray p-6 rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-white">Showtimes</h2>
        <div className="space-y-4">
          {screens.length === 0 ? (
            <div className="text-gray-400">No showtimes available.</div>
          ) : (
            screens.map((screen) => (
              <div key={screen.screenId} className="bg-brand-dark p-4 rounded-md mb-4">
                <div className="text-white font-semibold mb-2">Screen {screen.screenNumber || screen.screenId} {screen.screenType && <span className="text-xs text-gray-400 ml-2">({screen.screenType})</span>}</div>
                {screen.showGroups.map((group: any, idx: number) => (
                  <div key={idx} className="mb-2">
                    <div className="text-xs text-gray-300 mb-1">{group.theatre} • {group.bookingDate}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.showtimes.map((t: string) => (
                        <button
                          key={`${screen.screenId}-${group.bookingDate}-${t}`}
                          onClick={() => handleShowtimeSelect(screen.screenId, group.bookingDate, t)}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-red text-white hover:bg-red-600 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
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
