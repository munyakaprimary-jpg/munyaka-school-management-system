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

    try {
      // 1. Fetch Total Students (active learners)
      const { count: totalStudents, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // 2. Fetch Total Teachers (active staff with teaching roles)
      const { count: totalTeachers, error: teachersError } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active')
        .in('role', ['Class Teacher', 'Senior Teacher', 'Subject Teacher', 'Head Teacher']);

      if (teachersError) throw teachersError;

      // 3. Fetch Today's Attendance Rate
      const { data: todaysAttendance, error: attendanceError } = await supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('date', todayStr);

      if (attendanceError) throw attendanceError;

      const presentCount = todaysAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
      const todaysAttendanceRate = totalStudents && totalStudents > 0 
        ? Math.round((presentCount / totalStudents) * 100) 
        : null;

      // 4. Fetch Weekly Attendance Trend (Mon-Fri)
      const { data: weeklyAttendance, error: weeklyError } = await supabase
        .from('student_attendance')
        .select('student_id, date, status')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      if (weeklyError) throw weeklyError;

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const attendanceTrend = dayNames.map((day, index) => {
        const dayDate = addDays(weekStart, index);
        const dayStr = format(dayDate, 'yyyy-MM-dd');
        const isFuture = isWithinInterval(dayDate, { start: today, end: today }) === false && dayDate > today;
        
        const dayRecords = weeklyAttendance?.filter(a => a.date === dayStr) || [];
        const dayPresent = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
        const rate = totalStudents && totalStudents > 0 && !isFuture 
          ? Math.round((dayPresent / totalStudents) * 100) 
          : 0;

        return {
          day,
          rate: isFuture ? 0 : rate,
          isFactual: !isFuture && dayStr === todayStr
        };
      });

      // 5. Fetch Class Participation (Grades with enrolled counts and today's attendance)
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          name,
          streams:grade_streams(id, name, students_count)
        `)
        .order('sort_order');

      if (gradesError) throw gradesError;

      const classParticipation = await Promise.all(
        (gradesData || []).map(async (grade) => {
          const streams = grade.streams || [];
          const totalEnrolled = streams.reduce((sum, s) => sum + (s.students_count || 0), 0);
          
          if (totalEnrolled === 0) {
            return {
              className: grade.name,
              enrolled: 0,
              presentToday: 0,
              attendanceRate: 0
            };
          }

          // Get student IDs for this grade
          const { data: gradeStudents } = await supabase
            .from('students')
            .select('id')
            .eq('grade_id', grade.id)
            .eq('status', 'Active');

          const studentIds = gradeStudents?.map(s => s.id) || [];
          
          if (studentIds.length === 0) {
            return {
              className: grade.name,
              enrolled: totalEnrolled,
              presentToday: 0,
              attendanceRate: 0
            };
          }

          // Get today's attendance for these students
          const { data: gradeAttendance } = await supabase
            .from('student_attendance')
            .select('student_id, status')
            .eq('date', todayStr)
            .in('student_id', studentIds);

          const presentToday = gradeAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
          const attendanceRate = totalEnrolled > 0 ? Math.round((presentToday / totalEnrolled) * 100) : 0;

          return {
            className: grade.name,
            enrolled: totalEnrolled,
            presentToday,
            attendanceRate
          };
        })
      );

      // 6. Fetch Recent Alerts (fee payments, attendance submissions, new registrations)
      const alerts: DashboardMetrics['recentAlerts'] = [];

      // Recent fee payments
      const { data: recentPayments } = await supabase
        .from('transactions')
        .select('id, amount, ref, category, created_at, student_id')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentPayments) {
        recentPayments.forEach(tx => {
          alerts.push({
            id: `fee-${tx.id}`,
            time: format(new Date(tx.created_at), 'HH:mm'),
            message: `Fee payment: ${tx.ref} (KES ${tx.amount.toLocaleString()})`,
            type: 'fee',
            color: 'bg-orange-500'
          });
        });
      }

      // Recent attendance submissions
      const { data: recentAttendance } = await supabase
        .from('student_attendance')
        .select('id, date, created_at, class_id')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentAttendance) {
        recentAttendance.forEach(att => {
          alerts.push({
            id: `att-${att.id}`,
            time: format(new Date(att.created_at), 'HH:mm'),
            message: `Attendance marked: ${att.class_id || 'Class'}`,
            type: 'attendance',
            color: 'bg-purple-500'
          });
        });
      }

      // Recent student registrations
      const { data: recentStudents } = await supabase
        .from('students')
        .select('id, name, assessment_number, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentStudents) {
        recentStudents.forEach(st => {
          alerts.push({
            id: `reg-${st.id}`,
            time: format(new Date(st.created_at), 'HH:mm'),
            message: `New student registered: ${st.name} (${st.assessment_number})`,
            type: 'registration',
            color: 'bg-emerald-500'
          });
        });
      }

      // Sort alerts by time (most recent first) and take top 5
      const sortedAlerts = alerts
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 5);

      return {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        todaysAttendanceRate,
        attendanceTrend,
        classParticipation,
        recentAlerts: sortedAlerts,
        isLive: true,
        lastSync: format(new Date(), 'HH:mm:ss')
      };

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }
};