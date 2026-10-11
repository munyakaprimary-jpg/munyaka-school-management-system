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
    const existingRaw = localStorage.getItem(MASTER_KEY);
    let db: MasterDatabase;

    if (existingRaw) {
      db = JSON.parse(existingRaw);
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

    let dirty = false;

    if (!db.staff || db.staff.length === 0) {
      const staffKeys = ['munyaka_master_staff_list', 'munyaka_staff', 'munyaka_staff_directory', 'munyaka_staff_db'];
      for (const k of staffKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.staff = parsed;
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (!db.learners || db.learners.length === 0) {
      const learnerKeys = ['munyaka_master_learners', 'munyaka_learners', 'munyaka_students', 'munyaka_learners_db', 'school_learners_master'];
      for (const k of learnerKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.learners = parsed;
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (!db.rbacConfig || Object.keys(db.rbacConfig).length === 0) {
      const rbacKeys = ['munyaka_rbac_config', 'munyaka_rbac', 'munyaka_permissions'];
      for (const k of rbacKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object') {
              db.rbacConfig = parsed;
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (!db.attendance || db.attendance.length === 0) {
      const attKeys = ['munyaka_attendance', 'munyaka_attendance_records', 'munyaka_student_attendance'];
      for (const k of attKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.attendance = parsed;
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (!db.marks || (Array.isArray(db.marks) && db.marks.length === 0)) {
      const marksKeys = ['munyaka_marks_matrix', 'munyaka_marks', 'munyaka_exam_marks'];
      for (const k of marksKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed) {
              db.marks = Array.isArray(parsed) ? parsed : [parsed];
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (!db.fees || db.fees.length === 0) {
      const feeKeys = ['munyaka_fees', 'munyaka_fees_records', 'munyaka_fee_payments'];
      for (const k of feeKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              db.fees = parsed;
              dirty = true;
              break;
            }
          } catch {}
        }
      }
    }

    if (dirty || !existingRaw) {
      localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    }

    return db;
  } catch (e) {
    console.error('Central DB Consolidation Error', e);
    return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
  }
};

export const getDB = (): MasterDatabase => {
  try {
    const data = localStorage.getItem(MASTER_KEY);
    if (!data) {
      return consolidateLegacyStorage();
    }
    const parsed = JSON.parse(data);
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
    console.error('Central DB Read Error', e);
    return { learners: [], staff: [], rbacConfig: {}, attendance: [], marks: [], fees: [] };
  }
};

export const saveDB = (db: MasterDatabase) => {
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event('munyaka_data_changed'));
  } catch (e) {
    console.error('Central DB Write Error', e);
  }
};

export const CentralDataService = {
  getDB,
  saveDB,

  getLearners: () => getDB().learners,
  saveLearners: (learners: any[]) => {
    const db = getDB();
    db.learners = learners;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_master_learners', JSON.stringify(learners));
    } catch {}
  },

  getStaff: () => getDB().staff,
  saveStaff: (staff: any[]) => {
    const db = getDB();
    db.staff = staff;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(staff));
    } catch {}
  },

  getRBACConfig: () => getDB().rbacConfig,
  saveRBACConfig: (config: Record<string, any>) => {
    const db = getDB();
    db.rbacConfig = config;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_rbac_config', JSON.stringify(config));
    } catch {}
  },

  getAttendance: () => getDB().attendance,
  saveAttendance: (attendance: any[]) => {
    const db = getDB();
    db.attendance = attendance;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_attendance', JSON.stringify(attendance));
    } catch {}
  },

  getMarks: () => getDB().marks,
  saveMarks: (marks: any[]) => {
    const db = getDB();
    db.marks = marks;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_marks_matrix', JSON.stringify(marks));
    } catch {}
  },

  getFees: () => getDB().fees,
  saveFees: (fees: any[]) => {
    const db = getDB();
    db.fees = fees;
    saveDB(db);
    try {
      localStorage.setItem('munyaka_fees', JSON.stringify(fees));
    } catch {}
  },

  addStaff: (record: any) => {
    const db = getDB();
    const newRecord = {
      ...record,
      id: record.id || `staff-${Date.now()}`,
      staffId: record.staffId || `MUN-STF-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedDate: record.joinedDate || new Date().toISOString().slice(0, 10)
    };
    db.staff = [...(db.staff || []), newRecord];
    saveDB(db);
    return newRecord;
  },

  updateStaff: (id: string, updates: any) => {
    const db = getDB();
    db.staff = (db.staff || []).map((s: any) => s.id === id || s.email === id ? { ...s, ...updates } : s);
    saveDB(db);
  },

  deleteStaff: (id: string) => {
    const db = getDB();
    db.staff = (db.staff || []).filter((s: any) => s.id !== id && s.email !== id);
    saveDB(db);
  },

  getMasterData: () => {
    const db = getDB();
    return {
      learners: db.learners,
      totalLearners: db.learners.length,
      staff: db.staff,
      totalStaff: db.staff.length
    };
  },

  getSystemStats: () => {
    const db = getDB();
    const learners = db.learners || [];
    const staff = db.staff || [];
    const attendance = db.attendance || [];
    const fees = db.fees || [];
    const marks = db.marks || [];

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
  },

  getFullStateDump: () => getDB(),

  getData: () => getDB(),
  setData: (db: MasterDatabase) => saveDB(db),
  safeParse: (val: string, fallback: any) => {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  isTermLocked: () => false
};

consolidateLegacyStorage();

export default CentralDataService;
