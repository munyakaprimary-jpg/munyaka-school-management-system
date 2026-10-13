import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Building2,
  UserCog,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function AdminSidebar({ activeTab, setActiveTab = () => {}, onClose, isOpen = true }: AdminSidebarProps) {
  const { logout, user } = useAuth();

  const getActiveId = () => {
    if (activeTab) return activeTab;
    const hash = window.location.hash.replace('#/', '').replace('/', '').trim();
    if (!hash) return 'dashboard';
    if (hash.startsWith('admin/')) return 'dashboard';
    if (hash === 'students' || hash === 'learners') return 'students';
    if (hash === 'staff') return 'staff';
    if (hash === 'attendance') return 'attendance';
    if (hash === 'assessments') return 'assessments';
    if (hash === 'fees') return 'fees';
    if (hash === 'reports' || hash === 'analysis' || hash === 'grading') return 'reports';
    if (hash === 'grades' || hash === 'promote') return 'grades';
    if (hash === 'library') return 'library';
    if (hash === 'inventory') return 'inventory';
    if (hash === 'settings' || hash === 'profile') return 'settings';
    return 'dashboard';
  };

  const currentActive = getActiveId();

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (onClose) onClose();
  };

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '#/' },
    { id: 'students', label: 'Learners', icon: Users, path: '#/students' },
    { id: 'staff', label: 'Staff Registry', icon: UserCog, path: '#/staff-registry' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, path: '#/attendance' },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck, path: '#/assessments' },
    { id: 'fees', label: 'Fees & Bursary', icon: CreditCard, path: '#/fees' },
    { id: 'grades', label: 'Grades & Promotion', icon: GraduationCap, path: '#/grades' },
    { id: 'reports', label: 'Results & Reports', icon: BookOpen, path: '#/analysis' },
    { id: 'library', label: 'Library', icon: Building2, path: '#/library' },
    { id: 'inventory', label: 'Inventory', icon: Building2, path: '#/inventory' },
    { id: 'settings', label: 'Settings', icon: ShieldCheck, path: '#/settings' },
  ];

  const handleLogout = () => {
    try {
      logout();
    } catch {}
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Top Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">School Administration</span>
            <h2 className="text-base font-black text-white tracking-tight">MUNYaka ADMIN</h2>
            {user?.name && (
              <p className="text-xs text-slate-400 mt-1 truncate">{user.name}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div
          className="flex-1 min-h-0 my-3 space-y-1.5 overflow-y-scroll"
          style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        >
          <nav className="space-y-1.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id, item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
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

        {/* User Profile Card & Log Out pinned to bottom */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0 mt-auto space-y-3">
          {/* Profile Badge Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
              {(user?.name || 'A').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">School Administrator</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800/80" />

          {/* Log Out Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <span className="text-sm">🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}