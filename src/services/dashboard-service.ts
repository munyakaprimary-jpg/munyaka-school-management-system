import { supabase } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';

export interface DashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  todaysAttendanceRate: number | null;
  attendanceTrend: { day: string; rate: number; isFactual: boolean }[];
  classParticipation: {
    className: string;
    enrolled: number;
    presentToday: number;
    attendanceRate: number;
  }[];
  recentAlerts: {
    id: string;
    time: string;
    message: string;
    type: 'fee' | 'attendance' | 'registration' | 'system';
    color: string;
  }[];
  isLive: boolean;
  lastSync: string;
}

export const DashboardService = {
  async fetchAllMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    // Safe localStorage helpers
    const safeGetItem = <T>(key: string, defaultVal: T): T => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultVal;
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : defaultVal;
      } catch {
        return defaultVal;
      }
    };

    const safeGetArray = <T>(key: string, defaultVal: T[]): T[] => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultVal;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : defaultVal;
      } catch {
        return defaultVal;
      }
    };

    // 1. Fetch Total Students from Supabase
    let totalStudents = 0;
    try {
      const { count: countResult, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      if (!studentsError && countResult !== null) totalStudents = countResult;
    } catch {
      // Fallback to localStorage
      totalStudents = (safeGetItem<number>('munyaka_total_students', 0) || 0);
    }

    // 2. Fetch Total Teachers from Supabase
    let totalTeachers = 0;
    try {
      const { count: countResult, error: teachersError } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active')
        .in('role', ['Class Teacher', 'Senior Teacher', 'Subject Teacher', 'Head Teacher']);
      if (!teachersError && countResult !== null) totalTeachers = countResult;
    } catch {
      totalTeachers = (safeGetItem<number>('munyaka_total_teachers', 0) || 0);
    }

    // 3. Fetch Today's Attendance Rate from Supabase
    let todaysAttendanceRate: number | null = null;
    try {
      const { data: todaysAttendance, error: attendanceError } = await supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('date', todayStr);
      if (!attendanceError && todaysAttendance) {
        const presentCount = todaysAttendance.filter(
          (a: any) => a.status === 'present' || a.status === 'late'
        ).length;
        todaysAttendanceRate = totalStudents && totalStudents > 0
          ? Math.round((presentCount / totalStudents) * 100)
          : null;
      }
    } catch {
      todaysAttendanceRate = null;
    }

    // 4. Fetch Weekly Attendance Trend (Mon-Fri) from Supabase
    const attendanceTrend = (() => {
      try {
        const { data: weeklyAttendance, error: weeklyError } = await supabase
          .from('student_attendance')
          .select('student_id, date, status')
          .gte('date', format(weekStart, 'yyyy-MM-dd'))
          .lte('date', format(weekEnd, 'yyyy-MM-dd'));

        if (weeklyError) throw weeklyError;

        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        return dayNames.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          const dayStr = format(dayDate, 'yyyy-MM-dd');
          const isFuture = isWithinInterval(dayDate, { start: today, end: today }) === false && dayDate > today;

          const dayRecords = (weeklyAttendance || []).filter(
            (a: any) => a.date === dayStr
          );
          const dayPresent = (dayRecords || []).filter(
            (a: any) => a.status === 'present' || a.status === 'late'
          ).length;

          const rate = totalStudents && totalStudents > 0 && !isFuture
            ? Math.round((dayPresent / totalStudents) * 100)
            : 0;

          return {
            day,
            rate: isFuture ? 0 : rate,
            isFactual: !isFuture && dayStr === todayStr
          };
        });
      })();
      // Fallback to localStorage if Supabase failed or returned empty
      if (!attendanceTrend || attendanceTrend.length === 0) {
        const fallbackTrend = safeGetArray<
          { day: string; rate: number; isFactual: boolean }
        >('munyaka_attendance_trend', [
          { day: 'Mon', rate: 0, isFactual: false },
          { day: 'Tue', rate: 0, isFactual: false },
          { day: 'Wed', rate: 0, isFactual: false },
          { day: 'Thu', rate: 0, isFactual: false },
          { day: 'Fri', rate: 0, isFactual: false },
        ]);
        return fallbackTrend;
      }
      return attendanceTrend;
    })();

    // 5. Fetch Class Participation from Supabase
    const classParticipation = (() => {
      try {
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select(`
            id,
            name,
            streams:grade_streams(id, name, students_count)
          `)
          .order('sort_order');

        if (gradesError) throw gradesError;

        const participation = await Promise.all(
          (gradesData || []).map(async (grade: any) => {
            const streams = grade.streams || [];
            const totalEnrolled = streams.reduce(
              (sum: number, s: any) => sum + (s.students_count || 0),
              0
            );

            if (totalEnrolled === 0) {
              return {
                className: grade.name,
                enrolled: 0,
                presentToday: 0,
                attendanceRate: 0
              };
            }

            // Get student IDs for this grade
            const { data: gradeStudents, error: gsError } = await supabase
              .from('students')
              .select('id')
              .eq('grade_id', grade.id)
              .eq('status', 'Active');

            const studentIds = (gradeStudents || []).map(
              (s: any) => s.id
            ) || [];

            if (studentIds.length === 0) {
              return {
                className: grade.name,
                enrolled: totalEnrolled,
                presentToday: 0,
                attendanceRate: 0
              };
            }

            // Get today's attendance for these students
            const { data: gradeAttendance, error: gaError } = await supabase
              .from('student_attendance')
              .select('student_id, status')
              .eq('date', todayStr)
              .in('student_id', studentIds);

            const presentToday = (gradeAttendance || []).filter(
              (a: any) => a.status === 'present' || a.status === 'late'
            ).length || 0;

            const attendanceRate = totalEnrolled > 0
              ? Math.round((presentToday / totalEnrolled) * 100)
              : 0;

            return {
              className: grade.name,
              enrolled: totalEnrolled,
              presentToday,
              attendanceRate
            };
          })
        );
        return participation;
      } catch {
        // Fallback to localStorage
        const fallbackPart: any[] = safeGetItem<any[]>('munyaka_class_participation', []);
        return (fallbackPart || []).map((item: any) => ({
          className: item.className || 'Unknown',
          enrolled: item.enrolled ?? 0,
          presentToday: item.presentToday ?? 0,
          attendanceRate: item.attendanceRate ?? 0
        }));
      }
    })();

    // 6. Fetch Recent Alerts (fee payments, attendance submissions, new registrations)
    const recentAlerts = (() => {
      const alerts: any[] = [];

      // Recent fee payments from localStorage
      const feePayments = safeGetArray<
        { id: string; amount: number; ref: string; category: string }
      >('munyaka_fee_payments', []);
      feePayments.forEach((tx: any) => {
        alerts.push({
          id: `fee-${tx.id}`,
          time: format(new Date(tx.created_at || Date.now()), 'HH:mm'),
          message: `Fee payment: ${tx.ref} (KES ${tx.amount.toLocaleString()})`,
          type: 'fee',
          color: 'bg-orange-500'
        });
      });

      // Recent attendance submissions from localStorage
      const attendanceSubmissions = safeGetArray<
        { id: string; date: string; created_at: string; class_id: string }
      >('munyaka_attendance_submissions', []);
      attendanceSubmissions.forEach((att: any) => {
        alerts.push({
          id: `att-${att.id}`,
          time: format(new Date(att.created_at || Date.now()), 'HH:mm'),
          message: `Attendance marked: ${att.class_id || 'Class'}`,
          type: 'attendance',
          color: 'bg-purple-500'
        });
      });

      // Recent student registrations from localStorage
      const recentStudents = safeGetArray<
        { id: string; name: string; assessment_number: string; created_at: string }
      >('munyaka_recent_students', []);
      recentStudents.forEach((st: any) => {
        alerts.push({
          id: `reg-${st.id}`,
          time: format(new Date(st.created_at || Date.now()), 'HH:mm'),
          message: `New student registered: ${st.name} (${st.assessment_number})`,
          type: 'registration',
          color: 'bg-emerald-500'
        });
      });

      // Sort alerts by time (most recent first) and take top 5
      const sortedAlerts = alerts
        .sort((a: any, b: any) => b.time.localeCompare(a.time))
        .slice(0, 5);

      // Ensure we always return exactly 5 alerts with defaults
      const result: any[] = [];
      for (let i = 0; i < 5; i++) {
        if (i < sortedAlerts.length) {
          result.push(sortedAlerts[i]);
        } else {
          result.push({
            id: `fallback-${i}`,
            time: '—',
            msg: 'No recent activity',
            type: 'system',
            color: 'bg-slate-500'
          });
        }
      }
      return result;
    })();

    // 7. Determine if live data is available
    const isLive = !!(totalStudents > 0 || totalTeachers > 0);

    // 8. Last sync timestamp
    const lastSync = format(new Date(), 'HH:mm:ss');

    return {
      totalStudents,
      totalTeachers,
      todaysAttendanceRate,
      attendanceTrend,
      classParticipation,
      recentAlerts,
      isLive,
      lastSync
    };
  }
};