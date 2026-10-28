/**
 * RBAC Permission Evaluator Guard & Menu Filtering Helper
 * Exact role and title permission evaluations for staff members.
 */

import { roleHas as matrixRoleHas } from '@/rbac/permissionMatrix';
import { getCurrentSessionUser, SessionUser } from '@/services/authService';
import { APP_SIDEBAR_MENUS, SidebarMenuItem } from '@/constants/sidebarMenus';
export type { SidebarMenuItem };

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

  // Admin or Owner roles have full access
  if (role === 'ADMIN' || role === 'OWNER' || role === 'HOI' || role === 'SUPER_ADMIN' || role === 'SYSADMIN' || role === 'DHOI') {
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
    if (userRole === reqRole) {
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

/**
 * Retrieves the active user from localStorage ('munyaka_current_user') or session service
 */
export function getActiveUserSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem('munyaka_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as SessionUser;
      }
    }
  } catch (e) {
    // ignore parsing errors
  }
  return getCurrentSessionUser();
}

/**
 * Filters APP_SIDEBAR_MENUS based on the active user's rbacRole / role (read from localStorage 'munyaka_current_user').
 * Strictly restricts staff_registry, fees_finance, settings, admin_control, data_harmonization, tenants_campuses,
 * and central_data_apk away from teaching roles, while allowing specialized workstation access.
 */
export function getFilteredSidebarMenus(customUser?: SessionUser | null): SidebarMenuItem[] {
  const user = customUser || getActiveUserSession();
  
  const rawRole = (user as any)?.rbacRole || user?.role || 'class_teacher';
  const roleKey = String(rawRole).toLowerCase().trim();

  // Admin / Owner / Management roles have access to all menus
  const isSuperAdminOrOwner = ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin'].includes(roleKey);

  return APP_SIDEBAR_MENUS.filter(menu => {
    // If super admin / owner, allow all except specific role checks if any
    if (isSuperAdminOrOwner) {
      if (menu.key === 'fees_finance' && roleKey === 'owner') return true;
      return true;
    }

    // Check if user's roleKey is explicitly in allowedRoles for this menu
    const allowed = menu.allowedRoles.map(r => r.toLowerCase());
    return allowed.includes(roleKey);
  });
}
