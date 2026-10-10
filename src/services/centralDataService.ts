/**
 * centralDataService.ts — Definitive unified data storage service
 * All menus, dashboards, and pages read and write exclusively from this service.
 * Merged with UnifiedDataStorage and CentralDataSyncManager for single unified synchronization.
 */

import { getApiBaseUrl } from '@/lib/apiBase';
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

const CENTRAL_DB_STORAGE_KEY = 'munyaka_central_db_cache';

// Hard circuit breaker flag: once any network failure occurs, disable all automatic remote sync completely until reload
let hardOfflineMode = false;

export const getStoredServerUrl = (): string => {
  return getApiBaseUrl();
};

export const UnifiedDataStorage = {
  get: <T>(key: string, fallback: T): T => {
    return readStorage<T>(key, fallback);
  },
  set: <T>(key: string, value: T): void => {
    writeStorage<T>(key, value);
  },
  remove: (key: string): void => {
    removeStorage(key);
  },
  clear: (): void => {
    clearAllStorage();
  },

  getLearners: (): any[] => {
    const list = readStorage<any[]>('munyaka_students', []);
    if (Array.isArray(list) && list.length > 0) return list;
    const fallback = readStorage<any[]>('school_learners_data', []);
    if (Array.isArray(fallback) && fallback.length > 0) return fallback;
    return initialSeedData.students || [];
  },

  saveLearners: (learners: any[]): void => {
    const list = Array.isArray(learners) ? learners : [];
    writeStorage('munyaka_students', list);
    writeStorage('school_learners_data', list);
    CentralDataService.persistAndSyncMutation('students', list);
  },

  getStaff: (): any[] => {
    const list = readStorage<any[]>('munyaka_staff', []);
    if (Array.isArray(list) && list.length > 0) return list;
    const dir = readStorage<any[]>('munyaka_staff_directory', []);
    if (Array.isArray(dir) && dir.length > 0) return dir;
    return readStorage<any[]>('munyaka_master_staff_list', []);
  },

  saveStaff: (staff: any[]): void => {
    const list = Array.isArray(staff) ? staff : [];
    writeStorage('munyaka_staff', list);
    writeStorage('munyaka_staff_directory', list);
    writeStorage('munyaka_master_staff_list', list);
    CentralDataService.persistAndSyncMutation('staff', list);
  },

  addStaff: (record: any): any => {
    const staff = UnifiedDataStorage.getStaff();
    const newRecord = { id: record.id || 'staff_' + Date.now() + Math.random().toString(36).substr(2, 5), ...record };
    const updated = [newRecord, ...staff];
    UnifiedDataStorage.saveStaff(updated);
    return newRecord;
  },

  updateStaff: (id: string, updates: any): void => {
    const staff = UnifiedDataStorage.getStaff();
    const updated = staff.map(s => (s.id === id ? { ...s, ...updates } : s));
    UnifiedDataStorage.saveStaff(updated);
  },

  deleteStaff: (id: string): void => {
    const staff = UnifiedDataStorage.getStaff();
    const updated = staff.filter(s => s.id !== id);
    UnifiedDataStorage.saveStaff(updated);
  },

  clearStaff: (): void => {
    removeStorage('munyaka_staff');
    removeStorage('munyaka_staff_directory');
    removeStorage('munyaka_master_staff_list');
    removeStorage('munyaka_staff_prereg');
    removeStorage('munyaka_teachers');
    removeStorage('munyaka_staff_db');
    try {
      localStorage.removeItem('munyaka_staff');
      localStorage.removeItem('munyaka_staff_directory');
      localStorage.removeItem('munyaka_master_staff_list');
      localStorage.removeItem('munyaka_staff_prereg');
      localStorage.removeItem('munyaka_teachers');
      localStorage.removeItem('munyaka_staff_db');
    } catch {}
  },

  getAttendance: (): any[] => {
    return readStorage<any[]>('munyaka_attendance', []);
  },

  saveAttendance: (records: any[]): void => {
    writeStorage('munyaka_attendance', records);
    CentralDataService.persistAndSyncMutation('attendance', records);
  },

  getFees: (): any[] => {
    return readStorage<any[]>('munyaka_fees', []);
  },

  saveFees: (records: any[]): void => {
    writeStorage('munyaka_fees', records);
    CentralDataService.persistAndSyncMutation('fees', records);
  },

  exportFullDatabase: (): Record<string, any> => {
    return {
      students: UnifiedDataStorage.getLearners(),
      staff: UnifiedDataStorage.getStaff(),
      attendance: UnifiedDataStorage.getAttendance(),
      fees: UnifiedDataStorage.getFees(),
      marks: readStorage(STORAGE_KEYS.MARKS, {}),
      grades: readStorage('munyaka_grades', []),
      examTypes: readStorage('munyaka_exam_types', []),
      libraryBooks: readStorage('munyaka_library_books', []),
      feeStructures: readStorage('munyaka_fee_structures', []),
      notices: readStorage('munyaka_notices', []),
      settings: readStorage('munyaka_system_settings_v3', {}),
    };
  }
};

