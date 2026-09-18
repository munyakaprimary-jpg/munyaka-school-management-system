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

  // Synchronous localStorage fallback check during render.
  // This prevents a redirect loop when AuthContext state hasn't
  // updated yet but a valid session exists in localStorage.
  let hasLocalSession = false;
  try {
    const saved = localStorage.getItem('munyaka_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role) {
        hasLocalSession = true;
      }
    }
  } catch {
    hasLocalSession = false;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // Allow access if AuthContext says authenticated OR a valid session
  // exists in localStorage (covers the case where setUser was called
  // directly outside the standard login flow).
  const authenticated = isAuthenticated || hasLocalSession;

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Route-level role denylist with support staff normalization: redirect blocked roles back to dashboard.
  if (user) {
    const rawRole = String(user.role || '').trim().toUpperCase();
    const normalizedUserRole = rawRole.includes('TEACHER') && !rawRole.includes('NON') ? 'teacher' :
                               rawRole.includes('ADMIN') ? 'admin' :
                               rawRole.includes('OWNER') || rawRole.includes('SUPER') ? 'owner' :
                               rawRole.includes('STUDENT') ? 'student' :
                               rawRole.includes('PARENT') ? 'parent' :
                               rawRole.includes('ACCOUNTANT') ? 'accountant' :
                               rawRole.includes('DRIVER') ? 'driver' :
                               rawRole.includes('SUPPORT') || rawRole.includes('NON_TEACHING') || rawRole.includes('NON-TEACHING') ? 'support_staff' : 'staff';

    const isBlocked = blockedRoles.some(r => {
      const target = r.toLowerCase();
      return target === normalizedUserRole || target === rawRole.toLowerCase();
    });
    if (isBlocked) {
      console.warn('[ProtectedRoute] Role Restriction: User role is blocked:', { userRole: rawRole, blockedRoles });
      return <Navigate to="/dashboard" replace />;
    }

    // Role allowlist: if specified, only these roles may access (allowing support staff & normalization).
    if (allowedRoles && allowedRoles.length > 0) {
      const isAllowed = allowedRoles.some(r => {
        const target = r.toLowerCase();
        return target === normalizedUserRole || target === rawRole.toLowerCase() ||
               (target === 'staff' && ['support_staff', 'accountant', 'driver', 'staff'].includes(normalizedUserRole));
      });
      if (!isAllowed && normalizedUserRole !== 'admin' && normalizedUserRole !== 'owner') {
        console.warn('[ProtectedRoute] Role Restriction: User role not allowed for route:', { userRole: rawRole, allowedRoles });
        return <Navigate to="/dashboard" replace />;
      }
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
