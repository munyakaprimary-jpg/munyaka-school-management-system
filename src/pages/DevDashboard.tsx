import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw, Terminal, Cpu, Building2, Settings as SettingsIcon, FileText, Monitor, FolderArchive } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  const handleRefreshLicenses = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showSuccess('License keys and subscription nodes synchronized successfully.');
    }, 800);
  };

  const renderContent = () => {
    switch (path) {
      case '/dev/settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Platform Settings</h2>
                  <p className="text-xs text-slate-500 font-medium">Configure global environment variables and master parameters</p>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Maintenance Mode</h4>
                    <p className="text-xs text-slate-500">Temporarily suspend platform access for non-admin users</p>
                  </div>
                  <Badge className="bg-slate-200 text-slate-700 font-bold border-none">Disabled</Badge>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Telemetry & Crash Reporting</h4>
                    <p className="text-xs text-slate-500">Collect anonymous diagnostic logs and error traces</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold border-none">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/schools':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">School Management</h2>
                  <p className="text-xs text-slate-500 font-medium">Multi-tenant school nodes and institutional tenant records</p>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Munyaka Primary & Junior Secondary</h4>
                    <p className="text-xs text-slate-500">Primary Node • Status: Active</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold border-none">Connected</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/subscriptions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">App Subscriptions & Renewals</h2>
                  <p className="text-xs text-slate-500 font-medium">Manage licensing tiers, billing cycles, and renewal status</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between mt-4">
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Current Tier</p>
                  <h4 className="text-base font-black text-slate-900 mt-1">Enterprise Annual License</h4>
                </div>
                <Badge className="bg-purple-600 text-white font-bold border-none px-3 py-1">Active</Badge>
              </div>
            </div>
          </div>
        );

      case '/dev/licenses':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Key size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">License Key Activation & Generation</h2>
                  <p className="text-xs text-slate-500">Cryptographic validation and hardware activation keys</p>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Key</p>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">MUNYAKA-PRO-2026-X9K2</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Valid</Badge>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hardware Fingerprint</p>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">HWID-8849-UUID-0192</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Locked</span>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/payments':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Payment History & Billing Records</h2>
                  <p className="text-xs text-slate-500 font-medium">Verified invoice logs and subscription payment receipts</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">INV-2026-001</h4>
                  <p className="text-xs text-slate-500">Annual License Renewal • Paid via M-Pesa</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold border-none">Verified</Badge>
              </div>
            </div>
          </div>
        );

      case '/dev/lan-sync':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Wifi size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">LAN & Offline Sync Status</h2>
                  <p className="text-xs text-slate-500 font-medium">Local mesh server peer-to-peer data propagation</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Local Mesh Node Active</h4>
                  <p className="text-xs text-emerald-600 font-medium">Listening on port 8080 (SQLite local cache)</p>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold border-none">Online</Badge>
              </div>
            </div>
          </div>
        );

      case '/dev/devices':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Monitor size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Connected Hardware Peripherals</h2>
                  <p className="text-xs text-slate-500 font-medium">Printers, scanners, and registered terminals</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2"><Cpu size={18} className="text-indigo-600" /> Main LAN Server Hub</span>
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Online</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2"><Server size={18} className="text-indigo-600" /> Receipt Thermal Printer</span>
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Ready</span>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/logs':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <FolderArchive size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">System Logs & Audit Metrics</h2>
                  <p className="text-xs text-slate-500 font-medium">Real-time event stream and diagnostic kernel logs</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2 mt-4 overflow-x-auto">
                <p className="text-emerald-400">[INFO] 2026-03-31 08:00:00 - LAN mesh node initialized successfully.</p>
                <p className="text-slate-300">[DEBUG] 2026-03-31 08:00:05 - License validation check passed (MUNYAKA-PRO-2026-X9K2).</p>
                <p className="text-indigo-400">[SYNC] 2026-03-31 08:00:10 - SQLite records synced across 4 connected peripherals.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* ── System Health & Stats Grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Activity size={24} />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Optimal</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Status</p>
                  <h3 className="text-2xl font-black text-slate-900">99.98%</h3>
                  <p className="text-[11px] text-slate-500 font-medium">LAN server operational</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Key size={24} />
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Active</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Licenses</p>
                  <h3 className="text-2xl font-black text-slate-900">1 / 1 Seat</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Enterprise Edition</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wifi size={24} />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold">Connected</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Connected Nodes</p>
                  <h3 className="text-2xl font-black text-slate-900">4 Devices</h3>
                  <p className="text-[11px] text-slate-500 font-medium">POS, Printers, LAN Node</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CreditCard size={24} />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-none font-bold">Verified</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">App Subscriptions</p>
                  <h3 className="text-2xl font-black text-slate-900">Annual Plan</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Renews Jan 2027</p>
                </div>
              </Card>
            </div>

            {/* ── Detailed Management Panels ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">License & Key Management</h3>
                    <p className="text-xs text-slate-500">Cryptographic validation and hardware activation keys</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Key</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">MUNYAKA-PRO-2026-X9K2</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Valid</Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hardware Fingerprint</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">HWID-8849-UUID-0192</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">Locked</span>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Connected Devices & LAN Nodes</h3>
                    <p className="text-xs text-slate-500">Printers, POS terminals, and local mesh routers</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Cpu size={16} className="text-indigo-600" /> Main LAN Server Hub</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Server size={16} className="text-indigo-600" /> Receipt Thermal Printer</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Terminal size={16} className="text-indigo-600" /> Offline Sync Node</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Active</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest border border-amber-500/30">
              <Shield size={14} /> Platform Developer Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {path === '/dev/settings' && 'Platform Settings'}
              {path === '/dev/schools' && 'School Management'}
              {path === '/dev/subscriptions' && 'App Subscriptions & Renewals'}
              {path === '/dev/licenses' && 'License Key Management'}
              {path === '/dev/payments' && 'Payment History & Billing'}
              {path === '/dev/lan-sync' && 'LAN & Offline Sync'}
              {path === '/dev/devices' && 'Connected Hardware Devices'}
              {path === '/dev/logs' && 'System Logs & Metrics'}
              {path === '/dev/dashboard' && 'Software Management & Licensing'}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Dedicated technical control center for app subscriptions, license keys, cryptographic nodes, and connected hardware peripherals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshLicenses}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-amber-900/30 gap-2 transition-all active:scale-95"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              Sync Nodes
            </Button>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
