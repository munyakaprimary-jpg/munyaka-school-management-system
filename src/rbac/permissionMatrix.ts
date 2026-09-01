/**
 * =============================================================================
 *  MUNYAKA  ·  RBAC Permission Matrix
 * =============================================================================
 *  Centralised role-based-access-control matrix used by:
 *    • Dashboard router (which widgets a role can see)
 *    • Route guards   (which paths a role can access)
 *    • Sidebar / topbar navigation (which links are rendered)
 *    • Side menu gating inside feature pages
 *
 *  ⚠️  CONTRACT — DO NOT BREAK
 *  ----------------------------------------------------------------------------
 *  - ADMIN (the school administrator) is the *most powerful operational* role.
 *    They have UNRESTRICTED access to every module, widget, route, sidebar
 *    entry, and operational control surface. ADMIN is treated as a super-set
 *    of HEADTEACHER + BURSAR + (limited) ICT + (limited) OWNER.
 *
 *  - OWNER / SUPER_ADMIN is the platform-billing super-role. The legacy
 *    "owner" alias maps to SUPER_ADMIN throughout the UI.
 *
 *  - All role comparisons are case-insensitive (lowercased before lookup).
 *
 *  - Every guard helper short-circuits to "allowed" when the current role
 *    is ADMIN. This means we never accidentally lock ADMIN out of any view.
 * =============================================================================
 */

import type { WidgetKey } from "@/pages/Dashboard";

/* ──────────────────────────────────────────────────────────────────────────
 *  1.  CORE ROLE CONSTANTS
 * ──────────────────────────────────────────────────────────────────────── */

/** Canonical role identifiers. We keep a single source of truth. */
export const ROLES = {
  ADMIN: "admin",
  HEAD_TEACHER: "head_teacher",
  TEACHER: "teacher",
  BURSAR: "bursar",
  ICT_TEACHER: "ict_teacher",
  PARENT: "parent",
  STUDENT: "student",
  OWNER: "owner",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Quick helpers — many places in the codebase use the older "owner" alias. */
export const isOwnerLike = (role?: string | null) =>
  !!role && ["owner", "super_admin"].includes(role.toLowerCase());

/**
 * ADMIN is the school administrator — the focus of the recent RBAC update.
 * The check is intentionally permissive: any of the documented admin
 * spellings should pass.
 */
export const isAdmin = (role?: string | null) => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN || r === ROLES.OWNER;
};

/* ──────────────────────────────────────────────────────────────────────────
 *  2.  SEMANTIC PERMISSION KEYS
 * ────────────────────────────────────────────────────────────────────────
 *  These are the *capability* identifiers used throughout the app.
 *  Each one corresponds to a specific operational domain.
 */
