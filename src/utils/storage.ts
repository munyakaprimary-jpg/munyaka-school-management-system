// ─────────────────────────────────────────────────────────────────────────────
// Central Persistent Storage Layer
// ─────────────────────────────────────────────────────────────────────────────
// Unified, typed wrapper around `localStorage` (with IndexedDB fallback) that:
//   • Hydrates state on app launch
//   • Auto-persists every create / update / delete mutation
//   • Exposes a single API to all primary state stores
//
// Primary stores wired in:
//   - students            : Learner[]
//   - cbcLearningAreas    : ClusterData[]
//   - paymentRecords      : PaymentRecord[] / fee ledgers
//   - userSettings        : SystemSettings
//   - subscriptions       : Subscription[] / billing info
//
// All other stores (staff, attendance, grades, etc.) already use the same
// localStorage keys, so this layer transparently persists them as well.
// ─────────────────────────────────────────────────────────────────────────────

import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { buildDefaultClusters } from '@/data/defaultCbcLearningAreas';
import { safeParse, isQuotaExceeded, handleQuotaError, getLocalStorage } from './storageUtils';
import { initializeStaffMaster } from '@/services/staffMasterService';

/**
 * Re-export the safe localStorage accessor so existing imports of
 * `getLocalStorage` from `@/utils/storage` keep working. The canonical
 * implementation lives in `./storageUtils` — this file re-exports it
 * as a convenience for callers that already depend on `@/utils/storage`.
 */
export { getLocalStorage };

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const LEARNERS_KEY = 'munyaka_registered_students';

export const STORAGE_KEYS = {
  LEARNERS: LEARNERS_KEY,
  // Primary state stores
  STUDENTS: 'school_learners_data',
  STUDENTS_LEGACY: 'munyaka_students',
  CBC_LEARNING_AREAS: 'munyaka_learning_areas',
  PAYMENT_RECORDS: 'munyaka_fees_records',
  TRANSACTIONS: 'munyaka_transactions',
  USER_SETTINGS: 'munyaka_system_settings_v3',
  SUBSCRIPTIONS: 'munyaka_subscriptions',
  BILLING_SETTINGS: 'munyaka_billing_settings',

  // Secondary stores (auto-persisted through the same layer)
  STAFF: 'munyaka_staff_directory',
  STAFF_PREREG: 'munyaka_staff_prereg',
  ATTENDANCE: 'munyaka_attendance_records',
  ATTENDANCE_V2_PREFIX: 'munyaka_attendance_v2_',
  GRADES: 'munyaka_grades',
  EXAM_TYPES: 'munyaka_exam_types',
  ASSESSMENT_SCORES: 'munyaka_assessment_scores',
  LIBRARY_BOOKS: 'munyaka_library_books',
  ICT_ASSETS: 'munyaka_ict_assets',

  // Hydration markers
  HYDRATION_DONE: 'munyaka_hydration_done',
  SCHEMA_VERSION: 'munyaka_schema_version',
  APP_SEED_VERSION: 'app_seed_version',
} as const;

export const CURRENT_SCHEMA_VERSION = 'persistent-storage-v1';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  guardian?: string;
  phone?: string;
  status?: string;
  schoolId?: string;
  isArchived?: boolean;
  deletedAt?: string;
  [key: string]: unknown;
}

export interface PaymentRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  amount?: number;
  paid?: number;
  total?: number;
  method?: string;
  ref?: string;
  category?: string;
  date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface UserSettings {
  general?: {
    schoolName?: string;
    motto?: string;
    postalAddress?: string;
    phone?: string;
    email?: string;
    location?: string;
    maintenanceMode?: boolean;
  };
  academic?: {
    activeYear?: string;
    activeTerm?: string;
    termStartDate?: string;
    termEndDate?: string;
    gradingScale?: Array<{
      level: string;
      descriptor: string;
      min: number;
      max: number;
      points: number;
    }>;
  };
  permissions?: Record<string, unknown>;
  geofence?: { lat: number; lng: number; radius: number };
  geofenceEnabled?: boolean;
  [key: string]: unknown;
}

