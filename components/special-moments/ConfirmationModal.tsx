import React from 'react';

interface Props {
  theatre: string;
  date: string;
  screen: string;
  time: string;
  onClose: () => void;
  onProceed: () => void;
}

const ConfirmationModal: React.FC<Props> = ({ theatre, date, screen, time, onClose, onProceed }) => {
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="smb-modal-overlay">
      <div className="smb-modal">
        <div className="smb-modal-icon">🎬</div>
        <h3 className="smb-modal-title">Confirm Your Selection</h3>
        <p className="smb-modal-subtitle">Here are your booking details</p>

        <div className="smb-modal-details">
          <div className="smb-modal-row">
            <span className="smb-modal-key">Theatre</span>
            <span className="smb-modal-val">{theatre}</span>
          </div>
          <div className="smb-modal-row">
            <span className="smb-modal-key">Date</span>
            <span className="smb-modal-val">{formattedDate}</span>
          </div>
          <div className="smb-modal-row">
            <span className="smb-modal-key">Screen</span>
            <span className="smb-modal-val">{screen}</span>
          </div>
          <div className="smb-modal-row">
            <span className="smb-modal-key">Time</span>
            <span className="smb-modal-val">{time}</span>
          </div>
        </div>

        <div className="smb-modal-actions">
          <button className="smb-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="smb-modal-proceed" onClick={onProceed}>Proceed →</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
