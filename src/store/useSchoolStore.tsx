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
