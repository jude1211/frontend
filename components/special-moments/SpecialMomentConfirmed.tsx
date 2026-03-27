import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BookingState {
  theatre: { _id: string; name: string; address: string } | null;
  showDate: string;
  screen: string;
  showTime: string;
  occasion: string;
  recipientName: string;
  message: string;
  totalAmount: number;
}

interface Props {
  bookingId: string;
  booking: BookingState;
}

const OCCASION_LABEL: Record<string, string> = {
  birthday: 'Birthdays 🎂',
  moment: 'Share the Moment 📸',
  valentine: "Valentine's 💖",
};

const SpecialMomentConfirmed: React.FC<Props> = ({ bookingId, booking }) => {
  const navigate = useNavigate();

  const formattedDate = booking.showDate
    ? new Date(booking.showDate + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : booking.showDate;

  return (
    <div className="smb-confirmed">
      <div className="smb-confirmed-icon">🎉</div>
      <h2 className="smb-confirmed-title">Booking Confirmed!</h2>
      <p className="smb-confirmed-id">Booking ID: <strong>{bookingId}</strong></p>

      <div className="smb-confirmed-details">
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">Theatre</span>
          <span className="smb-confirmed-val">{booking.theatre?.name || '—'}</span>
        </div>
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">Date</span>
          <span className="smb-confirmed-val">{formattedDate}</span>
        </div>
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">Time</span>
          <span className="smb-confirmed-val">{booking.showTime}</span>
        </div>
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">Screen</span>
          <span className="smb-confirmed-val">{booking.screen}</span>
        </div>
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">Occasion</span>
          <span className="smb-confirmed-val">{OCCASION_LABEL[booking.occasion] || booking.occasion}</span>
        </div>
        <div className="smb-confirmed-row">
          <span className="smb-confirmed-key">For</span>
          <span className="smb-confirmed-val">{booking.recipientName}</span>
        </div>
        {booking.message && (
          <div className="smb-confirmed-row">
            <span className="smb-confirmed-key">Message</span>
            <span className="smb-confirmed-val smb-confirmed-message">"{booking.message}"</span>
          </div>
        )}
        <div className="smb-confirmed-row smb-confirmed-total">
          <span className="smb-confirmed-key">Amount Paid</span>
          <span className="smb-confirmed-val smb-confirmed-price">₹{booking.totalAmount}</span>
        </div>
      </div>

      <div className="smb-confirmed-actions">
        <button className="smb-secondary-btn" onClick={() => navigate('/bookings')}>
          My Bookings
        </button>
        <button className="smb-primary-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SpecialMomentConfirmed;
