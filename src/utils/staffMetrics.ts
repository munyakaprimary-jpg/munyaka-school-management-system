// Unified Staff Categorization Utility for Munyaka Portal

export interface StaffMember {
  id?: string;
  role?: string;
  designation?: string;
  [key: string]: any;
}

export interface StaffCategoryCountsResult {
  total: number;
  teachingCount: number;
  nonTeachingCount: number;
  teachingStaff: StaffMember[];
  nonTeachingStaff: StaffMember[];
}

export const getStaffCategoryCounts = (staffList: any[] = []): StaffCategoryCountsResult => {
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

export const calculateStaffMetrics = getStaffCategoryCounts;

export default getStaffCategoryCounts;
