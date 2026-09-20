/**
 * persistentStore.ts — Dual-store persistence layer (IndexedDB + localStorage)
 *
 * This module provides a unified, backwards-compatible storage API backed by
 * IndexedDB for reliable structured persistence and localStorage for:
 *   • Synchronous read access (zero latency in hot paths)
 *   • Cross-tab synchronization via the `storage` event
 *
 * ─── Architecture ─────────────────────────────────────────────────────────
 *
 *   WRITE path:
 *     write(key, value)
 *       1. JSON.stringify → localStorage  ← synchronous, fires storage events
 *       2. IndexedDB put (fire-and-forget)  ← async, resilient
 *       3. In-memory cache update           ← synchronous
 *
 *   READ path:
 *     read<T>(key, fallback)
 *       1. Return from in-memory cache if present
 *       2. Else read localStorage (synchronous)
 *       3. Warm the cache from that value
 *
 *   This means all existing synchronous code paths (hooks, components) are
 *   never broken — they always get data from localStorage or the cache.
 *   The IndexedDB layer is a transparent write-through cache that survives
 *   browser tab close and allows future offline-first features.
 *
 * ─── Compatibility ─────────────────────────────────────────────────────────
 *
 *   The exported API is a drop-in replacement for the functions from
 *   `src/utils/storage.ts`. Existing code does not need to change.
 *
 *   New async operations are also exported for components that need bulk
 *   IndexedDB access (e.g. migrations, background sync).
 */

import { idbStore } from './idbStore';
import { SCHEMA_META_KEY } from './schemaMigrations';
import { getLocalStorage, safeParse, isQuotaExceeded, handleQuotaError } from '@/utils/storageUtils';

// ─── In-memory cache ────────────────────────────────────────────────────────

const memoryCache = new Map<string, unknown>();

function cacheGet<T>(key: string): T | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }
  return null;
}

function cacheSet<T>(key: string, value: T): void {
  memoryCache.set(key, value);
}

// ─── Read (localStorage-first, cache-warmed) ────────────────────────────────

/**
 * Read a value from storage. Returns `fallback` if not found.
 *
 * Priority: memory cache → localStorage → fallback
 * Writes through to cache on every read from localStorage.
 */
export function readStorage<T>(key: string, fallback: T): T {
  // 1. Memory cache hit
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  // 2. localStorage
  const ls = getLocalStorage();
  if (ls) {
    const raw = ls.getItem(key);
    if (raw != null) {
      const parsed = safeParse<T>(raw, fallback);
      if (parsed !== null) {
        cacheSet(key, parsed);
        return parsed;
      }
    }
  }

  // 3. Fallback
  return fallback;
}

/**
 * Async read from IndexedDB only (bypasses localStorage).
 * Use this when you need fresh data not yet in the cache.
 */
export async function idbRead<T>(storeName: string, key: string): Promise<T | undefined> {
  try {
    return await idbStore.get<T>(storeName, key);
  } catch {
    return undefined;
  }
}

// ─── Write (write-through: localStorage + IndexedDB + cache) ────────────────

/**
 * Persist a value to both localStorage and IndexedDB.
 * Always fires `notifyDataChanged` so React hooks re-subscribe correctly.
 */
export function writeStorage<T>(key: string, value: T): boolean {
  const serialized = JSON.stringify(value);

  // 1. localStorage (source of truth for synchronous reads)
  const ls = getLocalStorage();
  if (!ls) {
    console.warn(`[persistentStore] localStorage unavailable — write to "${key}" failed silently`);
  } else {
    try {
      ls.setItem(key, serialized);
    } catch (err) {
      if (isQuotaExceeded(err)) {
        handleQuotaError(key);
      } else {
        console.error(`[persistentStore] localStorage write failed for "${key}":`, err);
      }
    }
  }

  // 2. Memory cache
  cacheSet(key, value);

  // 3. IndexedDB write-through (fire-and-forget)
  //    The store name is derived from the key pattern so we can retrieve
  //    it later in idbRead / idbWriteMany without extra mapping.
  _idbWriteThru(key, value).catch((err) => {
    console.error(`[persistentStore] IDB write-through failed for "${key}":`, err);
  });

  // 4. Notify React subscribers
  notifyDataChanged(key);

  return true;
}

/**
 * Dispatch a custom event so any subscribed hook recomputes.
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
 * Drop-in replacement for localStorage.setItem with change notification.
 * Alias for writeStorage — call this from any mutation site.
 */
export function lsSet<T>(key: string, value: T): boolean {
  return writeStorage(key, value);
}

/**
 * Remove a key from all three layers.
 */
