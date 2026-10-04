import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockedRoles?: string[];
  // Optional: restrict by assigned class/stream for teacher routes
  assignedClass?: string;
  assignedStream?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  blockedRoles,
  assignedClass,
  assignedStream,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const rawRole = (user.role || '').toLowerCase().trim();

  // Map roles for robust checking
  const isOwnerOrSuper = rawRole === 'owner' || rawRole === 'super_admin' || rawRole === 'super';
  const isAdmin = rawRole === 'admin' || rawRole === 'administrator';
  const isTeacher = rawRole === 'teacher' ||
                    rawRole === 'head_teacher' ||
                    rawRole === 'subject_teacher' ||
                    rawRole === 'class_teacher' ||
                    rawRole === 'teacher_grade_1' ||
                    rawRole === 'teacher_grade_2' ||
                    rawRole === 'teacher_grade_3' ||
                    rawRole === 'teacher_grade_4' ||
                    rawRole === 'teacher_grade_5' ||
                    rawRole === 'teacher_grade_6' ||
                    rawRole === 'teacher_grade_7' ||
                    rawRole === 'teacher_grade_8';
  const isNonTeaching = rawRole === 'librarian' || rawRole === 'ict_technician' || rawRole === 'bursar' || rawRole === 'support_staff' || rawRole === 'store_keeper' || rawRole === 'accountant';

  // CRITICAL SECURITY FIX: Non-teaching staff (like Librarian, ICT Technician) MUST NEVER access Owner Dashboard or Console
  const isOwnerRoute = location.pathname.startsWith('/owner') ||
                       location.pathname.startsWith('/dev/') ||
                       location.pathname === '/tenant-management' ||
                       location.pathname === '/payment-management';

  if (isOwnerRoute && !isOwnerOrSuper && !isAdmin) {
    console.warn('[ProtectedRoute] Security Violation: Non-owner/non-admin staff tried to access Owner/Admin console:', { userRole: rawRole, path: location.pathname });
    return <Navigate to="/dashboard" replace />;
  }

  // ============================================================
  // TEACHER STREAM/CLASS GUARD: Restrict teachers to their assigned class/stream
  // ============================================================
  const userAssignedClass = user.assignedClass || user.grade || '';
  const userAssignedStream = user.assignedStream || user.stream || '';

  // Normalize for comparison
  const normalizedUserClass = String(userAssignedClass).trim().toUpperCase();
  const normalizedUserStream = String(userAssignedStream).trim().toUpperCase();
  const normalizedAssignedClass = String(assignedClass || '').trim().toUpperCase();
  const normalizedAssignedStream = String(assignedStream || '').trim().toUpperCase();

  // If user is a teacher and route has class/stream restrictions, enforce them
  const isTeacherWithRestrictions = isTeacher && (normalizedAssignedClass !== '' || normalizedAssignedStream !== '');

  // Check if the current route is a teacher-restricted route that requires class/stream matching
  const teacherRestrictedRoutes = [
    '/attendance',
    '/assessments',
    '/grades',
    '/staff/attendance',
    '/staff/check-in',
    '/staff-checkin',
    '/staff/attendance-monitor',
    '/reports',
    '/fees',
    '/profile',
  ];

  const isTeacherRestrictedRoute = teacherRestrictedRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // If teacher is restricted to a specific class/stream and trying to access a restricted route without matching
  if (isTeacherWithRestrictions && isTeacherRestrictedRoute) {
    // Get class/stream from route query params or state
    const routeClass = normalizedAssignedClass || normalizedUserClass;
    const routeStream = normalizedAssignedStream || normalizedUserStream;

    // If route has explicit class/stream props and user doesn't match, block access
    if ((routeClass !== '' && normalizedUserClass !== routeClass.toUpperCase()) ||
        (routeStream !== '' && normalizedUserStream !== routeStream.toUpperCase())) {
      console.warn('[ProtectedRoute] Teacher Stream/Class Guard: User attempted access to route outside assigned class/stream:', {
        userRole: rawRole,
        userClass: normalizedUserClass,
        userStream: normalizedUserStream,
        requiredClass: routeClass,
        requiredStream: routeStream,
        path: location.pathname
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check explicit blockedRoles
  if (blockedRoles && blockedRoles.length > 0) {
    const isBlocked = blockedRoles.some(r => {
      const br = r.toLowerCase().trim();
      if (br === rawRole) return true;
      if (br === 'owner' && isOwnerOrSuper) return true;
      if (br === 'admin' && isAdmin) return true;
      if (br === 'teacher' && isTeacher) return true;
      return false;
    });

    if (isBlocked) {
      console.warn('[ProtectedRoute] Role Restriction: User role is blocked:', { userRole: rawRole, blockedRoles });
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check explicit allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(r => {
      const ar = r.toLowerCase().trim();
      if (ar === rawRole) return true;
      if (ar === 'owner' && isOwnerOrSuper) return true;
      if (ar === 'admin' && (isAdmin || isOwnerOrSuper)) return true;
      if (ar === 'teacher' && (isTeacher || isAdmin || isOwnerOrSuper)) return true;
      return false;
    });

    if (!isAllowed) {
      console.warn('[ProtectedRoute] Role Restriction: User role not allowed for route:', { userRole: rawRole, allowedRoles });
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
