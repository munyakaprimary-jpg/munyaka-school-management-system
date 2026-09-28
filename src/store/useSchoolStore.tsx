export interface Campus {
  id: string;
  name: string;
  activeSeats: number;
  pricePerSeat: number;
  status: string;
  expiryDate: string;
}

export interface SchoolStore {
  learners: any[];
  staff: any[];
  fees: any[];
  attendance: any;
  exams: any[];
  marks: any[];
  timetable: any;
  settings: any;
  notices: any[];
  events: any[];
  campuses: Campus[];
  tenants: any[];
  addCampus: (campus: Partial<Campus>) => void;
  deleteCampus: (id: string) => void;
  updateCampusSeats: (id: string, activeSeats: number) => void;
  [key: string]: any;
}

import initialSeedData from '../data/initialSeedData';

const getInitialStorage = (key: string, fallback: any) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
    }
  } catch {}
  return fallback;
};

// Versioning and migration helper for guaranteed seed refresh on legacy/stale caches
const STORE_VERSION_KEY = 'munyaka_store_version';
const TARGET_STORE_VERSION = 100;

try {
  const currentVersion = parseInt(localStorage.getItem(STORE_VERSION_KEY) || '0', 10);
  if (currentVersion < TARGET_STORE_VERSION) {
    localStorage.setItem(STORE_VERSION_KEY, String(TARGET_STORE_VERSION));
    if (initialSeedData.students) localStorage.setItem('munyaka_students', JSON.stringify(initialSeedData.students));
    if (initialSeedData.staff) localStorage.setItem('munyaka_staff', JSON.stringify(initialSeedData.staff));
    if ((initialSeedData as any).fees) localStorage.setItem('munyaka_fees', JSON.stringify((initialSeedData as any).fees));
    if ((initialSeedData as any).attendance) localStorage.setItem('munyaka_attendance', JSON.stringify((initialSeedData as any).attendance));
  }
} catch {}

let storeState = {
  learners: initialSeedData.students || initialSeedData.learners || [],
  staff: initialSeedData.staff || [],
  fees: (initialSeedData as any).fees || [],
  attendance: (initialSeedData as any).attendance || {},
  exams: (initialSeedData as any).exams || [],
  marks: (initialSeedData as any).marks || [],
  timetable: (initialSeedData as any).timetable || {},
  settings: (initialSeedData as any).settings || {},
  notices: getInitialStorage('munyaka_notices_board', [
    { id: 'not-1', title: 'Opening Day for Term 1', content: 'All students are expected to report back by 8:00 AM sharp in full proper school uniform.', date: 'Today', category: 'Notice', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'not-2', title: 'Parent-Teacher Association AGM', content: 'Annual General Meeting for all parents and guardians to discuss school development and fee structures.', date: '2 days ago', category: 'Event', color: 'bg-emerald-50 text-emerald-600' }
  ]),
  events: (initialSeedData as any).events || [],
    campuses: getInitialStorage('munyaka_campuses', [
      {
        id: '1',
        name: 'Munyaka Primary & Junior School',
        activeSeats: 120,
        pricePerSeat: 250,
        status: 'Active',
        expiryDate: '2027-09-27',
      },
    ]),
    tenants: getInitialStorage('munyaka_tenants', [])
  };

const listeners = new Set<any>();

