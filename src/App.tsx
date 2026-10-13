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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="p-4 bg-emerald-900 text-white flex justify-between items-center shadow">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-700 rounded text-xs font-bold">ADMIN PORTAL</span>
            <h1 className="font-bold text-lg">Munyaka Primary School</h1>
          </div>
          <button onClick={handleLogout} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold transition cursor-pointer">
            Log Out
          </button>
        </header>
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Admin Dashboard</h2>
            <p className="text-slate-600 text-sm mb-4">Operational management environment active. All systems synchronized.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xs text-emerald-700 font-bold">TOTAL LEARNERS</div>
                <div className="text-2xl font-black text-emerald-900 mt-1">24</div>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <div className="text-xs text-teal-700 font-bold">TEACHING STAFF</div>
                <div className="text-2xl font-black text-teal-900 mt-1">3</div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-700 font-bold">SYSTEM STATUS</div>
                <div className="text-2xl font-black text-indigo-900 mt-1">100%</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (role === 'OWNER') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold border border-emerald-500/30">OWNER PORTAL</span>
            <h1 className="font-bold text-lg">Executive Governance Hub</h1>
          </div>
          <button onClick={handleLogout} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold transition cursor-pointer">
            Log Out
          </button>
        </header>
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-2 text-white">Multi-Tenant Overview</h2>
            <p className="text-slate-400 text-sm mb-4">Executive master control and tenancy monitoring active.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="text-xs text-emerald-400 font-bold">ACTIVE TENANTS</div>
                <div className="text-2xl font-black text-white mt-1">1 Primary School</div>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="text-xs text-teal-400 font-bold">LICENSE STATUS</div>
                <div className="text-2xl font-black text-white mt-1">Valid (365 Days)</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-600/30 mb-4">
        MP
      </div>
      <h1 className="text-3xl font-bold mb-2">Munyaka Portal Gateway</h1>
      <p className="text-slate-400 mb-8 text-center max-w-md">Select your portal workspace below to access the operational dashboard or executive owner governance hub.</p>
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
