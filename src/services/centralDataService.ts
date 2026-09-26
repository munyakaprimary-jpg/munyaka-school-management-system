/**
 * centralDataService.ts — Definitive unified data storage service
 * All menus, dashboards, and pages read and write exclusively from this service.
 * Merged with UnifiedDataStorage and CentralDataSyncManager for single unified synchronization.
 */

import { Preferences } from '@capacitor/preferences';
import { initialSeedData } from '@/data/initialSeedData';
import { STORAGE_KEYS as PERSISTENT_KEYS, readStorage, writeStorage, removeStorage, clearAllStorage } from './persistentStore';

export const STORAGE_KEYS = {
  ...PERSISTENT_KEYS,
  MASTER_LEARNERS: 'munyaka_master_learner_list',
  MARKS: 'munyaka_marks_records',
  TIMETABLE: 'school-timetable-data',
  TIMETABLE_GRADES: 'school-timetable-grades',
  STAFF_ATTENDANCE: 'munyaka_staff_attendance',
};

const SERVER_URL_KEY = 'lan_server_url';
const LEGACY_SERVER_URL_KEY = 'munyaka_lan_server_url';
const CENTRAL_DB_STORAGE_KEY = 'munyaka_central_db_cache';

export const getStoredServerUrl = (): string => {
  try {
    const primary = localStorage.getItem(SERVER_URL_KEY);
    if (primary) return primary.trim().replace(/\/+$/, '');
    const legacy = localStorage.getItem(LEGACY_SERVER_URL_KEY);
    if (legacy) {
      localStorage.setItem(SERVER_URL_KEY, legacy);
      localStorage.removeItem(LEGACY_SERVER_URL_KEY);
      return legacy.trim().replace(/\/+$/, '');
    }
  } catch {}
  return 'http://localhost:5000';
};

