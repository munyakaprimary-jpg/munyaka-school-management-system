import React, { useState } from 'react';
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import LibraryDashboard from "@/components/dashboards/LibraryDashboard";
import ICTLabManagement from "@/pages/ICTLabManagement";
import ICTPortalDashboard from "@/pages/ICTPortalDashboard";
import LibrarianPortalView from "@/pages/LibrarianPortalView";
import { useAuth } from "@/context/AuthContext";
import { resolveRole, roleHas } from "@/rbac/permissionMatrix";
import { isTeacherRole } from "@/utils/roleHelper";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
    } catch {
      return {};
    }
  })();

  const userRole = storedUser.rbacRole || storedUser.role || user?.role || '';
  const roleLower = String(userRole).toLowerCase().trim();
  const normalizedRole = roleLower.toUpperCase().replace(/\s+/g, '_');
  const userName = String(storedUser.name || storedUser.fullName || user?.name || '').toUpperCase();
  const resolvedR = resolveRole(userRole);

  const isLibraryTeacher =
    normalizedRole === 'LIBRARY_TEACHER' ||
    roleLower === 'library_teacher' ||
    roleLower.includes('librarian') ||
    roleLower.includes('library') ||
    resolvedR === 'librarian' ||
    resolvedR === 'library_teacher' ||
    userName.includes('JANET KUNGU') ||
    userName.includes('JANET GATHONI');

  if (isLibraryTeacher && !['HOI', 'DHOI', 'ADMIN', 'OWNER'].includes(normalizedRole) && !roleLower.includes('admin') && !userName.includes('ADMIN')) {
    return <LibraryDashboard />;
  }

  const isIctTechnician = roleLower === 'ict_technician' || roleLower === 'ict_teacher' || roleLower.includes('ict') || resolvedR === 'ict_technician' || resolvedR === 'ict_teacher';
  if (isIctTechnician && !roleLower.includes('admin')) {
    return <ICTPortalDashboard />;
  }

  const isTeacher = isTeacherRole(userRole, (user as any)?.staffCategory, (user as any)?.specialties) ||
    resolvedR === 'teacher' || resolvedR === 'class_teacher' || resolvedR === 'subject_teacher' ||
    resolvedR === 'senior_teacher' || roleLower.includes('teacher') || roleLower.includes('educator') ||
    roleLower === 'staff' || roleLower === 'staff_member' || userName.includes('ALICE MUKITE');

  const isAdminOrOwner = ['HOI', 'DHOI', 'ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(normalizedRole) || roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'owner' || resolvedR === 'admin';

  if (isTeacher && !isAdminOrOwner) {
    return <TeacherDashboard />;
  }

  if (roleLower === 'owner') {
    return <OwnerDashboard />;
  }

  if (['HOI', 'DHOI', 'ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(normalizedRole) || roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'owner') {
    return <AdminDashboard />;
  }

  return <AdminDashboard />;
};

export default Dashboard;
