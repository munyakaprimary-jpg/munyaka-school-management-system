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
 * Flexible staff categorization matching exact spec requirements.
 */
export const getStaffCategoryCounts = (staffList: any[] = []) => {
  const safeList = Array.isArray(staffList) ? staffList : [];
  const TEACHING_KEYWORDS = ['hoi', 'dhoi', 'teacher', 'class teacher', 'subject teacher', 'ict', 'lab'];

  const teaching = safeList.filter((s: any) => {
    const role = (s?.role || '').toLowerCase();
    const desig = (s?.designation || '').toLowerCase();
    return TEACHING_KEYWORDS.some(kw => role.includes(kw) || desig.includes(kw));
  });

  const nonTeaching = safeList.filter((s: any) => !teaching.includes(s));

  return {
    total: safeList.length,
    teachingCount: teaching.length,
    nonTeachingCount: nonTeaching.length,
    teachingStaff: teaching,
    nonTeachingStaff: nonTeaching
  };
};

/**
 * Legacy compatibility alias.
 */
export function calculateStaffMetrics(staffList: StaffMember[] = []): StaffMetricsResult {
  const res = getStaffCategoryCounts(staffList);
  return {
    total: res.total,
    teachingCount: res.teachingCount,
    nonTeachingCount: res.nonTeachingCount,
    teachingStaff: res.teachingStaff,
    nonTeachingStaff: res.nonTeachingStaff
  };
}
