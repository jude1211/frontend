import React from 'react';

interface SnackPromptStepProps {
  onSkip: () => void;
  onContinue: () => void;
}

const SnackPromptStep: React.FC<SnackPromptStepProps> = ({ onSkip, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-brand-dark/40 min-h-[60vh] rounded-2xl border border-brand-dark/40">
      <div className="text-6xl mb-6">🍿</div>
      <h2 className="text-3xl font-bold text-white mb-2 text-center">Want snacks with your movie?</h2>
      <p className="text-brand-light-gray text-center mb-10 max-w-md">
        Order now and get them delivered to your seat during the show
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={onSkip}
          className="flex-1 py-3 px-6 rounded-xl border border-[#444] text-[#ccc] hover:bg-[#222] transition-colors font-medium text-center"
        >
          Skip
        </button>
        <button
          onClick={onContinue}
          className="flex-1 py-3 px-6 rounded-xl bg-brand-red text-white hover:bg-red-600 transition-colors font-bold text-center"
        >
          Yes, Add Snacks →
        </button>
      </div>
    </div>
  );
};

export default SnackPromptStep;
