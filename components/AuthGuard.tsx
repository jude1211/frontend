import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  theatreOwnerOnly?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  adminOnly = false, 
  theatreOwnerOnly = false 
}) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Prevent back navigation to login pages
    const handlePopState = (event: PopStateEvent) => {
      // If user tries to go back to a login page while authenticated, redirect them
      if (isAuthenticated) {
        if (location.pathname === '/admin' || location.pathname === '/theatre-owner-landing') {
          // Redirect to appropriate dashboard
          if (adminOnly || currentUser?.isAdmin) {
            window.history.replaceState(null, '', '/admin/dashboard');
            window.location.reload();
          } else if (theatreOwnerOnly || currentUser?.role === 'theatre_owner') {
            window.history.replaceState(null, '', '/theatre-owner/dashboard');
            window.location.reload();
          } else {
            window.history.replaceState(null, '', '/profile');
            window.location.reload();
          }
        }
      }
    };

    // Add event listener for back button
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, location.pathname, adminOnly, theatreOwnerOnly, currentUser]);

  // If user is authenticated, redirect them away from login pages
  if (isAuthenticated) {
    if (adminOnly || currentUser?.isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (theatreOwnerOnly || currentUser?.role === 'theatre_owner') {
      return <Navigate to="/theatre-owner/dashboard" replace />;
    } else {
      return <Navigate to="/profile" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;