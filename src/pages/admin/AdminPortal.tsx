import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import StudentsPage from '@/pages/StudentsPage';
import AttendancePage from '@/pages/AttendancePage';
import FeesPage from '@/pages/FeesPage';
import LanConfigPage from '@/pages/LanConfigPage';
import SettingsPage from '@/pages/SettingsPage';
import CentralDataPage from '@/pages/CentralDataPage';
import PromotePage from '@/pages/PromotePage';
import AdminHarmonizationHub from '@/components/admin/AdminHarmonizationHub';
import StaffRegistryPage from '@/pages/StaffRegistryPage';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminPortal() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/lan-config" element={<LanConfigPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/central-data" element={<CentralDataPage />} />
          <Route path="/promote" element={<PromotePage />} />
          <Route path="/harmonization" element={<AdminHarmonizationHub />} />
          <Route path="/staff-registry" element={<StaffRegistryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
