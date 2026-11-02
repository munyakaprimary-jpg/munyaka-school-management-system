// ─────────────────────────────────────────────────────────────────────────────
// Central LocalStorage Management Utility
// ─────────────────────────────────────────────────────────────────────────────
// Requirements:
// 1. Create src/utils/storage.ts to manage localStorage.
// 2. Filter out any blank or "Unnamed Learner" records automatically on load.
// 3. Normalize all staff access codes to strictly follow the MUN-XXXX format (e.g., MUN-1001, MUN-1002).
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_learners',
  STAFF: 'munyaka_staff',
  CENTRAL_DB: 'munyaka_central_db',
  SETTINGS: 'munyaka_system_settings',
} as const;

export interface LearnerRecord {
  id: string;
  admNo?: string;
  name: string;
  grade?: string;
  stream?: string;
  gender?: string;
  [key: string]: any;
}

export interface StaffRecord {
  id: string;
  name: string;
  accessCode: string;
  role?: string;
  [key: string]: any;
}

/**
 * Generate a short unique ID for records.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normalizes any staff access code to strictly follow the MUN-XXXX format (e.g., MUN-1001, MUN-1002).
 */
export function normalizeStaffAccessCode(code: string | undefined | null, index: number = 0): string {
  if (!code || typeof code !== 'string') {
    const defaultNum = 1001 + index;
    return `MUN-${String(defaultNum).padStart(4, '0')}`;
  }

  const trimmed = code.trim().toUpperCase();
  
  // If it matches MUN-XXXX or MUNXXXX or similar
  const munMatch = trimmed.match(/^MUN[-_]?(\d+)$/);
  if (munMatch) {
    const digits = munMatch[1];
    return `MUN-${digits.padStart(4, '0')}`;
  }

  // Extract all digits if present
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length > 0) {
    return `MUN-${digitsOnly.slice(-4).padStart(4, '0')}`;
  }

  // Fallback based on index
  const fallbackNum = 1001 + index;
  return `MUN-${String(fallbackNum).padStart(4, '0')}`;
}

/**
 * Retrieve learners from localStorage.
 * Automatically filters out any blank names or records named "Unnamed Learner" (case-insensitive).
 */
export function getStoredLearners(): LearnerRecord[] {
  try {
    const keys = [STORAGE_KEYS.LEARNERS, 'munyaka_learners_v2', 'school_learners_data', 'learners', 'pupils'];
    let rawData: any[] = [];

    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawData = parsed;
            break;
          }
        } catch {}
      }
    }

    if (rawData.length === 0) return [];

    return rawData.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const name = String(item.name || item.fullName || item.studentName || '').trim();
      if (!name) return false;
      
      const lowerName = name.toLowerCase();
      if (
        lowerName === 'unnamed learner' ||
        lowerName === 'unnamed student' ||
        lowerName === 'unnamed' ||
        lowerName === 'unknown learner' ||
        lowerName === 'unknown' ||
        lowerName === 'null'
      ) {
        return false;
      }
      return true;
    });
  } catch (err) {
    console.error('[storage.ts] Error reading stored learners:', err);
    return [];
  }
}

/**
 * Save learners to localStorage.
 */
export function setStoredLearners(learners: LearnerRecord[]): void {
  try {
    const clean = learners.filter((item) => {
      if (!item) return false;
      const name = String(item.name || '').trim();
      if (!name) return false;
      const lower = name.toLowerCase();
      return lower !== 'unnamed learner' && lower !== 'unnamed student' && lower !== 'unnamed';
    });
    localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(clean));
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('munyaka_storage_update'));
  } catch (err) {
    console.error('[storage.ts] Error saving learners:', err);
  }
}

/**
 * Retrieve staff members from localStorage and normalize all staff access codes to MUN-XXXX.
 */
export function getStoredStaff(): StaffRecord[] {
  try {
    const keys = [STORAGE_KEYS.STAFF, 'munyaka_staff_v2', 'munyaka_staff_directory', 'munyaka_staff_master'];
    let rawData: any[] = [];

    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawData = parsed;
            break;
          }
        } catch {}
      }
    }

    return rawData.map((staff, idx) => {
      if (!staff || typeof staff !== 'object') return staff;
      const rawCode = staff.accessCode || staff.code || staff.staffId || staff.id;
      const normalizedCode = normalizeStaffAccessCode(rawCode ? String(rawCode) : undefined, idx);
      return {
        ...staff,
        accessCode: normalizedCode,
        code: normalizedCode,
      };
    });
  } catch (err) {
    console.error('[storage.ts] Error reading stored staff:', err);
    return [];
  }
}

/**
 * Save staff members to localStorage with normalized access codes.
 */
export function setStoredStaff(staffList: StaffRecord[]): void {
  try {
    const normalized = staffList.map((staff, idx) => {
      const rawCode = staff.accessCode || staff.code || staff.staffId || staff.id;
      const normalizedCode = normalizeStaffAccessCode(rawCode ? String(rawCode) : undefined, idx);
      return {
        ...staff,
        accessCode: normalizedCode,
        code: normalizedCode,
      };
    });
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(normalized));
    window.dispatchEvent(new Event('munyaka_storage_update'));
  } catch (err) {
    console.error('[storage.ts] Error saving staff:', err);
  }
}

/**
 * Generic localStorage read helper with fallback
 */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generic localStorage write helper
 */
export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
    window.dispatchEvent(new Event('munyaka_storage_update'));
    return true;
  } catch (err) {
    console.error(`[storage.ts] Failed to write key "${key}":`, err);
    return false;
  }
}
