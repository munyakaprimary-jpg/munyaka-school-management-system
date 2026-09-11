import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockedRoles?: string[];
}

const ProtectedRoute = ({
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check active session in localStorage as fallback or primary check
  let hasActiveSession = isAuthenticated;
  try {
    const rawSession =
      localStorage.getItem('munyaka_active_user') ||
      localStorage.getItem('munyaka_session') ||
      localStorage.getItem('munyaka_admin_session');
    if (rawSession) {
      hasActiveSession = true;
    }
  } catch {
    // ignore
  }

  if (!hasActiveSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
