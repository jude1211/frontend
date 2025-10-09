import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const TheatreOwnerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.theatreOwnerLogin(formData.username, formData.password);
      
      if (response.success) {
        navigate('/theatre-owner/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray flex items-center justify-center">
      <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-8 max-w-md w-full mx-4 border border-brand-dark/40 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-film text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Theatre Owner Login</h1>
          <p className="text-brand-light-gray">Access your theatre management dashboard</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-600 text-red-300 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              Username or Email
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-brand-light-gray text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/theatre-owner-signup')}
              className="text-brand-red hover:text-red-400 font-semibold transition-colors"
            >
              Apply to become a theatre owner
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-brand-light-gray hover:text-white transition-colors text-sm"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TheatreOwnerLoginPage;











