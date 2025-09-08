
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SNACKS } from '../constants';
import { useAppContext } from '../context/AppContext';
import { Snack } from '../types';

const SnackItem: React.FC<{ snack: Snack }> = ({ snack }) => {
  const { snackCart, addToCart, updateQuantity } = useAppContext();
  const cartItem = snackCart.find(item => item.id === snack.id);
  const inCart = !!cartItem && cartItem.quantity > 0;

  return (
    <div className="flex items-center bg-brand-dark p-4 rounded-lg overflow-hidden">
      <img src={snack.imageUrl} alt={snack.name} className="w-24 h-24 rounded-md object-cover mr-4" />
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-white">{snack.name}</h3>
        <p className="text-sm text-gray-400">{snack.description}</p>
        <p className="text-lg font-semibold text-brand-red mt-2">${snack.price.toFixed(2)}</p>
      </div>
      <div className="relative w-28 h-10 flex items-center justify-center">
        {/* ADD Button */}
        <button 
          onClick={() => addToCart(snack)} 
          className={`absolute flex items-center justify-center inset-0 bg-brand-red text-white w-full rounded-md hover:bg-red-600 font-semibold transition-all duration-300 ease-in-out transform ${inCart ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
          ADD
        </button>
        {/* Quantity Selector */}
        <div 
          className={`absolute inset-0 flex items-center bg-brand-red text-white font-bold rounded-md transition-all duration-300 ease-in-out transform ${inCart ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
        >
          <button onClick={() => updateQuantity(snack.id, cartItem ? cartItem.quantity - 1 : 0)} className="px-3 h-full flex-1 hover:bg-red-600 rounded-l-md">-</button>
          <span className="px-2 h-full flex-1 text-center flex items-center justify-center">{cartItem?.quantity}</span>
          <button onClick={() => updateQuantity(snack.id, cartItem ? cartItem.quantity + 1 : 1)} className="px-3 h-full flex-1 hover:bg-red-600 rounded-r-md">+</button>
        </div>
      </div>
    </div>
  );
};


const SnackOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { snackCart, totalSnackPrice } = useAppContext();

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-6 text-white">Grab a Bite!</h1>
        <div className="space-y-4">
          {SNACKS.map(snack => (
            <SnackItem key={snack.id} snack={snack} />
          ))}
        </div>
      </div>
      <div className="w-full lg:w-96 animate-fade-in">
        <div className="bg-brand-gray p-6 rounded-lg sticky top-24">
          <h2 className="text-2xl font-bold mb-4 text-white">Cart Summary</h2>
          {snackCart.length === 0 ? (
            <p className="text-gray-400">Your cart is empty.</p>
          ) : (
            <div className="space-y-2">
              {snackCart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-white">{item.name} x{item.quantity}</span>
                  <span className="text-gray-300">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="my-4 border-gray-600"/>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-white">Snack Total:</span>
                <span className="text-brand-red">${totalSnackPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/checkout')} className="w-full mt-6 bg-brand-red text-white py-3 rounded-md font-bold hover:bg-red-600 transition-colors">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnackOrderPage;