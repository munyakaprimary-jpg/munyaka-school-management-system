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
import { isTeacherRole, isIctRole, isLibrarianRole, normalizeRole } from '@/utils/roleHelper';
import { roleHas, resolveRole, ROUTE_PERMISSIONS } from '@/rbac/permissionMatrix';

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
    { icon: Shield, label: 'Admin Dashboard', path: '/system-management', roles: ['admin'] },
    { icon: Gamepad2, label: 'Games', path: '/games', global: true },
    { icon: Database, label: 'Central Data & APK', path: '/central-data', roles: ['admin'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar'] },
    { icon: Layers, label: 'Grades & Streams', path: '/grades', roles: ['admin'] },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas', roles: ['admin', 'head_teacher'] },
    { icon: Award, label: 'Exam Types', path: '/exam-types', roles: ['admin', 'head_teacher'] },
    { icon: Contact2, label: 'Staff Management', path: '/staff', roles: ['admin', 'head_teacher'] },
    { icon: BookOpen, label: 'Subject Allocations', path: '/subject-allocations', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: School, label: 'Developer Hub / Tenants', path: '/dev/tenants', roles: ['owner', 'admin'] },
    { icon: CreditCard, label: 'Payment & Subscriptions', path: '/payment-management', roles: ['owner'] },
    { icon: User, label: 'Profile Settings', path: '/settings/profile', roles: ['admin', 'owner'] },
    { icon: MessageSquare, label: 'Communication', path: '/communication', roles: ['admin', 'head_teacher'] },
    { icon: MessageSquare, label: 'Teacher Communication', path: '/teacher-communication', roles: ['teacher', 'class_teacher', 'subject_teacher'] },
    { icon: Bell, label: 'Events & Notices', path: '/notices', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar', 'parent', 'student', 'ict_technician', 'ict_teacher'] },
    { icon: Clock, label: 'Timetable', path: '/timetable', roles: ['admin', 'super_admin'] },
    { icon: CheckSquare, label: 'Attendance Management', path: '/attendance', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: ClipboardCheck, label: 'Student Attendance', path: '/attendance/students', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in', roles: ['admin', 'teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'bursar', 'ict_technician', 'ict_teacher'] },
    { icon: Fingerprint, label: 'Staff Attendance', path: '/staff/attendance', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'bursar'],
      subItems: [
        { label: 'Check In/Out', path: '/staff/check-in' },
        { label: 'Monitor', path: '/staff/attendance-monitor', roles: ['admin'] }
      ]
    },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FileText, label: 'Marked Scripts', path: '/assessments/marked-scripts', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'parent', 'student'] },
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'student', 'ict_technician', 'ict_teacher'] },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab', roles: ['admin', 'ict_teacher', 'ict_technician'] },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'ict_technician', 'ict_teacher'] },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'student'] },
    { icon: Library, label: 'Library & E-Resources', path: '/library', roles: ['admin', 'librarian', 'library_teacher'] },
    { icon: BookOpen, label: 'Study Corner', path: '/study-corner', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'student', 'parent', 'librarian', 'library_teacher', 'ict_technician', 'ict_teacher'] },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent', 'teacher', 'class_teacher', 'subject_teacher'] },
    { icon: FileText, label: 'Report Cards', path: '/reports', roles: ['admin', 'head_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'parent', 'student'] },
    { icon: Shield, label: 'Admin Dashboard', path: '/system-management', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Data Harmonization Hub', path: '/admin/harmonization', roles: ['admin'] },
    { icon: FileText, label: 'Admin Harmonization Hub', path: '/admin-harmonization-hub', roles: ['admin'] },
    { icon: Contact2, label: 'Staff Management', path: '/staff', roles: ['admin', 'head_teacher'] },
    { icon: Archive, label: 'Transferred Archive', path: '/transferred-archive', roles: ['admin'] },
    { icon: ArrowUpCircle, label: 'Promote Students', path: '/promote-students', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'head_teacher', 'owner'] },
    { icon: Wifi, label: 'LAN Server Config', path: '/lan-server-config', roles: ['admin', 'owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'head_teacher'] },
    { icon: Wifi, label: 'Teacher LAN Config', path: '/teacher-lan-config', roles: ['teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'admin', 'owner'] },
  ];

  const filteredMenu = React.useMemo(() => {
    return menuItems;
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
          {/* Staff Management link block */}
          {filteredMenu.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
            const isStaffManagement = item.path === '/staff';
            return (
              <React.Fragment key={idx}>
                <NavLink
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

                {!isCollapsed && (item as any).subItems && isActive && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-3">
                    {(item as any).subItems.map((sub: any, sIdx: number) => {
                      const isSubActive = activePath === sub.path;
                      return (
                        <NavLink
                          key={sIdx}
                          to={sub.path}
                          className={cn(
                            "block py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors",
                            isSubActive ? "text-blue-400 bg-blue-500/10 font-bold" : "text-slate-400 hover:text-slate-200"
                          )}
                        >
                          {sub.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}

                {isStaffManagement && !isCollapsed && (
                  <Link className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" to="/subject-allocations">
                    <BookOpen className="w-5 h-5 text-indigo-500"/>
                    <span>Subject Allocations</span>
                  </Link>
                )}
              </React.Fragment>
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
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                title="Logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
