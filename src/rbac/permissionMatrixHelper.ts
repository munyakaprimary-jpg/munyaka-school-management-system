import { getPermissionsMatrix } from './permissionMatrix';

export function roleHasModulePermission(role: string, moduleKey: string, rbacRole?: string): boolean {
  const normRole = String(role || '').trim().toUpperCase();
  const normRbac = String(rbacRole || role || '').trim().toUpperCase();
  if (normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'OWNER' || normRole === 'HOI' || normRbac === 'ADMIN' || normRbac === 'OWNER') return true;

  // Check custom live RBAC matrix stored in localStorage first
  try {
    const rawMatrix = localStorage.getItem('munyaka_rbac_matrix');
    if (rawMatrix) {
      const parsedMatrix = JSON.parse(rawMatrix);
      const rolePerms = parsedMatrix[normRbac] || parsedMatrix[normRole] || parsedMatrix[role] || {};
      if (moduleKey in rolePerms) {
        return !!rolePerms[moduleKey];
      }
    }
  } catch (err) {
    console.error('Error reading munyaka_rbac_matrix from localStorage:', err);
  }

  const matrix = getPermissionsMatrix();
  const rolePerms = matrix[normRbac] || matrix[normRole];
  if (!rolePerms) {
    return true;
  }

  return !!rolePerms[moduleKey];
}
