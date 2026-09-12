import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw,
  Terminal, Cpu, Building2, Settings as SettingsIcon, FileText, Monitor,
  FolderArchive, Plus, Search, Download, Trash2, Power, AlertTriangle, Play,
  Laptop, HardDrive, Printer, Check, Copy, User, Sparkles, ArrowUpRight, Zap
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedRow, setSelectedRow] = useState(false);

  // Dynamic tenant state for multi-tenancy support
  const [selectedTenant, setSelectedTenant] = useState<{ id: string; name: string } | null>({
    id: 'SCH-01',
    name: 'Munyaka Primary & Junior Secondary',
  });

  const licenseTitle = selectedTenant ? `${selectedTenant.name} License` : 'Tenant Subscription License';
  const subtitleName = selectedTenant ? selectedTenant.name : 'Institutional Tenant';

  const handleExportReport = () => {
    showSuccess('Platform Developer report exported successfully.');
  };

  // If path is /dev/subscriptions, render the exact requested subscriptions layout with dynamic tenant title
  if (path === '/dev/subscriptions') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-16">
        {/* 1. TOP PURPLE SUMMARY HERO CARD */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-purple-800/50">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-black uppercase tracking-widest border border-purple-400/30 backdrop-blur-md">
                  <Key size={14} /> ACTIVE PLAN
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3 flex-wrap">
                    {licenseTitle}
                    <span className="text-sm font-bold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-700/50">
                      Enterprise Plan
                    </span>
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1 gap-1.5">
                    <CheckCircle2 size={12} /> Active
                  </Badge>
                  <Badge className="bg-purple-800/60 text-purple-200 border border-purple-700/50 font-bold px-3 py-1">
                    STARTER
                  </Badge>
                  <Badge className="bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 font-bold px-3 py-1 gap-1">
                    <RefreshCw size={11} /> monthly
                  </Badge>
                </div>
              </div>

              {/* Top Right Box ("CURRENT BILL") */}
              <div className="bg-purple-950/70 border border-purple-700/40 rounded-2xl p-5 backdrop-blur-md shadow-inner flex flex-col justify-center min-w-[240px] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Current Bill</p>
                <p className="text-2xl md:text-3xl font-black text-white">KES 20,000 <span className="text-xs font-normal text-purple-300">/mo</span></p>
                <div className="text-xs text-purple-200 space-y-0.5 pt-1 border-t border-purple-800/60">
                  <p className="font-medium">Next billing: <strong className="text-white">2026-09-02</strong></p>
                  <p className="font-medium">Seats: <strong className="text-white">1,000 institutional seats</strong></p>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="pt-4 border-t border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => showSuccess('Payment recording modal opened.')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl h-11 px-5 shadow-lg gap-2">
                  <Zap size={16} className="text-amber-300" /> Record Payment
                </Button>
                <Button onClick={() => showSuccess('Generated new license key: MUNYAKA-2026-KEY')} variant="outline" className="border-purple-600 bg-purple-900/40 text-purple-100 hover:bg-purple-800 font-bold rounded-2xl h-11 px-5 gap-2">
                  <Sparkles size={16} className="text-purple-300" /> Generate License Key
                </Button>
                <Button onClick={() => showSuccess('Refreshed payment records.')} variant="outline" className="border-purple-600 bg-purple-900/40 text-purple-100 hover:bg-purple-800 font-bold rounded-2xl h-11 px-5 gap-2">
                  <RefreshCw size={16} className="text-purple-300" /> View Payment History
                </Button>
              </div>
              <p className="text-xs text-purple-300 font-medium">
                1 payment logged · 1 active license · $15.40 paid (this year)
              </p>
            </div>
          </div>
        </div>

        {/* 2. TOP NAVIGATION TABS BAR */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-wrap items-center gap-2">
          <Button variant="default" className="bg-indigo-600 text-white font-bold rounded-xl text-xs h-10 px-4 gap-2">
            <RefreshCw size={14} /> License Details (Active)
          </Button>
          <Button onClick={() => navigate('/dev/settings')} variant="ghost" className="text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2">
            <SettingsIcon size={14} /> Configuration
          </Button>
          <Button onClick={() => showSuccess('Payment gateways configured.')} variant="ghost" className="text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2">
            <Wifi size={14} /> Payment Gateways
          </Button>
          <Button onClick={() => navigate('/dev/payments')} variant="ghost" className="text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2">
            <FileText size={14} /> Invoice History
          </Button>
        </div>

        {/* 3. MAIN LICENSE DETAILS CARD */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{licenseTitle}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold gap-1">
                <CheckCircle2 size={12} /> Active
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold">
                STARTER
              </Badge>
            </div>
          </div>

          {/* Metrics Grid (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</span>
              <span className="text-sm font-black text-slate-900">Enterprise Plan</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interval</span>
              <span className="text-sm font-black text-slate-900">Monthly</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
              <span className="text-sm font-black text-slate-900">KES 20,000</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Billing</span>
              <span className="text-sm font-black text-slate-900">2026-09-02</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Cycle</span>
              <span className="text-sm font-black text-slate-900">Day 1 of each month</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><User size={14} className="text-indigo-600" /> Institutional Seats</span>
              <span className="text-sm font-black text-slate-900">1,000 seats</span>
            </div>
          </div>

          {/* Included Feature Badges */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Included Features</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Unlimited Students</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Advanced Analytics</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Priority Support</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Offline Activation Codes</Badge>
            </div>
          </div>

          {/* Controls & Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Auto-Renew License</h4>
                <p className="text-xs text-slate-500">Automatically charge payment method on billing cycle date</p>
              </div>
              <Switch checked={autoRenew} onCheckedChange={(val) => { setAutoRenew(val); showSuccess(`Auto-renew ${val ? 'enabled' : 'disabled'}`); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => showSuccess('Upgrade options opened.')} variant="outline" className="font-bold rounded-xl h-11 gap-2">
                <ArrowUpRight size={16} /> Upgrade Plan
              </Button>
              <Button onClick={() => showSuccess('License renewed successfully.')} variant="outline" className="font-bold rounded-xl h-11 gap-2">
                <RefreshCw size={16} /> Renew License
              </Button>
            </div>

            <Button onClick={() => showSuccess('Payment & License generated successfully.')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-12 shadow-lg gap-2">
              <Key size={16} /> Record Payment & Generate License Key
            </Button>

            <Button onClick={() => showSuccess('Edit license modal opened.')} variant="ghost" className="w-full text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl h-10 gap-2">
              <SettingsIcon size={14} /> Edit License Details
            </Button>
          </div>
        </Card>

        {/* 4. LICENSE HISTORY & ACTIVATION KEYS TABLE CARD */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-900">License History &amp; Activation Keys</h3>
                <Badge className="bg-purple-100 text-purple-800 border-none font-bold text-xs">🔑 1 key issued</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Select one or more rows to enable batch deletion. All issued activation keys, their payment records, and status.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <Checkbox checked={selectedRow} onCheckedChange={(c) => setSelectedRow(!!c)} />
                  </th>
                  <th className="p-4">Activation Key</th>
                  <th className="p-4">Issued To</th>
                  <th className="p-4">Device ID</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Valid For</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 text-center">
                    <Checkbox checked={selectedRow} onCheckedChange={(c) => setSelectedRow(!!c)} />
                  </td>
                  <td className="p-4 font-mono font-bold text-purple-600 text-xs">
                    MUNYAKA-2026-MF59-6CN5-NHGS-RWXU
                  </td>
                  <td className="p-4 font-bold text-slate-900">School Operator</td>
                  <td className="p-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-800">OFFICE-001</code>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    M-Pesa <span className="text-[11px] font-normal text-slate-400 block font-mono">JEM03456</span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-700">30 Days (Trial)</td>
                  <td className="p-4 font-mono text-xs text-slate-600">
                    9/28/2026
                    <span className="text-[10px] text-slate-400 block font-normal">Issued: 8/29/2026</span>
                  </td>
                  <td className="p-4">
                    <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold gap-1 w-max">
                      <CheckCircle2 size={12} /> Active
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText('MUNYAKA-2026-MF59-6CN5-NHGS-RWXU'); showSuccess('Key copied.'); }} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                      Copy Key
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest border border-cyan-500/30">
              <Shield size={14} /> PLATFORM DEVELOPER CONSOLE • ACTIVE
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Platform Developer Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Subscription, licensing, network synchronization, and platform health for Developer.
            </p>
          </div>

          {/* ── Top Action Buttons ──────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/lan-config')}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <Wifi size={16} className="text-cyan-400" /> LAN Server Config
            </Button>
            <Button
              onClick={() => navigate('/settings/profile')}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <SettingsIcon size={16} className="text-cyan-400" /> Profile Settings
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <FileText size={16} className="text-cyan-400" /> Export Report
            </Button>
            <Button
              onClick={() => navigate('/dev/subscriptions')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-cyan-900/30 gap-2 transition-all active:scale-95"
            >
              <CreditCard size={16} /> Manage Plan & Licenses
            </Button>
          </div>
        </div>
      </div>

      {/* ── Subscription & Licensing Banner (Cyan Gradient Card) ───────── */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Key size={14} /> CURRENT PLATFORM LICENSE
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black">Enterprise Plan</h2>
              <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md">
                ACTIVE NODE
              </span>
            </div>
            <p className="text-sm text-white/90 font-medium">
              Next Renewal: October 2027 • Active
            </p>
          </div>
          <Button
            onClick={() => navigate('/dev/subscriptions')}
            className="bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl h-12 px-6 shadow-xl transition-all active:scale-95 shrink-0"
          >
            Upgrade / Renew License
          </Button>
        </div>
      </div>

      {/* ── Capacity & Seat Tracking Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Student Seats</h3>
                <p className="text-xs text-slate-500 font-medium">Learner capacity allocation</p>
              </div>
            </div>
            <span className="text-sm font-black text-cyan-600">0%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>0 / 500 allocated</span>
              <span>500 Max</span>
            </div>
            <Progress value={0} className="h-3 bg-slate-100 [&>div]:bg-cyan-600 rounded-full" />
          </div>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Staff / Admin Seats</h3>
                <p className="text-xs text-slate-500 font-medium">Operator token seats</p>
              </div>
            </div>
            <span className="text-sm font-black text-blue-600">22%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>11 / 50 allocated</span>
              <span>50 Max</span>
            </div>
            <Progress value={22} className="h-3 bg-slate-100 [&>div]:bg-blue-600 rounded-full" />
          </div>
        </Card>
      </div>

      {/* ── Sidebar Menu & Footer Profile Section ─────────────────────── */}
      <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Platform Developer Profile</h3>
            <p className="text-xs text-slate-500 font-medium">Active operator credentials and role metadata</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Name</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Platform Developer</p>
            </div>
            <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[10px]">Verified</Badge>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role Tag</p>
              <p className="text-sm font-mono font-bold text-cyan-600 mt-0.5">DEVELOPER</p>
            </div>
            <Badge className="bg-cyan-100 text-cyan-800 border-none font-bold text-[10px]">ACTIVE</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
