
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Seat, SeatStatus } from '../types';
import { useAppContext } from '../context/AppContext';

// Mock seat layout generator
const generateSeats = (): Seat[][] => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seats: Seat[][] = [];
  let idCounter = 1;
  rows.forEach(row => {
    const rowSeats: Seat[] = [];
    for (let i = 1; i <= 14; i++) {
      let status = SeatStatus.Available;
      if (Math.random() < 0.2) status = SeatStatus.Booked;
      if (['I', 'J'].includes(row)) status = SeatStatus.Premium;

      let price = 12;
      if (status === SeatStatus.Premium) price = 20;

      // Add gaps for aisles
      if (i === 4 || i === 11) {
          rowSeats.push({id: `gap-${row}-${i}`, row: '', number: 0, status: SeatStatus.Available, price: 0});
      }

      rowSeats.push({
        id: (idCounter++).toString(),
        row,
        number: i,
        status: status,
        price,
      });
    }
    seats.push(rowSeats);
  });
  return seats;
};

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
  const { selectedSeats, setSelectedSeats, totalSeatPrice } = useAppContext();
  const [seatsLayout] = useState(generateSeats());
  const [is3DPreview, setIs3DPreview] = useState(false);

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

          <div className="space-y-2 flex flex-col items-center">
            {seatsLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                 <div className="w-8 text-center font-bold text-gray-400">{row[0].row}</div>
                 <div className="flex gap-2">
                    {row.map(seat => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        onSelect={() => handleSeatSelect(seat)}
                        isSelected={selectedSeats.some(s => s.id === seat.id)}
                      />
                    ))}
                 </div>
              </div>
            ))}
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
            <div className="flex justify-between font-bold text-lg"><span className="text-white">Subtotal:</span> <span className="text-brand-red">${totalSeatPrice.toFixed(2)}</span></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dynamic Pricing Applied. Prices may vary.</p>
          <hr className="my-4 border-gray-600"/>
          <div>
            <h3 className="text-xl font-bold mb-2">Feeling Hungry?</h3>
            <p className="text-gray-400 mb-4">Add snacks to your order.</p>
            <button onClick={() => navigate('/snacks')} className="w-full bg-yellow-500 text-black py-3 rounded-md font-bold hover:bg-yellow-400 transition-colors">Order Snacks</button>
          </div>
          <button onClick={() => navigate('/snacks')} disabled={selectedSeats.length === 0} className="w-full mt-6 bg-brand-red text-white py-3 rounded-md font-bold hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {selectedSeats.length > 0 ? `Pay $${totalSeatPrice.toFixed(2)}` : 'Select Seats to Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;