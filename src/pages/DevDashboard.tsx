import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw, Terminal, Cpu } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefreshLicenses = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showSuccess('License keys and subscription nodes synchronized successfully.');
    }, 800);
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
              Software Management & Licensing
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}
