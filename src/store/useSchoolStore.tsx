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
  notices: (initialSeedData as any).notices || [],
  events: (initialSeedData as any).events || []
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
    notices: getInitialStorage('munyaka_notices', storeState.notices),
    events: getInitialStorage('munyaka_events', storeState.events),

    setLearners: (learners: any[]) => {
      localStorage.setItem('munyaka_students', JSON.stringify(learners));
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
      storeState.learners = learners;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      fetch('/api/save-seed', { method: 'POST', body: JSON.stringify(useSchoolStore.getState()) }).catch(() => {});
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
    setSettings: (settings: any) => {
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(settings));
      storeState.settings = settings;
      listeners.forEach(l => l());
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
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

export const SchoolStoreProvider = ({ children }: { children?: any }) => children ?? null;

export default useSchoolStore;
