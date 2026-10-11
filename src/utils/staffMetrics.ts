export interface StaffMetrics {
  totalStaff: number;
  teachingCount: number;
  nonTeachingCount: number;
}

export const calculateStaffMetrics = (staffList: any[] = []): StaffMetrics => {
  const safeList = Array.isArray(staffList) ? staffList : [];
  const teachingRoles = ['hoi', 'dhoi', 'class teacher', 'subject teacher', 'teacher', 'ict teacher', 'lab teacher', 'library teacher'];

  const teaching = safeList.filter((s: any) => {
    if (!s) return false;
    const role = (s?.role || '').toLowerCase();
    const desig = (s?.designation || s?.specificRole || '').toLowerCase();
    const category = (s?.category || '').toLowerCase();

    return (
      teachingRoles.some(r => role.includes(r) || desig.includes(r)) ||
      category === 'teaching' ||
      category === 'academic' ||
      category === 'class teacher' ||
      category === 'subject teacher' ||
      category === 'ict teacher' ||
      category === 'lab teacher' ||
      category === 'hoi' ||
      category === 'dhoi' ||
      category === 'library teacher'
    );
  });

  const nonTeaching = safeList.filter((s: any) => !teaching.includes(s));

  return {
    totalStaff: safeList.length,
    teachingCount: teaching.length,
    nonTeachingCount: nonTeaching.length
  };
};
