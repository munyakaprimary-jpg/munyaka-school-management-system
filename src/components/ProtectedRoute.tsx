import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roleHasModulePermission } from "@/rbac/permissionMatrixHelper";
import { getRoleLandingPage } from "@/rbac/landingPageMapping";
import { showWarning } from "@/utils/toast";
import { isStudentRole, STUDENT_ALLOWED_PATHS } from "@/utils/roleGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockedRoles?: string[];
  moduleKey?: string; // Optional RBAC module key check
}

/**
 * Full-screen unauthorized screen shown when a STUDENT (or other
 * non-staff) user attempts to open a Teacher Portal route.
 * Signs the user out and returns them to the login screen.
 */
const UnauthorizedAccess: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Sign the student out cleanly so they never land back in a portal session.
    logout();
    navigate("/login", { replace: true, state: { blocked: "student" } });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3 max-w-md mx-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-600">
          Student accounts are not permitted to access the Teacher Portal. You have been signed out and returned to the login screen.
        </p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="mt-2 px-6 py-2 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({
  children,
  allowedRoles,
  blockedRoles,
  moduleKey,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth() as any;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const isAuth = isAuthenticated || localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuth || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Jamlyan Analytics strict routing check ──
  const isJamlyanAnalyticsUser = rawRole === 'jamlyan_analytics' || rawRole === 'jamlyan' || rawRole === 'analytics';
  if (isJamlyanAnalyticsUser && location.pathname !== '/jamlyan-analytics') {
    return <Navigate to="/jamlyan-analytics" replace />;
  }

  // ── Strict RBAC: STUDENT / non-staff users are blocked from Teacher Portal routes ──
  const isStudentUser = isStudentRole(user);

  // Student-safe routes: learners may take assessments / view set exams.
  const isStudentSafePath = STUDENT_ALLOWED_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  if (isStudentUser && !isStudentSafePath) {
    return <UnauthorizedAccess />;
  }

  const rawRole = String(user.role || '').toLowerCase().trim();
  const upperRole = rawRole.toUpperCase();

  // Strict check: subject teachers, class teachers, and teachers must never be treated as admin
  const isTeacherRole = rawRole.includes('teacher') || rawRole === 'staff' || rawRole === 'subject_teacher' || rawRole === 'class_teacher' || rawRole === 'senior_teacher';
  const isOwnerOrSuper = !isTeacherRole && (upperRole === 'OWNER' || upperRole === 'SUPER_ADMIN' || upperRole === 'SUPER' || upperRole === 'SUPERADMIN' || upperRole === 'SCHOOL_ADMIN');
  const isAdmin = !isTeacherRole && (upperRole === 'ADMIN' || upperRole === 'HOI' || upperRole === 'DHOI' || upperRole === 'ADMINISTRATOR' || upperRole === 'SCHOOL_ADMIN' || upperRole === 'OWNER' || upperRole === 'SUPER_ADMIN');

  // Determine corresponding module key from pathname if not explicitly provided
  let targetModuleKey = moduleKey;
  if (!targetModuleKey) {
    const path = location.pathname;
    if (path === '/staff/check-in' || path === '/staff-checkin') targetModuleKey = 'daily_checkin';
    else if (path.startsWith('/settings')) targetModuleKey = 'settings';
    else if (path.startsWith('/fees')) targetModuleKey = 'fees';
    else if (path.startsWith('/assessments') || path.startsWith('/learning-areas') || path.startsWith('/exam-types')) targetModuleKey = 'assessments';
    else if (path.startsWith('/students')) targetModuleKey = 'students';
    else if (path.startsWith('/inventory') || path.startsWith('/ict-lab') || path.startsWith('/digital-skills') || path.startsWith('/practical-competencies')) targetModuleKey = 'inventory';
    else if (path.startsWith('/library')) targetModuleKey = 'library';
    else if (path.startsWith('/attendance')) targetModuleKey = 'attendance';
    else if (path.startsWith('/timetable') || path.startsWith('/grades')) targetModuleKey = 'timetable';
    else if (path.startsWith('/reports') || path.startsWith('/analysis')) targetModuleKey = 'reports';
    else if (path.startsWith('/staff-registry') || path.startsWith('/staff')) targetModuleKey = 'staff';
    else if (path.startsWith('/server') || path.startsWith('/system-management') || path.startsWith('/admin/harmonization')) targetModuleKey = 'server';
  }

  // Check RBAC permission matrix for the module (Daily Check-In & check-in paths are permitted for staff only)
  const isCheckInPath = location.pathname === '/staff/check-in' || location.pathname === '/staff-checkin';
  // Students are only permitted through on student-safe paths (assessments / set exams).
  const hasRbacPermission = isJamlyanAnalyticsUser
    ? location.pathname === '/jamlyan-analytics'
    : isStudentUser && isStudentSafePath
    ? true
    : isOwnerOrSuper || isAdmin || !targetModuleKey || roleHasModulePermission(user.role, targetModuleKey) || targetModuleKey === 'daily_checkin';

  if (!hasRbacPermission) {
    const landingPage = getRoleLandingPage(user.role);
    console.warn('[ProtectedRoute] RBAC Policy Restriction: User attempted access to unauthorized module:', {
      role: user.role,
      path: location.pathname,
      moduleKey: targetModuleKey,
      redirectingTo: landingPage
    });
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
      return <Navigate to={landingPage} replace />;
    }
  }

  // Check explicit allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(r => {
      const ar = r.toLowerCase().trim();
      if (ar === rawRole) return true;
      if (isJamlyanAnalyticsUser && (ar === 'jamlyan_analytics' || ar === 'platform_owner' || ar === 'owner')) return true;
      if (ar === 'owner' && isOwnerOrSuper) return true;
      if (ar === 'admin' && (isAdmin || isOwnerOrSuper)) return true;
      if (ar === 'teacher' && (rawRole.includes('teacher') || isAdmin || isOwnerOrSuper)) return true;
      if (rawRole.includes('ict') && (ar.includes('ict') || ar.includes('teacher'))) return true;
      return false;
    });

    if (!isAllowed) {
      const landingPage = getRoleLandingPage(user.role);
      return <Navigate to={landingPage} replace />;
    }
  }

  return <>{children}</>;
};

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
