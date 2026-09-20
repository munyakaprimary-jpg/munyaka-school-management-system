/**
 * Centralized Database & Persistence Wrapper (`db.ts`)
 * 
 * Implements strict non-destructive initialization (Null/Existence Checks):
 * - Never lets an empty or default seed array overwrite existing records if the storage key is already populated.
 * - Centralized persistence wrapper with versioned, permanent local keys.
 * - Blocks auto-seeding on updates, re-renders, and HMR across all modules (Fees, Stock, Events, Library, ICT, Learners, Staff).
 */

const STORAGE_VERSION = 'v1';

export const KEYS = {
  FEES: `munyaka_fees_${STORAGE_VERSION}`,
  FEE_RECORDS: `munyaka_fees_records_${STORAGE_VERSION}`,
  FEE_STRUCTURES: `munyaka_fee_structures_${STORAGE_VERSION}`,
  TRANSACTIONS: `munyaka_transactions_${STORAGE_VERSION}`,
  STOCK: `munyaka_stock_${STORAGE_VERSION}`,
  INVENTORY: `munyaka_inventory_${STORAGE_VERSION}`,
  EVENTS: `munyaka_events_${STORAGE_VERSION}`,
  NOTICES: `munyaka_notices_${STORAGE_VERSION}`,
  LIBRARY: `munyaka_library_${STORAGE_VERSION}`,
  LIBRARY_BOOKS: `munyaka_library_books_${STORAGE_VERSION}`,
  ICT: `munyaka_ict_${STORAGE_VERSION}`,
  ICT_ASSETS: `munyaka_ict_assets_${STORAGE_VERSION}`,
  ICT_LOGS: `munyaka_ict_logs_${STORAGE_VERSION}`,
  LEARNERS: `munyaka_learners_${STORAGE_VERSION}`,
  STUDENTS: `munyaka_students_${STORAGE_VERSION}`,
  STAFF: `munyaka_staff_${STORAGE_VERSION}`,
  ATTENDANCE: `munyaka_attendance_${STORAGE_VERSION}`,
  GRADES: `munyaka_grades_${STORAGE_VERSION}`,
  EXAM_TYPES: `munyaka_exam_types_${STORAGE_VERSION}`,
  SETTINGS: `munyaka_system_settings_${STORAGE_VERSION}`,
  CENTRAL_DB: `munyaka_central_db_${STORAGE_VERSION}`,
};

/**
 * Read data from localStorage with fallback to defaultValue if key does not exist.
 * Ensures we NEVER overwrite existing valid records with default values.
 */
