/**
 * unifiedDataLayer.ts — Centralized data service wrapper
 *
 * Provides a single, unified API for all data persistence needs across
 * the entire application. All modules MUST read and write through this
 * service to ensure data consistency, persistence across app restarts,
 * and cross-platform parity.
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────────┐
 *   │              UnifiedDataService (public API)         │
 *   ├─────────────────────────────────────────────────────┤
 *   │  StorageAdapter (strategy pattern)                   │
 *   │    ├── CapacitorPreferencesAdapter  (native builds)  │
 *   │    └── WebStorageAdapter            (web builds)     │
 *   │         ├── localStorage (synchronous, reactive)     │
 *   │         └── IndexedDB  (write-through, resilient)    │
 *   └─────────────────────────────────────────────────────┘
 *
 * Features:
 *   • Single source of truth for all app data
 *   • Capacitor Preferences for native persistent storage
 *   • localStorage + IndexedDB dual-write on web
 *   • Cross-tab sync via CustomEvent dispatch
 *   • Quota-exceeded detection with user-facing toast
 *   • Full database export / import
 *   • Schema versioning & migration hooks
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { idbStore } from './idbStore';
import {
  safeParse,
  isQuotaExceeded,
  handleQuotaError,
  getLocalStorage,
  lsRead,
  lsWrite,
  lsRemove,
  lsSizeOf,
  lsTotalSize,
  lsHas,
} from '@/utils/storageUtils';
import { notifyDataChanged } from './persistentStore';
import { STORAGE_KEYS as PERSISTENT_KEYS, type Student, type PaymentRecord, type UserSettings, type Subscription, type LearningAreaCluster } from './persistentStore';

// ─── Storage Adapter Interface ───────────────────────────────────────

interface StorageAdapter {
  readonly type: 'native' | 'web';
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  /** Optional: bulk read all keys at once */
  getAll?(): Promise<Record<string, string>>;
}

// ─── Capacitor Preferences Adapter ────────────────────────────────────

class CapacitorPreferencesAdapter implements StorageAdapter {
  readonly type = 'native' as const;

  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null || value === undefined) return fallback;
      const parsed = JSON.parse(value) as T;
      return parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await Preferences.set({ key, value: serialized });
      notifyDataChanged(key);
      return true;
    } catch (err) {
      console.error(`[UnifiedData] Capacitor write failed for "${key}":`, err);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      await Preferences.remove({ key });
      notifyDataChanged(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await Preferences.clear();
      notifyDataChanged();
      return true;
    } catch {
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key });
      return value !== null && value !== undefined;
    } catch {
      return false;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys ?? [];
    } catch {
      return [];
    }
  }

  async getAll(): Promise<Record<string, string>> {
    try {
      const { keys } = await Preferences.keys();
      const result: Record<string, string> = {};
      for (const key of keys) {
        const { value } = await Preferences.get({ key });
        if (value !== null) result[key] = value;
      }
      return result;
    } catch {
      return {};
    }
  }
}

// ─── Web Storage Adapter (localStorage + IndexedDB) ───────────────────

class WebStorageAdapter implements StorageAdapter {
  readonly type = 'web' as const;

  async get<T>(key: string, fallback: T): Promise<T> {
    return lsRead<T>(key, fallback);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const ok = lsWrite(key, value);
    if (ok) {
      // Write-through to IndexedDB for resilience
      _idbWriteThru(key, value).catch((err) => {
        console.error(`[UnifiedData] IDB write-through failed for "${key}":`, err);
      });
    }
    return ok;
  }

  async remove(key: string): Promise<boolean> {
    lsRemove(key);
    memoryCache.delete(key);
    notifyDataChanged(key);
    return true;
  }

  async clear(): Promise<boolean> {
    const ls = getLocalStorage();
    if (ls) {
      try { ls.clear(); } catch { /* no-op */ }
    }
    memoryCache.clear();
    notifyDataChanged();
    return true;
  }

  async has(key: string): Promise<boolean> {
    return lsHas(key);
  }

