import { initialSeedData } from '@/data/initialSeedData';

/**
 * Canonical storage keys for the entire application.
 */
export const STORAGE_KEYS = {
  LEARNERS: 'school_learners_data',
  STUDENTS: 'munyaka_students',
  LEGACY_LEARNERS: 'learners',
  STAFF: 'munyaka_staff_directory',
  STAFF_LEGACY: 'munyaka_staff',
  STAFF_MASTER: 'munyaka_staff_master',
  INITIALIZED_FLAG: 'munyaka_storage_initialized_v1',
} as const;

/**
 * Centralized initialization utility that checks if storage keys for learners
 * and staff exist. If missing or completely empty, seeds them from the shared initialSeedData.
 */
export function initializeCentralStorage(force = false): {
  initialized: boolean;
  learnersCount: number;
  staffCount: number;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { initialized: false, learnersCount: 0, staffCount: 0 };
  }

  try {
    const isAlreadyInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED_FLAG) === 'true';
    if (isAlreadyInit && !force) {
      const existingLearners = getStoredArray(STORAGE_KEYS.STUDENTS) || getStoredArray(STORAGE_KEYS.LEARNERS);
      const existingStaff = getStoredArray(STORAGE_KEYS.STAFF) || getStoredArray(STORAGE_KEYS.STAFF_LEGACY);
      if (existingLearners.length > 0 || existingStaff.length > 0) {
        return {
          initialized: true,
          learnersCount: existingLearners.length,
          staffCount: existingStaff.length,
        };
      }
    }

    // 1. Check or Seed Learners
    let learners = getStoredArray(STORAGE_KEYS.STUDENTS) || getStoredArray(STORAGE_KEYS.LEARNERS);
    if (!learners || learners.length === 0) {
      learners = initialSeedData.students || [];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(learners));
      localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(learners));
      localStorage.setItem(STORAGE_KEYS.LEGACY_LEARNERS, JSON.stringify(learners));
    }

    // 2. Check or Seed Staff
    let staff = getStoredArray(STORAGE_KEYS.STAFF) || getStoredArray(STORAGE_KEYS.STAFF_LEGACY);
    if (!staff || staff.length === 0) {
      staff = initialSeedData.staff || [];
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      localStorage.setItem(STORAGE_KEYS.STAFF_LEGACY, JSON.stringify(staff));
      localStorage.setItem(STORAGE_KEYS.STAFF_MASTER, JSON.stringify(staff));
    }

    localStorage.setItem(STORAGE_KEYS.INITIALIZED_FLAG, 'true');

    // Notify all active listeners/subscribers across tabs and frames
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'central-init' } }));

    return {
      initialized: true,
      learnersCount: learners.length,
      staffCount: staff.length,
    };
  } catch (error) {
    console.error('[CentralStorage] Initialization failed:', error);
    return { initialized: false, learnersCount: 0, staffCount: 0 };
  }
}

/**
 * Safe JSON parser for stored arrays
 */
function getStoredArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Auto-run on module evaluation for immediate preview pane & browser parity
if (typeof window !== 'undefined') {
  initializeCentralStorage();
}
