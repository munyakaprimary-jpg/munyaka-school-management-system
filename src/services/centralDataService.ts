import { countStaffByType, isTeachingStaff, isSupportStaff } from '@/utils/staffUtils';

export const STORAGE_KEYS = {
  STAFF: 'munyaka_master_staff_list',
  TEACHERS: 'munyaka_master_staff_list',
  TEACHERS_LEGACY: 'munyaka_staff_directory',
  TEACHERS_FALLBACK: 'munyaka_staff',
  TEACHERS_PREREG: 'munyaka_staff_db',
  LEARNERS: 'munyaka_master_learners',
  ATTENDANCE: 'munyaka_attendance',
  ACTIVE_SCHOOL_ID: 'munyaka_active_school_id',
  SCHOOL_PROFILE: 'munyaka_school_profile',
  HYDRATION_DONE: 'munyaka_hydration_done',
  SCHEMA_VERSION: 'munyaka_schema_version'
};

export const safeParse = (key: string, fallback: any = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key}`, e);
    return fallback;
  }
};

export const getLearners = () => {
  try {
    const raw = localStorage.getItem('munyaka_master_learners') || localStorage.getItem('munyaka_learners');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStaff = () => {
  try {
    const raw = localStorage.getItem('munyaka_master_staff_list');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getMasterData = () => {
  try {
    const learners = getLearners();
    const staff = getStaff();
    return {
      learners,
      totalLearners: learners.length,
      staff,
      totalStaff: staff.length
    };
  } catch {
    return { learners: [], totalLearners: 0, staff: [], totalStaff: 0 };
  }
};

export const CentralDataService = {
  safeParse,
  getLearners,
  getStaff,
  getMasterData,
  getDB: () => {
    try {
      const centralDbRaw = localStorage.getItem('munyaka_central_db');
      if (centralDbRaw) {
        const parsed = JSON.parse(centralDbRaw);
        return {
          staff: parsed.staff || getStaff(),
          learners: parsed.learners || getLearners(),
          marks: parsed.marks || (CentralDataService.getMarks ? CentralDataService.getMarks() : {}),
          roles: parsed.roles || safeParse('munyaka_rbac_roles', [])
        };
      }
    } catch {}
    return {
      staff: getStaff(),
      learners: getLearners(),
      marks: CentralDataService.getMarks ? CentralDataService.getMarks() : {},
      roles: safeParse('munyaka_rbac_roles', [])
    };
  },
  saveDB: (db: any) => {
    try {
      localStorage.setItem('munyaka_central_db', JSON.stringify(db));
      if (db.staff) {
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify(db.staff));
      }
      if (db.learners) {
        localStorage.setItem('munyaka_master_learners', JSON.stringify(db.learners));
      }
      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error('Error saving central DB:', e);
    }
  },
  hardDeleteStaff: (staffId: string) => {
    const db = CentralDataService.getDB();
    if (!db.staff) return;

    db.staff = db.staff.filter((s: any) =>
      s.id !== staffId &&
      s.tscNo !== staffId &&
      s.tscNumber !== staffId &&
      s.accessCode !== staffId &&
      s.email !== staffId
    );

    CentralDataService.saveDB(db);

    localStorage.removeItem('munyaka_master_staff_list');
    localStorage.removeItem('munyaka_staff');
    localStorage.removeItem('munyaka_backup_staff');

    window.dispatchEvent(new Event('munyaka_data_changed'));
  },
  getData: (key: string, fallback: any = []) => safeParse(key, fallback),
  setData: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error(`Error setting data for ${key}`, e);
    }
  },
  saveLearners: (learners: any[]) => {
    try {
      localStorage.setItem('munyaka_master_learners', JSON.stringify(learners));
      localStorage.setItem('munyaka_learners', JSON.stringify(learners));
      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error('Error saving learners', e);
    }
  },
  saveStaff: (staff: any[]) => {
    try {
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(staff));
      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error('Error saving staff', e);
    }
  },
  addStaff: (record: any) => {
    const list = getStaff();
    const newRecord = {
      ...record,
      id: record.id || `staff-${Date.now()}`,
      staffId: record.staffId || `MUN-STF-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedDate: record.joinedDate || new Date().toISOString().slice(0, 10)
    };
    const updated = [...list, newRecord];
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(updated));
    window.dispatchEvent(new Event('munyaka_data_changed'));
    return newRecord;
  },
  updateStaff: (id: string, updates: any) => {
    const list = getStaff();
    const updated = list.map((s: any) => s.id === id || s.email === id ? { ...s, ...updates } : s);
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(updated));
    window.dispatchEvent(new Event('munyaka_data_changed'));
  },
  deleteStaff: (id: string) => {
    const list = getStaff();
    const updated = list.filter((s: any) => s.id !== id && s.email !== id);
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(updated));
    window.dispatchEvent(new Event('munyaka_data_changed'));
  },
  getMarks: () => {
    try {
      const raw = localStorage.getItem('munyaka_marks_matrix') || localStorage.getItem('munyaka_marks');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  saveMarks: (marks: any) => {
    try {
      localStorage.setItem('munyaka_marks_matrix', JSON.stringify(marks));
      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error('Error saving marks', e);
    }
  },
  isTermLocked: (termKey: string) => {
    try {
      const lockedMap = safeParse('munyaka_locked_terms', {});
      return Boolean(lockedMap[termKey]);
    } catch {
      return false;
    }
  },
  getSystemStats: () => {
    try {
      const learners = getLearners();
      const staff = getStaff();
      const attendanceList = safeParse('munyaka_attendance', []);
      const attendanceCount = Array.isArray(attendanceList) ? attendanceList.length : Object.keys(attendanceList || {}).length;

      const feesList = safeParse('munyaka_fees', []) || safeParse('munyaka_fees_records', []);
      const feeRecordsCount = Array.isArray(feesList) ? feesList.length : Object.keys(feesList || {}).length;

      const examsList = safeParse('munyaka_exams', []) || safeParse('munyaka_all_set_exams', []);
      const examsCount = Array.isArray(examsList) ? examsList.length : Object.keys(examsList || {}).length;

      const teachingStaff = staff.length;
      const { teaching, support } = countStaffByType(staff);

      return {
        learners: learners.length,
        teachingStaff: teaching > 0 ? teaching : staff.length,
        nonTeachingStaff: support,
        attendance: attendanceCount,
        feeRecords: feeRecordsCount,
        exams: examsCount
      };
    } catch (e) {
      console.error('Error computing system stats:', e);
      return {
        learners: 0,
        teachingStaff: 0,
        nonTeachingStaff: 0,
        attendance: 0,
        feeRecords: 0,
        exams: 0
      };
    }
  },

  getFullStateDump: () => {
    try {
      const allState: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              allState[key] = JSON.parse(val);
            } catch {
              allState[key] = val;
            }
          }
        }
      }
      return allState;
    } catch (e) {
      return {};
    }
  }
};

export default CentralDataService;