  async keys(): Promise<string[]> {
    const ls = getLocalStorage();
    if (!ls) return [];
    const out: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k) out.push(k);
    }
    return out;
  }

  async getAll(): Promise<Record<string, string>> {
    const ls = getLocalStorage();
    if (!ls) return {};
    const out: Record<string, string> = {};
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (!k) continue;
      out[k] = ls.getItem(k) ?? '';
    }
    return out;
  }
}

// ─── In-memory cache ──────────────────────────────────────────────────

const memoryCache = new Map<string, unknown>();

function cacheGet<T>(key: string): T | null {
  return (memoryCache.get(key) as T) ?? null;
}

function cacheSet<T>(key: string, value: T): void {
  memoryCache.set(key, value);
}

function cacheDelete(key: string): void {
  memoryCache.delete(key);
}

function cacheClear(): void {
  memoryCache.clear();
}

// ─── IndexedDB write-through helper ───────────────────────────────────

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
  'munyaka_marks_records': 'marks_records',
  'munyaka_fee_structures': 'fee_structures',
  'munyaka_fees_records': 'fee_ledgers',
  'munyaka_student_fees': 'fee_ledgers',
  'munyaka_transactions': 'transactions',
  'munyaka_attendance_records': 'attendance_v2',
  'munyaka_staff_attendance': 'staff_attendance',
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
  'school-timetable-data': 'exams',
  'school-timetable-grades': 'grades',
  'munyaka_term_locks': 'system_settings',
  'munyaka_sync_queue': 'system_settings',
  'munyaka_last_sync': 'system_settings',
  'munyaka_device_id': 'system_settings',
  'munyaka_initialized': 'system_settings',
  'munyaka_seed_version': 'system_settings',
  'munyaka_hydration_done': 'system_settings',
  'munyaka_schema_version': 'system_settings',
  'app_seed_version': 'system_settings',
  'munyaka_owner_academic': 'system_settings',
  'school_academic_settings': 'system_settings',
  'munyaka_academic_calendar': 'system_settings',
  'lan_server_url': 'system_settings',
  'munyaka_lan_server_url': 'system_settings',
};

async function _idbWriteThru(key: string, value: unknown): Promise<void> {
  const storeName = LS_KEY_TO_IDB_STORE[key];
  if (!storeName) return;

  if (Array.isArray(value)) {
    const records = value.filter(
      (item): item is Record<string, unknown> => item !== null && typeof item === 'object'
    );
    if (records.length > 0) await idbStore.putMany(storeName, records);
  } else if (value !== null && typeof value === 'object') {
    await idbStore.put(storeName, value as Record<string, unknown>);
  }
}

// ─── Adapter selection ────────────────────────────────────────────────

let _adapter: StorageAdapter | null = null;

async function getAdapter(): Promise<StorageAdapter> {
  if (_adapter) return _adapter;

  if (Capacitor.isNative?.()) {
    _adapter = new CapacitorPreferencesAdapter();
  } else {
    _adapter = new WebStorageAdapter();
  }
  return _adapter;
}

/** Reset the adapter (useful for testing or platform changes) */
export function resetAdapter(): void {
  _adapter = null;
}

// ─── Unified Data Service ─────────────────────────────────────────────

export interface StorageInfo {
  adapterType: 'native' | 'web';
  keyCount: number;
  totalBytes: number;
  keys: string[];
}

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
  marks: unknown;
  timetable: unknown;
  termLocks: unknown;
  syncQueue: unknown;
}

export interface ImportResult {
  success: boolean;
  keysRestored: string[];
  errors: string[];
}

export interface HydrationReport {
  hydrated: boolean;
  schemaVersion: string;
  keys: string[];
  restoredFromSeed: string[];
}

// ─── Storage Keys ─────────────────────────────────────────────────────

