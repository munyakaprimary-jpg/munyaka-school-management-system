import { db } from "../config/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { getActiveSchoolId } from "./firestoreSync";

export interface AppAccessLocksPayload {
  teacherAppLocked?: boolean;
  appLocked?: boolean;
  modules?: Record<string, boolean>;
  portals?: Record<string, boolean>;
  securityLock?: boolean;
  updatedAt?: string;
  [key: string]: any;
}

const LOCAL_STORAGE_LOCKS_KEY = "munyaka_app_access_locks_v1";
const LEGACY_TEACHER_LOCK_KEY = "isTeacherAppLocked";

/**
 * Read initial app access locks synchronously from localStorage.
 * Ensures app boot never hangs on "Loading Munyaka Portal...".
 */
export function getAppAccessLocksSync(): AppAccessLocksPayload {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_LOCKS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const isTeacherLocked = localStorage.getItem(LEGACY_TEACHER_LOCK_KEY) === 'true';
      return {
        ...parsed,
        teacherAppLocked: parsed.teacherAppLocked ?? isTeacherLocked,
        appLocked: parsed.appLocked ?? isTeacherLocked,
      };
    }
  } catch (e) {
    console.error("Error reading app access locks sync from localStorage:", e);
  }

  // Fallback defaults
  const legacyLocked = localStorage.getItem(LEGACY_TEACHER_LOCK_KEY) === 'true';
  return {
    teacherAppLocked: legacyLocked,
    appLocked: legacyLocked,
    modules: {},
    portals: {},
    securityLock: legacyLocked,
  };
}

/**
 * Persist module/portal lock toggle and teacher/staff app security lock
 * under schools/munyaka-primary-js/app_access_locks/default and mirror into system_config
 * via setDoc(..., { merge: true }) whenever toggled, while caching immediately in localStorage.
 */
export async function saveAppAccessLocks(payload: AppAccessLocksPayload): Promise<void> {
  const schoolId = getActiveSchoolId();
  const enhanced: AppAccessLocksPayload = {
    ...getAppAccessLocksSync(),
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediate localStorage caching
  try {
    localStorage.setItem(LOCAL_STORAGE_LOCKS_KEY, JSON.stringify(enhanced));
    if (enhanced.teacherAppLocked !== undefined) {
      localStorage.setItem(LEGACY_TEACHER_LOCK_KEY, String(enhanced.teacherAppLocked));
    }
    if (enhanced.appLocked !== undefined) {
      localStorage.setItem(LEGACY_TEACHER_LOCK_KEY, String(enhanced.appLocked));
    }
    window.dispatchEvent(new CustomEvent('munyaka_locks_updated', { detail: enhanced }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error("Error writing app access locks to localStorage:", e);
  }

  // 2. Persist to Firestore under schools/munyaka-primary-js/app_access_locks/default and mirror into system_config
  try {
    const mainRef = doc(db, "schools", schoolId, "app_access_locks", "default");
    const mirrorRef1 = doc(db, "schools", schoolId, "system_config", "app_access_locks");
    const mirrorRef2 = doc(db, "schools", schoolId, "system_settings", "global_lock");
    const legacySystemSettingsRef = doc(db, "system_settings", "global_lock");

    await Promise.all([
      setDoc(mainRef, enhanced, { merge: true }),
      setDoc(mirrorRef1, enhanced, { merge: true }),
      setDoc(mirrorRef2, { isTeacherAppLocked: enhanced.teacherAppLocked ?? enhanced.appLocked, ...enhanced }, { merge: true }),
      setDoc(legacySystemSettingsRef, { isTeacherAppLocked: enhanced.teacherAppLocked ?? enhanced.appLocked, ...enhanced }, { merge: true }).catch(() => {}),
    ]);
  } catch (e) {
    console.error("Error persisting app access locks to Firestore:", e);
  }
}

/**
 * Subscribe to schools/munyaka-primary-js/app_access_locks/default via onSnapshot (wrapped in try/catch)
 * so locking a module or portal immediately restricts or unlocks on all connected teacher/admin devices.
 */
export function subscribeAppAccessLocks(onUpdate: (payload: AppAccessLocksPayload) => void): () => void {
  const schoolId = getActiveSchoolId();

  // 1. Emit local state immediately so no boot hanging
  try {
    onUpdate(getAppAccessLocksSync());
  } catch (e) {}

  try {
    const mainRef = doc(db, "schools", schoolId, "app_access_locks", "default");
    const unsubscribe = onSnapshot(
      mainRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppAccessLocksPayload;
          if (data) {
            try {
              const current = getAppAccessLocksSync();
              const merged = { ...current, ...data };
              localStorage.setItem(LOCAL_STORAGE_LOCKS_KEY, JSON.stringify(merged));
              if (merged.teacherAppLocked !== undefined) {
                localStorage.setItem(LEGACY_TEACHER_LOCK_KEY, String(merged.teacherAppLocked));
              }
              if (merged.appLocked !== undefined) {
                localStorage.setItem(LEGACY_TEACHER_LOCK_KEY, String(merged.appLocked));
              }
              window.dispatchEvent(new CustomEvent('munyaka_locks_updated', { detail: merged }));
              window.dispatchEvent(new Event('storage'));
              onUpdate(merged);
            } catch (e) {
              onUpdate(data);
            }
          }
        }
      },
      (err) => {
        console.warn("Firestore app_access_locks onSnapshot warning:", err);
      }
    );

    // Also support window storage event for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_LOCKS_KEY || e.key === LEGACY_TEACHER_LOCK_KEY) {
        onUpdate(getAppAccessLocksSync());
      }
    };
    const handleCustom = () => {
      onUpdate(getAppAccessLocksSync());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_locks_updated', handleCustom as EventListener);

    return () => {
      try {
        unsubscribe();
      } catch (e) {}
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_locks_updated', handleCustom as EventListener);
    };
  } catch (e) {
    console.error("Error setting up app_access_locks subscription:", e);
    return () => {};
  }
}
