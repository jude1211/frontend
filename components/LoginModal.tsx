
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import Modal from './Modal';
import OTPVerificationModal from './OTPVerificationModal';
import EmailVerificationSuccess from './EmailVerificationSuccess';
import ForgotPasswordModal from './ForgotPasswordModal';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import FormValidationStatus from './FormValidationStatus';
import { useFormValidation } from '../hooks/useFormValidation';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, authError, successMessage, clearMessages, setUserDataManually, userData } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<any>(null);
  const [notification, setNotification] = useState<string>('');
  // Track authentication method to show/hide forgot password option
  // Only manual users should see forgot password, not Google users
  const [authMethod, setAuthMethod] = useState<'manual' | 'google' | null>(null);

  // Initialize form validation
  const {
    formData,
    errors,
    touched,
    isValid,
    handleInputChange,
    handleBlur,
    validateAllFields,
    resetForm
  } = useFormValidation({
    initialData: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    formType: isSignup ? 'signup' : 'login',
    debounceDelay: 300
  });

  // Enhanced input change handler
  const handleFormInputChange = (field: keyof FormData, value: string) => {
    handleInputChange(field, value);
    // Reset auth method when user starts typing (they might switch between manual and Google)
    if (field === 'email') {
      setAuthMethod(null);
    }
    clearMessages(); // Clear both error and success messages
    setNotification('');
  };

  const handleOTPVerification = async (otp: string) => {
    if (!pendingSignupData) return;

    setIsLoading(true);
    try {
      // First verify the OTP
      const verifyResponse = await apiService.verifyOTP({
        email: pendingSignupData.email,
        otp,
        type: 'verification'
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'OTP verification failed');
      }

      // If OTP is valid, proceed with signup
      const signupResponse = await apiService.signup({
        name: pendingSignupData.name,
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        confirmPassword: pendingSignupData.confirmPassword,
        otp
      });

      if (signupResponse.success && signupResponse.data) {
        console.log('✅ Signup successful, logging in user...');

        // Store auth token and user data in localStorage
        localStorage.setItem('authToken', signupResponse.data.token);
        localStorage.setItem('user', JSON.stringify(signupResponse.data.user));

        // Update authentication context to log in the user
        setUserDataManually(signupResponse.data.user);

        // Close OTP modal and show success
        setShowOTPModal(false);
        setShowSuccessModal(true);

        console.log('🎉 User successfully logged in after email verification!');

        // Auto-close success modal and login modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          onClose(); // This will close the login modal
          resetForm();
          setPendingSignupData(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      // Error will be shown in the OTP modal
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔧 Form submitted - isSignup:', isSignup);
    console.log('🔧 Form data:', formData);

    const validationResult = validateAllFields();
    console.log('🔧 Form validation result:', validationResult);

    if (!validationResult.isValid) {
      console.log('❌ Form validation failed, stopping submission');
      return;
    }

    console.log('✅ Form validation passed, proceeding...');

    setIsLoading(true);
    clearMessages(); // Clear any previous messages

    try {
      let success = false;

      if (isSignup) {
        console.log('📝 Initiating signup process...');
        console.log('📧 Sending OTP to email:', formData.email);

        try {
          // Send OTP for email verification
          const response = await apiService.sendOTP({
            email: formData.email,
            type: 'verification'
          });

          console.log('📧 OTP API Response:', response);

          if (response.success) {
            console.log('✅ OTP sent successfully, showing modal...');
            // Store signup data for later completion
            setPendingSignupData({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword
            });
            console.log('🔧 Setting showOTPModal to true');
            setShowOTPModal(true);
            console.log('🔧 showOTPModal state should now be:', true);
            success = true;
          } else {
            console.error('❌ Failed to send OTP:', response);
            setNotification(`Failed to send verification email: ${response.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error('❌ API call failed:', error);
          setNotification(`Error sending verification email: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log('🔐 Submitting login form...');
        setAuthMethod('manual');
        success = await login(formData.email, formData.password);
      }

      if (success && !isSignup) {
        console.log('✅ Login successful, closing modal...');

        // Check if admin login - redirect to admin dashboard
        if (formData.email.toLowerCase() === 'admin@gmail.com') {
          console.log('🔑 Admin login detected, redirecting to admin dashboard...');
          onClose();
          resetForm();
          setTimeout(() => {
            navigate('/admin-dashboard');
          }, 500);
        } else {
          // Regular user login
          onClose();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignup(!isSignup);
    resetForm();
    setAuthMethod(null); // Reset auth method when switching modes
    clearMessages(); // Clear any messages when switching modes
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      setAuthMethod('google');
      const success = await loginWithGoogle();
      if (success) {
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignup ? 'Join BookNView for the best movie experience' : 'Sign in to continue your journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field (Signup only) */}
          {isSignup && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleFormInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors ${
                  errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && touched.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.name}
                </p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleFormInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors ${
                errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && touched.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleFormInputChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors ${
                errors.password && touched.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && touched.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.password}
              </p>
            )}
            
            {/* Password Strength Indicator (Signup only) */}
            {isSignup && formData.password && (
              <PasswordStrengthIndicator password={formData.password} />
            )}
            {/* Forgot Password Link - Only show for manual login users, not Google users */}
            {!isSignup && authMethod !== 'google' && formData.email && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-brand-red hover:text-red-600 text-sm font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            
            {/* Google users info message */}
            {!isSignup && (authMethod === 'google' || userData?.authProvider === 'google') && (
              <div className="text-center mt-2">
                <p className="text-gray-500 text-xs">
                  <i className="fab fa-google mr-1"></i>
                  Google users can reset their password through their Google account settings
                </p>
              </div>
            )}
            

          </div>

          {/* Confirm Password Field (Signup only) */}
          {isSignup && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleFormInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors ${
                  errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Local Notification */}
          {notification && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{notification}</p>
            </div>
          )}

          {/* Auth Error */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{authError}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Form Validation Status */}
          <FormValidationStatus
            isValid={isValid}
            errors={errors}
            touched={touched}
            formType={isSignup ? 'signup' : 'login'}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isSignup ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              isSignup ? 'Create Account' : 'Sign In'
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-brand-red hover:text-red-600 font-semibold ml-1 transition-colors"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Social Login Options */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="w-full">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fab fa-google text-red-500 mr-2"></i>
              {isLoading ? 'Signing in...' : 'Google'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    {/* OTP Verification Modal */}
    <OTPVerificationModal
      isOpen={showOTPModal}
      onClose={() => setShowOTPModal(false)}
      onVerify={handleOTPVerification}
      email={formData.email}
      type="verification"
      isLoading={isLoading}
    />

    {/* Email Verification Success Modal */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-50">
        <EmailVerificationSuccess
          email={formData.email}
          userName={formData.name}
          onContinue={() => {
            setShowSuccessModal(false);
            onClose();
            resetForm();
            setPendingSignupData(null);
          }}
        />
      </div>
    )}

    {/* Forgot Password Modal */}
    <ForgotPasswordModal
      isOpen={showForgotPasswordModal}
      onClose={() => setShowForgotPasswordModal(false)}
    />
  </>
  );
};

export default LoginModal;
