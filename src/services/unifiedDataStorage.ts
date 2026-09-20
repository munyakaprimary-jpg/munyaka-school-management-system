/**
 * unifiedDataStorage.ts — Definitive unified data storage engine
 * All menus, dashboards, and services in the application read and write exclusively through this service.
 */

import { STORAGE_KEYS, readStorage, writeStorage, removeStorage, clearAllStorage } from '@/services/persistentStore';

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

  getStaff: (): any[] => {
    if (localStorage.getItem('munyaka_staff_cleared_explicitly') === 'true') {
      return [];
    }
    const primary = readStorage<any[]>(STORAGE_KEYS.STAFF, []);
    const directory = readStorage<any[]>('munyaka_staff_directory', []);
    const master = readStorage<any[]>('munyaka_master_staff_list', []);

    const map = new Map<string, any>();
    [...master, ...directory, ...primary].forEach(s => {
      if (s && (s.id || s.email || s.name)) {
        const key = String(s.id || s.email || s.name).trim().toLowerCase();
        map.set(key, s);
      }
    });

    return Array.from(map.values());
  },

  saveStaff: (staffList: any[]): boolean => {
    if (staffList.length > 0) {
      localStorage.removeItem('munyaka_staff_cleared_explicitly');
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
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    return true;
  },

  getFees: (): any[] => readStorage<any[]>('munyaka_fees_records', []),
  saveFees: (records: any[]): boolean => writeStorage('munyaka_fees_records', records),

  getAttendance: (): any[] => readStorage<any[]>('munyaka_attendance_records', []),
  saveAttendance: (records: any[]): boolean => writeStorage('munyaka_attendance_records', records),
};

export default UnifiedDataStorage;
