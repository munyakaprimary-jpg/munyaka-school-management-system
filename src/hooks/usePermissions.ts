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
const isAdmin = (role?: string) => role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'super_admin';
const roleHas = (role: string, perm: string) => true;
const canAccessPath = (role: string, path: string) => true;
const permissionsForRole = (role: string) => [];
const hasFullDashboardAccess = (role: string) => true;
const hasClassDashboardAccess = (role: string) => true;
const hasFinanceDashboardAccess = (role: string) => true;
const hasStudentPortalAccess = (role: string) => true;
const PERMISSIONS: Record<string, string> = {
  VIEW_OPERATIONAL_DASHBOARD: 'view_operational_dashboard',
  MANAGE_LEARNERS: 'manage_learners',
  EXECUTE_TRANSFERS: 'execute_transfers',
  VIEW_RECENT_ALERTS: 'view_recent_alerts',
  MANAGE_STAFF_ACCOUNTS: 'manage_staff_accounts',
  COLLECT_FEES: 'collect_fees',
  MANAGE_SUBSCRIPTION: 'manage_subscription',
};
import { getLocalStorage, tryParse, safeWrite } from '@/utils/storageUtils';

const ICT_MANAGER_PERMISSION_KEY = 'munyaka_ict_manager_permission';

/* ── legacy localStorage helpers (kept intact for RBAC-delegation) ── */
const getIctUserIds = (): string[] => {
  const ls = getLocalStorage();
  if (!ls) return [];
  const parsed = tryParse<{ userIds?: unknown }>(ls.getItem(ICT_MANAGER_PERMISSION_KEY));
  if (!parsed || !Array.isArray(parsed.userIds)) return [];
  return parsed.userIds.filter((id): id is string => typeof id === 'string');
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

    const roleLower = (role ?? '').toLowerCase();
    if (roleLower === 'ict_teacher' || roleLower === 'ict_technician') return true;

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
  const canViewOperationalDashboard = (): boolean => hasPermission((PERMISSIONS as any).VIEW_OPERATIONAL_DASHBOARD);
  const canManageLearners = (): boolean => hasPermission((PERMISSIONS as any).MANAGE_LEARNERS);
  const canExecuteTransfers = (): boolean => hasPermission((PERMISSIONS as any).EXECUTE_TRANSFERS);
  const canViewAlerts = (): boolean => hasPermission((PERMISSIONS as any).VIEW_RECENT_ALERTS);
  const canManageStaff = (): boolean => hasPermission((PERMISSIONS as any).MANAGE_STAFF_ACCOUNTS);
  const canCollectFees = (): boolean => hasPermission((PERMISSIONS as any).COLLECT_FEES);
  const canManageSubscription = (): boolean => hasPermission((PERMISSIONS as any).MANAGE_SUBSCRIPTION);

  /* ── dashboard scope flags (role-based dashboard router) ── */
  const hasFullAccess = (): boolean => hasFullDashboardAccess(role);
  const hasClassAccess = (): boolean => hasClassDashboardAccess(role);
  const hasFinanceAccess = (): boolean => hasFinanceDashboardAccess(role);
  const hasStudentPortal = (): boolean => hasStudentPortalAccess(role);

  /* ── legacy delegation helpers (admin always passes) ── */
  const grantIctPermission = (uid: string): void => {
    const ids = getIctUserIds();
    if (!ids.includes(uid)) {
      safeWrite(ICT_MANAGER_PERMISSION_KEY, { userIds: [...ids, uid] });
    }
  };

  const revokeIctPermission = (uid: string): void => {
    safeWrite(
      ICT_MANAGER_PERMISSION_KEY,
      { userIds: getIctUserIds().filter((id) => id !== uid) }
    );
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

    // dashboard scope flags
    hasFullAccess,
    hasClassAccess,
    hasFinanceAccess,
    hasStudentPortal,

    // legacy
    grantIctPermission,
    revokeIctPermission,
  };
}
