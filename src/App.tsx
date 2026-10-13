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
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-indigo-800 text-indigo-200 rounded text-xs font-bold uppercase tracking-wider">Operational</span>
            <h1 className="font-bold text-lg">School Admin Portal - Munyaka Primary</h1>
          </div>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold transition-colors shadow cursor-pointer">
            Log Out
          </button>
        </header>
        <main className="p-6 flex-1 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Students</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">24</p>
              <p className="text-xs text-slate-500 mt-1">Active registered learners</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Teaching Staff</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-2">3</p>
              <p className="text-xs text-slate-500 mt-1">Active: 3 | Pending: 0</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">System Status</p>
              <p className="text-lg font-bold text-emerald-600 mt-2">Live Factual Sync</p>
              <p className="text-xs text-slate-500 mt-1">Database connected</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'OWNER') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold uppercase tracking-wider">Governance Hub</span>
            <h1 className="font-bold text-lg text-emerald-400">Executive Owner Portal</h1>
          </div>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold transition-colors shadow cursor-pointer">
            Log Out
          </button>
        </header>
        <main className="p-6 flex-1 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-emerald-400 uppercase">License Status</p>
              <p className="text-2xl font-extrabold text-white mt-2">LICENSED - 365D LEFT</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase">Active Campuses / Tenants</p>
              <p className="text-2xl font-extrabold text-white mt-2">Munyaka Primary & Junior</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-2xl mb-4 border border-emerald-500/30 shadow-lg">
        MP
      </div>
      <h1 className="text-3xl font-bold mb-2">Munyaka Portal Gateway</h1>
      <p className="text-slate-400 mb-8 text-center max-w-md">
        Select your authorized access level below to enter strictly isolated operational or governance dashboards.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => handleSelectRole('ADMIN')}
          className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg text-base transition-all text-center cursor-pointer"
        >
          Enter School Admin Portal
        </button>
        <button
          onClick={() => handleSelectRole('OWNER')}
          className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg text-base transition-all text-center cursor-pointer"
        >
          Enter Executive Owner Portal
        </button>
      </div>
    </div>
  );
}

export default App;
