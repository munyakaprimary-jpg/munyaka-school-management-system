import { getPermissionsMatrix } from './permissionMatrix';

export function roleHasModulePermission(role: string, moduleKey: string): boolean {
  const normRole = String(role || '').trim().toUpperCase();
  if (normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'OWNER' || normRole === 'HOI') return true;

  const matrix = getPermissionsMatrix();
  const rolePerms = matrix[normRole];
  if (!rolePerms) {
    return true;
  }

  return !!rolePerms[moduleKey];
}
