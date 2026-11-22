import { getPermissionsMatrix } from './permissionMatrix';

export function roleHasModulePermission(role: string, moduleKey: string): boolean {
  const normRole = String(role || '').trim().toUpperCase();

  // ── Strict RBAC: STUDENT / learner / pupil roles are denied all staff modules ──
  if (
    normRole === 'STUDENT' ||
    normRole === 'LEARNER' ||
    normRole === 'LEARNERS' ||
    normRole === 'PUPIL' ||
    normRole === 'PUPILS' ||
    normRole.includes('STUDENT') ||
    normRole.includes('LEARNER') ||
    normRole.includes('PUPIL')
  ) {
    return false;
  }

  if (normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'SUPERADMIN' || normRole === 'OWNER' || normRole === 'HOI' || normRole === 'SCHOOL_ADMIN') return true;
  if (moduleKey === 'daily_checkin') return true;
  if (normRole.includes('ICT') || normRole.includes('TECH') || normRole === 'ICT_TEACHER' || normRole === 'ICT_TECHNICIAN' || normRole === 'SUBJECT_TEACHER' || normRole === 'TEACHER') {
    return true;
  }

  // Check custom live RBAC matrix stored in localStorage first
  try {
    const rawMatrix = localStorage.getItem('munyaka_rbac_matrix');
    if (rawMatrix) {
      const parsedMatrix = JSON.parse(rawMatrix);
      const rolePerms = parsedMatrix[normRole] || parsedMatrix[role] || {};
      if (moduleKey in rolePerms) {
        return !!rolePerms[moduleKey];
      }
    }
  } catch (err) {
    console.error('Error reading munyaka_rbac_matrix from localStorage:', err);
  }

  const matrix = getPermissionsMatrix();
  const rolePerms = matrix[normRole];
  if (!rolePerms) {
    return true;
  }

  return !!rolePerms[moduleKey];
}