export function removeStorage(key: string): boolean {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.removeItem(key);
    } catch (err) {
      console.error(`[persistentStore] Failed to remove "${key}":`, err);
      return false;
    }
  }
  memoryCache.delete(key);
  _idbDeleteByKey(key).catch(() => {});
  notifyDataChanged(key);
  return true;
}

/**
 * Wipe ALL app data from localStorage + IndexedDB + memory cache.
 */
export function clearAllStorage(): void {
  const ls = getLocalStorage();
  try {
    if (ls) ls.clear();
  } catch (err) {
    console.error('[persistentStore] Failed to clear storage:', err);
  }
  memoryCache.clear();
  // Clear every store in IDB
  const storeNames = [
    'learners', 'staff', 'staff_prereg', 'grades', 'streams', 'exam_types',
    'learning_areas', 'learning_area_clusters', 'assessment_scores', 'exams',
    'marks_records', 'fee_ledgers', 'fee_structures', 'transactions',
    'attendance_v2', 'staff_attendance', 'library_books', 'library_issues',
    'ict_assets', 'asset_logs', 'notices', 'messages', 'portfolio_artifacts',
    'promotions', 'transfers', 'system_settings', 'subscriptions',
  ];
  for (const name of storeNames) {
    idbStore.clearStore(name).catch(() => {});
  }
}

// ─── Async bulk operations (IndexedDB) ──────────────────────────────────────

/**
 * Read all records from an IndexedDB store.
 */
export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    return await idbStore.getAll<T>(storeName);
  } catch {
    return [];
  }
}

/**
 * Write a single record to an IndexedDB store.
 */
export async function idbPut<T extends object>(storeName: string, value: T): Promise<void> {
  await idbStore.put(storeName, value);
}

/**
 * Write many records to an IndexedDB store in one transaction.
 */
export async function idbPutMany<T extends object>(storeName: string, records: T[]): Promise<void> {
  await idbStore.putMany(storeName, records);
}

/**
 * Delete a record from an IndexedDB store by key.
 */
export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  await idbStore.delete(storeName, key);
}

// ─── Key → IDB store name mapping ───────────────────────────────────────────

/**
 * Maps localStorage keys to their corresponding IndexedDB store names.
 * Used by the write-through logic.
 */
const LS_KEY_TO_IDB_STORE: Record<string, string> = {
  'school_learners_data': 'learners',
  'munyaka_students': 'learners',
  'munyaka_students_master': 'learners',
  'munyaka_staff_directory': 'staff',
  'munyaka_staff': 'staff',
  'munyaka_staff_prereg': 'staff_prereg',
  'munyaka_grades': 'grades',
  'munyaka_exam_types': 'exam_types',
  'munyaka_learning_areas': 'learning_areas',
  'munyaka_cbc_learning_areas': 'learning_areas',
  'munyaka_assessment_scores': 'assessment_scores',
  'all_set_exams': 'exams',
  'munyaka_fee_structures': 'fee_structures',
  'munyaka_fees_records': 'fee_ledgers',
  'munyaka_student_fees': 'fee_ledgers',
  'munyaka_transactions': 'transactions',
  'munyaka_library_books': 'library_books',
  'munyaka_ict_assets': 'ict_assets',
  'munyaka_notices': 'notices',
  'munyaka_messages': 'messages',
  'munyaka_portfolio_artifacts': 'portfolio_artifacts',
  'munyaka_promotions': 'promotions',
  'munyaka_transfers': 'transfers',
  'munyaka_system_settings_v3': 'system_settings',
  'munyaka_subscriptions': 'subscriptions',
  'munyaka_billing_settings': 'subscriptions',
};

/**
 * Maps IndexedDB store names back to canonical localStorage keys.
 * Used when loading from IDB to warm the localStorage cache.
 */
const IDB_STORE_TO_LS_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(LS_KEY_TO_IDB_STORE).map(([ls, idb]) => [idb, ls])
);

// ─── Internal IndexedDB write-through ───────────────────────────────────────

