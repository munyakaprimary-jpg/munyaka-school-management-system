/**
 * CentralDataService.ts - Master Storage & Sync Controller
 * Target single localStorage key: munyaka_central_db
 */

export interface MasterDatabase {
  schoolInfo: { name: string };
  staff: any[];
  learners: any[];
  rbacConfig: Record<string, any>;
  attendance: any[];
  marks: any[];
  fees: any[];
  [key: string]: any;
}

export const STORAGE_KEYS = {
  MASTER: 'munyaka_central_db',
  STAFF: 'munyaka_master_staff_list',
  LEARNERS: 'munyaka_master_learners',
  ATTENDANCE: 'munyaka_attendance',
  MARKS: 'munyaka_marks_matrix',
  FEES: 'munyaka_fees',
  RBAC: 'munyaka_rbac_config'
};

export class CentralDataService {
  private static STORAGE_KEY = 'munyaka_central_db';

  // Core Reader
  static getDB(): MasterDatabase {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return this.initializeDefaultDB();
      }
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.initializeDefaultDB();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return this.initializeDefaultDB();
      }
      return {
        schoolInfo: parsed.schoolInfo || { name: "Munyaka Primary & JS" },
        staff: Array.isArray(parsed.staff) ? parsed.staff : [],
        learners: Array.isArray(parsed.learners) ? parsed.learners : [],
        rbacConfig: parsed.rbacConfig && typeof parsed.rbacConfig === 'object' ? parsed.rbacConfig : {},
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
        marks: Array.isArray(parsed.marks) ? parsed.marks : [],
        fees: Array.isArray(parsed.fees) ? parsed.fees : [],
        ...parsed
      };
    } catch (e) {
      console.error("Central DB Read Exception:", e);
      return this.initializeDefaultDB();
    }
  }

  // Core Writer
  static saveDB(dbData: MasterDatabase) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dbData));
      
      // Purge obsolete legacy keys so deleted staff never re-seed
      localStorage.removeItem('munyaka_master_staff_list');
      localStorage.removeItem('munyaka_staff');
      localStorage.removeItem('munyaka_staff_directory');
      localStorage.removeItem('munyaka_staff_db');

      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error("Central DB Write Exception:", e);
    }
  }

  // Encapsulated Staff API
  static getStaff(): any[] {
    try {
      const db = this.getDB();
      return Array.isArray(db.staff) ? db.staff : [];
    } catch {
      return [];
    }
  }

  static saveStaff(staffArray: any[]) {
    try {
      const db = this.getDB();
      db.staff = Array.isArray(staffArray) ? staffArray : [];
      this.saveDB(db);
    } catch (e) {
      console.error("saveStaff Exception:", e);
    }
  }

  static addStaff(record: any) {
    try {
      const db = this.getDB();
      const newRecord = {
        ...record,
        id: record?.id || `staff-${Date.now()}`,
        staffId: record?.staffId || `MUN-STF-${Math.floor(1000 + Math.random() * 9000)}`,
        joinedDate: record?.joinedDate || new Date().toISOString().slice(0, 10)
      };
      db.staff = [...(Array.isArray(db.staff) ? db.staff : []), newRecord];
      this.saveDB(db);
      return newRecord;
    } catch {
      return record;
    }
  }

  static updateStaff(id: string, updates: any) {
    try {
      const db = this.getDB();
      db.staff = (Array.isArray(db.staff) ? db.staff : []).map((s: any) => s.id === id || s.email === id ? { ...s, ...updates } : s);
      this.saveDB(db);
    } catch {}
  }

  static deleteStaff(id: string) {
    try {
      const db = this.getDB();
      db.staff = (Array.isArray(db.staff) ? db.staff : []).filter((s: any) => s.id !== id && s.email !== id);
      this.saveDB(db);
    } catch {}
  }

  // Encapsulated Learners API
  static getLearners(): any[] {
    try {
      const db = this.getDB();
      return Array.isArray(db.learners) ? db.learners : [];
    } catch {
      return [];
    }
  }

  static saveLearners(learnersArray: any[]) {
    try {
      const db = this.getDB();
      db.learners = Array.isArray(learnersArray) ? learnersArray : [];
      this.saveDB(db);
    } catch (e) {
      console.error("saveLearners Exception:", e);
    }
  }

  // Additional Encapsulated APIs
  static getRBACConfig(): Record<string, any> {
    try {
      const db = this.getDB();
      return db.rbacConfig && typeof db.rbacConfig === 'object' ? db.rbacConfig : {};
    } catch {
      return {};
    }
  }

  static saveRBACConfig(config: Record<string, any>) {
    try {
      const db = this.getDB();
      db.rbacConfig = config && typeof config === 'object' ? config : {};
      this.saveDB(db);
    } catch (e) {
      console.error("saveRBACConfig Exception:", e);
    }
  }

  static getAttendance(): any[] {
    try {
      const db = this.getDB();
      return Array.isArray(db.attendance) ? db.attendance : [];
    } catch {
      return [];
    }
  }

  static saveAttendance(attendanceArray: any[]) {
    try {
      const db = this.getDB();
      db.attendance = Array.isArray(attendanceArray) ? attendanceArray : [];
      this.saveDB(db);
    } catch (e) {
      console.error("saveAttendance Exception:", e);
    }
  }

  static getMarks(): any[] {
    try {
      const db = this.getDB();
      return Array.isArray(db.marks) ? db.marks : [];
    } catch {
      return [];
    }
  }

  static saveMarks(marksArray: any[]) {
    try {
      const db = this.getDB();
      db.marks = Array.isArray(marksArray) ? marksArray : [];
      this.saveDB(db);
    } catch (e) {
      console.error("saveMarks Exception:", e);
    }
  }

  static getFees(): any[] {
    try {
      const db = this.getDB();
      return Array.isArray(db.fees) ? db.fees : [];
    } catch {
      return [];
    }
  }

  static saveFees(feesArray: any[]) {
    try {
      const db = this.getDB();
      db.fees = Array.isArray(feesArray) ? feesArray : [];
      this.saveDB(db);
    } catch (e) {
      console.error("saveFees Exception:", e);
    }
  }

  static getData(key?: string, fallback?: any): any {
    try {
      if (!key) return this.getDB();
      const db = this.getDB();
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
  }

  static setData(keyOrDb: string | MasterDatabase, val?: any) {
    try {
      if (typeof keyOrDb === 'object' && keyOrDb !== null) {
        this.saveDB(keyOrDb as MasterDatabase);
        return;
      }
      const key = keyOrDb as string;
      const db = this.getDB();
      db[key] = val;
      this.saveDB(db);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch {}
  }

  static safeParse(val: string, fallback: any) {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  static isTermLocked(termKey?: string) {
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

  static getMasterData() {
    try {
      const db = this.getDB();
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
  }

  static getSystemStats() {
    try {
      const db = this.getDB();
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
  }

  static getFullStateDump() {
    return this.getDB();
  }

  // Legacy Key Cleaner / Migrator
  static initializeDefaultDB(): MasterDatabase {
    let legacyStaff: any[] = [];
    let legacyLearners: any[] = [];
    let legacyAttendance: any[] = [];
    let legacyMarks: any[] = [];
    let legacyFees: any[] = [];
    let legacyRbac: Record<string, any> = {};

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const staffRaw = localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff');
        if (staffRaw) {
          const parsed = JSON.parse(staffRaw);
          if (Array.isArray(parsed)) legacyStaff = parsed;
        }

        const learnersRaw = localStorage.getItem('munyaka_master_learners') || localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_students');
        if (learnersRaw) {
          const parsed = JSON.parse(learnersRaw);
          if (Array.isArray(parsed)) legacyLearners = parsed;
        }

        const attendanceRaw = localStorage.getItem('munyaka_attendance');
        if (attendanceRaw) {
          const parsed = JSON.parse(attendanceRaw);
          if (Array.isArray(parsed)) legacyAttendance = parsed;
        }

        const marksRaw = localStorage.getItem('munyaka_marks_matrix') || localStorage.getItem('munyaka_assessments');
        if (marksRaw) {
          const parsed = JSON.parse(marksRaw);
          if (Array.isArray(parsed)) legacyMarks = parsed;
        }

        const feesRaw = localStorage.getItem('munyaka_fees');
        if (feesRaw) {
          const parsed = JSON.parse(feesRaw);
          if (Array.isArray(parsed)) legacyFees = parsed;
        }

        const rbacRaw = localStorage.getItem('munyaka_rbac_config');
        if (rbacRaw) {
          const parsed = JSON.parse(rbacRaw);
          if (parsed && typeof parsed === 'object') legacyRbac = parsed;
        }
      }
    } catch (e) {
      console.warn("Legacy migration exception:", e);
    }

    const initialDB: MasterDatabase = {
      schoolInfo: { name: "Munyaka Primary & JS" },
      staff: legacyStaff,
      learners: legacyLearners,
      rbacConfig: legacyRbac,
      attendance: legacyAttendance,
      marks: legacyMarks,
      fees: legacyFees
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialDB));
      }
    } catch (e) {
      console.error("Failed to save initial DB:", e);
    }

    return initialDB;
  }
}

// Standalone functions for backward compatibility with existing imports
export const getDB = () => CentralDataService.getDB();
export const saveDB = (dbData: MasterDatabase) => CentralDataService.saveDB(dbData);
export const getStaff = () => CentralDataService.getStaff();
export const saveStaff = (staffArray: any[]) => CentralDataService.saveStaff(staffArray);
export const getLearners = () => CentralDataService.getLearners();
export const saveLearners = (learnersArray: any[]) => CentralDataService.saveLearners(learnersArray);

export default CentralDataService;
