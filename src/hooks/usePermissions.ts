/**
 * =============================================================================
 *  MUNYAKA  ·  usePermissions hook
 * =============================================================================
 *  Bridges the legacy ICT-permission-only hook with the new full RBAC matrix
 *  in src/rbac/permissionMatrix.ts.
 *
 *  Key principle: ADMIN (school administrator) always gets `true` for every
 *  permission, every route, and every sidebar item.  The hook does NOT
 *  change the external API — existing consumers like Layout.tsx, Sidebar.tsx,
 *  Dashboard.tsx, and ProtectedRoute.tsx all continue to work with the same
 *  return shape.
 * =============================================================================
 */
import { useAuth } from '@/context/AuthContext';
import {
  isAdmin,
  roleHas,
  canAccessPath,
  permissionsForRole,
  PERMISSIONS,
} from '@/rbac/permissionMatrix';

const ICT_MANAGER_PERMISSION_KEY = 'munyaka_ict_manager_permission';

/* ── legacy localStorage helpers (kept intact for RBAC-delegation) ── */
const getIctUserIds = (): string[] => {
  try {
    const raw = localStorage.getItem(ICT_MANAGER_PERMISSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.userIds) ? parsed.userIds : [];
  } catch {
    return [];
  }
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const userId = user?.id;

  /* ── helper: does this role match any of the admin-like identifiers ── */
  const isAdminUser = isAdmin(role);

  /* ── legacy ICT permission (still respected for non-admin roles) ── */
  const checkIctManager = (): boolean => {
    if (isAdminUser) return true; // admin always passes

    const roleUpper = (role ?? '').toUpperCase();
    if (roleUpper === 'SUPERADMIN') return true;
    const systemMgmtRoles = ['ICT_TEACHER', 'ICT_TECHNICIAN'];
    if (systemMgmtRoles.includes(roleUpper)) return true;

    return getIctUserIds().includes(userId ?? '');
  };

  /* ── legacy permission switch (extended with RBAC matrix) ── */
  const hasPermission = (permission: string): boolean => {
    if (isAdminUser) return true; // unrestricted
    if (permission === 'manage_ict_systems') return checkIctManager();

    // Delegate to the matrix for all other permission keys
    return roleHas(role, permission as any);
  };

  /* ── route-level guard (used by ProtectedRoute) ── */
  const canAccessRoute = (path: string): boolean => {
    if (isAdminUser) return true;
    return canAccessPath(role, path);
  };

  /* ── full boolean permission map (for Settings RBAC panel) ── */
  const allPermissions = permissionsForRole(role);

  /* ── specific capability flags ── */
  const canAccessSystemManagement = (): boolean => hasPermission('manage_ict_systems');
  const canViewOperationalDashboard = (): boolean => hasPermission(PERMISSIONS.VIEW_OPERATIONAL_DASHBOARD);
  const canManageLearners = (): boolean => hasPermission(PERMISSIONS.MANAGE_LEARNERS);
  const canExecuteTransfers = (): boolean => hasPermission(PERMISSIONS.EXECUTE_TRANSFERS);
  const canViewAlerts = (): boolean => hasPermission(PERMISSIONS.VIEW_RECENT_ALERTS);
  const canManageStaff = (): boolean => hasPermission(PERMISSIONS.MANAGE_STAFF_ACCOUNTS);
  const canCollectFees = (): boolean => hasPermission(PERMISSIONS.COLLECT_FEES);
  const canManageSubscription = (): boolean => hasPermission(PERMISSIONS.MANAGE_SUBSCRIPTION);

  /* ── legacy delegation helpers (admin always passes) ── */
  const grantIctPermission = (uid: string): void => {
    try {
      const ids = getIctUserIds();
      if (!ids.includes(uid)) {
        localStorage.setItem(
          ICT_MANAGER_PERMISSION_KEY,
          JSON.stringify({ userIds: [...ids, uid] })
        );
      }
    } catch { /* ignore */ }
  };

  const revokeIctPermission = (uid: string): void => {
    try {
      localStorage.setItem(
        ICT_MANAGER_PERMISSION_KEY,
        JSON.stringify({ userIds: getIctUserIds().filter((id) => id !== uid) })
      );
    } catch { /* ignore */ }
  };

  return {
    // core helpers
    isAdminUser,
    hasPermission,
    canAccessRoute,
    allPermissions,

    // capability flags
    canAccessSystemManagement,
    canViewOperationalDashboard,
    canManageLearners,
    canExecuteTransfers,
    canViewAlerts,
    canManageStaff,
    canCollectFees,
    canManageSubscription,

    // legacy
    grantIctPermission,
    revokeIctPermission,
  };
}
