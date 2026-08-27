import { useState, useEffect } from 'react';
import { INITIAL_SEED_DATA } from '../data/initialSeedData';

interface Learner {
  id: string;
  status?: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
}

interface Teacher {
  id: string;
  status?: string;
  name?: string;
  role?: string;
}

interface AttendanceLog {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  LEARNERS: 'school_learners_data',
  TEACHERS: 'munyaka_staff_directory',
  TEACHERS_FALLBACK: 'munyaka_staff',
  ATTENDANCE: 'school_attendance_logs',
} as const;

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const getTodayDate = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Compute stats synchronously from central seed data and local storage.
 * Runs once at module load time so the initial render reflects real numbers
 * before the React effect cycle completes.
 */
const computeInitialStats = (): DashboardStats => {
  try {
    // 1. Read learners: localStorage (most recent) -> central seed data -> empty
    const learnersFromLS = safeParse<Learner[]>(localStorage.getItem(STORAGE_KEYS.LEARNERS));
    let learners: Learner[] = [];
    if (Array.isArray(learnersFromLS) && learnersFromLS.length > 0) {
      learners = learnersFromLS;
    } else if (Array.isArray(INITIAL_SEED_DATA.students) && INITIAL_SEED_DATA.students.length > 0) {
      learners = INITIAL_SEED_DATA.students as unknown as Learner[];
    }

    const totalStudents = learners.filter((l) => {
      if (!l) return false;
      if (l.status) return l.status === 'Active' || l.status === 'active';
      return true;
    }).length;

    // 2. Read teachers: localStorage -> central seed data -> empty
    let teachers: Teacher[] = [];
    const teachersFromLS = safeParse<Teacher[]>(localStorage.getItem(STORAGE_KEYS.TEACHERS));
    if (Array.isArray(teachersFromLS) && teachersFromLS.length > 0) {
      teachers = teachersFromLS;
    } else {
      const teachersFromFallback = safeParse<Teacher[]>(localStorage.getItem(STORAGE_KEYS.TEACHERS_FALLBACK));
      if (Array.isArray(teachersFromFallback) && teachersFromFallback.length > 0) {
        teachers = teachersFromFallback;
      } else if (Array.isArray(INITIAL_SEED_DATA.staff) && INITIAL_SEED_DATA.staff.length > 0) {
        teachers = INITIAL_SEED_DATA.staff as unknown as Teacher[];
      }
    }

    const totalTeachers = teachers.filter((t) => {
      if (!t) return false;
      if (t.status) return t.status === 'Active' || t.status === 'active';
      return true;
    }).length;

    // 3. Today's attendance rate
    const todayStr = getTodayDate();
    const attendanceRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const attendance = safeParse<AttendanceLog[]>(attendanceRaw) ?? [];
    const todayRecords = Array.isArray(attendance)
      ? attendance.filter((a) => a?.date === todayStr)
      : [];
    const presentToday = todayRecords.filter(
      (a) => a?.status === 'present' || a?.status === 'late'
    ).length;
    const todayAttendanceRate = totalStudents > 0
      ? Math.round((presentToday / totalStudents) * 100)
      : 0;

    return {
      totalStudents,
      totalTeachers,
      todayAttendanceRate,
      isLoading: false,
    };
  } catch (err) {
    console.error('useDashboardData initial compute error:', err);
    // Last-resort fallback: count from central seed directly
    let fallbackStudents = 0;
    let fallbackTeachers = 0;
    try {
      if (Array.isArray(INITIAL_SEED_DATA.students)) {
        fallbackStudents = INITIAL_SEED_DATA.students.length;
      }
      if (Array.isArray(INITIAL_SEED_DATA.staff)) {
        fallbackTeachers = INITIAL_SEED_DATA.staff.length;
      }
    } catch {
      // Central data unavailable
    }
    return {
      totalStudents: fallbackStudents,
      totalTeachers: fallbackTeachers,
      todayAttendanceRate: 0,
      isLoading: false,
    };
  }
};

export const useDashboardData = (): DashboardStats => {
  // Initialize synchronously from central seed + local storage so the first
  // render already shows accurate numbers (no flash of 0/Standby).
  const [stats, setStats] = useState<DashboardStats>(() => {
    if (typeof window === 'undefined') {
      return { totalStudents: 0, totalTeachers: 0, todayAttendanceRate: 0, isLoading: true };
    }
    return computeInitialStats();
  });

  // Re-compute on mount in case localStorage changed between SSR and client.
  useEffect(() => {
    setStats(computeInitialStats());
  }, []);

  return stats;
};

export default useDashboardData;