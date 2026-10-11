// Unified Metrics Calculator for Munyaka Portal Staff

export interface StaffMember {
  id?: string;
  role?: string;
  designation?: string;
  [key: string]: any;
}

export interface StaffMetricsResult {
  total: number;
  teachingCount: number;
  nonTeachingCount: number;
  teachingStaff: StaffMember[];
  nonTeachingStaff: StaffMember[];
}

/**
 * Calculate staff metrics distinguishing Teaching vs Non-Teaching staff.
 * Teaching Staff (5): Roles or designations containing HOI, DHOI, Class Teacher, Subject Teacher, Teacher, ICT Teacher, Lab Teacher.
 * Non-Teaching Staff (2): All other roles (Bursar, Store Keeper, Support Staff, etc.).
 */
export function calculateStaffMetrics(staffList: StaffMember[] = []): StaffMetricsResult {
  const safeList = Array.isArray(staffList) ? staffList : [];
  
  const teachingKeywords = ['hoi', 'dhoi', 'class teacher', 'subject teacher', 'teacher', 'ict teacher', 'lab teacher'];

  const teachingStaff: StaffMember[] = [];
  const nonTeachingStaff: StaffMember[] = [];

  safeList.forEach(member => {
    const roleStr = String(member.role || member.designation || '').toLowerCase();
    const isTeaching = teachingKeywords.some(keyword => roleStr.includes(keyword));

    if (isTeaching) {
      teachingStaff.push(member);
    } else {
      nonTeachingStaff.push(member);
    }
  });

  return {
    total: safeList.length,
    teachingCount: teachingStaff.length,
    nonTeachingCount: nonTeachingStaff.length,
    teachingStaff,
    nonTeachingStaff
  };
}
