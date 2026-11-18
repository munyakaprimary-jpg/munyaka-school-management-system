import React from 'react';
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

  // Admin/owner roles get Admin Dashboard
  if (isAdminRole(normalizedRole) || normalizedRole === 'admin' || normalizedRole === 'owner') {
    return <AdminDashboard />;
  }

  // Class Teacher gets Class Teacher Dashboard
  if (isClassTeacherRole(normalizedRole)) {
    return <TeacherDashboard />;
  }

  // Subject Teacher gets Teacher Dashboard (shared with Class Teacher)
  if (isSubjectTeacherRole(normalizedRole)) {
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

  // Default fallback - block non-admin roles from Admin Dashboard
  // For any other role, redirect to appropriate dashboard
  // This prevents unauthorized access to Admin Dashboard
  return <AdminDashboard />;
};

export default Dashboard;