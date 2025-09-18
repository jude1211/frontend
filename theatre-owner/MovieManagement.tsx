import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';
import MovieSearchInput, { TMDBMovieDetails } from '../components/MovieSearchInput';
import Modal from '../components/Modal';

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: number; // Derived from customer reviews
  posterUrl: string;
  status: 'active' | 'inactive' | 'coming_soon';
  showtimes: string[];
  format: '2D' | '3D';
  description?: string;
  director?: string;
  cast?: string[];
  language?: string;
  releaseDate?: string;
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
}

const MovieManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    releaseDate: ''
  });
  const [errors, setErrors] = useState<Partial<MovieFormData>>({});
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovieDetails | null>(null);

  // Auto-fill form with TMDB movie data
  const handleMovieSelect = (movie: TMDBMovieDetails) => {
    setSelectedMovie(movie);
    
    // Extract genres
    const genres = movie.genres.map(g => g.name).join('/');
    
    // Format runtime
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
    
    // Get primary language
    const language = movie.spoken_languages?.[0]?.english_name || 
                    movie.original_language || 
                    'English';
    
    // Get director from crew
    const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || '';
    
    // Get main cast (first 3 actors)
    const cast = movie.credits?.cast?.slice(0, 3).map(actor => actor.name).join(', ') || '';
    
    // Format release date
    const releaseDate = movie.release_date ? movie.release_date : '';
    
    // Determine format based on movie popularity/type (simplified logic)
    const format = movie.vote_average > 7.5 ? '3D' : '2D';
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      title: movie.title,
      genre: genres,
      duration: runtime,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      language: language,
      director: director,
      cast: cast,
      releaseDate: releaseDate,
      format: format as '2D' | '3D',
      description: movie.overview || ''
    }));
    
    // Clear any existing errors
    setErrors({});
  };

  useEffect(() => {
    // Simulate loading movies
    setMovies([
      {
        id: '1',
        title: 'Superman',
        genre: 'Action/Adventure/Fantasy',
        duration: '2h 30m',
        rating: 8.8,
        posterUrl: 'https://picsum.photos/seed/superman/400/600',
        status: 'active',
        showtimes: ['10:00 AM', '1:30 PM', '7:30 PM'],
        format: '2D'
      },
      {
        id: '2',
        title: 'Saiyara',
        genre: 'Drama/Musical/Romantic',
        duration: '2h 45m',
        rating: 9.1,
        posterUrl: 'https://picsum.photos/seed/saiyara/400/600',
        status: 'active',
        showtimes: ['11:00 AM', '3:00 PM', '8:00 PM'],
        format: '3D'
      },
      {
        id: '3',
        title: 'F1: The Movie',
        genre: 'Action/Drama/Sports',
        duration: '2h 15m',
        rating: 8.5,
        posterUrl: 'https://picsum.photos/seed/f1movie/400/600',
        status: 'active',
        showtimes: ['9:30 AM', '2:00 PM', '6:30 PM'],
        format: '2D'
      }
    ]);
  }, []);

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

    // Special handling for showtimes: allow only numbers, colon, comma, spaces, and am/pm letters
    if (name === 'showtimes') {
      // Keep only allowed characters
      const sanitized = value.replace(/[^0-9:apm,\s]/gi, '');
      // Normalize whitespace and AM/PM casing while typing
      const normalized = sanitized
        .replace(/\s+/g, ' ')
        .replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());

      setFormData(prev => ({
        ...prev,
        showtimes: normalized
      }));

      // Clear error when user starts typing
      if (errors.showtimes) {
        setErrors(prev => ({ ...prev, showtimes: '' }));
      }
      return;
    }

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

  const validateShowtimes = (input: string): boolean => {
    if (!input.trim()) return false;
    const tokens = input.split(',').map(t => t.trim()).filter(Boolean);
    if (tokens.length === 0) return false;

    // H:MM AM/PM, hours 1-12 without leading zero
    const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
    return tokens.every(token => timeRegex.test(token));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<MovieFormData> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.showtimes.trim()) newErrors.showtimes = 'Showtimes are required';

    // Validate duration format (e.g., "2h 30m")
    if (formData.duration && !/^\d+h\s+\d+m$/.test(formData.duration)) {
      newErrors.duration = 'Duration should be in format "2h 30m"';
    }

    // Validate showtimes format (H:MM AM/PM) and no leading zero hour
    if (formData.showtimes && !validateShowtimes(formData.showtimes)) {
      newErrors.showtimes = 'Use H:MM AM/PM, hours 1-12 (e.g., 9:30 AM, 12:05 PM)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const movieData = {
        title: formData.title,
        genre: formData.genre,
        duration: formData.duration,
        posterUrl: formData.posterUrl,
        status: formData.status,
        showtimes: formData.showtimes.split(',').map(s => s.trim().replace(/\s+/g, ' ').toUpperCase()),
        description: formData.description,
        director: formData.director,
        cast: formData.cast ? formData.cast.split(',').map(c => c.trim()) : [],
        language: formData.language,
        releaseDate: formData.releaseDate,
        format: formData.format
      } as Omit<Movie, 'id' | 'rating'>;

      // For now, simulate API call - in real app, make actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEditMode && editingMovie) {
        // Update existing movie (keep rating from reviews)
        const updatedMovie: Movie = {
          ...editingMovie,
          ...movieData,
          rating: editingMovie.rating
        };

        setMovies(prev => prev.map(movie => 
          movie.id === editingMovie.id ? updatedMovie : movie
        ));
      } else {
        // Add new movie with default rating of 0 (will be computed from reviews)
        const newMovie: Movie = {
          id: (movies.length + 1).toString(),
          ...movieData,
          rating: 0
        };

        setMovies(prev => [...prev, newMovie]);
      }
      
      // Reset form and close modal
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
        releaseDate: ''
      });
      setShowAddModal(false);
      setErrors({});

    } catch (error) {
      console.error('Error adding movie:', error);
      // Handle error (show toast notification, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMovie(null);
    setIsEditMode(false);
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
      releaseDate: ''
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
      releaseDate: movie.releaseDate || ''
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from local state
      setMovies(prev => prev.filter(movie => movie.id !== movieToDelete.id));
      
      setShowDeleteModal(false);
      setMovieToDelete(null);
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

        {/* Movies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div key={movie.id} className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Movie Poster */}
              <div className="relative">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movie.status)}`}>
                    {movie.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                    {movie.format}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/70 text-white px-2 py-1 rounded text-sm">
                    ⭐ {movie.rating}/10
                  </div>
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{movie.title}</h3>
                <p className="text-brand-light-gray text-sm mb-3">{movie.genre}</p>
                <div className="flex items-center justify-between text-sm text-brand-light-gray mb-4">
                  <span>{movie.duration}</span>
                  <span className="font-bold text-white">{movie.format}</span>
                </div>

                {/* Showtimes */}
                <div className="mb-4">
                  <p className="text-brand-light-gray text-sm mb-2">Showtimes:</p>
                  <div className="flex flex-wrap gap-2">
                    {movie.showtimes.map((time, index) => (
                      <span key={index} className="bg-brand-dark text-white px-2 py-1 rounded text-xs">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditMovie(movie)}
                    className="flex-1 bg-brand-red text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteMovie(movie)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                    <input
                      type="text"
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="e.g., English, Hindi"
                    />
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

                  {/* Showtimes */}
                  <div className="md:col-span-2">
                    <label htmlFor="showtimes" className="block text-sm font-medium text-white mb-2">
                      Showtimes *
                    </label>
                    <input
                      type="text"
                      id="showtimes"
                      name="showtimes"
                      value={formData.showtimes}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-brand-dark border rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red ${
                        errors.showtimes ? 'border-red-500' : 'border-brand-dark/30'
                      }`}
                      placeholder="e.g., 10:00 AM, 1:30 PM, 7:30 PM"
                    />
                    {errors.showtimes && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠</span>
                        {errors.showtimes}
                      </p>
                    )}
                    <p className="text-brand-light-gray text-sm mt-1">
                      Separate multiple showtimes with commas. Format: H:MM AM/PM
                    </p>
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
                  
                  <div>
                    <p className="text-brand-light-gray text-sm mb-2">Showtimes:</p>
                    <div className="flex flex-wrap gap-2">
                      {(formData.showtimes ? formData.showtimes.split(',').map(s => s.trim().replace(/\s+/g, ' ').toUpperCase()) : ['10:00 AM', '1:30 PM']).map((time, i) => (
                        <span key={i} className="bg-brand-dark text-white px-2 py-1 rounded text-xs">{time}</span>
                      ))}
                    </div>
                  </div>
                  
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