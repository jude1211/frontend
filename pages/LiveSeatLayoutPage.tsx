import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { socketService } from '../services/socketService';
import SeatLayoutBuilder, { SeatLayoutConfig } from '../components/SeatLayoutBuilder';
import BookNViewLoader from '../components/BookNViewLoader';

interface Movie {
  _id: string;
  title: string;
  posterUrl: string;
  genre: string;
  language: string;
  duration: string;
  status: string;
}

interface Screen {
  screenId: string;
  screenName?: string;
  screenType?: string;
  showGroups: ShowGroup[];
}

interface ShowGroup {
  bookingDate: string;
  showtimes: string[];
  theatre?: string;
  theatreId?: string;
  availableSeats?: number;
}

const LiveSeatLayoutPage: React.FC = () => {
  const { movieId, screenId, bookingDate, showtime } = useParams<{
    movieId: string;
    screenId: string;
    bookingDate: string;
    showtime: string;
  }>();
  
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [seatLayout, setSeatLayout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{bookingId: string, totalAmount: number} | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [desiredTicketCount, setDesiredTicketCount] = useState<number>(1);
  const [isEditingTicketCount, setIsEditingTicketCount] = useState<boolean>(false);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [contactDetails, setContactDetails] = useState({
    email: '',
    mobileNumber: '',
    countryCode: '+91'
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const MAX_SEATS = 10; // Maximum number of seats that can be selected

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) return;
      
      try {
        setIsLoading(true);
        const response = await apiService.getMovie(movieId);
        if (response.success && response.data) {
          setMovie({
            _id: response.data._id,
            title: response.data.title,
            posterUrl: response.data.posterUrl,
            genre: Array.isArray(response.data.genre) ? response.data.genre.join('/') : (response.data.genre || ''),
            language: response.data.movieLanguage || 'English',
            duration: response.data.duration,
            status: response.data.status
          });
        } else {
          setError('Movie not found');
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Failed to fetch movie details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  // Fetch screen details and showtimes
  useEffect(() => {
    const fetchScreenDetails = async () => {
      if (!movieId) return;
      
      try {
        const response = await apiService.getMovieShowtimes(movieId);
        if (response.success && Array.isArray(response.data)) {
          const foundScreen = response.data.find((s: any) => s.screenId === screenId);
          if (foundScreen) {
            setScreen(foundScreen);
          } else {
            setError('Screen not found');
          }
        } else {
          setError('Failed to fetch screen details');
        }
      } catch (err) {
        console.error('Error fetching screen details:', err);
        setError('Failed to fetch screen details');
      }
    };

    fetchScreenDetails();
  }, [movieId, screenId]);

  // Fetch seat layout and reserved seats
  useEffect(() => {
    const fetchSeatData = async () => {
      if (!screenId) return;

      try {
        setIsLoadingLayout(true);
        
        // Fetch seat layout
        const layoutRes = await apiService.getPublicScreenLayout(screenId);
        if (layoutRes.success && layoutRes.data) {
          setSeatLayout(layoutRes.data);
          console.log('Fetched seat layout for screen:', screenId, layoutRes.data);
        } else {
          setError('Seat layout not available');
        }

        // Fetch live seat layout to get reserved seats
        const liveRes = await apiService.getLiveSeatLayout(screenId, bookingDate || '', showtime || '');
        if (liveRes.success && liveRes.data) {
          const reserved = new Set<string>();
          
          // The API returns reservedSeats as an array of seat numbers (e.g., ["J6", "J8"])
          if (liveRes.data.reservedSeats && Array.isArray(liveRes.data.reservedSeats)) {
            liveRes.data.reservedSeats.forEach((seatNumber: string) => {
              reserved.add(seatNumber);
            });
          }
          
          // Also check the seats object if it exists (fallback)
          if (liveRes.data.seats && typeof liveRes.data.seats === 'object') {
            Object.values(liveRes.data.seats).forEach((seat: any) => {
              if (seat.status === 'reserved' || seat.isReserved) {
                reserved.add(`${seat.rowLabel}-${seat.number}`);
              }
            });
          }
          
          setReservedSeats(reserved);
          console.log('Fetched reserved seats:', Array.from(reserved));
          console.log('Full API response:', liveRes.data);
        }
      } catch (err) {
        console.error('Error fetching seat data:', err);
        setError('Failed to fetch seat layout');
      } finally {
        setIsLoadingLayout(false);
      }
    };

    fetchSeatData();
  }, [screenId, bookingDate, showtime]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!screenId || !bookingDate || !showtime) return;

    // Connect to Socket.IO
    const socket = socketService.connect();

    // Join the show room
    socketService.joinShow(screenId, bookingDate, showtime);

    // Listen for seat updates
    const handleSeatUpdate = (data: any) => {
      console.log('📡 Received real-time seat update:', data);
      
      // Update reserved seats - replace the entire set with the latest data
      if (data.reservedSeats && Array.isArray(data.reservedSeats)) {
        const newReservedSeats = new Set<string>();
        data.reservedSeats.forEach((seat: any) => {
          // Handle both object format {seatNumber: "A-1"} and string format "A-1"
          const seatKey = typeof seat === 'string' ? seat : seat.seatNumber;
          newReservedSeats.add(seatKey);
        });
        
        console.log('🔄 Processed reserved seats:', Array.from(newReservedSeats));
        
        // Only update if there are actual changes
        const currentReservedArray = Array.from(reservedSeats).sort();
        const newReservedArray = Array.from(newReservedSeats).sort();
        
        if (JSON.stringify(currentReservedArray) !== JSON.stringify(newReservedArray)) {
          setReservedSeats(newReservedSeats);
          setLastUpdateTime(new Date());
          
          // Show a brief notification
          console.log(`🔄 Seats updated: ${data.reservedSeats.length} seats reserved (${data.availableSeats || 0} available)`);
          console.log('🔄 New reserved seats set:', Array.from(newReservedSeats));
        }
      }
    };

    socketService.onSeatsUpdated(handleSeatUpdate);

    // Cleanup on unmount
    return () => {
      socketService.offSeatsUpdated(handleSeatUpdate);
      socketService.leaveShow(screenId, bookingDate, showtime);
    };
  }, [screenId, bookingDate, showtime, reservedSeats]);

  // Removed duplicate extended refresh - socket service handles all updates efficiently

  // Convert seat layout data to SeatLayoutBuilder format
  const seatLayoutConfig: SeatLayoutConfig | null = useMemo(() => {
    if (!seatLayout) return null;

    return {
      numRows: seatLayout.meta?.rows || 8,
      numCols: seatLayout.meta?.columns || 12,
      aisleColumns: seatLayout.meta?.aisles || [5, 9],
      seatClassRules: (seatLayout.seatClasses || []).map((seatClass: any) => ({
        rows: seatClass.rows || 'A-C',
        className: seatClass.className || 'Gold',
        price: seatClass.price || 250,
        tier: seatClass.tier || 'Premium',
        color: seatClass.color || '#f59e0b'
      }))
    };
  }, [seatLayout]);

  // Get available seats count (excluding reserved seats)
  const availableSeats = useMemo(() => {
    if (!seatLayout?.seats) return 0;
    
    // Count seats that are active and not reserved
    let availableCount = 0;
    Object.values(seatLayout.seats).forEach((seat: any) => {
      if (seat.isActive !== false) {
        const seatKey = `${seat.rowLabel}-${seat.number}`;
        // Only count as available if it's not reserved
        if (!reservedSeats.has(seatKey)) {
          availableCount++;
        }
      }
    });
    
    return availableCount;
  }, [seatLayout, reservedSeats]);

  const handleSeatClick = (seatId: string, meta: any) => {
    console.log('Seat clicked:', { seatId, meta, desiredTicketCount, selectedSeats: selectedSeats.length });
    
    // seatId is now the seatKey format (e.g., "A-1")
    const seatKey = seatId;
    
    // Don't allow selection of reserved seats
    if (reservedSeats.has(seatKey)) {
      console.log('Seat is reserved:', seatKey);
      return;
    }

    setSelectedSeats(prev => {
      console.log('Deselection check:', {
        seatId,
        selectedSeats: prev.map(s => ({ id: s.id, rowLabel: s.rowLabel, number: s.number })),
        existingIndex: prev.findIndex(s => s.id === seatId)
      });
      
      const existingIndex = prev.findIndex(s => s.id === seatId);
      
      if (existingIndex >= 0) {
        // Allow deselection - remove the seat
        console.log('Removing seat:', seatId, 'at index:', existingIndex);
        setBookingError(null);
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Check if we've reached the desired ticket count
        if (prev.length >= desiredTicketCount) {
          setBookingError(`You can select maximum ${desiredTicketCount} seats`);
          return prev;
        }
        
        // Check if we've reached the maximum limit
        if (prev.length >= MAX_SEATS) {
          setBookingError(`You can select maximum ${MAX_SEATS} seats at once`);
          return prev;
        }

        // Check if we should select consecutive seats (only on first selection)
        if (desiredTicketCount > 1 && prev.length === 0) {
          // Try to find consecutive seats starting from the clicked seat
          console.log('Consecutive seat selection attempt (first seat):', {
            desiredTicketCount,
            clickedSeat: { row: meta.rowLabel, number: meta.number }
          });
          
          const consecutiveSeats = getConsecutiveSeats(meta.rowLabel, meta.number, desiredTicketCount, []);
          console.log('Consecutive seats found:', consecutiveSeats);
          
          if (consecutiveSeats.length === desiredTicketCount) {
            console.log('Selecting consecutive seats:', consecutiveSeats);
            setBookingError(null);
            return consecutiveSeats;
          } else if (consecutiveSeats.length > 0) {
            // Partial consecutive selection
            console.log('Partial consecutive selection:', consecutiveSeats);
            setBookingError(`Found ${consecutiveSeats.length} consecutive seats. Select remaining seats individually.`);
            return consecutiveSeats;
          } else {
            // No consecutive seats available, fall back to single seat
            console.log('No consecutive seats available, selecting single seat');
            setBookingError(`Could not find ${desiredTicketCount} consecutive seats. Please select seats individually.`);
          }
        }

        // Single seat selection (fallback or when desiredTicketCount === 1)
        const newSeat = {
          id: seatKey, // Use seatKey as ID for consistency
          rowLabel: meta.rowLabel,
          number: meta.number,
          price: meta.seatClass?.price || 180,
          tier: meta.seatClass?.tier || 'Base',
          className: meta.seatClass?.className || 'Base'
        };
        
        console.log('Adding seat:', newSeat);
        console.log('Updated selectedSeats will be:', [...prev, newSeat]);
        setBookingError(null);
        return [...prev, newSeat];
      }
    });
  };

  const getConsecutiveSeats = (rowLabel: string, startColumn: number, count: number, currentSelections: any[]) => {
    if (!seatLayout || !seatLayout.config) return [];

    console.log('getConsecutiveSeats called:', {
      rowLabel,
      startColumn,
      count,
      seatLayoutKeys: Object.keys(seatLayout.seats || {}).slice(0, 10), // First 10 keys for debugging
      reservedSeats: Array.from(reservedSeats).slice(0, 10)
    });

    const consecutiveSeats: any[] = [];
    let currentColumn = startColumn;
    let seatsAdded = 0;

    // Create a set of already selected seat IDs for faster lookup
    const selectedSeatIds = new Set(currentSelections.map(s => s.id));

    // First, try to find consecutive seats to the right
    while (seatsAdded < count && currentColumn <= 20) { // Assuming max 20 columns
      const seatKey = `${rowLabel}-${currentColumn}`;
      
      // Check if seat exists in the layout and is available
      const seatExists = checkSeatExists(rowLabel, currentColumn);
      const isReserved = reservedSeats.has(seatKey);
      const isAlreadySelected = selectedSeatIds.has(`${rowLabel}-${currentColumn}`);
      
      console.log('Consecutive seat check:', {
        currentColumn,
        seatKey,
        seatExists,
        isReserved,
        isAlreadySelected,
        seatsAdded,
        count
      });
      
      if (seatExists && !isReserved && !isAlreadySelected) {
        const seatData = getSeatData(rowLabel, currentColumn);
        if (seatData) {
          consecutiveSeats.push({
            id: `${rowLabel}-${currentColumn}`, // This matches seatKey format
            rowLabel: rowLabel,
            number: currentColumn,
            price: seatData.price || 0,
            tier: seatData.tier,
            className: seatData.className
          });
          seatsAdded++;
          console.log('Added consecutive seat:', { rowLabel, currentColumn, seatData });
        }
      } else {
        // If we hit a reserved or non-existent seat, stop
        console.log('Stopping consecutive search:', { reason: !seatExists ? 'seat not exists' : isReserved ? 'reserved' : 'already selected' });
        break;
      }
      currentColumn++;
    }

    // If we couldn't get enough seats to the right, try to the left
    if (seatsAdded < count) {
      currentColumn = startColumn - 1;
      const leftSeats: any[] = [];
      
      while (seatsAdded < count && currentColumn >= 1) {
        const seatKey = `${rowLabel}-${currentColumn}`;
        
        const seatExists = checkSeatExists(rowLabel, currentColumn);
        const isReserved = reservedSeats.has(seatKey);
        const isAlreadySelected = selectedSeatIds.has(`${rowLabel}-${currentColumn}`);
        
        if (seatExists && !isReserved && !isAlreadySelected) {
          const seatData = getSeatData(rowLabel, currentColumn);
          if (seatData) {
            leftSeats.unshift({
              id: `${rowLabel}-${currentColumn}`, // This matches seatKey format
              rowLabel: rowLabel,
              number: currentColumn,
              price: seatData.price || 0,
              tier: seatData.tier,
              className: seatData.className
            });
            seatsAdded++;
          }
        } else {
          break;
        }
        currentColumn--;
      }
      
      // Combine left seats with existing seats
      consecutiveSeats.unshift(...leftSeats);
    }

    // If we still don't have enough seats, just add the clicked seat
    if (consecutiveSeats.length === 0) {
      const seatData = getSeatData(rowLabel, startColumn);
      if (seatData) {
        consecutiveSeats.push({
          id: `${rowLabel}-${startColumn}`, // This matches seatKey format
          rowLabel: rowLabel,
          number: startColumn,
          price: seatData.price || 0,
          tier: seatData.tier,
          className: seatData.className
        });
      }
    }

    return consecutiveSeats;
  };

  const checkSeatExists = (rowLabel: string, columnNumber: number) => {
    if (!seatLayout || !seatLayout.seats) return false;
    
    // Check if seat exists in the seat layout (seats is an array, not an object)
    const seatId = `${rowLabel}-${columnNumber}`;
    const seat = seatLayout.seats.find((s: any) => s.rowLabel === rowLabel && s.number === columnNumber);
    const exists = seat !== undefined;
    console.log('checkSeatExists:', { rowLabel, columnNumber, seatId, exists, seatData: seat });
    return exists;
  };

  const getSeatData = (rowLabel: string, columnNumber: number) => {
    if (!seatLayout || !seatLayout.config) return null;
    
    // Try to get seat data from the actual seat object first (seats is an array)
    const seat = seatLayout.seats?.find((s: any) => s.rowLabel === rowLabel && s.number === columnNumber);
    
    if (seat && seat.tier) {
      // Find the tier configuration
      const tier = seatLayout.config.tiers?.find((t: any) => t.rule === seat.tier);
      if (tier) {
        return {
          price: tier.price,
          tier: tier.rule,
          className: tier.className
        };
      }
    }
    
    // Fallback: Find the tier for this row
    const tier = seatLayout.config.tiers?.find((t: any) => {
      // Check if this row falls within the tier's range
      return seatLayout.config.rows?.some((r: any) => 
        r.label === rowLabel && r.tier === t.rule
      );
    });
    
    if (tier) {
      return {
        price: tier.price,
        tier: tier.rule,
        className: tier.className
      };
    }
    
    // Default fallback
    return {
      price: 180,
      tier: 'Base',
      className: 'Base'
    };
  };

  const handleTicketCountChange = (count: number) => {
    if (count < 1) count = 1;
    if (count > MAX_SEATS) count = MAX_SEATS;
    
    setDesiredTicketCount(count);
    setBookingError(null);
  };

  const handleTicketCountSubmit = () => {
    setIsEditingTicketCount(false);
    
    // Clear all selected seats when ticket count changes to allow fresh consecutive selection
    setSelectedSeats([]);
    
    setBookingError(null);
  };

  const handleModalTicketCountSelect = (count: number) => {
    setDesiredTicketCount(count);
  };

  const handleModalConfirm = () => {
    setShowTicketModal(false);
    // Clear existing selections to allow fresh consecutive selection
    setSelectedSeats([]);
    setBookingError(null);
  };

  const handleModalCancel = () => {
    setShowTicketModal(false);
    // Reset to default if user cancels
    setDesiredTicketCount(1);
  };

  const handlePayClick = () => {
    if (selectedSeats.length === 0) {
      setBookingError('Please select at least one seat');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setBookingError('Please login to continue booking');
      return;
    }

    // Show Terms & Conditions modal
    setShowTermsModal(true);
  };

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Quick availability check to reduce 409 conflicts
      const availabilityCheck = await apiService.getLiveSeatLayout(screenId || '', bookingDate || '', showtime || '');
      if (availabilityCheck.success && availabilityCheck.data) {
        const currentReserved = new Set(availabilityCheck.data.reservedSeats || []);
        const conflictingSeats = selectedSeats.filter(seat => {
          const seatKey = `${seat.rowLabel}${seat.number}`;
          return currentReserved.has(seatKey);
        });
        
        if (conflictingSeats.length > 0) {
          setBookingError(`Seats ${conflictingSeats.map(s => `${s.rowLabel}${s.number}`).join(', ')} are no longer available. Please select different seats.`);
          setIsBooking(false);
          return;
        }
      }

      const seatsPayload = selectedSeats.map(seat => ({
        rowLabel: seat.rowLabel,
        number: seat.number,
        price: seat.price,
        tier: seat.tier,
        className: seat.className
      }));

      const bookingPayload = {
        seats: seatsPayload,
        contactDetails: {
          email: contactDetails.email,
          mobileNumber: contactDetails.mobileNumber,
          countryCode: contactDetails.countryCode
        },
        movieId: movieId,
        screenId: screenId,
        bookingDate: bookingDate,
        showtime: showtime
      };

      console.log('Sending booking payload:', bookingPayload);

      const response = await apiService.confirmSeatBooking(screenId || '', bookingDate || '', showtime || '', bookingPayload);
      
        if (response.success) {
          console.log('Booking successful:', response.data);
          setBookingSuccess({ bookingId: response.data.bookingId, totalAmount: response.data.totalAmount });
          
          // Clear selected seats immediately since they're now reserved
          setSelectedSeats([]);
          setShowTermsModal(false);
          setShowContactModal(false);
          
          // Update reserved seats immediately for this user
          const newReservedSeats = new Set(reservedSeats);
          selectedSeats.forEach(seat => {
            newReservedSeats.add(seat.id);
          });
          setReservedSeats(newReservedSeats);
          setLastUpdateTime(new Date());
          
          // Show success message briefly before navigation
          setTimeout(() => {
            window.location.href = `/#/booking-confirmation/${response.data.bookingId}`;
          }, 1000);
        } else {
          setBookingError(response.error || 'Booking failed');
          console.error('Booking failed:', response.error);
        }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError('Failed to confirm booking');
    } finally {
      setIsBooking(false);
    }
  };

  const handleTermsCancel = () => {
    setShowTermsModal(false);
  };

  const handleTermsAccept = () => {
    setShowTermsModal(false);
    setShowContactModal(true);
  };

  const handleContactCancel = () => {
    setShowContactModal(false);
  };

  const handleContactSubmit = () => {
    // Validate contact details
    if (!contactDetails.email || !contactDetails.mobileNumber) {
      setBookingError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactDetails.email)) {
      setBookingError('Please enter a valid email address');
      return;
    }

    // Basic mobile validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(contactDetails.mobileNumber)) {
      setBookingError('Please enter a valid 10-digit mobile number');
      return;
    }

    setShowContactModal(false);
    handleConfirmBooking();
  };

  const handleContactInputChange = (field: string, value: string) => {
    setContactDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <BookNViewLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => navigate(`/movie/${movieId}`)} 
            className="bg-brand-red text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Movie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-gray to-brand-dark">
      {/* Ticket Selection Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">How many seats?</h2>
            </div>

            {/* Number Selection */}
            <div className="flex justify-center gap-3 mb-8">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleModalTicketCountSelect(num)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-200 ${
                    desiredTicketCount === num
                      ? 'bg-brand-red text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-3 mb-8">
              {seatLayout?.config?.tiers ? (
                <>
                  {/* VIP Tier */}
                  {seatLayout.config.tiers.find((tier: any) => tier.rule === 'VIP') && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-800">VIP</div>
                        <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                      </div>
                      <div className="text-xl font-bold text-gray-800">
                        ₹{seatLayout.config.tiers.find((tier: any) => tier.rule === 'VIP')?.price || 320}
                      </div>
                    </div>
                  )}
                  
                  {/* Premium Tier */}
                  {seatLayout.config.tiers.find((tier: any) => tier.rule === 'Premium') && (
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-800">PREMIUM</div>
                        <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                      </div>
                      <div className="text-xl font-bold text-gray-800">
                        ₹{seatLayout.config.tiers.find((tier: any) => tier.rule === 'Premium')?.price || 250}
                      </div>
                    </div>
                  )}
                  
                  {/* Base Tier */}
                  {seatLayout.config.tiers.find((tier: any) => tier.rule === 'Base') && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-800">BASE</div>
                        <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                      </div>
                      <div className="text-xl font-bold text-gray-800">
                        ₹{seatLayout.config.tiers.find((tier: any) => tier.rule === 'Base')?.price || 180}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Default pricing when seat layout is not loaded */
                <>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">VIP</div>
                      <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                    </div>
                    <div className="text-xl font-bold text-gray-800">₹320</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">PREMIUM</div>
                      <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                    </div>
                    <div className="text-xl font-bold text-gray-800">₹250</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">BASE</div>
                      <div className="text-sm text-green-600 font-medium">AVAILABLE</div>
                    </div>
                    <div className="text-xl font-bold text-gray-800">₹180</div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleModalCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className="flex-1 bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Select Seats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <h2 className="text-xl font-bold text-black mb-4">Terms & Conditions</h2>

            {/* Terms Content */}
            <div className="text-gray-700 text-sm space-y-3 mb-6">
              <p>1. Entry is allowed only for valid ticket holders.</p>
              <p>2. Ticket is compulsory for children of 3 years & above.</p>
              <p>3. Outside food and beverages are not allowed inside the cinema premises.</p>
              <p>4. Any person found under the influence of alcohol or drugs will be asked to leave the premises without a refund.</p>
              <p>5. Rights of admission reserved by the cinema management.</p>
              <p>6. Decision(s) taken by the cinema management is final & abiding.</p>
              <p>7. Ticket prices and movie schedules are subject to change without any prior notification.</p>
              <p>8. Vehicle parking for online customers is subject to availability.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTermsCancel}
                className="flex-1 bg-white text-brand-red border-2 border-brand-red py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTermsAccept}
                disabled={isBooking}
                className="flex-1 bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBooking ? 'Processing...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={handleContactCancel}
                className="text-gray-600 hover:text-gray-800 mr-4"
              >
                ←
              </button>
              <h2 className="text-xl font-bold text-black flex-1 text-center">Contact Details</h2>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span>Your email
              </label>
              <input
                type="email"
                value={contactDetails.email}
                onChange={(e) => handleContactInputChange('email', e.target.value)}
                placeholder="eg: abc@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">To access the ticket(s) on other devices, Login with this E-mail</p>
            </div>

            {/* Mobile Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span>Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-sm">🇮🇳</span>
                  <span className="text-sm ml-1">{contactDetails.countryCode}</span>
                  <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={contactDetails.mobileNumber}
                  onChange={(e) => handleContactInputChange('mobileNumber', e.target.value)}
                  placeholder="eg: 91480XXXXX"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This Number will only be used for sending ticket(s)</p>
            </div>

            {/* Terms & Conditions Link */}
            <div className="mb-6">
              <p className="text-sm">
                <span className="text-red-500">*</span>
                <span className="text-blue-600 underline cursor-pointer" onClick={() => setShowTermsModal(true)}>
                  Terms & Conditions
                </span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleContactSubmit}
              disabled={!contactDetails.email || !contactDetails.mobileNumber}
              className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/movie/${movieId}`)}
            className="flex items-center text-brand-light-gray hover:text-white transition-colors"
          >
            <i className="fa fa-arrow-left mr-2"></i>
            Back to Movie
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">Live Seat Layout</h1>
            <p className="text-brand-light-gray text-sm">
              {screen?.screenName || `Screen ${screenId}`} • {bookingDate} • {showtime}
            </p>
          </div>
        </div>

        {/* Movie Info */}
        {movie && (
          <div className="bg-gradient-to-r from-brand-gray to-brand-dark rounded-2xl p-6 border border-brand-dark/40 shadow-2xl mb-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <img
                  src={movie.posterUrl || '/placeholder-movie.jpg'}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                  }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-brand-light-gray mb-3">
                  <span>🎭 {movie.genre}</span>
                  <span>🌍 {movie.language}</span>
                  <span>⏱️ {movie.duration}</span>
                </div>
                <div className="text-brand-light-gray">
                  <span className="text-green-400">●</span> {availableSeats} Seats Available
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Seat Layout */}
        <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-8 border border-brand-dark/40 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <p className="text-brand-light-gray">
                {showtime} • {bookingDate} • {screen?.screenName || `Screen ${screenId}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click ticket count to change • Click any seat to auto-select consecutive seats • Maximum {MAX_SEATS} seats
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTicketModal(true)}
                className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-red-600 transition-colors"
              >
                <span>🎫</span>
                <span>{desiredTicketCount} Ticket{desiredTicketCount !== 1 ? 's' : ''}</span>
                {selectedSeats.length > 0 && (
                  <span className="text-sm opacity-90">(₹{totalAmount})</span>
                )}
              </button>
              
              
            </div>
          </div>

          {isLoadingLayout ? (
            <div className="flex justify-center py-12">
              <BookNViewLoader />
            </div>
          ) : seatLayoutConfig ? (
            <div className="w-full">
              <div className="flex justify-center">
                <div className="bg-white/5 rounded-xl p-8 border border-brand-dark/30 w-full max-w-6xl">
                  {console.log('SeatLayoutBuilder props:', {
                    config: seatLayoutConfig,
                    processedSeats: seatLayout.seats,
                    selectedSeats: selectedSeats,
                    selectedSeatsSet: Array.from(new Set(selectedSeats.map(s => `${s.rowLabel}-${s.number}`))),
                    reservedSeats: Array.from(reservedSeats)
                  })}
                  <SeatLayoutBuilder
                    config={seatLayoutConfig}
                    editMode={false}
                    processedSeats={new Map((seatLayout.seats || []).map((seat: any) => [`${seat.rowLabel}-${seat.number}`, seat]))}
                    onSeatClick={handleSeatClick}
                    selectedSeats={new Set(selectedSeats.map(s => `${s.rowLabel}-${s.number}`))}
                    reservedSeats={reservedSeats}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-brand-light-gray text-lg">
                No seat layout available for this screen
              </div>
            </div>

          )}


          {/* Real-time Update Indicator */}

          {/* Error Message */}
          {bookingError && (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-6 py-4 rounded-xl mt-6 text-center">
              {bookingError}
            </div>
          )}

          {/* Booking Processing Message */}
          {isBooking && (
            <div className="bg-blue-900/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-xl mt-6 text-center">
              <div className="text-2xl mb-2">⏳ Processing Booking...</div>
              <div className="text-lg">Please wait while we confirm your seats</div>
            </div>
          )}

          {/* Booking Success Message */}
          {bookingSuccess && (
            <div className="bg-green-900/20 border border-green-500 text-green-300 px-6 py-4 rounded-xl mt-6 text-center animate-pulse">
              <div className="text-2xl mb-2">🎉 Booking Successful!</div>
              <div className="text-lg mb-1">Booking ID: {bookingSuccess.bookingId}</div>
              <div className="text-lg mb-2">Total Amount: ₹{bookingSuccess.totalAmount}</div>
              <div className="text-sm">Redirecting to confirmation page...</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            {selectedSeats.length === desiredTicketCount && selectedSeats.length > 0 ? (
              <button
                onClick={handlePayClick}
                disabled={isBooking}
                className="bg-brand-red text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBooking ? 'Processing...' : `Pay ₹${totalAmount}`}
              </button>
            ) : selectedSeats.length > 0 ? (
              <div className="text-center">
                <p className="text-brand-light-gray mb-4">
                  {selectedSeats.length < desiredTicketCount 
                    ? `Select ${desiredTicketCount - selectedSeats.length} more seat${(desiredTicketCount - selectedSeats.length) !== 1 ? 's' : ''} to continue`
                    : `Selected ${selectedSeats.length} seats (need ${desiredTicketCount}). Click any seat to auto-select consecutive seats.`
                  }
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveSeatLayoutPage;
