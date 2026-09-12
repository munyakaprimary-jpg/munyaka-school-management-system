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
 *  ROLE TAXONOMY
 *  ───────────────────────────────────────────────────────────────────────────
 *  admin        → SCHOOL ADMINISTRATOR. Full unrestricted access to every
 *                  module, widget, route, sidebar entry, and operational
 *                  control surface in the school system.  Super-set of
 *                  HEADTEACHER + BURSAR + ICT + the old super_admin.
 *
 *                  NOTE: super_admin and admin are merged.  Both identifiers
 *                  resolve to the admin role at runtime.  The canonical
 *                  identifier stored in auth is "admin".
 *
 *  owner        → PLATFORM BILLING OWNER. Completely separate from admin.
 *                  Has NO operational access. Can see subscription/billing
 *                  widgets, the payment-management page, and the owner
 *                  executive dashboard only.
 *
 *  head_teacher → Operational school manager (learners, attendance, transfers,
 *                  alerts, staff accounts, settings).
 *
 *  teacher      → Classroom scope (assigned classes, marksheets, registers).
 *
 *  bursar       → Finance scope (fee collection, payment logs, ledger).
 *
 *  ict_teacher  → Infrastructure scope (portal logins, network quotas, lab
 *                  schedules). Granted via RBAC delegation.
 *
 *  parent / student → Read-only on own data.
 *
 *  All role comparisons are case-insensitive (lowercased before lookup).
 *  Every guard helper short-circuits to "allowed" when role === "admin".
 * =============================================================================
 */

import type { WidgetKey } from "@/pages/Dashboard";

/* ──────────────────────────────────────────────────────────────────────────
 *  1.  CORE ROLE CONSTANTS
 * ──────────────────────────────────────────────────────────────────────── */

/** Canonical role identifiers. */
export const ROLES = {
  ADMIN: "admin",
  HEAD_TEACHER: "head_teacher",
  TEACHER: "teacher",
  BURSAR: "bursar",
  ICT_TEACHER: "ict_teacher",
  PARENT: "parent",
  STUDENT: "student",
  OWNER: "owner",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Maps legacy "super_admin" identifier → canonical "admin" at runtime.
 *  The canonical identifier stored in auth is always "admin".
 *  Callers can pass either "admin" or "super_admin" and get admin behaviour. */
export const normalizeAdmin = (role?: string | null): Role | null => {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r === "admin" || r === "super_admin") return ROLES.ADMIN;
  if (r === "head_teacher" || r === "headteacher") return ROLES.HEAD_TEACHER;
  if (r === "ict_teacher" || r === "ict_technician") return ROLES.ICT_TEACHER;
  if (r in ROLES) return r as Role;
  return null;
};

/** True when role is the school administrator (admin / super_admin merged). */
export const isAdmin = (role?: string | null): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "super_admin";
};

/** True when role is the platform billing owner. Completely separate from
 *  admin — owner has NO operational access. */
export const isOwner = (role?: string | null): boolean => {
  if (!role) return false;
  return role.toLowerCase() === "owner";
};

/** Roles that hold PRIMARY ADMINISTRATIVE authority over the school. These
 *  are the only roles that may see the full, school-wide Dashboard
 *  Overview (system-wide student counts, staff totals, fee collection
 *  metrics, and global activity feeds / alerts).
 *
 *  Centralised here so every guard site (Dashboard router, ProtectedRoute,
 *  Sidebar, usePermissions, etc.) agrees on the same list.  Changing this
 *  constant automatically updates every check. */
export const FULL_DASHBOARD_ROLES: ReadonlyArray<Role> = [
  ROLES.ADMIN,
  ROLES.HEAD_TEACHER,
  // The 'dev' identifier is reserved for system developers / engineers
  // who need unrestricted visibility during deployment or support work.
  "dev" as Role,
];

/** True ONLY for users holding primary administrative authority over the
 *  school.  This is the single source of truth used to gate the full
 *  Dashboard Overview.
 *
 *  Accepted inputs (case-insensitive, normalised):
 *    • admin        ✓
 *    • super_admin  ✓ (legacy alias for admin)
 *    • head_teacher ✓
 *    • dev          ✓
 *
 *  Every other role (teacher, bursar, ict_teacher, parent, student,
 *  owner, …) returns `false` and must be routed to a scoped dashboard
 *  instead. */
export function hasFullDashboardAccess(
  role?: string | null
): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  if (r === "admin" || r === "super_admin") return true;
  if (r === "head_teacher" || r === "headteacher") return true;
  if (r === "dev") return true;
  return false;
}

/** True for users who should see a class-level, restricted dashboard.
 *  Currently: any teaching staff (teacher / ict_teacher / head_teacher)
 *  who does NOT already qualify for the full dashboard.  Head teachers
 *  see the full view via `hasFullDashboardAccess`; this helper is for
 *  the narrower "classroom scope" group. */
