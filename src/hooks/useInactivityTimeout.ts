"use client";

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

/**
 * Read the current authentication state from localStorage without going
 * through React context. We need this because the inactivity hook was
 * being called from inside `AuthProvider` itself, which caused the
 * `useAuth must be used within AuthProvider` runtime error: the hook
 * tried to consume the context before the provider's children mounted.
 *
 * Reading directly from the same storage key the provider uses
 * (`munyaka_session`) keeps the two implementations in lockstep and
 * avoids the circular dependency.
 */
const readIsAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem("munyaka_session");
  } catch {
    return false;
  }
};

/**
 * useInactivityTimeout
  *
  * Watches for user activity across the document. After 10 minutes of
  * continuous inactivity, the user is automatically logged out, shown a
  * notification, and redirected to the /login page.
 *
 * - The timer is bootstrapped once on mount and only re-armed when the
 *   user is currently authenticated. We re-read the auth flag from
 *   localStorage on every activity event so a logout in another tab is
 *   respected within a few seconds.
 * - Any monitored activity event resets the timer.
 * - All event listeners and timers are cleaned up on unmount, so there
 *   are no leaks or duplicate timers.
 */
export const useInactivityTimeout = (): void => {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      // Skip re-arming if the user is no longer authenticated.
      if (!readIsAuthenticated()) {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleTimeout, INACTIVITY_TIMEOUT_MS);
    };

    const handleTimeout = () => {
      // Only perform the logout if the user is still logged in.
      if (!readIsAuthenticated()) return;

      try {
        window.localStorage.removeItem("munyaka_session");
      } catch {
        /* storage may be unavailable in private mode — best effort */
      }
      showError("You have been logged out due to 10 minutes of inactivity.");
      navigate("/login", { replace: true });
    };

    // Initial arm so a session that's already authenticated gets
    // monitored immediately. If the user isn't signed in, we still
    // subscribe to activity events so the next successful login
    // starts the timer on their first interaction.
    if (readIsAuthenticated()) {
      handleActivity();
    }

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
  }, [navigate]);
};

export default useInactivityTimeout;