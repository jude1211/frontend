
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Check for admin authentication for admin routes
  if (adminOnly) {
    const isAdmin = localStorage.getItem('BookNView_isAdmin') === 'true';
    if (!isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
  }

  // Check for user authentication for user routes
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
