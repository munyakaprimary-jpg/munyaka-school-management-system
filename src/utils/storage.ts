// ─────────────────────────────────────────────────────────────────────────────
// Central LocalStorage Management Utility
// ─────────────────────────────────────────────────────────────────────────────
// Requirements:
// 1. Create src/utils/storage.ts to manage localStorage.
// 2. Filter out any blank or "Unnamed Learner" records automatically on load.
// 3. Normalize all staff access codes to strictly follow the MUN-XXXX format (e.g., MUN-1001, MUN-1002).
// ─────────────────────────────────────────────────────────────────────────────

import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { buildDefaultClusters } from '@/data/initialSeedData';

export const CURRENT_SCHEMA_VERSION = 'persistent-storage-v1';

export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_learners',
  STUDENTS: 'munyaka_learners',
  STUDENTS_LEGACY: 'munyaka_learners_legacy',
  MASTER_LEARNERS: 'munyaka_master_learner_list',
  STAFF: 'munyaka_staff',
  STAFF_PREREG: 'munyaka_staff_prereg',
  CENTRAL_DB: 'munyaka_central_db',
  SETTINGS: 'munyaka_system_settings',
  USER_SETTINGS: 'munyaka_system_settings_v3',
  PAYMENT_RECORDS: 'munyaka_fees_records',
  TRANSACTIONS: 'munyaka_transactions',
  CBC_LEARNING_AREAS: 'munyaka_learning_areas',
  SUBSCRIPTIONS: 'munyaka_subscriptions',
  BILLING_SETTINGS: 'munyaka_billing_settings',
  ATTENDANCE: 'munyaka_attendance_records',
  GRADES: 'munyaka_grades',
  EXAM_TYPES: 'munyaka_exam_types',
  ASSESSMENT_SCORES: 'munyaka_assessment_scores',
  LIBRARY_BOOKS: 'munyaka_library_books',
  ICT_ASSETS: 'munyaka_ict_assets',
  HYDRATION_DONE: 'munyaka_hydration_done',
  SCHEMA_VERSION: 'munyaka_schema_version',
} as const;

export interface Student {
  id: string;
  admissionNo?: string;
  fullName: string;
  grade?: string;
  stream?: string;
  gender?: string;
  assessmentNo?: string;
  [key: string]: any;
}

export type LearnerRecord = Student;

export interface StaffRecord {
  id: string;
  name: string;
  accessCode: string;
  role?: string;
  [key: string]: any;
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
  };
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

export interface HydrationReport {
  hydrated: boolean;
  schemaVersion: string;
  keys: string[];
  restoredFromSeed: string[];
}

/**
 * Generate a short unique ID for records.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Emit a custom event so any subscribed hook recomputes.
 */
export function notifyDataChanged(key?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
    window.dispatchEvent(new Event('storage-updated'));
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('munyaka_storage_update'));
  } catch {
    /* no-op */
  }
}

/**
 * Check if storage is hydrated.
 */
export function isHydrated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HYDRATION_DONE) === 'true';
  } catch {
    return false;
  }
}

/**
 * Hydrate all initial stores if absent.
 */
export function hydrateAllStores(): HydrationReport {
  const report: HydrationReport = {
    hydrated: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    keys: [],
    restoredFromSeed: [],
  };

  try {
    const seedStudents = (INITIAL_SEED_DATA as any)?.students || (INITIAL_SEED_DATA as any)?.learners || [];
    if (seedStudents.length > 0 && !localStorage.getItem('munyaka_app_learners_v1')) {
      localStorage.setItem('munyaka_app_learners_v1', JSON.stringify(seedStudents));
      report.restoredFromSeed.push('munyaka_app_learners_v1');
    }
    report.keys.push('munyaka_app_learners_v1');

    const seedStaff = (INITIAL_SEED_DATA as any)?.staff || [];
    if (seedStaff.length > 0 && !localStorage.getItem(STORAGE_KEYS.STAFF)) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(seedStaff));
      report.restoredFromSeed.push(STORAGE_KEYS.STAFF);
    }
    report.keys.push(STORAGE_KEYS.STAFF);

    localStorage.setItem(STORAGE_KEYS.HYDRATION_DONE, 'true');
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    report.hydrated = true;
  } catch (err) {
    console.error('[storage.ts] hydrateAllStores error:', err);
  }

  return report;
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
  
  const munMatch = trimmed.match(/^MUN[-_]?(\d+)$/);
  if (munMatch) {
    const digits = munMatch[1];
    return `MUN-${digits.padStart(4, '0')}`;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length > 0) {
    return `MUN-${digitsOnly.slice(-4).padStart(4, '0')}`;
  }

  const fallbackNum = 1001 + index;
  return `MUN-${String(fallbackNum).padStart(4, '0')}`;
}

