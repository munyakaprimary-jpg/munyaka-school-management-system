"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Optional permission required to access the route. If specified, the
   * user must have this permission in addition to being authenticated.
   * ADMIN/SUPER_ADMIN bypass all permission checks via the hasPermission() short-circuit.
   */
  requiredPermission?: string;
  /**
   * Roles explicitly blocked from accessing this route, regardless of
   * authentication status. Used to enforce RBAC at the route level.
   * ADMIN/SUPER_ADMIN are never blocked from admin routes.
   */
  blockedRoles?: string[];
  /**
   * Roles explicitly allowed to access this route. If specified and the user's
   * role is not in this list (using strict string equality), access is denied.
   * This takes precedence over blockedRoles for role checking.
   *
   * NOTE: 'admin' and 'super_admin' are strictly separate roles:
   *   - 'admin' = System Administrator (operational admin with full access)
   *   - 'super_admin' = Owner/Proprietor (billing and executive access)
   *   - 'owner' = Same as super_admin (alias for backwards compatibility)
   */
  allowedRoles?: string[];
}

const ProtectedRoute = ({
  children,
  requiredPermission,
  blockedRoles = [],
  allowedRoles,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user) {
    // Strict role check using exact string equality
    const userRole = user.role;
    
    // If allowedRoles is specified, enforce strict role matching
    if (allowedRoles && allowedRoles.length > 0) {
      // Use strict equality check - 'admin' and 'super_admin' are DIFFERENT roles
      const isAllowed = allowedRoles.includes(userRole);
      if (!isAllowed) {
        // Redirect to dashboard instead of showing 403
        return <Navigate to="/dashboard" replace />;
      }
    }

    // Route-level role denylist: redirect blocked roles back to dashboard.
    // Only check blockedRoles if allowedRoles wasn't specified (for backwards compatibility)
    if (!allowedRoles && blockedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If a specific permission is required, check it
  if (requiredPermission) {
    const allowed = hasPermission(requiredPermission);
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
