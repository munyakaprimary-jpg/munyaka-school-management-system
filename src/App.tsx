import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AdminPortal from './pages/admin/AdminPortal';
import OwnersDashboard from './pages/ownersDashboard';

export function App() {
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

  if (role === 'ADMIN') {
    return (
      <BrowserRouter>
        <div className="relative min-h-screen">
          <div className="absolute top-3 right-3 z-50">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Exit Admin Portal
            </button>
          </div>
          <AdminPortal />
        </div>
      </BrowserRouter>
    );
  }

  if (role === 'OWNER') {
    return (
      <BrowserRouter>
        <div className="relative min-h-screen">
          <div className="absolute top-3 right-3 z-50">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Exit Owner Portal
            </button>
          </div>
          <OwnersDashboard />
        </div>
      </BrowserRouter>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-600/30 mb-4">
        MP
      </div>
      <h1 className="text-3xl font-bold mb-2">Munyaka Portal Gateway</h1>
      <p className="text-slate-400 mb-8 text-center max-w-md">Select your portal workspace below to access the operational school admin dashboard or executive owner governance hub.</p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => handleSelectRole('ADMIN')}
          className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold shadow-lg text-base transition-all cursor-pointer text-center"
        >
          Enter School Admin Portal
        </button>
        <button
          onClick={() => handleSelectRole('OWNER')}
          className="flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold shadow-lg text-base transition-all cursor-pointer text-center"
        >
          Enter Executive Owner Portal
        </button>
      </div>
    </div>
  );
}

export default App;