/**
 * Retrieve learners strictly from munyaka_app_learners_v1.
 * Automatically filters out any blank names or records named "Unnamed Learner" (case-insensitive).
 * Returns [] if empty.
 */
export function getLearners(): Student[] {
  try {
    const data = localStorage.getItem('munyaka_app_learners_v1');
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l: any) => {
      if (!l) return false;
      const fn = String(l.fullName || l.name || '').trim();
      if (!fn) return false;
      const lower = fn.toLowerCase();
      return lower !== 'unnamed learner' && lower !== 'unnamed student' && lower !== 'unnamed' && lower !== 'unknown learner';
    });
  } catch (e) {
    return [];
  }
}

/**
 * Save learners strictly to munyaka_app_learners_v1.
 */
export function saveLearners(learners: Student[]): void {
  try {
    const clean = learners.filter((l: any) => {
      if (!l) return false;
      const fn = String(l.fullName || l.name || '').trim();
      if (!fn) return false;
      const lower = fn.toLowerCase();
      return lower !== 'unnamed learner' && lower !== 'unnamed student' && lower !== 'unnamed' && lower !== 'unknown learner';
    });
    localStorage.setItem('munyaka_app_learners_v1', JSON.stringify(clean));
    notifyDataChanged('munyaka_app_learners_v1');
  } catch (err) {
    console.error('[storage.ts] Error saving learners:', err);
  }
}

export function getStoredLearners(): Student[] {
  return getLearners();
}

export function setStoredLearners(learners: Student[]): void {
  saveLearners(learners);
}

export function getStudents(): Student[] {
  return getLearners();
}

export function setStudents(students: Student[]): boolean {
  try {
    saveLearners(students);
    return true;
  } catch {
    return false;
  }
}

export function createStudent(input: Omit<Student, 'id'> & { id?: string }): Student {
  const newStudent: Student = {
    fullName: input.fullName ?? input.name ?? 'Unnamed Student',
    ...input,
    id: input.id ?? generateId('stu'),
  };
  const current = getStudents();
  setStudents([...current, newStudent]);
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

// Learning areas
export function getLearningAreas(): LearningAreaCluster[] {
  const raw = localStorage.getItem(STORAGE_KEYS.CBC_LEARNING_AREAS);
  if (!raw) return buildDefaultClusters() as unknown as LearningAreaCluster[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as unknown as LearningAreaCluster[]) : (buildDefaultClusters() as unknown as LearningAreaCluster[]);
  } catch {
    return buildDefaultClusters() as unknown as LearningAreaCluster[];
  }
}

export function setLearningAreas(areas: LearningAreaCluster[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.CBC_LEARNING_AREAS, JSON.stringify(areas));
    notifyDataChanged(STORAGE_KEYS.CBC_LEARNING_AREAS);
    return true;
  } catch {
    return false;
  }
}

export function createLearningArea(clusterId: string, area: { name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }): boolean {
  const clusters = getLearningAreas();
  const next = clusters.map((c) => {
    if (c.id !== clusterId) return c;
    return {
      ...c,
      learningAreas: [...c.learningAreas, { id: generateId('la'), ...area }],
    };
  });
  return setLearningAreas(next);
}

export function updateLearningArea(clusterId: string, areaId: string, patch: Partial<{ name: string; type: 'Core' | 'Elective'; periodsPerWeek?: number; description?: string }>): boolean {
  const clusters = getLearningAreas();
  const next = clusters.map((c) => {
    if (c.id !== clusterId) return c;
    return {
      ...c,
      learningAreas: c.learningAreas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)),
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

// Payment records
export function getPaymentRecords(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_RECORDS) || localStorage.getItem('munyaka_fees');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPaymentRecords(records: PaymentRecord[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(records));
    notifyDataChanged(STORAGE_KEYS.PAYMENT_RECORDS);
    return true;
  } catch {
    return false;
  }
}

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

// Transactions
export function getTransactions(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setTransactions(txs: PaymentRecord[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    notifyDataChanged(STORAGE_KEYS.TRANSACTIONS);
    return true;
  } catch {
    return false;
  }
}

// User settings
export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS) || localStorage.getItem('munyaka_system_settings');
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function setUserSettings(settings: UserSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    notifyDataChanged(STORAGE_KEYS.USER_SETTINGS);
    return true;
  } catch {
    return false;
  }
}

