import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, DollarSign, Server, Settings, Database, ArrowUpCircle, ShieldCheck, LogOut } from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { label: 'Learners', path: '/students', icon: Users },
    { label: 'Roll Call', path: '/attendance', icon: UserCheck },
    { label: 'Fees', path: '/fees', icon: DollarSign },
    { label: 'Server', path: '/lan-config', icon: Server },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Central', path: '/central-data', icon: Database },
    { label: 'Promote', path: '/promote', icon: ArrowUpCircle },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 min-h-screen p-4 sticky top-0">
      <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-800 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg">
          MP
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-wide text-white">Munyaka Primary</h2>
          <p className="text-[11px] text-emerald-400 font-medium">School Admin Portal</p>
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 mb-2">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/admin-dashboard' && (currentPath === '/admin' || currentPath === '/'));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <ShieldCheck size={14} />
            <span>LICENSED - 365D LEFT</span>
          </div>
          <p className="text-[10px] text-slate-400">LIVE FACTUAL SYNC active with automated cloud backups.</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('munyaka_current_role');
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
        >
          <LogOut size={14} />
          <span>Switch Role / Exit</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
