import React, { useState, useEffect, createContext, useContext } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

// Versioning and migration helper for guaranteed seed refresh on legacy/stale caches
const STORE_VERSION_KEY = 'munyaka_store_version';
const TARGET_STORE_VERSION = 100;

try {
  const currentVersion = parseInt(localStorage.getItem(STORE_VERSION_KEY) || '0', 10);
  if (currentVersion < TARGET_STORE_VERSION) {
    console.log(`[useSchoolStore] Migrating store version from ${currentVersion} to ${TARGET_STORE_VERSION} — loading complete bundled seed data.`);
    localStorage.setItem(STORE_VERSION_KEY, String(TARGET_STORE_VERSION));
    if (initialSeedData.students) localStorage.setItem('munyaka_students', JSON.stringify(initialSeedData.students));
    if (initialSeedData.staff) localStorage.setItem('munyaka_staff', JSON.stringify(initialSeedData.staff));
    if ((initialSeedData as any).fees) localStorage.setItem('munyaka_fees', JSON.stringify((initialSeedData as any).fees));
    if ((initialSeedData as any).attendance) localStorage.setItem('munyaka_attendance', JSON.stringify((initialSeedData as any).attendance));
  }
} catch (e) {
  console.error('[useSchoolStore] Migration check failed:', e);
}

const SchoolStoreContext = createContext<any>(null);

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