export interface Subscription {
  id: string;
  plan?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface LearningAreaCluster {
  id: string;
  name: string;
  description?: string;
  learningAreas: Array<{
    id: string;
    name: string;
    type: 'Core' | 'Elective';
    periodsPerWeek?: number;
    description?: string;
  }>;
}

// ─── Read / Write primitives ────────────────────────────────────────────────

/**
 * Read a JSON value from localStorage. Returns `fallback` if the key is
 * missing, unparseable, or the value is null/undefined.
 */
export function readStorage<T>(key: string, fallback: T): T {
  const ls = getLocalStorage();
  if (!ls) return fallback;
  const raw = ls.getItem(key);
  if (raw == null) return fallback;
  const parsed = safeParse<T>(raw, fallback);
  return parsed == null ? fallback : parsed;
}

/**
 * Convenience wrapper around `readStorage` for strings.
 * Returns `''` on any failure rather than null.
 */
export function lsRead<T>(key: string, fallback: T): T {
  return readStorage<T>(key, fallback);
}

/**
 * Variant that returns `null` on parse error so callers can distinguish
 * "no data" from "fallback default".
 */
export function tryParse<T>(key: string): T | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const raw = ls.getItem(key);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Persist a JSON value to localStorage. Returns `true` on success.
 * Emits a `storage` event + custom `munyaka:data-changed` event so all
 * React subscribers refresh.
 *
 * QuotaExceededError is caught and surfaced to the user via a toast.
 */
export function writeStorage<T>(key: string, value: T): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, JSON.stringify(value));
    notifyDataChanged(key);
    return true;
  } catch (err) {
    if (isQuotaExceeded(err)) {
      handleQuotaError(key);
    } else {
      console.error(`[storage] Failed to write "${key}":`, err);
    }
    return false;
  }
}

/**
 * Remove a key from localStorage and notify subscribers.
 */
export function removeStorage(key: string): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.removeItem(key);
    notifyDataChanged(key);
    return true;
  } catch (err) {
    console.error(`[storage] Failed to remove "${key}":`, err);
    return false;
  }
}

/**
 * Wipe ALL app data from localStorage. Use with care.
 */
export function clearAllStorage(): void {
  const ls = getLocalStorage();
  if (!ls) return;
  try {
    ls.clear();
  } catch (err) {
    console.error('[storage] Failed to clear storage:', err);
  }
}

/**
 * Drop-in replacement for localStorage.setItem that automatically fires
 * `notifyDataChanged` after every successful write. Call this from any
 * mutation site instead of calling `localStorage.setItem` directly.
 *
 * Usage:
 *   import { lsSet } from '@/utils/storage';
 *   lsSet('my_key', myObject);
 */
export function lsSet(key: string, value: unknown): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, JSON.stringify(value));
    notifyDataChanged(key);
    return true;
  } catch (err) {
    if (isQuotaExceeded(err)) {
      handleQuotaError(key);
    } else {
      console.error(`[storage] lsSet failed for key "${key}":`, err);
    }
    return false;
  }
}

// ─── Change notification (cross-component sync) ─────────────────────────────

/**
 * Emit a custom event so any subscribed hook recomputes. The existing
 * `useCentralData` hook already listens for this event.
 */
export function notifyDataChanged(key?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
  } catch {
    /* no-op */
  }
}

/**
 * Convenience helper: write JSON to a localStorage key AND fire the change
 * event in one call. Equivalent to `writeStorage(key, value)` but reads as
 * a more explicit "persist" call at mutation sites.
 */
export function persistItem<T>(key: string, value: T): boolean {
  return writeStorage(key, value);
}

// ─── Hydration ──────────────────────────────────────────────────────────────

export interface HydrationReport {
  hydrated: boolean;
  schemaVersion: string;
  keys: string[];
  restoredFromSeed: string[];
}

/**
 * Auto-hydrate every primary state store on app launch.
 *
 * Rules:
 *  1. If a key already has a value in localStorage, leave it alone.
 *  2. If a key is missing, populate it from INITIAL_SEED_DATA.
 *  3. If INITIAL_SEED_DATA is also missing a value, write the canonical
 *     default (e.g. the CBC clusters from `defaultCbcLearningAreas`).
 *
 * Returns a report describing which keys were touched.
 */
