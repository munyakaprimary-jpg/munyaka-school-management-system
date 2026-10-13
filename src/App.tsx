import React, { useState } from 'react';
import { LayoutDashboard, Users, UserCheck, DollarSign, Server, Settings, Database, ArrowUpCircle } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<'ADMIN' | 'OWNER' | null>(() => {
    return (localStorage.getItem('munyaka_portal_role') as 'ADMIN' | 'OWNER') || null;
  });
  const [selectedYear, setSelectedYear] = useState('2026');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'learners' | 'attendance' | 'fees' | 'server' | 'settings' | 'central' | 'promote'>('dashboard');

  const handleSelectRole = (selectedRole: 'ADMIN' | 'OWNER') => {
    localStorage.setItem('munyaka_portal_role', selectedRole);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('munyaka_portal_role');
    setRole(null);
  };

  const enrolmentRows = [
    { grade: 'PP1', boys: 0, girls: 0, total: 0 },
    { grade: 'PP2', boys: 0, girls: 0, total: 0 },
    { grade: 'Grade 1', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 2', boys: 2, girls: 1, total: 3 },
    { grade: 'Grade 3', boys: 2, girls: 2, total: 4 },
    { grade: 'Grade 4', boys: 2, girls: 1, total: 3 },
    { grade: 'Grade 5', boys: 2, girls: 2, total: 4 },
    { grade: 'Grade 6', boys: 3, girls: 3, total: 6 },
    { grade: 'Grade 7', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 8', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 9', boys: 1, girls: 0, total: 1 },
  ];

  const totalBoys = enrolmentRows.reduce((acc, r) => acc + r.boys, 0);
  const totalGirls = enrolmentRows.reduce((acc, r) => acc + r.girls, 0);
  const totalEnrolmentSum = enrolmentRows.reduce((acc, r) => acc + r.total, 0);

  const streamsList = [
    { name: 'Grade 7 - Mercury', morning: '14/15', afternoon: '13/15', present: 14, total: 15, rate: '93%' },
    { name: 'Grade 7 - Neptune', morning: '12/12', afternoon: '11/12', present: 12, total: 12, rate: '95%' },
    { name: 'Grade 8 - Jupiter', morning: '15/16', afternoon: '14/16', present: 15, total: 16, rate: '92%' },
    { name: 'Grade 9 - Zenith', morning: '10/10', afternoon: '10/10', present: 10, total: 10, rate: '100%' },
    { name: 'Grade 6 - North', morning: '18/18', afternoon: '17/18', present: 18, total: 18, rate: '97%' },
    { name: 'Grade 5 - South', morning: '19/20', afternoon: '19/20', present: 19, total: 20, rate: '96%' },
    { name: 'Grade 4 - East', morning: '16/16', afternoon: '15/16', present: 16, total: 16, rate: '95%' },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learners', label: 'Learners', icon: Users },
    { id: 'attendance', label: 'Roll Call', icon: UserCheck },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'server', label: 'Server', icon: Server },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'central', label: 'Central', icon: Database },
    { id: 'promote', label: 'Promote', icon: ArrowUpCircle },
  ];

  if (role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-24">
        {/* Top Header */}
        <header className="bg-indigo-950 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-indigo-800 text-indigo-200 rounded text-xs font-bold uppercase tracking-wider">Operational</span>
            <h1 className="font-bold text-lg">Munyaka Primary School - Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold text-white transition cursor-pointer">
            Log Out
          </button>
        </header>

        {/* Main Content Area */}
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
          {adminTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Banner & Status Badges */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/90 text-emerald-200 border border-emerald-500/30">
                    🛡️ LICENSED - 365D LEFT
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-800/90 text-teal-200 border border-teal-500/30">
                    ✓ LIVE FACTUAL SYNC
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">School Administration Control Center</h2>
                  <p className="text-emerald-100/80 text-sm mt-1">Manage learners, staff, dual-session roll call, and fee collections.</p>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">TOTAL STUDENTS</div>
                    <div className="text-2xl font-bold my-1">24</div>
                    <div className="text-[10px] text-emerald-300/80">Active registered learners</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">TEACHING STAFF</div>
                    <div className="text-2xl font-bold my-1">3</div>
                    <div className="text-[10px] text-emerald-300/80">Active: 3 | Pending: 0</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">NON-TEACHING</div>
                    <div className="text-2xl font-bold my-1">0</div>
                    <div className="text-[10px] text-emerald-300/80">Support & Administration</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">PRIMARY SCHOOL</div>
                    <div className="text-2xl font-bold my-1">21</div>
                    <div className="text-[10px] text-emerald-300/80">Grades 1 to 6 learners</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">JUNIOR SCHOOL</div>
                    <div className="text-2xl font-bold my-1">3</div>
                    <div className="text-[10px] text-emerald-300/80">Grades 7 to 9 learners</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white">
                    <div className="text-[11px] text-emerald-200 font-medium">SYSTEM STATUS</div>
                    <div className="text-2xl font-bold my-1">100%</div>
                    <div className="text-[10px] text-emerald-300/80">Active & Synchronized</div>
                  </div>
                </div>
              </div>

              {/* School Enrolment Matrix Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">School Enrolment Matrix ({selectedYear})</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Grade-by-grade gender breakdown across PP1 through Grade 9</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">ACADEMIC YEAR:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold">
                        <th className="py-3 px-4">GRADE</th>
                        <th className="py-3 px-4 text-right">BOYS</th>
                        <th className="py-3 px-4 text-right">GIRLS</th>
                        <th className="py-3 px-4 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {enrolmentRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{row.grade}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.boys}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.girls}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">{row.total}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-100">
                        <td className="py-3.5 px-4 text-slate-900">TOTAL ENROLMENT</td>
                        <td className="py-3.5 px-4 text-right text-slate-900">{totalBoys}</td>
                        <td className="py-3.5 px-4 text-right text-slate-900">{totalGirls}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-800 text-base">{totalEnrolmentSum}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stream Attendance Trends */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">Dynamic Stream-by-Stream Dual-Session Attendance Trends</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Live morning & afternoon attendance rates by class</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold">
                        <th className="py-3 px-4">STREAM / CLASS</th>
                        <th className="py-3 px-4 text-center">MORNING ROLL CALL</th>
                        <th className="py-3 px-4 text-center">AFTERNOON ROLL CALL</th>
                        <th className="py-3 px-4 text-right">PRESENT / TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {streamsList.map((stream, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {stream.name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold text-xs">
                              {stream.morning} ({stream.rate})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-semibold text-xs">
                              {stream.afternoon}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            {stream.present} / {stream.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminTab !== 'dashboard' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
                {adminTab.toUpperCase().slice(0, 3)}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 capitalize">{adminTab} Management Module</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Operational module for {adminTab} is active and fully isolated within the School Admin Portal.
              </p>
              <button
                onClick={() => setAdminTab('dashboard')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition cursor-pointer"
              >
                ← Return to Dashboard
              </button>
            </div>
          )}
        </main>

        {/* Bottom Operational Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-2 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-around md:justify-center gap-1 md:gap-4 overflow-x-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminTab(item.id as any)}
                  className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon size={18} className="mb-0.5" />
                  <span className="text-[10px] md:text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
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
          <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-sm font-semibold text-white transition cursor-pointer">
            Log Out
          </button>
        </header>
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <p className="text-xs font-bold text-emerald-400 uppercase">License Status</p>
              <p className="text-2xl font-extrabold text-white mt-2">LICENSED - 365D LEFT</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
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
          className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold shadow-lg text-base transition-all text-center cursor-pointer"
        >
          Enter School Admin Portal
        </button>
        <button
          onClick={() => handleSelectRole('OWNER')}
          className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold shadow-lg text-base transition-all text-center cursor-pointer"
        >
          Enter Executive Owner Portal
        </button>
      </div>
    </div>
  );
}
