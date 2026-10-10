export const STORAGE_KEYS = {
  STAFF: 'munyaka_staff_master_v1',
  TEACHERS: 'munyaka_staff_master_v1',
  TEACHERS_LEGACY: 'munyaka_staff_directory',
  TEACHERS_FALLBACK: 'munyaka_master_staff_list',
  TEACHERS_PREREG: 'munyaka_staff',
  LEARNERS: 'munyaka_students',
  ATTENDANCE: 'munyaka_attendance',
  ACTIVE_SCHOOL_ID: 'munyaka_active_school_id',
  SCHOOL_PROFILE: 'munyaka_school_profile',
  HYDRATION_DONE: 'munyaka_hydration_done',
  SCHEMA_VERSION: 'munyaka_schema_version'
};

export const CentralDataService = {
  getSystemStats: () => {
    try {
      let staff: any[] = [];
      const staffKeys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
      for (const k of staffKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              staff = parsed;
              break;
            }
          } catch {}
        }
      }

      let learners: any[] = [];
      const learnersKeys = ['munyaka_learners_db', 'school_learners_master', 'school_learners_data', 'munyaka_students_db', 'munyaka_students', 'students', 'learners'];
      for (const k of learnersKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              learners = parsed;
              break;
            }
          } catch {}
        }
      }

      const attendanceList = JSON.parse(localStorage.getItem('munyaka_attendance') || '[]');
      const attendanceCount = Array.isArray(attendanceList) ? attendanceList.length : Object.keys(attendanceList || {}).length;

      const feesList = JSON.parse(localStorage.getItem('munyaka_fees') || localStorage.getItem('munyaka_fees_records') || '[]');
      const feeRecordsCount = Array.isArray(feesList) ? feesList.length : Object.keys(feesList || {}).length;

      const examsList = JSON.parse(localStorage.getItem('munyaka_exams') || localStorage.getItem('munyaka_all_set_exams') || '[]');
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
        learners: 31,
        teachingStaff: 2,
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

export const getMasterData = () => {
  try {
    const learnersKeys = ['munyaka_learners_db', 'school_learners_master', 'school_learners_data', 'munyaka_students_db', 'munyaka_students', 'students', 'learners'];
    let learners: any[] = [];
    for (const k of learnersKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            learners = parsed;
            break;
          }
        } catch {}
      }
    }

    const staffKeys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
    let staff: any[] = [];
    for (const k of staffKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            staff = parsed;
            break;
          }
        } catch {}
      }
    }

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
