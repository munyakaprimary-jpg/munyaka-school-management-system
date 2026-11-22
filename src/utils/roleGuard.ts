/**
 * Centralized RBAC Role Guard
 *
 * Single source of truth for role-based access decisions in the Munyaka
 * Primary & JS app. All role checks should normalize through this module so
 * that STUDENT (and any other non-staff) users can never slip into the
 * Teacher Portal through fallback or unnormalized role values.
 */

/** Paths a STUDENT (learner) is allowed to access. */
export const STUDENT_ALLOWED_PATHS = [
  '/student-assessment',
  '/assessments/student',
  '/assessments/list',
];

/**
 * Normalize any raw role string from any source into a canonical lowercase
 * RBAC key. Checks the common field names used across auth state, staff
 * directory records, and session payloads: `role`, `userType`, `accountType`,
 * `staffRole`, `systemRole`, `category`, `designation`.
 */
export function normalizeRoleFromUser(user: any): string {
  if (!user) return '';
  const candidates = [
    user.role,
    user.userType,
    user.accountType,
    user.staffRole,
    user.systemRole,
    user.category,
    user.designation,
  ];
  for (const c of candidates) {
    const v = String(c ?? '').trim().toLowerCase();
    if (v) return v;
  }
  return '';
}

/**
 * True when the normalized role represents a STUDENT / learner / pupil.
 * Catches raw values like "STUDENT", "student", "Learner", "LEARNER",
 * "Pupil", "pupil", "Class Student", etc.
 */
export function isStudentRole(userOrRole: any): boolean {
  const raw = typeof userOrRole === 'string' ? userOrRole : normalizeRoleFromUser(userOrRole);
  const norm = String(raw || '').trim().toLowerCase();
  if (!norm) return false;
  const upper = norm.toUpperCase();
  const isStudentish =
    upper === 'STUDENT' ||
    upper === 'LEARNER' ||
    upper === 'LEARNERS' ||
    upper === 'PUPIL' ||
    upper === 'PUPILS' ||
    upper === 'LEARNING' ||
    upper === 'LEARNERSHIP';
  const containsStudent = norm.includes('student') || norm.includes('learner') || norm.includes('pupil');
  return isStudentish || containsStudent;
}

/**
 * True when the user is a staff member allowed into the Teacher Portal
 * (teachers, head teachers, deputy head, admin, owner, etc.).
 * Students and all other non-staff roles are denied.
 */
export function isStaffPortalRole(userOrRole: any): boolean {
  const raw = typeof userOrRole === 'string' ? userOrRole : normalizeRoleFromUser(userOrRole);
  const norm = String(raw || '').trim().toLowerCase();
  if (!norm) return false;
  const upper = norm.toUpperCase();
  const isStaffish =
    upper === 'TEACHER' ||
    upper === 'CLASS_TEACHER' ||
    upper === 'SUBJECT_TEACHER' ||
    upper === 'HEAD_TEACHER' ||
    upper === 'SENIOR_TEACHER' ||
    upper === 'DEPUTY_HEAD_TEACHER' ||
    upper === 'HOI' ||
    upper === 'DHOI' ||
    upper === 'ADMIN' ||
    upper === 'OWNER' ||
    upper === 'SUPER_ADMIN' ||
    upper === 'SCHOOL_ADMIN' ||
    upper === 'DEVELOPER' ||
    upper === 'SUPERADMIN' ||
    upper === 'ACCOUNTANT' ||
    upper === 'BURSAR' ||
    upper === 'LIBRARY_TEACHER' ||
    upper === 'LIBRARIAN' ||
    upper === 'ICT_TEACHER' ||
    upper === 'ICT_TECHNICIAN' ||
    upper === 'LAB_TEACHER' ||
    upper === 'STORE_MASTER' ||
    upper === 'STOREKEEPER' ||
    upper === 'SUPPORT_STAFF' ||
    upper === 'SUPPORT' ||
    upper === 'STAFF' ||
    upper === 'NON_TEACHING';
  const containsStaffish = norm.includes('teacher') || norm.includes('staff') || norm.includes('admin') || norm.includes('owner') || norm.includes('librarian') || norm.includes('ict') || norm.includes('bursar') || norm.includes('accountant') || norm.includes('store') || norm.includes('support');
  return isStaffish || containsStaffish;
}

/**
 * True when the user is allowed to view the Teacher Portal.
 * Students and any non-staff/non-teacher role are denied.
 */
export function canAccessTeacherPortal(userOrRole: any): boolean {
  if (isStudentRole(userOrRole)) return false;
  return isStaffPortalRole(userOrRole);
}
