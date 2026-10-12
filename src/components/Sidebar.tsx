import React, { useState, useEffect, useRef } from 'react';
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
  Wifi,
  FlaskConical as Beaker
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [rbacVersion, setRbacVersion] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(false, () => {});

  // Listen for munyaka_data_changed event to re-render in real-time when RBAC settings are saved
  useEffect(() => {
    const handleDataChanged = () => {
      setRbacVersion(v => v + 1);
    };
    window.addEventListener('munyaka_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('munyaka_data_changed', handleDataChanged);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sessionUser = (user || {}) as any;
  const masterStaff = (() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_master_staff_list') || '[]');
    } catch {
      return [];
    }
  })();

  const currentLoginUser = (() => {
    try {
      const raw = localStorage.getItem('munyaka_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const fullProfile = currentLoginUser || masterStaff.find((s: any) =>
    (s.email && sessionUser.email && s.email.toLowerCase() === sessionUser.email.toLowerCase()) ||
    (s.id && sessionUser.id && s.id === sessionUser.id)
  ) || sessionUser;

  const isUserAdmin = String(fullProfile?.role || sessionUser?.role || '').toLowerCase() === 'admin' || 
                      String(fullProfile?.role || '').toLowerCase() === 'super_admin' || 
                      String(fullProfile?.role || '').toLowerCase() === 'owner' ||
                      String(fullProfile?.designation || '').toUpperCase() === 'ADMIN';

  // Resolve staff role against the 10 institutional roles:
  // ['ADMIN', 'HOI', 'DHOI', 'BURSAR', 'Class Teacher', 'Subject Teacher', 'ICT Teacher', 'Library Teacher', 'Lab Teacher', 'Store Keeper']
  const resolveRoleKey = (profile: any): string => {
    if (isUserAdmin) return 'ADMIN';
    const des = String(profile?.designation || profile?.specificRole || profile?.role || '').toUpperCase();
    if (des.includes('HOI') || des.includes('HEAD OF INSTITUTION') || des.includes('HEADTEACHER')) return 'HOI';
    if (des.includes('DHOI') || des.includes('DEPUTY')) return 'DHOI';
    if (des.includes('BURSAR') || des.includes('FINANCE') || des.includes('ACCOUNTANT')) return 'BURSAR';
    if (des.includes('CLASS') || des.includes('CLASS TEACHER')) return 'CLASS_TEACHER';
    if (des.includes('SUBJECT') || des.includes('SUBJECT TEACHER')) return 'SUBJECT_TEACHER';
    if (des.includes('ICT') || des.includes('COMPUTER')) return 'ICT_TEACHER';
    if (des.includes('LIBRARY') || des.includes('LIBRARIAN')) return 'LIBRARY_TEACHER';
    if (des.includes('LAB') || des.includes('SCIENCE')) return 'LAB_TEACHER';
    if (des.includes('STORE') || des.includes('KEEPER')) return 'STORE_KEEPER';
    if (des.includes('TEACHER')) return 'CLASS_TEACHER';
    return 'CLASS_TEACHER';
  };

  const activeRoleKey = resolveRoleKey(fullProfile);

  const displayRole =
    fullProfile?.assignedClass ||
    fullProfile?.designation ||
    sessionUser?.designation ||
    sessionUser?.role ||
    'Class Teacher';

  // Raw nav items mapped to permission keys
  const rawNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, permissionKey: 'dashboard' },
    {
      name: 'LAN Server Config',
      path: '/lan',
      icon: Wifi,
      permissionKey: 'dashboard'
    },
    { name: 'Students', path: '/students', icon: Users, permissionKey: 'admissions' },
    { name: 'Attendance Management', path: '/attendance', icon: CheckSquare, permissionKey: 'attendance' },
    { name: 'Enter Marks', path: '/assessments', icon: FileSpreadsheet, permissionKey: 'assessments' },
    { name: 'Fees & Finance', path: '/fees', icon: Wallet, permissionKey: 'fees' },
    { name: 'Science Lab Inventory', path: '/science-lab', icon: Beaker, permissionKey: 'science_lab' },
    { name: 'Library & E-Resources', path: '/library', icon: Library, permissionKey: 'library' },
    { name: 'Tools & Inventory', path: '/inventory', icon: Box, permissionKey: 'stores' },
    { name: 'Admin Dashboard', path: '/system-management', icon: Settings, permissionKey: 'settings' },
    { name: 'Data Harmonization Hub', path: '/admin/harmonization', icon: ShieldCheck, permissionKey: 'settings' },
    { name: 'Games Hub', path: '/games', icon: Gamepad2, permissionKey: 'dashboard' },
    { name: 'Grades & Streams', path: '/grades', icon: Layers, permissionKey: 'admissions' },
    { name: 'Learning Areas', path: '/learning-areas', icon: BookOpen, permissionKey: 'assessments' },
    { name: 'Exam Types', path: '/exam-types', icon: Award, permissionKey: 'assessments' },
    { name: 'Timetable', path: '/timetable', icon: Clock, permissionKey: 'dashboard' },
    { name: 'Student Attendance', path: '/attendance/students', icon: ClipboardCheck, permissionKey: 'attendance' },
    { name: 'Daily Check-In', path: '/staff/check-in', icon: LogIn, permissionKey: 'attendance' },
    { name: 'Marked Scripts', path: '/assessments/marked-scripts', icon: FileText, permissionKey: 'assessments' },
    { name: 'Results Analysis', path: '/analysis', icon: BarChart3, permissionKey: 'assessments' },
    { name: 'Digital Hub', path: '/digital-hub', icon: Laptop, permissionKey: 'dashboard' },
    { name: 'ICT Lab & Devices', path: '/ict-lab', icon: Monitor, permissionKey: 'science_lab' },
    { name: 'Report Cards', path: '/reports', icon: FileText, permissionKey: 'assessments' },
    { name: 'Settings', path: '/settings', icon: Settings, permissionKey: 'dashboard' }
  ];

  // Read RBAC config from munyaka_rbac_config
  const rbacConfig = (() => {
    try {
      const raw = localStorage.getItem('munyaka_rbac_config');
      if (raw) return JSON.parse(raw);
    } catch {}
    // Default matrix if not set
    return {
      ADMIN: ['dashboard', 'admissions', 'attendance', 'assessments', 'fees', 'science_lab', 'library', 'stores', 'settings'],
      HOI: ['dashboard', 'admissions', 'attendance', 'assessments', 'fees', 'science_lab', 'library', 'stores', 'settings'],
      DHOI: ['dashboard', 'admissions', 'attendance', 'assessments', 'fees', 'science_lab', 'library', 'stores'],
      BURSAR: ['dashboard', 'admissions', 'attendance', 'fees'],
      CLASS_TEACHER: ['dashboard', 'admissions', 'attendance', 'assessments', 'fees', 'library'],
      SUBJECT_TEACHER: ['dashboard', 'attendance', 'assessments', 'library'],
      ICT_TEACHER: ['dashboard', 'attendance', 'science_lab', 'library', 'stores'],
      LIBRARY_TEACHER: ['dashboard', 'attendance', 'library'],
      LAB_TEACHER: ['dashboard', 'attendance', 'science_lab'],
      STORE_KEEPER: ['dashboard', 'stores']
    };
  })();

  const allowedModules: string[] = rbacConfig[activeRoleKey] || ['dashboard', 'attendance', 'assessments'];

  const navItems = rawNavItems.filter(item => {
    if (isUserAdmin) return true;
    if (item.permissionKey === 'settings' && item.path === '/settings') return true; // Settings is always accessible for profile/preferences
    return allowedModules.includes(item.permissionKey);
  });

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
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isLan = item.path === '/lan';
            const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path)) || (isLan && (activePath.includes('lan') || window.location.hash.includes('lan')));
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={(e) => {
                  if (isLan) {
                    window.location.hash = '#/lan';
                  }
                }}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
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
                  <p className="text-[10px] text-blue-400 font-mono tracking-wide truncate">
                    {String(displayRole).toUpperCase()}
                  </p>
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