export const SchoolStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearnersState] = useState<any[]>(() => {
    const s1 = getInitialStorage('munyaka_students', null);
    const s2 = getInitialStorage('school_learners_data', null);
    const list = s1 || s2;
    if (Array.isArray(list) && list.length > 0) return list;
    return initialSeedData.students || [];
  });

  const [staff, setStaffState] = useState<any[]>(() => {
    const s1 = getInitialStorage('munyaka_staff', null);
    const s2 = getInitialStorage('munyaka_staff_directory', null);
    const s3 = getInitialStorage('munyaka_master_staff_list', null);
    const s4 = getInitialStorage('staff', null);
    const list = s1 || s2 || s3 || s4;
    if (Array.isArray(list) && list.length > 0) return list;
    return initialSeedData.staff || [];
  });

  const [fees, setFeesState] = useState<any[]>(() => {
    const f1 = getInitialStorage('munyaka_fees', null);
    const f2 = getInitialStorage('munyaka_fees_records', null);
    const list = f1 || f2;
    if (Array.isArray(list) && list.length > 0) return list;
    return (initialSeedData as any).fees || [];
  });

  const [attendance, setAttendanceState] = useState<any>(() => {
    return getInitialStorage('munyaka_attendance', (initialSeedData as any).attendance || {});
  });

  const [exams, setExamsState] = useState<any[]>(() => {
    return getInitialStorage('all_set_exams', (initialSeedData as any).exams || []);
  });

  const [marks, setMarksState] = useState<any>(() => {
    return getInitialStorage('marked_student_submissions', (initialSeedData as any).marks || []);
  });

  const [timetable, setTimetableState] = useState<any>(() => {
    return getInitialStorage('school-timetable-data', (initialSeedData as any).timetable || {});
  });

  const [settings, setSettingsState] = useState<any>(() => {
    return getInitialStorage('munyaka_system_settings_v3', (initialSeedData as any).settings || {});
  });

  const syncFromStorage = () => {
    const s1 = getInitialStorage('munyaka_students', null);
    const s2 = getInitialStorage('school_learners_data', null);
    const lList = s1 || s2;
    if (Array.isArray(lList) && lList.length > 0) setLearnersState(lList);

    const st1 = getInitialStorage('munyaka_staff', null);
    const st2 = getInitialStorage('munyaka_staff_directory', null);
    const st3 = getInitialStorage('munyaka_master_staff_list', null);
    const st4 = getInitialStorage('staff', null);
    const stList = (st1 && st1.length > 0 ? st1 : null) || (st2 && st2.length > 0 ? st2 : null) || (st3 && st3.length > 0 ? st3 : null) || (st4 && st4.length > 0 ? st4 : null) || initialSeedData.staff || [];
    if (Array.isArray(stList) && stList.length > 0) setStaffState(stList);

    const f1 = getInitialStorage('munyaka_fees', null);
    const f2 = getInitialStorage('munyaka_fees_records', null);
    const fList = f1 || f2;
    if (Array.isArray(fList)) setFeesState(fList);

    const att = getInitialStorage('munyaka_attendance', null);
    if (att) setAttendanceState(att);

    const ex = getInitialStorage('all_set_exams', null);
    if (Array.isArray(ex)) setExamsState(ex);

    const mk = getInitialStorage('marked_student_submissions', null);
    if (mk) setMarksState(mk);

    const tt = getInitialStorage('school-timetable-data', null);
    if (tt) setTimetableState(tt);

    const st = getInitialStorage('munyaka_system_settings_v3', null);
    if (st) setSettingsState(st);
  };

  useEffect(() => {
    syncFromStorage();
    const handleDataChange = () => syncFromStorage();
    window.addEventListener('munyaka:data-changed', handleDataChange);
    window.addEventListener('staff-changed', handleDataChange);
    window.addEventListener('students-updated', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('munyaka:data-changed', handleDataChange);
      window.removeEventListener('staff-changed', handleDataChange);
      window.removeEventListener('students-updated', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, []);

  const setLearners = (newLearners: any[]) => {
    setLearnersState(newLearners);
    localStorage.setItem('munyaka_students', JSON.stringify(newLearners));
    localStorage.setItem('school_learners_data', JSON.stringify(newLearners));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setStaff = (newStaff: any[]) => {
    setStaffState(newStaff);
    localStorage.setItem('munyaka_staff', JSON.stringify(newStaff));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(newStaff));
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(newStaff));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    window.dispatchEvent(new CustomEvent('staff-changed'));
  };

  const setFees = (newFees: any[]) => {
    setFeesState(newFees);
    localStorage.setItem('munyaka_fees', JSON.stringify(newFees));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setAttendance = (newAttendance: any) => {
    setAttendanceState(newAttendance);
    localStorage.setItem('munyaka_attendance', JSON.stringify(newAttendance));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setExams = (newExams: any[]) => {
    setExamsState(newExams);
    localStorage.setItem('all_set_exams', JSON.stringify(newExams));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setMarks = (newMarks: any) => {
    setMarksState(newMarks);
    localStorage.setItem('marked_student_submissions', JSON.stringify(newMarks));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setTimetable = (newTimetable: any) => {
    setTimetableState(newTimetable);
    localStorage.setItem('school-timetable-data', JSON.stringify(newTimetable));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setSettings = (newSettings: any) => {
    setSettingsState(newSettings);
    localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const refreshStore = () => {
    syncFromStorage();
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setState = (partial: any) => {
    if (typeof partial === 'function') {
      const current = { learners, staff, fees, attendance, exams, marks, timetable, settings };
      partial = partial(current);
    }
    if (partial.learners) setLearners(partial.learners);
    if (partial.staff) setStaff(partial.staff);
    if (partial.fees) setFees(partial.fees);
    if (partial.attendance) setAttendance(partial.attendance);
    if (partial.exams) setExams(partial.exams);
    if (partial.marks) setMarks(partial.marks);
    if (partial.timetable) setTimetable(partial.timetable);
    if (partial.settings) setSettings(partial.settings);
  };

  const value = {
    learners,
    staff,
    fees,
    attendance,
    exams,
    marks,
    timetable,
    settings,
    setLearners,
    setStaff,
    setFees,
    setAttendance,
    setExams,
    setMarks,
    setTimetable,
    setSettings,
    refreshStore,
    syncFromStorage,
    setState
  };

  return <SchoolStoreContext.Provider value={value}>{children}</SchoolStoreContext.Provider>;
};

export const useSchoolStore = (selector?: (state: any) => any) => {
  const context = useContext(SchoolStoreContext);

  const standaloneState = {
    learners: getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', initialSeedData.students || [])),
    staff: (() => {
      const s1 = getInitialStorage('munyaka_staff', null);
      const s2 = getInitialStorage('munyaka_staff_directory', null);
      const s3 = getInitialStorage('munyaka_master_staff_list', null);
      const s4 = getInitialStorage('staff', null);
      const list = s1 || s2 || s3 || s4;
      if (Array.isArray(list) && list.length > 0) return list;
      return initialSeedData.staff || [];
    })(),
    fees: getInitialStorage('munyaka_fees', (initialSeedData as any).fees || []),
    attendance: getInitialStorage('munyaka_attendance', (initialSeedData as any).attendance || {}),
    exams: getInitialStorage('all_set_exams', (initialSeedData as any).exams || []),
    marks: getInitialStorage('marked_student_submissions', (initialSeedData as any).marks || []),
    timetable: getInitialStorage('school-timetable-data', (initialSeedData as any).timetable || {}),
    settings: getInitialStorage('munyaka_system_settings_v3', (initialSeedData as any).settings || {}),
    setLearners: (newLearners: any[]) => {
      localStorage.setItem('munyaka_students', JSON.stringify(newLearners));
      localStorage.setItem('school_learners_data', JSON.stringify(newLearners));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setStaff: (newStaff: any[]) => {
      localStorage.setItem('munyaka_staff', JSON.stringify(newStaff));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(newStaff));
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(newStaff));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      window.dispatchEvent(new CustomEvent('staff-changed'));
    },
    setFees: (newFees: any[]) => {
      localStorage.setItem('munyaka_fees', JSON.stringify(newFees));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setAttendance: (newAttendance: any) => {
      localStorage.setItem('munyaka_attendance', JSON.stringify(newAttendance));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setExams: (newExams: any[]) => {
      localStorage.setItem('all_set_exams', JSON.stringify(newExams));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setMarks: (newMarks: any) => {
      localStorage.setItem('marked_student_submissions', JSON.stringify(newMarks));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setTimetable: (newTimetable: any) => {
      localStorage.setItem('school-timetable-data', JSON.stringify(newTimetable));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setSettings: (newSettings: any) => {
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(newSettings));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    refreshStore: () => {
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    syncFromStorage: () => {
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    },
    setState: (partialState: any) => {
      if (typeof partialState === 'function') {
        const current = { learners: standaloneState.learners, staff: standaloneState.staff, fees: standaloneState.fees, attendance: standaloneState.attendance, exams: standaloneState.exams, marks: standaloneState.marks, timetable: standaloneState.timetable, settings: standaloneState.settings };
        partialState = partialState(current);
      }
      if (partialState.learners) standaloneState.setLearners(partialState.learners);
      if (partialState.staff) standaloneState.setStaff(partialState.staff);
      if (partialState.fees) standaloneState.setFees(partialState.fees);
      if (partialState.attendance) standaloneState.setAttendance(partialState.attendance);
      if (partialState.exams) standaloneState.setExams(partialState.exams);
      if (partialState.marks) standaloneState.setMarks(partialState.marks);
      if (partialState.timetable) standaloneState.setTimetable(partialState.timetable);
      if (partialState.settings) standaloneState.setSettings(partialState.settings);
      window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    }
  };

  const target = context || standaloneState;

  (useSchoolStore as any).setState = (target as any).setState || ((partial: any) => {
    if (context && (context as any).setState) {
      (context as any).setState(partial);
    } else {
      standaloneState.setState(partial);
    }
  });

  (useSchoolStore as any).getState = () => target;

  if (selector) {
    return selector(target);
  }
  return target;
};

(useSchoolStore as any).getState = () => ({
  learners: getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', initialSeedData.students || [])),
  staff: initialSeedData.staff || [],
  syncFromStorage: () => window.dispatchEvent(new CustomEvent('munyaka:data-changed'))
});

(useSchoolStore as any).setState = (partial: any) => {
  try {
    if (partial.learners) localStorage.setItem('munyaka_students', JSON.stringify(partial.learners));
    if (partial.staff) localStorage.setItem('munyaka_staff', JSON.stringify(partial.staff));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  } catch {}
};

export default useSchoolStore;
