
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOVIES, SHOWTIMES } from '../constants';
import { useAppContext } from '../context/AppContext';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedMovie, setSelectedShowtime } = useAppContext();

  const movie = MOVIES.find((m) => m.id === id);

  useEffect(() => {
    if (movie) {
      setSelectedMovie(movie);
    }
  }, [movie, setSelectedMovie]);

  if (!movie) {
    return <div className="text-center text-2xl">Movie not found!</div>;
  }

  const handleShowtimeSelect = (showtime: typeof SHOWTIMES[0]) => {
    setSelectedShowtime(showtime);
    navigate(`/select-seats/${movie.id}/${showtime.id}`);
  };

  return (
    <div className="space-y-12">
      {/* Trailer/Video Player */}
      <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl">
        <iframe
          className="w-full h-full"
          src={movie.trailerUrl}
          title={`${movie.title} Trailer`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Movie Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-5xl font-bold text-white">{movie.title}</h1>
          <div className="flex items-center space-x-4 text-gray-300">
            <span className="flex items-center"><i className="fa fa-star text-yellow-400 mr-2"></i> {movie.rating}/10</span>
            <span>{movie.genre}</span>
            <span>{movie.duration}</span>
          </div>
          <p className="text-lg text-gray-300">{movie.description}</p>
        </div>
        <div>
          <img src={movie.posterUrl} alt={movie.title} className="rounded-lg shadow-lg w-full" />
        </div>
      </div>

      {/* Showtimes */}
      <div className="bg-brand-gray p-6 rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-white">Showtimes</h2>
        <div className="space-y-4">
          {SHOWTIMES.map((showtime) => (
            <div key={showtime.id} className="bg-brand-dark p-4 rounded-md flex justify-between items-center">
              <div>
                <p className="text-xl font-semibold text-white">{showtime.theatre}</p>
                <p className="text-gray-400">{showtime.availableSeats} seats available</p>
              </div>
              <button
                onClick={() => handleShowtimeSelect(showtime)}
                className="bg-brand-red text-white px-6 py-3 rounded-md font-bold hover:bg-red-600 transition-colors"
              >
                {showtime.time}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
