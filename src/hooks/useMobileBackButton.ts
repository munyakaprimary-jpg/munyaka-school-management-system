import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export const useMobileBackButton = (isDrawerOpen: boolean, closeDrawer: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listenerHandler: any;

    const setupListener = async () => {
      try {
        listenerHandler = await App.addListener('backButton', (event) => {
          // Priority 1: If mobile navigation drawer is open, close it
          if (isDrawerOpen) {
            closeDrawer();
            return;
          }

          // Priority 2: If on root page or dashboard, exit or minimize app
          if (location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/login') {
            if (event.canGoBack) {
              window.history.back();
            } else {
              App.exitApp();
            }
            return;
          }

          // Priority 3: Navigate back in history
          navigate(-1);
        });
      } catch (e) {
        // Fallback for standard browser popstate
      }
    };

    setupListener();

    return () => {
      if (listenerHandler && typeof listenerHandler.remove === 'function') {
        listenerHandler.remove();
      }
    };
  }, [isDrawerOpen, closeDrawer, location.pathname, navigate]);
};