// Subscriptions
export function getSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setSubscriptions(subs: Subscription[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    notifyDataChanged(STORAGE_KEYS.SUBSCRIPTIONS);
    return true;
  } catch {
    return false;
  }
}

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
    notifyDataChanged(STORAGE_KEYS.STAFF);
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
 * Alias for readStorage
 */
export function lsRead<T>(key: string, fallback: T): T {
  return readStorage<T>(key, fallback);
}

/**
 * Generic localStorage write helper
 */
export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChanged(key);
    return true;
  } catch (err) {
    console.error(`[storage.ts] Failed to write key "${key}":`, err);
    return false;
  }
}

/**
 * Alias for writeStorage
 */
export function lsSet<T>(key: string, value: T): boolean {
  return writeStorage<T>(key, value);
}

/**
 * Safe local storage accessor.
 */
export function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {}
  return null;
}

// Backup & Import helpers
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
    students: safeRead('munyaka_app_learners_v1'),
    staff: safeRead(STORAGE_KEYS.STAFF),
    staffPrereg: safeRead(STORAGE_KEYS.STAFF_PREREG),
    fees: safeRead(STORAGE_KEYS.PAYMENT_RECORDS),
    feeStructures: safeRead('munyaka_fee_structures'),
    transactions: safeRead(STORAGE_KEYS.TRANSACTIONS),
    attendance: safeRead(STORAGE_KEYS.ATTENDANCE),
    grades: safeRead(STORAGE_KEYS.GRADES),
    examTypes: safeRead(STORAGE_KEYS.EXAM_TYPES),
    learningAreas: safeRead(STORAGE_KEYS.CBC_LEARNING_AREAS),
    assessmentScores: safeRead(STORAGE_KEYS.ASSESSMENT_SCORES),
    libraryBooks: safeRead(STORAGE_KEYS.LIBRARY_BOOKS),
    ictAssets: safeRead(STORAGE_KEYS.ICT_ASSETS),
    notices: safeRead('munyaka_notices'),
    userSettings: safeRead(STORAGE_KEYS.USER_SETTINGS),
    subscriptions: safeRead(STORAGE_KEYS.SUBSCRIPTIONS),
    billingSettings: safeRead(STORAGE_KEYS.BILLING_SETTINGS),
  };
}

export interface ImportResult {
  success: boolean;
  keysRestored: string[];
  errors: string[];
}

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
      result.errors.push(`Failed to write "${label}": ${err instanceof Error ? err.message : String(err)}`);
      result.success = false;
    }
  };

  if (backup.students) safeWrite('munyaka_app_learners_v1', backup.students, 'Students');
  if (backup.staff) safeWrite(STORAGE_KEYS.STAFF, backup.staff, 'Staff');
  if (backup.staffPrereg) safeWrite(STORAGE_KEYS.STAFF_PREREG, backup.staffPrereg, 'Staff Pre-registration');
  if (backup.fees) safeWrite(STORAGE_KEYS.PAYMENT_RECORDS, backup.fees, 'Fee Records');
  if (backup.transactions) safeWrite(STORAGE_KEYS.TRANSACTIONS, backup.transactions, 'Transactions');
  if (backup.attendance) safeWrite(STORAGE_KEYS.ATTENDANCE, backup.attendance, 'Attendance');
  if (backup.grades) safeWrite(STORAGE_KEYS.GRADES, backup.grades, 'Grades / Classes');
  if (backup.examTypes) safeWrite(STORAGE_KEYS.EXAM_TYPES, backup.examTypes, 'Exam Types');
  if (backup.learningAreas) safeWrite(STORAGE_KEYS.CBC_LEARNING_AREAS, backup.learningAreas, 'Learning Areas');
  if (backup.assessmentScores) safeWrite(STORAGE_KEYS.ASSESSMENT_SCORES, backup.assessmentScores, 'Assessment Scores');
  if (backup.libraryBooks) safeWrite(STORAGE_KEYS.LIBRARY_BOOKS, backup.libraryBooks, 'Library Books');
  if (backup.ictAssets) safeWrite(STORAGE_KEYS.ICT_ASSETS, backup.ictAssets, 'ICT Assets');
  if (backup.userSettings) safeWrite(STORAGE_KEYS.USER_SETTINGS, backup.userSettings, 'System Settings');
  if (backup.subscriptions) safeWrite(STORAGE_KEYS.SUBSCRIPTIONS, backup.subscriptions, 'Subscriptions');
  if (backup.billingSettings) safeWrite(STORAGE_KEYS.BILLING_SETTINGS, backup.billingSettings, 'Billing Settings');

  if (result.keysRestored.length > 0) {
    notifyDataChanged();
  }
  return result;
}

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