export const PERMISSIONS = {
  // Operational dashboard
  VIEW_OPERATIONAL_DASHBOARD: "view_operational_dashboard",

  // Learner management
  MANAGE_LEARNERS: "manage_learners",
  EXECUTE_TRANSFERS: "execute_transfers",
  VIEW_LEARNER_ARCHIVE: "view_learner_archive",

  // Attendance
  VIEW_ATTENDANCE_TRENDS: "view_attendance_trends",
  MARK_STUDENT_ATTENDANCE: "mark_student_attendance",
  MANAGE_STAFF_ATTENDANCE: "manage_staff_attendance",

  // Academic
  ENTER_MARKS: "enter_marks",
  VIEW_RESULTS_ANALYSIS: "view_results_analysis",
  MANAGE_TIMETABLE: "manage_timetable",

  // Finance
  COLLECT_FEES: "collect_fees",
  VIEW_FEE_REPORTS: "view_fee_reports",

  // Subscription / billing
  MANAGE_SUBSCRIPTION: "manage_subscription",
  MANAGE_BILLING: "manage_billing",

  // People & access
  MANAGE_STAFF_ACCOUNTS: "manage_staff_accounts",
  PROMOTE_STUDENTS: "promote_students",
  MANAGE_PARENT_ACCESS: "manage_parent_access",

  // Operational alerts
  VIEW_RECENT_ALERTS: "view_recent_alerts",
  PUBLISH_NOTICES: "publish_notices",

  // ICT / system
  MANAGE_ICT_SYSTEMS: "manage_ict_systems",
  ACCESS_PORTAL_LOGINS: "access_portal_logins",
  ACCESS_NETWORK_QUOTAS: "access_network_quotas",
  ACCESS_LAB_SCHEDULES: "access_lab_schedules",

  // Settings
  EDIT_SCHOOL_SETTINGS: "edit_school_settings",
  ACCESS_CENTRAL_DATA: "access_central_data",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* ──────────────────────────────────────────────────────────────────────────
 *  3.  ROLE → PERMISSION MATRIX
 * ────────────────────────────────────────────────────────────────────────
 *
 *  ADMIN  → every permission in the system (the *complete* unrestricted set)
 *  HEAD   → operational + people + academics
 *  TEACHER→ academics + attendance for assigned classes
 *  BURSAR → finance + subscription (read-only subscription summary)
 *  ICT    → system infrastructure (granted via RBAC delegation)
 *  PARENT → read-only on own children
 *  STUDENT→ read-only on own profile
 *
 *  `null` in the matrix means the role is explicitly NOT granted the perm.
 *  `true`  means it IS granted.
 *  ADMIN rows use a helper that returns `true` for every permission.
 */
const ALL = new Set(Object.values(PERMISSIONS));

const adminSet: Record<Permission, true> = Object.values(PERMISSIONS).reduce(
  (acc, p) => ({ ...acc, [p]: true }),
  {} as Record<Permission, true>
);

export const ROLE_PERMISSIONS: Record<Role, Record<Permission, true | null>> = {
  /* ───────────── ADMIN: unrestricted, all features ───────────── */
  admin: adminSet,

  /* ───────────── HEADTEACHER: operational scope ───────────── */
  head_teacher: {
    view_operational_dashboard: true,
    manage_learners: true,
    execute_transfers: true,
    view_learner_archive: true,
    view_attendance_trends: true,
    mark_student_attendance: true,
    manage_staff_attendance: true,
    enter_marks: true,
    view_results_analysis: true,
    manage_timetable: true,
    view_recent_alerts: true,
    publish_notices: true,
    manage_staff_accounts: true,
    promote_students: true,
    edit_school_settings: true,
    access_central_data: true,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    manage_ict_systems: null,
    collect_fees: null,
    view_fee_reports: null,
    manage_subscription: null,
    manage_billing: null,
    manage_parent_access: null,
  },

  /* ───────────── TEACHER: class marksheets & registers ───────────── */
  teacher: {
    view_operational_dashboard: true,
    mark_student_attendance: true,
    enter_marks: true,
    view_results_analysis: true,
    manage_timetable: null,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    view_attendance_trends: true,
    manage_staff_attendance: null,
    collect_fees: null,
    view_fee_reports: null,
    view_recent_alerts: null,
    publish_notices: null,
    manage_staff_accounts: null,
    promote_students: null,
    manage_subscription: null,
    manage_billing: null,
    manage_ict_systems: null,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    edit_school_settings: null,
    access_central_data: true,
    manage_parent_access: null,
  },

  /* ───────────── BURSAR: fees, payments, ledger logs ───────────── */
  bursar: {
    view_operational_dashboard: true,
    collect_fees: true,
    view_fee_reports: true,
    view_attendance_trends: true,
    view_recent_alerts: true,
    publish_notices: true,
    access_central_data: true,
    view_results_analysis: null,
    enter_marks: null,
    mark_student_attendance: null,
    manage_staff_attendance: null,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    manage_timetable: null,
    manage_staff_accounts: null,
    promote_students: null,
    manage_subscription: null,
    manage_billing: null,
    manage_ict_systems: null,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    edit_school_settings: null,
    manage_parent_access: null,
  },

  /* ───────────── ICT_TEACHER: infrastructure ───────────── */
  ict_teacher: {
    manage_ict_systems: true,
    access_portal_logins: true,
    access_network_quotas: true,
    access_lab_schedules: true,
    view_operational_dashboard: true,
    access_central_data: true,
    view_attendance_trends: null,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    mark_student_attendance: null,
    manage_staff_attendance: null,
    enter_marks: null,
    view_results_analysis: null,
    manage_timetable: null,
    collect_fees: null,
    view_fee_reports: null,
    view_recent_alerts: null,
    publish_notices: null,
    manage_staff_accounts: null,
    promote_students: null,
    manage_subscription: null,
    manage_billing: null,
    edit_school_settings: null,
    manage_parent_access: null,
  },

  /* ───────────── PARENT: read-only on own data ───────────── */
  parent: {
    view_operational_dashboard: null,
    access_central_data: true,
    view_results_analysis: true,
    view_fee_reports: true,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    view_attendance_trends: null,
    mark_student_attendance: null,
    manage_staff_attendance: null,
    enter_marks: null,
    manage_timetable: null,
    collect_fees: null,
    view_recent_alerts: null,
    publish_notices: null,
    manage_staff_accounts: null,
    promote_students: null,
    manage_subscription: null,
    manage_billing: null,
    manage_ict_systems: null,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    edit_school_settings: null,
    manage_parent_access: null,
  },

  /* ───────────── STUDENT: read-only on own data ───────────── */
  student: {
    view_operational_dashboard: null,
    access_central_data: true,
    view_results_analysis: true,
    view_attendance_trends: null,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    mark_student_attendance: null,
    manage_staff_attendance: null,
    enter_marks: null,
    view_fee_reports: null,
    manage_timetable: null,
    collect_fees: null,
    view_recent_alerts: null,
    publish_notices: null,
    manage_staff_accounts: null,
    promote_students: null,
    manage_subscription: null,
    manage_billing: null,
    manage_ict_systems: null,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    edit_school_settings: null,
    manage_parent_access: null,
  },

  /* ───────────── OWNER: platform billing super-role ───────────── */
  owner: {
    ...adminSet, // billing owner is a superset of operational admin
  },

  /* ───────────── SUPER_ADMIN: extends OWNER with infra ───────────── */
  super_admin: {
    ...adminSet, // unrestricted platform-level access
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  4.  PUBLIC GUARD HELPERS
 * ──────────────────────────────────────────────────────────────────────── */

const norm = (role?: string | null): Role | null => {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r in ROLE_PERMISSIONS) return r as Role;
  // legacy aliases
  if (r === "headteacher") return ROLES.HEAD_TEACHER;
  return null;
};

/** Does the given role have a specific permission? ADMIN always passes. */
export function roleHas(role: string | null | undefined, perm: Permission): boolean {
  const r = norm(role);
  if (!r) return false;
  // ADMIN (and any admin-like role) is unrestricted.
  if (isAdmin(r)) return true;
  return ROLE_PERMISSIONS[r]?.[perm] === true;
}

/** Convert the role-permission map into the legacy boolean shape used by
 *  older components that need a `{permission: boolean}` object. */
export function permissionsForRole(role: string | null | undefined): Record<Permission, boolean> {
  const r = norm(role);
  if (!r) {
    return Object.values(PERMISSIONS).reduce(
      (acc, p) => ({ ...acc, [p]: false }),
      {} as Record<Permission, boolean>
    );
  }
  if (isAdmin(r)) {
    return Object.values(PERMISSIONS).reduce(
      (acc, p) => ({ ...acc, [p]: true }),
      {} as Record<Permission, boolean>
    );
  }
  const map = ROLE_PERMISSIONS[r];
  return Object.values(PERMISSIONS).reduce(
    (acc, p) => ({ ...acc, [p]: map[p] === true }),
    {} as Record<Permission, boolean>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  5.  ROLE → DASHBOARD-WIDGET MAP
 * ────────────────────────────────────────────────────────────────────────
 *  Drives the role-aware Dashboard grid. ADMIN is intentionally given
 *  the FULL set of widgets (operational + ICT + subscription) — the
 *  dashboard router for ADMIN should look identical to the master
 *  overview, with no operational cards hidden.
 */
export const ROLE_DASHBOARD_WIDGETS: Record<Role, WidgetKey[]> = {
  admin: [
    // Operational vitals
    "totalStudents",
    "totalTeachers",
    "todayAttendance",
    "feesCollected",
    // Attendance / transfers / alerts
    "systemStatus",
    "activePortalLogins",
    "networkQuotas",
    "labSchedule",
    // Subscription & billing
    "subscriptionStatus",
    "totalActiveEnrollment",
    "renewalDate",
  ],
  head_teacher: [
    "totalStudents",
    "totalTeachers",
    "todayAttendance",
    "feesCollected",
  ],
  teacher: [
    "myAssignedClassCount",
    "myClassAttendanceRate",
    "pendingMarks",
    "todayLessonSchedule",
  ],
  bursar: [
    "feesCollected",
    "totalActiveEnrollment",
    "subscriptionStatus",
  ],
  ict_teacher: [
    "activePortalLogins",
    "networkQuotas",
    "labSchedule",
    "systemStatus",
  ],
  parent: ["totalActiveEnrollment"],
  student: ["todayAttendance"],
  owner: [
    "subscriptionStatus",
    "totalActiveEnrollment",
    "renewalDate",
    "systemStatus",
  ],
  super_admin: [
    "subscriptionStatus",
    "totalActiveEnrollment",
    "renewalDate",
    "systemStatus",
    "activePortalLogins",
    "networkQuotas",
  ],
};

/** Get the dashboard widget set for a role. ADMIN always returns the
 *  complete master list regardless of the underlying role map. */
export function widgetsForRole(role: string | null | undefined): WidgetKey[] {
  if (isAdmin(role)) {
    // Return the master, unrestricted widget set for ADMIN.
    return [
      "totalStudents",
      "totalTeachers",
      "todayAttendance",
      "feesCollected",
      "systemStatus",
      "activePortalLogins",
      "networkQuotas",
      "labSchedule",
      "subscriptionStatus",
      "totalActiveEnrollment",
      "renewalDate",
    ];
  }
  const r = norm(role);
  if (!r) return ["systemStatus"];
  return ROLE_DASHBOARD_WIDGETS[r] ?? ["systemStatus"];
}

/* ──────────────────────────────────────────────────────────────────────────
 *  6.  ROUTE GUARDS
 * ────────────────────────────────────────────────────────────────────────
 *  Each route declares the minimum permission required. ADMIN bypasses
 *  every check. The `BLOCKED_ROLES` list still applies to ADMIN only in
 *  genuinely dangerous platform-internal paths.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/students": PERMISSIONS.MANAGE_LEARNERS,
  "/learners/archive": PERMISSIONS.VIEW_LEARNER_ARCHIVE,
  "/grades": PERMISSIONS.MANAGE_LEARNERS,
  "/learning-areas": PERMISSIONS.MANAGE_LEARNERS,
  "/exam-types": PERMISSIONS.MANAGE_LEARNERS,
  "/staff": PERMISSIONS.MANAGE_STAFF_ACCOUNTS,
  "/staff/pre-registration": PERMISSIONS.MANAGE_STAFF_ACCOUNTS,
  "/staff/attendance": PERMISSIONS.MANAGE_STAFF_ATTENDANCE,
  "/staff/check-in": PERMISSIONS.MANAGE_STAFF_ATTENDANCE,
  "/staff/attendance-monitor": PERMISSIONS.MANAGE_STAFF_ATTENDANCE,
  "/fees": PERMISSIONS.COLLECT_FEES,
  "/payment-management": PERMISSIONS.MANAGE_SUBSCRIPTION,
  "/system-management": PERMISSIONS.MANAGE_ICT_SYSTEMS,
  "/communication": PERMISSIONS.PUBLISH_NOTICES,
  "/notices": PERMISSIONS.PUBLISH_NOTICES,
  "/timetable": PERMISSIONS.MANAGE_TIMETABLE,
  "/attendance": PERMISSIONS.MARK_STUDENT_ATTENDANCE,
  "/assessments": PERMISSIONS.ENTER_MARKS,
  "/analysis": PERMISSIONS.VIEW_RESULTS_ANALYSIS,
  "/digital-hub": PERMISSIONS.MANAGE_ICT_SYSTEMS,
  "/ict-lab": PERMISSIONS.MANAGE_ICT_SYSTEMS,
  "/digital-skills": PERMISSIONS.ENTER_MARKS,
  "/practical-competencies": PERMISSIONS.ENTER_MARKS,
  "/portfolio": PERMISSIONS.ENTER_MARKS,
  "/library": PERMISSIONS.MANAGE_LEARNERS,
  "/inventory": PERMISSIONS.EDIT_SCHOOL_SETTINGS,
  "/reports": PERMISSIONS.VIEW_RESULTS_ANALYSIS,
  "/settings": PERMISSIONS.EDIT_SCHOOL_SETTINGS,
  "/promote": PERMISSIONS.PROMOTE_STUDENTS,
  "/central-data": PERMISSIONS.ACCESS_CENTRAL_DATA,
  "/science-lab": PERMISSIONS.ENTER_MARKS,
  "/profile": PERMISSIONS.ACCESS_CENTRAL_DATA,
};

/**
 * Decide whether a user with the given role is allowed to visit `path`.
 * ADMIN always returns true. Unknown paths fall through to a permissive
 * default (the route is accessible to any authenticated user) — this is
 * the *fail-open* behaviour we want for ADMIN.
 */
export function canAccessPath(role: string | null | undefined, path: string): boolean {
  if (!role) return false;
  if (isAdmin(role)) return true; // unrestricted

  // Normalise: strip trailing slashes and any param segments for lookup.
  const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (cleanPath === "/" || cleanPath === "/dashboard") return true;

  // Find the most specific matching route prefix.
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((p) => cleanPath === p || cleanPath.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (!match) return true; // no specific guard required
  return roleHas(role, ROUTE_PERMISSIONS[match]);
}

/* ──────────────────────────────────────────────────────────────────────────
 *  7.  HUMAN-FRIENDLY ROLE LABELS
 * ──────────────────────────────────────────────────────────────────────── */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  head_teacher: "Head Teacher",
  teacher: "Teacher",
  bursar: "Bursar",
  ict_teacher: "ICT Teacher",
  parent: "Parent",
  student: "Student",
  owner: "Owner",
  super_admin: "Super Admin",
};
