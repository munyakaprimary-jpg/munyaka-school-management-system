"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardCheck, 
  FileSpreadsheet, 
  FileText,
  FolderHeart,
  Wallet,
  School,
  Menu,
  Search,
  Bell,
  Users,
  Settings,
  Calendar,
  Contact2,
  Megaphone,
  Box,
  Library,
  MessageSquare,
  CalendarDays,
  Layers,
  BookOpen,
  Award,
  LogOut
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
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
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#fbfcfd] overflow-hidden">
      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <School className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight leading-none text-slate-900">MUNYAKA</h1>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Primary & Junior</p>
            </div>
          </div>

          <nav className="space-y-1 h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
            {filteredMenu.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <item.icon size={16} className={cn(location.pathname === item.path ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4 border-t border-slate-50 bg-slate-50/30">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-600">
                {user?.avatar || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">{user?.role?.replace('_', ' ') || 'Guest'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-xl h-10 text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 p-3"
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
          
          <div className="px-1 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Term 1 • 2024</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs w-72 focus:ring-2 ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:bg-slate-50 h-9 w-9">
              <Bell size={18} />
            </Button>
            <div className="w-[1px] h-6 bg-slate-100 mx-1" />
            <Link to="/profile">
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900">{user?.name || 'Admin'}</p>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Master Control'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-600 shadow-sm">
                  {user?.avatar || 'AD'}
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#fbfcfd]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;