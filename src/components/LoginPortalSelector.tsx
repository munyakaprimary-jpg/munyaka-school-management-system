import React from 'react';
import { Shield, Crown, Sparkles, ArrowRight, Building, Lock } from 'lucide-react';

interface LoginPortalSelectorProps {
  onSelectRole: (role: 'ADMIN' | 'OWNER') => void;
}

export function LoginPortalSelector({ onSelectRole }: LoginPortalSelectorProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto relative z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-bold uppercase tracking-widest shadow-inner">
            <Sparkles size={14} className="text-amber-400" />
            <span>Munyaka CBC School Management Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Portal Session</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose your authorized access level below to enter strictly isolated operational or governance dashboards.
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* School Admin Card */}
          <div className="group relative bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/80 rounded-3xl p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              Operational
            </div>

            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-indigo-950">
                <Shield size={28} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">School Admin Portal</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Manage daily school operations, learners roster, attendance records, CBC assessments, fee ledgers, and report cards.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>Full student & teacher records access</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>CBC assessment & grading modules</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => onSelectRole('ADMIN')}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-950 flex items-center justify-center gap-3 transition-all group-hover:gap-4"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Executive Owner Card */}
          <div className="group relative bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/80 rounded-3xl p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              Governance
            </div>

            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-emerald-950">
                <Crown size={28} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Executive Owner Portal</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Oversee multiple school campuses, tenant subscriptions, multi-campus financial aggregates, LAN server sync, and licensing.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Multi-campus tenant monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Subscription & billing control</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => onSelectRole('OWNER')}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-950 flex items-center justify-center gap-3 transition-all group-hover:gap-4"
              >
                <span>Enter Owner Portal</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-2 pt-2">
          <Lock size={12} />
          <span>Strict session isolation enforced by Munyaka Security Core</span>
        </div>
      </div>
    </div>
  );
}
