
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Movie } from '../types';
import MovieRating from './MovieRating';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();
  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-brand-gray hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        {/* Movie Poster */}
        <div className="relative overflow-hidden">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Overlay with rating */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold">
              <MovieRating movieId={movie.id} className="text-xs" />
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-semibold">{movie.duration}</span>
                {movie.status === 'Now Showing' && (
                  <button onClick={(e)=>{ e.preventDefault(); navigate(`/landing?movie=${encodeURIComponent(String(movie.id))}`); }} className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                    Book Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="font-bold text-white text-lg mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
            {movie.title}
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{movie.genre.split('/')[0]}</span>
            <span className="text-brand-red text-sm font-semibold">{movie.duration}</span>
          </div>


          {/* Genre tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {movie.genre.split('/').slice(0, 2).map((genre, index) => (
              <span 
                key={index}
                className="bg-brand-dark text-gray-300 px-2 py-1 rounded-full text-xs"
              >
                {genre.trim()}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="far fa-heart"></i>
              </button>
              <button className="text-gray-400 hover:text-brand-red transition-colors">
                <i className="fas fa-share"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Status ribbon and badges */}
        {movie.status === 'Now Showing' && (
          <div className="absolute top-0 left-0 bg-brand-red text-white px-3 py-1 text-xs font-bold rounded-br-lg">
            Now Showing
            {movie.runtimeDays && (
              <span className="ml-2 bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-normal">Day {movie.runtimeDays}</span>
            )}
          </div>
        )}
        {movie.status === 'Coming Soon' && (
          <div className="absolute top-0 left-0 bg-yellow-600 text-white px-3 py-1 text-xs font-bold rounded-br-lg">
            Coming Soon
            {movie.releaseDate && (
              <span className="ml-2 bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-normal">Releases {movie.releaseDate}</span>
            )}
            {movie.advanceBookingEnabled && (
              <span className="ml-2 bg-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Advance Booking Open</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default MovieCard;