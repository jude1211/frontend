import React, { useEffect, useState } from 'react';

declare global {
  interface Window { Razorpay: any; }
}

const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

interface BookingState {
  theatre: { _id: string; name: string; address: string } | null;
  showDate: string;
  screen: string;
  showtimeId: string;
  showTime: string;
  occasion: string;
  templateId: string;
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'none';
  totalAmount: number;
  theatreName?: string;
}

interface Props {
  booking: BookingState;
  onBack: () => void;
  onSuccess: (bookingId: string) => void;
}

const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SpecialMomentPayment: React.FC<Props> = ({ booking, onBack, onSuccess }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'paying' | 'error'>('idle');
  const [error, setError] = useState('');

  const startPayment = async () => {
    setStatus('loading');
    setError('');
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';

      // 1. Create booking + Razorpay order on backend
      const createRes = await fetch(`${API_BASE}/api/v1/special-moments/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          theatreId: booking.theatre!._id,
          theatreName: booking.theatre?.name || '',
          screen: booking.screen,
          showtimeId: booking.showtimeId,
          showDate: booking.showDate,
          showTime: booking.showTime,
          occasion: booking.occasion,
          templateId: booking.templateId,
          recipientName: booking.recipientName,
          senderName: booking.senderName,
          message: booking.message,
          mediaUrl: booking.mediaUrl,
          mediaType: booking.mediaType,
          totalAmount: booking.totalAmount,
        }),
      });
      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error || 'Failed to create booking');

      const { bookingId, razorpayOrderId, amount, keyId } = createData.data;

      // 2. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load payment gateway');

      setStatus('paying');

      // 3. Open Razorpay
      const options = {
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'BookNView Special Moment',
        description: `${booking.occasion} — ${booking.recipientName}`,
        order_id: razorpayOrderId,
        prefill: {},
        theme: { color: '#e91e8c' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Confirm payment on backend
            const confirmRes = await fetch(
              `${API_BASE}/api/v1/special-moments/bookings/${bookingId}/confirm`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              }
            );
            const confirmData = await confirmRes.json();
            if (confirmData.success) {
              onSuccess(bookingId);
            } else {
              setError('Payment confirmed but booking update failed. Contact support.');
              setStatus('error');
            }
          } catch (e) {
            setError('Payment confirmed but network error occurred. Contact support.');
            setStatus('error');
          }
        },
        modal: {
          ondismiss: () => { setStatus('idle'); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setStatus('error');
    }
  };

  useEffect(() => { startPayment(); }, []);

  return (
    <div className="smb-step smb-payment-step">
      {(status === 'idle' || status === 'loading') && (
        <div className="smb-loading">
          <div className="smb-spinner-lg" />
          <span>Setting up your payment…</span>
        </div>
      )}

      {status === 'paying' && (
        <div className="smb-loading">
          <div className="smb-spinner-lg" />
          <span>Complete the payment in the Razorpay window</span>
        </div>
      )}

      {status === 'error' && (
        <div className="smb-step">
          <div className="smb-error-box">
            <p>⚠️ {error}</p>
            <div className="smb-btn-row" style={{ marginTop: 16 }}>
              <button className="smb-back-btn-inline" onClick={onBack}>← Back</button>
              <button className="smb-primary-btn" onClick={startPayment}>Retry Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialMomentPayment;
