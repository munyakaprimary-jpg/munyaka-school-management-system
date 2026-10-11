import React, { useState, useEffect } from 'react';
import { CentralDataService, CentralDB } from '../services/centralDataService';

export interface Campus {
  id: string;
  name: string;
  activeSeats: number;
  pricePerSeat: number;
  status: 'Active' | 'Inactive' | 'Pending';
  expiryDate: string;
}

export interface SchoolStore {
  learners: any[];
  students: any[];
  staff: any[];
  fees: any;
  attendance: any;
  exams: any;
  marks: any;
  timetable: any;
  settings: any;
  notices: any[];
  addNotice: (notice: any) => void;
  events: any[];
  campuses: Campus[];
  tenants: any[];
  setCampuses: (campuses: Campus[]) => void;
  setTenants: (tenants: any[]) => void;
  deleteTenant: (id: string) => void;
  addCampus: (newCampus: Partial<Campus>) => void;
  deleteCampus: (id: string) => void;
  updateCampusSeats: (id: string, activeSeats: number) => void;
  setLearners: (learners: any[]) => void;
  setStaff: (staff: any[]) => void;
  setFees: (fees: any) => void;
  setAttendance: (attendance: any) => void;
  setExams: (exams: any) => void;
  setMarks: (marks: any) => void;
  setTimetable: (timetable: any) => void;
  setNotices: (notices: any) => void;
  setEvents: (events: any) => void;
  setState: (partial: any) => void;
  exportBackup: () => void;
  refreshStore: () => void;
}

export interface SchoolStoreHook {
  (selector?: (state: SchoolStore) => any): any;
  getState: () => SchoolStore;
  setState: (partial: any) => void;
}

const listeners = new Set<() => void>();

const STORE_VERSION_KEY = 'munyaka_store_version_v4';
const TARGET_STORE_VERSION = 4;

try {
  const currentVersion = parseInt(localStorage.getItem(STORE_VERSION_KEY) || '0', 10);
  if (currentVersion < TARGET_STORE_VERSION) {
    localStorage.setItem(STORE_VERSION_KEY, String(TARGET_STORE_VERSION));
  }
} catch {}

// Helper to sync storeState with CentralDataService
const getFreshCentralState = (): Partial<SchoolStore> => {
  const db = CentralDataService.getDB();
  return {
    learners: Array.isArray(db.learners) ? db.learners : [],
    staff: Array.isArray(db.staff) ? db.staff : [],
    fees: db.fees || {},
    attendance: db.attendance || {},
    exams: Array.isArray(db.exams) ? db.exams : [],
    marks: Array.isArray(db.marks) ? db.marks : [],
    timetable: db.timetable || {},
    settings: db.settings || {},
    notices: Array.isArray(db.notices) ? db.notices : [],
    events: Array.isArray(db.events) ? db.events : [],
    campuses: Array.isArray(db.campuses) ? db.campuses : [],
    tenants: Array.isArray(db.tenants) ? db.tenants : []
  };
};

