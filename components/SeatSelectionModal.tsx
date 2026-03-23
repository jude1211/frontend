import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import SeatLayoutBuilder, { SeatLayoutConfig } from './SeatLayoutBuilder';

interface Seat {
  id: string;
  rowLabel: string;
  number: number;
  price: number;
  isSelected?: boolean;
  isReserved?: boolean;
  isActive?: boolean;
  tier?: string;
  className?: string;
}

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: string;
  screenId: string;
  bookingDate: string;
  showtime: string;
  movieTitle: string;
  onBookingComplete: (bookingId: string, totalAmount: number) => void;
}

const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
  isOpen,
  onClose,
  movieId,
  screenId,
  bookingDate,
  showtime,
  movieTitle,
  onBookingComplete
}) => {
  const [seatLayout, setSeatLayout] = useState<any>(null);
  const [seatLayoutConfig, setSeatLayoutConfig] = useState<SeatLayoutConfig | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [reservedSeats, setReservedSeats] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<{
    discountApplied: boolean;
    discountPercent: number;
    demandLevel: string;
    mlServiceStatus: string;
  } | null>(null);

  // Fetch seat layout and reserved seats
  useEffect(() => {
    if (!isOpen || !screenId) return;

    const fetchSeatData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch seat layout
        const layoutRes = await apiService.getPublicScreenLayout(screenId);
        if (layoutRes.success && layoutRes.data) {
          setSeatLayout(layoutRes.data);
          
          // Convert to SeatLayoutConfig
          const config: SeatLayoutConfig = {
            numRows: layoutRes.data.meta?.rows || 8,
            numCols: layoutRes.data.meta?.columns || 12,
            aisleColumns: layoutRes.data.meta?.aisles || [5, 9],
            seatClassRules: (layoutRes.data.seatClasses || []).map((sc: any) => ({
              rows: sc.rows,
              className: sc.className,
              price: sc.price,
              tier: sc.tier,
              color: sc.color,
            }))
          };
          setSeatLayoutConfig(config);
        }

        // Fetch live seat layout to get reserved seats
        const liveRes = await apiService.getLiveSeatLayout(screenId, bookingDate, showtime);
        if (liveRes.success && liveRes.data) {
          const reserved = new Set<string>();
          (liveRes.data.seats || []).forEach((seat: any) => {
            if (seat.status === 'reserved' || seat.isReserved) {
              reserved.add(`${seat.rowLabel}-${seat.number}`);
            }
          });
          setReservedSeats(reserved);

          // Fetch ML pricing: determine if a discount is active for this show
          try {
            // Parse showtime string (e.g. "9:30 PM") + bookingDate → ISO datetime
            const timeMatch = showtime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            let showHour = 0;
            let showMinute = 0;
            if (timeMatch) {
              showHour = parseInt(timeMatch[1], 10);
              showMinute = parseInt(timeMatch[2], 10);
              const ampm = timeMatch[3].toUpperCase();
              if (ampm === 'PM' && showHour < 12) showHour += 12;
              if (ampm === 'AM' && showHour === 12) showHour = 0;
            }
            const showDateObj = new Date(bookingDate);
            showDateObj.setHours(showHour, showMinute, 0, 0);
            const showtimeISO = showDateObj.toISOString();
            const dayOfWeek = showDateObj.getDay();

            const totalSeats = (liveRes.data.seats || []).length || 1;
            const bookedCount = reserved.size;
            const occupancyPct = Math.min(bookedCount / totalSeats, 1);

            const pricingRes = await apiService.getDynamicPricing({
              basePrice: 100, // reference price for discount check
              showtime: showtimeISO,
              show_hour: showHour,
              day_of_week: dayOfWeek,
              seat_occupancy_pct: occupancyPct,
              movie_popularity: 0.5,
              recent_bookings: bookedCount,
            });

            if (pricingRes.success && pricingRes.data) {
              setDiscountInfo({
                discountApplied: pricingRes.data.discountApplied,
                discountPercent: pricingRes.data.discountPercent,
                demandLevel: pricingRes.data.demandLevel,
                mlServiceStatus: pricingRes.data.mlServiceStatus,
              });
            }
          } catch (pricingErr) {
            console.warn('[ML Pricing] Could not fetch pricing info:', pricingErr);
            // Non-fatal — pricing badge is optional
          }
        }
      } catch (err) {
        console.error('Error fetching seat data:', err);
        setError('Failed to load seat layout');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeatData();
  }, [isOpen, screenId, bookingDate, showtime]);

  const handleSeatClick = useCallback((seatId: string, meta: any) => {
    const seatKey = `${meta.rowLabel}-${meta.columnNumber}`;
    
    // Don't allow selection of reserved seats
    if (reservedSeats.has(seatKey)) return;

    setSelectedSeats(prev => {
      const existingIndex = prev.findIndex(s => s.id === seatId);
      
      if (existingIndex >= 0) {
        // Remove seat
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add seat
        const newSeat: Seat = {
          id: seatId,
          rowLabel: meta.rowLabel,
          number: meta.columnNumber,
          price: meta.seatClass?.price || 0,
          tier: meta.seatClass?.tier,
          className: meta.seatClass?.className
        };
        return [...prev, newSeat];
      }
    });
  }, [reservedSeats]);

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please login to continue booking');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const seatsPayload = selectedSeats.map(seat => ({
        rowLabel: seat.rowLabel,
        number: seat.number,
        price: seat.price
      }));

      const response = await apiService.confirmSeatBooking(screenId, bookingDate, showtime, seatsPayload);
      
      if (response.success) {
        onBookingComplete(response.data.bookingId, response.data.totalAmount);
        onClose();
        try { sessionStorage.setItem('currentBookingId', response.data.bookingId); } catch {}

        // Load Razorpay SDK if not present
        if (!document.getElementById('razorpay-sdk')) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.id = 'razorpay-sdk';
          document.body.appendChild(script);
          await new Promise(resolve => {
            script.onload = resolve as any;
            script.onerror = resolve as any;
          });
        }

        try {
          const orderRes = await apiService.createPaymentOrder(response.data.bookingId);
          if (!orderRes.success || !orderRes.data) throw new Error(orderRes.error || 'Failed to create payment order');
          const { order, keyId } = orderRes.data;

          const options: any = {
            key: keyId || 'rzp_test_RL5vMta3bKvRd4',
            amount: order.amount,
            currency: order.currency || 'INR',
            name: movieTitle || 'BookNView',
            description: `${showtime} • Screen ${screenId}`,
            order_id: order.id,
            notes: { bookingId: response.data.bookingId },
            theme: { color: '#EF4444' },
            handler: async (rzpResp: any) => {
              const verifyRes = await apiService.verifyPayment({
                bookingId: response.data.bookingId,
                razorpay_order_id: rzpResp.razorpay_order_id,
                razorpay_payment_id: rzpResp.razorpay_payment_id,
                razorpay_signature: rzpResp.razorpay_signature
              });
              if (verifyRes.success && verifyRes.data?.bookingId) {
                window.location.href = `/#/booking-confirmation/${verifyRes.data.bookingId}`;
              } else {
                setError(verifyRes.error || 'Payment verification failed');
              }
            },
            modal: { ondismiss: () => {} }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (e:any) {
          setError(e?.message || 'Failed to initialize payment');
        }
      } else {
        setError(response.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to confirm booking');
    } finally {
      setIsBooking(false);
    }
  };

  const seatSubtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const cgst = seatSubtotal * 0.09;
  const sgst = seatSubtotal * 0.09;
  const serviceFee = seatSubtotal * 0.02;
  const convenienceFee = selectedSeats.length > 0 ? 20 : 0;
  const totalAmount = Math.round(seatSubtotal + cgst + sgst + serviceFee + convenienceFee);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Select Your Seats</h2>
            <p className="text-brand-light-gray text-xs sm:text-sm break-words">
              {movieTitle} • {showtime} • {bookingDate} • Screen {screenId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl sm:text-2xl flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ML Dynamic Pricing Discount Banner */}
        {discountInfo?.discountApplied && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-yellow-500/60 bg-yellow-500/10 flex items-center gap-3 animate-pulse">
            <span className="text-2xl">🏷️</span>
            <div className="flex-1">
              <p className="text-yellow-300 font-bold text-sm">
                Limited Time: {discountInfo.discountPercent}% Low-Demand Discount!
              </p>
              <p className="text-yellow-400/80 text-xs">
                Prices are already reduced — book now before this show fills up.
              </p>
            </div>
            <span className="text-yellow-400 text-xs font-semibold bg-yellow-500/20 px-2 py-1 rounded-lg">
              DEMAND: {discountInfo.demandLevel}
            </span>
          </div>
        )}

        {/* Seat Layout */}
        <div className="mb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-brand-light-gray">Loading seat layout...</div>
            </div>
          ) : seatLayoutConfig ? (
            <div className="bg-white/5 rounded-xl p-6 border border-brand-dark/30">
              <SeatLayoutBuilder
                config={seatLayoutConfig}
                editMode={false}
                processedSeats={new Map(Object.entries(seatLayout?.seats || {}))}
                onSeatClick={handleSeatClick}
                selectedSeats={new Set(selectedSeats.map(s => `${s.rowLabel}-${s.number}`))}
                reservedSeats={reservedSeats}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-brand-light-gray">No seat layout available</div>
            </div>
          )}
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <div className="bg-brand-dark rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            {/* Seat tags */}
            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
              {selectedSeats.map((seat, index) => (
                <div key={index} className="bg-brand-red text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                  {seat.rowLabel}{seat.number} - ₹{seat.price}
                </div>
              ))}
            </div>

            {/* Price Summary breakdown */}
            <div className="border-t border-gray-700 pt-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Summary</h3>
              {discountInfo?.discountApplied && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded px-2 py-0.5 font-semibold">
                    🏷️ {discountInfo.discountPercent}% OFF applied
                  </span>
                  <span className="text-gray-500">Prices shown are already discounted</span>
                </div>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Seat price ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''})</span>
                  {discountInfo?.discountApplied ? (
                    <span className="flex items-center gap-2">
                      <span className="line-through text-gray-500">
                        ₹{Math.round(seatSubtotal / (1 - discountInfo.discountPercent / 100)).toLocaleString('en-IN')}
                      </span>
                      <span className="text-yellow-300 font-semibold">₹{seatSubtotal.toLocaleString('en-IN')}</span>
                    </span>
                  ) : (
                    <span>₹{seatSubtotal.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>CGST (9%)</span>
                  <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>SGST (9%)</span>
                  <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Service fee (2%)</span>
                  <span>₹{serviceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Convenience fee</span>
                  <span>₹{convenienceFee.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-base sm:text-lg text-white border-t border-gray-700 mt-2 pt-2">
                <span>Total</span>
                <span className="text-brand-red">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={selectedSeats.length === 0 || isBooking}
            className="bg-brand-red text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
          >
            {isBooking ? 'Processing...' : selectedSeats.length > 0 ? `Pay ₹${totalAmount.toLocaleString('en-IN')} · ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}` : 'Select Seats'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
