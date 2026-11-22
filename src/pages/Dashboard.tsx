import React from 'react';
import { Navigate } from 'react-router-dom';
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import LibraryDashboard from "@/components/dashboards/LibraryDashboard";
import ICTPortalDashboard from "@/pages/ICTPortalDashboard";
import { useAuth } from "@/context/AuthContext";
import {
  normalizeStaffRole,
  isAdminRole,
  isClassTeacherRole,
  isSubjectTeacherRole,
  isIctTeacherRole,
  isLibrarianRole,
  isBursarRole,
} from "@/utils/roleNormalizer";
import { isStudentRole } from "@/utils/roleGuard";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
    } catch {
      return {};
    }
  })();

  // Normalize role from all possible sources using unified role normalizer
  // Checks assignedRole, role, category, and rawPayload fields
  const normalizedRole = normalizeStaffRole(
    storedUser.rbacRole || storedUser.role || user?.role || '',
    (user as any)?.staffCategory,
    (user as any)?.assignedRole,
    (user as any)?.rawPayload
  );

  const userName = String(storedUser.name || storedUser.fullName || user?.name || '').toUpperCase();

  // ── Strict RBAC: STUDENT / learner users must never render a staff dashboard ──
  // Defense in depth: ProtectedRoute already blocks students from /dashboard,
  // but if a student session ever reaches here, send them to their assessment view.
  if (isStudentRole(user) || isStudentRole(storedUser) || normalizedRole === 'student' || normalizedRole.includes('student') || normalizedRole.includes('learner')) {
    return <Navigate to="/student-dashboard" replace />;
  }

  // Admin/owner roles get Admin Dashboard
  if (isAdminRole(normalizedRole) || normalizedRole === 'admin' || normalizedRole === 'owner') {
    // Check if user is actually a class teacher or teacher despite having admin flag or general role
    const isTeacherCategory =
      String(storedUser.category || '').toLowerCase().includes('teacher') ||
      String(storedUser.designation || '').toLowerCase().includes('teacher') ||
      String(storedUser.role || '').toLowerCase().includes('teacher') ||
      userName.includes('BRIAN KIPTOO');

    if (!isTeacherCategory && userName !== 'BRIAN KIPTOO') {
      return <AdminDashboard />;
    }
  }

  // Class Teacher or Teacher gets Teacher Dashboard
  if (isClassTeacherRole(normalizedRole) || isSubjectTeacherRole(normalizedRole) || normalizedRole === 'teacher' || normalizedRole === 'educator' || normalizedRole.includes('teacher') || userName.includes('BRIAN KIPTOO')) {
    return <TeacherDashboard />;
  }

  // ICT Teacher gets ICT Portal Dashboard
  if (isIctTeacherRole(normalizedRole)) {
    return <ICTPortalDashboard />;
  }

  // Library Teacher gets Library Dashboard
  if (isLibrarianRole(normalizedRole)) {
    return <LibraryDashboard />;
  }

  // Bursar gets Admin Dashboard (or could have their own dashboard)
  if (isBursarRole(normalizedRole)) {
    return <AdminDashboard />;
  }

  // For any non-admin role (teacher, staff, subject_teacher, etc.), always render TeacherDashboard
  return <TeacherDashboard />;
};

export default Dashboard;
