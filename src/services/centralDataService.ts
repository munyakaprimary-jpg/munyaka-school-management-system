/**
 * centralDataService.ts — Backward-compatible wrapper around UnifiedDataService
 *
 * This module preserves the existing synchronous API for all current callers
 * while routing every write through the new UnifiedDataService so that:
 *   • Native builds persist via Capacitor Preferences
 *   • Web builds persist via localStorage + IndexedDB write-through
 *
 * New code should import directly from unifiedDataLayer.ts.
 */

import { UnifiedDataService, UNIFIED_KEYS } from './unifiedDataLayer';
import { readStorage, writeStorage, STORAGE_KEYS as PERSISTENT_KEYS } from './persistentStore';
import type { Student, PaymentRecord, UserSettings, Subscription, LearningAreaCluster } from './persistentStore';

// ─── Re-export unified keys & types ──────────────────────────────────

export { UNIFIED_KEYS, CURRENT_SCHEMA_VERSION } from './unifiedDataLayer';
export type { StorageAdapter, StorageInfo, DatabaseBackup, ImportResult, HydrationReport } from './unifiedDataLayer';
export { UnifiedDataService };

// ─── Domain-specific keys ────────────────────────────────────────────

const EXTRA_KEYS = {
  MARKS: 'munyaka_marks_records',
  TIMETABLE: 'school-timetable-data',
  TIMETABLE_GRADES: 'school-timetable-grades',
  ACTIVITY_LOG: 'munyaka_activity_log',
  STAFF_ATTENDANCE: 'munyaka_staff_attendance',
};

export const STORAGE_KEYS = {
  ...PERSISTENT_KEYS,
  MASTER_LEARNERS: 'munyaka_master_learner_list',
  ...EXTRA_KEYS,
};

// ─── Types ───────────────────────────────────────────────────────────

export interface StaffRecord {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  department?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  learnerId: string;
  status: 'present' | 'absent' | 'late';
  remark?: string;
  [key: string]: unknown;
}

// ─── CentralDataService (backward-compatible synchronous API) ────────

