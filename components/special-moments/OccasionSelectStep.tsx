import React from 'react';

interface Props {
  onBack: () => void;
  onSelect: (occasion: 'birthday' | 'moment' | 'valentine') => void;
}

const OCCASIONS = [
  {
    key: 'birthday' as const,
    title: 'Birthdays!',
    emoji: '🎂',
    description: "Make your loved one's birthday unforgettable on the big screen",
    color: '#e91e8c',
    bg: 'linear-gradient(135deg,#1a0a2e,#2d1045)',
  },
  {
    key: 'moment' as const,
    title: 'Share the Moment!',
    emoji: '📸',
    description: 'See yourself on the big screen — feel seen and celebrated',
    color: '#2196f3',
    bg: 'linear-gradient(135deg,#0a1a2e,#102d45)',
  },
  {
    key: 'valentine' as const,
    title: "Valentine's!",
    emoji: '💖',
    description: 'Express love in a grand, unforgettable way',
    color: '#e91e8c',
    bg: 'linear-gradient(135deg,#2e0a1a,#401025)',
  },
];

const OccasionSelectStep: React.FC<Props> = ({ onBack, onSelect }) => (
  <div className="smb-step">
    <button className="smb-back-btn" onClick={onBack}>← Back</button>
    <div className="smb-step-header">
      <h2 className="smb-step-title">Choose Your Occasion</h2>
      <p className="smb-step-subtitle">What are you celebrating?</p>
    </div>

    <div className="smb-occasion-grid">
      {OCCASIONS.map(occ => (
        <button
          key={occ.key}
          className="smb-occasion-card"
          style={{ background: occ.bg, '--occ-color': occ.color } as React.CSSProperties}
          onClick={() => onSelect(occ.key)}
        >
          <span className="smb-occasion-emoji">{occ.emoji}</span>
          <h3 className="smb-occasion-title">{occ.title}</h3>
          <p className="smb-occasion-desc">{occ.description}</p>
          <span className="smb-occasion-cta" style={{ color: occ.color }}>Select →</span>
        </button>
      ))}
    </div>
  </div>
);

export default OccasionSelectStep;
