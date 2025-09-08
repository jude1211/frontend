import React, { useState } from 'react';

interface Booking {
  id: string;
  movieTitle: string;
  moviePoster: string;
  theatre: string;
  date: string;
  time: string;
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  snacks?: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

// Mock booking data - in a real app, this would come from an API
const mockBookings: Booking[] = [
  {
    id: 'BK001',
    movieTitle: 'Avengers: Endgame',
    moviePoster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    theatre: 'PVR Cinemas - Phoenix Mall',
    date: '2024-01-15',
    time: '7:30 PM',
    seats: ['F12', 'F13'],
    totalAmount: 28.50,
    status: 'completed',
    bookingDate: '2024-01-10',
    snacks: [
      { name: 'Large Popcorn', quantity: 1, price: 8.50 },
      { name: 'Coke', quantity: 2, price: 5.00 }
    ]
  },
  {
    id: 'BK002',
    movieTitle: 'Spider-Man: No Way Home',
    moviePoster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    theatre: 'INOX - R City Mall',
    date: '2024-01-20',
    time: '4:15 PM',
    seats: ['H8', 'H9', 'H10'],
    totalAmount: 42.75,
    status: 'confirmed',
    bookingDate: '2024-01-18',
    snacks: [
      { name: 'Medium Popcorn', quantity: 1, price: 6.50 },
      { name: 'Nachos', quantity: 1, price: 7.25 }
    ]
  },
  {
    id: 'BK003',
    movieTitle: 'The Batman',
    moviePoster: 'https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    theatre: 'Cinepolis - Fun Republic',
    date: '2024-01-08',
    time: '9:45 PM',
    seats: ['D15', 'D16'],
    totalAmount: 19.00,
    status: 'cancelled',
    bookingDate: '2024-01-05'
  }
];

const BookingHistory: React.FC = () => {
  const [bookings] = useState<Booking[]>(mockBookings);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter(booking => 
    filter === 'all' || booking.status === filter
  );

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-900';
      case 'completed':
        return 'text-blue-400 bg-blue-900';
      case 'cancelled':
        return 'text-red-400 bg-red-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'fa-check-circle';
      case 'completed':
        return 'fa-star';
      case 'cancelled':
        return 'fa-times-circle';
      default:
        return 'fa-clock';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-brand-dark rounded-lg p-1">
        {[
          { key: 'all', label: 'All Bookings' },
          { key: 'confirmed', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:text-white hover:bg-brand-gray'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa fa-ticket-alt text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? "You haven't made any bookings yet." 
              : `No ${filter} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-brand-dark rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex items-start space-x-4">
                {/* Movie Poster */}
                <img
                  src={booking.moviePoster}
                  alt={booking.movieTitle}
                  className="w-16 h-24 object-cover rounded-md"
                />

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {booking.movieTitle}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">{booking.theatre}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>
                          <i className="fa fa-calendar mr-1"></i>
                          {formatDate(booking.date)}
                        </span>
                        <span>
                          <i className="fa fa-clock mr-1"></i>
                          {booking.time}
                        </span>
                        <span>
                          <i className="fa fa-chair mr-1"></i>
                          {booking.seats.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        <i className={`fa ${getStatusIcon(booking.status)} mr-1`}></i>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                      <p className="text-xl font-bold text-white mt-2">
                        ${booking.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Booking ID: {booking.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Booking Info */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedBooking.moviePoster}
                    alt={selectedBooking.movieTitle}
                    className="w-24 h-36 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedBooking.movieTitle}
                    </h3>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Theatre:</strong> {selectedBooking.theatre}</p>
                      <p><strong>Date & Time:</strong> {formatDate(selectedBooking.date)} at {selectedBooking.time}</p>
                      <p><strong>Seats:</strong> {selectedBooking.seats.join(', ')}</p>
                      <p><strong>Booking Date:</strong> {formatDate(selectedBooking.bookingDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Snacks */}
                {selectedBooking.snacks && selectedBooking.snacks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Snacks & Beverages</h4>
                    <div className="space-y-2">
                      {selectedBooking.snacks.map((snack, index) => (
                        <div key={index} className="flex justify-between items-center text-gray-300">
                          <span>{snack.name} x {snack.quantity}</span>
                          <span>${snack.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold text-white">
                    <span>Total Amount</span>
                    <span>${selectedBooking.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  {selectedBooking.status === 'confirmed' && (
                    <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                      Cancel Booking
                    </button>
                  )}
                  <button className="flex-1 bg-brand-red text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
                    Download Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
