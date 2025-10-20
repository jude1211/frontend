import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Booking {
  _id: string;
  bookingId: string;
  movie: {
    _id: string;
    title: string;
    posterUrl: string;
  };
  theatre: {
    name: string;
    theatreId: string;
  };
  showtime: {
    date: string;
    time: string;
  };
  seats: Array<{
    seatNumber: string;
    row: string;
    seatType: string;
    price: number;
  }>;
  pricing: {
    totalAmount: number;
  };
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  snacks?: Array<{
    name: string;
    quantity: number;
    totalPrice: number;
  }>;
  cancellation?: {
    cancelledAt: string;
    reason: string;
    cancelledBy: string;
    refundEligible: boolean;
    cancellationFee: number;
  };
}

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUserBookings({
        status: filter === 'all' ? undefined : filter
      });
      
      if (response.success) {
        setBookings(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setCancelling(selectedBooking.bookingId);
      
      const response = await apiService.cancelBooking(
        selectedBooking.bookingId, 
        cancelReason || undefined
      );
      
      if (response.success) {
        // Refresh bookings list
        await fetchBookings();
        setSelectedBooking(null);
        setShowCancelModal(false);
        setCancelReason('');
        alert('Booking cancelled successfully!');
      } else {
        alert(response.error || 'Failed to cancel booking');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

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

  const formatSeats = (seats: Booking['seats']) => {
    return seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ');
  };

  const isCancellable = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    
    const now = new Date();
    const showDate = new Date(booking.showtime.date);
    const hoursUntilShow = (showDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilShow > 2; // Can cancel up to 2 hours before show
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <i className="fa fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
        <h3 className="text-xl font-semibold text-white mb-2">Error loading bookings</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchBookings}
          className="bg-brand-red text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

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
              key={booking._id}
              className="bg-brand-dark rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex items-start space-x-4">
                {/* Movie Poster */}
                <img
                  src={booking.movie.posterUrl}
                  alt={booking.movie.title}
                  className="w-16 h-24 object-cover rounded-md"
                />

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {booking.movie.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">{booking.theatre.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>
                          <i className="fa fa-calendar mr-1"></i>
                          {formatDate(booking.showtime.date)}
                        </span>
                        <span>
                          <i className="fa fa-clock mr-1"></i>
                          {booking.showtime.time}
                        </span>
                        <span>
                          <i className="fa fa-chair mr-1"></i>
                          {formatSeats(booking.seats)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        <i className={`fa ${getStatusIcon(booking.status)} mr-1`}></i>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                      <p className="text-xl font-bold text-white mt-2">
                        ₹{booking.pricing.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Booking ID: {booking.bookingId}
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
                  onClick={() => {
                    setSelectedBooking(null);
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Booking Info */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedBooking.movie.posterUrl}
                    alt={selectedBooking.movie.title}
                    className="w-24 h-36 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedBooking.movie.title}
                    </h3>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Theatre:</strong> {selectedBooking.theatre.name}</p>
                      <p><strong>Date & Time:</strong> {formatDate(selectedBooking.showtime.date)} at {selectedBooking.showtime.time}</p>
                      <p><strong>Seats:</strong> {formatSeats(selectedBooking.seats)}</p>
                      <p><strong>Booking Date:</strong> {formatDate(selectedBooking.createdAt)}</p>
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
                          <span>₹{snack.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancellation Info */}
                {selectedBooking.cancellation && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Cancellation Details</h4>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Cancelled At:</strong> {formatDate(selectedBooking.cancellation.cancelledAt)}</p>
                      <p><strong>Reason:</strong> {selectedBooking.cancellation.reason}</p>
                      <p><strong>Cancelled By:</strong> {selectedBooking.cancellation.cancelledBy}</p>
                      {selectedBooking.cancellation.refundEligible && (
                        <p><strong>Refund Amount:</strong> ₹{(selectedBooking.pricing.totalAmount - selectedBooking.cancellation.cancellationFee).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold text-white">
                    <span>Total Amount</span>
                    <span>₹{selectedBooking.pricing.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  {selectedBooking.status === 'confirmed' && isCancellable(selectedBooking) && (
                    <button 
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {selectedBooking.status === 'confirmed' && !isCancellable(selectedBooking) && (
                    <button 
                      disabled
                      className="flex-1 bg-gray-600 text-gray-300 py-2 px-4 rounded-md cursor-not-allowed"
                    >
                      Cannot Cancel (Less than 2 hours before show)
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

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Cancel Booking</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                  rows={3}
                  placeholder="Please provide a reason for cancellation..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling === selectedBooking.bookingId}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling === selectedBooking.bookingId ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
