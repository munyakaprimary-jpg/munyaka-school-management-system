import React, { useState } from 'react';
import AdminPortal from './pages/admin/AdminPortal';
import OwnersPortal from './pages/owner/OwnersPortal';

export default function App() {
  const [role, setRole] = useState<'ADMIN' | 'OWNER' | null>(() => {
    return (localStorage.getItem('munyaka_portal_role') as 'ADMIN' | 'OWNER') || null;
  });

  const handleSelectRole = (selectedRole: 'ADMIN' | 'OWNER') => {
    localStorage.setItem('munyaka_portal_role', selectedRole);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('munyaka_portal_role');
    setRole(null);
  };

  if (role === 'ADMIN') return <AdminPortal onLogout={handleLogout} />;
  if (role === 'OWNER') return <OwnersPortal onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="h-14 w-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 font-bold text-xl shadow-lg">
          🏫
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-white">Munyaka Portal Gateway</h1>
        <p className="text-slate-400 text-sm mb-8">Select your independent operational workspace</p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelectRole('ADMIN')}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 text-sm group"
          >
            <span>Enter School Admin Portal</span>
            <span className="text-xs bg-indigo-700/60 px-2 py-0.5 rounded-md font-mono text-indigo-200">Operational</span>
          </button>
          
          <button
            onClick={() => handleSelectRole('OWNER')}
            className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 text-sm group"
          >
            <span>Enter Executive Owner Portal</span>
            <span className="text-xs bg-emerald-700/60 px-2 py-0.5 rounded-md font-mono text-emerald-200">Governance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
