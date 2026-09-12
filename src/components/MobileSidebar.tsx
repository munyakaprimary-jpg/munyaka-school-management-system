import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Building2,
  CreditCard,
  Key,
  Wifi,
  Monitor,
  Activity,
  LogOut,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  let storedUser: { role?: string; name?: string } = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('munyaka_user') || '{}');
  } catch { /* ignore */ }

  const userRole = storedUser.role || user?.role || 'Admin';
  const isDev = userRole === 'Dev' || userRole === 'PlatformAdmin';

  const devNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dev/dashboard' },
    { icon: Settings, label: 'Platform Settings', path: '/dev/settings' },
    { icon: Building2, label: 'School Management', path: '/dev/schools' },
    { icon: CreditCard, label: 'App Subscriptions', path: '/payment-management' },
    { icon: Key, label: 'License Management', path: '/dev/licenses' },
    { icon: CreditCard, label: 'Payment History', path: '/payment-management' },
    { icon: Wifi, label: 'LAN & Offline Sync', path: '/lan-config' },
    { icon: Monitor, label: 'Connected Devices', path: '/lan-config' },
    { icon: Activity, label: 'System Logs & Metrics', path: '/dev/logs' },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-dashboard' },
    { icon: Users, label: 'Staff Access Master', path: '/admin/control-center' },
    { icon: UserCheck, label: 'Student Directory', path: '/students' },
    { icon: BookOpen, label: 'CBC Assessment', path: '/central-data' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
  ];

  const navList = isDev ? devNavItems : adminNavItems;

  const avatarText = isDev ? 'DV' : 'AD';
  const userNameLabel = isDev ? 'Platform Developer' : 'Admin';
  const subtitleLabel = isDev ? 'DEVELOPER' : 'ADMINISTRATOR';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <aside className="relative flex flex-col w-72 max-w-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-full z-10 shadow-2xl">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">
              M
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Munyaka</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                {isDev ? 'Platform Dev' : 'School Admin'}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navList.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0'} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link to="/" onClick={() => setIsOpen(false)} className="shrink-0 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-100">
                  {avatarText}
                </div>
              </Link>
              <div className="overflow-hidden flex-1">
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <p className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors dark:text-white">
                    {userNameLabel}
                  </p>
                </Link>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                  {subtitleLabel}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('munyaka_user');
                  localStorage.removeItem('munyaka_admin_session');
                  setIsOpen(false);
                  window.location.hash = '/login';
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 py-2 px-3 rounded-xl transition-colors"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MobileSidebar;
