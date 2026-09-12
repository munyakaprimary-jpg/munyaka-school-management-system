import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
}) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || (path === '/dev/dashboard' && location.pathname === '/');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <Link to="/dev/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-none">
            M
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Munyaka</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                Platform Dev
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation (Exact 6 items) */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <Link to="/dev/dashboard" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/dashboard') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">📊</span>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
        <Link to="/dev/games" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/games') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">🎮</span>
          {!isCollapsed && <span>Games Hub</span>}
        </Link>
        <Link to="/dev/subscriptions" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/subscriptions') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">💳</span>
          {!isCollapsed && <span>Payment & Subscriptions</span>}
        </Link>
        <Link to="/dev/lan-sync" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/lan-sync') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">📶</span>
          {!isCollapsed && <span>LAN Server Config</span>}
        </Link>
        <Link to="/dev/study-corner" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/study-corner') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">📖</span>
          {!isCollapsed && <span>Study Corner</span>}
        </Link>
        <Link to="/dev/settings" onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm ${isActive('/dev/settings') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
          <span className="font-bold text-lg">⚙️</span>
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Bottom Profile Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Link to="/dev/dashboard" onClick={() => setIsOpen(false)} className="shrink-0 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-100">
                PD
              </div>
            </Link>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <Link to="/dev/dashboard" onClick={() => setIsOpen(false)}>
                  <p className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors dark:text-white">
                    Platform Developer
                  </p>
                </Link>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                  DEVELOPER
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
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
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
