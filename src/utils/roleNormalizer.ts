/** 
 * Unified Role Normalizer for Munyaka Staff Portal
 * 
 * Normalizes role values from various sources consistently:
 * - assignedRole (from staff directory)
 * - role (from user auth state)
 * - category (from staff records)
 * - rawPayload (legacy Firestore field mappings)
 * 
 * Converts values like "Class Teacher", "class_teacher", "CLASS_TEACHER" 
 * consistently to "class_teacher" (the RBAC key).
 * 
 * @param rawRole - Raw role string from any source
 * @param rawCategory - Optional category string 
 * @param rawAssignedRole - Optional assignedRole string
 * @param rawPayload - Optional raw payload object (legacy format)
 * @returns Normalized RBAC key (e.g., "class_teacher", "admin", "subject_teacher")
 */
export function normalizeStaffRole(
  rawRole?: string,
  rawCategory?: string,
  rawAssignedRole?: string,
  rawPayload?: any
): string {
  // First, try rawPayload if provided (legacy Firestore format)
  if (rawPayload) {
    const payloadRole = 
      rawPayload.assignedRole || 
      rawPayload.role || 
      rawPayload.category || 
      rawPayload.designation ||
      rawPayload.systemRole;
    
    if (payloadRole) {
      const normalized = normalizeStaffRole(payloadRole);
      if (normalized !== 'unmapped') return normalized;
    }
  }

  // Collect all possible role sources, prioritizing in order
  const roleSources: string[] = [];
  
  if (rawRole) roleSources.push(String(rawRole).trim());
  if (rawCategory) roleSources.push(String(rawCategory).trim());
  if (rawAssignedRole) roleSources.push(String(rawAssignedRole).trim());

  // If we have sources, use the first non-empty one that maps successfully
  if (roleSources.length > 0) {
    for (const role of roleSources) {
      const result = mapRoleToRbacKey(role);
      if (result !== 'unmapped') return result;
    }
  }

  // Fallback: normalize via toUpperCase + replace spaces with underscores
  // This handles cases like "Class Teacher" -> "CLASS_TEACHER" -> "CLASS_TEACHER"
  // But we want "class_teacher", so convert to lowercase with underscores
  const fallback = String(rawRole || rawCategory || rawAssignedRole || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

  return fallback || 'unmapped';
}

/** 
 * Maps a normalized role string to its canonical RBAC key.
 * Uses the existing mapping from src/constants/roles but enhanced.
 */
export function mapRoleToRbacKey(role: string): string {
  const norm = String(role || '').trim().toLowerCase();

  // Direct mappings
  const roleMap: Record<string, string> = {
    'admin': 'admin',
    'owner': 'owner',
    'hoi': 'hoi',
    'dhoi': 'dhoi',
    'class_teacher': 'class_teacher',
    'subject_teacher': 'subject_teacher',
    'ict_teacher': 'ict_teacher',
    'lab_teacher': 'lab_teacher',
    'bursar': 'bursar',
    'library_teacher': 'library_teacher',
    'store_master': 'store_master',
    'student': 'student',
    'parent': 'parent',
  };

  if (roleMap[norm]) return roleMap[norm];

  // Substring/pattern-based mappings
  if (norm.includes('class teacher') || norm.includes('classteacher') || norm.includes('class_teacher')) return 'class_teacher';
  if (norm.includes('subject teacher') || norm.includes('subjectteacher') || norm.includes('subject_teacher')) return 'subject_teacher';
  if (norm === 'teacher' || norm.includes('teacher') || norm.includes('educator')) return 'class_teacher';
  if (norm.includes('ict teacher') || norm.includes('ict') || norm.includes('ict_teacher')) return 'ict_teacher';
  if (norm.includes('lab teacher') || norm.includes('lab_teacher') || norm.includes('science lab')) return 'lab_teacher';
  if (norm.includes('library teacher') || norm.includes('librarian') || norm.includes('library')) return 'library_teacher';
  if (norm.includes('bursar') || norm.includes('accountant')) return 'bursar';
  if (norm.includes('store') || norm.includes('storekeeper') || norm.includes('store_master')) return 'store_master';

  return 'unmapped';
}

/** 
 * Checks if a role has admin/owner privileges.
 * Returns true only for admin, owner, HOI, DHOI, SUPER_ADMIN roles.
 */
export function isAdminRole(normalizedRole: string): boolean {
  const adminRoles = ['admin', 'owner', 'hoi', 'dhoi', 'super_admin'];
  return adminRoles.includes(normalizedRole);
}

/** 
 * Checks if a role is a class_teacher role.
 */
export function isClassTeacherRole(normalizedRole: string): boolean {
  return normalizedRole === 'class_teacher';
}

/** 
 * Checks if a role is a subject_teacher role.
 */
export function isSubjectTeacherRole(normalizedRole: string): boolean {
  return normalizedRole === 'subject_teacher';
}

/** 
 * Checks if a role is an ICT teacher role.
 */
export function isIctTeacherRole(normalizedRole: string): boolean {
  return normalizedRole === 'ict_teacher';
}

/** 
 * Checks if a role is a bursar role.
 */
export function isBursarRole(normalizedRole: string): boolean {
  return normalizedRole === 'bursar';
}

/** 
 * Checks if a role is a library_teacher role.
 */
export function isLibrarianRole(normalizedRole: string): boolean {
  return normalizedRole === 'library_teacher';
}