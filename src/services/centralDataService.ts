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

    // Return default initialized DB if empty or corrupted
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
      // Purge legacy keys to stop re-seeding deleted records
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
   * Save staff array to central DB, purge legacy keys, and dispatch change event.
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

  public static getSystemStats(): any {
    const staff = CentralDataService.getStaff();
    const learners = CentralDataService.getLearners();
    return {
      totalStaff: staff.length,
      totalLearners: learners.length
    };
  }

  public static getMasterData(): any {
    const db = CentralDataService.getDB();
    return {
      staff: db.staff || [],
      learners: db.learners || [],
      totalLearners: (db.learners || []).length
    };
  }
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
   * Save learners array to central DB, purge legacy keys, and dispatch change event.
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
}

export default CentralDataService;
