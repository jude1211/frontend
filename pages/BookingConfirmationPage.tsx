import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import BookNViewLoader from '../components/BookNViewLoader';

interface BookingDetails {
  bookingId: string;
  movie: {
    title: string;
    poster: string;
  };
  theatre: {
    name: string;
    screen: {
      screenNumber: number;
      screenType: string;
    };
  };
  showtime: {
    date: string;
    time: string;
  };
  seats: Array<{
    seatNumber: string;
    row: string;
    price: number;
  }>;
  pricing: {
    totalAmount: number;
    currency: string;
  };
  status: string;
  createdAt: string;
}

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  // Generate QR code URL
  const getQRCodeUrl = (bookingData: BookingDetails) => {
    const qrData = {
      bookingId: bookingData.bookingId,
      movie: bookingData.movie.title,
      theatre: bookingData.theatre.name,
      screen: bookingData.theatre.screen.screenNumber,
      showtime: bookingData.showtime.date + ' ' + bookingData.showtime.time,
      seats: bookingData.seats.map(s => s.seatNumber).join(', '),
      totalAmount: bookingData.pricing.totalAmount,
      status: bookingData.status
    };
    
    const qrText = `Booking ID: ${qrData.bookingId}\nMovie: ${qrData.movie}\nTheatre: ${qrData.theatre}\nScreen: ${qrData.screen}\nShowtime: ${qrData.showtime}\nSeats: ${qrData.seats}\nTotal: ₹${qrData.totalAmount}\nStatus: ${qrData.status}`;
    
    // Use QR Server API to generate QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
  };


  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiService.getBooking(bookingId);
        
        if (response.success && response.data) {
          console.log('Booking data received:', response.data);
          console.log('Theatre name:', response.data.theatre?.name);
          console.log('Booking status:', response.data.status);
          console.log('Showtime date:', response.data.showtime?.date);
          console.log('Showtime time:', response.data.showtime?.time);
          console.log('Full showtime object:', response.data.showtime);
          setBooking(response.data);
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string) => {
    // Handle different time formats
    if (!timeString) return 'N/A';
    
    // If it's already in 12-hour format (e.g., "2:30 PM"), return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    // If it's in 24-hour format, convert to 12-hour
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      if (isNaN(time.getTime())) {
        return timeString; // Return original if parsing fails
      }
      return time.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString; // Return original if conversion fails
    }
  };

  // Check if booking is cancellable (BookMyShow-like policy)
  const isBookingCancellable = (bookingData: BookingDetails) => {
    console.log('Checking if booking is cancellable:', {
      bookingData,
      status: bookingData?.status,
      hasBooking: !!bookingData
    });
    
    if (!bookingData || bookingData.status !== 'confirmed') {
      console.log('Booking not cancellable: no booking data or status not confirmed');
      return false;
    }
    
    const now = new Date();
    
    // Parse the showtime date and time properly
    let showDateTime: Date;
    try {
      // Combine date and time to create a proper datetime
      let dateStr = bookingData.showtime.date; // e.g., "2025-10-20" or Date object
      const timeStr = bookingData.showtime.time; // e.g., "7:00 PM"
      
      // Ensure dateStr is a string
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]; // Extract just the date part
      }
      
      console.log('Parsing showtime:', { 
        originalDate: bookingData.showtime.date, 
        dateStr, 
        timeStr, 
        dateType: typeof dateStr,
        timeType: typeof timeStr 
      });
      
      // Convert time to 24-hour format if needed
      let time24 = timeStr;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        try {
          // Parse the time string properly
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
            console.log('Time conversion successful:', { original: timeStr, converted: time24 });
          } else {
            console.error('Could not parse time string:', timeStr);
            return false;
          }
        } catch (error) {
          console.error('Error converting time to 24-hour format:', error);
          return false;
        }
      }
      
      // Create the full datetime string
      const dateTimeStr = `${dateStr}T${time24}:00`;
      console.log('Creating datetime string:', { dateStr, time24, dateTimeStr });
      showDateTime = new Date(dateTimeStr);
      
      console.log('Parsed datetime:', { 
        dateTimeStr, 
        showDateTime: isNaN(showDateTime.getTime()) ? 'Invalid Date' : showDateTime.toISOString() 
      });
      
      if (isNaN(showDateTime.getTime())) {
        console.error('Invalid showtime date:', dateTimeStr);
        // Try alternative parsing
        try {
          const altDateTime = new Date(`${dateStr} ${timeStr}`);
          if (!isNaN(altDateTime.getTime())) {
            showDateTime = altDateTime;
            console.log('Using alternative parsing:', altDateTime.toISOString());
          } else {
            return false;
          }
        } catch (altError) {
          console.error('Alternative parsing also failed:', altError);
          return false;
        }
      }
      
      const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('Time calculation:', {
      now: now.toISOString(),
        showDateTime: showDateTime.toISOString(),
      hoursUntilShow: hoursUntilShow,
      canCancel: hoursUntilShow > 2
    });
    
    return hoursUntilShow > 2; // Can cancel up to 2 hours before show
    } catch (error) {
      console.error('Error parsing showtime:', error);
      return false;
    }
  };

  // Calculate cancellation policy
  const calculateCancellationPolicy = (bookingData: BookingDetails) => {
    if (!bookingData) return null;
    
    const now = new Date();
    
    // Parse the showtime date and time properly (same logic as isBookingCancellable)
    let showDateTime: Date;
    try {
      let dateStr = bookingData.showtime.date;
      const timeStr = bookingData.showtime.time;
      
      // Ensure dateStr is a string
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]; // Extract just the date part
      }
      
      // Convert time to 24-hour format if needed
      let time24 = timeStr;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        try {
          // Parse the time string properly
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
          } else {
            console.error('Could not parse time string:', timeStr);
            return {
              canCancel: false,
              hoursUntilShow: 0,
              cancellationFee: 0,
              refundAmount: 0,
              message: 'Invalid time format'
            };
          }
        } catch (error) {
          console.error('Error converting time to 24-hour format:', error);
          return {
            canCancel: false,
            hoursUntilShow: 0,
            cancellationFee: 0,
            refundAmount: 0,
            message: 'Time conversion error'
          };
        }
      }
      
      const dateTimeStr = `${dateStr}T${time24}:00`;
      showDateTime = new Date(dateTimeStr);
      
      if (isNaN(showDateTime.getTime())) {
        console.error('Invalid showtime date for policy calculation:', dateTimeStr);
        // Try alternative parsing
        try {
          const altDateTime = new Date(`${dateStr} ${timeStr}`);
          if (!isNaN(altDateTime.getTime())) {
            showDateTime = altDateTime;
            console.log('Using alternative parsing for policy:', altDateTime.toISOString());
          } else {
            return {
              canCancel: false,
              hoursUntilShow: 0,
              cancellationFee: 0,
              refundAmount: 0,
              message: 'Invalid showtime'
            };
          }
        } catch (altError) {
          console.error('Alternative parsing also failed for policy:', altError);
          return {
            canCancel: false,
            hoursUntilShow: 0,
            cancellationFee: 0,
            refundAmount: 0,
            message: 'Invalid showtime'
          };
        }
      }
      const hoursUntilShow = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let policy = {
      canCancel: hoursUntilShow > 2,
      hoursUntilShow: Math.round(hoursUntilShow * 10) / 10,
      cancellationFee: 0,
      refundAmount: bookingData.pricing.totalAmount,
      message: ''
    };
    
    if (hoursUntilShow > 24) {
      // More than 24 hours: No cancellation fee
      policy.cancellationFee = 0;
      policy.refundAmount = bookingData.pricing.totalAmount;
      policy.message = 'Full refund available';
    } else if (hoursUntilShow > 2) {
      // 2-24 hours: 10% cancellation fee
      policy.cancellationFee = Math.round(bookingData.pricing.totalAmount * 0.1);
      policy.refundAmount = bookingData.pricing.totalAmount - policy.cancellationFee;
      policy.message = '10% cancellation fee applies';
    } else {
      // Less than 2 hours: Cannot cancel
      policy.canCancel = false;
      policy.message = 'Cannot cancel within 2 hours of showtime';
    }
    
    return policy;
    } catch (error) {
      console.error('Error parsing showtime for policy:', error);
      return {
        canCancel: false,
        hoursUntilShow: 0,
        cancellationFee: 0,
        refundAmount: 0,
        message: 'Error parsing showtime'
      };
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    console.log('=== CANCEL BOOKING ATTEMPT ===');
    console.log('Booking:', booking);
    console.log('Is cancellable:', isBookingCancellable(booking));
    console.log('Cancel reason:', cancelReason);
    
    if (!booking || !isBookingCancellable(booking)) {
      console.log('Booking not cancellable:', { booking, cancellable: isBookingCancellable(booking) });
      setPopupMessage('This booking cannot be cancelled. Please check the cancellation policy.');
      setShowErrorPopup(true);
      return;
    }
    
    console.log('Proceeding with cancellation for booking:', booking.bookingId);
    setIsCancelling(true);
    
    try {
      console.log('Calling API to cancel booking...');
      const response = await apiService.cancelBooking(booking.bookingId, cancelReason);
      console.log('Cancel booking response:', response);
      
      if (response.success) {
        console.log('Booking cancelled successfully');
        // Update booking status
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
        setShowCancelModal(false);
        setCancelReason('');
        setPopupMessage('Booking cancelled successfully! Refund will be processed within 3-5 business days.');
        setShowSuccessPopup(true);
      } else {
        console.error('Cancel booking failed:', response.error);
        setPopupMessage(response.error || 'Failed to cancel booking');
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setPopupMessage(`Failed to cancel booking: ${error.message || 'Please try again.'}`);
      setShowErrorPopup(true);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <BookNViewLoader />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error || 'Booking not found'}</div>
          <button 
            onClick={() => navigate('/')} 
            className="bg-brand-red text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">Booking Confirmed!</h1>
          <p className="text-brand-light-gray text-lg">
            Your tickets have been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40 shadow-2xl mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Movie Info */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <img
                  src={booking.movie.poster || '/placeholder-movie.jpg'}
                  alt={booking.movie.title}
                  className="w-32 h-48 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                  }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-4">{booking.movie.title}</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-brand-red mr-3">🎬</span>
                    <span className="text-brand-light-gray">{booking.theatre.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-brand-red mr-3">🖥️</span>
                    <span className="text-brand-light-gray">
                      Screen {booking.theatre.screen.screenNumber} ({booking.theatre.screen.screenType})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-brand-red mr-3">📅</span>
                    <span className="text-brand-light-gray">{formatDate(booking.showtime.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-brand-red mr-3">🕒</span>
                    <span className="text-brand-light-gray">{formatTime(booking.showtime.time)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-brand-dark rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Booking Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-brand-light-gray">Booking ID:</span>
                  <span className="text-white font-mono">{booking.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-light-gray">Status:</span>
                  <span className={`font-semibold ${
                    booking.status === 'confirmed' ? 'text-green-400' : 
                    booking.status === 'cancelled' ? 'text-red-400' : 
                    'text-yellow-400'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-light-gray">Cancellable:</span>
                  <span className={`font-semibold ${
                    isBookingCancellable(booking) ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isBookingCancellable(booking) ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-light-gray">Booked On:</span>
                  <span className="text-white">{formatDate(booking.createdAt)}</span>
                </div>
              </div>

              {/* Seats */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-3">Selected Seats</h4>
                <div className="flex flex-wrap gap-2">
                  {booking.seats.map((seat, index) => (
                    <div key={index} className="bg-brand-red text-white px-3 py-1 rounded-lg text-sm">
                      {seat.seatNumber} - ₹{seat.price}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 pt-4 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-white">Total Amount:</span>
                  <span className="text-2xl font-bold text-brand-red">
                    ₹{booking.pricing.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section - Only show for confirmed bookings */}
        {booking.status === 'confirmed' && (
          <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40 shadow-2xl mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-6">Digital Ticket</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img
                    src={getQRCodeUrl(booking)}
                    alt="Booking QR Code"
                    className="w-48 h-48"
                    onError={(e) => {
                      console.error('QR Code failed to load');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-brand-light-gray text-sm max-w-md">
                  Show this QR code at the theatre entrance for easy entry. 
                  The QR code contains all your booking details.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-brand-red text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 font-medium"
          >
            🏠 Back to Home
          </button>
          {/* Print Tickets button - Only show for confirmed bookings */}
          {booking.status === 'confirmed' && (
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
            >
              🖨️ Print Tickets
            </button>
          )}
          
          
          {isBookingCancellable(booking) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-medium"
            >
              ❌ Cancel Booking
            </button>
          )}
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {booking && (
                <div className="mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h4>
                    {(() => {
                      const policy = calculateCancellationPolicy(booking);
                      return (
                        <div className="text-sm text-gray-700">
                          <p><strong>Show Time:</strong> {formatDate(booking.showtime.date)} at {formatTime(booking.showtime.time)}</p>
                          <p><strong>Time Until Show:</strong> {policy?.hoursUntilShow} hours</p>
                          <p><strong>Policy:</strong> {policy?.message}</p>
                          {policy?.canCancel && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p><strong>Refund Details:</strong></p>
                              <p>• Cancellation Fee: ₹{policy.cancellationFee}</p>
                              <p>• Refund Amount: ₹{policy.refundAmount}</p>
                              <p>• Refund will be processed within 3-5 business days</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Cancellation (Optional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please tell us why you're cancelling..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={isCancelling || !isBookingCancellable(booking)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    isCancelling || !isBookingCancellable(booking)
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isCancelling ? 'Cancelling...' : 
                   !isBookingCancellable(booking) ? 'Cannot Cancel' : 
                   'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{popupMessage}</p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Error Popup */}
        {showErrorPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
                <p className="text-gray-600 mb-6">{popupMessage}</p>
                <button
                  onClick={() => setShowErrorPopup(false)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
