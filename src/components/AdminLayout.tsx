import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  BookOpen,
  Award,
  ShieldCheck,
  MessageSquare,
  Megaphone,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Laptop,
  Monitor,
  FolderHeart,
  Library,
  Box,
  Wallet,
  FileText,
  Settings,
  GraduationCap,
  LogOut,
  Sun,
  Moon,
  Home,
  Menu,
  X,
  Server
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/NotificationBell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/dashboard' },
    { icon: ShieldCheck, label: 'Data Harmonization Hub', path: '/admin/harmonization' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: UserCheck, label: 'Staff Registry', path: '/staff-registry' },
    { icon: Layers, label: 'Grades & Streams', path: '/grades' },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas' },
    { icon: Award, label: 'Exam Types', path: '/exam-types' },
    { icon: Server, label: 'Admin Control Center', path: '/admin/control-center' },
    { icon: MessageSquare, label: 'Communication', path: '/communication' },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance' },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis' },
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub' },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab' },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio' },
    { icon: Library, label: 'Library & E-Resources', path: '/library' },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory' },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees' },
    { icon: FileText, label: 'Report Cards', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: GraduationCap, label: 'Promote Students', path: '/promote' }
  ];

  return (
    <div className={cn("flex min-h-screen w-full bg-slate-50 dark:bg-slate-950", isDarkMode ? "dark" : "")}>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-slate-900 text-slate-100 border-r border-slate-800 z-[70] transform transition-transform duration-300 ease-in-out flex flex-col w-72 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800 shrink-0 min-h-[64px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-white">
              A
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white">SCHOOL ADMIN</h1>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Operations Portal</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <item.icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'School Administrator'}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">ADMINISTRATOR</p>
              </div>
            </div>
            <div className="border-t border-slate-700/80" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="w-full justify-center gap-2 rounded-xl h-9 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut size={14} /> Log Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-72">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
            >
              <Home size={16} />
              <span>Admin Dashboard Home</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <div className="hidden sm:block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              ADMINISTRATOR SESSION ACTIVE
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