export function dbRead<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (err) {
    console.error(`[dbRead] Error parsing storage key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Write data to localStorage with strict existence preservation.
 * If data already exists and new data is empty array/object while old data has items, we protect existing data.
 */
export function dbWrite<T>(key: string, value: T, force = false): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!force) {
      const existingRaw = localStorage.getItem(key);
      if (existingRaw !== null && existingRaw !== undefined) {
        try {
          const existingParsed = JSON.parse(existingRaw);
          // If existing data is a non-empty array and new value is an empty array, do NOT overwrite unless forced
          if (Array.isArray(existingParsed) && existingParsed.length > 0 && Array.isArray(value) && value.length === 0) {
            console.warn(`[dbWrite] Blocked destructive overwrite of populated key "${key}" with empty array.`);
            return;
          }
          // If existing data is a non-empty object and new value is empty object, do NOT overwrite
          if (
            existingParsed && typeof existingParsed === 'object' && !Array.isArray(existingParsed) && Object.keys(existingParsed).length > 0 &&
            value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0
          ) {
            console.warn(`[dbWrite] Blocked destructive overwrite of populated object key "${key}" with empty object.`);
            return;
          }
        } catch {
          // parse error on existing, safe to overwrite
        }
      }
    }

    localStorage.setItem(key, JSON.stringify(value));
    
    // Also mirror to legacy keys for seamless backward compatibility across modules
    mirrorToLegacyKeys(key, value);
  } catch (err) {
    console.error(`[dbWrite] Error writing to storage key "${key}":`, err);
  }
}

/**
 * Initialize storage key with seed data ONLY if key does not exist at all (Strict Null check).
 */
export function dbInitSeed<T>(key: string, seedValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return seedValue;
  try {
    const existing = localStorage.getItem(key);
    if (existing === null || existing === undefined || existing === 'undefined' || existing === 'null') {
      localStorage.setItem(key, JSON.stringify(seedValue));
      console.info(`[dbInitSeed] Initialized key "${key}" with seed data.`);
      return seedValue;
    }
    // Key exists, parse and return
    const parsed = JSON.parse(existing);
    if ((Array.isArray(parsed) && parsed.length === 0) && Array.isArray(seedValue) && seedValue.length > 0) {
      // If existing is empty array and seed has items, populate
      localStorage.setItem(key, JSON.stringify(seedValue));
      return seedValue;
    }
    return parsed !== null && parsed !== undefined ? parsed : seedValue;
  } catch {
    return seedValue;
  }
}

/**
 * Mirror updates to legacy storage keys so components reading old keys don't break.
 */
function mirrorToLegacyKeys(key: string, value: unknown) {
  try {
    const legacyMap: Record<string, string[]> = {
      [KEYS.FEES]: ['munyaka_fees_records', 'munyaka_student_fees', 'munyaka_fees'],
      [KEYS.FEE_RECORDS]: ['munyaka_fees_records', 'munyaka_student_fees'],
      [KEYS.TRANSACTIONS]: ['munyaka_transactions'],
      [KEYS.STOCK]: ['munyaka_stock', 'munyaka_inventory'],
      [KEYS.INVENTORY]: ['munyaka_stock', 'munyaka_inventory'],
      [KEYS.EVENTS]: ['munyaka_events', 'munyaka_notices'],
      [KEYS.NOTICES]: ['munyaka_notices', 'munyaka_events'],
      [KEYS.LIBRARY]: ['munyaka_library_books', 'munyaka_library'],
      [KEYS.LIBRARY_BOOKS]: ['munyaka_library_books'],
      [KEYS.ICT]: ['munyaka_ict_assets', 'munyaka_ict_logs', 'munyaka_ict_assets_v1'],
      [KEYS.ICT_ASSETS]: ['munyaka_ict_assets'],
      [KEYS.ICT_LOGS]: ['munyaka_ict_logs'],
      [KEYS.LEARNERS]: ['munyaka_learners', 'munyaka_students', 'school_learners_data', 'munyaka_master_learner_list'],
      [KEYS.STUDENTS]: ['munyaka_students', 'munyaka_learners', 'school_learners_data'],
      [KEYS.STAFF]: ['munyaka_staff', 'staff_master_list'],
      [KEYS.ATTENDANCE]: ['munyaka_attendance'],
      [KEYS.GRADES]: ['munyaka_grades'],
      [KEYS.EXAM_TYPES]: ['munyaka_exam_types'],
      [KEYS.SETTINGS]: ['munyaka_system_settings_v3', 'munyaka_system_settings'],
    };

    const targets = legacyMap[key];
    if (targets) {
      for (const tKey of targets) {
        if (tKey !== key) {
          const existingTarget = localStorage.getItem(tKey);
          // Only mirror if target is empty or if we are forcing update with data
          if (!existingTarget || existingTarget === '[]' || existingTarget === '{}') {
            localStorage.setItem(tKey, JSON.stringify(value));
          } else if (Array.isArray(value) && value.length > 0) {
            try {
              const parsedTarget = JSON.parse(existingTarget);
              if (Array.isArray(parsedTarget) && parsedTarget.length === 0) {
                localStorage.setItem(tKey, JSON.stringify(value));
              }
            } catch {
              // ignore
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[mirrorToLegacyKeys] Error:', err);
  }
}