export const CentralDataService = {
  getLearners: () => UnifiedDataStorage.getLearners(),
  saveLearners: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  getStudents: () => UnifiedDataStorage.getLearners(),
  saveStudents: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  
  getStaff: () => UnifiedDataStorage.getStaff(),
  saveStaff: (staff: any[]) => {
    const list = Array.isArray(staff) ? staff : [];
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

      writeStorage(CENTRAL_DB_STORAGE_KEY, data);

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
    if (hardOfflineMode) return null;

    const serverUrl = getStoredServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
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
      hardOfflineMode = true;
    }
    return null;
  },

  async syncBatchToRemote(batchPayload: Record<string, any>): Promise<boolean> {
    if (hardOfflineMode) return false;

    const serverUrl = getStoredServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${serverUrl}/api/central-db/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        return json && json.success === true;
      } else {
        hardOfflineMode = true;
      }
    } catch {
      hardOfflineMode = true;
    }
    return false;
  },

  async initializeAndHydrate(): Promise<void> {
    const remoteData = await this.fetchRemoteDump();
    if (remoteData) {
      writeStorage(CENTRAL_DB_STORAGE_KEY, remoteData);

      if (remoteData.students) {
        writeStorage('munyaka_students', remoteData.students);
        writeStorage('school_learners_data', remoteData.students);
      }
      if (remoteData.staff) {
        const cleared = localStorage.getItem('munyaka_staff_cleared_explicitly');
        if (cleared !== 'true') {
          writeStorage('munyaka_staff', remoteData.staff);
          writeStorage('munyaka_staff_directory', remoteData.staff);
        }
      }
      if (remoteData.attendance) writeStorage('munyaka_attendance', remoteData.attendance);
      if (remoteData.fees) writeStorage('munyaka_fees', remoteData.fees);
      if (remoteData.marks) writeStorage(STORAGE_KEYS.MARKS, remoteData.marks);

      window.dispatchEvent(new Event('munyaka:data-changed'));
      window.dispatchEvent(new Event('staff-changed'));
      window.dispatchEvent(new Event('students-updated'));
    } else {
      const cached = readStorage<any>(CENTRAL_DB_STORAGE_KEY, null);
      if (cached) {
        if (cached.students) {
          writeStorage('munyaka_students', cached.students);
          writeStorage('school_learners_data', cached.students);
        }
        if (cached.staff) {
          const cleared = localStorage.getItem('munyaka_staff_cleared_explicitly');
          if (cleared !== 'true') {
            writeStorage('munyaka_staff', cached.staff);
            writeStorage('munyaka_staff_directory', cached.staff);
          }
        }
      } else {
        writeStorage('munyaka_students', initialSeedData.students || []);
        writeStorage('school_learners_data', initialSeedData.students || []);
        const cleared = localStorage.getItem('munyaka_staff_cleared_explicitly');
        if (cleared !== 'true') {
          writeStorage('munyaka_staff', initialSeedData.staff || []);
          writeStorage('munyaka_staff_directory', initialSeedData.staff || []);
        }
      }
    }
  },

  async persistAndSyncMutation(key: string, data: any): Promise<void> {
    try {
      await CentralDataService.syncBatchToRemote({ [key]: data });
    } catch {}
  },

  fetchRemoteDumpAlias: () => CentralDataService.fetchRemoteDump()
};

export default CentralDataService;
