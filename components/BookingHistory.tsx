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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string>('');
  const [movieRatingData, setMovieRatingData] = useState<
    | null
    | {
        averageRating?: number;
        totalRatings?: number;
        userRating?: { rating: number; review?: string; createdAt?: string } | null;
      }
  >(null);

  useEffect(() => {
    fetchBookings();
  }, []); // Only fetch once on component mount

  // Fetch user's rating for the selected booking's movie when a booking is opened
  useEffect(() => {
    const loadUserRating = async () => {
      if (!selectedBooking) {
        setMovieRatingData(null);
        return;
      }
      try {
        const movieId = (selectedBooking as any)?.movie?.movieId || (selectedBooking as any)?.movie?._id;
        if (!movieId) return;
        const resp = await apiService.getMovieRating(movieId);
        if (resp?.success) {
          setMovieRatingData(resp.data as any);
          if ((resp.data as any)?.userRating?.rating) {
            setUserRating((resp.data as any).userRating.rating);
            setRatingMessage('You have already rated this movie.');
            return;
          } else {
            setRatingMessage('');
          }
        }

        // Fallback: fetch user's ratings list and match by movieId
        const userRatingsResp = await apiService.getUserRatings(1, 100);
        const ratingsList = (userRatingsResp as any)?.data?.ratings || [];
        const found = ratingsList.find((r: any) => {
          const id = r?.movieId?._id || r?.movieId;
          return id?.toString?.() === movieId?.toString?.();
        });
        if (found?.rating) {
          setMovieRatingData(prev => ({ ...(prev || {}), userRating: { rating: found.rating, review: found.review, createdAt: found.createdAt } }));
          setUserRating(found.rating);
          setRatingMessage('You have already rated this movie.');
        }
      } catch {
        // ignore rating fetch errors in modal
      }
    };
    loadUserRating();
  }, [selectedBooking]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all user bookings across pages so Completed tab isn't truncated by pagination
      const all: Booking[] = [] as any;
      let page = 1;
      const limit = 50; // fetch in reasonable batches
      // Loop until API reports no next page
      // Note: apiService returns pagination info in response
      /* eslint-disable no-constant-condition */
      while (true) {
        const resp = await apiService.getUserBookings({ page, limit });
        if (!resp.success) {
          setError(resp.error || 'Failed to fetch bookings');
          break;
        }
        const batch = (resp.data as any[]) || [];
        all.push(...(batch as any));
        const hasNext = (resp as any).pagination?.hasNext === true;
        if (!hasNext || batch.length === 0) break;
        page += 1;
      }

      setBookings(all);
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
        setPopupMessage('Booking cancelled successfully!');
        setShowSuccessPopup(true);
      } else {
        setPopupMessage(response.error || 'Failed to cancel booking');
        setShowErrorPopup(true);
      }
    } catch (err: any) {
      setPopupMessage(err.message || 'Failed to cancel booking');
      setShowErrorPopup(true);
    } finally {
      setCancelling(null);
    }
  };


  // Get the display status for a booking (shows "Completed" for watched confirmed bookings)
  const getDisplayStatus = (booking: Booking) => {
    if (booking.status === 'confirmed' && isMovieWatched(booking)) {
      return 'completed';
    }
    return booking.status;
  };

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

  // Generate QR code URL (same as BookingConfirmationPage)
  const getQRCodeUrl = (booking: Booking) => {
    const qrData = {
      bookingId: booking.bookingId,
      movie: booking.movie.title,
      theatre: booking.theatre.name,
      screen: booking.theatre.theatreId, // Using theatreId as screen info
      showtime: booking.showtime.date + ' ' + booking.showtime.time,
      seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', '),
      totalAmount: booking.pricing.totalAmount,
      status: booking.status
    };
    
    const qrText = `Booking ID: ${qrData.bookingId}\nMovie: ${qrData.movie}\nTheatre: ${qrData.theatre}\nScreen: ${qrData.screen}\nShowtime: ${qrData.showtime}\nSeats: ${qrData.seats}\nTotal: ₹${qrData.totalAmount}\nStatus: ${qrData.status}`;
    
    // Use QR Server API to generate QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
  };

  // Check if movie has been watched (showtime has passed)
  const isMovieWatched = (booking: Booking) => {
    const now = new Date();

    // Parse the showtime date and time robustly
    let showDateTime: Date;
    try {
      let dateStr: string = booking.showtime.date as any;
      let timeStr: string = (booking.showtime.time || '').toString();

      // Normalize inputs
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0];
      } else if (typeof dateStr === 'string') {
        dateStr = dateStr.trim();
        if (dateStr.includes('T')) {
          // If ISO, just use the date part
          dateStr = dateStr.split('T')[0];
        }
      }

      timeStr = timeStr.trim().replace(/\s+/g, ' ');

      // Try patterns in order of specificity
      let normalized24h = '';

      // Case 1: 24h with seconds e.g. 19:05:00
      let m = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (m) {
        const h = Math.min(23, parseInt(m[1]));
        const min = Math.min(59, parseInt(m[2]));
        const sec = m[3] ? Math.min(59, parseInt(m[3])) : 0;
        normalized24h = `${h.toString().padStart(2, '0')}:${min
          .toString()
          .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      } else {
        // Case 2: 12h with AM/PM, with or without minutes, with/without space
        const ampm = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
        if (ampm) {
          let hours = parseInt(ampm[1]);
          const minutes = ampm[2] ? parseInt(ampm[2]) : 0;
          const period = ampm[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          normalized24h = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:00`;
        }
      }

      // Fallback if time missing or unparsable: assume end of day 23:59
      if (!normalized24h) {
        normalized24h = '23:59:00';
      }

      const candidate = new Date(`${dateStr}T${normalized24h}`);
      showDateTime = isNaN(candidate.getTime())
        ? new Date(booking.showtime.date)
        : candidate;
    } catch (error) {
      console.error('Error parsing showtime in isMovieWatched:', error);
      showDateTime = new Date(booking.showtime.date);
    }

    return now.getTime() > showDateTime.getTime();
  };

  // Filter bookings based on the selected filter
  const filteredBookings = bookings.filter(booking => {
    const statusNorm = (booking.status as unknown as string)?.toString().toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'confirmed') {
      // Upcoming: confirmed bookings that haven't been watched yet
      return statusNorm === 'confirmed' && !isMovieWatched(booking);
    }
    if (filter === 'completed') {
      // Completed: either explicitly marked completed OR confirmed bookings whose showtime has passed
      return statusNorm === 'completed' || (statusNorm === 'confirmed' && isMovieWatched(booking));
    }
    if (filter === 'cancelled') {
      // Cancelled: any booking with cancelled status
      return statusNorm === 'cancelled';
    }
    return false;
  });

  // Handle rating submission
  const handleRatingSubmit = async (rating: number) => {
    if (!selectedBooking) return;
    
    try {
      setIsSubmittingRating(true);
      
      console.log('Selected booking for rating:', selectedBooking);
      console.log('Movie ID:', selectedBooking.movie.movieId);
      console.log('Booking ID:', selectedBooking.bookingId);
      
      // Submit rating to backend
      const response = await apiService.submitMovieRating(
        selectedBooking.movie.movieId,
        rating,
        undefined, // review (optional)
        selectedBooking.bookingId
      );
      
      if (response.success) {
        setPopupMessage(`Thank you for rating "${selectedBooking.movie.title}" ${rating}/10!`);
        setShowSuccessPopup(true);
        setUserRating(rating);
        setMovieRatingData((prev) => ({ ...(prev || {}), userRating: { rating } }));
      } else {
        setPopupMessage(response.error || 'Failed to submit rating. Please try again.');
        setShowErrorPopup(true);
      }
    } catch (error) {
      const err: any = error;
      const msg = err?.message || '';
      if (/already rated/i.test(msg)) {
        // Refresh current rating and show inline message instead
        try {
          const movieId = (selectedBooking as any)?.movie?.movieId || (selectedBooking as any)?.movie?._id;
          if (movieId) {
            const resp = await apiService.getMovieRating(movieId);
            if (resp?.success) {
              setMovieRatingData(resp.data as any);
              if ((resp.data as any)?.userRating?.rating) {
                setUserRating((resp.data as any).userRating.rating);
              }
            }
          }
        } catch {}
        setRatingMessage('You have already rated this movie.');
      } else {
        setPopupMessage('Failed to submit rating. Please try again.');
        setShowErrorPopup(true);
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const isCancellable = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    
    const now = new Date();
    
    // Parse the showtime date and time properly
    let showDateTime;
    try {
      let dateStr = booking.showtime.date; // e.g., "2025-10-20" or Date object
      const timeStr = booking.showtime.time; // e.g., "7:00 PM"
      
      // Ensure dateStr is a string
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]; // Extract just the date part
      }
      
      // Convert time to 24-hour format if needed
      let time24 = timeStr;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const period = timeMatch[3].toUpperCase();

          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }

          time24 = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      // Create the full datetime string
      const dateTimeStr = `${dateStr}T${time24}:00`;
      showDateTime = new Date(dateTimeStr);
      
      if (isNaN(showDateTime.getTime())) {
        // Fallback to just the date if time parsing fails
        showDateTime = new Date(booking.showtime.date);
      }
    } catch (error) {
      console.error('Error parsing showtime in isCancellable:', error);
      // Fallback to just the date if parsing fails
      showDateTime = new Date(booking.showtime.date);
    }
    
    const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('Frontend isCancellable calculation:', {
      bookingId: booking.bookingId,
      now: now.toISOString(),
      showDateTime: isNaN(showDateTime.getTime()) ? 'Invalid Date' : showDateTime.toISOString(),
      hoursUntilShow: hoursUntilShow,
      canCancel: hoursUntilShow > 2
    });
    
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
                  src={booking.movie.posterUrl || (booking as any)?.movie?.poster || '/vite.svg'}
                  alt={booking.movie.title}
                  className="w-16 h-24 object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/vite.svg';
                  }}
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
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(booking))}`}>
                        <i className={`fa ${getStatusIcon(getDisplayStatus(booking))} mr-1`}></i>
                        {getDisplayStatus(booking).charAt(0).toUpperCase() + getDisplayStatus(booking).slice(1)}
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
                    src={selectedBooking.movie.posterUrl || (selectedBooking as any)?.movie?.poster || '/vite.svg'}
                    alt={selectedBooking.movie.title}
                    className="w-24 h-36 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/vite.svg';
                    }}
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

                {/* Cancellation Info - Only show if booking is actually cancelled */}
                {selectedBooking.status === 'cancelled' && selectedBooking.cancellation && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Cancellation Details</h4>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Cancelled At:</strong> {formatDate(selectedBooking.cancellation.cancelledAt)}</p>
                      <p><strong>Reason:</strong> {selectedBooking.cancellation.reason || 'Not specified'}</p>
                      <p><strong>Cancelled By:</strong> {selectedBooking.cancellation.cancelledBy || 'User'}</p>
                      {selectedBooking.cancellation.refundEligible && (
                        <p><strong>Refund Amount:</strong> ₹{(selectedBooking.pricing.totalAmount - selectedBooking.cancellation.cancellationFee).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code - Show for confirmed bookings that haven't been watched yet */}
                {selectedBooking.status === 'confirmed' && !isMovieWatched(selectedBooking) && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-400 mb-2">Ticket QR Code</h4>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <img
                          src={getQRCodeUrl(selectedBooking)}
                          alt="Booking QR Code"
                          className="w-32 h-32 rounded"
                          onError={(e) => {
                            console.error('QR Code failed to load');
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-300 text-center">
                        Show this QR code at the theatre entrance
                      </p>
                      <p className="text-xs text-gray-400 text-center">
                        Booking ID: {selectedBooking.bookingId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Movie Rating - Show for watched movies (if already rated, show summary) */}
                {selectedBooking.status === 'confirmed' && isMovieWatched(selectedBooking) && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-400 mb-2">Rate Your Experience</h4>
                    {movieRatingData?.userRating?.rating ? (
                      <div className="flex flex-wrap items-center gap-3 text-gray-100">
                        <span className="text-2xl font-bold">{movieRatingData.userRating.rating}/10</span>
                        <span className="text-gray-300">for "{selectedBooking.movie.title}"</span>
                        <span className="text-sm text-gray-400">You have already rated this movie.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        <p className="text-sm text-gray-300 text-center">
                          How was your experience watching "{selectedBooking.movie.title}"?
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleRatingSubmit(rating)}
                              disabled={isSubmittingRating}
                              className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center text-sm font-medium ${
                                userRating >= rating
                                  ? 'bg-yellow-400 border-yellow-400 text-black hover:bg-yellow-300'
                                  : 'bg-transparent border-gray-400 text-gray-400 hover:border-yellow-400 hover:text-yellow-400'
                              } ${isSubmittingRating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        {userRating > 0 && (
                          <p className="text-sm text-green-400">
                            Thank you for rating this movie {userRating}/10!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Booking Info -> Show user's rating instead */}
                {selectedBooking.status === 'completed' && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Your Rating</h4>
                    {movieRatingData?.userRating?.rating ? (
                      <div className="flex items-center space-x-3 text-gray-100">
                        <span className="text-2xl font-bold">{movieRatingData.userRating.rating}/10</span>
                        <span className="text-gray-300">for "{selectedBooking.movie.title}"</span>
                        {ratingMessage && (
                          <span className="text-sm text-gray-400">{ratingMessage}</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-gray-300">{ratingMessage || "You haven't rated this movie yet. Rate your experience:"}</p>
                        <div className="flex flex-wrap gap-2">
                          {[1,2,3,4,5,6,7,8,9,10].map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRatingSubmit(r)}
                              disabled={isSubmittingRating}
                              className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center text-sm font-medium ${
                                userRating >= r
                                  ? 'bg-yellow-400 border-yellow-400 text-black hover:bg-yellow-300'
                                  : 'bg-transparent border-gray-400 text-gray-400 hover:border-yellow-400 hover:text-yellow-400'
                              } ${isSubmittingRating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                  {/* Cancel button - only show for confirmed bookings that haven't been watched and are cancellable */}
                  {selectedBooking.status === 'confirmed' && !isMovieWatched(selectedBooking) && isCancellable(selectedBooking) && (
                    <button 
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {/* Cannot cancel button - only show for confirmed bookings that haven't been watched but are not cancellable */}
                  {selectedBooking.status === 'confirmed' && !isMovieWatched(selectedBooking) && !isCancellable(selectedBooking) && (
                    <button 
                      disabled
                      className="flex-1 bg-gray-600 text-gray-300 py-2 px-4 rounded-md cursor-not-allowed"
                    >
                      Cannot Cancel (Less than 2 hours before show)
                    </button>
                  )}
                  {/* Download Ticket button - show for all bookings */}
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

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 text-xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Success!</h3>
              <p className="text-gray-600 text-center mb-6">{popupMessage}</p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {showErrorPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Error</h3>
              <p className="text-gray-600 text-center mb-6">{popupMessage}</p>
              <button
                onClick={() => setShowErrorPopup(false)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

export default BookingHistory;
