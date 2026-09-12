import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw,
  Terminal, Cpu, Building2, Settings as SettingsIcon, FileText, Monitor,
  FolderArchive, Plus, Search, Download, Trash2, Power, AlertTriangle, Play,
  Laptop, HardDrive, Printer, Check, Copy, User
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleExportReport = () => {
    showSuccess('Platform Developer report exported successfully.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. DASHBOARD HEADER & BRANDING */}
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

          {/* 2. TOP ACTION BUTTONS */}
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
              onClick={() => navigate('/payment-management')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-cyan-900/30 gap-2 transition-all active:scale-95"
            >
              <CreditCard size={16} /> Manage Plan & Licenses
            </Button>
          </div>
        </div>
      </div>

      {/* 3. SUBSCRIPTION & LICENSING BANNER (Cyan Gradient Card) */}
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
            onClick={() => navigate('/payment-management')}
            className="bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl h-12 px-6 shadow-xl transition-all active:scale-95 shrink-0"
          >
            Upgrade / Renew License
          </Button>
        </div>
      </div>

      {/* 4. CAPACITY & SEAT TRACKING CARDS */}
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

      {/* 5. SIDEBAR MENU & FOOTER PROFILE SECTION */}
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
