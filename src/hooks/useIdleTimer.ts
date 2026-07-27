"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useIdleTimer = () => {
  const { user, logout } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastActive, setLastActive] = useState<number>(Date.now());

  const resetTimer = () => {
    setLastActive(Date.now());
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (user) {
      timerRef.current = setTimeout(() => {
        logout("Session expired due to inactivity. Please log in again.");
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Events listening for physical interaction
    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'];

    const handleUserActivity = () => {
      resetTimer();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user]);

  return { lastActive };
};