export const useSchoolStore = (selector?: (state: any) => any) => {
  const state = {
    ...storeState,
    learners: getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', storeState.learners)),
    staff: (() => {
      const s1 = getInitialStorage('munyaka_staff', null);
      const s2 = getInitialStorage('munyaka_staff_directory', null);
      const s3 = getInitialStorage('munyaka_master_staff_list', null);
      const s4 = getInitialStorage('staff', null);
      const list = s1 || s2 || s3 || s4;
      if (Array.isArray(list) && list.length > 0) return list;
      return storeState.staff;
    })(),
    fees: getInitialStorage('munyaka_fees', storeState.fees),
    attendance: getInitialStorage('munyaka_attendance', storeState.attendance),
    exams: getInitialStorage('all_set_exams', storeState.exams),
    marks: getInitialStorage('marked_student_submissions', storeState.marks),
    timetable: getInitialStorage('school-timetable-data', storeState.timetable),
    settings: getInitialStorage('munyaka_system_settings_v3', storeState.settings),
    notices: getInitialStorage('munyaka_notices_board', storeState.notices),
    events: getInitialStorage('munyaka_events', storeState.events),
    campuses: getInitialStorage('munyaka_campuses', storeState.campuses),
        tenants: getInitialStorage('munyaka_tenants', storeState.tenants),
    
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
              const currentTenants = getInitialStorage('munyaka_tenants', storeState.tenants);
              const updated = currentTenants.filter((t: any) => t.id !== id);
              localStorage.setItem('munyaka_tenants', JSON.stringify(updated));
              storeState.tenants = updated;
              listeners.forEach(l => l());
              window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
            },
            addCampus: (newCampus: Partial<Campus>) => {
      const currentCampuses = getInitialStorage('munyaka_campuses', storeState.campuses);
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
      const currentCampuses = getInitialStorage('munyaka_campuses', storeState.campuses);
      const updated = currentCampuses.filter((c: Campus) => c.id !== id);
      localStorage.setItem('munyaka_campuses', JSON.stringify(updated));
      storeState.campuses = updated;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    updateCampusSeats: (id: string, activeSeats: number) => {
      const currentCampuses = getInitialStorage('munyaka_campuses', storeState.campuses);
      const updated = currentCampuses.map((c: Campus) => c.id === id ? { ...c, activeSeats } : c);
      localStorage.setItem('munyaka_campuses', JSON.stringify(updated));
      storeState.campuses = updated;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },

    setLearners: (learners: any[]) => {
      localStorage.setItem('munyaka_students', JSON.stringify(learners));
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
      storeState.learners = learners;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setStaff: (staff: any[]) => {
      localStorage.setItem('munyaka_staff', JSON.stringify(staff));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(staff));
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(staff));
      storeState.staff = staff;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      window.dispatchEvent(new CustomEvent('staff-changed'));
    },
    setFees: (fees: any[]) => {
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
    setExams: (exams: any[]) => {
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
      localStorage.setItem('school-timetable-data', JSON.stringify(timetable));
      storeState.timetable = timetable;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setNotices: (notices: any[]) => {
      localStorage.setItem('munyaka_notices_board', JSON.stringify(notices));
      storeState.notices = notices;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    addNotice: (notice: any) => {
      const current = getInitialStorage('munyaka_notices_board', storeState.notices);
      const updated = [notice, ...current];
      localStorage.setItem('munyaka_notices_board', JSON.stringify(updated));
      storeState.notices = updated;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    deleteNotice: (id: string) => {
      const current = getInitialStorage('munyaka_notices_board', storeState.notices);
      const updated = current.filter((n: any) => n.id !== id);
      localStorage.setItem('munyaka_notices_board', JSON.stringify(updated));
      storeState.notices = updated;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    exportBackup: () => {
      const state = useSchoolStore();
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        staff: state.staff,
        learners: state.learners,
        attendance: state.attendance,
        fees: state.fees,
        exams: state.exams,
        marks: state.marks,
        notices: state.notices || [],
        timetables: getInitialStorage('munyaka_timetable_allocations', []),
        timetableConfig: getInitialStorage('munyaka_timetable_config_dual_breaks', {}),
        customLearningAreas: getInitialStorage('munyaka_cbc_learning_area_clusters', null)
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `munyaka_school_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importBackup: (jsonData: string) => {
      try {
        const data = JSON.parse(jsonData);
        if (data && typeof data === 'object') {
          const importedStaff = data.staff || data.teachers || [];
          const importedLearners = data.learners || data.students || [];
          const importedFees = data.feeRecords || data.fees || data.transactions || [];
          const importedAttendance = data.attendance || {};
          const importedExams = data.exams || [];
          const importedMarks = data.marks || [];

          if (importedStaff.length > 0) localStorage.setItem('munyaka_staff', JSON.stringify(importedStaff));
          if (importedLearners.length > 0) {
            localStorage.setItem('munyaka_students', JSON.stringify(importedLearners));
            localStorage.setItem('school_learners_data', JSON.stringify(importedLearners));
          }
          if (importedFees.length > 0) localStorage.setItem('munyaka_fees', JSON.stringify(importedFees));
          if (importedAttendance && Object.keys(importedAttendance).length > 0) {
            localStorage.setItem('munyaka_attendance', JSON.stringify(importedAttendance));
          }
          if (importedExams.length > 0) localStorage.setItem('all_set_exams', JSON.stringify(importedExams));
          if (importedMarks.length > 0) localStorage.setItem('marked_student_submissions', JSON.stringify(importedMarks));

          if (data.timetables) localStorage.setItem('munyaka_timetable_allocations', JSON.stringify(data.timetables));
          if (data.timetableConfig) localStorage.setItem('munyaka_timetable_config_dual_breaks', JSON.stringify(data.timetableConfig));
          if (data.notices) {
            localStorage.setItem('munyaka_notices_board', JSON.stringify(data.notices));
            storeState.notices = data.notices;
          }
          if (data.customLearningAreas) {
            localStorage.setItem('munyaka_cbc_learning_area_clusters', JSON.stringify(data.customLearningAreas));
            window.dispatchEvent(new Event('learning_areas_updated'));
          }

          storeState.learners = getInitialStorage('munyaka_students', importedLearners);
          storeState.staff = getInitialStorage('munyaka_staff', importedStaff);
          storeState.fees = getInitialStorage('munyaka_fees', importedFees);
          storeState.attendance = getInitialStorage('munyaka_attendance', importedAttendance);
          storeState.exams = getInitialStorage('all_set_exams', importedExams);
          storeState.marks = getInitialStorage('marked_student_submissions', importedMarks);

          listeners.forEach(l => l());
          window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
          window.dispatchEvent(new CustomEvent('staff-changed'));

          const restoredSummary = `Successfully restored ${importedFees.length} fee records and ${importedLearners.length} students!`;
          if (typeof window !== 'undefined' && (window as any).alert) {
            console.log(restoredSummary);
          }
          return true;
        }
      } catch (err) {
        console.error('Backup import error:', err);
      }
      return false;
    },
    refreshStore: () => {
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    syncFromStorage: () => {
      listeners.forEach(l => l());
    },
    setState: (partial: any) => {
      if (typeof partial === 'function') {
        partial = partial(storeState);
      }
      if (partial.learners) state.setLearners(partial.learners);
      if (partial.staff) state.setStaff(partial.staff);
      if (partial.fees) state.setFees(partial.fees);
      if (partial.attendance) state.setAttendance(partial.attendance);
      if (partial.exams) state.setExams(partial.exams);
      if (partial.marks) state.setMarks(partial.marks);
      if (partial.timetable) state.setTimetable(partial.timetable);
      if (partial.settings) state.setSettings(partial.settings);
    }
  };

  if (selector) {
    return selector(state);
  }
  return state;
};

(useSchoolStore as any).getState = () => useSchoolStore();
(useSchoolStore as any).setState = (partial: any) => {
  const st = useSchoolStore();
  st.setState(partial);
};
