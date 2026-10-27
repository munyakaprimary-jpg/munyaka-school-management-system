/**
 * RBAC Permission Evaluator Guard
 * Exact role and title permission evaluations for staff members.
 */

import { getPermissionsMatrix, resolveRole, roleHas as matrixRoleHas } from '@/rbac/permissionMatrix';
import { getCurrentSessionUser, SessionUser } from '@/services/authService';

export interface RBACCheckOptions {
  user?: SessionUser | null;
  permission?: string;
  requiredRole?: string;
  requiredTitle?: string;
}

/**
 * Checks whether the current user or provided user has permission for a given module or feature
 * based on their exact role, title, and customized permissions in munyaka_current_user.
 */
export function evaluatePermission(permissionKey: string, user?: SessionUser | null): boolean {
  const currentUser = user || getCurrentSessionUser();
  if (!currentUser) return false;

  const role = String(currentUser.role || '').toUpperCase();
  const title = String(currentUser.title || '').toLowerCase();

  // Admin or Owner roles have full access
  if (role === 'ADMIN' || role === 'OWNER' || role === 'HOI' || role === 'SUPER_ADMIN' || role === 'SYSADMIN') {
    return true;
  }

  // Check custom permissions if embedded in session
  if (currentUser.permissions && typeof currentUser.permissions[permissionKey] === 'boolean') {
    return currentUser.permissions[permissionKey];
  }

  // Fallback to role-based permission matrix check
  return matrixRoleHas(currentUser.role, permissionKey);
}

/**
 * Check if user matches a specific role or title
 */
export function hasRoleOrTitle(options: RBACCheckOptions): boolean {
  const user = options.user || getCurrentSessionUser();
  if (!user) return false;

  const userRole = String(user.role || '').toLowerCase();
  const userTitle = String(user.title || '').toLowerCase();

  if (options.requiredRole) {
    const reqRole = options.requiredRole.toLowerCase();
    if (userRole === reqRole || resolveRole(user.role).toLowerCase() === reqRole) {
      return true;
    }
  }

  if (options.requiredTitle) {
    const reqTitle = options.requiredTitle.toLowerCase();
    if (userTitle.includes(reqTitle) || reqTitle.includes(userTitle)) {
      return true;
    }
  }

  return false;
}

/**
 * Convenience guard hook or checker
 */
export function canAccessModule(moduleKey: string): boolean {
  return evaluatePermission(moduleKey);
}