export function hydrateAllStores(): HydrationReport {
  const ls = getLocalStorage();
  const report: HydrationReport = {
    hydrated: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    keys: [],
    restoredFromSeed: [],
  };

  if (!ls) return report;

  // ── Helper: write one key only if absent, catch every write individually ─
  // This ensures a quota error on one key does NOT abort seeding of others.
  const seedIfAbsent = (key: string, value: unknown): void => {
    try {
      if (ls.getItem(key) !== null) return;
      ls.setItem(key, JSON.stringify(value));
      report.restoredFromSeed.push(key);
    } catch (err) {
      if (isQuotaExceeded(err)) {
        handleQuotaError(key, 'seed');
      } else {
        console.error(`[storage] hydrate failed to write "${key}":`, err);
      }
    }
  };

  try {
    // 1. Students
    if (Array.isArray(INITIAL_SEED_DATA?.students) && INITIAL_SEED_DATA.students.length > 0) {
      seedIfAbsent(STORAGE_KEYS.STUDENTS, INITIAL_SEED_DATA.students);
      seedIfAbsent(STORAGE_KEYS.STUDENTS_LEGACY, INITIAL_SEED_DATA.students);
    }
    report.keys.push(STORAGE_KEYS.STUDENTS);

    // 1b. Staff directory
    if (Array.isArray(INITIAL_SEED_DATA?.staff) && INITIAL_SEED_DATA.staff.length > 0) {
      seedIfAbsent(STORAGE_KEYS.STAFF, INITIAL_SEED_DATA.staff);
      seedIfAbsent('munyaka_staff', INITIAL_SEED_DATA.staff);
    }
    report.keys.push(STORAGE_KEYS.STAFF);

    // 1b'. Unified Staff Master ledger — single source of truth for ALL
    //       staff records. Seeds with the merged pre-reg + directory set
    //       and writes the legacy keys for backwards compatibility.
    try {
      initializeStaffMaster();
      report.keys.push('munyaka_staff_master');
    } catch (err) {
      console.error('[storage] staff-master seed failed:', err);
    }

    // 1c. Staff pre-registration
    if (Array.isArray(INITIAL_SEED_DATA?.staffPrereg)) {
      seedIfAbsent(STORAGE_KEYS.STAFF_PREREG, INITIAL_SEED_DATA.staffPrereg);
    }
    report.keys.push(STORAGE_KEYS.STAFF_PREREG);

    // 1d. Grades / Classes
    if (Array.isArray(INITIAL_SEED_DATA?.grades)) {
      seedIfAbsent(STORAGE_KEYS.GRADES, INITIAL_SEED_DATA.grades);
    }
    report.keys.push(STORAGE_KEYS.GRADES);

    // 1e. Exam types
    if (Array.isArray(INITIAL_SEED_DATA?.examTypes)) {
      seedIfAbsent(STORAGE_KEYS.EXAM_TYPES, INITIAL_SEED_DATA.examTypes);
    }
    report.keys.push(STORAGE_KEYS.EXAM_TYPES);

    // 1f. Assessment scores
    if (INITIAL_SEED_DATA?.assessmentScores) {
      seedIfAbsent(STORAGE_KEYS.ASSESSMENT_SCORES, INITIAL_SEED_DATA.assessmentScores);
    }
    report.keys.push(STORAGE_KEYS.ASSESSMENT_SCORES);

    // 1g. Library books
    if (Array.isArray(INITIAL_SEED_DATA?.libraryBooks)) {
      seedIfAbsent(STORAGE_KEYS.LIBRARY_BOOKS, INITIAL_SEED_DATA.libraryBooks);
    }
    report.keys.push(STORAGE_KEYS.LIBRARY_BOOKS);

    // 1h. ICT assets
    if (Array.isArray(INITIAL_SEED_DATA?.ictAssets)) {
      seedIfAbsent(STORAGE_KEYS.ICT_ASSETS, INITIAL_SEED_DATA.ictAssets);
    }
    report.keys.push(STORAGE_KEYS.ICT_ASSETS);

    // 1i. Attendance
    if (INITIAL_SEED_DATA?.attendance) {
      seedIfAbsent(STORAGE_KEYS.ATTENDANCE, INITIAL_SEED_DATA.attendance);
    }
    report.keys.push(STORAGE_KEYS.ATTENDANCE);

    // 2. CBC Learning Areas
    const existingClusters = ls.getItem(STORAGE_KEYS.CBC_LEARNING_AREAS);
    if (!existingClusters) {
      const seedAreas = Array.isArray(INITIAL_SEED_DATA?.learningAreas)
        ? INITIAL_SEED_DATA.learningAreas
        : null;
      const value =
        seedAreas && seedAreas.length > 0 ? seedAreas : buildDefaultClusters();
      seedIfAbsent(STORAGE_KEYS.CBC_LEARNING_AREAS, value);
    }
    report.keys.push(STORAGE_KEYS.CBC_LEARNING_AREAS);

    // 3. Payment Records
    if (ls.getItem(STORAGE_KEYS.PAYMENT_RECORDS) === null) {
      seedIfAbsent(
        STORAGE_KEYS.PAYMENT_RECORDS,
        Array.isArray(INITIAL_SEED_DATA?.fees) ? INITIAL_SEED_DATA.fees : []
      );
    }
    report.keys.push(STORAGE_KEYS.PAYMENT_RECORDS);

    // 3b. Transactions
    if (ls.getItem(STORAGE_KEYS.TRANSACTIONS) === null) {
      seedIfAbsent(
        STORAGE_KEYS.TRANSACTIONS,
        Array.isArray(INITIAL_SEED_DATA?.transactions) ? INITIAL_SEED_DATA.transactions : []
      );
    }
    report.keys.push(STORAGE_KEYS.TRANSACTIONS);

    // 4. User Settings
    if (ls.getItem(STORAGE_KEYS.USER_SETTINGS) === null) {
      seedIfAbsent(STORAGE_KEYS.USER_SETTINGS, INITIAL_SEED_DATA?.settings ?? {});
    }
    report.keys.push(STORAGE_KEYS.USER_SETTINGS);

    // 5. Subscriptions
    if (ls.getItem(STORAGE_KEYS.SUBSCRIPTIONS) === null) {
      seedIfAbsent(STORAGE_KEYS.SUBSCRIPTIONS, []);
    }
    report.keys.push(STORAGE_KEYS.SUBSCRIPTIONS);

    // 5b. Billing settings
    if (ls.getItem(STORAGE_KEYS.BILLING_SETTINGS) === null) {
      seedIfAbsent(STORAGE_KEYS.BILLING_SETTINGS, {});
    }
    report.keys.push(STORAGE_KEYS.BILLING_SETTINGS);

    // Mark hydration complete
    ls.setItem(STORAGE_KEYS.HYDRATION_DONE, 'true');
    ls.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    report.hydrated = true;
  } catch (err) {
    console.error('[storage] Hydration outer block failed:', err);
  }

  return report;
}

