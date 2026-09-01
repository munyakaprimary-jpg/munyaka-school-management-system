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
   * Admins (owner, super_admin) bypass all permission checks.
   */
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific permission is required, check it
  if (requiredPermission) {
    const allowed = hasPermission(requiredPermission);
    if (!allowed) {
      // Send the user back to the dashboard so they don't see a
      // confusing "404" — they simply lack the access grant.
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
