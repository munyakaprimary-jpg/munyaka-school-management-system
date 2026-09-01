import { useAuth } from '@/context/AuthContext';

const ICT_MANAGER_PERMISSION_KEY = 'munyaka_ict_manager_permission';

/**
 * Check if the current user has the ICT system management permission.
 * This permission can be delegated to any staff member by the school admin.
 * 
 * ICT-related roles that are automatically granted this permission:
 * - ICT Officer
 * - ICT Teacher
 * - ICT Champion
 * - Lab Technician
 * - School Admin (owner, super_admin)
 * 
 * Additional roles can be granted permission via Settings > RBAC.
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission.
   * @param permission - The permission key to check (e.g., 'manage_ict_systems')
   * @returns boolean indicating if the user has the permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Owner and super_admin always have all permissions
    if (user.role === 'owner' || user.role === 'super_admin') {
      return true;
    }

    // Check specific permissions
    switch (permission) {
      case 'manage_ict_systems':
        return checkICTManagerPermission();
      default:
        return false;
    }
  };

  /**
   * Internal check for ICT manager permission.
   * Checks both role-based and delegated permission flags.
   */
  const checkICTManagerPermission = (): boolean => {
    // Check if the user has an ICT-related system role
    const ictRoles = ['ict_officer', 'ict_teacher', 'ict_champion', 'lab_technician'];
    const userRole = user?.role?.toLowerCase() || '';
    
    if (ictRoles.includes(userRole)) {
      return true;
    }

    // Check if permission was explicitly delegated via localStorage
    try {
      const ictPermissionFlag = localStorage.getItem(ICT_MANAGER_PERMISSION_KEY);
      if (ictPermissionFlag) {
        const permissions = JSON.parse(ictPermissionFlag);
        // Check if current user's ID or email is in the permissions list
        if (Array.isArray(permissions.userIds) && user?.id) {
          return permissions.userIds.includes(user.id);
        }
      }
    } catch {
      // localStorage read failed, permission not granted
    }

    return false;
  };

  /**
   * Grant ICT manager permission to a user (admin function).
   * @param userId - The user ID to grant permission to
   */
  const grantICTPermission = (userId: string): void => {
    try {
      const ictPermissionFlag = localStorage.getItem(ICT_MANAGER_PERMISSION_KEY);
      let permissions: { userIds: string[] } = { userIds: [] };
      
      if (ictPermissionFlag) {
        permissions = JSON.parse(ictPermissionFlag);
      }
      
      if (!permissions.userIds.includes(userId)) {
        permissions.userIds.push(userId);
      }
      
      localStorage.setItem(ICT_MANAGER_PERMISSION_KEY, JSON.stringify(permissions));
    } catch {
      console.error('Failed to grant ICT permission');
    }
  };

  /**
   * Revoke ICT manager permission from a user (admin function).
   * @param userId - The user ID to revoke permission from
   */
  const revokeICTPermission = (userId: string): void => {
    try {
      const ictPermissionFlag = localStorage.getItem(ICT_MANAGER_PERMISSION_KEY);
      if (ictPermissionFlag) {
        const permissions = JSON.parse(ictPermissionFlag);
        permissions.userIds = permissions.userIds.filter((id: string) => id !== userId);
        localStorage.setItem(ICT_MANAGER_PERMISSION_KEY, JSON.stringify(permissions));
      }
    } catch {
      console.error('Failed to revoke ICT permission');
    }
  };

  /**
   * Check if user can access System Management module.
   * Includes: Portal Logins, Network & Quotas, Lab Schedules
   */
  const canAccessSystemManagement = (): boolean => {
    return hasPermission('manage_ict_systems');
  };

  return {
    hasPermission,
    canAccessSystemManagement,
    grantICTPermission,
    revokeICTPermission,
  };
}
