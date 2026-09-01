import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Code2, Server, Globe, Bug, Shield, ArrowRight } from 'lucide-react';

const DevDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Developer Dashboard</h1>
            <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold rounded-full">
              DEV
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Platform maintenance, global system configuration, and debugging.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { Icon: Code2, label: 'Build & Deploy', color: 'bg-violet-50 text-violet-700 border-violet-200' },
          { Icon: Server, label: 'System Config', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { Icon: Globe, label: 'Multi-Tenant', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { Icon: Bug, label: 'Debug Console', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(({ Icon, label, color }) => (
          <div
            key={label}
            className={`p-5 border-2 rounded-2xl bg-white hover:shadow-lg transition-all cursor-pointer group ${color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/60 rounded-xl">
                <Icon size={22} />
              </div>
              <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-black text-sm">{label}</p>
            <p className="text-[10px] font-medium opacity-70 mt-1">Open module</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Developer Console</h2>
            <p className="text-xs text-slate-500">
              Platform-level operations. Use with care.
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          This dashboard is reserved exclusively for the platform developer. It provides
          access to global system configuration, multi-tenant setup, and debugging tools
          that are not available to school administrators.
        </p>
      </div>
    </div>
  );
};

export default DevDashboard;
