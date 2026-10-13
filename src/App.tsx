import React, { useState } from 'react';

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

  if (role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <header className="p-4 bg-indigo-900 text-white flex justify-between items-center shadow">
          <h1 className="font-bold text-lg">School Admin Portal - Munyaka Primary</h1>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold text-white">
            Log Out
          </button>
        </header>
        <main className="p-6 max-w-7xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-slate-600">Operational management active.</p>
        </main>
      </div>
    );
  }

  if (role === 'OWNER') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <h1 className="font-bold text-lg text-emerald-400">Executive Owner Portal</h1>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold text-white">
            Log Out
          </button>
        </header>
        <main className="p-6 max-w-7xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-4">Governance Hub</h2>
          <p className="text-slate-400">Multi-tenant management active.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">Munyaka Portal Gateway</h1>
      <p className="text-slate-400 mb-8">Select your portal workspace below</p>
      <div className="flex gap-4">
        <button
          onClick={() => handleSelectRole('ADMIN')}
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg cursor-pointer"
        >
          Enter School Admin Portal
        </button>
        <button
          onClick={() => handleSelectRole('OWNER')}
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg cursor-pointer"
        >
          Enter Executive Owner Portal
        </button>
      </div>
    </div>
  );
}
