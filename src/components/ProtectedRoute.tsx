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
   * Admins (owner, super_admin) bypass all permission checks.
   */
  requiredPermission?: string;
  /**
   * Roles explicitly blocked from accessing this route, regardless of
   * authentication status. Used to enforce RBAC at the route level.
   */
  blockedRoles?: string[];
  /**
   * Roles explicitly allowed to access this route. When provided, any
   * user whose role is NOT in this list is redirected to /dashboard.
   * Comparison is case-insensitive. Takes precedence over `blockedRoles`
   * so route-level allowlists can be set explicitly.
   */
  allowedRoles?: string[];
}

const ProtectedRoute = ({
  children,
  requiredPermission,
  blockedRoles = [],
  allowedRoles = [],
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

  // Route-level role allowlist: if configured, only listed roles
  // (case-insensitive) may access the route. Everything else is
  // redirected to the dashboard.
  if (allowedRoles.length > 0 && user) {
    const userRole = (user.role || '').toUpperCase();
    const allowList = allowedRoles.map(r => r.toUpperCase());
    if (!allowList.includes(userRole)) {
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
