import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  posterUrl: string;
  status: 'active' | 'inactive' | 'coming_soon';
  price: number;
  showtimes: string[];
}

const MovieManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

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
        price: 400,
        showtimes: ['10:00 AM', '1:30 PM', '7:30 PM']
      },
      {
        id: '2',
        title: 'Saiyara',
        genre: 'Drama/Musical/Romantic',
        duration: '2h 45m',
        rating: 9.1,
        posterUrl: 'https://picsum.photos/seed/saiyara/400/600',
        status: 'active',
        price: 350,
        showtimes: ['11:00 AM', '3:00 PM', '8:00 PM']
      },
      {
        id: '3',
        title: 'F1: The Movie',
        genre: 'Action/Drama/Sports',
        duration: '2h 15m',
        rating: 8.5,
        posterUrl: 'https://picsum.photos/seed/f1movie/400/600',
        status: 'active',
        price: 450,
        showtimes: ['9:30 AM', '2:00 PM', '6:30 PM']
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movie.status)}`}>
                    {movie.status.replace('_', ' ')}
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
                  <span className="font-bold text-white">{formatCurrency(movie.price)}</span>
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
                    onClick={() => setEditingMovie(movie)}
                    className="flex-1 bg-brand-red text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button className="flex-1 bg-brand-dark text-white py-2 rounded-lg hover:bg-brand-dark/80 transition-colors text-sm">
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieManagement; 