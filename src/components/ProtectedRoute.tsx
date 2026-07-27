"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated users thrown back to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based Guard Check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Intercept unauthorized routes and redirect to respective dashboard
    let redirectPath = '/dashboard/staff';
    if (user.role === 'admin') {
      redirectPath = '/admin/staff-and-roles';
    } else if (user.role === 'teacher') {
      redirectPath = '/dashboard/teacher';
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};