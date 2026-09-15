import { 
  readStorage, 
  writeStorage, 
  STORAGE_KEYS as PERSISTENT_KEYS,
  Student,
  PaymentRecord,
  UserSettings,
  idbGetAll,
  idbPutMany,
  notifyDataChanged
} from './persistentStore';

// Domain-specific keys that might not be in persistentStore yet
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

/**
 * CentralDataService — Unified data storage gateway.
 *
 * All menu modules (Learners, Staff, Attendance, Finance, Timetable)
 * must route their data mutations and reads through this service.
 * It ensures APK builds and local-first persistence sync pull from a unified state.
 */
export const CentralDataService = {
  // ── Startup Migration Utility ─────────────────────────────────────────────
  /**
   * Automatically scans legacy local storage keys ('students', 'learners', 'registered_students', etc.)
   * and merges any found records into 'munyaka_master_learner_list' without overwriting existing data,
   * deduplicating by ID or admission number.
   */
  runStartupMigration: () => {
    try {
      const legacyKeys = [
        'students',
        'learners',
        'registered_students',
        'munyaka_registered_students',
        'school_learners_data',
        'munyaka_learners_db',
        'pupils',
        'school_students',
        'munyaka_students'
      ];

      const masterKey = STORAGE_KEYS.MASTER_LEARNERS;
      const existingMaster: Student[] = readStorage<Student[]>(masterKey, []);
      const map = new Map<string, Student>();

      // Load existing master records first
      existingMaster.forEach(s => {
        if (s && (s.id || s.admissionNumber || (s as any).admNo || s.name)) {
          const key = String(s.id || s.admissionNumber || (s as any).admNo || s.name).trim().toLowerCase();
          map.set(key, s);
        }
      });

      // Scan legacy keys
      let foundNew = false;
      legacyKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((s: any) => {
                if (s && (s.id || s.admissionNumber || s.admNo || s.name)) {
                  const key = String(s.id || s.admissionNumber || s.admNo || s.name).trim().toLowerCase();
                  if (!map.has(key)) {
                    map.set(key, s);
                    foundNew = true;
                  }
                }
              });
            }
          } catch {
            // ignore parse errors
          }
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
      console.error("[CentralDataService] Startup migration failed:", err);
    }
  },

  // ── Learners ──────────────────────────────────────────────────────────────
  getLearners: (): Student[] => {
    CentralDataService.runStartupMigration();
    const primary = readStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const master = readStorage<Student[]>(STORAGE_KEYS.MASTER_LEARNERS, []);
    const legacy = readStorage<Student[]>(STORAGE_KEYS.STUDENTS_LEGACY, []);
    const combinedMap = new Map<string, Student>();
    
    // Merge all sources into master unified map
    [...master, ...primary, ...legacy].forEach(s => {
      if (s && (s.id || s.admissionNumber || (s as any).admNo || s.name)) {
        const key = String(s.id || s.admissionNumber || (s as any).admNo || s.name).trim().toLowerCase();
        combinedMap.set(key, s);
      }
    });

    const unified = Array.from(combinedMap.values());
    return unified;
  },
  saveLearners: (learners: Student[]) => {
    writeStorage(STORAGE_KEYS.STUDENTS, learners);
    writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, learners);
    writeStorage(STORAGE_KEYS.MASTER_LEARNERS, learners);
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
  },
  // Aliases for compatibility
  getStudents: () => CentralDataService.getLearners(),
  saveStudents: (students: Student[]) => CentralDataService.saveLearners(students),

  // ── Staff ─────────────────────────────────────────────────────────────────
  getStaff: (): StaffRecord[] => readStorage<StaffRecord[]>(STORAGE_KEYS.STAFF, []),
  saveStaff: (staff: StaffRecord[]) => {
    writeStorage(STORAGE_KEYS.STAFF, staff);
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  getAttendance: (): AttendanceRecord[] => readStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []),
  saveAttendance: (records: AttendanceRecord[]) => {
    writeStorage(STORAGE_KEYS.ATTENDANCE, records);
  },
  getStaffAttendance: () => readStorage<any[]>(STORAGE_KEYS.STAFF_ATTENDANCE, []),
  saveStaffAttendance: (records: any[]) => writeStorage(STORAGE_KEYS.STAFF_ATTENDANCE, records),

  // ── Finance ───────────────────────────────────────────────────────────────
  getFees: (): PaymentRecord[] => readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []),
  saveFees: (records: PaymentRecord[]) => writeStorage(STORAGE_KEYS.PAYMENT_RECORDS, records),
  getTransactions: (): PaymentRecord[] => readStorage<PaymentRecord[]>(STORAGE_KEYS.TRANSACTIONS, []),
  saveTransactions: (records: PaymentRecord[]) => writeStorage(STORAGE_KEYS.TRANSACTIONS, records),

  // ── Timetable ─────────────────────────────────────────────────────────────
  getTimetable: () => readStorage<any[]>(STORAGE_KEYS.TIMETABLE, []),
  saveTimetable: (data: any[]) => writeStorage(STORAGE_KEYS.TIMETABLE, data),
  getTimetableGrades: () => readStorage<any[]>(STORAGE_KEYS.TIMETABLE_GRADES, []),
  saveTimetableGrades: (data: any[]) => writeStorage(STORAGE_KEYS.TIMETABLE_GRADES, data),

  // ── Marks & Assessments ───────────────────────────────────────────────────
  getMarks: (): any[] => readStorage<any[]>(STORAGE_KEYS.MARKS, []),
  saveMarks: (marks: any[]) => writeStorage(STORAGE_KEYS.MARKS, marks),

  // ── Term Locking Mechanism ───────────────────────────────────────────────
  getTermLocks: (): Record<string, boolean> => {
    // Default Term 1 and Term 2 to locked/archived so administrators have multiple past terms locked simultaneously
    const locks = readStorage<Record<string, boolean>>('munyaka_term_locks', {
      'term1 2026': true,
      'term2 2026': true,
      'term1 2025': true,
      'term2 2025': true,
      'term3 2025': true,
    });
    return locks;
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

  // ── Generic Access ────────────────────────────────────────────────────────
  getData: <T>(key: string, fallback: T): T => readStorage<T>(key, fallback),
  setData: <T>(key: string, value: T): void => {
    writeStorage(key, value);
  },

  // ── Snapshot & Sync ───────────────────────────────────────────────────────
  /**
   * Generates a full snapshot of all unified storage for APK export or backup.
   */
  generateFullSnapshot: async () => {
    const data: Record<string, any> = {};
    const keys = Object.values(STORAGE_KEYS);
    
    for (const key of keys) {
      data[key] = readStorage(key, null);
    }

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
        { id: 's8', name: 'Staff Member 6', role: 'Support', type: 'Non-Teaching', status: 'Active' }
      ],
      exams: data[STORAGE_KEYS.MARKS] || [],
      libraryBooks: [],
      transactions: data[STORAGE_KEYS.TRANSACTIONS] || []
    };

    return `export const initialSeedData = ${JSON.stringify(exportObject, null, 2)};\n\n(initialSeedData as any).learners = initialSeedData.students;\n\nexport const INITIAL_SEED_DATA = initialSeedData;\nexport const DEFAULT_CBC_CLUSTERS = [];\nexport const buildDefaultClusters = () => [];\nexport const strandCategories = [];\nexport const gradeLevels = [];\nexport const ContentItem = {};\nexport const StrandCategory = {};\nexport const MemoryVerse = {};\nexport const RevisionQuestion = {};\nexport const Attachment = {};\nexport const AssessmentType = {};\nexport const assessmentTypeOptions = [];\n\nexport const mockLearners = initialSeedData.students;\nexport const mockStudents = initialSeedData.students;\nexport const mockStaff = initialSeedData.staff;\nexport const mockExams = initialSeedData.exams;\nexport const mockLibrary = initialSeedData.libraryBooks;\nexport const mockFinances = initialSeedData.transactions;\n\nexport const cbcStudyContent = [];\nexport const cbcStudyMaterials = cbcStudyContent;\nexport const cbcCurriculum = [];\n\nexport default initialSeedData;\n`;
  },

  /**
   * Restores a full snapshot into unified storage.
   */
  restoreSnapshot: async (snapshot: string) => {
    try {
      const data = JSON.parse(snapshot);
      Object.entries(data).forEach(([key, value]) => {
        writeStorage(key, value);
      });
      return true;
    } catch (e) {
      console.error("Failed to restore snapshot", e);
      return false;
    }
  }
};

// Re-export shorthand functions
export const getLearners = CentralDataService.getLearners;
export const saveLearners = CentralDataService.saveLearners;
export const getStudents = CentralDataService.getStudents;
export const saveStudents = CentralDataService.saveStudents;
export const getStaff = CentralDataService.getStaff;
export const saveStaff = CentralDataService.saveStaff;

export default CentralDataService;
