
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Seat, SeatStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';

const SeatComponent: React.FC<{ seat: Seat; onSelect: (seat: Seat) => void; isSelected: boolean }> = ({ seat, onSelect, isSelected }) => {
  if (seat.row === '') return <div className="w-8 h-8"></div>; // Aisle

  const getSeatColor = () => {
    if (isSelected) return 'bg-green-500';
    switch (seat.status) {
      case SeatStatus.Booked: return 'bg-gray-600 cursor-not-allowed';
      case SeatStatus.Premium: return 'bg-yellow-500 hover:bg-yellow-400';
      case SeatStatus.Available: return 'bg-gray-300 hover:bg-gray-200';
      default: return 'bg-gray-300';
    }
  };

  return (
    <button
      onClick={() => onSelect(seat)}
      disabled={seat.status === SeatStatus.Booked}
      className={`w-8 h-8 rounded-t-lg text-black text-xs font-semibold flex items-center justify-center transition-all duration-200 ${getSeatColor()} ${isSelected ? 'scale-110' : 'scale-100'}`}
    >
      {seat.number}
    </button>
  );
};



const SeatSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { movieId, screenId, bookingDate, time } = useParams<{ movieId: string; screenId: string; bookingDate: string; time: string }>();
  const { selectedSeats, setSelectedSeats, totalSeatPrice } = useAppContext();
  const [bookingConfirming, setBookingConfirming] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [seatsLayout, setSeatsLayout] = useState<Seat[][]>([]);
  const [rawSeats, setRawSeats] = useState<Array<any>>([]); // exact persisted seats with x,y
  const [layoutBounds, setLayoutBounds] = useState<{ width:number; height:number }>({ width: 0, height: 0 });
  const [is3DPreview, setIs3DPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<any>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!screenId || !bookingDate || !time) {
          setError('Showtime not found.');
          setLoading(false);
          return;
        }
        // Fetch live seat layout for this show (uses persisted ScreenLayout seats)
        const layoutRes = await apiService.getLiveSeatLayout(screenId, bookingDate, time);
        if (layoutRes.success && Array.isArray(layoutRes.data?.seats)) {
          // Persist exact seats with positions
          const incoming = (layoutRes.data.seats || []).filter((s:any)=> s?.isActive !== false);
          setRawSeats(incoming);

          // Also keep grouped representation for fallback/labels
          const seatsByRow: Record<string, Seat[]> = {};
          incoming.forEach((seat: any) => {
            const row = seat.rowLabel;
            if (!seatsByRow[row]) seatsByRow[row] = [];
            seatsByRow[row].push({
              id: `${row}-${seat.number}`,
              row,
              number: seat.number,
              status: seat.liveStatus === 'booked' ? SeatStatus.Booked : SeatStatus.Available,
              price: seat.price
            });
          });
          setSeatsLayout(Object.values(seatsByRow));

          // Compute layout bounds based on X/Y + seat size
          const seatSize = 32; // px (w-8 h-8)
          const maxX = incoming.reduce((m:number, s:any)=> Math.max(m, (s.x ?? 0)), 0);
          const maxY = incoming.reduce((m:number, s:any)=> Math.max(m, (s.y ?? 0)), 0);
          setLayoutBounds({ width: maxX + seatSize + 40, height: maxY + seatSize + 80 });
        } else {
          setError('Failed to fetch seat layout.');
        }
      } catch {
        setError('Failed to fetch seat layout.');
      }
      setLoading(false);
    };
    fetchLayout();
  }, [screenId, bookingDate, time]);

  const handleSeatSelect = useCallback((seat: Seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  }, [setSelectedSeats]);

  const handleConfirmBooking = useCallback(async () => {
    if (!screenId || !bookingDate || !time) return;
    if (selectedSeats.length === 0) return;
    // Require auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      setBookingError('Please login to continue booking.');
      navigate('/login');
      return;
    }
    setBookingError(null);
    setBookingConfirming(true);
    try {
      // Prepare seat payload in persisted form
      const seatsPayload = selectedSeats.map(s => {
        // find raw seat for price
        const raw = rawSeats.find((rs:any) => String(rs.rowLabel) === String(s.row) && Number(rs.number) === Number(s.number));
        return { rowLabel: s.row, number: s.number, price: Number(raw?.price || s.price || 0) };
      });
      const res = await apiService.confirmSeatBooking(screenId, bookingDate, time, seatsPayload);
      if (res.success) {
        // Refresh live layout immediately
        try {
          const layoutRes = await apiService.getLiveSeatLayout(screenId, bookingDate, time);
          if (layoutRes.success && Array.isArray(layoutRes.data?.seats)) {
            const incoming = (layoutRes.data.seats || []).filter((s:any)=> s?.isActive !== false);
            setRawSeats(incoming);
            const seatSize = 32;
            const maxX = incoming.reduce((m:number, s:any)=> Math.max(m, (s.x ?? 0)), 0);
            const maxY = incoming.reduce((m:number, s:any)=> Math.max(m, (s.y ?? 0)), 0);
            setLayoutBounds({ width: maxX + seatSize + 40, height: maxY + seatSize + 80 });
          }
        } catch {}
        // Clear selections and show success (redirect to summary could be implemented here)
        setSelectedSeats([]);
        alert(`Booking Confirmed!\nBooking ID: ${res.data?.bookingId}\nTotal: ₹${(res.data?.totalAmount || 0).toLocaleString('en-IN')}`);
      } else {
        if ((res as any).data?.conflicts?.length) {
          setBookingError(`Seats no longer available: ${(res as any).data.conflicts.join(', ')}`);
          // refresh layout
          const layoutRes = await apiService.getLiveSeatLayout(screenId, bookingDate, time);
          if (layoutRes.success && Array.isArray(layoutRes.data?.seats)) setRawSeats((layoutRes.data.seats || []).filter((s:any)=> s?.isActive !== false));
        } else {
          setBookingError(res.error || 'Failed to confirm booking');
        }
      }
    } catch (e:any) {
      setBookingError(e?.message || 'Failed to confirm booking');
    } finally {
      setBookingConfirming(false);
    }
  }, [screenId, bookingDate, time, selectedSeats, rawSeats, setSelectedSeats]);

  if (loading) return <div className="text-center text-2xl text-gray-400">Loading seat layout…</div>;
  if (error) return <div className="text-center text-2xl text-red-400">{error}</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-6 text-white">Select Your Seats</h1>
        <div className="bg-brand-dark p-6 rounded-lg">
          <div className="w-full bg-gray-500 h-2 rounded-full mb-8 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                  <p className="bg-brand-dark px-4 text-white">SCREEN</p>
              </div>
          </div>

          {/* Exact persisted layout (uses persisted X/Y and seat activation) */}
          <div className="relative mx-auto" style={{ width: `${layoutBounds.width}px`, height: `${layoutBounds.height}px` }}>
            {rawSeats.map((s:any) => {
              const id = `${s.rowLabel}-${s.number}`;
              const isBooked = s.liveStatus === 'booked';
              const isSelected = selectedSeats.some(x => x.id === id);
              // Build Seat conforming object for handler
              const seatObj: Seat = { id, row: s.rowLabel, number: s.number, status: isBooked ? SeatStatus.Booked : SeatStatus.Available, price: s.price };
              const baseColor = isBooked ? 'bg-gray-600 cursor-not-allowed' : (isSelected ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-200');
              return (
                <button
                  key={id}
                  onClick={() => !isBooked && handleSeatSelect(seatObj)}
                  disabled={isBooked}
                  className={`absolute w-8 h-8 rounded-t-lg text-black text-xs font-semibold flex items-center justify-center transition-all duration-200 ${isSelected ? 'scale-110' : 'scale-100'} ${baseColor}`}
                  style={{ left: `${s.x || 0}px`, top: `${s.y || 0}px` }}
                  title={`${s.rowLabel}${s.number}`}
                >
                  {s.number}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-center space-x-6 mt-8">
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-gray-300 mr-2"></div><span>Available</span></div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div><span>Premium</span></div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-green-500 mr-2"></div><span>Selected</span></div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-gray-600 mr-2"></div><span>Booked</span></div>
          </div>

        </div>
        <div className="mt-6 flex justify-center">
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-3 text-lg">3D Preview Zone</span>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={is3DPreview} onChange={() => setIs3DPreview(!is3DPreview)} />
                <div className="w-14 h-8 bg-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-red"></div>
              </div>
            </label>
        </div>
        {is3DPreview && <div className="mt-4 bg-black border-2 border-dashed border-gray-500 rounded-lg h-64 flex items-center justify-center text-gray-400 animate-fade-in">3D Seat View Placeholder (via Three.js or iframe)</div>}
      </div>

      <div className="w-full lg:w-96 animate-fade-in">
        <div className="bg-brand-gray p-6 rounded-lg sticky top-24">
          <h2 className="text-2xl font-bold mb-4 text-white">Booking Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Seats ({selectedSeats.length}):</span> <span>{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</span></div>
            <div className="flex justify-between font-bold text-lg"><span className="text-white">Subtotal:</span> <span className="text-brand-red">₹{Number(totalSeatPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dynamic Pricing Applied. Prices may vary.</p>
          <hr className="my-4 border-gray-600"/>
          <div>
            <h3 className="text-xl font-bold mb-2">Feeling Hungry?</h3>
            <p className="text-gray-400 mb-4">Add snacks to your order.</p>
            <button onClick={() => navigate('/snacks')} className="w-full bg-yellow-500 text-black py-3 rounded-md font-bold hover:bg-yellow-400 transition-colors">Order Snacks</button>
          </div>
          {bookingError && <div className="mt-3 text-sm text-red-400">{bookingError}</div>}
          <button onClick={handleConfirmBooking} disabled={selectedSeats.length === 0 || bookingConfirming} className="w-full mt-6 bg-brand-red text-white py-3 rounded-md font-bold hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {bookingConfirming ? 'Processing…' : (selectedSeats.length > 0 ? `Pay ₹${Number(totalSeatPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Select Seats to Proceed')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;