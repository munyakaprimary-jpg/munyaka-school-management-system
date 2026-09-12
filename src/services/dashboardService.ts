import { pb } from '../lib/pocketbase';

export interface DashboardStats {
  totalActiveStudents: number;
  totalActiveTeachers: number;
  todayAttendancePercentage: number;
  weeklyAttendanceTrend: WeeklyAttendancePoint[];
  classParticipation: ClassParticipation[];
  recentAlerts: RecentAlert[];
}

export interface WeeklyAttendancePoint {
  day: string; // Mon, Tue, Wed, Thu, Fri
  date: string; // YYYY-MM-DD
  rate: number;
  isToday: boolean;
}

export interface ClassParticipation {
  className: string;
  totalEnrolled: number;
  presentToday: number;
  attendanceRate: number;
}

export interface RecentAlert {
  id: string;
  type: 'fee_receipt' | 'roll_call' | 'student_registration' | 'staff_attendance' | 'general';
  message: string;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

class DashboardService {
  /**
   * 1. Total Active Students
   * Counts students with status 'Active' in the learners collection
   */
  async getTotalActiveStudents(): Promise<number> {
    try {
      const result = await pb.collection('learners').getList(1, 1, {
        filter: 'status = "Active"',
        fields: 'id'
      });
      return result.totalItems;
    } catch (error) {
      console.error('Error fetching total active students:', error);
      return 0;
    }
  }

  /**
   * 2. Total Active Teachers
   * Counts staff with status 'Active' and role containing 'Teacher'
   */
  async getTotalActiveTeachers(): Promise<number> {
    try {
      const result = await pb.collection('staff').getList(1, 1, {
        filter: 'status = "Active" && (role ~ "Teacher" || role ~ "teacher")',
        fields: 'id'
      });
      return result.totalItems;
    } catch (error) {
      console.error('Error fetching total active teachers:', error);
      return 0;
    }
  }

  /**
   * 3. Today's Attendance Percentage
   * Calculates (Present students today / Total active students) * 100
   */
  async getTodayAttendancePercentage(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get total active students
      const totalStudentsResult = await pb.collection('learners').getList(1, 1, {
        filter: 'status = "Active"',
        fields: 'id'
      });
      const totalActiveStudents = totalStudentsResult.totalItems;

      if (totalActiveStudents === 0) return 0;

      // Get today's attendance records where status is Present or Late
      const attendanceResult = await pb.collection('student_attendance').getList(1, 1, {
        filter: `date = "${today}" && (status = "present" || status = "late")`,
        fields: 'id'
      });
      const presentToday = attendanceResult.totalItems;

      return Math.round((presentToday / totalActiveStudents) * 100);
    } catch (error) {
      console.error('Error calculating today attendance percentage:', error);
      return 0;
    }
  }

  /**
   * 4. Weekly Attendance Trend (Mon-Fri)
   * Returns daily attendance % for Monday through Friday of current week
   */
  async getWeeklyAttendanceTrend(): Promise<WeeklyAttendancePoint[]> {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
      
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);

      const mondayStr = monday.toISOString().split('T')[0];
      const fridayStr = friday.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // Get total active students once
      const totalStudentsResult = await pb.collection('learners').getList(1, 1, {
        filter: 'status = "Active"',
        fields: 'id'
      });
      const totalActiveStudents = totalStudentsResult.totalItems;

      if (totalActiveStudents === 0) {
        return this.getEmptyWeeklyTrend(monday);
      }

      // Fetch all attendance records for the week
      const attendanceRecords = await pb.collection('student_attendance').getFullList({
        filter: `date >= "${mondayStr}" && date <= "${fridayStr}" && (status = "present" || status = "late")`,
        fields: 'date,student'
      });

      // Group by date and count unique students
      const attendanceByDate = new Map<string, Set<string>>();
      attendanceRecords.forEach(record => {
        if (!attendanceByDate.has(record.date)) {
          attendanceByDate.set(record.date, new Set());
        }
        attendanceByDate.get(record.date)!.add(record.student);
      });

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const trend: WeeklyAttendancePoint[] = [];

      for (let i = 0; i < 5; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const presentCount = attendanceByDate.get(dateStr)?.size || 0;
        const rate = totalActiveStudents > 0 
          ? Math.round((presentCount / totalActiveStudents) * 100) 
          : 0;

        trend.push({
          day: dayNames[i],
          date: dateStr,
          rate,
          isToday: dateStr === todayStr
        });
      }

