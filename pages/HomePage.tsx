
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { filterValidScreens } from '../utils/showtimeValidation';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';

const HomePage: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();
  const { city } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [comingSoon, setComingSoon] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % Math.max(movies.length, 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    const fetchMoviesWithAssignedShows = async () => {
      try {
        setIsLoading(true);

        const res = await apiService.getActiveMoviesWithShows();
        if (!res.success || !Array.isArray(res.data)) {
          setMovies([]);
          setAllMovies([]);
          return;
        }

        // Each item: { movie, screens }
        const normalized = res.data.map((item: any) => {
          const filteredScreens = filterValidScreens(item.screens || []);
          return {
            _id: item.movie?._id,
            title: item.movie?.title,
            posterUrl: item.movie?.posterUrl,
            genre: Array.isArray(item.movie?.genre) ? item.movie.genre.join('/') : (item.movie?.genre || ''),
            rating: item.movie?.rating || 0,
            duration: item.movie?.duration,
            language: item.movie?.language || item.movie?.movieLanguage || 'English',
            status: item.movie?.status,
            screens: filteredScreens,
            showtimes: filteredScreens.flatMap((s: any) => (s.showGroups || []).flatMap((g: any) => g.showtimes || [])).slice(0, 3),
            _hasAssignedShows: filteredScreens.length > 0
          };
        }).filter((m: any) => m._hasAssignedShows);

        setMovies(normalized);
        setAllMovies(normalized);
      } catch (error) {
        console.error('Error fetching movies with shows:', error);
        setMovies([]);
        setAllMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesWithAssignedShows();
  }, [city]);

  useEffect(() => {
    const fetchComing = async () => {
      try {
        const res = await apiService.getComingSoon();
        if (res.success && res.data) setComingSoon(res.data);
        else setComingSoon([]);
      } catch {
        setComingSoon([]);
      }
    };
    fetchComing();
  }, []);

  const handleContactClick = () => {
    window.location.href = '/#/theatre-owner-signup';
  };

  return (
    <div className="space-y-16">
      {/* Hero Section - Enhanced Banner Carousel */}
      <div className="relative w-full h-64 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
          {movies.slice(0, 5).map((movie, index) => (
          <div
            key={movie._id || index}
            className={`absolute inset-0 transition-all duration-1000 ${index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          >
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">{movie.title}</h2>
                <p className="text-lg md:text-xl text-gray-300 mb-6 drop-shadow-lg">{movie.genre}</p>
                <div className="flex items-center space-x-4 mb-6">
                  {movie.rating && (
                    <span className="bg-brand-red text-white px-4 py-2 rounded-full text-sm font-semibold">
                      ⭐ {movie.rating}/10
                    </span>
                  )}
                  <span className="text-white bg-black/30 px-4 py-2 rounded-full text-sm">
                    {movie.duration}
                  </span>
                </div>
                <button className="bg-brand-red text-white px-8 py-3 rounded-lg font-bold hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
            {movies.slice(0, 5).map((_: any, index: number) => (
            <button 
              key={index} 
              onClick={() => setCurrentBanner(index)} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${index === currentBanner ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
            ></button>
            ))}
        </div>
      </div>

      {/* Now Showing Section - Enhanced */}
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Now Showing</h2>
            <div className="flex items-center space-x-2">
              <span className="text-brand-red font-semibold">In {city}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 text-sm">
                {movies.filter(m => m._hasAssignedShows).length} movies with showtimes
              </span>
            </div>
          </div>
          <button className="text-brand-red hover:text-red-400 transition-colors font-semibold">
            View All →
          </button>
        </div>
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading movies…</div>
        ) : movies.filter(movie => movie._hasAssignedShows).length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-6xl mb-4">🎬</div>
            <div className="text-xl mb-2">No movies with showtimes available</div>
            <div className="text-sm">Check back later for new releases!</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.filter(movie => movie._hasAssignedShows).map((movie) => (
              <div
                key={movie._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/movie/${movie._id}`)}
              >
                <MovieCard movie={{
                  id: movie._id,
                  title: movie.title,
                  posterUrl: movie.posterUrl,
                  genre: movie.genre,
                  rating: movie.rating || 0,
                  duration: movie.duration,
                  status: movie.status,
                  runtimeDays: movie.runtimeDays,
                  releaseDate: movie.releaseDate,
                  advanceBookingEnabled: movie.advanceBookingEnabled
                }} />
                <div className="mt-2 text-xs text-gray-400">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-400">●</span>
                    <span>{movie.screens?.length || 0} Screen(s)</span>
                    <span className="text-gray-500">•</span>
                    <span>{movie.language}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(movie.showtimes || []).map((t: string, i: number) => (
                      <span key={i} className="bg-brand-dark text-white px-2 py-0.5 rounded">{t}</span>
                    ))}
                    {movie.showtimes?.length === 0 && (
                      <span className="text-gray-500 italic">No showtimes</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Load More Movies →
          </button>
        </div>
      </div>

      {/* Coming Soon Section - Enhanced */}
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-gray-400">Get ready for these exciting releases</p>
          </div>
          <button className="text-brand-red hover:text-red-400 transition-colors font-semibold">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {comingSoon.slice(0, 8).map((movie) => (
            <MovieCard key={`coming-${movie._id}`} movie={{
              id: movie._id,
              title: movie.title,
              posterUrl: movie.posterUrl,
              genre: movie.genre,
              rating: movie.rating || 0,
              duration: movie.duration,
              status: movie.status,
              runtimeDays: movie.runtimeDays,
              releaseDate: movie.releaseDate,
              advanceBookingEnabled: movie.advanceBookingEnabled
            }} />
          ))}
        </div>
      </div>

      {/* Featured Events Section - Enhanced */}
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Featured Events</h2>
            <p className="text-gray-400">Live shows, concerts & cultural events</p>
          </div>
          <button className="text-brand-red hover:text-red-400 transition-colors font-semibold">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              title: "Bollywood Night", 
              type: "Live Music", 
              date: "Dec 20", 
              time: "8:00 PM",
              price: "₹999",
              image: "https://picsum.photos/seed/bollywood/400/250",
              venue: "Mumbai Arena"
            },
            { 
              title: "Comedy Night", 
              type: "Stand-up", 
              date: "Dec 25", 
              time: "7:30 PM",
              price: "₹499",
              image: "https://picsum.photos/seed/comedy/400/250",
              venue: "Laugh Factory"
            },
            { 
              title: "Dance Festival", 
              type: "Cultural", 
              date: "Jan 5", 
              time: "6:00 PM",
              price: "₹799",
              image: "https://picsum.photos/seed/dance/400/250",
              venue: "Cultural Center"
            }
          ].map((event, index) => (
            <div key={index} className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="relative">
                <img src={event.image} alt={event.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4">
                  <div className="bg-brand-red text-white px-3 py-1 rounded-full text-sm font-bold">
                    {event.price}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-white text-xl mb-2 group-hover:text-brand-red transition-colors">{event.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{event.type}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-brand-red">📅</span>
                    <span className="text-white">{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-brand-red">🕒</span>
                    <span className="text-white">{event.time}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">{event.venue}</p>
                <button className="w-full mt-4 bg-brand-red text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                  Book Tickets
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List Your Show Section */}
      <div className="animate-fade-in-up">
        <div className="bg-gradient-to-r from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center">
                <i className="fas fa-tent text-brand-light-gray text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">List Your Show</h2>
                <p className="text-brand-light-gray text-lg">
                  Got a show, event, activity or a great experience? Partner with us & get listed on BookNView
                </p>
              </div>
            </div>
            <button 
              onClick={handleContactClick}
              className="bg-gradient-to-r from-brand-red to-red-600 text-white px-8 py-4 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Contact Today!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;