/**
 * Unified Teacher App Lock Utility
 *
 * Single source of truth for the Global Teacher App Lock.
 *
 * - localStorage key: `isTeacherAppLocked` (string 'true' | 'false')
 * - Firestore: `system_settings/global_lock` doc, field `isTeacherAppLocked` (boolean)
 *
 * All legacy keys are cleared whenever the lock state changes:
 *   - munyaka_teacher_app_locked
 *   - munyaka_teacher_apps_lock_persistent
 *   - munyaka_global_app_lock
 *   - munyaka_system_locked
 */

import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const TEACHER_APP_LOCK_KEY = 'isTeacherAppLocked';

export const LEGACY_LOCK_KEYS = [
  'munyaka_teacher_app_locked',
  'munyaka_teacher_apps_lock_persistent',
  'munyaka_global_app_lock',
  'munyaka_system_locked',
] as const;

/**
 * Read the unified lock flag from localStorage.
 * Returns true ONLY when `isTeacherAppLocked === 'true'`.
 */
export function getTeacherAppLock(): boolean {
  try {
    return localStorage.getItem(TEACHER_APP_LOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Clear all legacy lock keys from localStorage.
 */
export function clearLegacyLockKeys(): void {
  try {
    for (const key of LEGACY_LOCK_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Set the unified lock state.
 *
 * - Writes `isTeacherAppLocked` to localStorage
 * - Writes `isTeacherAppLocked` to Firestore `system_settings/global_lock` (merge)
 * - Clears all legacy lock keys
 * - Dispatches a `storage` event so open tabs sync immediately
 */
export function setTeacherAppLock(locked: boolean): void {
  try {
    localStorage.setItem(TEACHER_APP_LOCK_KEY, locked ? 'true' : 'false');
  } catch {
    // ignore
  }

  clearLegacyLockKeys();

  // Sync to Firestore (best-effort, non-blocking)
  if (db) {
    try {
      const docRef = doc(db, 'system_settings', 'global_lock');
      // Fire-and-forget with merge so we don't clobber other fields
      setDoc(docRef, { isTeacherAppLocked: locked }, { merge: true }).catch(
        (err) => {
          console.warn('[teacherAppLock] Firestore sync failed:', err);
        }
      );
    } catch (err) {
      console.warn('[teacherAppLock] Firestore unavailable:', err);
    }
  }

  // Notify any open Teacher Portal tabs/routes
  try {
    window.dispatchEvent(new Event('storage'));
  } catch {
    // ignore
  }
}