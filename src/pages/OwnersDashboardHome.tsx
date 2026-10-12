import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, Shield, ArrowUpRight, CheckCircle2, Server, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OwnersDashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white shadow-2xl border border-emerald-500/20">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Shield size={320} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs uppercase tracking-wider font-bold">
              Executive Governance Portal
            </Badge>
            <Badge variant="outline" className="text-indigo-300 border-indigo-400/30 bg-indigo-950/40">
              Session: Executive Owner
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome to the Owner's Portal
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Centralized multi-campus governance, subscription billing, and network infrastructure management for Munyaka Education Platform.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button
              onClick={() => {
                window.location.hash = '#/tenants';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            >
              <Building2 size={18} />
              Manage Campuses & Tenants
            </Button>
            <Button
              onClick={() => {
                window.location.hash = '#/payments';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold px-6 py-3 rounded-2xl flex items-center gap-2"
            >
              <CreditCard size={18} />
              View Subscriptions
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          onClick={() => { window.location.hash = '#/tenants'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
          className="cursor-pointer hover:shadow-xl hover:border-emerald-500/50 transition-all rounded-2xl p-2 group"
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🏫
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center justify-between">
                Campuses & Tenants
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Provision and manage multi-school tenant instances and data isolation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => { window.location.hash = '#/lan'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
          className="cursor-pointer hover:shadow-xl hover:border-emerald-500/50 transition-all rounded-2xl p-2 group"
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🌐
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center justify-between">
                LAN Server Config
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure offline server synchronization, IP gateways, and peer nodes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => { window.location.hash = '#/payments'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
          className="cursor-pointer hover:shadow-xl hover:border-emerald-500/50 transition-all rounded-2xl p-2 group"
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              💳
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center justify-between">
                Subscriptions & Billing
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor recurring license fees, termly dues, and payment statuses.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => { window.location.hash = '#/settings'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
          className="cursor-pointer hover:shadow-xl hover:border-emerald-500/50 transition-all rounded-2xl p-2 group"
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center justify-between">
                Global Settings
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage global security policies, backup parameters, and admin roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Status Overview */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-600" />
            Infrastructure & Network Health
          </CardTitle>
          <CardDescription>
            All registered campus nodes are fully synchronized and operational.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Active Campuses</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">4 Campuses</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Database Engine</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">Isolated SQLite</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              🔒
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Security Level</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">Enterprise Grade</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
