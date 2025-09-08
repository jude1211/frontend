import React, { useState } from 'react';
import { apiService } from '../services/api';

interface EmailVerificationStatusProps {
  email: string;
  isVerified: boolean;
  onVerificationComplete?: () => void;
}

const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({
  email,
  isVerified,
  onVerificationComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await apiService.sendOTP({
        email,
        type: 'verification'
      });

      if (response.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-check-circle text-green-500 text-xl"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Email Verified
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your email address <span className="font-semibold">{email}</span> has been verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please verify your email address <span className="font-semibold">{email}</span> to complete your account setup.
          </p>
          
          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-envelope mr-2"></i>
                  Send Verification Email
                </>
              )}
            </button>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 flex items-center">
                <i className="fas fa-check mr-2"></i>
                {message}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationStatus;
