import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { showError } from "@/utils/toast";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

/**
 * useInactivityTimeout
 *
 * Watches for user activity across the document. After 15 minutes of
 * continuous inactivity, the user is automatically logged out, shown a
 * notification, and redirected to the /login page.
 *
 * - The timer only runs while the user is authenticated.
 * - Any monitored activity event resets the timer.
 * - All event listeners and timers are cleaned up on unmount or when the
 *   user becomes unauthenticated, so there are no leaks or duplicate timers.
 */
export const useInactivityTimeout = (): void => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // No session -> no need to track inactivity.
      return;
    }

    const resetTimer = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleTimeout, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
      resetTimer();
    };

    const handleTimeout = () => {
      logout();
      showError("You have been logged out due to 15 minutes of inactivity.");
      navigate("/login", { replace: true });
    };

    // Start the initial timer.
    resetTimer();

    // Subscribe to user activity events.
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, logout, navigate]);
};

export default useInactivityTimeout;
