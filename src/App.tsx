import React, { useState } from 'react';
import AdminPortal from './pages/admin/AdminPortal';
import OwnersPortalDashboard from './pages/owner/OwnersPortalDashboard';

export default function App() {
  const [role, setRole] = useState<'ADMIN' | 'OWNER' | null>(() => {
    return (localStorage.getItem('munyaka_portal_role') as 'ADMIN' | 'OWNER') || null;
  });

  if (role === 'ADMIN') {
    return <AdminPortal onLogout={() => { localStorage.removeItem('munyaka_portal_role'); setRole(null); }} />;
  }

  if (role === 'OWNER') {
    return <OwnersPortalDashboard onLogout={() => { localStorage.removeItem('munyaka_portal_role'); setRole(null); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">Munyaka Portal Gateway</h1>
      <p className="text-slate-400 mb-8">Select your portal workspace below</p>
      <div className="flex gap-4">
        <button
          onClick={() => { localStorage.setItem('munyaka_portal_role', 'ADMIN'); setRole('ADMIN'); }}
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg text-lg cursor-pointer"
        >
          Enter School Admin Portal
        </button>
        <button
          onClick={() => { localStorage.setItem('munyaka_portal_role', 'OWNER'); setRole('OWNER'); }}
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg text-lg cursor-pointer"
        >
          Enter Executive Owner Portal
        </button>
      </div>
    </div>
  );
}
