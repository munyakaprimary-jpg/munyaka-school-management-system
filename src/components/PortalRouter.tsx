import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';

export default function PortalRouter({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const rawRole = (user?.role || '').toLowerCase().trim();

  // Explicit check for owner vs admin/school staff roles
  const isOwner = rawRole === 'owner' || rawRole === 'super_admin' || rawRole === 'super';

  if (isOwner) {
    // School Owner Portal Layout (Executive governance, tenants, LAN, payments, settings)
    return <Layout>{children}</Layout>;
  }

  // School Administrator & Staff Operations Portal Layout (Full admin sidebar, students, staff, grades, attendance, etc.)
  return <AdminLayout>{children}</AdminLayout>;
}