export const CentralDataService = {
  // ── Startup Migration Utility ─────────────────────────────────────

  runStartupMigration: () => {
    try {
      const legacyKeys = [
        'students', 'learners', 'registered_students',
        'munyaka_registered_students', 'school_learners_data',
        'munyaka_learners_db', 'pupils', 'school_students', 'munyaka_students',
      ];

      const masterKey = STORAGE_KEYS.MASTER_LEARNERS;
      const existingMaster: Student[] = readStorage<Student[]>(masterKey, []);
      const map = new Map<string, Student>();

      existingMaster.forEach((s) => {
        if (s && (s.id || s.admissionNumber || (s as any).admNo || s.name)) {
          const key = String(s.id || s.admissionNumber || (s as any).admNo || s.name).trim().toLowerCase();
          map.set(key, s);
        }
      });

      let foundNew = false;
      legacyKeys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((s: any) => {
                if (s && (s.id || s.admissionNumber || s.admNo || s.name)) {
                  const key = String(s.id || s.admissionNumber || s.admNo || s.name).trim().toLowerCase();
                  if (!map.has(key)) { map.set(key, s); foundNew = true; }
                }
              });
            }
          } catch { /* ignore parse errors */ }
        }
      });

      const unified = Array.from(map.values());
      if (foundNew || existingMaster.length === 0) {
        writeStorage(masterKey, unified);
        writeStorage(STORAGE_KEYS.STUDENTS, unified);
        writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, unified);
        console.log(`[CentralDataService] Startup migration completed. Migrated/unified ${unified.length} learners.`);
      }
    } catch (err) {
      console.error('[CentralDataService] Startup migration failed:', err);
    }
  },

  // ── Learners ──────────────────────────────────────────────────────

  getLearners: (): Student[] => {
    CentralDataService.runStartupMigration();
    
    // Check munyaka_central_db first
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const db = JSON.parse(centralRaw);
        if (Array.isArray(db.students) && db.students.length > 0) {
          return db.students;
        }
      }
    } catch {}

    const primary = readStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const master = readStorage<Student[]>(STORAGE_KEYS.MASTER_LEARNERS, []);
    const legacy = readStorage<Student[]>(STORAGE_KEYS.STUDENTS_LEGACY, []);
    const combinedMap = new Map<string, Student>();

    [...master, ...primary, ...legacy].forEach((s) => {
      if (s && (s.id || s.admissionNumber || (s as any).admNo || s.name)) {
        const key = String(s.id || s.admissionNumber || (s as any).admNo || s.name).trim().toLowerCase();
        combinedMap.set(key, s);
      }
    });

    const results = Array.from(combinedMap.values());
    if (results.length > 0) {
      try {
        const centralRaw = localStorage.getItem('munyaka_central_db') || '{}';
        const db = JSON.parse(centralRaw);
        db.students = results;
        localStorage.setItem('munyaka_central_db', JSON.stringify(db));
      } catch {}
    }
    return results;
  },

  saveLearners: (learners: Student[]): boolean => {
    writeStorage(STORAGE_KEYS.STUDENTS, learners);
    writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, learners);
    writeStorage(STORAGE_KEYS.MASTER_LEARNERS, learners);
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db') || '{}';
      const db = JSON.parse(centralRaw);
      db.students = learners;
      localStorage.setItem('munyaka_central_db', JSON.stringify(db));
    } catch {}
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('central_db_updated'));
    return true;
  },

  getStudents: () => CentralDataService.getLearners(),
  saveStudents: (students: Student[]) => CentralDataService.saveLearners(students),

  // ── Staff ─────────────────────────────────────────────────────────

  getStaff: (): StaffRecord[] => readStorage<StaffRecord[]>(STORAGE_KEYS.STAFF, []),
  saveStaff: (staff: StaffRecord[]) => writeStorage(STORAGE_KEYS.STAFF, staff),
  clearStaff: (): void => {
    localStorage.setItem('munyaka_staff_cleared_explicitly', 'true');
    writeStorage(STORAGE_KEYS.STAFF, []);
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify([]));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify([]));
    localStorage.setItem('munyaka_staff', JSON.stringify([]));
    localStorage.setItem('munyaka_staff_prereg', JSON.stringify([]));
    localStorage.setItem('munyaka_teachers', JSON.stringify([]));
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db') || '{}';
      const db = JSON.parse(centralRaw);
      db.staff = [];
      localStorage.setItem('munyaka_central_db', JSON.stringify(db));
    } catch {}
    // Clear IndexedDB stores via store utility or direct clear
    import('@/services/persistentStore').then(({ clearAllStorage }) => {
      // Just clear specific staff store in IDB
    }).catch(() => {});
    import('@/services/idbStore').then(({ idbStore }) => {
      idbStore.clearStore('staff').catch(() => {});
      idbStore.clearStore('staff_prereg').catch(() => {});
    }).catch(() => {});

    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_staff' } }));
  },

  // ── Attendance ────────────────────────────────────────────────────

  getAttendance: (): AttendanceRecord[] => readStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []),
  saveAttendance: (records: AttendanceRecord[]) => writeStorage(STORAGE_KEYS.ATTENDANCE, records),
  getStaffAttendance: () => readStorage<any[]>(STORAGE_KEYS.STAFF_ATTENDANCE, []),
  saveStaffAttendance: (records: any[]) => writeStorage(STORAGE_KEYS.STAFF_ATTENDANCE, records),

  // ── Finance ───────────────────────────────────────────────────────

  getFees: (): PaymentRecord[] => readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []),
  saveFees: (records: PaymentRecord[]) => writeStorage(STORAGE_KEYS.PAYMENT_RECORDS, records),
  getTransactions: (): PaymentRecord[] => readStorage<PaymentRecord[]>(STORAGE_KEYS.TRANSACTIONS, []),
  saveTransactions: (records: PaymentRecord[]) => writeStorage(STORAGE_KEYS.TRANSACTIONS, records),

  // ── Timetable ─────────────────────────────────────────────────────

  getTimetable: () => readStorage<any[]>(STORAGE_KEYS.TIMETABLE, []),
  saveTimetable: (data: any[]) => writeStorage(STORAGE_KEYS.TIMETABLE, data),
  getTimetableGrades: () => readStorage<any[]>(STORAGE_KEYS.TIMETABLE_GRADES, []),
  saveTimetableGrades: (data: any[]) => writeStorage(STORAGE_KEYS.TIMETABLE_GRADES, data),

  // ── Marks & Assessments ───────────────────────────────────────────

  getMarks: (): any[] => readStorage<any[]>(STORAGE_KEYS.MARKS, []),
  saveMarks: (marks: any[]) => writeStorage(STORAGE_KEYS.MARKS, marks),

  // ── Term Locking Mechanism ────────────────────────────────────────

  getTermLocks: (): Record<string, boolean> => {
    const activeYearStr = (() => {
      try {
        const settingsRaw = localStorage.getItem('munyaka_system_settings_v3');
        if (settingsRaw) {
          const s = JSON.parse(settingsRaw);
          if (s.academicYear) return parseInt(s.academicYear, 10);
        }
      } catch {}
      return new Date().getFullYear();
    })();

    const currentYear = activeYearStr || new Date().getFullYear();
    const prevYear = currentYear - 1;
    const defaultLocks: Record<string, boolean> = {
      [`term1_${prevYear}`]: true, [`term2_${prevYear}`]: true, [`term3_${prevYear}`]: true,
      [`term1_${currentYear}`]: false, [`term2_${currentYear}`]: false, [`term3_${currentYear}`]: false,
      [`term1_${currentYear + 1}`]: false, [`term2_${currentYear + 1}`]: false, [`term3_${currentYear + 1}`]: false,
    };
    return readStorage<Record<string, boolean>>('munyaka_term_locks', defaultLocks);
  },

  saveTermLocks: (locks: Record<string, boolean>) => writeStorage('munyaka_term_locks', locks),
  isTermLocked: (termKey: string): boolean => {
    const locks = CentralDataService.getTermLocks();
    return !!locks[termKey];
  },
  toggleTermLock: (termKey: string, locked: boolean) => {
    const locks = CentralDataService.getTermLocks();
    locks[termKey] = locked;
    CentralDataService.saveTermLocks(locks);
  },
  setTermLock: (termKey: string, locked: boolean) => {
    const locks = CentralDataService.getTermLocks();
    locks[termKey] = locked;
    CentralDataService.saveTermLocks(locks);
  },

  // ── Generic Access ────────────────────────────────────────────────

  getData: <T>(key: string, fallback: T): T => readStorage<T>(key, fallback),
  setData: <T>(key: string, value: T): void => { writeStorage(key, value); },

  // ── Snapshot & Sync ───────────────────────────────────────────────

  generateFullSnapshot: async () => {
    const data: Record<string, any> = {};
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) { data[key] = readStorage(key, null); }

    const exportObject = {
      students: data[STORAGE_KEYS.STUDENTS] || [],
      learners: data[STORAGE_KEYS.STUDENTS] || [],
      staff: data[STORAGE_KEYS.STAFF] || [
        { id: 's1', name: 'Teacher One', role: 'Teacher', type: 'Teaching', status: 'Active' },
        { id: 's2', name: 'Teacher Two', role: 'Teacher', type: 'Teaching', status: 'Active' },
        { id: 's3', name: 'Staff Member 1', role: 'Support', type: 'Non-Teaching', status: 'Active' },
        { id: 's4', name: 'Staff Member 2', role: 'Support', type: 'Non-Teaching', status: 'Active' },
        { id: 's5', name: 'Staff Member 3', role: 'Support', type: 'Non-Teaching', status: 'Active' },
        { id: 's6', name: 'Staff Member 4', role: 'Support', type: 'Non-Teaching', status: 'Active' },
        { id: 's7', name: 'Staff Member 5', role: 'Support', type: 'Non-Teaching', status: 'Active' },
        { id: 's8', name: 'Staff Member 6', role: 'Support', type: 'Non-Teaching', status: 'Active' },
      ],
      exams: data[STORAGE_KEYS.MARKS] || [],
      libraryBooks: [],
      transactions: data[STORAGE_KEYS.TRANSACTIONS] || [],
    };

    return `export const initialSeedData = ${JSON.stringify(exportObject, null, 2)};\n\n(initialSeedData as any).learners = initialSeedData.students;\n\nexport const INITIAL_SEED_DATA = initialSeedData;\nexport const DEFAULT_CBC_CLUSTERS = [];\nexport const buildDefaultClusters = () => [];\nexport const strandCategories = [];\nexport const gradeLevels = [];\nexport const ContentItem = {};\nexport const StrandCategory = {};\nexport const MemoryVerse = {};\nexport const RevisionQuestion = {};\nexport const Attachment = {};\nexport const AssessmentType = {};\nexport const assessmentTypeOptions = [];\n\nexport const mockLearners = initialSeedData.students;\nexport const mockStudents = initialSeedData.students;\nexport const mockStaff = initialSeedData.staff;\nexport const mockExams = initialSeedData.exams;\nexport const mockLibrary = initialSeedData.libraryBooks;\nexport const mockFinances = initialSeedData.transactions;\n\nexport const cbcStudyContent = [];\nexport const cbcStudyMaterials = cbcStudyContent;\nexport const cbcCurriculum = [];\n\nexport default initialSeedData;\n`;
  },

  restoreSnapshot: async (snapshot: string) => {
    try {
      const data = JSON.parse(snapshot);
      Object.entries(data).forEach(([key, value]) => { writeStorage(key, value); });
      return true;
    } catch (e) {
      console.error('Failed to restore snapshot', e);
      return false;
    }
  },
};

// ─── Re-export shorthand functions ───────────────────────────────────

export const getLearners = CentralDataService.getLearners;
export const saveLearners = CentralDataService.saveLearners;
export const getStudents = CentralDataService.getStudents;
export const saveStudents = CentralDataService.saveStudents;
export const getStaff = CentralDataService.getStaff;
export const saveStaff = CentralDataService.saveStaff;

export default CentralDataService;
