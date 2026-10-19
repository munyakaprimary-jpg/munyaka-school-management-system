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
      learners = (initialSeedData as any).students || (initialSeedData as any).learners || [];
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
  try {
    const ALLOWED_STAFF_KEY = 'munyaka_staff_registry';
    const FORBIDDEN_KEYS = [
      'munyaka_users',
      'users_list',
      'staff_list',
      'mockStaff',
      'initialUsers',
      'temp_staff_cache',
      'supabase_users',
      'staff_members'
    ];

    // 1. Wipe all forbidden keys instantly from browser memory
    FORBIDDEN_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch {}
    });

    // 2. Nuke any legacy staff IDs across all standard staff keys
    const staffKeys = ['munyaka_staff', 'munyaka_staff_directory', 'munyaka_staff_master', 'munyaka_master_staff_list', 'staff_registry', ALLOWED_STAFF_KEY];
    staffKeys.forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter((s: any) => {
              const idStr = String(s?.id || s?.staffId || s?.staff_id || s?.userId || '');
              if (idStr.includes('staff_') || idStr.startsWith('STF-') || idStr.startsWith('T00') || !idStr.startsWith('MUN-')) {
                return false;
              }
              return /^MUN-\d+$/i.test(idStr);
            }).map((s: any) => {
              const id = String(s.id || s.staffId || s.staff_id || '');
              return { ...s, id, staffId: id, userId: id };
            });
            localStorage.setItem(k, JSON.stringify(cleaned));
          }
        } catch {}
      }
    });

    // Ensure ALLOWED_STAFF_KEY is populated and sanitized
    const rawAllowed = localStorage.getItem(ALLOWED_STAFF_KEY) || localStorage.getItem('munyaka_staff_directory') || '[]';
    try {
      const parsed = JSON.parse(rawAllowed);
      const sanitized = Array.isArray(parsed)
        ? parsed.filter((item: any) => {
            const id = String(item.id || item.userId || item.staffId || '');
            return /^MUN-\d+$/i.test(id);
          })
        : [];
      localStorage.setItem(ALLOWED_STAFF_KEY, JSON.stringify(sanitized));
    } catch {}
  } catch (e) {
    console.error('Storage SSOT nuke migration error:', e);
  }

  initializeCentralStorage();
}
