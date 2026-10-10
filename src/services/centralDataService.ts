export const safeParse = (key: string, fallback: any = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key}`, e);
    return fallback;
  }
};

export const getLearners = () => {
  try {
    const raw = safeParse('munyaka_master_learners', null) || safeParse('munyaka_learners', []);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export const getStaff = () => {
  try {
    const raw = safeParse('munyaka_master_staff_list', []);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export const getMasterData = () => {
  try {
    const learners = getLearners();
    const staff = getStaff();
    return {
      learners,
      totalLearners: learners.length,
      staff,
      totalStaff: staff.length
    };
  } catch {
    return { learners: [], totalLearners: 0, staff: [], totalStaff: 0 };
  }
};

export const CentralDataService = {
  safeParse,
  getLearners,
  getStaff,
  getMasterData,
  getSystemStats: () => {
    try {
      const learners = getLearners();
      const staff = getStaff();
      const attendanceList = safeParse('munyaka_attendance', []);
      const attendanceCount = Array.isArray(attendanceList) ? attendanceList.length : Object.keys(attendanceList || {}).length;

      const feesList = safeParse('munyaka_fees', []) || safeParse('munyaka_fees_records', []);
      const feeRecordsCount = Array.isArray(feesList) ? feesList.length : Object.keys(feesList || {}).length;

      const examsList = safeParse('munyaka_exams', []) || safeParse('munyaka_all_set_exams', []);
      const examsCount = Array.isArray(examsList) ? examsList.length : Object.keys(examsList || {}).length;

      const teachingStaff = staff.length;
      const nonTeachingStaff = staff.filter((s: any) => s.category === 'Bursar' || s.category === 'Store Master' || s.type === 'non-teaching' || s.role === 'support').length;

      return {
        learners: learners.length,
        teachingStaff: teachingStaff > 0 ? teachingStaff : staff.length,
        nonTeachingStaff,
        attendance: attendanceCount,
        feeRecords: feeRecordsCount,
        exams: examsCount
      };
    } catch (e) {
      console.error('Error computing system stats:', e);
      return {
        learners: 0,
        teachingStaff: 0,
        nonTeachingStaff: 0,
        attendance: 0,
        feeRecords: 0,
        exams: 0
      };
    }
  },

  getFullStateDump: () => {
    try {
      const allState: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              allState[key] = JSON.parse(val);
            } catch {
              allState[key] = val;
            }
          }
        }
      }
      return allState;
    } catch (e) {
      return {};
    }
  }
};

export default CentralDataService;