async function _idbWriteThru(key: string, value: unknown): Promise<void> {
  const storeName = LS_KEY_TO_IDB_STORE[key];
  if (!storeName) return;

  // value can be an array, object, or primitive
  if (Array.isArray(value)) {
    // Bulk-write each item individually so IDB's keyPath works correctly
    const records = value.filter((item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object'
    );
    await idbStore.putMany(storeName, records);
  } else if (value !== null && typeof value === 'object') {
    // Single object with a keyPath field
    await idbStore.put(storeName, value as Record<string, unknown>);
  }
}

async function _idbDeleteByKey(key: string): Promise<void> {
  const storeName = LS_KEY_TO_IDB_STORE[key];
  if (!storeName) return;
  // We can't know the IDB key without parsing the data, so we clear the store.
  // This is acceptable because this function is only called from removeStorage()
  // which is typically for manual user actions (e.g. clearing an individual record).
  await idbStore.clearStore(storeName);
}

// ─── Seed data hydration ────────────────────────────────────────────────────

import { INITIAL_SEED_DATA } from '@/data/initialSeedData';

/**
 * Hydrate every primary store from INITIAL_SEED_DATA if localStorage is empty.
 * Called at app startup after migrations complete.
 *
 * This mirrors the logic in `utils/storage.ts` hydrateAllStores() but writes
 * through to both IndexedDB and localStorage via writeStorage().
 */
export function hydrateFromSeed(): void {
  const ls = getLocalStorage();
  if (!ls) return;

  const seedIfAbsent = (key: string, value: unknown) => {
    if (ls.getItem(key) === null && value !== undefined) {
      writeStorage(key, value);
    }
  };

  // Learners — seed from the hardcoded initialSeedData snapshot on clean installs.
  if (Array.isArray(INITIAL_SEED_DATA?.students) && INITIAL_SEED_DATA.students.length > 0) {
    seedIfAbsent('school_learners_data', INITIAL_SEED_DATA.students);
    seedIfAbsent('munyaka_students', INITIAL_SEED_DATA.students);
  }

  // Staff — also seeded from the hardcoded initialSeedData snapshot.
  if (Array.isArray(INITIAL_SEED_DATA?.staff) && INITIAL_SEED_DATA.staff.length > 0) {
    seedIfAbsent('munyaka_staff_directory', INITIAL_SEED_DATA.staff);
    seedIfAbsent('munyaka_staff', INITIAL_SEED_DATA.staff);
  }

  // Staff pre-registration
  if (Array.isArray((INITIAL_SEED_DATA as any).staffPrereg)) {
    seedIfAbsent('munyaka_staff_prereg', (INITIAL_SEED_DATA as any).staffPrereg);
  }

  // Grades
  if (Array.isArray((INITIAL_SEED_DATA as any).grades)) {
    seedIfAbsent('munyaka_grades', (INITIAL_SEED_DATA as any).grades);
  }

  // Exam types
  if (Array.isArray((INITIAL_SEED_DATA as any).examTypes)) {
    seedIfAbsent('munyaka_exam_types', (INITIAL_SEED_DATA as any).examTypes);
  }

  // Learning areas
  if (Array.isArray((INITIAL_SEED_DATA as any).learningAreas)) {
    seedIfAbsent('munyaka_learning_areas', (INITIAL_SEED_DATA as any).learningAreas);
  }

  // Assessment scores
  if ((INITIAL_SEED_DATA as any).assessmentScores) {
    seedIfAbsent('munyaka_assessment_scores', (INITIAL_SEED_DATA as any).assessmentScores);
  }

  // Fee ledgers
  if (Array.isArray((INITIAL_SEED_DATA as any).fees)) {
    seedIfAbsent('munyaka_fees_records', (INITIAL_SEED_DATA as any).fees);
    seedIfAbsent('munyaka_student_fees', (INITIAL_SEED_DATA as any).fees);
  }

  // Fee structures
  if (Array.isArray((INITIAL_SEED_DATA as any).feeStructures)) {
    seedIfAbsent('munyaka_fee_structures', (INITIAL_SEED_DATA as any).feeStructures);
  }

  // Transactions
  if (Array.isArray(INITIAL_SEED_DATA.transactions)) {
    seedIfAbsent('munyaka_transactions', INITIAL_SEED_DATA.transactions);
  }

  // Attendance
  if ((INITIAL_SEED_DATA as any).attendance) {
    seedIfAbsent('munyaka_attendance_records', (INITIAL_SEED_DATA as any).attendance);
  }

  // Library books
  if (Array.isArray(INITIAL_SEED_DATA.libraryBooks)) {
    seedIfAbsent('munyaka_library_books', INITIAL_SEED_DATA.libraryBooks);
  }

  // ICT assets
  if (Array.isArray((INITIAL_SEED_DATA as any).ictAssets)) {
    seedIfAbsent('munyaka_ict_assets', (INITIAL_SEED_DATA as any).ictAssets);
  }

  // Notices
  if (Array.isArray((INITIAL_SEED_DATA as any).notices)) {
    seedIfAbsent('munyaka_notices', (INITIAL_SEED_DATA as any).notices);
  }

  // System settings
  if ((INITIAL_SEED_DATA as any).settings) {
    seedIfAbsent('munyaka_system_settings_v3', (INITIAL_SEED_DATA as any).settings);
  }
}

// ─── Persistence helpers (typed CRUD, mirrors utils/storage.ts) ─────────────

export { generateId } from '@/utils/storage';

// ─── Typed store accessors ──────────────────────────────────────────────────

export interface Student {
  id: string;
  admNo?: string;
  admissionNumber?: string;
  name?: string;
  grade?: string;
  gradeLevel?: string;
  class?: string;
  stream?: string;
  classStream?: string;
  gender?: string;
  guardian?: string;
  phone?: string;
  status?: string;
  schoolId?: string;
  isArchived?: boolean;
  deletedAt?: string;
  assessment?: string;
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

export const STORAGE_KEYS = {
  STUDENTS: 'school_learners_data',
  STUDENTS_LEGACY: 'munyaka_students',
  CBC_LEARNING_AREAS: 'munyaka_learning_areas',
  PAYMENT_RECORDS: 'munyaka_fees_records',
  TRANSACTIONS: 'munyaka_transactions',
  USER_SETTINGS: 'munyaka_system_settings_v3',
  SUBSCRIPTIONS: 'munyaka_subscriptions',
  BILLING_SETTINGS: 'munyaka_billing_settings',
  STAFF: 'munyaka_staff_directory',
  STAFF_PREREG: 'munyaka_staff_prereg',
  ATTENDANCE: 'munyaka_attendance_records',
  GRADES: 'munyaka_grades',
  EXAM_TYPES: 'munyaka_exam_types',
  ASSESSMENT_SCORES: 'munyaka_assessment_scores',
  LIBRARY_BOOKS: 'munyaka_library_books',
  ICT_ASSETS: 'munyaka_ict_assets',
  HYDRATION_DONE: 'munyaka_hydration_done',
  SCHEMA_VERSION: 'munyaka_schema_version',
  APP_SEED_VERSION: 'app_seed_version',
} as const;

export const CURRENT_SCHEMA_VERSION_PERSISTENT = 'persistent-storage-v1';

// ─── Typed read helpers ─────────────────────────────────────────────────────

export function getStudents(): Student[] {
  return readStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
}

export function getLearningAreas(): LearningAreaCluster[] {
  return readStorage<LearningAreaCluster[]>(STORAGE_KEYS.CBC_LEARNING_AREAS, []);
}

export function getPaymentRecords(): PaymentRecord[] {
  return readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []);
}

export function getTransactions(): PaymentRecord[] {
  return readStorage<PaymentRecord[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function getUserSettings(): UserSettings {
  return readStorage<UserSettings>(STORAGE_KEYS.USER_SETTINGS, {} as UserSettings);
}

export function getSubscriptions(): Subscription[] {
  return readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
}

// ─── Typed write helpers ─────────────────────────────────────────────────────

export function setStudents(students: Student[]): boolean {
  const ok = writeStorage(STORAGE_KEYS.STUDENTS, students);
  if (ok) writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, students);
  return ok;
}

export function setLearningAreas(areas: LearningAreaCluster[]): boolean {
  return writeStorage(STORAGE_KEYS.CBC_LEARNING_AREAS, areas);
}

export function setPaymentRecords(records: PaymentRecord[]): boolean {
  return writeStorage(STORAGE_KEYS.PAYMENT_RECORDS, records);
}

export function setTransactions(txs: PaymentRecord[]): boolean {
  return writeStorage(STORAGE_KEYS.TRANSACTIONS, txs);
}

export function setUserSettings(settings: UserSettings): boolean {
  return writeStorage(STORAGE_KEYS.USER_SETTINGS, settings);
}

export function setSubscriptions(subs: Subscription[]): boolean {
  return writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
}

export function patchUserSettings(patch: Partial<UserSettings>): boolean {
  const current = getUserSettings();
  const merged: UserSettings = { ...current, ...patch };
  return writeStorage(STORAGE_KEYS.USER_SETTINGS, merged);
}

// ─── Storage size inspection ─────────────────────────────────────────────────

export function getStorageSizes(): Record<string, number> {
  const ls = getLocalStorage();
  if (!ls) return {};
  const out: Record<string, number> = {};
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (!k) continue;
    out[k] = (ls.getItem(k) ?? '').length;
  }
  return out;
}

export function isHydrated(): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  return ls.getItem(STORAGE_KEYS.HYDRATION_DONE) === 'true';
}

export function markHydrated(): void {
  writeStorage(STORAGE_KEYS.HYDRATION_DONE, true);
  writeStorage(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION_PERSISTENT);
}
