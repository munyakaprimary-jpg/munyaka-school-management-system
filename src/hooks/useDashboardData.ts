import { useState, useEffect } from 'react';

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
  TEACHERS: 'school_teachers_data',
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

export const useDashboardData = (): DashboardStats => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendanceRate: 0,
    isLoading: true,
  });

  useEffect(() => {
    try {
      const learnersRaw = localStorage.getItem(STORAGE_KEYS.LEARNERS);
      const teachersRaw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      const attendanceRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);

      const learners = safeParse<Learner[]>(learnersRaw) ?? [];
      const teachers = safeParse<Teacher[]>(teachersRaw) ?? [];
      const attendance = safeParse<AttendanceLog[]>(attendanceRaw) ?? [];

      const totalStudents = Array.isArray(learners)
        ? learners.filter((l) => l?.status === 'Active' || l?.status === 'active').length
        : 0;

      const totalTeachers = Array.isArray(teachers)
        ? teachers.filter((t) => t?.status === 'Active' || t?.status === 'active').length
        : 0;

      const todayStr = getTodayDate();

      const todayRecords = Array.isArray(attendance)
        ? attendance.filter((a) => a?.date === todayStr)
        : [];

      const presentToday = todayRecords.filter(
        (a) => a?.status === 'present' || a?.status === 'late'
      ).length;

      const todayAttendanceRate = totalStudents > 0
        ? Math.round((presentToday / totalStudents) * 100)
        : 0;

      setStats({
        totalStudents,
        totalTeachers,
        todayAttendanceRate,
        isLoading: false,
      });
    } catch {
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        todayAttendanceRate: 0,
        isLoading: false,
      });
    }
  }, []);

  return stats;
};

export default useDashboardData;