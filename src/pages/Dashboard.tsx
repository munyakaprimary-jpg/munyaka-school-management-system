import React, { useState } from 'react';
import OwnersPortal from "@/components/OwnersPortal";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import ICTDashboard from "@/pages/ICTDashboard";
import LibrarianPortalView from "@/pages/LibrarianPortalView";
import Library from "@/pages/Library";
import { useAuth } from "@/context/AuthContext";
import { resolveRole, roleHas } from "@/rbac/permissionMatrix";
import { isTeacherRole } from "@/utils/roleHelper";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const userRole = user?.role || '';
  const roleLower = String(userRole).toLowerCase().trim();
  const resolvedR = resolveRole(userRole);

  const isLibrarian = roleLower.includes('librarian') || roleLower.includes('library') || resolvedR === 'librarian' || resolvedR === 'library_teacher';
  if (isLibrarian && !roleLower.includes('admin')) {
    return <LibrarianPortalView />;
  }

  const isIctTechnician = roleLower === 'ict_technician' || roleLower === 'ict_teacher' || roleLower.includes('ict') || resolvedR === 'ict_technician' || resolvedR === 'ict_teacher';
  if (isIctTechnician && !roleLower.includes('admin')) {
    return <ICTDashboard />;
  }

  const isTeacher = isTeacherRole(userRole, (user as any)?.staffCategory, (user as any)?.specialties) ||
    resolvedR === 'teacher' || resolvedR === 'class_teacher' || resolvedR === 'subject_teacher' ||
    resolvedR === 'senior_teacher' || roleLower.includes('teacher') || roleLower.includes('educator');

  const isAdminOrOwner = roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'owner' || resolvedR === 'admin';

  if (isTeacher && !isAdminOrOwner) {
    return <TeacherDashboard />;
  }

  // 1. Separate Owner's Portal view: activeTab === 'owner' || activeTab === 'owner-portal' or role === 'owner' / 'super_admin'
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hashString = typeof window !== 'undefined' ? window.location.hash : '';
  const isOwnerMode = searchParams.get('tab') === 'owner' || searchParams.get('tab') === 'owner-portal' || hashString.includes('owner') || roleLower === 'owner' || roleLower === 'super_admin';

  return isOwnerMode ? (
    <OwnersPortal />
  ) : (
    /* Standard School Admin Dashboard */
    <AdminDashboard />
  );
};

export default Dashboard;
