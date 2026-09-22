import React, { useState } from 'react';
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import { useAuth } from "@/context/AuthContext";
import { resolveRole, roleHas } from "@/rbac/permissionMatrix";
import { isTeacherRole } from "@/utils/roleHelper";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const userRole = user?.role || '';
  const roleLower = String(userRole).toLowerCase().trim();
  const resolvedR = resolveRole(userRole);

  const isTeacher = isTeacherRole(userRole, user?.staffCategory, user?.specialties) ||
    resolvedR === 'teacher' || resolvedR === 'class_teacher' || resolvedR === 'subject_teacher' ||
    resolvedR === 'senior_teacher' || roleLower.includes('teacher') || roleLower.includes('educator');

  const isAdminOrOwner = roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'owner' || resolvedR === 'admin';

  if (isTeacher && !isAdminOrOwner) {
    return <TeacherDashboard />;
  }

  if (roleLower === 'owner') {
    return <OwnerDashboard />;
  }

  return <AdminDashboard />;
};

export default Dashboard;
