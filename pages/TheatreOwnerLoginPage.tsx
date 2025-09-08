import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const TheatreOwnerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.theatreOwnerLogin(formData.username, formData.password);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('theatreOwnerToken', response.data.token);
        localStorage.setItem('theatreOwnerData', JSON.stringify(response.data.theatreOwner));
        
        // Redirect to theatre owner dashboard
        navigate('/theatre-owner/dashboard');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-building text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Theatre Owner Login</h1>
            <p className="text-gray-400">Access your theatre management dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/theatre-owner/apply')}
                className="text-red-400 hover:text-red-300 font-medium"
              >
                Apply for Theatre Registration
              </button>
            </p>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button 
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white text-sm flex items-center justify-center mx-auto"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Main Site
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <i className="fas fa-info-circle text-blue-400 mr-2"></i>
            For Theatre Owners
          </h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start">
              <i className="fas fa-check text-green-400 mr-2 mt-0.5"></i>
              Manage your theatre shows and bookings
            </li>
            <li className="flex items-start">
              <i className="fas fa-check text-green-400 mr-2 mt-0.5"></i>
              Track revenue and analytics
            </li>
            <li className="flex items-start">
              <i className="fas fa-check text-green-400 mr-2 mt-0.5"></i>
              Configure seating and pricing
            </li>
            <li className="flex items-start">
              <i className="fas fa-check text-green-400 mr-2 mt-0.5"></i>
              Access customer support
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TheatreOwnerLoginPage;
