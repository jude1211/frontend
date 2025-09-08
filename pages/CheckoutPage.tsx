
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMovie, selectedShowtime, selectedSeats, snackCart, totalSeatPrice, totalSnackPrice, user } = useAppContext();

  const totalPrice = totalSeatPrice + totalSnackPrice;

  if (!selectedMovie || !selectedShowtime || selectedSeats.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Your booking is incomplete!</h1>
        <p className="text-gray-400 mt-2">Please select a movie and seats before checking out.</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-brand-red text-white px-6 py-3 rounded-md font-bold hover:bg-red-600">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-white animate-fade-in">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
        {/* Order Summary */}
        <div className="bg-brand-gray p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2 text-white">Order Summary</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg">{selectedMovie.title}</h3>
              <p className="text-sm text-gray-400">{selectedShowtime.theatre} at {selectedShowtime.time}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300">Seats ({selectedSeats.length})</h4>
              <p className="text-sm text-brand-light-gray">{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</p>
              <p className="text-right font-bold">${totalSeatPrice.toFixed(2)}</p>
            </div>
            {snackCart.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-300">Snacks</h4>
                {snackCart.map(item => (
                   <div key={item.id} className="flex justify-between text-sm">
                       <span>{item.name} x{item.quantity}</span>
                       <span>${(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                ))}
                <p className="text-right font-bold mt-1">${totalSnackPrice.toFixed(2)}</p>
              </div>
            )}
            <hr className="border-gray-600"/>
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">TOTAL</span>
              <span className="text-brand-red">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment and Login */}
        <div className="bg-brand-gray p-6 rounded-lg">
           <h2 className="text-2xl font-bold mb-4 text-white">Payment Details</h2>
           {!user && (
             <div className="flex justify-around mb-4 bg-brand-dark rounded-lg p-1">
                <button className="w-full py-2 rounded-md bg-brand-red text-white font-semibold">Guest Checkout</button>
                <button className="w-full py-2 rounded-md text-gray-400 hover:bg-brand-gray">Login</button>
             </div>
           )}
           
           <div className="space-y-4">
              <input type="email" placeholder="Email Address" defaultValue={user ? 'user@example.com' : ''} className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red" />
              <input type="text" placeholder="Cardholder Name" className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red" />
              <div className="bg-brand-dark p-3 rounded-md border border-gray-600">
                {/* Placeholder for Stripe/etc */}
                <p className="text-gray-400">Card Number / Expiry / CVC</p>
              </div>
              <button className="w-full mt-2 bg-brand-red text-white py-3 rounded-md font-bold text-lg hover:bg-red-600 transition-colors">
                Pay ${totalPrice.toFixed(2)}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;