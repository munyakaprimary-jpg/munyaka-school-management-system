import React from 'react';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import StaffRegistry from '@/components/StaffRegistry';
import AttendanceMonitor from '@/pages/AttendanceMonitor';
import Fees from '@/pages/Fees';
import Students from '@/pages/Students';

export function AdminPortal() {
  return (
    <div className="space-y-6">
      <AdminDashboard />
    </div>
  );
}
