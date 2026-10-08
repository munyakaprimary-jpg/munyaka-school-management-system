import React, { useState, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Award,
  Contact2,
  Key,
  School,
  CreditCard,
  User,
  MessageSquare,
  Bell,
  Clock,
  CheckSquare,
  ClipboardCheck,
  LogIn,
  Fingerprint,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Laptop,
  Monitor,
  Keyboard,
  Target,
  FolderHeart,
  Library,
  Box,
  Wallet,
  Shield,
  ShieldCheck,
  UserCheck,
  Archive,
  ArrowUpCircle,
  Settings,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Database,
  Server,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(false, () => {});

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Shield, label: 'Admin Dashboard', path: '/system-management' },
    { icon: Users, label: 'Staff Registry', path: '/staff-registry' },
    { icon: ShieldCheck, label: 'Data Harmonization Hub', path: '/admin/harmonization' },
    { icon: Wifi, label: 'Teacher LAN Config', path: '/teacher-lan-config' },
    { icon: Gamepad2, label: 'Games Hub', path: '/games' },
    { icon: Layers, label: 'Grades & Streams', path: '/grades' },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas' },
    { icon: Award, label: 'Exam Types', path: '/exam-types' },
    { icon: Clock, label: 'Timetable', path: '/timetable' },
    { icon: CheckSquare, label: 'Attendance Management', path: '/attendance' },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance/students' },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in' },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments' },
    { icon: FileText, label: 'Marked Scripts', path: '/assessments/marked-scripts' },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis' },
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub' },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab' },
    { icon: Library, label: 'Library & E-Resources', path: '/library' },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory' },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees' },
    { icon: FileText, label: 'Report Cards', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const activePath = location.pathname;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <aside className={cn(
        "hidden md:flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 z-30",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
                M
              </div>
              <div>
                <h1 className="font-black text-white text-sm tracking-wide">MUNYAKA</h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">School Portal</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 ml-auto rounded-xl"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
            return (
              <NavLink
                key={idx}
                to={item.path}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} className={cn("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shrink-0" />
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-slate-700">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">{user?.role || 'Staff'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-8 w-8"
                  title="Logout"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-9 w-9"
                title="Logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between md:hidden z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <h1 className="font-black text-white text-sm">MUNYAKA</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
