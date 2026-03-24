import React, { useState, useEffect } from 'react';

interface SnackDeliveryStepProps {
  movieDuration?: string | number; // e.g. "120" or "2 hr 30 mins"
  initialDeliveryTime: string;
  onBack: () => void;
  onContinue: (deliveryTime: string) => void;
  timeLeft?: number | null;
}

const SnackDeliveryStep: React.FC<SnackDeliveryStepProps> = ({ movieDuration, initialDeliveryTime, onBack, onContinue, timeLeft }) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>(initialDeliveryTime || '35 mins after show starts');

  useEffect(() => {
    // Generate options dynamically if duration is parseable
    let durMins = 0;
    if (typeof movieDuration === 'number') {
      durMins = movieDuration;
    } else if (typeof movieDuration === 'string') {
      const match = movieDuration.match(/(\d+)/g);
      if (match && match.length > 0) {
        if (movieDuration.toLowerCase().includes('hr')) {
          durMins = parseInt(match[0]) * 60 + (match[1] ? parseInt(match[1]) : 0);
        } else {
          durMins = parseInt(match[0]);
        }
      }
    }

    if (durMins > 0) {
      const generated = [];
      for (let t = 15; t <= durMins - 15; t += 20) {
        generated.push(`${t} mins after show starts`);
      }
      if (generated.length === 0) generated.push('15 mins after show starts');
      generated.push('Interval / halfway point');
      setOptions(generated);
      if (!initialDeliveryTime && generated.includes('35 mins after show starts')) {
        setSelected('35 mins after show starts');
      } else if (!initialDeliveryTime) {
        setSelected(generated[0]);
      }
    } else {
      // Fallback
      setOptions([
        '15 mins after show starts',
        '35 mins after show starts',
        '55 mins after show starts',
        'Interval / halfway point'
      ]);
    }
  }, [movieDuration, initialDeliveryTime]);

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
        <h2 className="text-2xl font-bold text-white mb-2">When would you like your snacks?</h2>
        <p className="text-brand-light-gray mb-8">We'll deliver to your seat at your chosen time</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt, idx) => {
            const isSelected = selected === opt;
            return (
              <div 
                key={idx}
                onClick={() => setSelected(opt)}
                className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex items-center ${
                  isSelected 
                    ? 'border-brand-red bg-[#2a1a22]' 
                    : 'border-[#333] bg-[#2a2a2a] hover:border-[#555]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  isSelected ? 'border-brand-red bg-brand-red' : 'border-[#555]'
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span className={`font-medium ${isSelected ? 'text-white' : 'text-[#e5e5e5]'}`}>
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 flex items-center justify-between z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={onBack} className="text-brand-light-gray hover:text-white transition-colors flex items-center px-2">
          <i className="fas fa-arrow-left mr-2"></i> Back
        </button>
        <button
          onClick={() => onContinue(selected)}
          disabled={!selected}
          className="px-8 py-3 rounded-xl font-bold transition-all bg-brand-red text-white hover:bg-red-600 shadow-lg shadow-brand-red/20 disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default SnackDeliveryStep;