export const UnifiedDataStorage = {
  get: <T>(key: string, fallback: T): T => {
    return readStorage<T>(key, fallback);
  },

  set: <T>(key: string, value: T): boolean => {
    return writeStorage<T>(key, value);
  },

  remove: (key: string): boolean => {
    return removeStorage(key);
  },

  clearAll: (): void => {
    clearAllStorage();
    localStorage.clear();
    sessionStorage.clear();
    window.dispatchEvent(new Event('munyaka:data-changed'));
  },

  exportFullDatabase: (): any => {
    // Guaranteed full-app aggregator: merges all active store modules and localStorage keys
    const s1 = JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
    const s2 = JSON.parse(localStorage.getItem('munyaka_staff_directory') || '[]');
    const s3 = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || '[]');
    const s4 = JSON.parse(localStorage.getItem('staff') || '[]');
    const masterStaff = [s1, s2, s3, s4, initialSeedData.staff || []].reduce((max, curr) => (Array.isArray(curr) && curr.length > max.length ? curr : max), []);

    const l1 = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
    const l2 = JSON.parse(localStorage.getItem('munyaka_master_learner_list') || '[]');
    const l3 = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
    const masterStudents = [l1, l2, l3, initialSeedData.students || []].reduce((max, curr) => (Array.isArray(curr) && curr.length > max.length ? curr : max), []);

    const f1 = JSON.parse(localStorage.getItem('munyaka_fees_records') || '[]');
    const f2 = JSON.parse(localStorage.getItem('munyaka_fees') || '[]');
    const masterFees = [f1, f2, (initialSeedData as any).fees || []].reduce((max, curr) => (Array.isArray(curr) && curr.length > max.length ? curr : max), []);

    const a1 = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
    const a2 = JSON.parse(localStorage.getItem('munyaka_attendance') || '{}');
    const masterAttendance = Array.isArray(a1) && a1.length > 0 ? a1 : (Object.keys(a2).length > 0 ? a2 : ((initialSeedData as any).attendance || {}));

    const m1 = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
    const m2 = JSON.parse(localStorage.getItem('munyaka_marks_records') || '{}');
    const masterMarks = Array.isArray(m1) && m1.length > 0 ? m1 : (Object.keys(m2).length > 0 ? m2 : ((initialSeedData as any).marks || []));

    const e1 = JSON.parse(localStorage.getItem('all_set_exams') || '[]');
    const masterExams = Array.isArray(e1) && e1.length > 0 ? e1 : ((initialSeedData as any).exams || []);

    const settingsVal = JSON.parse(localStorage.getItem('munyaka_system_settings_v3') || JSON.stringify((initialSeedData as any).settings || {}));

    return {
      students: masterStudents.length > 0 ? masterStudents : (initialSeedData.students || []),
      staff: masterStaff.length > 0 ? masterStaff : (initialSeedData.staff || []),
      attendance: masterAttendance,
      fees: masterFees,
      payments: masterFees,
      transactions: JSON.parse(localStorage.getItem('munyaka_transactions') || '[]'),
      marks: masterMarks,
      exams: masterExams,
      grades: JSON.parse(localStorage.getItem('munyaka_grades') || JSON.stringify((initialSeedData as any).grades || {})),
      streams: JSON.parse(localStorage.getItem('munyaka_streams') || JSON.stringify((initialSeedData as any).streams || [])),
      classAssignments: JSON.parse(localStorage.getItem('munyaka_class_assignments') || JSON.stringify((initialSeedData as any).classAssignments || [])),
      learningAreas: JSON.parse(localStorage.getItem('munyaka_learning_areas') || JSON.stringify((initialSeedData as any).learningAreas || [])),
      examTypes: JSON.parse(localStorage.getItem('munyaka_exam_types') || JSON.stringify((initialSeedData as any).examTypes || [])),
      libraryBooks: JSON.parse(localStorage.getItem('munyaka_library_books') || JSON.stringify((initialSeedData as any).libraryBooks || [])),
      feeStructures: JSON.parse(localStorage.getItem('munyaka_fee_structures') || JSON.stringify((initialSeedData as any).feeStructures || [])),
      notices: JSON.parse(localStorage.getItem('munyaka_notices') || JSON.stringify((initialSeedData as any).notices || [])),
      ictEquipment: JSON.parse(localStorage.getItem('munyaka_ict_assets') || JSON.stringify((initialSeedData as any).ictEquipment || [])),
      scienceInventory: JSON.parse(localStorage.getItem('munyaka_science_lab') || JSON.stringify((initialSeedData as any).scienceInventory || [])),
      storeInventory: JSON.parse(localStorage.getItem('munyaka_store_items') || JSON.stringify((initialSeedData as any).storeInventory || [])),
      timetable: JSON.parse(localStorage.getItem('school-timetable-data') || JSON.stringify((initialSeedData as any).timetable || [])),
      settings: settingsVal,
    };
  },

  getStaff: (): any[] => {
    if (localStorage.getItem('munyaka_staff_cleared_explicitly') === 'true') {
      return [];
    }
    
    const primary = readStorage<any[]>(STORAGE_KEYS.STAFF, []);
    const directory = readStorage<any[]>('munyaka_staff_directory', []);
    const master = readStorage<any[]>('munyaka_master_staff_list', []);

    const combined = [...primary, ...directory, ...master];
    if (combined.length === 0) {
      return initialSeedData.staff || [];
    }

    const map = new Map<string, any>();
    combined.forEach(s => {
      if (s && (s.id || s.email || s.name || s.staffId)) {
        const key = String(s.id || s.email || s.name || s.staffId).trim().toLowerCase();
        map.set(key, s);
      }
    });

    const res = Array.from(map.values());
    return res.length > 0 ? res : (initialSeedData.staff || []);
  },

  saveStaff: (staffList: any[]): boolean => {
    if (staffList.length > 0) {
      localStorage.removeItem('munyaka_staff_cleared_explicitly');
    } else {
      localStorage.setItem('munyaka_staff_cleared_explicitly', 'true');
    }
    writeStorage(STORAGE_KEYS.STAFF, staffList);
    writeStorage('munyaka_staff_directory', staffList);
    writeStorage('munyaka_master_staff_list', staffList);

    try {
      const centralRaw = localStorage.getItem('munyaka_central_db') || '{}';
      const db = JSON.parse(centralRaw);
      db.staff = staffList;
      localStorage.setItem('munyaka_central_db', JSON.stringify(db));
    } catch {}

    CentralDataService.persistAndSyncMutation('staff', staffList);

    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    return true;
  },

  addStaff: (record: any): any => {
    localStorage.removeItem('munyaka_staff_cleared_explicitly');
    const staff = UnifiedDataStorage.getStaff();
    const id = record.id || `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const staffId = record.staffId || record.staff_id || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempAccessCode = record.tempAccessCode || record.access_key || record.ref || String(Math.floor(100000 + Math.random() * 900000));
    const joined = record.joined || record.joinedDate || new Date().toISOString().slice(0, 10);
    const name = record.name || record.full_name || 'New Staff';
    const role = record.role || 'Subject Teacher';
    const status = record.status || 'Pre-Registered';

    const newRecord = {
      ...record,
      id,
      name,
      full_name: name,
      role,
      status,
      staffId,
      tempAccessCode,
      joined,
    };

    staff.push(newRecord);
    UnifiedDataStorage.saveStaff(staff);
    return newRecord;
  },

  updateStaff: (id: string, updates: any): void => {
    const staff = UnifiedDataStorage.getStaff();
    const index = staff.findIndex(s => s.id === id);
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updates };
      UnifiedDataStorage.saveStaff(staff);
    }
  },

  deleteStaff: (id: string): void => {
    const staff = UnifiedDataStorage.getStaff();
    const filtered = staff.filter(s => s.id !== id);
    UnifiedDataStorage.saveStaff(filtered);
  },

  clearStaff: (): void => {
    localStorage.setItem('munyaka_staff_cleared_explicitly', 'true');
    writeStorage(STORAGE_KEYS.STAFF, []);
    writeStorage('munyaka_staff_directory', []);
    writeStorage('munyaka_master_staff_list', []);
    writeStorage('munyaka_staff_prereg', []);
    writeStorage('munyaka_teachers', []);
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db') || '{}';
      const db = JSON.parse(centralRaw);
      db.staff = [];
      localStorage.setItem('munyaka_central_db', JSON.stringify(db));
    } catch {}

    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
  },

  getLearners: (): any[] => {
    const primary = readStorage<any[]>('school_learners_data', []);
    const master = readStorage<any[]>('munyaka_master_learner_list', []);
    const legacy = readStorage<any[]>('munyaka_students', []);

    const map = new Map<string, any>();
    [...master, ...primary, ...legacy].forEach(s => {
      if (s && (s.id || s.admissionNumber || s.admNo || s.name)) {
        const key = String(s.id || s.admissionNumber || s.admNo || s.name).trim().toLowerCase();
        map.set(key, s);
      }
    });

    return Array.from(map.values());
  },

  saveLearners: (learners: any[]): boolean => {
    writeStorage('school_learners_data', learners);
    writeStorage('munyaka_students', learners);
    writeStorage('munyaka_master_learner_list', learners);

    CentralDataService.persistAndSyncMutation('students', learners);

    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    return true;
  },

  getFees: (): any[] => readStorage<any[]>('munyaka_fees_records', []),
  saveFees: (records: any[]): boolean => {
    writeStorage('munyaka_fees_records', records);
    CentralDataService.persistAndSyncMutation('fees', records);
    return true;
  },

  getAttendance: (): any[] => readStorage<any[]>('munyaka_attendance_records', []),
  saveAttendance: (records: any[]): boolean => {
    writeStorage('munyaka_attendance_records', records);
    CentralDataService.persistAndSyncMutation('attendance', records);
    return true;
  },
};

export const CentralDataService = {
  getLearners: () => UnifiedDataStorage.getLearners(),
  saveLearners: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  getStudents: () => UnifiedDataStorage.getLearners(),
  saveStudents: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  
  getStaff: () => UnifiedDataStorage.getStaff(),
  saveStaff: (staff: any[]) => {
    const list = (staff && staff.length > 0) ? staff : (initialSeedData.staff || []);
    UnifiedDataStorage.saveStaff(list);
  },
  addStaff: (record: any) => UnifiedDataStorage.addStaff(record),
  updateStaff: (id: string, updates: any) => UnifiedDataStorage.updateStaff(id, updates),
  deleteStaff: (id: string) => UnifiedDataStorage.deleteStaff(id),
  clearStaff: () => {
    UnifiedDataStorage.clearStaff();
    localStorage.removeItem('munyaka_staff_directory');
    localStorage.removeItem('munyaka_master_staff_list');
    localStorage.removeItem('munyaka_staff');
    localStorage.removeItem('munyaka_staff_prereg');
    localStorage.removeItem('munyaka_teachers');
    localStorage.setItem('munyaka_staff_cleared_explicitly', 'true');
  },

  getAttendance: () => UnifiedDataStorage.getAttendance(),
  saveAttendance: (records: any[]) => UnifiedDataStorage.saveAttendance(records),
  
  getFees: () => UnifiedDataStorage.getFees(),
  saveFees: (records: any[]) => UnifiedDataStorage.saveFees(records),
  getTransactions: () => UnifiedDataStorage.getFees(),
  saveTransactions: (records: any[]) => UnifiedDataStorage.saveFees(records),

  getData: <T>(key: string, fallback: T): T => UnifiedDataStorage.get<T>(key, fallback),
  setData: <T>(key: string, value: T): void => { UnifiedDataStorage.set(key, value); },

  getFullStateDump: (): any => {
    return UnifiedDataStorage.exportFullDatabase();
  },

  importCentralData: async (snapshotData: any): Promise<boolean> => {
    try {
      const data = typeof snapshotData === 'string' ? JSON.parse(snapshotData) : snapshotData;
      if (!data || typeof data !== 'object') return false;

      if (data.students) UnifiedDataStorage.saveLearners(data.students);
      if (data.staff) UnifiedDataStorage.saveStaff(data.staff);
      if (data.attendance) UnifiedDataStorage.saveAttendance(data.attendance);
      if (data.fees) UnifiedDataStorage.saveFees(data.fees);
      if (data.marks) UnifiedDataStorage.set(STORAGE_KEYS.MARKS, data.marks);
      if (data.grades) UnifiedDataStorage.set('munyaka_grades', data.grades);
      if (data.examTypes) UnifiedDataStorage.set('munyaka_exam_types', data.examTypes);
      if (data.libraryBooks) UnifiedDataStorage.set('munyaka_library_books', data.libraryBooks);
      if (data.feeStructures) UnifiedDataStorage.set('munyaka_fee_structures', data.feeStructures);
      if (data.notices) UnifiedDataStorage.set('munyaka_notices', data.notices);
      if (data.settings) UnifiedDataStorage.set('munyaka_system_settings_v3', data.settings);

      localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(data));
      try {
        await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(data) });
      } catch {}

      window.dispatchEvent(new Event('munyaka:data-changed'));
      window.dispatchEvent(new Event('staff-changed'));
      window.dispatchEvent(new Event('students-updated'));
      return true;
    } catch (err) {
      console.error('[CentralDataService] importCentralData failed:', err);
      return false;
    }
  },

  generateFullSnapshot: async () => {
    const backup = CentralDataService.getFullStateDump();
    return JSON.stringify(backup, null, 2);
  },

  exportCentralData: (): any => {
    const db = CentralDataService.getFullStateDump();
    if (!db.staff || db.staff.length === 0) {
      db.staff = initialSeedData.staff || [];
    }
    return db;
  },

  isTermLocked: (termKey: string): boolean => {
    const locked = UnifiedDataStorage.get<Record<string, boolean>>('munyaka_locked_terms_map', {});
    if (locked[termKey]) return true;
    const legacy = UnifiedDataStorage.get<string[]>('munyaka_archived_terms', []);
    return legacy.includes(termKey);
  },

  getMarks: (examId?: string): any => {
    const records = UnifiedDataStorage.get<any>(STORAGE_KEYS.MARKS, {});
    if (examId) return records[examId] || {};
    return records;
  },

  saveMarks: (records: any): void => {
    UnifiedDataStorage.set(STORAGE_KEYS.MARKS, records);
  },
  
  restoreSnapshot: async (snapshot: string) => {
    return await CentralDataService.importCentralData(snapshot);
  },

  async fetchRemoteDump(): Promise<any | null> {
    const serverUrl = getStoredServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${serverUrl}/api/central-db/dump`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      console.warn('[CentralDataService] Offline or server unreachable, falling back to local storage.');
    }
    return null;
  },

  async syncBatchToRemote(batchPayload: Record<string, any>): Promise<boolean> {
    const serverUrl = getStoredServerUrl();
    try {
      const res = await fetch(`${serverUrl}/api/central-db/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload)
      });
      if (res.ok) {
        const json = await res.json();
        return json && json.success === true;
      }
    } catch (err) {
      console.error('[CentralDataService] Failed to sync batch to remote server:', err);
    }
    return false;
  },

  async initializeAndHydrate(): Promise<void> {
    const remoteData = await this.fetchRemoteDump();
    if (remoteData) {
      localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(remoteData));
      try {
        await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(remoteData) });
      } catch {}

      if (remoteData.students) {
        localStorage.setItem('munyaka_students', JSON.stringify(remoteData.students));
        localStorage.setItem('school_learners_data', JSON.stringify(remoteData.students));
      }
      if (remoteData.staff) {
        localStorage.setItem('munyaka_staff', JSON.stringify(remoteData.staff));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(remoteData.staff));
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify(remoteData.staff));
      }
      if (remoteData.fees) {
        localStorage.setItem('munyaka_fees_records', JSON.stringify(remoteData.fees));
        localStorage.setItem('munyaka_student_fees', JSON.stringify(remoteData.fees));
      }
      if (remoteData.attendance) {
        localStorage.setItem('munyaka_attendance', JSON.stringify(remoteData.attendance));
      }
      if (remoteData.grades) {
        localStorage.setItem('munyaka_grades', JSON.stringify(remoteData.grades));
      }
      if (remoteData.examTypes) {
        localStorage.setItem('munyaka_exam_types', JSON.stringify(remoteData.examTypes));
      }
      if (remoteData.libraryBooks) {
        localStorage.setItem('munyaka_library_books', JSON.stringify(remoteData.libraryBooks));
      }
      if (remoteData.feeStructures) {
        localStorage.setItem('munyaka_fee_structures', JSON.stringify(remoteData.feeStructures));
      }
      if (remoteData.notices) {
        localStorage.setItem('munyaka_notices', JSON.stringify(remoteData.notices));
      }
      if (remoteData.settings) {
        localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(remoteData.settings));
      }
      console.log('[CentralDataService] Successfully hydrated local state from remote munyaka_central_db dump.');
      return;
    }

    const localCache = localStorage.getItem(CENTRAL_DB_STORAGE_KEY);
    if (localCache) {
      try {
        const parsed = JSON.parse(localCache);
        if (parsed && typeof parsed === 'object') {
          console.log('[CentralDataService] Loaded state from local cache.');
          return;
        }
      } catch {}
    }

    console.log('[CentralDataService] Initializing from initialSeedData.ts fallback.');
    const fallbackDb = {
      students: initialSeedData.students || [],
      staff: initialSeedData.staff || [],
      attendance: (initialSeedData as any).attendance || {},
      fees: (initialSeedData as any).fees || [],
      grades: (initialSeedData as any).grades || {},
      examTypes: (initialSeedData as any).examTypes || [],
      libraryBooks: (initialSeedData as any).libraryBooks || [],
      feeStructures: (initialSeedData as any).feeStructures || [],
      notices: (initialSeedData as any).notices || [],
      settings: (initialSeedData as any).settings || {}
    };

    localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(fallbackDb));
    try {
      await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(fallbackDb) });
    } catch {}
  },

  async persistAndSyncMutation(key: string, data: any): Promise<void> {
    try {
      const cacheRaw = localStorage.getItem(CENTRAL_DB_STORAGE_KEY) || '{}';
      const db = JSON.parse(cacheRaw);
      db[key] = data;
      localStorage.setItem(CENTRAL_DB_STORAGE_KEY, JSON.stringify(db));
      try {
        await Preferences.set({ key: CENTRAL_DB_STORAGE_KEY, value: JSON.stringify(db) });
      } catch {}
    } catch {}

    setTimeout(async () => {
      await CentralDataService.syncBatchToRemote({ [key]: data });
    }, 50);
  }
};

export const CentralDataSyncManager = {
  fetchRemoteDump: () => CentralDataService.fetchRemoteDump(),
  syncBatchToRemote: (batchPayload: Record<string, any>) => CentralDataService.syncBatchToRemote(batchPayload),
  initializeAndHydrate: () => CentralDataService.initializeAndHydrate(),
  persistAndSyncMutation: (key: string, data: any) => CentralDataService.persistAndSyncMutation(key, data)
};

export const getLearners = CentralDataService.getLearners;
export const saveLearners = CentralDataService.saveLearners;
export const getStudents = CentralDataService.getStudents;
export const saveStudents = CentralDataService.saveStudents;
export const getStaff = CentralDataService.getStaff;
export const saveStaff = CentralDataService.saveStaff;

export default CentralDataService;
