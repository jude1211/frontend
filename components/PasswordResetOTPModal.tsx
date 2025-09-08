import React, { useState } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';

interface PasswordResetOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const PasswordResetOTPModal: React.FC<PasswordResetOTPModalProps> = ({ isOpen, onClose, email }) => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.verifyResetOTP(otp, email);
      
      if (response.success) {
        setStep('password');
        setError('');
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.resetPasswordWithOTP(otp, email, newPassword);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setStep('otp');
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="bg-brand-gray rounded-lg p-8 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h2>
            <p className="text-brand-light-gray mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <div className="bg-green-600 text-white p-3 rounded-lg text-sm mb-6">
              Closing in 3 seconds...
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-brand-gray rounded-lg p-8 w-full max-w-md mx-auto">
        {step === 'otp' ? (
          <>
            {/* OTP Step */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enter OTP</h2>
              <p className="text-brand-light-gray">
                We've sent a 6-digit OTP to your email address.
              </p>
              <div className="bg-brand-dark p-3 rounded-lg mt-3">
                <p className="text-white font-medium">{email}</p>
              </div>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-brand-light-gray mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isLoading}
                />
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
                className="w-full bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Verify OTP
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-brand-red hover:text-red-400 transition-colors text-sm font-medium"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Password Reset Step */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
              <p className="text-brand-light-gray">
                OTP verified successfully. Enter your new password below.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-brand-light-gray mb-2">
                  New Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light-gray hover:text-white"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-light-gray mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light-gray hover:text-white"
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-brand-dark p-3 rounded-lg">
                <p className="text-brand-light-gray text-xs mb-2">Password must contain:</p>
                <ul className="text-xs text-brand-light-gray space-y-1">
                  <li className="flex items-center">
                    <i className={`fas fa-check mr-2 ${newPassword.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}></i>
                    At least 8 characters
                  </li>
                  <li className="flex items-center">
                    <i className={`fas fa-check mr-2 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}></i>
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <i className={`fas fa-check mr-2 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}></i>
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <i className={`fas fa-check mr-2 ${/(?=.*\d)/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}></i>
                    One number
                  </li>
                </ul>
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
                className="w-full bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep('otp')}
                className="text-brand-red hover:text-red-400 transition-colors text-sm font-medium"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to OTP
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PasswordResetOTPModal; 