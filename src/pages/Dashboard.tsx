import React from 'react';
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function Dashboard() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hashString = typeof window !== 'undefined' ? window.location.hash : '';
  const activeTab = searchParams.get('tab') || (hashString.includes('dashboard') ? 'dashboard' : 'owner');

  if (activeTab === 'dashboard' || hashString.includes('dashboard')) {
    return (
      <div className="space-y-6">
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Owner Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 mb-3">
          🛡️ SCHOOL OWNER & EXECUTIVE CONTROL CENTER
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Munyaka Institutional Master Portal</h1>
        <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
          Manage institutional licensing, central database harmonization, global security policies, and administrative permissions.
        </p>
      </div>

      {/* Owner Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System License Status</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">Active & Valid</p>
          <p className="text-xs text-slate-600 mt-1">365 Days remaining on current tier</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Central Database Nodes</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">munyaka_central_db</p>
          <p className="text-xs text-emerald-600 mt-1">✓ Synchronized offline-first</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Administrators</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">3 Staff Members</p>
          <p className="text-xs text-slate-600 mt-1">All permissions up to date</p>
        </div>
      </div>
    </div>
  );
}
