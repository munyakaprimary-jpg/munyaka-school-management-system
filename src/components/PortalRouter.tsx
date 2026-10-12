import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';

export default function PortalRouter({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const rawRole = (user?.role || '').toLowerCase().trim();

  // If user role is OWNER or SUPER_ADMIN, render with OwnersPortal Layout (Sidebar with tenants, lan, payments, settings, owner)
  const isOwner = rawRole === 'owner' || rawRole === 'super_admin' || rawRole === 'super';

  if (isOwner) {
    return <Layout>{children}</Layout>;
  }

  // Otherwise (ADMIN, HEAD_TEACHER, TEACHER, etc.), render with AdminLayout (School Operations sidebar)
  return <AdminLayout>{children}</AdminLayout>;
}
