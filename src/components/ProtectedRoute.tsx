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
   * ADMIN bypasses all permission checks via the hasPermission() short-circuit.
   * OWNER has no operational access
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
   * Whitelist of roles that are allowed to access this route.
   * If specified, ONLY these roles may access the route.
   * ADMIN bypasses this check.
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

  // Route-level role denylist: redirect blocked roles back to dashboard.
  if (user && blockedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role allowlist: if specified, only these roles may access.
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const normalizedUserRole = user.role.toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === normalizedUserRole);
    if (!isAllowed) {
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
