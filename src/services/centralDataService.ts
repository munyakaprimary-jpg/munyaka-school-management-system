// Central Data Service - Sole Authority Engine for Munyaka Portal

export interface CentralDB {
  staff: any[];
  learners: any[];
  attendance: any[];
  fees: any[];
  marks: any[];
  [key: string]: any;
}

const CENTRAL_DB_KEY = 'munyaka_central_db';

const DEFAULT_STAFF = [
  { id: '1', name: 'Dr. John Kamau', role: 'Head Teacher (HOI)', tscNo: 'TSC12345', accessCode: 'ADMIN001', assignedClass: 'Administration', assignedClasses: ['Administration'], email: 'kamau@munyaka.ac.ke' },
  { id: '2', name: 'Mary Wanjiku', role: 'Deputy Head Teacher (DHOI)', tscNo: 'TSC23456', accessCode: 'ADMIN002', assignedClass: 'Administration', assignedClasses: ['Administration'], email: 'wanjiku@munyaka.ac.ke' },
  { id: '3', name: 'Peter Ochieng', role: 'Class Teacher', tscNo: 'TSC34567', accessCode: 'TEACH001', assignedClass: 'Grade 7', assignedClasses: ['Grade 7'], email: 'ochieng@munyaka.ac.ke' },
  { id: '4', name: 'Grace Akinyi', role: 'Subject Teacher', tscNo: 'TSC45678', accessCode: 'TEACH002', assignedClass: 'Grade 8', assignedClasses: ['Grade 8'], email: 'akinyi@munyaka.ac.ke' },
  { id: '5', name: 'David Kimani', role: 'ICT Teacher', tscNo: 'TSC56789', accessCode: 'TEACH003', assignedClass: 'Grade 9', assignedClasses: ['Grade 9'], email: 'kimani@munyaka.ac.ke' },
  { id: '6', name: 'Sarah Cheptoo', role: 'School Bursar', tscNo: 'TSC67890', accessCode: 'BURSAR1', assignedClass: 'Unassigned', assignedClasses: ['Unassigned'], email: 'cheptoo@munyaka.ac.ke' },
  { id: '7', name: 'James Mwangi', role: 'Support Staff', tscNo: 'TSC78901', accessCode: 'SUPPORT1', assignedClass: 'Unassigned', assignedClasses: ['Unassigned'], email: 'mwangi@munyaka.ac.ke' }
];

const DEFAULT_LEARNERS = [
  { id: 'l1', name: 'Brian Kiprono', admissionNumber: 'MUN/2024/001', grade: 'Grade 7', gender: 'Male' },
  { id: 'l2', name: 'Cynthia Mutheu', admissionNumber: 'MUN/2024/002', grade: 'Grade 7', gender: 'Female' },
  { id: 'l3', name: 'Elijah Juma', admissionNumber: 'MUN/2024/003', grade: 'Grade 8', gender: 'Male' },
  { id: 'l4', name: 'Faith Wambui', admissionNumber: 'MUN/2024/004', grade: 'Grade 8', gender: 'Female' },
  { id: 'l5', name: 'George Otieno', admissionNumber: 'MUN/2024/005', grade: 'Grade 9', gender: 'Male' }
];

export const STORAGE_KEYS = {
  STAFF: 'munyaka_staff',
  LEARNERS: 'munyaka_learners',
  CENTRAL_DB: CENTRAL_DB_KEY
};

