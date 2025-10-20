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

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Select Your Seats</h2>
            <p className="text-brand-light-gray">
              {movieTitle} • {showtime} • {bookingDate} • Screen {screenId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

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
          <div className="bg-brand-dark rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Selected Seats</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSeats.map((seat, index) => (
                <div key={index} className="bg-brand-red text-white px-3 py-1 rounded-lg text-sm">
                  {seat.rowLabel}{seat.number} - ₹{seat.price}
                </div>
              ))}
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">
                Total: ₹{totalAmount}
              </span>
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
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={selectedSeats.length === 0 || isBooking}
            className="bg-brand-red text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? 'Processing...' : `Book ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
