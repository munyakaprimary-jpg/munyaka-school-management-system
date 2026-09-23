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
  // Additional permissions for admin-only modules
  VIEW_OPERATIONAL_DASHBOARD: 'view_operational_dashboard',
  MANAGE_LEARNERS: 'manage_learners',
  EXECUTE_TRANSFERS: 'execute_transfers',
  VIEW_RECENT_ALERTS: 'view_recent_alerts',
  MANAGE_STAFF_ACCOUNTS: 'manage_staff_accounts',
  COLLECT_FEES: 'collect_fees',
  MANAGE_SUBSCRIPTION: 'manage_subscription',
  // Admin-only module permissions
  MANAGE_CENTRAL_DATA: 'manage_central_data',
  MANAGE_STAFF_DIRECTORY: 'manage_staff_directory',
  MANAGE_TIMETABLE_ADMIN: 'manage_timetable_admin',
} as const;

export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': PERMISSIONS.VIEW_DASHBOARD,
  '/students': PERMISSIONS.MANAGE_STUDENTS,
  '/staff': PERMISSIONS.MANAGE_STAFF,
  '/fees': PERMISSIONS.MANAGE_FINANCES,
  '/assessments': PERMISSIONS.ENTER_MARKS,
  '/reports': PERMISSIONS.VIEW_REPORTS,
  '/timetable': PERMISSIONS.MANAGE_TIMETABLE_ADMIN,
  '/attendance': PERMISSIONS.TAKE_ATTENDANCE,
  '/central-data': PERMISSIONS.MANAGE_CENTRAL_DATA,
  '/staff/directory': PERMISSIONS.MANAGE_STAFF_DIRECTORY,
  '/system-management': PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD,
  '/admin/control-center': PERMISSIONS.MANAGE_LEARNERS, // Example mapping
  '/dev/tenants': PERMISSIONS.MANAGE_SUBSCRIPTION,
  '/payment-management': PERMISSIONS.MANAGE_FINANCES,
} as const;

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

export function isAdmin(role?: string): boolean {
  if (!role) return false;
  const r = String(role).toLowerCase().trim();
  return r.includes('admin') || r === 'super_admin';
}

export function roleHas(role?: string, permission?: string): boolean {
  const resolved = resolveRole(role);
  
  // Admin and super_admin have all permissions
  if (resolved === 'admin' || resolved === 'super_admin') return true;
  
  // Owner has limited permissions (NOT admin permissions)
  if (resolved === 'owner') {
    // Owner only has billing/financial permissions
    const ownerPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_FINANCES,
      PERMISSIONS.COLLECT_FEES,
      PERMISSIONS.MANAGE_SUBSCRIPTION,
    ];
    return ownerPermissions.includes(permission as any);
  }
  
  // Head teacher has most permissions except admin-only modules
  if (resolved === 'head_teacher') {
    const headTeacherPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.MANAGE_STAFF,
      PERMISSIONS.ENTER_MARKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.TAKE_ATTENDANCE,
    ];
    return headTeacherPermissions.includes(permission as any);
  }
  
  // Teacher permissions
  if (resolved === 'teacher') {
    const teacherPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.ENTER_MARKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.TAKE_ATTENDANCE,
    ];
    return teacherPermissions.includes(permission as any);
  }
  
  // Student and parent have limited access
  if (resolved === 'student' || resolved === 'parent') {
    const studentParentPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
    ];
    return studentParentPermissions.includes(permission as any);
  }
  
  return false;
}

export function canAccessPath(role: string | undefined, path: string): boolean {
  if (!role) return false;
  
  const resolved = resolveRole(role);
  const permission = ROUTE_PERMISSIONS[path];
  
  // If no specific permission required for this path, allow based on role
  if (!permission) {
    // Allow access to public paths
    const publicPaths = ['/login', '/', '/portal'];
    return publicPaths.includes(path);
  }
  
  return roleHas(role, permission);
}

export function permissionsForRole(role?: string): Record<string, boolean> {
  const resolved = resolveRole(role);
  const permissions: Record<string, boolean> = {};
  
  // Initialize all permissions to false
  Object.values(PERMISSIONS).forEach(perm => {
    permissions[perm] = false;
  });
  
  // Set permissions based on role
  if (resolved === 'admin' || resolved === 'super_admin') {
    // Admin/super_admin gets all permissions
    Object.values(PERMISSIONS).forEach(perm => {
      permissions[perm] = true;
    });
  } else if (resolved === 'owner') {
    // Owner gets limited permissions
    const ownerPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_FINANCES,
      PERMISSIONS.COLLECT_FEES,
      PERMISSIONS.MANAGE_SUBSCRIPTION,
    ];
    ownerPermissions.forEach(perm => {
      permissions[perm] = true;
    });
  } else if (resolved === 'head_teacher') {
    // Head teacher gets most permissions except admin-only
    const headTeacherPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.MANAGE_STAFF,
      PERMISSIONS.ENTER_MARKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.TAKE_ATTENDANCE,
    ];
    headTeacherPermissions.forEach(perm => {
      permissions[perm] = true;
    });
  } else if (resolved === 'teacher') {
    // Teacher permissions
    const teacherPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MANAGE_STUDENTS,
      PERMISSIONS.ENTER_MARKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.TAKE_ATTENDANCE,
    ];
    teacherPermissions.forEach(perm => {
      permissions[perm] = true;
    });
  } else if (resolved === 'student' || resolved === 'parent') {
    // Student/parent permissions
    const studentParentPermissions = [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
    ];
    studentParentPermissions.forEach(perm => {
      permissions[perm] = true;
    });
  }
  
  return permissions;
}

export function hasFullDashboardAccess(role?: string): boolean {
  const resolved = resolveRole(role);
  return resolved === 'admin' || resolved === 'super_admin' || resolved === 'head_teacher';
}

export function hasClassDashboardAccess(role?: string): boolean {
  const resolved = resolveRole(role);
  return resolved === 'teacher' || resolved === 'head_teacher' || resolved === 'class_teacher' || resolved === 'subject_teacher';
}

export function hasFinanceDashboardAccess(role?: string): boolean {
  const resolved = resolveRole(role);
  return resolved === 'admin' || resolved === 'super_admin' || resolved === 'owner' || resolved === 'bursar' || resolved === 'head_teacher';
}

export function hasStudentPortalAccess(role?: string): boolean {
  const resolved = resolveRole(role);
  return resolved === 'student' || resolved === 'parent';
}