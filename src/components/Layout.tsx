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
  Calendar,
  ClipboardCheck,
  ClipboardList,
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
  Bell,
  LogOut,
    UserCheck,
    Activity,
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
  Keyboard,
  Target,
  Database,
  CreditCard,
  Archive,
  Gamepad2,
  Server,
  Wifi,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useMobileBackButton } from '@/hooks/useMobileBackButton';
import { useLanSync } from '@/hooks/useLanSync';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
    const { connectionStatus, isConnected } = useLanSync();
    const location = useLocation();
    const navigate = useNavigate();

    // Attach Hardware Back Button Handling for Capacitor/Android
    useMobileBackButton(isOpen, () => setIsOpen(false));

  // Remove any stray hash-like tokens that might be leaking into the DOM
  useEffect(() => {
    const hideTokenElements = () => {
      const regex = /^[a-fA-F0-9]{40,}$/;
      document.querySelectorAll('div, span, p, code').forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (regex.test(text) && text.length > 40) {
          (el as HTMLElement).style.display = 'none';
        }
      });
    };
    hideTokenElements();
    const timer = setTimeout(hideTokenElements, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle auto-hide bottom navigation on scroll
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
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Ensure nav is visible when changing routes
  useEffect(() => {
    setShowBottomNav(true);
  }, [location.pathname]);

  const menuItems = [
    // ── Dashboard — position #1 for ALL roles; the Dashboard component
    // internally routes to OwnerDashboard / AdminDashboard / TeacherDashboard
    // based on the user's session role.  Only one Dashboard entry exists.
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar', 'parent', 'student', 'owner'] },
    { icon: ShieldCheck, label: 'Data Harmonization Hub', path: '/admin/harmonization', roles: ['admin'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar'] },
        { icon: UserCheck, label: 'Staff Registry', path: '/staff-registry', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar'] },
    { icon: Gamepad2, label: 'Games Hub', path: '/games', global: true },
        { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['admin', 'head_teacher'] },
    { icon: Archive, label: 'Transferred Archive', path: '/learners/archive', roles: ['admin'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['admin', 'head_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['admin', 'head_teacher'] },
    { icon: School, label: 'Tenants / Campuses', path: '/dev/tenants', roles: ['owner', 'admin'] },
    { icon: Wifi, label: 'LAN Server Config', path: '/lan-config', roles: ['owner'] },
    { icon: CreditCard, label: 'Payment & Subscriptions', path: '/payment-management', roles: ['owner'] },
        { icon: Server, label: 'Admin Control Center', path: '/admin/control-center', roles: ['admin'] },
        { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['admin', 'head_teacher'] },
        { icon: MessageSquare, label: 'Teacher Communication', path: '/teacher-communication', roles: ['teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar', 'parent', 'student', 'ict_technician', 'ict_teacher'] },
    { icon: Calendar, label: 'Timetable', path: '/timetable', roles: ['admin', 'super_admin'] },
        { icon: Database, label: 'Central Data & APK', path: '/central-data', roles: ['admin'] },
        { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    // Staff Attendance
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar', 'ict_technician', 'ict_teacher'] },
    { icon: Activity, label: 'Attendance Monitor', path: '/staff/attendance-monitor', roles: ['admin', 'head_teacher'] },
    { icon: Clock, label: 'Attendance Management', path: '/staff/attendance', roles: ['admin', 'head_teacher'] },
    // Academic Assessment & Analysis
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'parent', 'student'] },
    // Assessments & Exams
    { icon: ClipboardList, label: 'Assessments & Exams', path: '', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student'], section: true },
    { icon: ClipboardCheck, label: 'Grading Review', path: '/grading', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: ClipboardList, label: 'Create Exam / Quiz', path: '/assessments/create', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: ClipboardList, label: 'Question Bank & Import', path: '/assessments/import', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: ClipboardList, label: 'Take Assessment', path: '/assessments/student', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student'] },
    { icon: ClipboardList, label: 'Grading & Marks', path: '/assessments/grading', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: ClipboardList, label: 'All Set Exams', path: '/assessments/list', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student'] },
    // Digital Hub & ICT
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student', 'ict_technician', 'ict_teacher'] },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab', roles: ['admin', 'head_teacher', 'ict_technician', 'ict_teacher'] },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'ict_technician', 'ict_teacher'] },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher'] },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student'] },
        { icon: BookOpen, label: 'Study Corner', path: '/study-corner', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'student', 'parent', 'librarian', 'ict_technician', 'ict_teacher'] },
        { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['admin', 'head_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['admin', 'head_teacher', 'bursar'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'parent', 'student'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher', 'owner'] },
        { icon: GraduationCap, label: 'Promote Students', path: '/promote', roles: ['admin', 'head_teacher'] },
      ];

  // Route-level role denylist: these roles are blocked even if listed in item.roles.
  // Used to enforce that OWNER cannot access administrative routes like /fees.
  // ADMIN is NEVER in a BLOCKED_ROUTES list — it is always allowed.
  const BLOCKED_ROUTES: Record<string, string[]> = {
        '/fees': ['owner', 'parent', 'student', 'teacher'],
        '/system-management': ['owner', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'],
        '/admin/control-center': ['owner'], // operational route — owner is billing-only
        '/admin-dashboard': ['owner', 'teacher', 'head_teacher', 'bursar', 'parent', 'student'],
              '/students': ['owner'],              // operational — owner cannot manage learners
        '/attendance': ['owner'],            // operational — owner cannot take roll call
              // '/settings': ['owner'],            // operational — owner has its own profile settings — REMOVED so owner can access Settings
                    '/central-data': ['owner', 'teacher', 'head_teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar', 'parent', 'student'], // admin-only
                                        '/staff': ['owner', 'teacher', 'head_teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'bursar', 'parent', 'student'], // admin-only
                                        '/payment-management': ['admin'],     // billing-only — admin cannot access billing console
                                        '/timetable': ['owner', 'teacher', 'head_teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'parent', 'student', 'bursar', 'ict_teacher', 'ict_technician', 'librarian', 'library_teacher'],
                  };

  const filteredMenu = menuItems.filter(item => {
        if (!user) return false;
        const role = user.role ?? '';
        const roleLower = role.toLowerCase();
  
        // Bypass role filtering for Study Corner
        if (item.path === '/study-corner') {
          return true;
        }
  
        // Global items are visible to every authenticated user.
        if (item.global) return true;

        // Check if user is a teacher or non-admin staff
        const isTeacherVariant = roleLower.includes('teacher') || roleLower.includes('educator') || roleLower === 'class_teacher' || roleLower === 'subject_teacher' || roleLower === 'senior_teacher';

        if (isTeacherVariant) {
                  const forbiddenTeacherPaths = [
                    '/central-data', '/grades', '/staff', '/learning-areas', '/exam-types',
                    '/system-management', '/staff/access',
                    '/transferred-archive', '/promote-students', '/admin/control-center',
                    '/dev/tenants', '/payment-management', '/staff/attendance-monitor',
                    '/timetable'
                  ];
          if (
            item.path === '/grades' ||
            forbiddenTeacherPaths.includes(item.path) ||
            (item.label.includes("Central Data") && item.path !== '/lan-config') ||
            item.label.includes("Grades & Streams") ||
            item.label.includes("Staff Directory") ||
            item.label.includes("Learning Areas") ||
            item.label.includes("Exam Types")
          ) {
            return false;
          }
        }

        const isIctVariant = roleLower.includes('ict_technician') || roleLower.includes('ict_teacher') || roleLower.includes('ict technician');
        if (isIctVariant) {
          const allowedIctPaths = [
            '/dashboard',
            '/notices',
            '/staff/check-in',
            '/digital-hub',
            '/digital-skills',
            '/ict-lab',
            '/lan-config',
            '/study-corner',
            '/games',
            '/settings'
          ];
          return allowedIctPaths.includes(item.path);
        }

        const isLibrarianVariant = roleLower.includes('librarian') || roleLower.includes('library');
        if (isLibrarianVariant) {
          const allowedLibrarianPaths = [
            '/dashboard',
            '/library',
            '/lan-config',
            '/study-corner',
            '/notices',
            '/staff/check-in',
            '/settings'
          ];
          return allowedLibrarianPaths.includes(item.path);
        }
  
        // ADMIN (and the legacy "super_admin" alias) always sees every sidebar item
        // EXCEPT owner-only items (e.g. Payment & Subscriptions).
        const isAdminRole = roleLower === 'admin' || roleLower === 'super_admin';
            if (isAdminRole) {
          // Exclude items that are strictly owner-only (roles = ['owner'] only).
          const itemRoles = item.roles ?? [];
          if (itemRoles.length > 0 && !itemRoles.includes('admin') && !itemRoles.includes('super_admin')) {
            return false;
          }
          return true;
        }

      // OWNER is billing-only — gets Dashboard + Payment & Subscriptions +
                  // plus global items (Games Hub).
      if (roleLower === 'owner') {
        return item.roles.map(r => r.toLowerCase()).includes('owner');
      }

      // Check if user has the required role
      const itemRoles = (item.roles || []).map(r => String(r).toLowerCase());
      const hasRoleMatch = itemRoles.includes(roleLower) ||
        ((roleLower === 'teacher' || roleLower === 'class_teacher' || roleLower === 'subject_teacher' || roleLower === 'senior_teacher') &&
         (itemRoles.includes('teacher') || itemRoles.includes('class_teacher') || itemRoles.includes('subject_teacher') || itemRoles.includes('senior_teacher')));
      
      if (!hasRoleMatch) return false;

      // Route-level denylist guard
      const blocked = BLOCKED_ROUTES[item.path];
      if (blocked && blocked.includes(role)) return false;

      return true;
    });

  // ── Dashboard enforcement for the OWNER role ───────────────────────────────
  // Guarantee that the owner always sees Dashboard as the first menu item,
  // regardless of the upstream filter result. This is a safety net so the
  // owner can never be locked out of their executive dashboard.
  const ownerNormalized = (user?.role ?? '').toLowerCase() === 'owner';
  const dashboardAlreadyInMenu = filteredMenu.some(
    (i) => i.path === '/' || i.path === '/dashboard',
  );
  const finalMenu: typeof filteredMenu =
    ownerNormalized && !dashboardAlreadyInMenu
      ? [menuItems.find((i) => i.path === '/dashboard')!, ...filteredMenu]
      : filteredMenu;

  // Relabel Dashboard for admin users — the Dashboard component internally
  // routes to AdminDashboard, but the sidebar label should reflect that.
  const isAdminRole = (user?.role ?? '').toLowerCase() === 'admin' || (user?.role ?? '').toLowerCase() === 'super_admin';
  const navMenu = isAdminRole
    ? finalMenu.map(item => item.path === '/dashboard' ? { ...item, label: 'Admin Dashboard' } : item)
    : finalMenu;

  // Bottom Navigation Bar Quick Links - Filtered by user role.
    // OWNER is BILLING-ONLY — gets Dashboard + Payments only (plus global Games Hub).
        // OWNER explicitly does NOT see: Learners, Roll Call, Fees, Server (control center),
        // Settings, Promote — those are operational routes. LAN Config is now nested
        // inside the Admin Control Center for elevated roles only.
    const bottomQuickNav = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'owner', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
      { icon: Users, label: 'Learners', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'bursar'] },
      { icon: ClipboardCheck, label: 'Roll Call', path: '/attendance', roles: ['admin', 'head_teacher', 'teacher'] },
      { icon: Wallet, label: 'Fees', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent'] },
      { icon: CreditCard, label: 'Payments', path: '/payment-management', roles: ['owner'] },
          { icon: Server, label: 'Server', path: '/admin/control-center', roles: ['admin'] },
      { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher'] },
            { icon: Database, label: 'Central', path: '/central-data', roles: ['admin'] },
            { icon: GraduationCap, label: 'Promote', path: '/promote', roles: ['admin', 'head_teacher'] },
            { icon: Gamepad2, label: 'Games', path: '/games', global: true },
                        { icon: BookOpen, label: 'Study', path: '/study-corner', roles: ['admin', 'head_teacher', 'teacher', 'student', 'parent', 'librarian'] },
                        { icon: Wifi, label: 'LAN Server', path: '/lan-config', roles: ['owner'] },
    ].filter(item => {
          if (!user) return false;
          if (item.global) return true;
          // Bypass role filtering for Study Corner
          if (item.path === '/study-corner') return true;
          const roleLower = user.role?.toLowerCase() ?? '';
          // Treat super_admin as admin for bottom-nav role matching
          const effectiveRole = roleLower === 'super_admin' ? 'admin' : roleLower;
          return item.roles.map(r => r.toLowerCase()).includes(effectiveRole);
            });

  return (
      <div className={cn("flex min-h-screen w-full bg-slate-50 dark:bg-slate-950", isDarkMode ? "dark" : "")}>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[70] transform transition-all duration-300 ease-in-out flex flex-col pt-safe pb-safe shadow-2xl lg:shadow-none",
        isCollapsed ? "w-20" : "w-72 md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 min-h-[64px]">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center shrink-0">
                <School className="text-white" size={22} />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate">MUNYAKA</h1>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">Primary & JS</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto">
              <School className="text-white" size={22} />
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="Collapse sidebar"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {navMenu.map((item) => {
            // Section header (non-clickable divider)
            if ((item as any).section) {
              if (isCollapsed) {
                return (
                  <div
                    key={`section-${item.label}`}
                    className="my-2 border-t border-slate-200 dark:border-slate-800"
                    aria-label={item.label}
                  />
                );
              }
              return (
                <div
                  key={`section-${item.label}`}
                  className="px-3 pt-4 pb-1.5 flex items-center gap-2"
                >
                  <item.icon size={14} className="text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {item.label}
                  </span>
                </div>
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                <item.icon size={20} className={cn(
                  "shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                )} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* ── Hardcoded LAN Config links for teacher roles ──
              Placed between Dashboard and Games Hub in the sidebar.
              Visible only to teacher-variant roles. */}
          {user && (() => {
            const roleLower = (user.role ?? '').toLowerCase();
            const isTeacherVariant =
              roleLower.includes('teacher') ||
              roleLower.includes('educator') ||
              roleLower === 'class_teacher' ||
              roleLower === 'subject_teacher' ||
              roleLower === 'senior_teacher';
            if (!isTeacherVariant) return null;

            const lanItems = [
                          { icon: Wifi, label: 'Teacher LAN Config', path: '/teacher-lan-config' },
                        ];

            return (
              <>
                {lanItems.map((lanItem) => {
                  const isActive = location.pathname === lanItem.path;
                  return (
                    <Link
                      key={lanItem.path}
                      to={lanItem.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group",
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                    >
                      <lanItem.icon size={20} className={cn(
                        "shrink-0",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      )} />
                      {!isCollapsed && <span className="truncate">{lanItem.label}</span>}
                    </Link>
                  );
                })}
              </>
            );
          })()}
        </nav>

        {/* User Account Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link to="/profile" onClick={() => setIsOpen(false)} className="shrink-0 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-100">
                  {user?.avatar || user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
              </Link>
              {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <p className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition-colors dark:text-white">{user?.name || 'Admin'}</p>
                  </Link>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">{user?.role?.replace('_', ' ') || 'Administrator'}</p>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="w-full justify-center gap-2 rounded-xl h-9 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut size={14} /> Log Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area - Updated with responsive margins to account for fixed sidebar */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-72 md:lg:ml-64"
      )}>
        {/* Mobile & Desktop Header Bar - stacks on mobile, row on sm+ */}
                <header className="min-h-16 pt-safe bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 lg:px-8 py-3 shrink-0 z-50 print:hidden relative">
                  <div className="flex items-center gap-3">
                    {/* Hamburger Button for Mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden rounded-2xl h-11 w-11 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95"
                      onClick={() => setIsOpen(true)}
                      aria-label="Open menu"
                    >
                      <Menu size={22} />
                    </Button>
        
                    {/* Title / Home */}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-100">
                        M
                      </div>
                      <span className="lg:hidden font-black text-slate-900 dark:text-white text-sm tracking-tight truncate">Munyaka Portal</span>
                      {location.pathname !== '/' && (
                        <button
                          onClick={() => navigate('/')}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                          aria-label="Go to home"
                        >
                          <Home size={16} />
                          <span>Home</span>
                        </button>
                      )}
                    </div>
                  </div>
        
                  <div className="flex items-center gap-2">
                    {/* Sticky Sync Button in Header */}
                    {(() => {
                      const att = (() => { try { return JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]').length; } catch { return 0; } })();
                      const marks = (() => { try { return JSON.parse(localStorage.getItem('marked_student_submissions') || '[]').length; } catch { return 0; } })();
                      const totalQueue = att + marks;
                      return (
                        <button
                          onClick={async () => {
                            const { processBatchSyncExport } = await import('@/hooks/useSyncQueue');
                            await processBatchSyncExport();
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5 shrink-0" />
                          <span>Sync ({totalQueue})</span>
                        </button>
                      );
                    })()}
                    <NotificationBell />
                    {(() => {
                      const hour = new Date().getHours();
                      let greeting = "Good morning";
                      if (hour >= 12 && hour < 17) {
                        greeting = "Good afternoon";
                      } else if (hour >= 17 || hour < 5) {
                        greeting = "Good evening";
                      }
                      
                      let rawName = user?.name || user?.role || "Admin";
                      if (/^(school|munyaka|portal|system)$/i.test(rawName.trim()) || rawName.length > 25) {
                        rawName = "Admin";
                      }
                      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

                      return (
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm whitespace-nowrap">
                          <span className="font-sans text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {greeting}, {displayName} 👋
                          </span>
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-11 w-11 flex items-center justify-center active:scale-95"
                      aria-label="Toggle theme"
                    >
                      {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
                    </button>
                    {/* LAN Server Connection Indicator - Visible only for owner; navigates to /lan-config */}
                    {(user?.role ?? '').toLowerCase() === 'owner' ? (
                      <Link
                        to="/lan-config"
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {isConnected ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-600 dark:text-emerald-400">LAN Connected</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="text-slate-400">Offline</span>
                          </>
                        )}
                      </Link>
                    ) : null}
                  </div>
                </header>

        {/* Dynamic Main Viewport - prevent horizontal clipping */}
                <div
                          ref={scrollContainerRef}
                          className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full p-4 sm:p-6 lg:p-8 pb-36 lg:pb-8 pb-safe custom-scrollbar"
                        >
                  <div className="max-w-7xl mx-auto w-full max-w-full overflow-x-hidden px-0 table-scroll-viewport">
                    {children}
          </div>
        </div>

        {/* Mobile Bottom Quick Navigation Bar (Role-Based One-Thumb Nav) - horizontally scrollable */}
        <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pb-safe pt-2 z-40 shadow-2xl transition-transform duration-300 ease-in-out print:hidden",
          showBottomNav ? "translate-y-0" : "translate-y-full"
        )}>
          {bottomQuickNav.length > 0 ? (
            <div className="flex items-stretch justify-start gap-1 px-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {bottomQuickNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-2 rounded-2xl min-h-[52px] min-w-[64px] shrink-0 snap-start touch-active transition-all duration-200 ease-out",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon size={20} className={cn("shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                    <span className="text-[10px] xs:text-xs mt-1 tracking-tight leading-tight text-center whitespace-normal break-words line-clamp-2 max-w-full px-0.5">{item.label}</span>
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

export default Layout;