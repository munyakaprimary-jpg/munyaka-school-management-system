import React from 'react';
import PaymentManagement from '@/pages/PaymentManagement';
import { ShieldCheck, Activity, Database, Server, RefreshCw, Key, Users, Settings } from 'lucide-react';

const JamlyanAnalyticsPortal: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Jamlyan Analytics Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              <ShieldCheck size={14} /> Jamlyan Analytics &amp; Platform Control
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Platform Owner Operator Portal
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Central management console for application version updates, system maintenance notices, monthly app subscription billing, global teacher app locks, and owner bypass overrides.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Platform Status: Operational
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Subscription & Billing Management / Lock Controls */}
      <PaymentManagement />
    </div>
  );
};

export default JamlyanAnalyticsPortal;
