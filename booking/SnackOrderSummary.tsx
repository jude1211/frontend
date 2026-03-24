import React from 'react';
import { SnackOrderItem } from './SnackSelectionStep';

interface SnackOrderSummaryProps {
  selectedSeats: any[];
  snackCart: SnackOrderItem[];
  deliveryTime: string;
  onBack: () => void;
  onProceed: () => void;
  isProcessing?: boolean;
  timeLeft?: number | null;
}

const SnackOrderSummary: React.FC<SnackOrderSummaryProps> = ({ 
  selectedSeats, snackCart, deliveryTime, onBack, onProceed, isProcessing, timeLeft 
}) => {
  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const snackTotal = snackCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = ticketTotal + snackTotal;

  const formatTimeLimit = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full relative">
      {typeof timeLeft === 'number' && (
        <div className="bg-[#2a1a22] text-[#e91e8c] text-center py-2 text-sm font-bold shadow mb-4 rounded-xl border border-brand-red/20">
          ⏱ Your seats are held for {formatTimeLimit(timeLeft)} — complete payment to confirm
        </div>
      )}

      <div className="pb-24">
        <h2 className="text-2xl font-bold text-white mb-6">Review Your Order</h2>
        
        <div className="space-y-6">
          {/* Seats Section */}
          <div className="bg-[#2a2a2a] p-5 rounded-xl border border-[#333]">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-[#444] pb-2">Your Seats</h3>
            <div className="space-y-2">
              {selectedSeats.map((seat, i) => (
                <div key={i} className="flex justify-between items-center text-[#e5e5e5]">
                  <span>Seat {seat.rowLabel}-{seat.number} <span className="text-xs text-[#999] ml-2">({seat.tier})</span></span>
                  <span className="font-medium">₹{seat.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#444] flex justify-between font-bold text-white">
              <span>Ticket Subtotal</span>
              <span>₹{ticketTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Snacks Section */}
          {snackCart.length > 0 && (
            <div className="bg-[#2a2a2a] p-5 rounded-xl border border-[#333]">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#444] pb-2">Snack Order</h3>
              <div className="space-y-3">
                {snackCart.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-[#e5e5e5]">
                    <div>
                      <span className="block">{item.name}</span>
                      <span className="text-xs text-brand-red font-bold">Qty: {item.quantity} × ₹{item.price}</span>
                    </div>
                    <span className="font-medium mt-1">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-[#1a1a1a] p-3 rounded-lg text-sm text-[#999] flex items-center">
                <i className="fas fa-clock mr-2 text-brand-red"></i> Delivery: {deliveryTime}
              </div>
              <div className="mt-4 pt-3 border-t border-[#444] flex justify-between font-bold text-white">
                <span>Snack Subtotal</span>
                <span>₹{snackTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="bg-[#1a3a1a]/20 p-5 rounded-xl border border-[#2e7d32]/30 flex justify-between items-center">
            <span className="text-xl font-bold text-white">Grand Total</span>
            <span className="text-2xl font-bold text-[#66bb6a]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 flex items-center justify-between z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={onBack} disabled={isProcessing} className="text-brand-light-gray hover:text-white transition-colors flex items-center px-2 disabled:opacity-50">
          <i className="fas fa-arrow-left mr-2"></i> Back
        </button>
        <button
          onClick={onProceed}
          disabled={isProcessing}
          className="px-8 py-3 rounded-xl font-bold transition-all bg-brand-red text-white hover:bg-red-600 shadow-lg flex items-center disabled:opacity-50"
        >
          {isProcessing ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full mr-2"></div> Processing...</>
          ) : (
            'Proceed to Payment →'
          )}
        </button>
      </div>
    </div>
  );
};

export default SnackOrderSummary;
