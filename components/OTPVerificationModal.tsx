import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Modal from './Modal';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  email: string;
  type: 'verification' | 'password_reset';
  isLoading: boolean;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  email,
  type,
  isLoading
}) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [isResending, setIsResending] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && isOpen) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError('');
      setSuccess('');
      setTimer(600);
    }
  }, [isOpen]);

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setError('');

    try {
      await onVerify(otp);
    } catch (error: any) {
      setError(error.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.sendOTP({ email, type });
      if (response.success) {
        setSuccess('New verification code sent!');
        setTimer(600); // Reset timer
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    return type === 'verification' ? 'Verify Your Email' : 'Reset Password Verification';
  };

  const getDescription = () => {
    return type === 'verification' 
      ? `We've sent a 6-digit verification code to ${email}. Please enter it below to complete your account creation.`
      : `We've sent a 6-digit verification code to ${email}. Please enter it below to reset your password.`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-brand-gray rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto relative overflow-hidden border border-brand-dark/40">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-red-600"></div>

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="fas fa-envelope-open text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
            {getTitle()}
          </h2>
          <p className="text-brand-light-gray text-sm leading-relaxed px-2">
            {getDescription()}
          </p>

          {/* Email Display */}
          <div className="mt-4 p-4 bg-brand-dark rounded-xl border border-brand-dark/30">
            <p className="text-sm text-brand-light-gray mb-1">Verification code sent to:</p>
            <p className="font-semibold text-white break-all">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="block text-lg font-semibold text-white mb-4 text-center">
              Enter 6-Digit Code
            </label>

            {/* Enhanced OTP Input */}
            <div className="relative">
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="● ● ● ● ● ●"
                maxLength={6}
                className="w-full px-6 py-5 text-center text-3xl font-mono tracking-[0.5em] border-3 border-brand-dark rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-red focus:ring-opacity-30 focus:border-brand-red transition-all duration-300 bg-brand-dark hover:bg-brand-dark/80 text-white"
                autoComplete="one-time-code"
                autoFocus
                style={{ letterSpacing: '0.5em' }}
              />

              {/* Input Progress Indicator */}
              <div className="flex justify-center mt-3 space-x-2">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index < otp.length
                        ? 'bg-brand-red scale-110'
                        : 'bg-brand-light-gray'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="flex justify-between items-center mt-6 p-4 bg-brand-dark rounded-xl border border-brand-dark/30">
              <div className="flex items-center space-x-2">
                <i className={`fas fa-clock text-sm ${timer > 0 ? 'text-brand-red' : 'text-red-500'}`}></i>
                <span className={`text-sm font-medium ${timer > 0 ? 'text-brand-light-gray' : 'text-red-500'}`}>
                  {timer > 0 ? `Expires in ${formatTime(timer)}` : 'Code expired'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={timer > 0 || isResending}
                className="text-sm font-semibold text-brand-red hover:text-red-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-red"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo text-xs"></i>
                    <span>{timer > 0 ? 'Resend Code' : 'Send New Code'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 border-l-4 border-red-500 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-white mr-3"></i>
                <p className="text-white text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-600 border-l-4 border-green-500 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-white mr-3"></i>
                <p className="text-white text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                <span>Verifying Code...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <i className="fas fa-shield-alt mr-2"></i>
                <span>Verify & Continue</span>
              </div>
            )}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full text-brand-light-gray py-3 px-4 rounded-xl font-medium hover:text-white hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 mt-3"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel Verification
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-brand-dark rounded-xl border border-brand-dark/30">
          <h4 className="text-sm font-semibold text-brand-red mb-2 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Need Help?
          </h4>
          <div className="space-y-2 text-xs text-brand-light-gray">
            <div className="flex items-start">
              <i className="fas fa-envelope text-brand-red mr-2 mt-0.5 text-xs"></i>
              <span>Check your email inbox and spam folder</span>
            </div>
            <div className="flex items-start">
              <i className="fas fa-clock text-brand-red mr-2 mt-0.5 text-xs"></i>
              <span>Code expires in 10 minutes</span>
            </div>
            <div className="flex items-start">
              <i className="fas fa-redo text-brand-red mr-2 mt-0.5 text-xs"></i>
              <span>You can request a new code after expiry</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-brand-light-gray flex items-center justify-center">
            <i className="fas fa-lock mr-1"></i>
            Your email verification is secure and encrypted
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default OTPVerificationModal;
