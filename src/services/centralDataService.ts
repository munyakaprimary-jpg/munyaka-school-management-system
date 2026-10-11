/**
 * CentralDataService.ts - Master Storage & Sync Controller
 * Target single localStorage key: munyaka_central_db
 */

export interface MasterDatabase {
  learners: any[];
  staff: any[];
  rbacConfig: Record<string, any>;
  attendance: any[];
  marks: any[];
  fees: any[];
  [key: string]: any;
}

const MASTER_KEY = 'munyaka_central_db';

export const STORAGE_KEYS = {
  MASTER: MASTER_KEY,
  STAFF: 'munyaka_master_staff_list',
  LEARNERS: 'munyaka_master_learners',
  ATTENDANCE: 'munyaka_attendance',
  MARKS: 'munyaka_marks_matrix',
  FEES: 'munyaka_fees',
  RBAC: 'munyaka_rbac_config'
};

const consolidateLegacyStorage = (): MasterDatabase => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
    }
    const existingRaw = localStorage.getItem(MASTER_KEY);
    let db: MasterDatabase;

    if (existingRaw) {
      try {
        db = JSON.parse(existingRaw);
      } catch {
        db = {
          learners: [],
          staff: [],
          rbacConfig: {},
          attendance: [],
          marks: [],
          fees: []
        };
      }
    } else {
      db = {
        learners: [],
        staff: [],
        rbacConfig: {},
        attendance: [],
        marks: [],
        fees: []
      };
    }

    if (!db || typeof db !== 'object') {
      db = {
        learners: [],
        staff: [],
        rbacConfig: {},
        attendance: [],
        marks: [],
        fees: []
      };
    }

    let dirty = false;

    if (!Array.isArray(db.staff) || db.staff.length === 0) {
      const staffKeys = ['munyaka_master_staff_list', 'munyaka_staff', 'munyaka_staff_directory', 'munyaka_staff_db'];
      for (const k of staffKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.staff = parsed;
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (!Array.isArray(db.learners) || db.learners.length === 0) {
      const learnerKeys = ['munyaka_master_learners', 'munyaka_learners', 'munyaka_students', 'munyaka_learners_db', 'school_learners_master'];
      for (const k of learnerKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.learners = parsed;
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (!db.rbacConfig || typeof db.rbacConfig !== 'object' || Object.keys(db.rbacConfig).length === 0) {
      const rbacKeys = ['munyaka_rbac_config', 'munyaka_rbac', 'munyaka_permissions'];
      for (const k of rbacKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object') {
              db.rbacConfig = parsed;
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (!Array.isArray(db.attendance) || db.attendance.length === 0) {
      const attKeys = ['munyaka_attendance', 'munyaka_attendance_records', 'munyaka_student_attendance'];
      for (const k of attKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.attendance = parsed;
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (!db.marks || (Array.isArray(db.marks) && db.marks.length === 0)) {
      const marksKeys = ['munyaka_marks_matrix', 'munyaka_marks', 'munyaka_exam_marks'];
      for (const k of marksKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed) {
              db.marks = Array.isArray(parsed) ? parsed : [parsed];
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (!Array.isArray(db.fees) || db.fees.length === 0) {
      const feeKeys = ['munyaka_fees', 'munyaka_fees_records', 'munyaka_fee_payments'];
      for (const k of feeKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.fees = parsed;
              dirty = true;
              break;
            }
          }
        } catch {}
      }
    }

    if (dirty || !existingRaw) {
      try {
        localStorage.setItem(MASTER_KEY, JSON.stringify(db));
      } catch {}
    }

    return {
      learners: Array.isArray(db.learners) ? db.learners : [],
      staff: Array.isArray(db.staff) ? db.staff : [],
      rbacConfig: db.rbacConfig && typeof db.rbacConfig === 'object' ? db.rbacConfig : {},
      attendance: Array.isArray(db.attendance) ? db.attendance : [],
      marks: Array.isArray(db.marks) ? db.marks : [],
      fees: Array.isArray(db.fees) ? db.fees : [],
      ...db
    };
  } catch (e) {
    console.error('Central DB Consolidation Error', e);
    return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
  }
};

export const getDB = (): MasterDatabase => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
    }
    const data = localStorage.getItem(MASTER_KEY);
    if (!data) {
      return consolidateLegacyStorage();
    }
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') {
      return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
    }
    return {
      learners: Array.isArray(parsed.learners) ? parsed.learners : [],
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
      rbacConfig: parsed.rbacConfig && typeof parsed.rbacConfig === 'object' ? parsed.rbacConfig : {},
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      marks: Array.isArray(parsed.marks) ? parsed.marks : [],
      fees: Array.isArray(parsed.fees) ? parsed.fees : [],
      ...parsed
    };
  } catch (e) {
    console.error('Failed to parse munyaka_central_db', e);
    return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
  }
};

export const saveDB = (db: MasterDatabase) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event('munyaka_data_changed'));
  } catch (e) {
    console.error('Central DB Write Error', e);
  }
};