// ─── Typed store accessors (read) ───────────────────────────────────────────

export const getStudents = (): Student[] => {
  try {
    const custom = readStorage<Student[] | null>(LEARNERS_KEY, null);
    if (custom && Array.isArray(custom) && custom.length > 0) return custom;
    const legacy = readStorage<Student[] | null>(STORAGE_KEYS.STUDENTS, null);
    if (legacy && Array.isArray(legacy) && legacy.length > 0) return legacy;
    return [];
  } catch {
    return [];
  }
};

export const getLearningAreas = (): LearningAreaCluster[] =>
  readStorage<LearningAreaCluster[]>(STORAGE_KEYS.CBC_LEARNING_AREAS, []);

export const getPaymentRecords = (): PaymentRecord[] =>
  readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []);

export const getTransactions = (): PaymentRecord[] =>
  readStorage<PaymentRecord[]>(STORAGE_KEYS.TRANSACTIONS, []);

export const getUserSettings = (): UserSettings =>
  readStorage<UserSettings>(STORAGE_KEYS.USER_SETTINGS, {} as UserSettings);

export const getSubscriptions = (): Subscription[] =>
  readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);

// ─── Typed store mutators (write) ───────────────────────────────────────────

/**
 * Replace the entire students array and persist immediately.
 */
export function setStudents(students: Student[]): boolean {
/**
 * Replace the entire students array and persist immediately.
 */
export function setStudents(students: Student[]): boolean {
  try {
    writeStorage(LEARNERS_KEY, students);
    const ok = writeStorage(STORAGE_KEYS.STUDENTS, students);
    if (ok) {
      // Keep legacy mirror in sync for any older code paths
      writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, students);
    }
    try {
      window.dispatchEvent(new Event('students-updated'));
    } catch {}
    return ok;
  } catch {
    return false;
  }
}

export function saveStudent(newStudent: Omit<Student, 'id'> & { id?: string }): Student {
  try {
    const current = getStudents();
    const studentId = newStudent.id ?? generateId('stu');
    const index = current.findIndex(s => s.id === studentId || (s.admissionNo && s.admissionNo === newStudent.admissionNo));
    
    let updated: Student[];
    let saved: Student;
    if (index >= 0) {
      saved = { ...current[index], ...newStudent, id: current[index].id } as Student;
      updated = [...current];
      updated[index] = saved;
    } else {
      saved = { ...newStudent, id: studentId } as Student;
      updated = [...current, saved];
    }
    setStudents(updated);
    return saved;
  } catch {
    return newStudent as Student;
  }
}

