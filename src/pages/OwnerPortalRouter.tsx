import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OwnersDashboardHome from './OwnersDashboardHome';
import OwnersDashboard from './ownersDashboard';
import LANServerConfig from './LANServerConfig';
import PaymentManagement from './PaymentManagement';
import Settings from './Settings';

export default function OwnerPortalRouter() {
  const [currentHash, setCurrentHash] = useState(() => {
    const hash = window.location.hash.replace('#/', '').trim();
    return hash || 'owner';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').trim();
      setCurrentHash(hash || 'owner');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (currentHash) {
    case 'tenants':
    case 'campuses':
      return <OwnersDashboard />;
    case 'lan':
    case 'lan-config':
      return <LANServerConfig />;
    case 'payments':
    case 'payment-management':
      return <PaymentManagement />;
    case 'settings':
      return <Settings />;
    case 'owner':
    case 'dashboard':
    default:
      return <OwnersDashboardHome />;
  }
}
