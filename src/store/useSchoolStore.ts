import React, { useState, useEffect, createContext, useContext } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

export interface SchoolState {
  learners: any[];
  staff: any[];
  fees: any[];
  attendance: any[];
  exams: any[];
  marks: any[];
  timetable: any;
  settings: any;
  notices: any[];
  events: any[];
  studyMaterials: any[];
  libraryBooks: any[];
  libraryLogs: any[];
  ictEquipment: any[];
  scienceInventory: any[];
  storeInventory: any[];
  setLearners: (learners: any[]) => void;
  setStaff: (staff: any[]) => void;
  setFees: (fees: any[]) => void;
  setAttendance: (attendance: any[]) => void;
  setExams: (exams: any[]) => void;
  setMarks: (marks: any[]) => void;
  setTimetable: (timetable: any) => void;
  setSettings: (settings: any) => void;
  setNotices: (notices: any[]) => void;
  setEvents: (events: any[]) => void;
  setStudyMaterials: (studyMaterials: any[]) => void;
  setLibraryBooks: (libraryBooks: any[]) => void;
  setLibraryLogs: (libraryLogs: any[]) => void;
  setIctEquipment: (ictEquipment: any[]) => void;
  setScienceInventory: (scienceInventory: any[]) => void;
  setStoreInventory: (storeInventory: any[]) => void;
  refreshStore: () => void;
}

const getInitialStorage = (key: string, fallback: any) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
  }
  return fallback;
};

const SchoolStoreContext = createContext<SchoolState | null>(null);