/**
 * Replace the entire CBC learning-areas array and persist immediately.
 */
export function setLearningAreas(areas: LearningAreaCluster[]): boolean {
  return writeStorage(STORAGE_KEYS.CBC_LEARNING_AREAS, areas);
}

/**
 * Replace the entire payment-records array and persist immediately.
 */
export function setPaymentRecords(records: PaymentRecord[]): boolean {
  return writeStorage(STORAGE_KEYS.PAYMENT_RECORDS, records);
}

/**
 * Append a single transaction to the persistent log.
 */
export function addTransaction(tx: PaymentRecord): boolean {
  const current = getTransactions();
  return writeStorage(STORAGE_KEYS.TRANSACTIONS, [...current, tx]);
}

/**
 * Replace user settings and persist immediately.
 */
export function setUserSettings(settings: UserSettings): boolean {
  return writeStorage(STORAGE_KEYS.USER_SETTINGS, settings);
}

/**
 * Replace the transactions array and persist immediately.
 */
export function setTransactions(txs: PaymentRecord[]): boolean {
  return writeStorage(STORAGE_KEYS.TRANSACTIONS, txs);
}

/**
 * Patch a subset of user settings (shallow merge) and persist.
 */
export function patchUserSettings(patch: Partial<UserSettings>): boolean {
  const current = getUserSettings();
  const merged: UserSettings = { ...current, ...patch };
  return writeStorage(STORAGE_KEYS.USER_SETTINGS, merged);
}

/**
 * Replace the subscriptions array and persist immediately.
 */
export function setSubscriptions(subs: Subscription[]): boolean {
  return writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
}

/**
 * Add a new subscription and persist.
 */
export function addSubscription(sub: Subscription): boolean {
  const current = getSubscriptions();
  return writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, [...current, sub]);
}

// ─── Mutation helpers (create / update / delete) ────────────────────────────

/**
 * Generate a short unique id for new records.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Students ────────────────────────────────────────────────────────────────
export function createStudent(input: Omit<Student, 'id'> & { id?: string }): Student {
  const newStudent: Student = { ...input, id: input.id ?? generateId('stu') };
  const next = [...getStudents(), newStudent];
  setStudents(next);
  return newStudent;
}

export function updateStudent(id: string, patch: Partial<Student>): Student | null {
  const list = getStudents();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Student = { ...list[idx], ...patch, id };
  const next = [...list];
  next[idx] = updated;
  setStudents(next);
  return updated;
}

export function deleteStudent(id: string): boolean {
  const list = getStudents();
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) return false;
  setStudents(next);
  return true;
}

// ── CBC Learning Areas ──────────────────────────────────────────────────────
export function createLearningArea(
  clusterId: string,
  area: { name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }
): boolean {
  const clusters = getLearningAreas();
  const next = clusters.map((c) => {
    if (c.id !== clusterId) return c;
    return {
      ...c,
      learningAreas: [
        ...c.learningAreas,
        { id: generateId('la'), ...area },
      ],
    };
  });
  return setLearningAreas(next);
}

export function updateLearningArea(
  clusterId: string,
  areaId: string,
  patch: Partial<{ name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }>
): boolean {
  const clusters = getLearningAreas();
  const next = clusters.map((c) => {
    if (c.id !== clusterId) return c;
    return {
      ...c,
      learningAreas: c.learningAreas.map((a) =>
        a.id === areaId ? { ...a, ...patch } : a
      ),
    };
  });
  return setLearningAreas(next);
}

export function deleteLearningArea(clusterId: string, areaId: string): boolean {
  const clusters = getLearningAreas();
  const next = clusters.map((c) => {
    if (c.id !== clusterId) return c;
    return { ...c, learningAreas: c.learningAreas.filter((a) => a.id !== areaId) };
  });
  return setLearningAreas(next);
}

// ── Payment Records ─────────────────────────────────────────────────────────
export function createPaymentRecord(input: Omit<PaymentRecord, 'id'> & { id?: string }): PaymentRecord {
  const newRec = { ...input, id: input.id ?? generateId('pay') } as PaymentRecord;
  const next = [...getPaymentRecords(), newRec];
  setPaymentRecords(next);
  return newRec;
}

export function updatePaymentRecord(id: string, patch: Partial<PaymentRecord>): PaymentRecord | null {
  const list = getPaymentRecords();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated: PaymentRecord = { ...list[idx], ...patch, id };
  const next = [...list];
  next[idx] = updated;
  setPaymentRecords(next);
  return updated;
}

export function deletePaymentRecord(id: string): boolean {
  const list = getPaymentRecords();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  setPaymentRecords(next);
  return true;
}

// ── Subscriptions ───────────────────────────────────────────────────────────
export function createSubscription(input: Omit<Subscription, 'id'> & { id?: string }): Subscription {
  const newSub: Subscription = { ...input, id: input.id ?? generateId('sub') };
  const next = [...getSubscriptions(), newSub];
  setSubscriptions(next);
  return newSub;
}

export function updateSubscription(id: string, patch: Partial<Subscription>): Subscription | null {
  const list = getSubscriptions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Subscription = { ...list[idx], ...patch, id };
  const next = [...list];
  next[idx] = updated;
  setSubscriptions(next);
  return updated;
}

export function deleteSubscription(id: string): boolean {
  const list = getSubscriptions();
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) return false;
  setSubscriptions(next);
  return true;
}

// ─── Inspection helpers ─────────────────────────────────────────────────────

/**
 * Return the size of every persistent store, in bytes (approximate).
 * Useful for the Central Data Service screen.
 */
