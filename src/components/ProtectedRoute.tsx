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
   * ADMIN (and the legacy super_admin alias) bypass all permission checks
   * via the hasPermission() short-circuit. OWNER has no operational access
   * and is blocked by the blockedRoles list on operational routes.
   */
  requiredPermission?: string;
  /**
   * Roles explicitly blocked from accessing this route, regardless of
   * authentication status. Used to enforce RBAC at the route level.
   * ADMIN is never listed here — it has unrestricted access.
   */
  blockedRoles?: string[];
  /**
   * If provided, ONLY the listed roles may access this route. This is
   * evaluated BEFORE blockedRoles and applies even to admin role — it
   * is the most restrictive gate. Use it to lock a route to one role
   * family, e.g. allowedRoles={['admin', 'super_admin']} to keep the
   * owner out of an operational-only page.
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

  // Route-level allowlist: redirect disallowed roles back to dashboard.
  // Strict: even admin must be in the list if the list is provided.
  if (user && allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = (user.role || '').toLowerCase();
    const allowedLower = allowedRoles.map(r => r.toLowerCase());
    if (!allowedLower.includes(userRoleLower)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Route-level role denylist: redirect blocked roles back to dashboard.
  if (user && blockedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
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
