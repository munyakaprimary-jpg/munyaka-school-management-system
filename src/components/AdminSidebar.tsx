import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  DollarSign, 
  BookOpen, 
  Settings, 
  LogOut,
  X,
  ShieldCheck,
  Building2,
  Clock,
  ClipboardList
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function AdminSidebar({ activeTab, setActiveTab = () => {}, onClose, isOpen = true }: AdminSidebarProps) {
  const { logout } = useAuth();

  const getActiveId = () => {
    if (activeTab) return activeTab;
    const hash = window.location.hash.replace('#/', '').replace('/', '').trim();
    if (!hash || hash === 'admin-dashboard' || hash === 'dashboard') return 'admin-dashboard';
    if (hash === 'students') return 'students';
    if (hash === 'grades') return 'grades';
    if (hash === 'attendance') return 'attendance';
    if (hash === 'assessments') return 'assessments';
    if (hash === 'fees') return 'fees';
    if (hash === 'reports') return 'reports';
    if (hash === 'library') return 'library';
    if (hash === 'settings') return 'settings';
    return 'admin-dashboard';
  };

  const currentActive = getActiveId();

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (onClose) onClose();
  };

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'School Dashboard', path: '#/admin-dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Learners Roster', path: '#/students', icon: Users },
    { id: 'grades', label: 'Grades & Streams', path: '#/grades', icon: GraduationCap },
    { id: 'attendance', label: 'Daily Attendance', path: '#/attendance', icon: Clock },
    { id: 'assessments', label: 'CBC Assessments', path: '#/assessments', icon: ClipboardList },
    { id: 'fees', label: 'Fee Management', path: '#/fees', icon: DollarSign },
    { id: 'reports', label: 'Report Cards', path: '#/reports', icon: FileText },
    { id: 'library', label: 'Library & Assets', path: '#/library', icon: BookOpen },
    { id: 'settings', label: 'Admin Settings', path: '#/settings', icon: Settings }
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem('munyaka_user_role');
      logout();
    } catch {}
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">School Admin Portal</span>
            <h2 className="text-base font-black text-white tracking-tight">MUNYAKA ADMIN</h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div 
          className="flex-1 min-h-0 my-3 space-y-1 overflow-y-auto" 
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id, item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0 mt-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">School Administrator</p>
              <p className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">OPERATIONAL ADMIN</p>
            </div>
          </div>

          <div className="border-t border-slate-800/80" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
