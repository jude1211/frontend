import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export type SnackOrderItem = {
  snackId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

interface SnackSelectionStepProps {
  theatreId: string;
  initialCart: SnackOrderItem[];
  onBack: () => void;
  onContinue: (cart: SnackOrderItem[]) => void;
  timeLeft?: number | null; // For countdown timer
}

const SnackSelectionStep: React.FC<SnackSelectionStepProps> = ({ theatreId, initialCart, onBack, onContinue, timeLeft }) => {
  const [snacks, setSnacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<SnackOrderItem[]>(initialCart);

  useEffect(() => {
    const fetchSnacks = async () => {
      try {
        setIsLoading(true);
        // We reuse the central endpoint for theatre snacks if available
        // Or default snacks if not specific to theatre
        const response = await apiService.makeRequest<any[]>(`/snacks?theatreId=${theatreId}`);
        if (response.success && response.data) {
          // Filter out structurally disabled ones, but keep 'out_of_stock' to show "Sold out"
          setSnacks(response.data.filter((s:any) => s.isActive));
        }
      } catch (err) {
        console.error('Failed to load snacks', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSnacks();
  }, [theatreId]);

  const updateQuantity = (snack: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.snackId === (snack.id || snack._id));
      const currentQty = existing ? existing.quantity : 0;
      let newQty = currentQty + delta;
      
      if (newQty < 0) newQty = 0;
      if (newQty > snack.availableStock) newQty = snack.availableStock;

      if (newQty === 0) {
        return prev.filter(item => item.snackId !== (snack.id || snack._id));
      }

      const itemShape: SnackOrderItem = {
        snackId: snack.id || snack._id,
        name: snack.name,
        price: snack.price, // use final sale price
        quantity: newQty,
        image: snack.image || ''
      };

      if (existing) {
        return prev.map(item => item.snackId === itemShape.snackId ? itemShape : item);
      } else {
        return [...prev, itemShape];
      }
    });
  };

  const getQuantity = (id: string) => {
    const item = cart.find(i => i.snackId === id);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatTimeLimit = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full relativo">
      {typeof timeLeft === 'number' && (
        <div className="bg-[#2a1a22] text-[#e91e8c] text-center py-2 text-sm font-bold shadow mb-4 rounded-xl border border-brand-red/20">
          ⏱ Your seats are held for {formatTimeLimit(timeLeft)} — complete payment to confirm
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20 flex-col">
          <div className="w-12 h-12 rounded-full border-4 border-brand-dark border-t-brand-red animate-spin mx-auto mb-4"></div>
          <p className="text-brand-light-gray">Fetching delicious snacks...</p>
        </div>
      ) : snacks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-light-gray text-lg mb-6">No snacks available for this show</p>
          <button onClick={() => onContinue([])} className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">
            Continue to payment →
          </button>
        </div>
      ) : (
        <div className="pb-24">
          <h2 className="text-2xl font-bold text-white mb-6">Select Your Snacks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snacks.map((snack) => {
              const outOfStock = snack.availableStock <= 0;
              const lowStock = !outOfStock && snack.availableStock <= 5;
              const qty = getQuantity(snack.id || snack._id);
              
              return (
                <div key={snack.id || snack._id} className={`bg-[#2a2a2a] rounded-xl flex overflow-hidden border ${qty > 0 ? 'border-brand-red' : 'border-brand-dark/40'} ${outOfStock ? 'opacity-50 grayscale' : ''}`}>
                  <div className="w-32 h-32 bg-[#111] flex-shrink-0 relative">
                    {snack.image ? (
                      <img src={snack.image} alt={snack.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-3xl ${snack.image ? 'hidden' : ''}`}>
                      🍿
                    </div>
                    {snack.discountPercent > 0 && !outOfStock && (
                      <div className="absolute top-0 right-0 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                        {snack.discountPercent}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-white leading-tight">{snack.name}</h3>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-white font-medium">₹{snack.price}</span>
                        {snack.originalPrice > snack.price && (
                          <span className="text-brand-light-gray text-xs line-through">₹{snack.originalPrice}</span>
                        )}
                      </div>
                      
                      {outOfStock ? (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#331111] text-red-500">
                          Sold Out
                        </span>
                      ) : lowStock ? (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#332b11] text-yellow-500">
                          Only {snack.availableStock} left!
                        </span>
                      ) : null}
                    </div>

                    {!outOfStock && (
                      <div className="flex items-center gap-3 self-start mt-3">
                        <button
                          onClick={() => updateQuantity(snack, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#444] transition-colors"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-brand-red font-bold">{qty}</span>
                        <button
                          onClick={() => updateQuantity(snack, 1)}
                          disabled={qty >= snack.availableStock}
                          className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#444] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 flex items-center justify-between z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={onBack} className="text-brand-light-gray hover:text-white transition-colors flex items-center px-2">
          <i className="fas fa-arrow-left mr-2"></i> Back
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm text-brand-light-gray">{totalItems} item(s) selected</div>
            <div className="font-bold text-white">₹{subtotal.toFixed(2)}</div>
          </div>
          <button
            onClick={() => onContinue(cart)}
            disabled={totalItems === 0 && snacks.length > 0}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              totalItems > 0 || snacks.length === 0 
                ? 'bg-brand-red text-white hover:bg-red-600 shadow-lg shadow-brand-red/20' 
                : 'bg-[#333] text-[#777] cursor-not-allowed'
            }`}
          >
            {snacks.length === 0 ? 'Proceed' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnackSelectionStep;