export function getStorageSizes(): Record<string, number> {
  const ls = getLocalStorage();
  if (!ls) return {};
  const out: Record<string, number> = {};
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (!key) continue;
    const val = ls.getItem(key) ?? '';
    out[key] = val.length;
  }
  return out;
}

/**
 * True if localStorage already has a hydrated dataset.
 */
export function isHydrated(): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  return ls.getItem(STORAGE_KEYS.HYDRATION_DONE) === 'true';
}

// ─── Full Database Export / Import ─────────────────────────────────────────

export interface DatabaseBackup {
  version: string;
  exportDate: string;
  school: string;
  students: unknown;
  staff: unknown;
  staffPrereg: unknown;
  fees: unknown;
  feeStructures: unknown;
  transactions: unknown;
  attendance: unknown;
  grades: unknown;
  examTypes: unknown;
  learningAreas: unknown;
  assessmentScores: unknown;
  libraryBooks: unknown;
  ictAssets: unknown;
  notices: unknown;
  userSettings: unknown;
  subscriptions: unknown;
  billingSettings: unknown;
}

/**
 * Read ALL known localStorage keys and return a serialisable backup object.
 * Safe: every read is wrapped in a try-catch so a corrupted key never aborts
 * the entire export.
 */
export function exportAllData(): DatabaseBackup {
  const ls = getLocalStorage() ?? {} as Storage;

  const safeRead = (key: string): unknown => {
    try {
      const raw = ls.getItem(key);
      if (raw == null) return undefined;
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };

  return {
    version: CURRENT_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    school: 'MUNYAKA PRIMARY AND JUNIOR SCHOOL',
    students:           safeRead(STORAGE_KEYS.STUDENTS),
    staff:             safeRead(STORAGE_KEYS.STAFF),
    staffPrereg:       safeRead(STORAGE_KEYS.STAFF_PREREG),
    fees:              safeRead(STORAGE_KEYS.PAYMENT_RECORDS),
    feeStructures:     safeRead('munyaka_fee_structures'),
    transactions:      safeRead(STORAGE_KEYS.TRANSACTIONS),
    attendance:        safeRead(STORAGE_KEYS.ATTENDANCE),
    grades:            safeRead(STORAGE_KEYS.GRADES),
    examTypes:         safeRead(STORAGE_KEYS.EXAM_TYPES),
    learningAreas:     safeRead(STORAGE_KEYS.CBC_LEARNING_AREAS),
    assessmentScores:  safeRead(STORAGE_KEYS.ASSESSMENT_SCORES),
    libraryBooks:      safeRead(STORAGE_KEYS.LIBRARY_BOOKS),
    ictAssets:         safeRead(STORAGE_KEYS.ICT_ASSETS),
    notices:           safeRead('munyaka_notices'),
    userSettings:      safeRead(STORAGE_KEYS.USER_SETTINGS),
    subscriptions:     safeRead(STORAGE_KEYS.SUBSCRIPTIONS),
    billingSettings:   safeRead(STORAGE_KEYS.BILLING_SETTINGS),
  };
}

/**
 * Download the full database as a JSON file using a browser Blob + anchor trick.
 * Falls back gracefully when Blob download is not supported.
 */
export function downloadDatabaseBackup(): void {
  try {
    const backup = exportAllData();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `munyaka_db_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[storage] downloadDatabaseBackup failed:', err);
    throw err;
  }
}

export interface ImportResult {
  success: boolean;
  keysRestored: string[];
  errors: string[];
}

/**
 * Write every key present in a DatabaseBackup object into localStorage.
 * Each key is written independently so a corrupt value for one key does NOT
 * prevent other keys from being restored.
 *
 * Returns a report describing what was restored and any errors encountered.
 */
export function importAllData(backup: DatabaseBackup): ImportResult {
  const result: ImportResult = { success: true, keysRestored: [], errors: [] };
  const ls = getLocalStorage();

  const safeWrite = (key: string, value: unknown, label: string): void => {
    if (value === undefined) return;
    try {
      if (ls) {
        ls.setItem(key, JSON.stringify(value));
        result.keysRestored.push(label);
      }
    } catch (err) {
      result.errors.push(`Failed to write "${label}" (${key}): ${err instanceof Error ? err.message : String(err)}`);
      result.success = false;
    }
  };

  if (backup.students)         safeWrite(STORAGE_KEYS.STUDENTS,         backup.students,         'Students');
  if (backup.students)         safeWrite(STORAGE_KEYS.STUDENTS_LEGACY,   backup.students,         'Students (legacy)');
  if (backup.staff)           safeWrite(STORAGE_KEYS.STAFF,             backup.staff,            'Staff');
  if (backup.staffPrereg)     safeWrite(STORAGE_KEYS.STAFF_PREREG,     backup.staffPrereg,      'Staff Pre-registration');
  if (backup.fees)            safeWrite(STORAGE_KEYS.PAYMENT_RECORDS,   backup.fees,             'Fee Records');
  if (backup.feeStructures)   safeWrite('munyaka_fee_structures',      backup.feeStructures,    'Fee Structures');
  if (backup.transactions)    safeWrite(STORAGE_KEYS.TRANSACTIONS,      backup.transactions,     'Transactions');
  if (backup.attendance)      safeWrite(STORAGE_KEYS.ATTENDANCE,        backup.attendance,       'Attendance');
  if (backup.grades)          safeWrite(STORAGE_KEYS.GRADES,            backup.grades,           'Grades / Classes');
  if (backup.examTypes)       safeWrite(STORAGE_KEYS.EXAM_TYPES,        backup.examTypes,        'Exam Types');
  if (backup.learningAreas)   safeWrite(STORAGE_KEYS.CBC_LEARNING_AREAS,backup.learningAreas,    'Learning Areas');
  if (backup.assessmentScores)safeWrite(STORAGE_KEYS.ASSESSMENT_SCORES, backup.assessmentScores, 'Assessment Scores');
  if (backup.libraryBooks)     safeWrite(STORAGE_KEYS.LIBRARY_BOOKS,    backup.libraryBooks,     'Library Books');
  if (backup.ictAssets)       safeWrite(STORAGE_KEYS.ICT_ASSETS,        backup.ictAssets,        'ICT Assets');
  if (backup.notices)         safeWrite('munyaka_notices',              backup.notices,          'Notices');
  if (backup.userSettings)    safeWrite(STORAGE_KEYS.USER_SETTINGS,     backup.userSettings,     'System Settings');
  if (backup.subscriptions)    safeWrite(STORAGE_KEYS.SUBSCRIPTIONS,    backup.subscriptions,    'Subscriptions');
  if (backup.billingSettings) safeWrite(STORAGE_KEYS.BILLING_SETTINGS,  backup.billingSettings, 'Billing Settings');

  if (result.keysRestored.length > 0) {
    notifyDataChanged();
  }

  return result;
}

/**
 * Parse a raw JSON string into a DatabaseBackup and import it.
 * Used by the file-input handler on the System Configuration page.
 */
export function parseAndImportBackup(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString) as DatabaseBackup;
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, keysRestored: [], errors: ['Invalid backup file: root must be a JSON object.'] };
    }
    return importAllData(parsed);
  } catch (err) {
    return {
      success: false,
      keysRestored: [],
      errors: [`JSON parse error: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}