export const UNIFIED_KEYS = {
  ...PERSISTENT_KEYS,
  MASTER_LEARNERS: 'munyaka_master_learner_list',
  MARKS: 'munyaka_marks_records',
  TIMETABLE: 'school-timetable-data',
  TIMETABLE_GRADES: 'school-timetable-grades',
  STAFF_ATTENDANCE: 'munyaka_staff_attendance',
  TERM_LOCKS: 'munyaka_term_locks',
  SYNC_QUEUE: 'munyaka_sync_queue',
  LAST_SYNC: 'munyaka_last_sync',
  DEVICE_ID: 'munyaka_device_id',
  SCHEMA_VERSION: 'munyaka_schema_version',
  HYDRATION_DONE: 'munyaka_hydration_done',
  APP_SEED_VERSION: 'app_seed_version',
} as const;

export const CURRENT_SCHEMA_VERSION = 'unified-data-v1';

// ─── Public API ───────────────────────────────────────────────────────

export const UnifiedDataService = {
  // ── Adapter info ──────────────────────────────────────────────────

  /** Returns the active storage adapter type ('native' or 'web'). */
  getAdapterType: async (): Promise<'native' | 'web'> => {
    const adapter = await getAdapter();
    return adapter.type;
  },

  // ── Generic CRUD ──────────────────────────────────────────────────

  /** Read a typed value from the unified data layer. */
  get: async <T>(key: string, fallback: T): Promise<T> => {
    // 1. Memory cache
    const cached = cacheGet<T>(key);
    if (cached !== null) return cached;

    // 2. Storage adapter
    const adapter = await getAdapter();
    const value = await adapter.get<T>(key, fallback);

    // 3. Warm cache
    if (value !== fallback) cacheSet(key, value);
    return value;
  },

  /** Write a typed value to the unified data layer. */
  set: async <T>(key: string, value: T): Promise<boolean> => {
    const adapter = await getAdapter();
    const ok = await adapter.set<T>(key, value);
    if (ok) {
      cacheSet(key, value);
      notifyDataChanged(key);
    }
    return ok;
  },

  /** Remove a key from all storage layers. */
  remove: async (key: string): Promise<boolean> => {
    const adapter = await getAdapter();
    const ok = await adapter.remove(key);
    if (ok) cacheDelete(key);
    return ok;
  },

  /** Clear all app data from every storage layer. */
  clear: async (): Promise<boolean> => {
    const adapter = await getAdapter();
    const ok = await adapter.clear();
    if (ok) cacheClear();
    return ok;
  },

  /** Check if a key exists. */
  has: async (key: string): Promise<boolean> => {
    const adapter = await getAdapter();
    return adapter.has(key);
  },

  /** List all keys in the active storage layer. */
  keys: async (): Promise<string[]> => {
    const adapter = await getAdapter();
    return adapter.keys();
  },

  // ── Learners ──────────────────────────────────────────────────────

  getLearners: async (): Promise<Student[]> => {
    const primary = await UnifiedDataService.get<Student[]>(UNIFIED_KEYS.STUDENTS, []);
    const master = await UnifiedDataService.get<Student[]>(UNIFIED_KEYS.MASTER_LEARNERS, []);
    const legacy = await UnifiedDataService.get<Student[]>(UNIFIED_KEYS.STUDENTS_LEGACY, []);

    const combinedMap = new Map<string, Student>();
    [...master, ...primary, ...legacy].forEach((s) => {
      if (s && (s.id || s.admissionNumber || (s as any).admNo || s.name)) {
        const key = String(s.id || s.admissionNumber || (s as any).admNo || s.name).trim().toLowerCase();
        combinedMap.set(key, s);
      }
    });

    return Array.from(combinedMap.values());
  },

  saveLearners: async (learners: Student[]): Promise<boolean> => {
    const ok1 = await UnifiedDataService.set<Student[]>(UNIFIED_KEYS.STUDENTS, learners);
    const ok2 = await UnifiedDataService.set<Student[]>(UNIFIED_KEYS.STUDENTS_LEGACY, learners);
    const ok3 = await UnifiedDataService.set<Student[]>(UNIFIED_KEYS.MASTER_LEARNERS, learners);
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    return ok1 && ok2 && ok3;
  },

  // ── Staff ─────────────────────────────────────────────────────────

  getStaff: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.STAFF, []);
  },

  saveStaff: async (staff: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.STAFF, staff);
  },

  // ── Attendance ────────────────────────────────────────────────────

  getAttendance: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.ATTENDANCE, []);
  },

  saveAttendance: async (records: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.ATTENDANCE, records);
  },

  getStaffAttendance: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.STAFF_ATTENDANCE, []);
  },

  saveStaffAttendance: async (records: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.STAFF_ATTENDANCE, records);
  },

  // ── Finance ───────────────────────────────────────────────────────

  getFees: async (): Promise<PaymentRecord[]> => {
    return UnifiedDataService.get<PaymentRecord[]>(UNIFIED_KEYS.PAYMENT_RECORDS, []);
  },

  saveFees: async (records: PaymentRecord[]): Promise<boolean> => {
    return UnifiedDataService.set<PaymentRecord[]>(UNIFIED_KEYS.PAYMENT_RECORDS, records);
  },

  getTransactions: async (): Promise<PaymentRecord[]> => {
    return UnifiedDataService.get<PaymentRecord[]>(UNIFIED_KEYS.TRANSACTIONS, []);
  },

  saveTransactions: async (records: PaymentRecord[]): Promise<boolean> => {
    return UnifiedDataService.set<PaymentRecord[]>(UNIFIED_KEYS.TRANSACTIONS, records);
  },

  // ── Timetable ─────────────────────────────────────────────────────

  getTimetable: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.TIMETABLE, []);
  },

  saveTimetable: async (data: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.TIMETABLE, data);
  },

  getTimetableGrades: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.TIMETABLE_GRADES, []);
  },

  saveTimetableGrades: async (data: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.TIMETABLE_GRADES, data);
  },

  // ── Marks & Assessments ───────────────────────────────────────────

  getMarks: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.MARKS, []);
  },

  saveMarks: async (marks: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.MARKS, marks);
  },

  // ── CBC Learning Areas ────────────────────────────────────────────

  getLearningAreas: async (): Promise<LearningAreaCluster[]> => {
    return UnifiedDataService.get<LearningAreaCluster[]>(UNIFIED_KEYS.CBC_LEARNING_AREAS, []);
  },

  saveLearningAreas: async (areas: LearningAreaCluster[]): Promise<boolean> => {
    return UnifiedDataService.set<LearningAreaCluster[]>(UNIFIED_KEYS.CBC_LEARNING_AREAS, areas);
  },

  // ── User Settings ─────────────────────────────────────────────────

  getUserSettings: async (): Promise<UserSettings> => {
    return UnifiedDataService.get<UserSettings>(UNIFIED_KEYS.USER_SETTINGS, {} as UserSettings);
  },

  saveUserSettings: async (settings: UserSettings): Promise<boolean> => {
    return UnifiedDataService.set<UserSettings>(UNIFIED_KEYS.USER_SETTINGS, settings);
  },

  patchUserSettings: async (patch: Partial<UserSettings>): Promise<boolean> => {
    const current = await UnifiedDataService.getUserSettings();
    return UnifiedDataService.set<UserSettings>(UNIFIED_KEYS.USER_SETTINGS, { ...current, ...patch } as UserSettings);
  },

  // ── Subscriptions ─────────────────────────────────────────────────

  getSubscriptions: async (): Promise<Subscription[]> => {
    return UnifiedDataService.get<Subscription[]>(UNIFIED_KEYS.SUBSCRIPTIONS, []);
  },

  saveSubscriptions: async (subs: Subscription[]): Promise<boolean> => {
    return UnifiedDataService.set<Subscription[]>(UNIFIED_KEYS.SUBSCRIPTIONS, subs);
  },

  // ── Term Locking ──────────────────────────────────────────────────

  getTermLocks: async (): Promise<Record<string, boolean>> => {
    const activeYearStr = (() => {
      try {
        const raw = localStorage.getItem('munyaka_system_settings_v3');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.academicYear) return parseInt(s.academicYear, 10);
        }
      } catch {}
      return new Date().getFullYear();
    })();

    const currentYear = activeYearStr || new Date().getFullYear();
    const prevYear = currentYear - 1;
    const defaults: Record<string, boolean> = {
      [`term1_${prevYear}`]: true,
      [`term2_${prevYear}`]: true,
      [`term3_${prevYear}`]: true,
      [`term1_${currentYear}`]: false,
      [`term2_${currentYear}`]: false,
      [`term3_${currentYear}`]: false,
      [`term1_${currentYear + 1}`]: false,
      [`term2_${currentYear + 1}`]: false,
      [`term3_${currentYear + 1}`]: false,
    };
    return UnifiedDataService.get<Record<string, boolean>>(UNIFIED_KEYS.TERM_LOCKS, defaults);
  },

  saveTermLocks: async (locks: Record<string, boolean>): Promise<boolean> => {
    return UnifiedDataService.set<Record<string, boolean>>(UNIFIED_KEYS.TERM_LOCKS, locks);
  },

  isTermLocked: async (termKey: string): Promise<boolean> => {
    const locks = await UnifiedDataService.getTermLocks();
    return !!locks[termKey];
  },

  toggleTermLock: async (termKey: string, locked: boolean): Promise<boolean> => {
    const locks = await UnifiedDataService.getTermLocks();
    locks[termKey] = locked;
    return UnifiedDataService.saveTermLocks(locks);
  },

  // ── Sync Queue ────────────────────────────────────────────────────

  getSyncQueue: async (): Promise<any[]> => {
    return UnifiedDataService.get<any[]>(UNIFIED_KEYS.SYNC_QUEUE, []);
  },

  saveSyncQueue: async (queue: any[]): Promise<boolean> => {
    return UnifiedDataService.set<any[]>(UNIFIED_KEYS.SYNC_QUEUE, queue);
  },

  // ── Hydration ─────────────────────────────────────────────────────

  /**
   * Auto-hydrate every primary store from seed data if the key is absent.
   * Safe to call on every app launch — only writes missing keys.
   */
  hydrateFromSeed: async (): Promise<HydrationReport> => {
    const ls = getLocalStorage();
    const report: HydrationReport = {
      hydrated: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      keys: [],
      restoredFromSeed: [],
    };

    if (!ls) return report;

    const seedIfAbsent = (key: string, value: unknown): void => {
      try {
        if (ls.getItem(key) !== null) return;
        ls.setItem(key, JSON.stringify(value));
        report.restoredFromSeed.push(key);
      } catch (err) {
        if (isQuotaExceeded(err)) {
          handleQuotaError(key, 'seed');
        } else {
          console.error(`[UnifiedData] hydrate failed to write "${key}":`, err);
        }
      }
    };

    try {
      // Learners — never pre-seed
      seedIfAbsent(UNIFIED_KEYS.STUDENTS, []);
      seedIfAbsent(UNIFIED_KEYS.STUDENTS_LEGACY, []);

      // Staff
      seedIfAbsent(UNIFIED_KEYS.STAFF, []);

      // Grades
      seedIfAbsent(UNIFIED_KEYS.GRADES, []);

      // Exam types
      seedIfAbsent(UNIFIED_KEYS.EXAM_TYPES, []);

      // Learning areas
      seedIfAbsent(UNIFIED_KEYS.CBC_LEARNING_AREAS, []);

      // Assessment scores
      seedIfAbsent(UNIFIED_KEYS.ASSESSMENT_SCORES, []);

      // Library books
      seedIfAbsent(UNIFIED_KEYS.LIBRARY_BOOKS, []);

      // ICT assets
      seedIfAbsent(UNIFIED_KEYS.ICT_ASSETS, []);

      // Attendance
      seedIfAbsent(UNIFIED_KEYS.ATTENDANCE, []);

      // Payment records
      seedIfAbsent(UNIFIED_KEYS.PAYMENT_RECORDS, []);

      // Transactions
      seedIfAbsent(UNIFIED_KEYS.TRANSACTIONS, []);

      // User settings
      seedIfAbsent(UNIFIED_KEYS.USER_SETTINGS, {});

      // Subscriptions
      seedIfAbsent(UNIFIED_KEYS.SUBSCRIPTIONS, []);

      // Mark hydration done
      ls.setItem(UNIFIED_KEYS.HYDRATION_DONE, 'true');
      ls.setItem(UNIFIED_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
      report.hydrated = true;
    } catch (err) {
      console.error('[UnifiedData] Hydration failed:', err);
    }

    return report;
  },

  // ── Backup / Export ───────────────────────────────────────────────

  exportAllData: async (): Promise<DatabaseBackup> => {
    const safeRead = async (key: string): Promise<unknown> => {
      try {
        const val = await UnifiedDataService.get<unknown>(key, null);
        return val;
      } catch {
        return undefined;
      }
    };

    return {
      version: CURRENT_SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      school: 'MUNYAKA PRIMARY AND JUNIOR SCHOOL',
      students: await safeRead(UNIFIED_KEYS.STUDENTS),
      staff: await safeRead(UNIFIED_KEYS.STAFF),
      staffPrereg: await safeRead(UNIFIED_KEYS.STAFF_PREREG),
      fees: await safeRead(UNIFIED_KEYS.PAYMENT_RECORDS),
      feeStructures: await safeRead('munyaka_fee_structures'),
      transactions: await safeRead(UNIFIED_KEYS.TRANSACTIONS),
      attendance: await safeRead(UNIFIED_KEYS.ATTENDANCE),
      grades: await safeRead(UNIFIED_KEYS.GRADES),
      examTypes: await safeRead(UNIFIED_KEYS.EXAM_TYPES),
      learningAreas: await safeRead(UNIFIED_KEYS.CBC_LEARNING_AREAS),
      assessmentScores: await safeRead(UNIFIED_KEYS.ASSESSMENT_SCORES),
      libraryBooks: await safeRead(UNIFIED_KEYS.LIBRARY_BOOKS),
      ictAssets: await safeRead(UNIFIED_KEYS.ICT_ASSETS),
      notices: await safeRead('munyaka_notices'),
      userSettings: await safeRead(UNIFIED_KEYS.USER_SETTINGS),
      subscriptions: await safeRead(UNIFIED_KEYS.SUBSCRIPTIONS),
      billingSettings: await safeRead(UNIFIED_KEYS.BILLING_SETTINGS),
      marks: await safeRead(UNIFIED_KEYS.MARKS),
      timetable: await safeRead(UNIFIED_KEYS.TIMETABLE),
      termLocks: await safeRead(UNIFIED_KEYS.TERM_LOCKS),
      syncQueue: await safeRead(UNIFIED_KEYS.SYNC_QUEUE),
    };
  },

  /** Download the full database as a JSON file. */
  downloadDatabaseBackup: async (): Promise<void> => {
    try {
      const backup = await UnifiedDataService.exportAllData();
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
      console.error('[UnifiedData] downloadDatabaseBackup failed:', err);
      throw err;
    }
  },

  // ── Import ────────────────────────────────────────────────────────

  importAllData: async (backup: DatabaseBackup): Promise<ImportResult> => {
    const result: ImportResult = { success: true, keysRestored: [], errors: [] };

    const safeWrite = async (key: string, value: unknown, label: string): Promise<void> => {
      if (value === undefined) return;
      try {
        const ok = await UnifiedDataService.set(key, value);
        if (ok) result.keysRestored.push(label);
        else result.errors.push(`Write failed for "${label}" (${key})`);
      } catch (err) {
        result.errors.push(`Failed to write "${label}" (${key}): ${err instanceof Error ? err.message : String(err)}`);
        result.success = false;
      }
    };

    await safeWrite(UNIFIED_KEYS.STUDENTS, backup.students, 'Students');
    await safeWrite(UNIFIED_KEYS.STUDENTS_LEGACY, backup.students, 'Students (legacy)');
    await safeWrite(UNIFIED_KEYS.STAFF, backup.staff, 'Staff');
    await safeWrite(UNIFIED_KEYS.STAFF_PREREG, backup.staffPrereg, 'Staff Pre-registration');
    await safeWrite(UNIFIED_KEYS.PAYMENT_RECORDS, backup.fees, 'Fee Records');
    await safeWrite('munyaka_fee_structures', backup.feeStructures, 'Fee Structures');
    await safeWrite(UNIFIED_KEYS.TRANSACTIONS, backup.transactions, 'Transactions');
    await safeWrite(UNIFIED_KEYS.ATTENDANCE, backup.attendance, 'Attendance');
    await safeWrite(UNIFIED_KEYS.GRADES, backup.grades, 'Grades / Classes');
    await safeWrite(UNIFIED_KEYS.EXAM_TYPES, backup.examTypes, 'Exam Types');
    await safeWrite(UNIFIED_KEYS.CBC_LEARNING_AREAS, backup.learningAreas, 'Learning Areas');
    await safeWrite(UNIFIED_KEYS.ASSESSMENT_SCORES, backup.assessmentScores, 'Assessment Scores');
    await safeWrite(UNIFIED_KEYS.LIBRARY_BOOKS, backup.libraryBooks, 'Library Books');
    await safeWrite(UNIFIED_KEYS.ICT_ASSETS, backup.ictAssets, 'ICT Assets');
    await safeWrite('munyaka_notices', backup.notices, 'Notices');
    await safeWrite(UNIFIED_KEYS.USER_SETTINGS, backup.userSettings, 'System Settings');
    await safeWrite(UNIFIED_KEYS.SUBSCRIPTIONS, backup.subscriptions, 'Subscriptions');
    await safeWrite(UNIFIED_KEYS.BILLING_SETTINGS, backup.billingSettings, 'Billing Settings');
    await safeWrite(UNIFIED_KEYS.MARKS, backup.marks, 'Marks');
    await safeWrite(UNIFIED_KEYS.TIMETABLE, backup.timetable, 'Timetable');
    await safeWrite(UNIFIED_KEYS.TERM_LOCKS, backup.termLocks, 'Term Locks');
    await safeWrite(UNIFIED_KEYS.SYNC_QUEUE, backup.syncQueue, 'Sync Queue');

    if (result.keysRestored.length > 0) {
      notifyDataChanged();
    }

    return result;
  },

  /** Parse a raw JSON string and import it. */
  parseAndImportBackup: async (jsonString: string): Promise<ImportResult> => {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseBackup;
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, keysRestored: [], errors: ['Invalid backup file: root must be a JSON object.'] };
      }
      return await UnifiedDataService.importAllData(parsed);
    } catch (err) {
      return {
        success: false,
        keysRestored: [],
        errors: [`JSON parse error: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  },

  // ── Inspection ────────────────────────────────────────────────────

  /** Return storage info: adapter type, key count, total bytes, key list. */
  getStorageInfo: async (): Promise<StorageInfo> => {
    const adapter = await getAdapter();
    const keys = await adapter.keys();
    let totalBytes = 0;

    if (adapter.type === 'web') {
      totalBytes = lsTotalSize();
    } else {
      // For native, estimate from serialized values
      const all = await adapter.getAll?.();
      if (all) {
        for (const [k, v] of Object.entries(all)) {
          totalBytes += new Blob([k + v]).size;
        }
      }
    }

    return {
      adapterType: adapter.type,
      keyCount: keys.length,
      totalBytes,
      keys,
    };
  },

  /** Get approximate storage size for a single key, in bytes. */
  getKeySize: async (key: string): Promise<number> => {
    if (Capacitor.isNative?.()) {
      const adapter = await getAdapter();
      const all = await adapter.getAll?.();
      if (all && key in all) {
        return new Blob([key + all[key]]).size;
      }
      return 0;
    }
    return lsSizeOf(key);
  },

  /** Check if the data layer has been hydrated. */
  isHydrated: async (): Promise<boolean> => {
    const ls = getLocalStorage();
    if (!ls) return false;
    return ls.getItem(UNIFIED_KEYS.HYDRATION_DONE) === 'true';
  },

  /** Force-clear the adapter cache (useful for testing). */
  clearCache: (): void => {
    cacheClear();
  },
};

// ─── Re-export types & keys ───────────────────────────────────────────

export type { StorageAdapter, StorageInfo, DatabaseBackup, ImportResult, HydrationReport };
export { UNIFIED_KEYS, CURRENT_SCHEMA_VERSION };

// ─── Convenience default export ───────────────────────────────────────

export default UnifiedDataService;
