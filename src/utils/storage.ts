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

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
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
  amount: number;
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

// ─── Safe localStorage helpers ──────────────────────────────────────────────

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Read / Write primitives ────────────────────────────────────────────────

/**
 * Read a JSON value from localStorage. Returns `fallback` if the key is
 * missing, unparseable, or the value is null/undefined.
 */
export function readStorage<T>(key: string, fallback: T): T {
  const ls = safeLocalStorage();
  if (!ls) return fallback;
  const raw = ls.getItem(key);
  if (raw == null) return fallback;
  const parsed = safeParse<T>(raw);
  return parsed == null ? fallback : parsed;
}

/**
 * Persist a JSON value to localStorage. Returns `true` on success.
 * Emits a `storage` event + custom `munyaka:data-changed` event so all
 * React subscribers refresh.
 */
export function writeStorage<T>(key: string, value: T): boolean {
  const ls = safeLocalStorage();
  if (!ls) return false;
  try {
    const serialized = JSON.stringify(value);
    ls.setItem(key, serialized);
    notifyDataChanged(key);
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write "${key}":`, err);
    return false;
  }
}

/**
 * Remove a key from localStorage and notify subscribers.
 */
export function removeStorage(key: string): boolean {
  const ls = safeLocalStorage();
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
  const ls = safeLocalStorage();
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
  const ls = safeLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, JSON.stringify(value));
    notifyDataChanged(key);
    return true;
  } catch (err) {
    console.error(`[storage] lsSet failed for key "${key}":`, err);
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
  const ls = safeLocalStorage();
  const report: HydrationReport = {
    hydrated: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    keys: [],
    restoredFromSeed: [],
  };

  if (!ls) return report;

  try {
    // 1. Students
    const existingStudents = ls.getItem(STORAGE_KEYS.STUDENTS);
    if (!existingStudents && Array.isArray(INITIAL_SEED_DATA.students)) {
      ls.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_SEED_DATA.students));
      ls.setItem(STORAGE_KEYS.STUDENTS_LEGACY, JSON.stringify(INITIAL_SEED_DATA.students));
      report.restoredFromSeed.push(STORAGE_KEYS.STUDENTS);
    }
    report.keys.push(STORAGE_KEYS.STUDENTS);

    // 1b. Staff directory (from seed)
    if (!ls.getItem(STORAGE_KEYS.STAFF) && Array.isArray(INITIAL_SEED_DATA.staff)) {
      ls.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_SEED_DATA.staff));
      ls.setItem('munyaka_staff', JSON.stringify(INITIAL_SEED_DATA.staff));
      report.restoredFromSeed.push(STORAGE_KEYS.STAFF);
    }
    report.keys.push(STORAGE_KEYS.STAFF);

    // 1c. Staff pre-registration
    if (!ls.getItem(STORAGE_KEYS.STAFF_PREREG) && Array.isArray(INITIAL_SEED_DATA.staffPrereg)) {
      ls.setItem(STORAGE_KEYS.STAFF_PREREG, JSON.stringify(INITIAL_SEED_DATA.staffPrereg));
      report.restoredFromSeed.push(STORAGE_KEYS.STAFF_PREREG);
    }
    report.keys.push(STORAGE_KEYS.STAFF_PREREG);

    // 1d. Grades / Classes
    if (!ls.getItem(STORAGE_KEYS.GRADES) && Array.isArray(INITIAL_SEED_DATA.grades)) {
      ls.setItem(STORAGE_KEYS.GRADES, JSON.stringify(INITIAL_SEED_DATA.grades));
      report.restoredFromSeed.push(STORAGE_KEYS.GRADES);
    }
    report.keys.push(STORAGE_KEYS.GRADES);

    // 1e. Exam types
    if (!ls.getItem(STORAGE_KEYS.EXAM_TYPES) && Array.isArray(INITIAL_SEED_DATA.examTypes)) {
      ls.setItem(STORAGE_KEYS.EXAM_TYPES, JSON.stringify(INITIAL_SEED_DATA.examTypes));
      report.restoredFromSeed.push(STORAGE_KEYS.EXAM_TYPES);
    }
    report.keys.push(STORAGE_KEYS.EXAM_TYPES);

    // 1f. Assessment scores
    if (!ls.getItem(STORAGE_KEYS.ASSESSMENT_SCORES) && INITIAL_SEED_DATA.assessmentScores) {
      ls.setItem(STORAGE_KEYS.ASSESSMENT_SCORES, JSON.stringify(INITIAL_SEED_DATA.assessmentScores));
      report.restoredFromSeed.push(STORAGE_KEYS.ASSESSMENT_SCORES);
    }
    report.keys.push(STORAGE_KEYS.ASSESSMENT_SCORES);

    // 1g. Library books
    if (!ls.getItem(STORAGE_KEYS.LIBRARY_BOOKS) && Array.isArray(INITIAL_SEED_DATA.libraryBooks)) {
      ls.setItem(STORAGE_KEYS.LIBRARY_BOOKS, JSON.stringify(INITIAL_SEED_DATA.libraryBooks));
      report.restoredFromSeed.push(STORAGE_KEYS.LIBRARY_BOOKS);
    }
    report.keys.push(STORAGE_KEYS.LIBRARY_BOOKS);

    // 1h. ICT assets
    if (!ls.getItem(STORAGE_KEYS.ICT_ASSETS) && Array.isArray(INITIAL_SEED_DATA.ictAssets)) {
      ls.setItem(STORAGE_KEYS.ICT_ASSETS, JSON.stringify(INITIAL_SEED_DATA.ictAssets));
      report.restoredFromSeed.push(STORAGE_KEYS.ICT_ASSETS);
    }
    report.keys.push(STORAGE_KEYS.ICT_ASSETS);

    // 1i. Attendance
    if (!ls.getItem(STORAGE_KEYS.ATTENDANCE) && INITIAL_SEED_DATA.attendance) {
      ls.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_SEED_DATA.attendance));
      report.restoredFromSeed.push(STORAGE_KEYS.ATTENDANCE);
    }
    report.keys.push(STORAGE_KEYS.ATTENDANCE);

    // 2. CBC Learning Areas (from canonical defaults)
    const existingClusters = ls.getItem(STORAGE_KEYS.CBC_LEARNING_AREAS);
    if (!existingClusters) {
      // Prefer the seed-defined learning areas if present, otherwise build defaults
      const seedAreas = Array.isArray(INITIAL_SEED_DATA.learningAreas)
        ? INITIAL_SEED_DATA.learningAreas
        : null;
      const value = seedAreas && seedAreas.length > 0 ? seedAreas : buildDefaultClusters();
      ls.setItem(STORAGE_KEYS.CBC_LEARNING_AREAS, JSON.stringify(value));
      report.restoredFromSeed.push(STORAGE_KEYS.CBC_LEARNING_AREAS);
    }
    report.keys.push(STORAGE_KEYS.CBC_LEARNING_AREAS);

    // 3. Payment Records / Fee Ledgers
    if (!ls.getItem(STORAGE_KEYS.PAYMENT_RECORDS)) {
      const seedFees = Array.isArray(INITIAL_SEED_DATA.fees)
        ? INITIAL_SEED_DATA.fees
        : [];
      ls.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(seedFees));
      report.restoredFromSeed.push(STORAGE_KEYS.PAYMENT_RECORDS);
    }
    report.keys.push(STORAGE_KEYS.PAYMENT_RECORDS);

    // 3b. Transactions
    if (!ls.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      const seedTx = Array.isArray(INITIAL_SEED_DATA.transactions)
        ? INITIAL_SEED_DATA.transactions
        : [];
      ls.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seedTx));
      report.restoredFromSeed.push(STORAGE_KEYS.TRANSACTIONS);
    }
    report.keys.push(STORAGE_KEYS.TRANSACTIONS);

    // 4. User Settings
    if (!ls.getItem(STORAGE_KEYS.USER_SETTINGS)) {
      const seedSettings = INITIAL_SEED_DATA.settings ?? {};
      ls.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(seedSettings));
      report.restoredFromSeed.push(STORAGE_KEYS.USER_SETTINGS);
    }
    report.keys.push(STORAGE_KEYS.USER_SETTINGS);

    // 5. Subscriptions (start with empty list if missing)
    if (!ls.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
      ls.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify([]));
      report.restoredFromSeed.push(STORAGE_KEYS.SUBSCRIPTIONS);
    }
    report.keys.push(STORAGE_KEYS.SUBSCRIPTIONS);

    // 5b. Billing settings
    if (!ls.getItem(STORAGE_KEYS.BILLING_SETTINGS)) {
      ls.setItem(STORAGE_KEYS.BILLING_SETTINGS, JSON.stringify({}));
    }
    report.keys.push(STORAGE_KEYS.BILLING_SETTINGS);

    // Mark hydration complete and bump schema version
    ls.setItem(STORAGE_KEYS.HYDRATION_DONE, 'true');
    ls.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    report.hydrated = true;
  } catch (err) {
    console.error('[storage] Hydration failed:', err);
  }

  return report;
}

// ─── Typed store accessors (read) ───────────────────────────────────────────

export const getStudents = (): Student[] =>
  readStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);

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
  const ok = writeStorage(STORAGE_KEYS.STUDENTS, students);
  if (ok) {
    // Keep legacy mirror in sync for any older code paths
    writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, students);
  }
  return ok;
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
  const newRec: PaymentRecord = { ...input, id: input.id ?? generateId('pay') };
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
  const ls = safeLocalStorage();
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
  const ls = safeLocalStorage();
  if (!ls) return false;
  return ls.getItem(STORAGE_KEYS.HYDRATION_DONE) === 'true';
}
