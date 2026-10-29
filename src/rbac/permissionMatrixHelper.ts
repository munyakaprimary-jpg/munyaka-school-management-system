import { getPermissionsMatrix } from './permissionMatrix';

export function roleHasModulePermission(role: string, moduleKey: string): boolean {
  const normRole = String(role || '').trim().toUpperCase();
  if (normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'OWNER' || normRole === 'HOI') return true;
  if (moduleKey === 'daily_checkin') return true;

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
