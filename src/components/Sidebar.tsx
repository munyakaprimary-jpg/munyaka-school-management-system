"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Award,
  Contact2,
  Key,
  MessageSquare,
  Megaphone,
  CalendarDays,
  Calendar,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  BarChart3,
  FolderHeart,
  Library,
  Box,
  Wallet,
  FileText,
  Settings,
  School,
  Menu,
  Search,
  Activity,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  X,
  GraduationCap,
  LogIn,
  MoreHorizontal,
  Laptop,
  Monitor,
  UserCog,
  User,
  Keyboard,
  Target,
  Database,
  FlaskConical,
  Fingerprint,
  CreditCard,
  Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';
import { usePermissions } from '@/hooks/usePermissions';

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const { canAccessSystemManagement } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(isOpen, () => setIsOpen(false));

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      lastScrollY.current = currentScrollY;
    };
    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setShowBottomNav(true), [location.pathname]);

  const menuItems = [
    // ── Dashboard — position #1 for ALL roles; router delegates to their view ──
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student', 'owner'] },
    { icon: Gamepad2, label: 'Games', path: '/games', global: true },
    { icon: Database, label: 'Central Data & APK', path: '/central-data', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student', 'owner'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['admin', 'head_teacher'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['admin', 'head_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['admin', 'head_teacher'] },
    { icon: Contact2, label: 'Staff Directory', path: '/staff', roles: ['admin', 'head_teacher'] },
    { icon: Key, label: 'Staff Access Master', path: '/staff/pre-registration', roles: ['admin', 'head_teacher'] },
    { icon: UserCog, label: 'System Management', path: '/system-management', roles: ['admin', 'owner'], requiresPermission: 'manage_ict_systems' },
    { icon: CreditCard, label: 'Payment & Subscriptions', path: '/payment-management', roles: ['admin', 'owner'] },
    { icon: User, label: 'Profile Settings', path: '/settings/profile', roles: ['admin', 'owner'] },
    { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['admin'] },
    { icon: Bell, label: 'Events & Notices', path: '/notices', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: Calendar, label: 'Timetable', path: '/timetable', roles: ['admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance', roles: ['admin', 'head_teacher', 'teacher'] },
    { icon: Fingerprint, label: 'Staff Attendance', path: '/staff/attendance', roles: ['admin', 'head_teacher', 'teacher', 'bursar'],
      subItems: [
        { label: 'Check In/Out', path: '/staff/check-in' },
        { label: 'Monitor', path: '/staff/attendance-monitor' }
      ]
    },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['admin', 'head_teacher', 'teacher'] },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis', roles: ['admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub', roles: ['admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab', roles: ['admin', 'head_teacher'] },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills', roles: ['admin', 'head_teacher', 'teacher'] },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies', roles: ['admin', 'head_teacher', 'teacher'] },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['admin', 'head_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher'] },
    { icon: GraduationCap, label: 'Promote Students', path: '/promote', roles: ['admin', 'head_teacher'] },
  ];

  const filteredMenu = React.useMemo(() => {
    if (!user) return [];
    const role = user.role ?? '';
    const roleLower = role.toLowerCase();

    // ── Dashboard is ALWAYS first for every authenticated user ─────────────────
    // The Dashboard item is the single navigation entry point that routes
    // to the user's role-specific view (/).  It must appear regardless of
    // role so the owner always has a way to reach OwnerDashboard.
    // The remaining items are then filtered by role below.
    const dashboardItem = menuItems.find(item => item.path === '/');

    // ADMIN (and legacy super_admin alias) always sees every sidebar item.
    if (roleLower === 'admin' || roleLower === 'super_admin') {
      return menuItems.filter(item => {
        if (item.requiresPermission) return canAccessSystemManagement();
        return true;
      });
    }

    // OWNER is billing-only — gets Dashboard + Payment & Subscriptions +
    // Central Data + Profile Settings, plus global items (Games Hub).
    if (roleLower === 'owner') {
      const roleFiltered = menuItems.filter(item => {
        if (item.global) return true;
        if (item.requiresPermission) return canAccessSystemManagement();
        return item.roles.map(r => r.toLowerCase()).includes('owner');
      });
      // Ensure Dashboard is always present.
      const withDashboard = dashboardItem && !roleFiltered.includes(dashboardItem)
        ? [dashboardItem, ...roleFiltered]
        : roleFiltered;
      // Enforce the explicit owner render order:
      //   1. Dashboard
      //   2. Payment & Subscriptions
      //   3. Games Hub (global)
      //   4. Central Data & APK
      //   5. Profile Settings
      const order = [
        '/',                       // Dashboard
        '/payment-management',     // Payment & Subscriptions
        '/games',                  // Games Hub (global)
        '/central-data',           // Central Data & APK
        '/settings/profile',       // Profile Settings
      ];
      const ordered: typeof withDashboard = [];
      order.forEach(p => {
        const found = withDashboard.find((i: any) => i.path === p);
        if (found) ordered.push(found);
      });
      // Append anything that wasn't in the explicit order (defensive).
      withDashboard.forEach((i: any) => {
        if (!ordered.includes(i)) ordered.push(i);
      });
      return ordered;
    }

    return menuItems.filter(item => {
      // Global items are visible to every authenticated user.
      if (item.global) return true;
      // Check if user has the required role
      if (!item.roles.map(r => r.toLowerCase()).includes(roleLower)) return false;
      // Check if item requires a specific permission
      if (item.requiresPermission) {
        return canAccessSystemManagement();
      }
      return true;
    });
  }, [user?.role, canAccessSystemManagement]);

  const bottomQuickNav = [
    { icon: LayoutDashboard, label: 'Home', path: '/', roles: ['admin', 'owner', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: Users, label: 'Learners', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: ClipboardCheck, label: 'Roll Call', path: '/attendance', roles: ['admin', 'owner', 'head_teacher', 'teacher'] },
    { icon: Wallet, label: 'Fees', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent'] },
    { icon: CreditCard, label: 'Payments', path: '/payment-management', roles: ['admin', 'owner'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher'] },
    { icon: Key, label: 'Licensing', path: '/central-data', roles: ['admin', 'head_teacher'] },
    { icon: Database, label: 'Central', path: '/central-data', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: GraduationCap, label: 'Promote', path: '/promote', roles: ['admin', 'head_teacher'] },
    { icon: Gamepad2, label: 'Games', path: '/games', global: true },
  ].filter(item => {
    if (!user) return false;
    if (item.global) return true;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-all duration-300 ease-in-out flex flex-col pt-safe pb-safe shadow-2xl lg:shadow-none ${isCollapsed ? "w-20" : "w-72 md:w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 min-h-[64px]">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center shrink-0">
                <School size={22} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate">MUNYAKA</h1>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">Primary & JS</p>
              </div>
            </div>
          )}
          {isCollapsed && <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto"><School size={22} className="text-white" /></div>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 min-h-[44px] min-w-[44px] items-center justify-center" aria-label="Collapse sidebar">
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95" aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {filteredMenu.map((item: any) => {
            const isActive = location.pathname === item.path || (item.subItems && item.subItems.some((sub: any) => location.pathname === sub.path));
            const hasSubItems = item.subItems && item.subItems.length > 0;
            return (
              <div key={item.path} className="space-y-1">
                <Link to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
                  <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0"} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {!isCollapsed && hasSubItems && (
                  <div className="pl-9 pr-2 space-y-1 py-1">
                    {item.subItems.map((sub: any) => {
                      const isSubActive = location.pathname === sub.path;
                      return <Link key={sub.path} to={sub.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${isSubActive ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"}`}><span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" /><span className="truncate">{sub.label}</span></Link>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {(() => {
            const r = (user?.role ?? '').toLowerCase();
            const seesLab = ['admin', 'head_teacher', 'teacher'].includes(r);
            if (!seesLab) return null;
            return (
              <Link to="/science-lab" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group ${location.pathname === '/science-lab' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
                <FlaskConical size={20} className={location.pathname === '/science-lab' ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0"} />
                {!isCollapsed && <span className="truncate">Science Lab</span>}
              </Link>
            );
          })()}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link to="/profile" onClick={() => setIsOpen(false)} className="shrink-0 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-100">{user?.avatar || user?.name?.substring(0, 2).toUpperCase() || 'AD'}</div>
              </Link>
              {!isCollapsed && <div className="overflow-hidden flex-1"><Link to="/profile" onClick={() => setIsOpen(false)}><p className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors dark:text-white">{user?.name || 'Admin'}</p></Link><p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">{user?.role?.replace('_', ' ') || 'Administrator'}</p></div>}
              {!isCollapsed && (
                <Link
                  to="/settings/profile"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors shrink-0"
                  title="Profile Settings"
                >
                  <Settings size={15} />
                </Link>
              )}
            </div>
            {!isCollapsed && <div className="flex gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700"><Button variant="ghost" size="sm" onClick={logout} className="w-full justify-center gap-2 rounded-xl h-9 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut size={14} /> Log Out</Button></div>}
          </div>
        </div>
      </aside>
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-72 md:lg:ml-64"}`}>
        <header className="h-16 pt-safe bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl h-11 w-11 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95" onClick={() => setIsOpen(true)} aria-label="Open menu"><Menu size={22} /></Button>
            <div className="flex items-center gap-2"><div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-100">M</div><span className="lg:hidden font-black text-slate-900 dark:text-white text-sm tracking-tight">Munyaka Portal</span></div>
            <div className="relative hidden md:block flex-1 max-md ml-4"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search learners, staff, grades..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all dark:text-white" /></div>
          </div>
          <div className="flex items-center gap-2"><NotificationBell /><button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-11 w-11 flex items-center justify-center active:scale-95" aria-label="Toggle theme">{isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}</button></div>
        </header>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar"><div className="max-w-7xl mx-auto w-full">{children}</div></div>
        <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pb-safe pt-2 z-40 shadow-2xl transition-transform duration-300 ease-in-out print:hidden",
          showBottomNav ? "translate-y-0" : "translate-y-full"
        )}>
          {bottomQuickNav.length > 0 ? (
            <div className="flex items-stretch justify-between gap-1 px-1">
              {bottomQuickNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-1 rounded-2xl flex-1 min-h-[52px] max-w-[80px] touch-active transition-all duration-200 ease-out",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon size={20} className={cn("transition-transform duration-200", isActive && "scale-110")} />
                    <span className="text-[9px] mt-1 tracking-tight leading-tight text-center line-clamp-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-3 px-1">
              <span className="text-xs text-slate-400 font-medium">No navigation available</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;