      return trend;
    } catch (error) {
      console.error('Error fetching weekly attendance trend:', error);
      return this.getEmptyWeeklyTrend(new Date());
    }
  }

  private getEmptyWeeklyTrend(monday: Date): WeeklyAttendancePoint[] {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return dayNames.map((day, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        day,
        date: date.toISOString().split('T')[0],
        rate: 0,
        isToday: false
      };
    });
  }

  /**
   * 5. Class Participation List
   * Returns class name, total enrolled, and today's attendance rate per class
   */
  async getClassParticipation(): Promise<ClassParticipation[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all active classes/grades
      const classesResult = await pb.collection('classes').getFullList({
        filter: 'isActive = true',
        sort: 'gradeOrder',
        fields: 'id,name,gradeOrder'
      });

      const participation: ClassParticipation[] = [];

      for (const cls of classesResult) {
        // Get enrolled students in this class
        const studentsResult = await pb.collection('learners').getList(1, 1, {
          filter: `class = "${cls.id}" && status = "Active"`,
          fields: 'id'
        });
        const totalEnrolled = studentsResult.totalItems;

        if (totalEnrolled === 0) {
          participation.push({
            className: cls.name,
            totalEnrolled: 0,
            presentToday: 0,
            attendanceRate: 0
          });
          continue;
        }

        // Get today's attendance for students in this class
        // We need to join with learners collection - fetch attendance records for today
        // and filter by student's class
        const studentIds = (await pb.collection('learners').getFullList({
          filter: `class = "${cls.id}" && status = "Active"`,
          fields: 'id'
        })).map(s => s.id);

        if (studentIds.length === 0) {
          participation.push({
            className: cls.name,
            totalEnrolled: 0,
            presentToday: 0,
            attendanceRate: 0
          });
          continue;
        }

        // Build filter for attendance records
        const studentIdFilter = studentIds.map(id => `student = "${id}"`).join(' || ');
        const attendanceResult = await pb.collection('student_attendance').getList(1, 1, {
          filter: `date = "${today}" && (status = "present" || status = "late") && (${studentIdFilter})`,
          fields: 'id'
        });

        const presentToday = attendanceResult.totalItems;
        const attendanceRate = Math.round((presentToday / totalEnrolled) * 100);

        participation.push({
          className: cls.name,
          totalEnrolled,
          presentToday,
          attendanceRate
        });
      }

      return participation;
    } catch (error) {
      console.error('Error fetching class participation:', error);
      return [];
    }
  }

  /**
   * 6. Recent Alerts
   * Last 5 activity records (fee receipts, roll call submissions, etc.)
   */
  async getRecentAlerts(limit: number = 5): Promise<RecentAlert[]> {
    try {
      const alerts: RecentAlert[] = [];

      // Fetch recent fee payments
      const feePayments = await pb.collection('fee_payments').getList(1, limit, {
        sort: '-created',
        fields: 'id,amount,reference,student,created'
      });

      feePayments.items.forEach(payment => {
        alerts.push({
          id: `fee_${payment.id}`,
          type: 'fee_receipt',
          message: `Fee payment received: ${payment.reference} (KES ${payment.amount})`,
          createdAt: payment.created,
          relatedId: payment.id,
          relatedType: 'fee_payment'
        });
      });

      // Fetch recent roll call submissions
      const rollCalls = await pb.collection('attendance_sessions').getList(1, limit, {
        sort: '-created',
        fields: 'id,class,session,submittedBy,created'
      });

      rollCalls.items.forEach(session => {
        alerts.push({
          id: `rollcall_${session.id}`,
          type: 'roll_call',
          message: `Roll call submitted for ${session.class} - ${session.session} session`,
          createdAt: session.created,
          relatedId: session.id,
          relatedType: 'attendance_session'
        });
      });

      // Fetch recent student registrations
      const newStudents = await pb.collection('learners').getList(1, limit, {
        sort: '-created',
        filter: 'status = "Active"',
        fields: 'id,name,admissionNumber,created'
      });

      newStudents.items.forEach(student => {
        alerts.push({
          id: `student_${student.id}`,
          type: 'student_registration',
          message: `New student registered: ${student.name} (${student.admissionNumber})`,
          createdAt: student.created,
          relatedId: student.id,
          relatedType: 'learner'
        });
      });

      // Fetch recent staff attendance
      const staffAttendance = await pb.collection('staff_attendance').getList(1, limit, {
        sort: '-created',
        fields: 'id,teacher,status,created'
      });

      staffAttendance.items.forEach(record => {
        alerts.push({
          id: `staff_${record.id}`,
          type: 'staff_attendance',
          message: `Staff ${record.teacher} marked ${record.status}`,
          createdAt: record.created,
          relatedId: record.id,
          relatedType: 'staff_attendance'
        });
      });

      // Sort all alerts by createdAt descending and take top 5
      return alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  }

  /**
   * Get all dashboard stats in one call
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalActiveStudents,
      totalActiveTeachers,
      todayAttendancePercentage,
      weeklyAttendanceTrend,
      classParticipation,
      recentAlerts
    ] = await Promise.all([
      this.getTotalActiveStudents(),
      this.getTotalActiveTeachers(),
      this.getTodayAttendancePercentage(),
      this.getWeeklyAttendanceTrend(),
      this.getClassParticipation(),
      this.getRecentAlerts(5)
    ]);

    return {
      totalActiveStudents,
      totalActiveTeachers,
      todayAttendancePercentage,
      weeklyAttendanceTrend,
      classParticipation,
      recentAlerts
    };
  }
}

export const dashboardService = new DashboardService();