/**
 * Central RBAC Permission Matrix for Munyaka School Management System.
 *
 * Role Hierarchy:
 *   SUPERADMIN  — Platform owner. System configuration, subscriptions,
 *                 user management. Excluded from daily operational feeds.
 *   ADMIN       — Internal school operational admin (Headteacher level).
 *                 Mapped internally to 'head_teacher'. Full operational
 *                 dashboard access including Recent Alerts.
 *   HEADTEACHER — Same as ADMIN in this codebase. Kept for clarity.
 *   TEACHER     — Classroom-scoped. Own class metrics and participation.
 *   BURSAR      — Finance-scoped. Fee tracking and payment records.
 *
 * All role strings are lowercase to match AuthContext UserRole values.
 */

/** Granular permission keys — each maps to a specific feature or data scope. */
export type PermissionKey =
  // SuperAdmin — business / platform
  | 'VIEW_BUSINESS_VITALS'
  | 'MANAGE_SUBSCRIPTIONS'
  | 'MANAGE_USER_ROLES'
  | 'SYSTEM_SETTINGS'
  // Admin / Headteacher — operational
  | 'VIEW_DASHBOARD_OVERVIEW'
  | 'VIEW_RECENT_ALERTS'
  | 'MANAGE_LEARNERS'
  | 'EXECUTE_TRANSFERS'
  | 'RESTORE_LEARNERS'
  | 'VIEW_ATTENDANCE_TRENDS'
  | 'MANAGE_STAFF'
  | 'VIEW_REPORTS'
  // Teacher
  | 'VIEW_OWN_CLASS'
  | 'ENTER_MARKS'
  | 'VIEW_OWN_STUDENTS'
  // Bursar
  | 'MANAGE_FEES'
  | 'VIEW_PAYMENTS'
  // Shared
  | 'VIEW_OWN_PROFILE';

/** Maps each role to its list of granted permissions. */
export const ROLE_PERMISSIONS: Readonly<Record<string, PermissionKey[]>> = {
  SUPERADMIN: [
    'VIEW_BUSINESS_VITALS',
    'MANAGE_SUBSCRIPTIONS',
    'MANAGE_USER_ROLES',
    'SYSTEM_SETTINGS',
    'VIEW_OWN_PROFILE',
  ],
  super_admin: [
    'VIEW_BUSINESS_VITALS',
    'MANAGE_SUBSCRIPTIONS',
    'MANAGE_USER_ROLES',
    'SYSTEM_SETTINGS',
    'VIEW_OWN_PROFILE',
  ],
  head_teacher: [
    'VIEW_DASHBOARD_OVERVIEW',
    'VIEW_RECENT_ALERTS',
    'MANAGE_LEARNERS',
    'EXECUTE_TRANSFERS',
    'RESTORE_LEARNERS',
    'VIEW_ATTENDANCE_TRENDS',
    'MANAGE_STAFF',
    'VIEW_REPORTS',
    'VIEW_OWN_PROFILE',
  ],
  teacher: [
    'VIEW_OWN_CLASS',
    'ENTER_MARKS',
    'VIEW_OWN_STUDENTS',
    'VIEW_ATTENDANCE_TRENDS',
    'VIEW_REPORTS',
    'VIEW_OWN_PROFILE',
  ],
  bursar: [
    'MANAGE_FEES',
    'VIEW_PAYMENTS',
    'VIEW_DASHBOARD_OVERVIEW',
    'VIEW_OWN_PROFILE',
  ],
  parent: [
    'VIEW_OWN_PROFILE',
    'VIEW_REPORTS',
  ],
  student: [
    'VIEW_OWN_PROFILE',
    'VIEW_REPORTS',
  ],
} as const;

/**
 * Dashboard-specific RBAC — three independent visibility gates.
 * These are used directly in Dashboard.tsx to control widget rendering.
 *
 *  seesVitals         → SUPERADMIN + ADMIN + HEADTEACHER
 *  canViewRecentAlerts→ ADMIN + HEADTEACHER  (SUPERADMIN excluded)
 *  isOwner            → SUPERADMIN only        (business/billing widgets)
 */
export const DASHBOARD_VITALS_ROLES    = ['SUPERADMIN', 'super_admin', 'head_teacher'] as const;
export const DASHBOARD_ALERTS_ROLES    = ['head_teacher'] as const; // ADMIN maps to head_teacher
export const DASHBOARD_OWNER_ROLES     = ['SUPERADMIN', 'super_admin'] as const;

/** Navigation role allow-lists — used in Sidebar, Layout, BottomNavigation. */
export const NAV_ROLES = {
  home:             ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'],
  learners:         ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'bursar'],
  rollCall:         ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher'],
  fees:             ['SUPERADMIN', 'super_admin', 'head_teacher', 'bursar', 'parent'],
  payments:         ['SUPERADMIN', 'super_admin'],
  systemManagement: ['SUPERADMIN', 'super_admin', 'ict_teacher', 'ict_technician'],
  communication:    ['SUPERADMIN', 'super_admin'],
  notices:          ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'],
  timetable:        ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'parent', 'student'],
  analysis:         ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'parent', 'student'],
  digitalHub:       ['SUPERADMIN', 'super_admin', 'head_teacher', 'teacher', 'student'],
  ictLab:           ['SUPERADMIN', 'super_admin', 'head_teacher'],
  settings:         ['SUPERADMIN', 'super_admin', 'head_teacher'],
  promote:          ['SUPERADMIN', 'super_admin', 'head_teacher'],
} as const;

/**
 * Check if a given role has a specific permission.
 * @param role   — lowercase role string (from user.role)
 * @param perm   — permission key to check
 */
export function hasPermission(role: string, perm: PermissionKey): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(perm);
}

/**
 * Normalize a role string for consistent lookups.
 * Handles case differences and maps legacy labels.
 */
export function normalizeRole(role: string | undefined): string {
  if (!role) return '';
  const r = role.toLowerCase();
  // Map legacy 'owner' and uppercase variants to SUPERADMIN
  if (r === 'owner' || r === 'superadmin' || r === 'sup admin') return 'SUPERADMIN';
  if (r === 'admin') return 'head_teacher'; // ADMIN maps to head_teacher
  if (r === 'headteacher' || r === 'head teacher') return 'head_teacher';
  return r;
}
