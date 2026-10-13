import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminControlCenter from './AdminControlCenter';
import AdminProfile from './AdminProfile';
import MobileSettings from './MobileSettings';
import LANServerConfig from './LANServerConfig';
import TeacherLanConfig from './TeacherLanConfig';
import AdminHarmonizationHub from '@/components/admin/AdminHarmonizationHub';
import Settings from './Settings';

export default function AdminPortalRouter() {
  const [currentHash, setCurrentHash] = useState(() => {
    const hash = window.location.hash.replace('#/', '').trim();
    return hash || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').trim();
      setCurrentHash(hash || 'dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (currentHash) {
    case 'admin-control-center':
      return <AdminControlCenter />;
    case 'admin-profile':
      return <AdminProfile />;
    case 'mobile-settings':
      return <MobileSettings />;
    case 'lan-config':
      return <LANServerConfig />;
    case 'teacher-lan-config':
      return <TeacherLanConfig />;
    case 'admin-harmonization':
      return <AdminHarmonizationHub />;
    case 'settings':
      return <Settings />;
    case 'dashboard':
    default:
      return <AdminDashboard />;
  }
}