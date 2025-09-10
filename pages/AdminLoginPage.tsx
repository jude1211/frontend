
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (currentUser?.isAdmin || currentUser?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('BookNView_isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials. Use admin/password.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-brand-gray p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-brand-dark rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-red"
              placeholder="password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-brand-red text-white py-3 rounded-md font-bold text-lg hover:bg-red-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
