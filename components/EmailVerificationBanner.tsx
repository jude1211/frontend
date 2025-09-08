import React, { useState } from 'react';
import { apiService } from '../services/api';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
  onVerificationStart?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  onDismiss,
  onVerificationStart
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [message, setMessage] = useState('');

  const handleSendVerification = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiService.sendOTP({
        email,
        type: 'verification'
      });

      if (response.success) {
        setMessage('Verification email sent! Check your inbox.');
        if (onVerificationStart) {
          onVerificationStart();
        }
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('Failed to send verification email. Please try again.');
      }
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 border-l-4 border-orange-500 shadow-lg">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-orange-600">
              <i className="fas fa-exclamation-triangle text-white text-lg"></i>
            </span>
            <div className="ml-3 font-medium text-white">
              <span className="md:hidden">
                Verify your email to unlock all features
              </span>
              <span className="hidden md:inline">
                Please verify your email address <span className="font-bold">{email}</span> to access all features
              </span>
            </div>
          </div>
          
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <div className="flex space-x-2">
              <button
                onClick={handleSendVerification}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-envelope mr-2"></i>
                    Verify Now
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            >
              <span className="sr-only">Dismiss</span>
              <i className="fas fa-times text-white text-lg"></i>
            </button>
          </div>
        </div>
        
        {/* Success/Error Message */}
        {message && (
          <div className="mt-3 px-3 py-2 bg-white bg-opacity-20 rounded-md">
            <p className="text-sm text-white font-medium flex items-center">
              <i className={`fas ${message.includes('sent') ? 'fa-check' : 'fa-exclamation-circle'} mr-2`}></i>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
