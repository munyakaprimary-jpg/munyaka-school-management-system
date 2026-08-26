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
  Keyboard,
  Target,
  Database,
  FlaskConical
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useMobileBackButton } from '@/hooks/useMobileBackButton';

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Attach Hardware Back Button Handling for Capacitor/Android
  useMobileBackButton(isOpen, () => setIsOpen(false));

  // Handle auto-hide bottom navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const currentScrollY = scrollContainerRef.current.scrollTop;
      
      // Don't trigger hide logic for tiny scrolls (debounce/threshold)
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        // Scrolling Down - Hide
        setShowBottomNav(false);
      } else {
        // Scrolling Up - Show
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

  // ============================================================
  // THIS IS THE SOURCE ARRAY THAT FEEDS THE RENDER LOOP
  // (filteredMenu = menuItems.filter(...))
  // ============================================================
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    // ---- CENTRAL DATA & APK - placed directly after Dashboard ----
    { icon: Database, label: 'Central Data & APK', path: '/central-data', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['super_admin', 'head_teacher'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['super_admin', 'head_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['super_admin', 'head_teacher'] },
    { icon: Contact2, label: 'Staff Directory', path: '/staff', roles: ['super_admin', 'head_teacher'] },
    { icon: Key, label: 'Staff Access Master', path: '/staff/pre-registration', roles: ['super_admin', 'head_teacher'] },
    { icon: UserCog, label: 'System Management', path: '/system-management', roles: ['super_admin'] },
    { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['super_admin'] },
    { icon: Bell, label: 'Notice Board', path: '/notices', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: CalendarDays, label: 'School Calendar', path: '/calendar', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Calendar, label: 'Timetable', path: '/timetable', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance', roles: ['super_admin', 'head_teacher', 'teacher'] },
    
    // Staff Attendance
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Activity, label: 'Attendance Monitor', path: '/staff/attendance-monitor', roles: ['super_admin', 'head_teacher'] },
    { icon: Clock, label: 'Attendance Management', path: '/staff/attendance', roles: ['super_admin', 'head_teacher'] },
    
    // Academic Assessment & Analysis
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    
    // Digital Hub & ICT
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub', roles: ['super_admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab', roles: ['super_admin', 'head_teacher'] },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies', roles: ['super_admin', 'head_teacher', 'teacher'] },
    
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['super_admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['super_admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['super_admin', 'head_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['super_admin', 'head_teacher', 'bursar', 'parent'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['super_admin', 'head_teacher'] },
    { icon: GraduationCap, label: 'Promote Students', path: '/promote', roles: ['super_admin', 'head_teacher'] },
  ];

  // This is the EXACT array mapped in the JSX below
  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  // Debug: verify Central Data & APK survives the filter
  if (typeof window !== 'undefined' && user) {
    const hasCentralData = filteredMenu.some(item => item.path === '/central-data');
    if (!hasCentralData) {
      console.warn('[Sidebar] Central Data & APK was filtered out!', { userRole: user.role, filteredMenu: filteredMenu.map(i => i.label) });
    }
  }

  // Bottom Navigation Bar Quick Links
  const bottomQuickNav = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: Users, label: 'Learners', path: '/students' },
    { icon: ClipboardCheck, label: 'Roll Call', path: '/attendance' },
    { icon: Wallet, label: 'Fees', path: '/fees' },
  ];

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950", isDarkMode ? "dark" : "")}>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-all duration-300 ease-in-out flex flex-col pt-safe pb-safe shadow-2xl lg:shadow-none",
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

        {/* Navigation List - maps over filteredMenu (derived from menuItems above) */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {filteredMenu.map((item) => {
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

          {/* HARDCODED SCIENCE LAB LINK - No role check, always visible */}
          <Link
            to="/science-lab"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group",
              location.pathname === '/science-lab'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:bg-indigo-600 dark:shadow-none"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            <FlaskConical size={20} className={cn(
              "shrink-0",
              location.pathname === '/science-lab' ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            )} />
            {!isCollapsed && <span className="truncate">Science Lab</span>}
          </Link>

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
        {/* Mobile & Desktop Header Bar */}
        <header className="h-16 pt-safe bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 print:hidden">
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

            {/* Title / Search */}
            <div className="flex items-center gap-2">
              <div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-100">
                M
              </div>
              <span className="lg:hidden font-black text-slate-900 dark:text-white text-sm tracking-tight">Munyaka Portal</span>
            </div>

            <div className="relative hidden md:block flex-1 max-md ml-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search learners, staff, grades..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-11 w-11 flex items-center justify-center active:scale-95"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
          </div>
        </header>

        {/* Dynamic Main Viewport */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar"
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Quick Navigation Bar (One-Thumb Nav) */}
        <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pb-safe pt-2 flex items-center justify-around z-40 shadow-2xl transition-transform duration-300 ease-in-out print:hidden",
          showBottomNav ? "translate-y-0" : "translate-y-full"
        )}>
          {bottomQuickNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] touch-active transition-all",
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400 font-black" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
                )}
              >
                <item.icon size={20} className={cn(isActive && "scale-110 transition-transform")} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] touch-active text-slate-400 font-bold hover:text-indigo-600"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Sidebar;