export function hasClassDashboardAccess(
  role?: string | null
): boolean {
  if (hasFullDashboardAccess(role)) return false;
  if (!role) return false;
  const r = resolveRole(role);
  if (!r) return false;
  return r === ROLES.TEACHER || r === ROLES.ICT_TEACHER;
}

/** True for users who should see a finance-only dashboard. */
export function hasFinanceDashboardAccess(
  role?: string | null
): boolean {
  if (hasFullDashboardAccess(role)) return false;
  if (!role) return false;
  const r = resolveRole(role);
  if (!r) return false;
  return r === ROLES.BURSAR;
}

/** True for users who should see a personalised student-portal dashboard
 *  (their own report cards, attendance logs, and school announcements). */
export function hasStudentPortalAccess(
  role?: string | null
): boolean {
  if (!role) return false;
  const r = resolveRole(role);
  if (!r) return false;
  return r === ROLES.STUDENT || r === ROLES.PARENT;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  2.  SEMANTIC PERMISSION KEYS
 * ──────────────────────────────────────────────────────────────────────── */
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
 *  admin      → every permission in the system (unrestricted)
 *  head_teacher → operational + people + academics
 *  teacher    → class marksheets & registers
 *  bursar     → fee collection & payment logs
 *  ict_teacher → system infrastructure (granted via RBAC delegation)
 *  parent     → read-only on own children
 *  student    → read-only on own profile
 *  owner      → billing-only (subscription, payments, renewal) — no operational access
 */
const adminSet: Record<Permission, true> = Object.values(PERMISSIONS).reduce(
  (acc, p) => ({ ...acc, [p]: true }),
  {} as Record<Permission, true>
);

export const ROLE_PERMISSIONS: Record<Role, Record<Permission, true | null>> = {
  /* ───────────── ADMIN: full unrestricted access ───────────── */
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

  /* ───────────── OWNER: platform billing only — NO operational access ───────────── */
  owner: {
    view_operational_dashboard: null,
    manage_learners: null,
    execute_transfers: null,
    view_learner_archive: null,
    view_attendance_trends: null,
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
    manage_parent_access: null,
    manage_ict_systems: null,
    access_portal_logins: null,
    access_network_quotas: null,
    access_lab_schedules: null,
    edit_school_settings: null,
    access_central_data: true,
    // Owner has explicit billing access only
    manage_subscription: true,
    manage_billing: true,
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  4.  PUBLIC GUARD HELPERS
 * ──────────────────────────────────────────────────────────────────────── */

/** Resolve a role string to a canonical Role, normalising admin aliases. */
export function resolveRole(role?: string | null): Role | null {
  if (!role) return null;
  return normalizeAdmin(role);
}

/** Does the given role have a specific permission? ADMIN always passes. */
export function roleHas(role: string | null | undefined, perm: Permission): boolean {
  if (isAdmin(role)) return true;
  const r = resolveRole(role);
  if (!r) return false;
  return ROLE_PERMISSIONS[r]?.[perm] === true;
}

/** Convert role → full boolean permission map. */
export function permissionsForRole(
  role: string | null | undefined
): Record<Permission, boolean> {
  if (isAdmin(role)) {
    return Object.values(PERMISSIONS).reduce(
      (acc, p) => ({ ...acc, [p]: true }),
      {} as Record<Permission, boolean>
    );
  }
  const r = resolveRole(role);
  if (!r) {
    return Object.values(PERMISSIONS).reduce(
      (acc, p) => ({ ...acc, [p]: false }),
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
 * ──────────────────────────────────────────────────────────────────────── */
export const ROLE_DASHBOARD_WIDGETS: Record<Role, WidgetKey[]> = {
  // ADMIN: complete master set — operational + ICT + billing
  admin: [
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

  // OWNER: billing/subscription metrics only — NO operational widgets
  owner: [
    "subscriptionStatus",
    "totalActiveEnrollment",
    "renewalDate",
    "systemStatus",
  ],
};

/** Get the dashboard widget set for a role. ADMIN always returns the
 *  complete master list regardless of the underlying role map. */
export function widgetsForRole(role: string | null | undefined): WidgetKey[] {
  if (isAdmin(role)) {
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
  const r = resolveRole(role);
  if (!r) return ["systemStatus"];
  return ROLE_DASHBOARD_WIDGETS[r] ?? ["systemStatus"];
}

/* ──────────────────────────────────────────────────────────────────────────
 *  6.  ROUTE GUARDS
 * ──────────────────────────────────────────────────────────────────────── */
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
 * ADMIN bypasses every check. OWNER is explicitly blocked from operational
 * routes via the matrix (collect_fees, manage_learners, etc.).
 */
export function canAccessPath(
  role: string | null | undefined,
  path: string
): boolean {
  if (!role) return false;
  if (isAdmin(role)) return true; // unrestricted

  const cleanPath = (path.split("?")[0].replace(/\/+$/, "") || "/");
  if (cleanPath === "/" || cleanPath === "/dashboard") return true;

  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((p) => cleanPath === p || cleanPath.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (!match) return true;
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
};
