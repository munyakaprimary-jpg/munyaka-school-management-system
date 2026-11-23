import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useTeacherPortalLockState() {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const manualLock = localStorage.getItem('munyaka_teacher_app_locked') === 'true' ||
                         localStorage.getItem('munyaka_teacher_apps_lock_persistent') === 'true' ||
                         localStorage.getItem('munyaka_global_app_lock') === 'true';
      const bypass = localStorage.getItem('munyaka_lock_bypass') === 'true';

      if (bypass) return false;
      if (manualLock) return true;
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkState = () => {
      try {
        const manualLock = localStorage.getItem('munyaka_teacher_app_locked') === 'true' ||
                           localStorage.getItem('munyaka_teacher_apps_lock_persistent') === 'true' ||
                           localStorage.getItem('munyaka_global_app_lock') === 'true';
        const bypass = localStorage.getItem('munyaka_lock_bypass') === 'true';

        if (bypass) {
          setIsLocked(false);
          return;
        }
        if (manualLock) {
          setIsLocked(true);
          return;
        }
        setIsLocked(false);
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', checkState);
    const interval = setInterval(checkState, 1000);

    let unsubscribe: (() => void) | undefined;
    const timeout = setTimeout(() => {
      // guarantee no hanging
    }, 2500);

    try {
      if (db) {
        const docRef = doc(db, 'system_settings', 'global_lock');
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreLocked = data.teacherAppLocked || data.locked || false;
            const firestoreBypass = data.platformBypass || data.lockBypass || false;

            if (firestoreBypass) {
              setIsLocked(false);
              // Also clear local manual lock if bypass is active
              localStorage.setItem('munyaka_teacher_app_locked', 'false');
              localStorage.setItem('munyaka_teacher_apps_lock_persistent', 'false');
              localStorage.setItem('munyaka_global_app_lock', 'false');
            } else if (firestoreLocked) {
              setIsLocked(true);
              localStorage.setItem('munyaka_teacher_app_locked', 'true');
              localStorage.setItem('munyaka_teacher_apps_lock_persistent', 'true');
              localStorage.setItem('munyaka_global_app_lock', 'true');
            } else {
              setIsLocked(false);
              localStorage.setItem('munyaka_teacher_app_locked', 'false');
              localStorage.setItem('munyaka_teacher_apps_lock_persistent', 'false');
              localStorage.setItem('munyaka_global_app_lock', 'false');
            }
          }
        }, () => {});
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('storage', checkState);
      clearInterval(interval);
      clearTimeout(timeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return isLocked;
}