export class CentralDataService {
  /**
   * Get the entire central database object safely.
   */
  public static getDB(): CentralDB {
    try {
      const raw = localStorage.getItem(CENTRAL_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            staff: Array.isArray(parsed.staff) ? parsed.staff : DEFAULT_STAFF,
            learners: Array.isArray(parsed.learners) ? parsed.learners : DEFAULT_LEARNERS,
            attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
            fees: Array.isArray(parsed.fees) ? parsed.fees : [],
            marks: Array.isArray(parsed.marks) ? parsed.marks : [],
            ...parsed
          };
        }
      }
    } catch (e) {
      console.error("Error reading central DB:", e);
    }

    const defaultDb: CentralDB = {
      staff: DEFAULT_STAFF,
      learners: DEFAULT_LEARNERS,
      attendance: [],
      fees: [],
      marks: []
    };
    try {
      localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(defaultDb));
    } catch (err) {
      console.error("Error saving default DB:", err);
    }
    return defaultDb;
  }

  /**
   * Save the entire central database object and purge legacy keys.
   */
  public static saveDB(db: CentralDB): void {
    try {
      localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(db));
      localStorage.removeItem('munyaka_master_staff_list');
      localStorage.removeItem('munyaka_staff');
      localStorage.removeItem('munyaka_master_learners');
      localStorage.removeItem('munyaka_learners');

      window.dispatchEvent(new Event('munyaka_data_changed'));
    } catch (e) {
      console.error("Error saving central DB:", e);
    }
  }

  /**
   * Initialize or reset default DB.
   */
  public static initializeDefaultDB(): CentralDB {
    const defaultDb: CentralDB = {
      staff: DEFAULT_STAFF,
      learners: DEFAULT_LEARNERS,
      attendance: [],
      fees: [],
      marks: []
    };
    CentralDataService.saveDB(defaultDb);
    return defaultDb;
  }

  /**
   * Get staff array from central DB.
   */
  public static getStaff(): any[] {
    try {
      const db = CentralDataService.getDB();
      return Array.isArray(db.staff) ? db.staff : DEFAULT_STAFF;
    } catch (e) {
      console.error("Error getting staff:", e);
      return DEFAULT_STAFF;
    }
  }

  /**
   * Save staff array to central DB.
   */
  public static saveStaff(staffArray: any[]): void {
    try {
      const db = CentralDataService.getDB();
      db.staff = staffArray;
      CentralDataService.saveDB(db);
    } catch (e) {
      console.error("Error saving staff:", e);
    }
  }

  /**
   * Add a single staff member.
   */
  public static addStaff(record: any): any {
    const staff = CentralDataService.getStaff();
    const newRecord = { id: 'staff_' + Date.now(), ...record };
    staff.push(newRecord);
    CentralDataService.saveStaff(staff);
    return newRecord;
  }

  /**
   * Update a staff member by ID.
   */
  public static updateStaff(id: string, updates: any): void {
    const staff = CentralDataService.getStaff();
    const index = staff.findIndex(s => String(s.id) === String(id) || String(s.tscNo) === String(id));
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updates };
      CentralDataService.saveStaff(staff);
    }
  }

  /**
   * Delete a staff member by ID.
   */
  public static deleteStaff(id: string): void {
    const staff = CentralDataService.getStaff();
    const filtered = staff.filter(s => String(s.id) !== String(id) && String(s.tscNo) !== String(id) && String(s.accessCode) !== String(id));
    CentralDataService.saveStaff(filtered);
  }

  /**
   * Get learners array from central DB.
   */
  public static getLearners(): any[] {
    try {
      const db = CentralDataService.getDB();
      return Array.isArray(db.learners) ? db.learners : DEFAULT_LEARNERS;
    } catch (e) {
      console.error("Error getting learners:", e);
      return DEFAULT_LEARNERS;
    }
  }

  /**
   * Save learners array to central DB.
   */
  public static saveLearners(learnersArray: any[]): void {
    try {
      const db = CentralDataService.getDB();
      db.learners = learnersArray;
      CentralDataService.saveDB(db);
    } catch (e) {
      console.error("Error saving learners:", e);
    }
  }

  /**
   * Generic get data helper for compatibility.
   */
  public static getData(key: string, fallback: any = null): any {
    try {
      const db = CentralDataService.getDB();
      if (db[key] !== undefined) return db[key];
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Error getData for key:", key, e);
    }
    return fallback;
  }

  /**
   * Generic set data helper for compatibility.
   */
  public static setData(key: string, value: any): void {
    try {
      const db = CentralDataService.getDB();
      db[key] = value;
      CentralDataService.saveDB(db);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error setData for key:", key, e);
    }
  }

  /**
   * Safe parse helper.
   */
  public static safeParse(key: string, fallback: any = null): any {
    return CentralDataService.getData(key, fallback);
  }

  /**
   * Check if term is locked.
   */
  public static isTermLocked(termKey: string): boolean {
    try {
      const lockedTerms = CentralDataService.getData('locked_terms', {});
      if (lockedTerms && typeof lockedTerms === 'object') {
        return !!lockedTerms[termKey];
      }
    } catch {}
    return false;
  }

  /**
   * Get marks records.
   */
  public static getMarks(): any[] {
    const db = CentralDataService.getDB();
    if (Array.isArray(db.marks)) return db.marks;
    try {
      const raw = localStorage.getItem('munyaka_marks') || localStorage.getItem('exam_marks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  /**
   * Save marks records.
   */
  public static saveMarks(marks: any[]): void {
    const db = CentralDataService.getDB();
    db.marks = marks;
    CentralDataService.saveDB(db);
    try {
      localStorage.setItem('munyaka_marks', JSON.stringify(marks));
    } catch {}
  }

  /**
   * Get full state dump for CentralDataService page.
   */
  public static getFullStateDump(): CentralDB {
    return CentralDataService.getDB();
  }

  /**
   * Get system stats.
   */
  public static getSystemStats(): any {
    const staff = CentralDataService.getStaff();
    const learners = CentralDataService.getLearners();
    return {
      totalStaff: staff.length,
      totalLearners: learners.length
    };
  }

  /**
   * Get master data.
   */
  public static getMasterData(): any {
    const db = CentralDataService.getDB();
    return {
      staff: db.staff || [],
      learners: db.learners || [],
      totalLearners: (db.learners || []).length
    };
  }
}

export default CentralDataService;
