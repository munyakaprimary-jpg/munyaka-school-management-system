"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  BookOpen, 
  Award, 
  Contact2, 
  MessageSquare, 
  Megaphone, 
  CalendarDays, 
  Calendar, 
  ClipboardCheck, 
  FileSpreadsheet, 
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
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  X,
  GraduationCap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['super_admin', 'head_teacher'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['super_admin', 'head_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['super_admin', 'head_teacher'] },
    { icon: Contact2, label: 'Staff & Personnel', path: '/staff', roles: ['super_admin', 'head_teacher'] },
    { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Megaphone, label: 'Notice Board', path: '/notices', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: CalendarDays, label: 'School Calendar', path: '/calendar', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Calendar, label: 'Timetable', path: '/timetable', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['super_admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['super_admin', 'head_teacher', 'teacher', 'student'] },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['super_admin', 'head_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['super_admin', 'head_teacher', 'bursar', 'parent'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['super_admin', 'head_teacher', 'teacher', 'parent', 'student'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['super_admin', 'head_teacher'] },
    { icon: GraduationCap, label: 'Promote Students', path: '/promote', roles: ['super_admin', 'head_teacher'] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className={cn("flex h-screen overflow-hidden", isDarkMode ? "dark" : "")}>
      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">MUNYAKA</h1>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Primary & JS</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto">
              <School className="text-white" size={20} />
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {filteredMenu.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                location.pathname === item.path 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:bg-indigo-700" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <item.icon size={18} className={cn(
                "shrink-0",
                location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              )} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Profile Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
            <div className="flex items-center gap-3 mb-2">
              <Link to="/profile" className="shrink-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity">
                  {user?.avatar || user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
              </Link>
              {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                  <Link to="/profile">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate hover:text-indigo-600 transition-colors">{user?.name || 'Admin'}</p>
                  </Link>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">{user?.role?.replace('_', ' ') || 'Administrator'}</p>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-2 rounded-xl h-8 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2",
                isCollapsed && "justify-center p-0"
              )}
            >
              <LogOut size={14} />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Quick search..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select className="hidden sm:block px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none">
              <option>Term 1 • 2024</option>
            </select>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-400" />}
            </button>

            <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell size={18} className="text-slate-400" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;