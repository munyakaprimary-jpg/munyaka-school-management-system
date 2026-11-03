// ─────────────────────────────────────────────────────────────────────────────
// Central LocalStorage Management Utility
// ─────────────────────────────────────────────────────────────────────────────

import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { Learner } from '@/types/learners';

export const CURRENT_SCHEMA_VERSION = 'persistent-storage-v1';

export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_app_learners_v1',
  STUDENTS: 'munyaka_app_learners_v1',
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

export interface Student extends Learner {
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

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function notifyDataChanged(key?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('storage-updated'));
    window.dispatchEvent(new Event('students-updated'));
  } catch {
    /* no-op */
  }
}

export function isHydrated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HYDRATION_DONE) === 'true';
  } catch {
    return false;
  }
}

export function lsRead<T = any>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet<T = any>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyDataChanged(key);
  } catch (err) {
    console.error(`[storage.ts] lsSet error for ${key}:`, err);
  }
}

export function readStorage<T = any>(key: string, fallback: T): T {
  return lsRead(key, fallback);
}

export function writeStorage<T = any>(key: string, val: T): void {
  lsSet(key, val);
}

export function getLocalStorage<T = any>(key: string, fallback: T): T {
  return lsRead(key, fallback);
}

export function hydrateAllStores(): HydrationReport {
  const report: HydrationReport = {
    hydrated: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    keys: [],
    restoredFromSeed: [],
  };

  try {
    if (!localStorage.getItem('munyaka_app_learners_v1')) {
      localStorage.setItem('munyaka_app_learners_v1', JSON.stringify([]));
    }
    report.keys.push('munyaka_app_learners_v1');

    localStorage.setItem(STORAGE_KEYS.HYDRATION_DONE, 'true');
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    report.hydrated = true;
  } catch (err) {
    console.error('[storage.ts] hydrateAllStores error:', err);
  }

  return report;
}

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
 * Retrieve learners strictly from munyaka_app_learners_v1 with exact schema fields.
 * Filters out any blank or unnamed learner records. Returns [] if empty.
 */
export function getLearners(): Learner[] {
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
    }).map((l: any) => ({
      id: l.id || `learner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      admissionNo: l.admissionNo || l.admNo || l.admissionNumber || '',
      fullName: l.fullName || l.name || l.studentName || '',
      grade: l.grade || 'Grade 4',
      stream: l.stream || 'Blue',
      guardian: l.guardian || l.parentName || '—',
      phone: l.phone || l.phoneNumber || '+254',
      location: l.location || 'Eldoret',
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Save learners strictly into munyaka_app_learners_v1 without overwriting or reverting.
 */
export function saveLearners(learners: Learner[]): void {
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

export function getStoredLearners(): Learner[] {
  return getLearners();
}

export function setStoredLearners(learners: Learner[]): void {
  saveLearners(learners);
}

export function getStudents(): Learner[] {
  return getLearners();
}

export function setStudents(students: Learner[]): boolean {
  try {
    saveLearners(students);
    return true;
  } catch {
    return false;
  }
}

export function createStudent(input: Omit<Learner, 'id'> & { id?: string }): Learner {
  const newStudent: Learner = {
    id: input.id ?? `learner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    admissionNo: input.admissionNo || '',
    fullName: input.fullName || 'Unnamed Student',
    grade: input.grade || 'Grade 4',
    stream: input.stream || 'Blue',
    guardian: input.guardian || '—',
    phone: input.phone || '+254',
    location: input.location || 'Eldoret',
  };
  const current = getLearners();
  saveLearners([newStudent, ...current]);
  return newStudent;
}

export function updateStudent(id: string, patch: Partial<Learner>): Learner | null {
  const list = getLearners();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Learner = { ...list[idx], ...patch, id };
  const next = [...list];
  next[idx] = updated;
  saveLearners(next);
  return updated;
}

export function deleteStudent(id: string): boolean {
  const list = getLearners();
  const next = list.filter(s => s.id !== id);
  saveLearners(next);
  return true;
}

export function getStoredStaff(): StaffRecord[] {
  return lsRead<StaffRecord[]>(STORAGE_KEYS.STAFF, []);
}

export function getLearningAreas(): LearningAreaCluster[] {
  return lsRead<LearningAreaCluster[]>(STORAGE_KEYS.CBC_LEARNING_AREAS, []);
}

export function setLearningAreas(clusters: LearningAreaCluster[]): void {
  lsSet(STORAGE_KEYS.CBC_LEARNING_AREAS, clusters);
}

export function getPaymentRecords(): PaymentRecord[] {
  return lsRead<PaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []);
}

export function setPaymentRecords(records: PaymentRecord[]): void {
  lsSet(STORAGE_KEYS.PAYMENT_RECORDS, records);
}

export function getTransactions(): any[] {
  return lsRead<any[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function setTransactions(txs: any[]): void {
  lsSet(STORAGE_KEYS.TRANSACTIONS, txs);
}

export function getUserSettings(): UserSettings {
  return lsRead<UserSettings>(STORAGE_KEYS.USER_SETTINGS, {});
}

export function setUserSettings(settings: UserSettings): void {
  lsSet(STORAGE_KEYS.USER_SETTINGS, settings);
}

export function getSubscriptions(): Subscription[] {
  return lsRead<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
}

export function setSubscriptions(subs: Subscription[]): void {
  lsSet(STORAGE_KEYS.SUBSCRIPTIONS, subs);
}

export function exportAllData(): string {
  const backup: Record<string, any> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        backup[key] = JSON.parse(val);
      } catch {
        backup[key] = val;
      }
    }
  }
  return JSON.stringify(backup, null, 2);
}

export function parseAndImportBackup(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data !== 'object' || !data) return false;
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    notifyDataChanged();
    return true;
  } catch {
    return false;
  }
}

export function downloadDatabaseBackup(): void {
  const json = exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `munyaka_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
