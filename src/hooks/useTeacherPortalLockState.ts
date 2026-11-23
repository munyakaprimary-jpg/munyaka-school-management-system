import { useState, useEffect, useRef } from 'react';
import { db } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Unified Teacher Portal Lock State Hook
 *
 * Single source of truth: `isTeacherAppLocked` from localStorage.
 * The Teacher Portal Locked screen ONLY triggers when this flag is explicitly true.
 *
 * Debug: console.debug `[LockGuard] isTeacherAppLocked:` and its source
 *   (`localStorage` vs `Firestore`) when evaluating the Teacher Portal route.
 */

export function useTeacherPortalLockState() {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const locked = localStorage.getItem('isTeacherAppLocked') === 'true';
      console.debug(
        `[LockGuard] isTeacherAppLocked: ${locked} (source: localStorage)`
      );
      return locked;
    } catch {
      return false;
    }
  });

  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      if (db) {
        const docRef = doc(db, 'system_settings', 'global_lock');
        unsubscribe = onSnapshot(
          docRef,
          (docSnap) => {
            try {
              const storedLocal = localStorage.getItem('isTeacherAppLocked');

              // If localStorage explicitly says unlocked, keep it unlocked.
              // This is the exact disconnect fix: Firestore must not re-lock
              // after the operator has manually unlocked via Jamlyan Analytics.
              if (storedLocal === 'false') {
                if (isLockedRef.current !== false) {
                  setIsLocked(false);
                }
                console.debug(
                  `[LockGuard] isTeacherAppLocked: false (source: localStorage — Firestore ignored)`
                );
                return;
              }

              if (docSnap.exists()) {
                const data = docSnap.data();
                const firestoreLocked = Boolean(
                  data?.isTeacherAppLocked ??
                  data?.teacherAppLocked ??
                  data?.locked
                );

                if (firestoreLocked) {
                  setIsLocked(true);
                  localStorage.setItem('isTeacherAppLocked', 'true');
                  console.debug(
                    `[LockGuard] isTeacherAppLocked: true (source: Firestore)`
                  );
                } else {
                  setIsLocked(false);
                  localStorage.setItem('isTeacherAppLocked', 'false');
                  console.debug(
                    `[LockGuard] isTeacherAppLocked: false (source: Firestore)`
                  );
                }
              }
            } catch (err) {
              console.warn('[LockGuard] Firestore snapshot handler error:', err);
            }
          },
          () => {
            // Silent error handler — Firestore may be unavailable
          }
        );
      }
    } catch (err) {
      console.warn('[LockGuard] Firestore subscription failed:', err);
    }

    // Sync localStorage changes (storage event fires in OTHER tabs)
    const handleStorage = () => {
      try {
        const locked = localStorage.getItem('isTeacherAppLocked') === 'true';
        if (isLockedRef.current !== locked) {
          setIsLocked(locked);
          console.debug(
            `[LockGuard] isTeacherAppLocked: ${locked} (source: localStorage storage event)`
          );
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return isLocked;
}