export const SchoolStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearnersState] = useState<any[]>(() =>
    getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', initialSeedData.students || []))
  );
  const [staff, setStaffState] = useState<any[]>(() => {
    const s1 = getInitialStorage('munyaka_staff', null);
    const s2 = getInitialStorage('munyaka_staff_directory', null);
    const s3 = getInitialStorage('munyaka_master_staff_list', null);
    const s4 = getInitialStorage('staff', null);
    const list = s1 || s2 || s3 || s4 || initialSeedData.staff || [];
    return Array.isArray(list) ? list : [];
  });
  const [fees, setFeesState] = useState<any[]>(() =>
    getInitialStorage('munyaka_fees', (initialSeedData as any).fees || [])
  );
  const [attendance, setAttendanceState] = useState<any[]>(() =>
    getInitialStorage('munyaka_attendance', (initialSeedData as any).attendance || [])
  );
  const [exams, setExamsState] = useState<any[]>(() =>
    getInitialStorage('all_set_exams', (initialSeedData as any).exams || [])
  );
  const [marks, setMarksState] = useState<any[]>(() =>
    getInitialStorage('marked_student_submissions', (initialSeedData as any).marks || [])
  );
  const [timetable, setTimetableState] = useState<any>(() =>
    getInitialStorage('school-timetable-data', (initialSeedData as any).timetable || {})
  );
  const [settings, setSettingsState] = useState<any>(() =>
    getInitialStorage('munyaka_system_settings_v3', (initialSeedData as any).settings || {})
  );
  const [notices, setNoticesState] = useState<any[]>(() =>
    getInitialStorage('munyaka_notices', (initialSeedData as any).notices || [])
  );
  const [events, setEventsState] = useState<any[]>(() =>
    getInitialStorage('munyaka_events', (initialSeedData as any).events || [])
  );
  const [studyMaterials, setStudyMaterialsState] = useState<any[]>(() =>
    getInitialStorage('munyaka_study_materials', (initialSeedData as any).studyCorner || [])
  );
  const [libraryBooks, setLibraryBooksState] = useState<any[]>(() =>
    getInitialStorage('munyaka_library_books', (initialSeedData as any).libraryBooks || [])
  );
  const [libraryLogs, setLibraryLogsState] = useState<any[]>(() =>
    getInitialStorage('munyaka_library_borrowings', (initialSeedData as any).libraryLogs || [])
  );
  const [ictEquipment, setIctEquipmentState] = useState<any[]>(() =>
    getInitialStorage('munyaka_ict_assets', (initialSeedData as any).ictEquipment || [])
  );
  const [scienceInventory, setScienceInventoryState] = useState<any[]>(() =>
    getInitialStorage('munyaka_science_lab', (initialSeedData as any).scienceInventory || [])
  );
  const [storeInventory, setStoreInventoryState] = useState<any[]>(() =>
    getInitialStorage('munyaka_store_items', (initialSeedData as any).storeInventory || [])
  );

  const refreshStore = () => {
    setLearnersState(
      getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', initialSeedData.students || []))
    );
    const s1 = getInitialStorage('munyaka_staff', null);
    const s2 = getInitialStorage('munyaka_staff_directory', null);
    const s3 = getInitialStorage('munyaka_master_staff_list', null);
    const s4 = getInitialStorage('staff', null);
    const staffList = s1 || s2 || s3 || s4 || initialSeedData.staff || [];
    setStaffState(Array.isArray(staffList) ? staffList : []);

    setFeesState(getInitialStorage('munyaka_fees', (initialSeedData as any).fees || []));
    setAttendanceState(getInitialStorage('munyaka_attendance', (initialSeedData as any).attendance || []));
    setExamsState(getInitialStorage('all_set_exams', (initialSeedData as any).exams || []));
    setMarksState(getInitialStorage('marked_student_submissions', (initialSeedData as any).marks || []));
    setTimetableState(getInitialStorage('school-timetable-data', (initialSeedData as any).timetable || {}));
    setSettingsState(getInitialStorage('munyaka_system_settings_v3', (initialSeedData as any).settings || {}));
    setNoticesState(getInitialStorage('munyaka_notices', (initialSeedData as any).notices || []));
    setEventsState(getInitialStorage('munyaka_events', (initialSeedData as any).events || []));
    setStudyMaterialsState(getInitialStorage('munyaka_study_materials', (initialSeedData as any).studyCorner || []));
    setLibraryBooksState(getInitialStorage('munyaka_library_books', (initialSeedData as any).libraryBooks || []));
    setLibraryLogsState(getInitialStorage('munyaka_library_borrowings', (initialSeedData as any).libraryLogs || []));
    setIctEquipmentState(getInitialStorage('munyaka_ict_assets', (initialSeedData as any).ictEquipment || []));
    setScienceInventoryState(getInitialStorage('munyaka_science_lab', (initialSeedData as any).scienceInventory || []));
    setStoreInventoryState(getInitialStorage('munyaka_store_items', (initialSeedData as any).storeInventory || []));
  };

  useEffect(() => {
    const handleStorage = () => refreshStore();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka:data-changed', handleStorage);
    window.addEventListener('munyaka_learners_updated', handleStorage);
    window.addEventListener('staff-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka:data-changed', handleStorage);
      window.removeEventListener('munyaka_learners_updated', handleStorage);
      window.removeEventListener('staff-changed', handleStorage);
    };
  }, []);

  const setLearners = (newLearners: any[]) => {
    localStorage.setItem('munyaka_students', JSON.stringify(newLearners));
    localStorage.setItem('school_learners_data', JSON.stringify(newLearners));
    setLearnersState(newLearners);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));
  };

  const setStaff = (newStaff: any[]) => {
    localStorage.setItem('munyaka_staff', JSON.stringify(newStaff));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(newStaff));
    localStorage.setItem('staff', JSON.stringify(newStaff));
    setStaffState(newStaff);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    window.dispatchEvent(new CustomEvent('staff-changed'));
  };

  const setFees = (newFees: any[]) => {
    localStorage.setItem('munyaka_fees', JSON.stringify(newFees));
    setFeesState(newFees);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setAttendance = (newAttendance: any[]) => {
    localStorage.setItem('munyaka_attendance', JSON.stringify(newAttendance));
    setAttendanceState(newAttendance);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setExams = (newExams: any[]) => {
    localStorage.setItem('all_set_exams', JSON.stringify(newExams));
    setExamsState(newExams);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setMarks = (newMarks: any[]) => {
    localStorage.setItem('marked_student_submissions', JSON.stringify(newMarks));
    setMarksState(newMarks);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setTimetable = (newTimetable: any) => {
    localStorage.setItem('school-timetable-data', JSON.stringify(newTimetable));
    setTimetableState(newTimetable);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setSettings = (newSettings: any) => {
    localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(newSettings));
    setSettingsState(newSettings);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setNotices = (newNotices: any[]) => {
    localStorage.setItem('munyaka_notices', JSON.stringify(newNotices));
    setNoticesState(newNotices);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setEvents = (newEvents: any[]) => {
    localStorage.setItem('munyaka_events', JSON.stringify(newEvents));
    setEventsState(newEvents);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setStudyMaterials = (newStudy: any[]) => {
    localStorage.setItem('munyaka_study_materials', JSON.stringify(newStudy));
    setStudyMaterialsState(newStudy);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setLibraryBooks = (newBooks: any[]) => {
    localStorage.setItem('munyaka_library_books', JSON.stringify(newBooks));
    setLibraryBooksState(newBooks);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setLibraryLogs = (newLogs: any[]) => {
    localStorage.setItem('munyaka_library_borrowings', JSON.stringify(newLogs));
    setLibraryLogsState(newLogs);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setIctEquipment = (newIct: any[]) => {
    localStorage.setItem('munyaka_ict_assets', JSON.stringify(newIct));
    setIctEquipmentState(newIct);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setScienceInventory = (newSci: any[]) => {
    localStorage.setItem('munyaka_science_lab', JSON.stringify(newSci));
    setScienceInventoryState(newSci);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const setStoreInventory = (newStore: any[]) => {
    localStorage.setItem('munyaka_store_items', JSON.stringify(newStore));
    setStoreInventoryState(newStore);
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
  };

  const contextValue: SchoolState = {
    learners,
    staff,
    fees,
    attendance,
    exams,
    marks,
    timetable,
    settings,
    notices,
    events,
    studyMaterials,
    libraryBooks,
    libraryLogs,
    ictEquipment,
    scienceInventory,
    storeInventory,
    setLearners,
    setStaff,
    setFees,
    setAttendance,
    setExams,
    setMarks,
    setTimetable,
    setSettings,
    setNotices,
    setEvents,
    setStudyMaterials,
    setLibraryBooks,
    setLibraryLogs,
    setIctEquipment,
    setScienceInventory,
    setStoreInventory,
    refreshStore,
  };

  return React.createElement(SchoolStoreContext.Provider, { value: contextValue }, children);
};

export const useSchoolStore = () => {
  const context = useContext(SchoolStoreContext);
  if (!context) {
    // Return standalone accessor if outside provider
    const learners = getInitialStorage('munyaka_students', getInitialStorage('school_learners_data', initialSeedData.students || []));
    const s1 = getInitialStorage('munyaka_staff', null);
    const s2 = getInitialStorage('munyaka_staff_directory', null);
    const s3 = getInitialStorage('munyaka_master_staff_list', null);
    const s4 = getInitialStorage('staff', null);
    const staff = s1 || s2 || s3 || s4 || initialSeedData.staff || [];
    const fees = getInitialStorage('munyaka_fees', (initialSeedData as any).fees || []);
    const attendance = getInitialStorage('munyaka_attendance', (initialSeedData as any).attendance || []);
    const exams = getInitialStorage('all_set_exams', (initialSeedData as any).exams || []);
    const marks = getInitialStorage('marked_student_submissions', (initialSeedData as any).marks || []);
    const timetable = getInitialStorage('school-timetable-data', (initialSeedData as any).timetable || {});
    const settings = getInitialStorage('munyaka_system_settings_v3', (initialSeedData as any).settings || {});

    return {
      learners,
      staff,
      fees,
      attendance,
      exams,
      marks,
      timetable,
      settings,
      setLearners: (newLearners: any[]) => {
        localStorage.setItem('munyaka_students', JSON.stringify(newLearners));
        localStorage.setItem('school_learners_data', JSON.stringify(newLearners));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setStaff: (newStaff: any[]) => {
        localStorage.setItem('munyaka_staff', JSON.stringify(newStaff));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setFees: (newFees: any[]) => {
        localStorage.setItem('munyaka_fees', JSON.stringify(newFees));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setAttendance: (newAttendance: any[]) => {
        localStorage.setItem('munyaka_attendance', JSON.stringify(newAttendance));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setExams: (newExams: any[]) => {
        localStorage.setItem('all_set_exams', JSON.stringify(newExams));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setMarks: (newMarks: any[]) => {
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
      }
    };
  }
  return context;
};
