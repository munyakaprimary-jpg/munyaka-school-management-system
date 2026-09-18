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
  Bell,
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
  Laptop,
  Monitor,
  User,
  Keyboard,
  Target,
  Database,
  Fingerprint,
  CreditCard,
  Gamepad2,
  CheckSquare,
  LogIn,
  Shield,
  UserCheck,
  Archive,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useMobileBackButton } from '@/hooks/useMobileBackButton';
import { isTeacherRole, isIctRole, isLibrarianRole } from '@/utils/roleHelper';

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(isOpen, () => setIsOpen(false));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar', 'parent', 'student', 'owner', 'ict_teacher', 'ict_technician', 'librarian', 'library_teacher'] },
    { icon: Gamepad2, label: 'Games', path: '/games', global: true },
    { icon: Database, label: 'Central Data & APK', path: '/central-data', roles: ['admin'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar'] },
    { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['admin', 'head_teacher'] },
    { icon: Contact2, label: 'Staff Directory', path: '/staff', roles: ['admin', 'head_teacher'] },
    { icon: Key, label: 'Staff Access Master', path: '/staff/pre-registration', roles: ['admin', 'head_teacher'] },
    { icon: School, label: 'Developer Hub / Tenants', path: '/dev/tenants', roles: ['owner', 'admin'] },
    { icon: CreditCard, label: 'Payment & Subscriptions', path: '/payment-management', roles: ['owner'] },
    { icon: User, label: 'Profile Settings', path: '/settings/profile', roles: ['admin', 'owner'] },
    { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: Bell, label: 'Events & Notices', path: '/notices', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar', 'parent', 'student'] },
    { icon: Clock, label: 'Timetable', path: '/timetable', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'parent', 'student'] },
    { icon: CheckSquare, label: 'Attendance Management', path: '/attendance', roles: ['admin'] },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance/students', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in', roles: ['admin', 'teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'bursar'] },
    { icon: Fingerprint, label: 'Staff Attendance', path: '/staff/attendance', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar'],
      subItems: [
        { label: 'Check In/Out', path: '/staff/check-in' },
        { label: 'Monitor', path: '/staff/attendance-monitor', roles: ['admin'] }
      ]
    },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FileText, label: 'Marked Scripts', path: '/assessments/marked-scripts', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'parent', 'student'] },
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'student'] },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab', roles: ['admin', 'ict_teacher', 'ict_technician'] },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['admin', 'librarian', 'library_teacher'] },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['admin', 'head_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'parent', 'student'] },
    { icon: Shield, label: 'Admin Dashboard', path: '/system-management', roles: ['admin'] },
    { icon: UserCheck, label: 'Staff Access Master', path: '/staff/access', roles: ['admin'] },
    { icon: Archive, label: 'Transferred Archive', path: '/transferred-archive', roles: ['admin'] },
    { icon: ArrowUpCircle, label: 'Promote Students', path: '/promote-students', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher', 'owner'] },
  ];

  const filteredMenu = React.useMemo(() => {
    const userObj = (user || {}) as Record<string, any>;
    const role = (userObj.role ?? '') as string;
    const staffCategory = (userObj.staffCategory ?? '') as string;
    const specialties = userObj.specialties;
    const roleLower = String(role).toLowerCase();

    const dashboardItem = menuItems.find(item => item.path === '/');
    const isAdminRole = roleLower === 'admin' || roleLower === 'super_admin';

    if (isAdminRole) {
      return menuItems.filter(item => {
        const itemRoles = item?.roles ?? [];
        if (itemRoles.length > 0 && !itemRoles.includes('admin') && !itemRoles.includes('super_admin')) {
          return false;
        }
        return true;
      }).map(item => {
        if (item.path === '/') return { ...item, label: 'Admin Dashboard' };
        return item;
      });
    }

    if (roleLower === 'owner') {
      const roleFiltered = menuItems.filter(item => {
        if (item?.global) return true;
        return (item?.roles || []).map((r: string) => String(r).toLowerCase()).includes('owner');
      });
      const withDashboard = dashboardItem && !roleFiltered.includes(dashboardItem)
        ? [dashboardItem, ...roleFiltered]
        : roleFiltered;
      const order = [
        '/',
        '/dev/tenants',
        '/payment-management',
        '/games',
        '/settings/profile',
        '/settings',
      ];
      const ordered: typeof withDashboard = [];
      order.forEach(p => {
        const found = withDashboard.find((i: any) => i?.path === p);
        if (found && !ordered.includes(found)) ordered.push(found);
      });
      withDashboard.forEach((i: any) => {
        if (!ordered.includes(i)) ordered.push(i);
      });
      return ordered;
    }
      });
      return ordered;
    }

    if (roleLower === 'student' || roleLower === 'learner') {
      const learnerPaths = ['/', '/attendance/students', '/reports', '/fees', '/games'];
      const labels: Record<string, string> = {
        '/': 'Overview',
        '/attendance/students': 'Attendance',
        '/reports': 'Reports & Marksheets',
        '/fees': 'Fees',
        '/games': 'Games Hub',
      };
      const items = menuItems.filter(item => learnerPaths.includes(item.path));
      return learnerPaths.map(path => items.find(item => item?.path === path)).filter(Boolean).map((item: any) => ({
        ...item,
        label: labels[item?.path] || item?.label
      }));
    }

    // ── Flexible Teacher / Subject Teacher / Head Teacher Helper check ─────
    const rawRole = (user?.role || '').toUpperCase().trim();
    const isTeacher =
      rawRole.includes('TEACHER') ||
      rawRole.includes('INSTRUCTOR') ||
      rawRole === 'SUBJECT TEACHER' ||
      rawRole === 'CLASS TEACHER' ||
      isTeacherRole(role, staffCategory, specialties);

    if (isTeacher) {
      return menuItems.filter(item => {
        if (item?.global) return true;
        const itemRoles = (item?.roles || []).map((r: string) => String(r).toUpperCase());
        return (
          itemRoles.includes('TEACHER') ||
          itemRoles.includes('CLASS_TEACHER') ||
          itemRoles.includes('SUBJECT_TEACHER') ||
          itemRoles.includes('HEAD_TEACHER') ||
          itemRoles.includes('TEACHING')
        );
      }).map(item => {
        if (item?.path === '/') {
          return { ...item, label: "Teacher's Dashboard" };
        }
        return item;
      });
    }

    if (isIctRole(role, specialties)) {
      return menuItems.filter(item => {
        if (item?.path === '/' || item?.path === '/games' || item?.path === '/ict-lab') return true;
        return false;
      });
    }

    if (isLibrarianRole(role, specialties)) {
      return menuItems.filter(item => {
        if (item?.path === '/' || item?.path === '/games' || item?.path === '/library') return true;
        return false;
      });
    }

    return menuItems.filter(item => {
      if (item?.global) return true;
      return (item?.roles || []).map((r: string) => String(r).toLowerCase()).includes(roleLower);
    });
  }, [user]);

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
          {filteredMenu.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
            return (
              <div key={idx}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all group",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {!isCollapsed && item.subItems && isActive && (
                  <div className="ml-9 mt-1 space-y-1 border-l-2 border-blue-500/30 pl-3">
                    {item.subItems.map((sub: any, sIdx: number) => {
                      if (sub.roles && user) {
                        const r = String((user as any).role || '').toLowerCase();
                        if (!sub.roles.includes(r)) return null;
                      }
                      const isSubActive = activePath === sub.path;
                      return (
                        <Link
                          key={sIdx}
                          to={sub.path}
                          className={cn(
                            "block py-2 px-3 rounded-xl text-xs font-bold transition-all",
                            isSubActive ? "text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {!isCollapsed && user && (
            <div className="mb-3 px-3 py-2 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name || user.email}</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-rose-400 hover:text-white hover:bg-rose-600/20 font-bold text-sm transition-all",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <span className="font-black text-white text-sm">MUNYAKA</span>
          </div>
          <NotificationBell />
        </header>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div className="relative w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                    M
                  </div>
                  <div>
                    <h1 className="font-black text-white text-sm">MUNYAKA</h1>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">School Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                {filteredMenu.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
                  return (
                    <div key={idx}>
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                      >
                        <Icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
                        <span>{item.label}</span>
                      </Link>
                      {item.subItems && isActive && (
                        <div className="ml-9 mt-1 space-y-1 border-l-2 border-blue-500/30 pl-3">
                          {item.subItems.map((sub: any, sIdx: number) => {
                            if (sub.roles && user) {
                              const r = String((user as any).role || '').toLowerCase();
                              if (!sub.roles.includes(r)) return null;
                            }
                            const isSubActive = activePath === sub.path;
                            return (
                              <Link
                                key={sIdx}
                                to={sub.path}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  "block py-2 px-3 rounded-xl text-xs font-bold transition-all",
                                  isSubActive ? "text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-white"
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-rose-400 hover:bg-rose-600/20 font-bold text-sm transition-all justify-center"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
