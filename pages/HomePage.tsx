
import React, { useState, useEffect } from 'react';
import { MOVIES } from '../constants';
import MovieCard from '../components/MovieCard';
import { useAppContext } from '../context/AppContext';

const HomePage: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { city } = useAppContext();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % MOVIES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleContactClick = () => {
    window.location.href = '/#/theatre-owner-signup';
  };

  return (
    <div className="space-y-16">
      {/* Hero Section - Enhanced Banner Carousel */}
      <div className="relative w-full h-64 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
        {MOVIES.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-all duration-1000 ${index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          >
            <img src={movie.bannerUrl} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">{movie.title}</h2>
                <p className="text-lg md:text-xl text-gray-300 mb-6 drop-shadow-lg">{movie.genre}</p>
                <div className="flex items-center space-x-4 mb-6">
                  <span className="bg-brand-red text-white px-4 py-2 rounded-full text-sm font-semibold">
                    ⭐ {movie.rating}/10
                  </span>
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
            {MOVIES.map((_, index) => (
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
              <span className="text-gray-400 text-sm">{MOVIES.length} movies available</span>
            </div>
          </div>
          <button className="text-brand-red hover:text-red-400 transition-colors font-semibold">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {MOVIES.map((movie) => (
            <div key={movie.id} className="group">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
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
          {MOVIES.slice(0, 4).map((movie) => (
            <div key={`coming-${movie.id}`} className="relative group">
              <div className="relative overflow-hidden rounded-xl">
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="bg-brand-red text-white px-4 py-2 rounded-full text-sm font-bold mb-3 shadow-lg">
                      Coming Soon
                    </div>
                    <p className="text-sm opacity-90">Release Date TBA</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    ⭐ {movie.rating}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-white text-lg group-hover:text-brand-red transition-colors">{movie.title}</h3>
                <p className="text-gray-400 text-sm">{movie.genre}</p>
              </div>
            </div>
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