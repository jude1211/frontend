import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  original_language: string;
  spoken_languages: Array<{ english_name: string; iso_639_1: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  credits: {
    cast: Array<{ name: string; character: string; order: number }>;
    crew: Array<{ name: string; job: string; department: string }>;
  };
  vote_average: number;
  vote_count: number;
  adult: boolean;
}

export interface MovieSearchInputProps {
  onMovieSelect: (movie: TMDBMovieDetails) => void;
  placeholder?: string;
  className?: string;
}

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'your-tmdb-api-key-here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MovieSearchInput: React.FC<MovieSearchInputProps> = ({
  onMovieSelect,
  placeholder = "Search for movies...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TMDBMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const searchMovies = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Movie search error:', err);
      setError('Failed to search movies. Please try again.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input handler
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchMovies(value);
    }, 300);
  }, [searchMovies]);

  // Fetch detailed movie information
  const fetchMovieDetails = async (movieId: number): Promise<TMDBMovieDetails | null> => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
      );
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Movie details error:', err);
      setError('Failed to fetch movie details. Please try again.');
      return null;
    }
  };

  // Handle movie selection
  const handleMovieSelect = async (movie: TMDBMovie) => {
    setQuery(movie.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    const details = await fetchMovieDetails(movie.id);
    if (details) {
      onMovieSelect(details);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleMovieSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'pa': 'Punjabi'
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-brand-dark text-white rounded-xl border border-brand-dark/50 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all duration-200"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-red"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-red-400 text-sm flex items-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-brand-gray border border-brand-dark/50 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((movie, index) => (
            <div
              key={movie.id}
              onClick={() => handleMovieSelect(movie)}
              className={`p-4 cursor-pointer border-b border-brand-dark/30 last:border-b-0 transition-colors duration-200 ${
                index === selectedIndex
                  ? 'bg-brand-red/20 border-brand-red/30'
                  : 'hover:bg-brand-dark/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x64/333/fff?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-12 h-16 bg-brand-dark rounded-lg flex items-center justify-center">
                    <i className="fas fa-film text-brand-light-gray"></i>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">{movie.title}</h4>
                  <p className="text-brand-light-gray text-sm truncate">
                    {movie.original_title !== movie.title && movie.original_title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-yellow-400 text-sm">
                      <i className="fas fa-star mr-1"></i>
                      {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-brand-light-gray text-sm">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                    </span>
                    <span className="text-brand-light-gray text-sm">
                      {getLanguageName(movie.original_language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-brand-gray border border-brand-dark/50 rounded-xl shadow-2xl p-4">
          <div className="text-center text-brand-light-gray">
            <i className="fas fa-search text-2xl mb-2"></i>
            <p>No movies found for "{query}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieSearchInput;