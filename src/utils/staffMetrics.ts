export const calculateStaffMetrics = (staffList: any[]) => {
  if (!Array.isArray(staffList)) {
    return { totalStaff: 0, teachingCount: 0, nonTeachingCount: 0 };
  }

  const teachingRoles = ['HOI', 'DHOI', 'Class Teacher', 'Subject Teacher', 'Teacher', 'ICT Teacher', 'Lab Teacher', 'Library Teacher'];

  const teaching = staffList.filter((s: any) => {
    if (!s) return false;
    const role = (s.role || '').toLowerCase();
    const desig = (s.designation || s.specificRole || '').toLowerCase();
    const category = (s.category || '').toLowerCase();

    return (
      teachingRoles.some(r => role.includes(r.toLowerCase()) || desig.includes(r.toLowerCase())) ||
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

  const nonTeaching = staffList.filter((s: any) => !teaching.includes(s));

  return {
    totalStaff: staffList.length,
    teachingCount: teaching.length,
    nonTeachingCount: nonTeaching.length
  };
};
