/**
 * Role Constants and Strict Mapping Helpers
 * Enforces the exact 9 Staff Directory roles with zero default fallback.
 */

export const EXACT_STAFF_ROLES = [
  'Class Teacher',
  'Subject Teacher',
  'ICT Teacher',
  'Lab Teacher',
  'Bursar',
  'Library Teacher',
  'HOI',
  'DHOI',
  'Store Master'
] as const;

export type ExactStaffRole = typeof EXACT_STAFF_ROLES[number];

/**
 * Normalize a staff role string: trim and collapse internal whitespace.
 */
export function normalizeStaffRole(raw: string): string {
  return String(raw || '').trim().replace(/\s+/g, ' ');
}

/**
 * Strict mapping from exact staff role to RBAC key / portal identifier.
 * Zero default fallback: unmapped roles return 'unmapped'.
 */
export function mapRoleLabelToRbacKey(labelOrRole: string): string {
  const norm = normalizeStaffRole(labelOrRole);
  const lower = norm.toLowerCase();

  switch (lower) {
    case 'hoi':
    case 'head of institution':
    case 'principal':
      return 'hoi';
    case 'dhoi':
    case 'deputy head of institution':
      return 'dhoi';
    case 'admin':
    case 'administrator':
      return 'admin';
    case 'class teacher':
    case 'classteacher':
      return 'class_teacher';
    case 'subject teacher':
    case 'subjectteacher':
    case 'teacher':
      return 'subject_teacher';
    case 'ict teacher':
    case 'ict':
    case 'ict_teacher':
      return 'ict_teacher';
    case 'lab teacher':
    case 'science lab teacher':
    case 'lab_teacher':
      return 'lab_teacher';
    case 'bursar':
    case 'accountant':
      return 'bursar';
    case 'library teacher':
    case 'librarian':
      return 'library_teacher';
    case 'store master':
    case 'storekeeper':
    case 'store_master':
      return 'store_master';
    case 'owner':
    case 'school owner':
      return 'owner';
    case 'student':
    case 'learner':
      return 'student';
    case 'parent':
    case 'guardian':
      return 'parent';
    default:
      return 'unmapped';
  }
}

/**
 * Get exact display title for a staff role.
 */
export function getExactStaffRoleTitle(rawRole: string): string {
  const norm = normalizeStaffRole(rawRole);
  const key = mapRoleLabelToRbacKey(norm);
  switch (key) {
    case 'hoi': return 'HOI';
    case 'dhoi': return 'DHOI';
    case 'admin': return 'Admin';
    case 'class_teacher': return 'Class Teacher';
    case 'subject_teacher': return 'Subject Teacher';
    case 'ict_teacher': return 'ICT Teacher';
    case 'lab_teacher': return 'Lab Teacher';
    case 'bursar': return 'Bursar';
    case 'library_teacher': return 'Library Teacher';
    case 'store_master': return 'Store Master';
    default: return norm || 'Staff Member';
  }
}
