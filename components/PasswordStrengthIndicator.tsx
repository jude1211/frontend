import React from 'react';
import { getPasswordStrength } from '../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showIndicator?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showIndicator = true 
}) => {
  if (!showIndicator || !password) return null;

  const strength = getPasswordStrength(password);
  const percentage = (strength.score / 5) * 100;

  const getProgressColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getRequirements = () => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' },
      { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character' }
    ];
    return requirements;
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(strength.score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Strength Label */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${strength.color}`}>
          {strength.label}
        </span>
        <span className="text-gray-500">
          {strength.score}/5
        </span>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        {getRequirements().map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            <span className={`mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator; 