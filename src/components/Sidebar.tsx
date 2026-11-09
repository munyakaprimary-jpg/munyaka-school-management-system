import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Award,
  Clock,
  CheckSquare,
  ClipboardCheck,
  LogIn,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Laptop,
  Monitor,
  Library,
  Box,
  Wallet,
  ShieldCheck,
  UserCheck,
  Settings,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wifi,
  Lock,
  FlaskConical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: string[];
}

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setRefreshCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(false, () => {});

  useEffect(() => {
    const handleStorageUpdate = () => {
      setRefreshCount(c => c + 1);
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('munyaka_rbac_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('munyaka_rbac_updated', handleStorageUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [currentStaff, setCurrentStaff] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_staff') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleSessionChange = () => {
      try {
        setCurrentStaff(JSON.parse(localStorage.getItem('munyaka_current_staff') || '{}'));
      } catch (e) {}
    };

    window.addEventListener('staff_session_updated', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('munyaka_rbac_updated', handleSessionChange);
    return () => {
      window.removeEventListener('staff_session_updated', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('munyaka_rbac_updated', handleSessionChange);
    };
  }, []);

  // Dynamically fetch active registered user profile
  const getActiveUserRole = () => {
    if (!user) return 'STAFF';

    const registeredUsers = JSON.parse(localStorage.getItem('munyaka_user_accounts') || '[]');
    const staffRegistry = JSON.parse(localStorage.getItem('munyaka_staff_registry') || '[]');

    const match = registeredUsers.find((u: any) =>
      (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
      (u.username && user.name && u.username.toLowerCase() === user.name.toLowerCase()) ||
      (u.name && user.name && u.name.toLowerCase() === user.name.toLowerCase())
    ) || staffRegistry.find((s: any) =>
      (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
      (s.name && user.name && s.name.toLowerCase() === user.name.toLowerCase())
    );

    return match?.role || match?.assignedRole || user.role || 'STAFF';
  };

  const activeRole = getActiveUserRole();
  const displayName = currentStaff.name || currentStaff.fullName || user?.name || (user as any)?.username || 'Staff Member';
  const profileName = displayName;
  const profileRole = activeRole;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const navigationItems: NavItem[] = [
    { name: 'Home / Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ['all'] },
    { name: 'Admin Dashboard', href: '/system-management', icon: ShieldCheck, allowedRoles: ['all'] },
    { name: 'Library Workstation', href: '/library', icon: Library, allowedRoles: ['all'] },
    { name: 'Academic CBC Portal', href: '/academics', icon: BookOpen, allowedRoles: ['all'] },
    { name: 'Staff Directory', href: '/staff-registry', icon: UserCheck, allowedRoles: ['all'] },
    { name: 'Financials & Fees', href: '/fees', icon: Wallet, allowedRoles: ['all'] },
    { name: 'Learners', href: '/learners', icon: Users, allowedRoles: ['all'] },
    { name: 'Teacher LAN Config', href: '/teacher-lan-config', icon: Wifi, allowedRoles: ['all'] },
    { name: 'Games Hub', href: '/games', icon: Gamepad2, allowedRoles: ['all'] },
    { name: 'Grades & Streams', href: '/grades', icon: Layers, allowedRoles: ['all'] },
    { name: 'Timetable', href: '/timetable', icon: Clock, allowedRoles: ['all'] },
    { name: 'Attendance Management', href: '/attendance', icon: CheckSquare, allowedRoles: ['all'] },
    { name: 'Daily Check-In', href: '/staff/check-in', icon: LogIn, allowedRoles: ['all'] },
    { name: 'Enter Marks', href: '/assessments', icon: FileSpreadsheet, allowedRoles: ['all'] },
    { name: 'Results Analysis', href: '/analysis', icon: BarChart3, allowedRoles: ['all'] },
    { name: 'Digital Hub', href: '/digital-hub', icon: Laptop, allowedRoles: ['all'] },
    { name: 'Science Lab Workstation', href: '/science-lab', icon: FlaskConical, allowedRoles: ['all'] },
    { name: 'ICT Lab & Devices', href: '/ict-lab', icon: Monitor, allowedRoles: ['all'] },
    { name: 'Tools & Inventory', href: '/inventory', icon: Box, allowedRoles: ['all'] },
    { name: 'Report Cards', href: '/reports', icon: FileText, allowedRoles: ['all'] },
    { name: 'Settings', href: '/settings', icon: Settings, allowedRoles: ['all'] },
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
          {navigationItems.map((item, idx) => {
            const Icon = item.icon;
            const isAllowed = item.allowedRoles.includes('all') || 
                              item.allowedRoles.some(r => activeRole.includes(r.toLowerCase()) || activeRole === r.toLowerCase());
            const isActive = activePath === item.href || (item.href !== '/' && activePath.startsWith(item.href));

            if (isAllowed) {
              return (
                <NavLink
                  key={idx}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon size={20} className={cn("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                  {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
                  {isActive && !isCollapsed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shrink-0" />
                  )}
                </NavLink>
              );
            }

            if (isCollapsed) {
              return (
                <div
                  key={idx}
                  title={`Restricted: Outside your workstation role (${item.name})`}
                  className="flex items-center justify-center p-3 rounded-xl text-slate-600 bg-slate-900/40 cursor-not-allowed select-none opacity-60"
                >
                  <Icon size={20} className="text-slate-600 shrink-0" />
                </div>
              );
            }

            return (
              <div
                key={idx}
                title="Restricted: Outside your workstation role"
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-500 bg-slate-900/50 cursor-not-allowed select-none border border-slate-800/40"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon size={20} className="text-slate-600 shrink-0" />
                  <span className="line-through truncate text-slate-500 font-medium text-sm">{item.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-semibold shrink-0 flex items-center gap-1 border border-slate-700/50">
                  <Lock size={10} /> Locked
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-500/30">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-200 truncate">{profileName}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {profileRole}
                  </span>
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
