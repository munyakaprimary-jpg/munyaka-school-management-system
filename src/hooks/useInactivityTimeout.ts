import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)

export const useInactivityTimeout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    if (!isAuthenticated) return;
    
    // Clear user session/auth state
    logout();
    
    // Show toast or alert message notifying the user
    toast.error("You have been logged out due to 15 minutes of inactivity.", {
      duration: 6000,
      position: 'top-center',
    });

    // Redirect directly to login page
    navigate('/login', { replace: true });
  }, [isAuthenticated, logout, navigate]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    // If not authenticated, clear any existing timer and listeners
    if (!isAuthenticated || location.pathname === '/login') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // List of events to listen for across the app
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Initialize timer on mount or when authenticated
    resetTimer();

    // Attach event listeners with passive option for performance where applicable
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Clean cleanup on unmount or when auth status changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, location.pathname, resetTimer]);
};
