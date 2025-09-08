import React from 'react';

interface EmailVerificationSuccessProps {
  email: string;
  userName?: string;
  onContinue: () => void;
}

const EmailVerificationSuccess: React.FC<EmailVerificationSuccessProps> = ({
  email,
  userName,
  onContinue
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600"></div>
          
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <i className="fas fa-check text-white text-4xl"></i>
            </div>
            
            {/* Confetti Effect */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Email Verified! 🎉
          </h1>
          
          <p className="text-gray-600 mb-2">
            {userName ? `Welcome, ${userName}!` : 'Welcome!'}
          </p>
          
          <p className="text-gray-600 mb-8">
            Your email address <span className="font-semibold text-blue-600">{email}</span> has been successfully verified.
          </p>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Your account is now ready!
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-green-500 mr-3"></i>
                <span className="text-sm text-gray-700">Secure account access</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-bell text-blue-500 mr-3"></i>
                <span className="text-sm text-gray-700">Email notifications enabled</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-user-check text-purple-500 mr-3"></i>
                <span className="text-sm text-gray-700">Full platform access</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-lock text-indigo-500 mr-3"></i>
                <span className="text-sm text-gray-700">Enhanced security features</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <i className="fas fa-arrow-right mr-2"></i>
            Continue to Dashboard
          </button>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center justify-center">
              <i className="fas fa-info-circle mr-2"></i>
              You can now access all features of BookNView
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSuccess;
