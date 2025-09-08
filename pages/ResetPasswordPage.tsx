import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
      setTokenValid(false);
      return;
    }

    // Verify token validity
    verifyToken();
  }, [token, email]);

  const verifyToken = async () => {
    try {
      const response = await apiService.verifyResetToken(token!, email!);
      if (response.success) {
        setTokenValid(true);
      } else {
        setError('This reset link has expired or is invalid. Please request a new password reset.');
        setTokenValid(false);
      }
    } catch (error) {
      setError('Unable to verify reset link. Please try again.');
      setTokenValid(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.resetPassword(token!, email!, password);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewReset = () => {
    navigate('/', { replace: true });
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-brand-light-gray">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="bg-brand-gray rounded-lg p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
            <p className="text-brand-light-gray mb-6">{error}</p>
            <button
              onClick={handleRequestNewReset}
              className="w-full bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="bg-brand-gray rounded-lg p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h2>
            <p className="text-brand-light-gray mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <div className="bg-green-600 text-white p-3 rounded-lg text-sm mb-6">
              Redirecting to login page in 3 seconds...
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-brand-red/10 to-red-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-brand-red/5 to-red-600/5 rounded-full blur-3xl"></div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 w-full max-w-md mx-auto border border-white/20 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red via-red-500 to-red-600"></div>
        
        {/* Header with enhanced styling */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <i className="fas fa-lock text-white text-4xl"></i>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">Enter your new password below to secure your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <i className="fas fa-shield-alt text-brand-red mr-2"></i>
                New Password
              </label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors duration-300"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-red/20 focus:border-brand-red transition-all duration-300 hover:border-gray-300"
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-red transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <i className="fas fa-check-circle text-brand-red mr-2"></i>
                Confirm New Password
              </label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors duration-300"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-red/20 focus:border-brand-red transition-all duration-300 hover:border-gray-300"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-red transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Password Requirements */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
              <i className="fas fa-info-circle text-brand-red mr-2"></i>
              <p className="text-gray-700 text-sm font-semibold">Password Requirements</p>
            </div>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex items-center">
                <i className={`fas fa-check mr-3 ${password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}></i>
                <span className={password.length >= 8 ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                  At least 8 characters
                </span>
              </li>
              <li className="flex items-center">
                <i className={`fas fa-check mr-3 ${/(?=.*[a-z])/.test(password) ? 'text-green-500' : 'text-gray-400'}`}></i>
                <span className={/(?=.*[a-z])/.test(password) ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                  One lowercase letter
                </span>
              </li>
              <li className="flex items-center">
                <i className={`fas fa-check mr-3 ${/(?=.*[A-Z])/.test(password) ? 'text-green-500' : 'text-gray-400'}`}></i>
                <span className={/(?=.*[A-Z])/.test(password) ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                  One uppercase letter
                </span>
              </li>
              <li className="flex items-center">
                <i className={`fas fa-check mr-3 ${/(?=.*\d)/.test(password) ? 'text-green-500' : 'text-gray-400'}`}></i>
                <span className={/(?=.*\d)/.test(password) ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                  One number
                </span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-2xl text-sm flex items-center animate-pulse">
              <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-4 rounded-2xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transform hover:scale-105 disabled:hover:scale-100 hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Resetting Password...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-3"></i>
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={handleRequestNewReset}
            className="text-brand-red hover:text-red-600 transition-colors text-sm font-semibold flex items-center justify-center mx-auto hover:scale-105 transform duration-200"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