export const CentralDataService = {
  getDB,
  saveDB,

  getLearners: () => {
    try {
      const db = getDB();
      return Array.isArray(db.learners) ? db.learners : [];
    } catch {
      return [];
    }
  },
  saveLearners: (learners: any[]) => {
    try {
      const db = getDB();
      db.learners = Array.isArray(learners) ? learners : [];
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_master_learners', JSON.stringify(db.learners));
      }
    } catch {}
  },

  getStaff: () => {
    try {
      const db = getDB();
      return Array.isArray(db.staff) ? db.staff : [];
    } catch {
      return [];
    }
  },
  saveStaff: (staff: any[]) => {
    try {
      const db = getDB();
      db.staff = Array.isArray(staff) ? staff : [];
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify(db.staff));
      }
    } catch {}
  },

  getRBACConfig: () => {
    try {
      const db = getDB();
      return db.rbacConfig && typeof db.rbacConfig === 'object' ? db.rbacConfig : {};
    } catch {
      return {};
    }
  },
  saveRBACConfig: (config: Record<string, any>) => {
    try {
      const db = getDB();
      db.rbacConfig = config && typeof config === 'object' ? config : {};
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_rbac_config', JSON.stringify(db.rbacConfig));
      }
    } catch {}
  },

  getAttendance: () => {
    try {
      const db = getDB();
      return Array.isArray(db.attendance) ? db.attendance : [];
    } catch {
      return [];
    }
  },
  saveAttendance: (attendance: any[]) => {
    try {
      const db = getDB();
      db.attendance = Array.isArray(attendance) ? attendance : [];
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_attendance', JSON.stringify(db.attendance));
      }
    } catch {}
  },

  getMarks: () => {
    try {
      const db = getDB();
      return Array.isArray(db.marks) ? db.marks : [];
    } catch {
      return [];
    }
  },
  saveMarks: (marks: any[]) => {
    try {
      const db = getDB();
      db.marks = Array.isArray(marks) ? marks : [];
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_marks_matrix', JSON.stringify(db.marks));
      }
    } catch {}
  },

  getFees: () => {
    try {
      const db = getDB();
      return Array.isArray(db.fees) ? db.fees : [];
    } catch {
      return [];
    }
  },
  saveFees: (fees: any[]) => {
    try {
      const db = getDB();
      db.fees = Array.isArray(fees) ? fees : [];
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('munyaka_fees', JSON.stringify(db.fees));
      }
    } catch {}
  },

  addStaff: (record: any) => {
    try {
      const db = getDB();
      const newRecord = {
        ...record,
        id: record?.id || `staff-${Date.now()}`,
        staffId: record?.staffId || `MUN-STF-${Math.floor(1000 + Math.random() * 9000)}`,
        joinedDate: record?.joinedDate || new Date().toISOString().slice(0, 10)
      };
      db.staff = [...(Array.isArray(db.staff) ? db.staff : []), newRecord];
      saveDB(db);
      return newRecord;
    } catch {
      return record;
    }
  },

  updateStaff: (id: string, updates: any) => {
    try {
      const db = getDB();
      db.staff = (Array.isArray(db.staff) ? db.staff : []).map((s: any) => s.id === id || s.email === id ? { ...s, ...updates } : s);
      saveDB(db);
    } catch {}
  },

  deleteStaff: (id: string) => {
    try {
      const db = getDB();
      db.staff = (Array.isArray(db.staff) ? db.staff : []).filter((s: any) => s.id !== id && s.email !== id);
      saveDB(db);
    } catch {}
  },

  getMasterData: () => {
    try {
      const db = getDB();
      const learners = Array.isArray(db.learners) ? db.learners : [];
      const staff = Array.isArray(db.staff) ? db.staff : [];
      return {
        learners,
        totalLearners: learners.length,
        staff,
        totalStaff: staff.length
      };
    } catch {
      return { learners: [], totalLearners: 0, staff: [], totalStaff: 0 };
    }
  },

  getSystemStats: () => {
    try {
      const db = getDB();
      const learners = Array.isArray(db.learners) ? db.learners : [];
      const staff = Array.isArray(db.staff) ? db.staff : [];
      const attendance = Array.isArray(db.attendance) ? db.attendance : [];
      const fees = Array.isArray(db.fees) ? db.fees : [];
      const marks = Array.isArray(db.marks) ? db.marks : [];

      const teachingStaff = staff.length;
      const nonTeachingStaff = staff.filter((s: any) => s.category === 'Bursar' || s.category === 'Store Master' || s.type === 'non-teaching' || s.role === 'support').length;

      return {
        learners: learners.length,
        teachingStaff: teachingStaff > 0 ? teachingStaff : staff.length,
        nonTeachingStaff,
        attendance: attendance.length,
        feeRecords: fees.length,
        exams: marks.length
      };
    } catch {
      return { learners: 0, teachingStaff: 0, nonTeachingStaff: 0, attendance: 0, feeRecords: 0, exams: 0 };
    }
  },

  getFullStateDump: () => getDB(),

  getData: (key?: string, fallback?: any): any => {
    try {
      if (!key) return getDB();
      const db = getDB();
      if (db[key] !== undefined) return db[key];
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch {}
        }
      }
      return fallback !== undefined ? fallback : [];
    } catch {
      return fallback !== undefined ? fallback : [];
    }
  },

  setData: (keyOrDb: string | MasterDatabase, val?: any) => {
    try {
      if (typeof keyOrDb === 'object' && keyOrDb !== null) {
        saveDB(keyOrDb as MasterDatabase);
        return;
      }
      const key = keyOrDb as string;
      const db = getDB();
      db[key] = val;
      saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch {}
  },

  safeParse: (val: string, fallback: any) => {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },

  isTermLocked: (termKey?: string) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const lockedMap = localStorage.getItem('munyaka_locked_terms_map');
      if (lockedMap && termKey) {
        const parsed = JSON.parse(lockedMap);
        if (parsed && parsed[termKey]) return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};

export default CentralDataService;
