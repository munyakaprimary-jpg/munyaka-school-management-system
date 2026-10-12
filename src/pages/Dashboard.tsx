import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  Database, 
  Users, 
  CreditCard, 
  Server, 
  Settings, 
  Activity, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Globe, 
  FileText,
  Sliders,
  HardDrive
} from 'lucide-react';

export default function OwnersPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'tenants' | 'billing' | 'database' | 'security'>('overview');

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Owner Sidebar Navigation */}
      <aside className="w-72 bg-emerald-950 text-white flex flex-col border-r border-emerald-900 shadow-xl">
        <div className="p-6 border-b border-emerald-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-2xl text-emerald-200 border border-emerald-700/50 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight text-white">Owner's Portal</h2>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">Master Executive</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('licenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'licenses'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Key className="w-5 h-5 text-emerald-400" />
            <span>Master Licenses</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'tenants'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Campuses & Tenants</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'billing'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Billing & Subscriptions</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'database'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Central DB & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 border border-emerald-700'
                : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Security & Governance</span>
          </button>
        </nav>

        <div className="p-4 border-t border-emerald-900">
          <div className="bg-emerald-900/50 rounded-2xl p-3 border border-emerald-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Master Node Online
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-1">Version 4.2.0-Enterprise</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Executive Owner Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 mb-4 shadow-sm">
                🛡️ SCHOOL OWNER & EXECUTIVE CONTROL CENTER
              </span>
              <h1 className="text-3xl font-black tracking-tight">Munyaka Institutional Master Portal</h1>
              <p className="text-emerald-100/80 text-sm mt-2 max-w-2xl leading-relaxed">
                Manage institutional licensing, central database harmonization, global security policies, and administrative permissions across all connected campuses.
              </p>
            </div>

            {/* Owner Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System License Status</p>
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><Key className="w-4 h-4" /></span>
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-3">Active & Valid</p>
                <p className="text-xs font-medium text-slate-500 mt-1">365 Days remaining on current tier</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Central Database Nodes</p>
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl"><Database className="w-4 h-4" /></span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-3">munyaka_central_db</p>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized offline-first
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Administrators</p>
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl"><Users className="w-4 h-4" /></span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-3">3 Staff Members</p>
                <p className="text-xs font-medium text-slate-500 mt-1">All permissions up to date</p>
              </div>
            </div>

            {/* Quick Actions & Recent Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-700" /> Master Institutional Controls
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">Generate Master License Key</p>
                      <p className="text-xs text-slate-500">Issue cryptographic renewal token for institutional nodes</p>
                    </div>
                    <Key className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>

                  <button className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">Force Central Database Sync</p>
                      <p className="text-xs text-slate-500">Trigger immediate replication across campus servers</p>
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-700" /> System Audit Trail
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Master license validated</p>
                      <p className="text-[11px] text-slate-500">Authenticated via secure token</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Today</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Central DB Backup Completed</p>
                      <p className="text-[11px] text-slate-500">munyaka_central_db.bak</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Master License Management</h2>
              <p className="text-slate-500 text-sm mb-6">Control institutional validity periods, seat caps, and feature unlocks.</p>
              
              <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">Active Tier: Enterprise Unlimited</span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">Munyakas Primary & Junior Secondary</h3>
                  <p className="text-xs text-slate-600 mt-1">License Key: <code className="bg-white px-2 py-1 rounded border border-emerald-300 font-mono text-emerald-900">MUNYAKA-OWNER-2026-X99Q</code></p>
                </div>
                <button className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-sm rounded-xl shadow hover:bg-emerald-900 transition-all">
                  Renew License
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Campuses & Tenants</h2>
              <p className="text-slate-500 text-sm mb-6">Manage multi-campus installations and regional nodes.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-800 text-base">Main Campus (Ruiru)</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Primary Node</span>
                  </div>
                  <p className="text-xs text-slate-500">Status: Fully Operational</p>
                  <p className="text-xs text-slate-500 mt-1">Registered Learners: 1,240</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Billing & Subscriptions</h2>
              <p className="text-slate-500 text-sm mb-6">Review institutional invoicing, payment gateways, and subscription cycles.</p>
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-bold text-slate-700">All institutional invoices are fully paid for the current academic year.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Central Database & Synchronization</h2>
              <p className="text-slate-500 text-sm mb-6">Monitor offline-first synchronization nodes and database backups.</p>
              <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <p className="text-emerald-400">[INFO] Connected to munyaka_central_db</p>
                <p>[SYNC] All student assessment records harmonized.</p>
                <p className="text-emerald-400">[STATUS] Offline redundancy active (IndexedDB & LocalServer).</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Security & Governance</h2>
              <p className="text-slate-500 text-sm mb-6">Configure cryptographic overrides and administrator access policies.</p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">Require Superadmin Password Override</p>
                    <p className="text-xs text-slate-500">Enforce secondary authorization for sensitive financial resets</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
