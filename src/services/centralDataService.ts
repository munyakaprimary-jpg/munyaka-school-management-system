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
  // ── Learners ──────────────────────────────────────────────────────────────
  getLearners: (): Student[] => readStorage<Student[]>(STORAGE_KEYS.STUDENTS, []),
  saveLearners: (learners: Student[]) => {
    writeStorage(STORAGE_KEYS.STUDENTS, learners);
    writeStorage(STORAGE_KEYS.STUDENTS_LEGACY, learners);
    window.dispatchEvent(new Event('students-updated'));
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

  // ── Settings ──────────────────────────────────────────────────────────────
  getSettings: (): UserSettings => readStorage<UserSettings>(STORAGE_KEYS.USER_SETTINGS, {} as UserSettings),
  saveSettings: (settings: UserSettings) => writeStorage(STORAGE_KEYS.USER_SETTINGS, settings),

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

    return JSON.stringify(data, null, 2);
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
