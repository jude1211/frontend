import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';
import MovieSearchInput, { TMDBMovieDetails } from '../components/MovieSearchInput';
import Modal from '../components/Modal';
import { apiService } from '../services/api';

interface Movie {
  _id: string;
  title: string;
  genre: string;
  duration: string;
  rating?: number; // Derived from customer reviews
  posterUrl: string;
  status: 'active' | 'inactive' | 'coming_soon';
  showtimes: string[];
  format: '2D' | '3D';
  description?: string;
  director?: string;
  cast?: string[];
  language?: string; // backend internal field (kept as 'english')
  movieLanguage?: string; // actual language typed by theatre owner
  releaseDate?: string;
  theatreOwner?: {
    _id: string;
    theatreName: string;
    ownerName: string;
  };
  createdAt: string;
  updatedAt: string;
  trailerUrl?: string;
}

interface MovieFormData {
  title: string;
  genre: string;
  duration: string;
  posterUrl: string;
  status: 'active' | 'inactive' | 'coming_soon';
  showtimes: string;
  format: '2D' | '3D';
  description: string;
  director: string;
  cast: string;
  language: string;
  releaseDate: string;
  trailerUrl: string;
}

const MovieManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    genre: '',
    duration: '',
    posterUrl: '',
    status: 'active',
    showtimes: '',
    format: '2D',
    description: '',
    director: '',
    cast: '',
    language: 'English',
    releaseDate: '',
    trailerUrl: ''
  });
  const [errors, setErrors] = useState<Partial<MovieFormData>>({});
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovieDetails | null>(null);
  const [tmdbId, setTmdbId] = useState<number | null>(null);

  // Auto-fill form with TMDB movie data
  const handleMovieSelect = (movie: TMDBMovieDetails) => {
    setSelectedMovie(movie);
    setTmdbId(movie.id);

    // Extract genres
    const genres = movie.genres.map(g => g.name).join('/');

    // Format runtime
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';

    // Suggested language (owner can override)
    const suggestedLanguage = movie.spoken_languages?.[0]?.english_name || movie.original_language || 'English';

    // Get director and main cast
    const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || '';
    const cast = movie.credits?.cast?.slice(0, 3).map(actor => actor.name).join(', ') || '';

    // Release date
    const releaseDate = movie.release_date ? movie.release_date : '';

    // Suggested format (owner can override)
    const suggestedFormat = (movie.vote_average > 7.5 ? '3D' : '2D') as '2D' | '3D';

    // Find YouTube trailer URL from TMDB videos if available
    let trailerUrl = '';
    if (movie.videos && Array.isArray(movie.videos.results)) {
      const trailer = movie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    setFormData(prev => ({
      ...prev,
      title: movie.title,
      genre: genres,
      duration: runtime || prev.duration,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : prev.posterUrl,
      // preserve owner-chosen fields; only suggest if empty
      language: prev.language?.trim() ? prev.language : suggestedLanguage,
      format: (prev.format || '2D') as '2D' | '3D',
      status: (prev.status || 'active') as 'active' | 'inactive' | 'coming_soon',
      director: director || prev.director,
      cast: cast || prev.cast,
      releaseDate: releaseDate || prev.releaseDate,
      description: movie.overview || prev.description,
      trailerUrl: trailerUrl || prev.trailerUrl
    }));

    // Don’t force the suggested format if owner has already chosen; if empty, use suggestion
    setFormData(prev => ({
      ...prev,
      format: (prev.format || suggestedFormat) as '2D' | '3D'
    }));

    setErrors({});
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      const theatreOwnerData = JSON.parse(localStorage.getItem('theatreOwnerData') || '{}');
      const theatreOwnerId = theatreOwnerData._id;
      
      if (!theatreOwnerId) {
        console.error('Theatre owner ID not found');
        return;
      }

      const response = await apiService.getTheatreOwnerMovies(theatreOwnerId);
      if (response.success && response.data) {
        setMovies(response.data);
      } else {
        console.error('Failed to fetch movies:', response.error);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'coming_soon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;


    setFormData(prev => ({
      ...prev,
      [name]: value as any
    }));
    // Clear error when user starts typing
    if (errors[name as keyof MovieFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  const validateForm = (): boolean => {
    const newErrors: Partial<MovieFormData> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';

    // Accept formats like "2h 30m", "2h", or "150m"
    const durationText = formData.duration ? formData.duration.trim() : '';
    const durationOk = /^(\d+h\s*\d+m|\d+h|\d+m)$/.test(durationText);
    if (formData.duration && !durationOk) {
      newErrors.duration = 'Use formats like 2h 30m, 2h, or 150m';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      setSubmitError('');
      const movieData = {
        title: formData.title,
        genre: formData.genre,
        duration: formData.duration,
        posterUrl: formData.posterUrl,
        status: formData.status,
        showtimes: [],
        description: formData.description,
        director: formData.director,
        cast: formData.cast ? formData.cast.split(',').map(c => c.trim()) : [],
        language: formData.language,
        releaseDate: formData.releaseDate,
        format: formData.format,
        trailerUrl: formData.trailerUrl,
        tmdbId: tmdbId
      };

      if (isEditMode && editingMovie) {
        // Update existing movie
        const response = await apiService.updateMovie(editingMovie._id, movieData);
        if (response.success) {
          // Refresh movies list to get updated data
          await fetchMovies();
          setShowAddModal(false);
          setEditingMovie(null);
          setIsEditMode(false);
        } else {
          console.error('Failed to update movie:', response.error);
          setSubmitError(response.error || 'Failed to update movie');
        }
      } else {
        // Add new movie
        const response = await apiService.addMovie(movieData);
        if (response.success) {
          // Refresh movies list to get the new movie
          await fetchMovies();
          setShowAddModal(false);
        } else {
          console.error('Failed to add movie:', response.error);
          setSubmitError(response.error || 'Failed to add movie');
        }
      }
      
      // Reset form
      setFormData({
        title: '',
        genre: '',
        duration: '',
        posterUrl: '',
        status: 'active',
        showtimes: '',
        format: '2D',
        description: '',
        director: '',
        cast: '',
        language: 'English',
        releaseDate: '',
        trailerUrl: ''
      });
      setSelectedMovie(null);
      setTmdbId(null);
      setErrors({});

    } catch (error) {
      console.error('Error saving movie:', error);
      setSubmitError((error && (error as any).message) || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMovie(null);
    setIsEditMode(false);
    setSubmitError('');
    setSelectedMovie(null);
    setFormData({
      title: '',
      genre: '',
      duration: '',
      posterUrl: '',
      status: 'active',
      showtimes: '',
      format: '2D',
      description: '',
      director: '',
      cast: '',
      language: 'English',
      releaseDate: '',
      trailerUrl: ''
    });
    setErrors({});
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setIsEditMode(true);
    setFormData({
      title: movie.title,
      genre: movie.genre,
      duration: movie.duration,
      posterUrl: movie.posterUrl,
      status: movie.status,
      showtimes: movie.showtimes.join(', '),
      format: movie.format,
      description: movie.description || '',
      director: movie.director || '',
      cast: movie.cast ? movie.cast.join(', ') : '',
      language: movie.language || 'English',
      releaseDate: movie.releaseDate || '',
      trailerUrl: movie.trailerUrl || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteMovie = (movie: Movie) => {
    setMovieToDelete(movie);
    setShowDeleteModal(true);
  };

  const confirmDeleteMovie = async () => {
    if (!movieToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.deleteMovie(movieToDelete._id);
      if (response.success) {
        // Refresh movies list to reflect the deletion
        await fetchMovies();
        setShowDeleteModal(false);
        setMovieToDelete(null);
      } else {
        console.error('Failed to delete movie:', response.error);
      }
    } catch (error) {
      console.error('Error deleting movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <BookNViewLoader fullScreen={true} text="Loading Movies..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-film text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Movie Management</h1>
                <p className="text-brand-light-gray">Manage your theatre's movie lineup</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Movie</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search movies..."
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
            </div>
            <select className="px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
            <button className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors">
              <i className="fas fa-filter mr-2"></i>
              Filter
            </button>
          </div>
        </div>

        {/* Movies Grid - BookMyShow Style */}
        {movies.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-film text-4xl text-brand-light-gray"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Movies Yet</h3>
            <p className="text-brand-light-gray mb-8 max-w-md mx-auto">
              Start building your movie lineup by adding your first movie. Your audience is waiting!
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-red text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <i className="fas fa-plus"></i>
              <span>Add Your First Movie</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
            <div key={movie._id} className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              {/* Movie Poster */}
              <div className="relative overflow-hidden">
                <img 
                  src={movie.posterUrl || 'https://via.placeholder.com/300x400/333/fff?text=No+Image'} 
                  alt={movie.title}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/333/fff?text=No+Image';
                  }}
                />
                
                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(movie.status)}`}>
                    {movie.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    {movie.format}
                  </span>
                </div>

                {/* Rating Badge */}
                {movie.rating && movie.rating > 0 && (
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <i className="fas fa-star mr-1"></i>
                      {movie.rating.toFixed(1)}
                    </div>
                  </div>
                )}

                {/* Language Badge */}
                  {(movie.movieLanguage || movie.language) && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                      {movie.movieLanguage || movie.language}
                    </div>
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-red transition-colors">
                  {movie.title}
                </h3>
                
                <p className="text-brand-light-gray text-sm mb-3 line-clamp-1">
                  {movie.genre}
                </p>

                {/* Director */}
                {movie.director && (
                  <p className="text-brand-light-gray text-xs mb-2 line-clamp-1">
                    <i className="fas fa-user mr-1"></i>
                    {movie.director}
                  </p>
                )}

                {/* Duration and Release Date */}
                <div className="flex items-center justify-between text-sm text-brand-light-gray mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-clock mr-1"></i>
                    <span>{movie.duration}</span>
                  </div>
                  {movie.releaseDate && (
                    <div className="flex items-center">
                      <i className="fas fa-calendar mr-1"></i>
                      <span>{new Date(movie.releaseDate).getFullYear()}</span>
                    </div>
                  )}
                </div>

                {/* Showtimes */}
                <div className="mb-4">
                  <p className="text-brand-light-gray text-sm mb-2 font-medium">
                    <i className="fas fa-clock mr-1"></i>
                    Showtimes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(movie.showtimes || []).slice(0, 3).map((time, index) => (
                      <span key={index} className="bg-gradient-to-r from-brand-red to-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {time}
                      </span>
                    ))}
                    {Array.isArray(movie.showtimes) && movie.showtimes.length > 3 && (
                      <span className="bg-brand-dark text-brand-light-gray px-2 py-1 rounded text-xs">
                        +{movie.showtimes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Description Preview */}
                {movie.description && (
                  <p className="text-brand-light-gray text-xs mb-4 line-clamp-2">
                    {movie.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditMovie(movie)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium flex items-center justify-center"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteMovie(movie)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium flex items-center justify-center"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Movie Modal */}
      <Modal isOpen={showAddModal} onClose={handleCloseModal} className="bg-transparent m-4 w-full max-w-6xl relative">
        <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-0 border border-brand-dark/40 shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-8 pt-8 pb-6 border-b border-brand-dark/40 bg-gradient-to-r from-brand-gray to-brand-dark">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-film text-white text-xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isEditMode ? 'Edit Movie' : 'Add New Movie'}
                  </h2>
                  <p className="text-brand-light-gray text-sm">
                    {isEditMode ? 'Update movie information' : 'Add a new movie to your theatre\'s lineup'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body: Landscape two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Movie Title with Search */}
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                      Movie Title * 
                      <span className="text-brand-light-gray text-xs ml-2">
                        (Search TMDB for auto-fill)
                      </span>
                    </label>
                    <MovieSearchInput
                      onMovieSelect={handleMovieSelect}
                      placeholder="Search for movies to auto-fill details..."
                      className="mb-2"
                    />
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red ${
                        errors.title ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="Or enter movie title manually"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Genre */}
                  <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-white mb-2">
                      Genre *
                    </label>
                    <input
                      type="text"
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red ${
                        errors.genre ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="e.g., Action, Drama, Comedy"
                    />
                    {errors.genre && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.genre}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red ${
                        errors.duration ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="e.g., 2h 30m"
                    />
                    {errors.duration && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.duration}
                      </p>
                    )}
                  </div>

                  {/* Format */}
                  <div>
                    <label htmlFor="format" className="block text-sm font-medium text-white mb-2">
                      Format
                    </label>
                    <select
                      id="format"
                      name="format"
                      value={formData.format}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    >
                      <option value="2D">2D</option>
                      <option value="3D">3D</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-white mb-2">
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    >
                      <option value="">Select language</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Odia">Odia</option>
                      <option value="Assamese">Assamese</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Bhojpuri">Bhojpuri</option>
                      <option value="Rajasthani">Rajasthani</option>
                      <option value="Konkani">Konkani</option>
                      <option value="Sindhi">Sindhi</option>
                      <option value="Sanskrit">Sanskrit</option>
                      <option value="Tulu">Tulu</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-white mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    >
                      <option value="active">Active</option>
                      <option value="coming_soon">Coming Soon</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>


                  {/* Poster URL */}
                  <div className="md:col-span-2">
                    <label htmlFor="posterUrl" className="block text-sm font-medium text-white mb-2">
                      Poster Image URL
                    </label>
                    <input
                      type="url"
                      id="posterUrl"
                      name="posterUrl"
                      value={formData.posterUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="https://example.com/poster.jpg"
                    />
                  </div>

                  {/* Trailer URL */}
                  <div className="md:col-span-2">
                    <label htmlFor="trailerUrl" className="block text-sm font-medium text-white mb-2">
                      Trailer URL
                      <span className="text-brand-light-gray text-xs ml-2">(auto-filled from TMDB if available, editable)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        id="trailerUrl"
                        name="trailerUrl"
                        value={formData.trailerUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {formData.trailerUrl && selectedMovie && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            <i className="fas fa-check mr-1"></i>Auto-filled
                          </span>
                        </div>
                      )}
                    </div>
                    {formData.trailerUrl && (
                      <p className="text-green-400 text-xs mt-1">
                        <i className="fas fa-video mr-1"></i>
                        Trailer URL ready for saving
                      </p>
                    )}
                  </div>

                  {/* Director */}
                  <div>
                    <label htmlFor="director" className="block text-sm font-medium text-white mb-2">
                      Director
                    </label>
                    <input
                      type="text"
                      id="director"
                      name="director"
                      value={formData.director}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Director name"
                    />
                  </div>

                  {/* Release Date */}
                  <div>
                    <label htmlFor="releaseDate" className="block text-sm font-medium text-white mb-2">
                      Release Date
                    </label>
                    <input
                      type="date"
                      id="releaseDate"
                      name="releaseDate"
                      value={formData.releaseDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>

                  {/* Cast */}
                  <div className="md:col-span-2">
                    <label htmlFor="cast" className="block text-sm font-medium text-white mb-2">
                      Cast
                    </label>
                    <input
                      type="text"
                      id="cast"
                      name="cast"
                      value={formData.cast}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Actor 1, Actor 2, Actor 3"
                    />
                    <p className="text-brand-light-gray text-sm mt-1">
                      Separate multiple actors with commas
                    </p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red resize-none"
                      placeholder="Movie description..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-4 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-brand-dark text-white py-3 rounded-xl hover:bg-brand-dark/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-red text-white py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {isEditMode ? 'Updating Movie...' : 'Adding Movie...'}
                      </>
                    ) : (
                      <>
                        <i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                        {isEditMode ? 'Update Movie' : 'Add Movie'}
                      </>
                    )}
                  </button>
                </div>
              </form>
              {submitError && (
                <div className="mt-3 text-red-400 text-sm flex items-center">
                  <i className="fas fa-circle-exclamation mr-2"></i>
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="bg-gradient-to-b from-brand-dark to-black p-8 flex items-start justify-center">
              <div className="w-full max-w-sm bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-xl overflow-hidden">
                <div className="relative">
                  <img
                    src={formData.posterUrl || 'https://picsum.photos/seed/preview/400/600'}
                    alt="Poster preview"
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                      {formData.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                      {formData.format}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{formData.title || 'Movie Title'}</h3>
                  <p className="text-brand-light-gray text-sm mb-3">{formData.genre || 'Genre'}</p>
                  
                  {/* TMDB Rating if available */}
                  {selectedMovie && (
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-star text-yellow-400 text-sm"></i>
                        <span className="text-yellow-400 font-semibold text-sm">
                          {selectedMovie.vote_average.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-brand-light-gray text-xs">
                        ({selectedMovie.vote_count} votes)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-brand-light-gray mb-4">
                    <span>{formData.duration || 'Duration'}</span>
                    <span className="font-bold text-white">{formData.format}</span>
                  </div>
                  
                  {/* Director and Language */}
                  {(formData.director || formData.language) && (
                    <div className="space-y-2 mb-4">
                      {formData.director && (
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-user text-brand-light-gray text-xs"></i>
                          <span className="text-brand-light-gray text-xs">Director: {formData.director}</span>
                        </div>
                      )}
                      {formData.language && (
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-globe text-brand-light-gray text-xs"></i>
                          <span className="text-brand-light-gray text-xs">Language: {formData.language}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  
                  {/* Description preview */}
                  {formData.description && (
                    <div className="mt-4">
                      <p className="text-brand-light-gray text-xs leading-relaxed line-clamp-3">
                        {formData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-8 max-w-md mx-auto border border-brand-dark/40 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Delete Movie</h2>
            <p className="text-brand-light-gray">
              Are you sure you want to delete <span className="text-white font-semibold">{movieToDelete?.title}</span>? This action cannot be undone.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-brand-dark text-white py-3 rounded-xl hover:bg-brand-dark/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteMovie}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  Delete Movie
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MovieManagement; 