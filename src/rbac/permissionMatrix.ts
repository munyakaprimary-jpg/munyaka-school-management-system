export const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  HEAD_TEACHER: 'head_teacher',
  TEACHER: 'teacher',
  CLASS_TEACHER: 'class_teacher',
  SUBJECT_TEACHER: 'subject_teacher',
  SENIOR_TEACHER: 'senior_teacher',
  BURSAR: 'bursar',
  ACCOUNTANT: 'accountant',
  PARENT: 'parent',
  STUDENT: 'student',
  LIBRARIAN: 'librarian',
  ICT_TEACHER: 'ict_teacher',
  ICT_TECHNICIAN: 'ict_technician',
} as const;

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_STUDENTS: 'manage_students',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_FINANCES: 'manage_finances',
  ENTER_MARKS: 'enter_marks',
  VIEW_REPORTS: 'view_reports',
  MANAGE_TIMETABLE: 'manage_timetable',
  TAKE_ATTENDANCE: 'take_attendance',
} as const;

export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': PERMISSIONS.VIEW_DASHBOARD,
  '/students': PERMISSIONS.MANAGE_STUDENTS,
  '/staff': PERMISSIONS.MANAGE_STAFF,
  '/fees': PERMISSIONS.MANAGE_FINANCES,
  '/assessments': PERMISSIONS.ENTER_MARKS,
  '/reports': PERMISSIONS.VIEW_REPORTS,
  '/timetable': PERMISSIONS.MANAGE_TIMETABLE,
  '/attendance': PERMISSIONS.TAKE_ATTENDANCE,
};

export function resolveRole(role?: string): string {
  if (!role) return 'teacher';
  const r = String(role).toLowerCase().trim();
  if (r.includes('admin')) return 'admin';
  if (r.includes('owner')) return 'owner';
  if (r.includes('head')) return 'head_teacher';
  if (r.includes('teacher') || r.includes('educator')) return 'teacher';
  if (r.includes('bursar') || r.includes('accountant')) return 'bursar';
  if (r.includes('parent')) return 'parent';
  if (r.includes('student')) return 'student';
  return 'teacher';
}

export function roleHas(role?: string, permission?: string): boolean {
  const resolved = resolveRole(role);
  if (resolved === 'admin' || resolved === 'owner') return true;
  if (resolved === 'head_teacher') return true;
  if (resolved === 'teacher') {
    return [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.ENTER_MARKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_TIMETABLE,
      PERMISSIONS.TAKE_ATTENDANCE,
    ].includes(permission as any);
  }
  if (resolved === 'student' || resolved === 'parent') {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_REPORTS].includes(permission as any);
  }
  return false;
}
