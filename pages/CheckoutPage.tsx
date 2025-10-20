
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedMovie, selectedShowtime, snackCart, totalSeatPrice, totalSnackPrice } = useAppContext();
  const { user } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(user?.email || '');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingSummary, setBookingSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const totalPrice = useMemo(() => {
    if (bookingSummary?.pricing?.totalAmount) return Number(bookingSummary.pricing.totalAmount);
    return totalSeatPrice + totalSnackPrice;
  }, [bookingSummary, totalSeatPrice, totalSnackPrice]);

  // Load Razorpay script
  useEffect(() => {
    const existing = document.getElementById('razorpay-sdk');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.id = 'razorpay-sdk';
    document.body.appendChild(script);
  }, []);

  // Initialize booking context from sessionStorage and fetch summary
  useEffect(() => {
    const id = sessionStorage.getItem('currentBookingId');
    setBookingId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiService.getBooking(id);
        if (res.success) {
          setBookingSummary(res.data);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handlePay = useCallback(async () => {
    try {
      setError(null);
      setIsPaying(true);
      if (!(window as any).Razorpay) {
        throw new Error('Payment SDK not loaded. Please wait and try again.');
      }
      if (!bookingId) {
        throw new Error('Missing booking reference. Please re-confirm your seats.');
      }

      const orderRes = await apiService.createPaymentOrder(bookingId);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error || 'Failed to create payment order');
      }

      const { order, keyId } = orderRes.data;

      const options: any = {
        key: keyId || 'rzp_test_RL5vMta3bKvRd4',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: (selectedMovie?.title || bookingSummary?.movie?.title || 'BookNView'),
        description: `${(selectedShowtime?.theatre || bookingSummary?.theatre?.name || '')} • ${(selectedShowtime?.time || bookingSummary?.showtime?.time || '')}`.trim(),
        order_id: order.id,
        prefill: {
          name: user?.displayName || user?.firstName || '',
          email: email || user?.email || '',
        },
        notes: {
          bookingId
        },
        theme: { color: '#EF4444' },
        handler: async (response: any) => {
          try {
            const verifyRes = await apiService.verifyPayment({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.success && verifyRes.data?.bookingId) {
              window.location.href = `/#/booking-confirmation/${verifyRes.data.bookingId}`;
            } else {
              setError(verifyRes.error || 'Payment verification failed');
            }
          } catch (e: any) {
            setError(e?.message || 'Payment verification error');
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      setError(e?.message || 'Payment initialization failed');
    } finally {
      // keep isPaying true while modal open; set false on dismiss/after handler
    }
  }, [email, selectedMovie, selectedShowtime, user]);

  
  if (loading) {
    return <div className="text-center text-2xl text-gray-400">Loading checkout…</div>;
  }

  // Guard: require bookingId from previous step
  if (!bookingId) {
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
              <h3 className="font-bold text-lg">{(bookingSummary?.movie?.title || selectedMovie?.title || 'Your Movie')}</h3>
              <p className="text-sm text-gray-400">{(bookingSummary?.theatre?.name || selectedShowtime?.theatre || '')} {bookingSummary?.showtime?.time ? `at ${bookingSummary.showtime.time}` : (selectedShowtime?.time ? `at ${selectedShowtime.time}` : '')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300">Seats ({bookingSummary?.seats?.length || 0})</h4>
              <p className="text-sm text-brand-light-gray">{(bookingSummary?.seats || []).map((s:any) => s.seatNumber).join(', ')}</p>
              {bookingSummary?.pricing?.seatTotal != null && (
                <p className="text-right font-bold">₹{Number(bookingSummary.pricing.seatTotal).toLocaleString('en-IN')}</p>
              )}
            </div>
            {Array.isArray(bookingSummary?.snacks) && bookingSummary!.snacks.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-300">Snacks</h4>
                {bookingSummary!.snacks.map((item:any, idx:number) => (
                   <div key={idx} className="flex justify-between text-sm">
                       <span>{item.name} x{item.quantity}</span>
                       <span>₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                   </div>
                ))}
                {bookingSummary?.pricing?.snackTotal != null && (
                  <p className="text-right font-bold mt-1">₹{Number(bookingSummary.pricing.snackTotal).toLocaleString('en-IN')}</p>
                )}
              </div>
            )}
            <hr className="border-gray-600"/>
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">TOTAL</span>
              <span className="text-brand-red">₹{Number(totalPrice).toLocaleString('en-IN')}</span>
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
              <input type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red" />
              <input type="text" placeholder="Cardholder Name" className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red" />
              <div className="bg-brand-dark p-3 rounded-md border border-gray-600">
                <p className="text-gray-400">Payment will be completed securely via Razorpay.</p>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button onClick={handlePay} disabled={isPaying} className="w-full mt-2 bg-brand-red text-white py-3 rounded-md font-bold text-lg hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isPaying ? 'Processing…' : `Pay ₹${Number(totalPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;