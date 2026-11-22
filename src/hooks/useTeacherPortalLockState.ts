import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useTeacherPortalLockState() {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const manualLock = localStorage.getItem('munyaka_teacher_app_locked') === 'true' ||
                         localStorage.getItem('munyaka_teacher_apps_lock_persistent') === 'true';
      const autolockOverdue = localStorage.getItem('munyaka_autolock_overdue') !== 'false';
      const isOverdue = localStorage.getItem('munyaka_billing_overdue') === 'true' ||
                        localStorage.getItem('munyaka_subscription_status') === 'OVERDUE';
      const bypass = localStorage.getItem('munyaka_lock_bypass') === 'true';

      if (bypass) return false;
      if (manualLock) return true;
      if (autolockOverdue && isOverdue) return true;
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkState = () => {
      try {
        const manualLock = localStorage.getItem('munyaka_teacher_app_locked') === 'true' ||
                           localStorage.getItem('munyaka_teacher_apps_lock_persistent') === 'true';
        const autolockOverdue = localStorage.getItem('munyaka_autolock_overdue') !== 'false';
        const isOverdue = localStorage.getItem('munyaka_billing_overdue') === 'true' ||
                          localStorage.getItem('munyaka_subscription_status') === 'OVERDUE';
        const bypass = localStorage.getItem('munyaka_lock_bypass') === 'true';

        if (bypass) {
          setIsLocked(false);
          return;
        }
        if (manualLock) {
          setIsLocked(true);
          return;
        }
        if (autolockOverdue && isOverdue) {
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
    try {
      if (db) {
        const docRef = doc(db, 'system_settings', 'global_lock');
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreLocked = data.teacherAppLocked || data.locked || false;
            const firestoreBypass = data.platformBypass || data.lockBypass || false;
            const firestoreAutolock = data.autolockOverdue ?? true;
            const isOverdue = data.billingStatus === 'OVERDUE' || localStorage.getItem('munyaka_billing_overdue') === 'true';

            if (firestoreBypass) {
              setIsLocked(false);
            } else if (firestoreLocked || (firestoreAutolock && isOverdue)) {
              setIsLocked(true);
              localStorage.setItem('munyaka_teacher_app_locked', 'true');
            } else {
              setIsLocked(false);
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
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return isLocked;
}
