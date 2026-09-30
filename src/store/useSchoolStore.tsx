import React, { useState, useEffect } from 'react';

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

const STORE_VERSION_KEY = 'munyaka_store_version_v3';
const TARGET_STORE_VERSION = 3;

try {
  const currentVersion = parseInt(localStorage.getItem(STORE_VERSION_KEY) || '0', 10);
  if (currentVersion < TARGET_STORE_VERSION) {
    localStorage.setItem(STORE_VERSION_KEY, String(TARGET_STORE_VERSION));
  }
} catch {}

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
    localStorage.setItem('munyaka_campuses', JSON.stringify(campuses));
    storeState.campuses = campuses;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setTenants: (tenants: any[]) => {
    localStorage.setItem('munyaka_tenants', JSON.stringify(tenants));
    storeState.tenants = tenants;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  deleteTenant: (id: string) => {
    const currentTenants = storeState.tenants;
    const updated = currentTenants.filter((t: any) => t.id !== id);
    localStorage.setItem('munyaka_tenants', JSON.stringify(updated));
    storeState.tenants = updated;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  addCampus: (newCampus: Partial<Campus>) => {
    const currentCampuses = storeState.campuses;
    const updated = [
      ...(currentCampuses || []),
      {
        id: Date.now().toString(),
        name: newCampus.name || 'New Campus',
        activeSeats: Number(newCampus.activeSeats) || 0,
        pricePerSeat: Number(newCampus.pricePerSeat) || 250,
        status: newCampus.status || 'Active',
        expiryDate: newCampus.expiryDate || '2027-09-27',
      },
    ];
    localStorage.setItem('munyaka_campuses', JSON.stringify(updated));
    storeState.campuses = updated;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  deleteCampus: (id: string) => {
    const currentCampuses = storeState.campuses;
    const updated = currentCampuses.filter((c: Campus) => c.id !== id);
    localStorage.setItem('munyaka_campuses', JSON.stringify(updated));
    storeState.campuses = updated;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  updateCampusSeats: (id: string, activeSeats: number) => {
    const currentCampuses = storeState.campuses;
    const updated = currentCampuses.map((c: Campus) => c.id === id ? { ...c, activeSeats } : c);
    localStorage.setItem('munyaka_campuses', JSON.stringify(updated));
    storeState.campuses = updated;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setLearners: (learners: any[]) => {
    localStorage.setItem('munyaka_students', JSON.stringify(learners));
    storeState.learners = learners;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setStaff: (staff: any[]) => {
    localStorage.setItem('munyaka_staff', JSON.stringify(staff));
    storeState.staff = staff;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setFees: (fees: any) => {
    localStorage.setItem('munyaka_fees', JSON.stringify(fees));
    storeState.fees = fees;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setAttendance: (attendance: any) => {
    localStorage.setItem('munyaka_attendance', JSON.stringify(attendance));
    storeState.attendance = attendance;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setExams: (exams: any) => {
    localStorage.setItem('all_set_exams', JSON.stringify(exams));
    storeState.exams = exams;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setMarks: (marks: any) => {
    localStorage.setItem('marked_student_submissions', JSON.stringify(marks));
    storeState.marks = marks;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setTimetable: (timetable: any) => {
    localStorage.setItem('munyaka_timetable', JSON.stringify(timetable));
    storeState.timetable = timetable;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setNotices: (notices: any) => {
    localStorage.setItem('munyaka_notices_board', JSON.stringify(notices));
    storeState.notices = notices;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setEvents: (events: any) => {
    localStorage.setItem('munyaka_events', JSON.stringify(events));
    storeState.events = events;
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  },
  setState: (partial: any) => {
    if (typeof partial === 'function') {
      storeState = { ...storeState, ...partial(storeState) };
    } else {
      storeState = { ...storeState, ...partial };
    }
    listeners.forEach(l => l());
  },
  exportBackup: () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `munyaka_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
  refreshStore: () => {
    try {
      storeState.learners = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
      storeState.staff = JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
      storeState.fees = JSON.parse(localStorage.getItem('munyaka_fees') || '{}');
      storeState.attendance = JSON.parse(localStorage.getItem('munyaka_attendance') || '{}');
      storeState.exams = JSON.parse(localStorage.getItem('all_set_exams') || '[]');
      storeState.marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      storeState.timetable = JSON.parse(localStorage.getItem('munyaka_timetable') || '{}');
      storeState.settings = JSON.parse(localStorage.getItem('munyaka_settings') || '{}');
      storeState.notices = JSON.parse(localStorage.getItem('munyaka_notices_board') || '[]');
      storeState.events = JSON.parse(localStorage.getItem('munyaka_events') || '[]');
      storeState.campuses = JSON.parse(localStorage.getItem('munyaka_campuses') || '[]');
      storeState.tenants = JSON.parse(localStorage.getItem('munyaka_tenants') || '[]');
    } catch {}
    listeners.forEach(l => l());
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  }
};

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
  getState: () => storeState,
  setState: (partial: any) => {
    if (typeof partial === 'function') {
      storeState = { ...storeState, ...partial(storeState) };
    } else {
      storeState = { ...storeState, ...partial };
    }
    listeners.forEach(l => l());
  }
});
