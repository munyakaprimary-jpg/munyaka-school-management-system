/**
 * centralDataService.ts — Definitive unified data storage service
 * All menus, dashboards, and pages read and write exclusively from this service.
 * Merged with CentralDataSyncManager for single unified synchronization.
 */

import { Preferences } from '@capacitor/preferences';
import { initialSeedData } from '@/data/initialSeedData';
import { UnifiedDataStorage } from './unifiedDataStorage';
import { STORAGE_KEYS as PERSISTENT_KEYS } from './persistentStore';

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

export const CentralDataService = {
  getLearners: () => UnifiedDataStorage.getLearners(),
  saveLearners: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  getStudents: () => UnifiedDataStorage.getLearners(),
  saveStudents: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  
  getStaff: () => UnifiedDataStorage.getStaff(),
  saveStaff: (staff: any[]) => UnifiedDataStorage.saveStaff(staff),
  addStaff: (record: any) => UnifiedDataStorage.addStaff(record),
  updateStaff: (id: string, updates: any) => UnifiedDataStorage.updateStaff(id, updates),
  deleteStaff: (id: string) => UnifiedDataStorage.deleteStaff(id),
  clearStaff: () => {
    UnifiedDataStorage.clearStaff();
    // Aggressively purge all known hidden staff keys
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

  generateFullSnapshot: async () => {
    const backup = {
      students: UnifiedDataStorage.getLearners(),
      staff: UnifiedDataStorage.getStaff(),
      attendance: UnifiedDataStorage.getAttendance(),
      fees: UnifiedDataStorage.getFees(),
    };
    return JSON.stringify(backup, null, 2);
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
    try {
      const data = JSON.parse(snapshot);
      if (data.students) UnifiedDataStorage.saveLearners(data.students);
      if (data.staff) UnifiedDataStorage.saveStaff(data.staff);
      if (data.attendance) UnifiedDataStorage.saveAttendance(data.attendance);
      if (data.fees) UnifiedDataStorage.saveFees(data.fees);
      return true;
    } catch {
      return false;
    }
  },

  // Remote synchronization methods merged from CentralDataSyncManager
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
