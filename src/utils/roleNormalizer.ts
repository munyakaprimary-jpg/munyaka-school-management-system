/**
 * Role Normalization Utility
 *
 * Normalizes all legacy roles (including "owner", "super_admin", "school_admin",
 * "administrator", "superadmin", etc.) into a clean canonical set:
 * "admin", "teacher", "bursar", "librarian", "student", "support", etc.
 */

export function normalizeSystemRole(rawRole: string | undefined | null): string {
  const norm = String(rawRole || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!norm) return 'staff';

  if (
    norm === 'owner' ||
    norm === 'super_admin' ||
    norm === 'superadmin' ||
    norm === 'school_admin' ||
    norm === 'administrator' ||
    norm === 'admin' ||
    norm === 'hoi'
  ) {
    return 'admin';
  }

  if (norm.includes('teacher') || norm === 'staff' || norm === 'educator') {
    return 'teacher';
  }

  if (norm === 'bursar' || norm === 'accountant' || norm === 'finance') {
    return 'bursar';
  }

  if (norm === 'librarian' || norm === 'library_teacher') {
    return 'librarian';
  }

  if (norm === 'student' || norm === 'learner' || norm === 'pupil') {
    return 'student';
  }

  return norm;
}

export function isAdminRole(roleOrUser: any): boolean {
  const raw = typeof roleOrUser === 'string' ? roleOrUser : (roleOrUser?.role || roleOrUser?.systemRole || roleOrUser?.userType || '');
  const norm = normalizeSystemRole(raw);
  return norm === 'admin';
}
