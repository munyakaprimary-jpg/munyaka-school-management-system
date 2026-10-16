import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roleHasModulePermission } from "@/rbac/permissionMatrixHelper";
import { getRoleLandingPage } from "@/rbac/landingPageMapping";
import { showWarning } from "@/utils/toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockedRoles?: string[];
  moduleKey?: string; // Optional RBAC module key check
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  blockedRoles,
  moduleKey,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const rawRole = (user.role || '').toLowerCase().trim();
  const upperRole = rawRole.toUpperCase();

  const isOwnerOrSuper = upperRole === 'OWNER' || upperRole === 'SUPER_ADMIN' || upperRole === 'SUPER';
  const isAdmin = upperRole === 'ADMIN' || upperRole === 'HOI' || upperRole === 'DHOI' || upperRole === 'ADMINISTRATOR';

  // Determine corresponding module key from pathname if not explicitly provided
  let targetModuleKey = moduleKey;
  if (!targetModuleKey) {
    const path = location.pathname;
    if (path.startsWith('/settings')) targetModuleKey = 'settings';
    else if (path.startsWith('/fees')) targetModuleKey = 'fees';
    else if (path.startsWith('/assessments') || path.startsWith('/learning-areas') || path.startsWith('/exam-types')) targetModuleKey = 'assessments';
    else if (path.startsWith('/students')) targetModuleKey = 'students';
    else if (path.startsWith('/inventory') || path.startsWith('/ict-lab')) targetModuleKey = 'inventory';
    else if (path.startsWith('/library')) targetModuleKey = 'library';
    else if (path.startsWith('/attendance')) targetModuleKey = 'attendance';
    else if (path.startsWith('/timetable') || path.startsWith('/grades')) targetModuleKey = 'timetable';
    else if (path.startsWith('/reports') || path.startsWith('/analysis')) targetModuleKey = 'reports';
    else if (path.startsWith('/staff-registry') || path.startsWith('/staff')) targetModuleKey = 'staff';
    else if (path.startsWith('/server') || path.startsWith('/system-management') || path.startsWith('/admin/harmonization')) targetModuleKey = 'server';
  }

  // Check RBAC permission matrix for the module
  const hasRbacPermission = isOwnerOrSuper || isAdmin || !targetModuleKey || roleHasModulePermission(user.role, targetModuleKey);

  if (!hasRbacPermission) {
    const landingPage = getRoleLandingPage(user.role);
    console.warn('[ProtectedRoute] RBAC Policy Restriction: User attempted access to unauthorized module:', {
      role: user.role,
      path: location.pathname,
      moduleKey: targetModuleKey,
      redirectingTo: landingPage
    });
    showWarning("Access restricted by institutional RBAC policy.");
    return <Navigate to={landingPage} replace />;
  }

  // Check explicit blockedRoles
  if (blockedRoles && blockedRoles.length > 0) {
    const isBlocked = blockedRoles.some(r => {
      const br = r.toLowerCase().trim();
      if (br === rawRole) return true;
      if (br === 'owner' && isOwnerOrSuper) return true;
      if (br === 'admin' && isAdmin) return true;
      return false;
    });

    if (isBlocked) {
      const landingPage = getRoleLandingPage(user.role);
      showWarning("Access restricted by institutional RBAC policy.");
      return <Navigate to={landingPage} replace />;
    }
  }

  // Check explicit allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(r => {
      const ar = r.toLowerCase().trim();
      if (ar === rawRole) return true;
      if (ar === 'owner' && isOwnerOrSuper) return true;
      if (ar === 'admin' && (isAdmin || isOwnerOrSuper)) return true;
      if (ar === 'teacher' && (rawRole.includes('teacher') || isAdmin || isOwnerOrSuper)) return true;
      return false;
    });

    if (!isAllowed) {
      const landingPage = getRoleLandingPage(user.role);
      showWarning("Access restricted by institutional RBAC policy.");
      return <Navigate to={landingPage} replace />;
    }
  }

  return <>{children}</>;
};

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
