import { readStorage, writeStorage } from '@/services/persistentStore';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { generateLearnerId, formatLearnerDoc, deduplicateLearnersById as dedupeLearnersById } from '@/services/learnerService';

export { STORAGE_KEYS };

export const CentralDataService = {
  getLearners: (): any[] => {
    const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';
    const DELETED_IDS_KEY = 'deleted_learner_ids';
    try {
      // Gather learners from ALL possible keys across the app
      const keysToHarvest = [
        UNIFIED_STORAGE_KEY,
        'munyaka_learners',
        'munyaka_students',
        'school_learners_data',
        'school_learners_v1',
        'students',
        'learners',
        'munyaka_learners_db',
        'munyaka_central_db',
        'school_learners_master'
      ];

      const allCollected: any[] = [];
      keysToHarvest.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allCollected.push(...parsed);
            }
          }
        } catch {}
      });

      const rawDeleted = localStorage.getItem(DELETED_IDS_KEY);
      const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

      const validMap = new Map<string, any>();
      allCollected.forEach(l => {
        if (!l) return;
        const idStr = String(l.id || l.admissionNumber || l.admissionNo || l.admNo || '').trim();
        const identifier = String(l.idValue || l.assessmentNo || l.assessmentNumber || l.birthCertNo || l.birthCertificateNo || '').trim();
        const fullName = String(l.fullName || l.name || l.studentName || '').trim();

        if (idStr && deletedIds.includes(idStr)) return;

        // Create a robust composite key to prevent duplicates
        const uniqueKey = (idStr || identifier || fullName).toLowerCase();
        if (uniqueKey && !validMap.has(uniqueKey)) {
          validMap.set(uniqueKey, l);
        } else if (uniqueKey && validMap.has(uniqueKey)) {
          // Merge properties if duplicate exists (retain non-empty fields)
          const existing = validMap.get(uniqueKey);
          validMap.set(uniqueKey, {
            ...existing,
            ...l,
            admissionNo: existing.admissionNo || l.admissionNo || l.admissionNumber || l.admNo,
            admissionNumber: existing.admissionNumber || l.admissionNumber || l.admissionNo || l.admNo,
            assessmentNo: existing.assessmentNo || l.assessmentNo || l.assessmentNumber || l.idValue,
            birthCertificateNo: existing.birthCertificateNo || l.birthCertificateNo || l.birthCertNo || l.idValue,
            fullName: existing.fullName || l.fullName || l.name,
            name: existing.name || l.name || l.fullName,
            grade: existing.grade || l.grade || l.gradeLevel,
            stream: existing.stream || l.stream_name,
            gender: existing.gender || l.gender || l.sex,
            parentName: existing.parentName || l.parentName || l.parentGuardian || l.guardian,
            phoneNumber: existing.phoneNumber || l.phoneNumber || l.phone || l.parentPhone
          });
        }
      });

      const unifiedList = dedupeLearnersById(Array.from(validMap.values()).map(formatLearnerDoc));

      // Automatically backfill unified key so all other keys sync with it
      if (unifiedList.length > 0) {
        localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(unifiedList));
        localStorage.setItem('munyaka_learners', JSON.stringify(unifiedList));
        localStorage.setItem('school_learners_data', JSON.stringify(unifiedList));
      }

      return unifiedList;
    } catch {
      return [];
    }
  },

  saveLearners: (learners: any[]): boolean => {
    const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';
    const normalized = dedupeLearnersById(
      (learners || []).map((l) => ({
        ...l,
        id: l?.id ? String(l.id) : generateLearnerId(),
      }))
    );
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem('school_learners_data', JSON.stringify(normalized));
      localStorage.setItem('munyaka_students', JSON.stringify(normalized));
    } catch (err) {
      console.error('[CentralDataService] Failed to save learners:', err);
    }
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('learners_updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    return true;
  },

  getStudents: () => CentralDataService.getLearners(),
  saveStudents: (learners: any[]) => CentralDataService.saveLearners(learners),

  getStaff: (): any[] => {
    const res = readStorage<any[]>('munyaka_staff_db', []);
    // DISABLED: No automatic seeding from initialSeedData. Empty state stays as [].
    return res || [];
  },

  saveStaff: (staffList: any[]): boolean => {
    writeStorage(STORAGE_KEYS.STAFF, staffList);
    writeStorage('munyaka_staff_directory', staffList);
    writeStorage('munyaka_master_staff_list', staffList);
    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    return true;
  },

  addStaff: (record: any): any => {
    const staff = CentralDataService.getStaff();
    const id = record.id || `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const staffId = record.staffId || record.staff_id || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempAccessCode = record.tempAccessCode || record.access_key || record.ref || 'MUN-2345';
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
    CentralDataService.saveStaff(staff);
    return newRecord;
  },

  updateStaff: (id: string, updates: any): void => {
    const staff = CentralDataService.getStaff();
    const index = staff.findIndex(s => s.id === id);
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updates };
      CentralDataService.saveStaff(staff);
    }
  },

  deleteStaff: (id: string): void => {
    const staff = CentralDataService.getStaff();
    const filtered = staff.filter(s => s.id !== id);
    CentralDataService.saveStaff(filtered);
  },

  clearStaff: (): void => {
    CentralDataService.saveStaff([]);
  },

  getAttendance: (): any[] => readStorage<any[]>('munyaka_attendance_records', []),
  saveAttendance: (records: any[]): boolean => {
    writeStorage('munyaka_attendance_records', records);
    return true;
  },

  getFees: (): any[] => readStorage<any[]>('munyaka_fees_records', []),
  saveFees: (records: any[]): boolean => {
    writeStorage('munyaka_fees_records', records);
    return true;
  },

  getTransactions: () => CentralDataService.getFees(),
  saveTransactions: (records: any[]) => CentralDataService.saveFees(records),

  getData: <T>(key: string, fallback: T): T => readStorage<T>(key, fallback),
  setData: <T>(key: string, value: T): void => { writeStorage<T>(key, value); },

  getFullStateDump: (): any => {
    const allKeys: Record<string, any> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('munyaka_') || key.startsWith('school_') || key.startsWith('exam_') || key.startsWith('fee'))) {
          try {
            allKeys[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            allKeys[key] = localStorage.getItem(key);
          }
        }
      }
    } catch {}
    return {
      ...allKeys,
      students: CentralDataService.getLearners(),
      staff: CentralDataService.getStaff(),
    };
  },

  importCentralData: async (snapshotData: any): Promise<boolean> => {
    try {
      const data = typeof snapshotData === 'string' ? JSON.parse(snapshotData) : snapshotData;
      if (!data || typeof data !== 'object') return false;
      if (data.students) CentralDataService.saveLearners(data.students);
      if (data.staff) CentralDataService.saveStaff(data.staff);
      window.dispatchEvent(new Event('munyaka:data-changed'));
      return true;
    } catch {
      return false;
    }
  },

  generateFullSnapshot: async () => {
    return JSON.stringify(CentralDataService.getFullStateDump(), null, 2);
  },

  exportCentralData: (): any => {
    return CentralDataService.getFullStateDump();
  },

  isTermLocked: (termKey: string): boolean => {
    const locked = readStorage<Record<string, boolean>>('munyaka_locked_terms_map', {});
    if (locked[termKey]) return true;
    const legacy = readStorage<string[]>('munyaka_archived_terms', []);
    return legacy.includes(termKey);
  },

  getMarks: (examId?: string): any => {
    const records = readStorage<any>(STORAGE_KEYS.MARKS, {});
    if (examId) return records[examId] || {};
    return records;
  },

  saveMarks: (records: any): void => {
    writeStorage(STORAGE_KEYS.MARKS, records);
  },

  restoreSnapshot: async (snapshot: string) => {
    return await CentralDataService.importCentralData(snapshot);
  },

  initializeAndHydrate: async (): Promise<void> => {},
  persistAndSyncMutation: async (): Promise<void> => {}
};

export const getLearners = CentralDataService.getLearners;
export const saveLearners = CentralDataService.saveLearners;
export const getStudents = CentralDataService.getStudents;
export const saveStudents = CentralDataService.saveStudents;
export const getStaff = CentralDataService.getStaff;
export const saveStaff = CentralDataService.saveStaff;

export default CentralDataService;
