import React, { useState } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import PasswordResetOTPModal from './PasswordResetOTPModal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [showOTPModal, setShowOTPModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('🔐 Sending forgot password request for:', email);
      console.log('🔐 API Base URL:', 'https://backend-bnv.onrender.com/api/v1');
      console.log('🔐 Frontend URL:', window.location.origin);

      const response = await apiService.forgotPassword(email);
      console.log('🔐 Forgot password response:', response);

      if (response.success) {
        setStep('sent');
        setMessage(response.message || 'Password reset OTP has been sent to your email address.');
        console.log('✅ Password reset OTP request successful');
        // Show OTP modal after successful email send
        setTimeout(() => {
          setShowOTPModal(true);
        }, 1000);
      } else {
        console.error('❌ Password reset request failed:', response.message);
        
        // Check if it's a Google user error
        if (response.message && response.message.includes('Google')) {
          setError('This account was created with Google. Please reset your password through your Google account settings.');
        } else {
          setError(response.message || 'Failed to send reset OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Unable to connect to server. Please ensure the backend is running on port 5002.');
      } else if (error.message.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else if (error.message.includes('CORS')) {
        setError('Cross-origin request blocked. Please check CORS configuration.');
      } else {
        setError(`Connection error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setError('');
    setStep('email');
    setShowOTPModal(false);
    onClose();
  };

  const handleBackToLogin = () => {
    handleClose();
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="absolute inset-0 bg-brand-gray rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto border border-brand-dark/40 relative overflow-hidden" style={{ margin: '0', backgroundColor: 'transparent' }}>
        <div className="bg-brand-gray rounded-2xl shadow-2xl p-8 w-full border border-brand-dark/40 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-red-600"></div>
          
          {step === 'email' ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-key text-white text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-brand-light-gray">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-light-gray mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"></i>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-600 text-white p-3 rounded-lg text-sm flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Send Reset Instructions
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-brand-red hover:text-red-400 transition-colors text-sm font-medium"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-white text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                <p className="text-brand-light-gray mb-6">
                  We've sent password reset OTP to:
                </p>
                <div className="bg-brand-dark p-4 rounded-lg mb-6">
                  <p className="text-white font-medium">{email}</p>
                </div>
                <p className="text-brand-light-gray text-sm mb-6">
                  If you don't see the email in your inbox, please check your spam folder.
                </p>
                <p className="text-brand-light-gray text-sm mb-6">
                  The OTP modal will open automatically in a few seconds...
                </p>

                {message && (
                  <div className="bg-green-600 text-white p-3 rounded-lg text-sm mb-6 flex items-center">
                    <i className="fas fa-info-circle mr-2"></i>
                    {message}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    Back to Login
                  </button>
                  
                  <button
                    onClick={() => setStep('email')}
                    className="w-full text-brand-light-gray hover:text-white transition-colors text-sm"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>

    {/* Password Reset OTP Modal */}
    <PasswordResetOTPModal
      isOpen={showOTPModal}
      onClose={() => setShowOTPModal(false)}
      email={email}
    />
  </>
  );
};

export default ForgotPasswordModal;
