import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const TheatreOwnerProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('theatreOwnerToken') : null;

  if (!token) {
    // Redirect to home where login modal can be opened
    return <Navigate to="/" state={{ from: location, reason: 'theatre_owner_required' }} replace />;
  }

  return <>{children}</>;
};

export default TheatreOwnerProtectedRoute;