let storeState: SchoolStore = {
  learners: [],
  get students() {
    return this.learners;
  },
  staff: [],
  fees: {},
  attendance: {},
  exams: [],
  marks: [],
  timetable: {},
  settings: {},
  notices: [],
  addNotice: (notice: any) => {
    const updated = [notice, ...storeState.notices];
    storeState.setNotices(updated);
  },
  events: [],
  campuses: [],
  tenants: [],
  setCampuses: (campuses: Campus[]) => {
    const db = CentralDataService.getDB();
    db.campuses = campuses;
    CentralDataService.saveDB(db);
    storeState.campuses = campuses;
    listeners.forEach(l => l());
  },
  setTenants: (tenants: any[]) => {
    const db = CentralDataService.getDB();
    db.tenants = tenants;
    CentralDataService.saveDB(db);
    storeState.tenants = tenants;
    listeners.forEach(l => l());
  },
  deleteTenant: (id: string) => {
    const db = CentralDataService.getDB();
    const updated = (db.tenants || []).filter((t: any) => t.id !== id);
    db.tenants = updated;
    CentralDataService.saveDB(db);
    storeState.tenants = updated;
    listeners.forEach(l => l());
  },
  addCampus: (newCampus: Partial<Campus>) => {
    const db = CentralDataService.getDB();
    const currentCampuses = Array.isArray(db.campuses) ? db.campuses : [];
    const updated = [
      ...currentCampuses,
      {
        id: Date.now().toString(),
        name: newCampus.name || 'New Campus',
        activeSeats: Number(newCampus.activeSeats) || 0,
        pricePerSeat: Number(newCampus.pricePerSeat) || 250,
        status: newCampus.status || 'Active',
        expiryDate: newCampus.expiryDate || '2027-09-27',
      },
    ];
    db.campuses = updated;
    CentralDataService.saveDB(db);
    storeState.campuses = updated;
    listeners.forEach(l => l());
  },
  deleteCampus: (id: string) => {
    const db = CentralDataService.getDB();
    const updated = (db.campuses || []).filter((c: Campus) => c.id !== id);
    db.campuses = updated;
    CentralDataService.saveDB(db);
    storeState.campuses = updated;
    listeners.forEach(l => l());
  },
  updateCampusSeats: (id: string, activeSeats: number) => {
    const db = CentralDataService.getDB();
    const updated = (db.campuses || []).map((c: Campus) => c.id === id ? { ...c, activeSeats } : c);
    db.campuses = updated;
    CentralDataService.saveDB(db);
    storeState.campuses = updated;
    listeners.forEach(l => l());
  },
  setLearners: (learners: any[]) => {
    const db = CentralDataService.getDB();
    db.learners = learners;
    CentralDataService.saveDB(db);
    storeState.learners = learners;
    listeners.forEach(l => l());
  },
  setStaff: (staff: any[]) => {
    const db = CentralDataService.getDB();
    db.staff = staff;
    CentralDataService.saveDB(db);
    storeState.staff = staff;
    listeners.forEach(l => l());
  },
  setFees: (fees: any) => {
    const db = CentralDataService.getDB();
    db.fees = fees;
    CentralDataService.saveDB(db);
    storeState.fees = fees;
    listeners.forEach(l => l());
  },
  setAttendance: (attendance: any) => {
    const db = CentralDataService.getDB();
    db.attendance = attendance;
    CentralDataService.saveDB(db);
    storeState.attendance = attendance;
    listeners.forEach(l => l());
  },
  setExams: (exams: any) => {
    const db = CentralDataService.getDB();
    db.exams = exams;
    CentralDataService.saveDB(db);
    storeState.exams = exams;
    listeners.forEach(l => l());
  },
  setMarks: (marks: any) => {
    const db = CentralDataService.getDB();
    db.marks = marks;
    CentralDataService.saveDB(db);
    storeState.marks = marks;
    listeners.forEach(l => l());
  },
  setTimetable: (timetable: any) => {
    const db = CentralDataService.getDB();
    db.timetable = timetable;
    CentralDataService.saveDB(db);
    storeState.timetable = timetable;
    listeners.forEach(l => l());
  },
  setNotices: (notices: any) => {
    const db = CentralDataService.getDB();
    db.notices = notices;
    CentralDataService.saveDB(db);
    storeState.notices = notices;
    listeners.forEach(l => l());
  },
  setEvents: (events: any) => {
    const db = CentralDataService.getDB();
    db.events = events;
    CentralDataService.saveDB(db);
    storeState.events = events;
    listeners.forEach(l => l());
  },
  setState: (partial: any) => {
    const db = CentralDataService.getDB();
    const updates = typeof partial === 'function' ? partial(storeState) : partial;
    const newDb = { ...db, ...updates };
    CentralDataService.saveDB(newDb);
    storeState = { ...storeState, ...updates };
    listeners.forEach(l => l());
  },
  exportBackup: () => {
    const db = CentralDataService.getDB();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `munyaka_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
  refreshStore: () => {
    const fresh = getFreshCentralState();
    storeState = { ...storeState, ...fresh };
    listeners.forEach(l => l());
  }
};

// Initial load from CentralDataService
const initialFresh = getFreshCentralState();
storeState = { ...storeState, ...initialFresh };

// Listen to CentralDataService changes across windows/components
if (typeof window !== 'undefined') {
  window.addEventListener('munyaka_data_changed', () => {
    const fresh = getFreshCentralState();
    storeState = { ...storeState, ...fresh };
    listeners.forEach(l => l());
  });
  window.addEventListener('munyaka:data-changed', () => {
    const fresh = getFreshCentralState();
    storeState = { ...storeState, ...fresh };
    listeners.forEach(l => l());
  });
}

const useSchoolStoreImpl = (selector?: (state: SchoolStore) => any) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (selector) {
    return selector(storeState);
  }
  return storeState;
};

export const useSchoolStore: SchoolStoreHook = Object.assign(useSchoolStoreImpl, {
  getState: () => {
    const fresh = getFreshCentralState();
    storeState = { ...storeState, ...fresh };
    return storeState;
  },
  setState: (partial: any) => {
    const db = CentralDataService.getDB();
    const updates = typeof partial === 'function' ? partial(storeState) : partial;
    const newDb = { ...db, ...updates };
    CentralDataService.saveDB(newDb);
    storeState = { ...storeState, ...updates };
    listeners.forEach(l => l());
  }
});

export default useSchoolStore;
