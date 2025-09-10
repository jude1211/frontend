import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookNViewLoader from '../components/BookNViewLoader';
import { useAuth } from '../context/AuthContext';

const TheatreOwnerLanding: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      if (currentUser?.role === 'theatre_owner') {
        navigate('/theatre-owner/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
      return;
    }

    // Automatically redirect to theatre owner dashboard
    const timer = setTimeout(() => {
      navigate('/theatre-owner');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray flex items-center justify-center">
      <div className="text-center">
        <BookNViewLoader size="lg" text="Redirecting to Theatre Owner Dashboard..." />
        <p className="text-white mt-4">You will be redirected automatically...</p>
      </div>
    </div>
  );
};

export default TheatreOwnerLanding; 