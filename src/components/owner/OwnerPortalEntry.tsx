import React from 'react';
import OwnersDashboard from '@/pages/ownersDashboard';
import OwnersDashboardHome from '@/pages/OwnersDashboardHome';
import { Routes, Route, Navigate } from 'react-router-dom';

export function OwnerPortalEntry() {
  return (
    <Routes>
      <Route path="/" element={<OwnersDashboard />} />
      <Route path="/home" element={<OwnersDashboardHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default OwnerPortalEntry;
