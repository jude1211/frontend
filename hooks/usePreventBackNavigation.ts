import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UsePreventBackNavigationProps {
  redirectPath: string;
  shouldPrevent?: boolean;
}

export const usePreventBackNavigation = ({ 
  redirectPath, 
  shouldPrevent = true 
}: UsePreventBackNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    if (!shouldPrevent || !isAuthenticated) return;

    // Function to handle back navigation
    const handleBackNavigation = () => {
      // Check if user is trying to go back to a login page
      const loginPages = ['/admin', '/theatre-owner-landing', '/'];
      const isLoginPage = loginPages.includes(location.pathname);
      
      if (isLoginPage) {
        // Replace current history entry to prevent going back
        window.history.replaceState(null, '', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    };

    // Add event listener for popstate (back button)
    window.addEventListener('popstate', handleBackNavigation);

    // Also prevent going back by manipulating history
    const preventBack = () => {
      window.history.pushState(null, '', redirectPath);
    };

    // Push a new state to prevent back navigation
    window.history.pushState(null, '', redirectPath);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
    };
  }, [isAuthenticated, location.pathname, redirectPath, navigate, shouldPrevent]);

  // Function to manually prevent back navigation
  const preventBackNavigation = () => {
    window.history.pushState(null, '', redirectPath);
  };

  return { preventBackNavigation };
};