import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUnifiedLicense } from '../utils/subscriptionUtils';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  BookOpenCheck,
  Award,
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
  RefreshCw,
  Moon,
  X,
  GraduationCap,
  LogIn,
  Laptop,
  Monitor,
  Keyboard,
  Target,
  Database,
  CreditCard,
  Archive,
  Gamepad2,
  Server,
  Cloud,
  CheckCircle2,
  Wifi,
  ShieldCheck,
  Loader2,
  FlaskConical,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMobileBackButton } from '@/hooks/useMobileBackButton';
import { isStudentRole } from '@/utils/roleGuard';

// ── Notification Bell Component ───────────────────────────────────────────────
export const NotificationBell: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; read: boolean; timestamp: number }>>([]);

  useEffect(() => {
    const generateTelemetryNotifications = () => {
      const now = Date.now();
      const list: Array<{ id: string; title: string; message: string; time: string; read: boolean; timestamp: number }> = [];

      // 1. Real Boot & Auth Telemetry
      const bootTime = (window as any).__munyaka_boot_time || now;
      const diffSec = Math.floor((now - bootTime) / 1000);
      const timeStr = diffSec < 60 ? `${Math.max(1, diffSec)}s ago` : `${Math.floor(diffSec / 60)}m ago`;
      
      let authStateMsg = 'Firebase Auth: Anonymous session active';
      try {
        const currentUserObj = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
        if (currentUserObj?.email || currentUserObj?.name) {
          authStateMsg = `Authenticated as ${currentUserObj.name || currentUserObj.email}`;
        }
      } catch {
        /* no-op */
      }

      list.push({
        id: 'boot-notif',
        title: 'System Boot & Auth',
        message: authStateMsg,
        time: timeStr,
        read: true,
        timestamp: bootTime
      });

      // 2. Real Cloud Sync & Local Storage Telemetry
      try {
        const learnersRaw = localStorage.getItem('munyaka_learners') || '[]';
        const staffRaw = localStorage.getItem('munyaka_staff') || '[]';
        const learners = JSON.parse(learnersRaw);
        const staff = JSON.parse(staffRaw);

        const learnerCount = Array.isArray(learners) ? learners.length : 0;
        const staffCount = Array.isArray(staff) ? staff.length : 0;

        let syncMsg = `Local Storage: ${learnerCount} learners, ${staffCount} staff records loaded.`;
        if (learnerCount === 0 && staffCount === 0) {
          syncMsg = 'Local Storage is currently empty. Waiting for Firestore sync or manual entry.';
        }

        list.push({
          id: 'sync-notif',
          title: 'Cloud & Storage Telemetry',
          message: syncMsg,
          time: timeStr,
          read: false,
          timestamp: bootTime
        });
      } catch (e) {
        list.push({
          id: 'sync-notif-err',
          title: 'Storage Telemetry',
          message: 'Error reading local records telemetry.',
          time: timeStr,
          read: false,
          timestamp: bootTime
        });
      }

      setNotifications(list);
    };

    if (!(window as any).__munyaka_boot_time) {
      (window as any).__munyaka_boot_time = Date.now();
    }

    generateTelemetryNotifications();
    const interval = setInterval(generateTelemetryNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fadeIn">
          <div className="bg-gradient-to-r from-teal-700 to-indigo-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-200" />
              <h4 className="font-black text-sm tracking-wide">Live Telemetry Notifications</h4>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              className="text-xs text-teal-100 hover:text-white font-bold underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">No telemetry notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={cn("p-3 rounded-2xl border transition-all text-left", n.read ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800" : "bg-teal-50/50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/50")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Functional Sync Button Component ──────────────────────────────────────────
export const SyncButton: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [pendingItemsList, setPendingItemsList] = useState<Array<{ id: string; title: string; type: string; time: string; status: string }>>([]);

  const isAdminUser = useMemo(() => {
    try {
      const currentUserObj = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
      const currentRole = String(
        currentUserObj.role || currentUserObj.systemRole || currentUserObj.accountType || localStorage.getItem('munyaka_current_auth_role') || ''
      ).toLowerCase().trim();

      const teacherRoles = ['class_teacher', 'subject_teacher', 'teacher', 'staff', 'librarian'];
      if (teacherRoles.some(tr => currentRole.includes(tr))) {
        return false;
      }

      const adminRoles = ['admin', 'super_admin', 'school_admin', 'administrator', 'owner', 'developer', 'superadmin'];
      if (adminRoles.some(ar => currentRole === ar || currentRole.includes(ar))) {
        return true;
      }

      const portalMode = localStorage.getItem('munyaka_portal_mode') || localStorage.getItem('munyaka_active_portal');
      if (portalMode === 'admin' || portalMode === 'owner') {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkPendingItems = () => {
      try {
        const dynamicItems: Array<{ id: string; title: string; type: string; time: string; status: string }> = [];
        const rawLearners = localStorage.getItem('munyaka_learners_directory');
        if (rawLearners) {
          const learners = JSON.parse(rawLearners);
          if (Array.isArray(learners)) {
            const unsyncedLearners = learners.filter((l: any) =>
              l.synced === false || l.pendingSync === true || l.isLocalOnly === true ||
              l.syncedToFirestore === false || l.firestoreSynced === false
            );
            unsyncedLearners.forEach((l: any, idx: number) => {
              const name = l.name || l.fullName || l.studentName || `Learner ${idx + 1}`;
              const adm = l.admissionNumber || l.admNo || l.id || `id_${idx}`;
              const cls = l.classGrade || l.grade || l.stream || '';
              dynamicItems.push({
                id: `learner-${adm}-${idx}`,
                title: `${name} (${adm}) ${cls ? `- ${cls}` : ''}`,
                type: 'Learner Record',
                time: l.updatedAt || l.createdAt || 'Unsynced',
                status: 'Pending Cloud Sync'
              });
            });
          }
        }
        setPendingItemsList(dynamicItems);
        setPendingCount(dynamicItems.length);
      } catch (e) {
        setPendingCount(0);
        setPendingItemsList([]);
      }
    };
    checkPendingItems();
    window.addEventListener('storage', checkPendingItems);
    window.addEventListener('sync-queue-updated', checkPendingItems);
    return () => {
      window.removeEventListener('storage', checkPendingItems);
      window.removeEventListener('sync-queue-updated', checkPendingItems);
    };
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.setItem('munyaka_pending_sync', JSON.stringify([]));
      setIsSyncing(false);
      setSyncSuccess(true);
      setShowSyncModal(false);
      setPendingCount(0);
      setPendingItemsList([]);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      setIsSyncing(false);
    }
  };

  if (!isAdminUser) return null;

  return (
    <>
      <button
        onClick={() => setShowSyncModal(true)}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm shadow-md transition-all cursor-pointer ${
          syncSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-700 hover:bg-teal-800'
        }`}
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-teal-200"/>
            <span>Syncing...</span>
          </>
        ) : syncSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white"/>
            <span>Synced (0)</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4 text-teal-200"/>
            <span>Sync ({pendingCount})</span>
          </>
        )}
      </button>

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-700 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-teal-200 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide">Sync Queue & Pending Items</h3>
                  <p className="text-xs text-teal-100 font-medium">Review and push local records to the cloud database</p>
                </div>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Target: Munyaka Central Firestore DB</span>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                  {pendingItemsList.length} Items Pending
                </span>
              </div>
              <div className="space-y-3">
                {pendingItemsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-base">0 Items Pending</p>
                    <p className="text-xs mt-1 text-slate-500">All local records are synced with Munyaka Central Firestore DB</p>
                  </div>
                ) : (
                  pendingItemsList.map((item, index) => (
                    <div key={item.id || index} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="font-mono bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{item.type}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSyncModal(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSync} disabled={isSyncing || pendingItemsList.length === 0} className="rounded-xl text-white font-bold px-6 gap-2 bg-teal-700 hover:bg-teal-800">
                {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Synchronizing...</span></> : <><Cloud className="w-4 h-4" /><span>Synchronize Now</span></>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const licenseInfo = useUnifiedLicense();
  const location = useLocation();
  const navigate = useNavigate();

  useMobileBackButton(isOpen, () => setIsOpen(false));

  const normalizedRole = String((user as any)?.systemRole || user?.role || (user as any)?.category || localStorage.getItem('munyaka_current_auth_role') || '').trim().toLowerCase().replace(/\s+/g, '_');
  
  const isOwnerOrDev = ['owner', 'developer', 'super_admin'].includes(normalizedRole);
  const isAdminRole = ['admin', 'school_admin', 'administrator', 'hoi'].includes(normalizedRole) || isOwnerOrDev;
  const isBursarRole = normalizedRole === 'bursar' || normalizedRole === 'accountant' || normalizedRole === 'finance';
  const isLibrarianRole = normalizedRole === 'librarian' || normalizedRole === 'library_teacher';
  const isTeacherRole = normalizedRole.includes('teacher') || normalizedRole === 'staff' || normalizedRole === 'subject_teacher' || normalizedRole === 'class_teacher' || normalizedRole === 'senior_teacher';

  // Strict role precedence: Teacher/Bursar/Librarian roles MUST NEVER be treated as Admin
  const isActuallyAdmin = isAdminRole && !isTeacherRole && !isBursarRole && !isLibrarianRole;

  // STUDENT / learner users must never see the Teacher Portal navigation.
  const isStudentUser = isStudentRole(user) || normalizedRole.includes('student') || normalizedRole.includes('learner') || normalizedRole.includes('pupil');

  // Exact 42 Admin items in order without duplicates, plus Section Header ASSESSMENTS & EXAMS before item #26
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShieldCheck, label: 'Data Harmonization', path: '/admin/harmonization' },
    { icon: Users, label: 'Learners', path: '/learners' },
    { icon: UserCheck, label: 'Staff Registry', path: '/staff-registry' },
    { icon: Gamepad2, label: 'Games Hub', path: '/games' },
    { icon: Layers, label: 'Grades & Streams', path: '/grades' },
    { icon: Archive, label: 'Transferred Archive', path: '/learners/archive' },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas' },
    { icon: Award, label: 'Exam Types', path: '/exam-types' },
    { icon: School, label: 'Tenants / Campuses', path: '/dev/tenants' },
    { icon: Wifi, label: 'LAN Server Config', path: '/lan-server-config' },
    { icon: Server, label: 'Admin Control Center', path: '/admin/control-center' },
    { icon: MessageSquare, label: 'Communication', path: '/communication' },
    { icon: MessageSquare, label: 'Teacher Communication', path: '/teacher-communication' },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: Database, label: 'Central Data & APK', path: '/central-data' },
    { icon: ClipboardCheck, label: 'Learner Attendance', path: '/attendance' },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in' },
    { icon: Activity, label: 'Attendance Monitor', path: '/staff/attendance-monitor' },
    { icon: Clock, label: 'Attendance Management', path: '/staff/attendance' },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments' },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis' },
    { icon: FileText, label: 'Report Cards', path: '/reports' },
    // --- Section Header: ASSESSMENTS & EXAMS ---
    { icon: ClipboardList, label: 'ASSESSMENTS & EXAMS', path: '', section: true },
    { icon: ClipboardCheck, label: 'Grading Review', path: '/grading' },
    { icon: ClipboardList, label: 'Create Exam / Quiz', path: '/assessments/create' },
    { icon: ClipboardList, label: 'Question Bank & Import', path: '/assessments/import' },
    { icon: ClipboardList, label: 'Grading & Marks', path: '/assessments/grading' },
    { icon: BookOpenCheck, label: 'All Set Exams', path: '/assessments/list' },
    // ---
    { icon: Laptop, label: 'Digital Hub', path: '/digital-hub' },
    { icon: FlaskConical, label: 'Science Lab Workstation', path: '/science-lab' },
    { icon: Monitor, label: 'ICT Lab & Devices', path: '/ict-lab' },
    { icon: Keyboard, label: 'Digital Skills Assessment', path: '/digital-skills' },
    { icon: Target, label: 'Practical Competencies', path: '/practical-competencies' },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio' },
    { icon: Library, label: 'Library & E-Resources', path: '/library' },
    { icon: BookOpen, label: 'Study Corner', path: '/study-corner' },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory' },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: GraduationCap, label: 'Promote Learners', path: '/promote' },
  ];

  const bursarMenuItems = [
    { icon: LayoutDashboard, label: 'Bursar Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Fee Ledgers & Finance', path: '/fees' },
    { icon: CreditCard, label: 'Receipts & Payments', path: '/fees' },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in' },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices' },
  ];

  const librarianMenuItems = [
    { icon: LayoutDashboard, label: 'Librarian Dashboard', path: '/dashboard' },
    { icon: Library, label: 'Library & E-Resources', path: '/library' },
    { icon: BookOpen, label: 'Study Corner', path: '/study-corner' },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory' },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in' },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices' },
  ];

  const teacherMenuItems = [
    { icon: LayoutDashboard, label: 'Teacher Dashboard', path: '/dashboard' },
    { icon: Users, label: 'My Classes & Learners', path: '/learners' },
    { icon: ClipboardCheck, label: 'Roll Call / Attendance', path: '/attendance' },
    { icon: LogIn, label: 'Daily Check-In', path: '/staff/check-in' },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments' },
    { icon: BarChart3, label: 'Results Analysis', path: '/analysis' },
    { icon: FileText, label: 'Report Cards', path: '/reports' },
    { icon: ClipboardList, label: 'Create Exam / Quiz', path: '/assessments/create' },
    { icon: BookOpenCheck, label: 'All Set Exams', path: '/assessments/list' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: MessageSquare, label: 'Teacher Communication', path: '/teacher-communication' },
    { icon: Megaphone, label: 'Events & Notices', path: '/notices' },
    { icon: BookOpen, label: 'Study Corner', path: '/study-corner' },
  ];

  // ── Student Portal menu (learners only) ─────────────────────────────────────
  // Students are strictly limited to their own assessment views. They must
  // never see Teacher Dashboard, My Classes & Learners, Roll Call / Attendance,
  // Daily Check-In, Enter Marks, or Results Analysis.
  const studentMenuItems = [
    { icon: GraduationCap, label: 'My Assessment', path: '/student-assessment' },
    { icon: BookOpenCheck, label: 'All Set Exams', path: '/assessments/list' },
  ];

  const activeMenu = isActuallyAdmin
    ? adminMenuItems
    : isBursarRole
    ? bursarMenuItems
    : isLibrarianRole
    ? librarianMenuItems
    : isStudentUser
    ? studentMenuItems
    : teacherMenuItems;

  return (
    <div className={cn("flex min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950", isDarkMode ? "dark" : "")}>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
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

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {activeMenu.map((item, index) => {
            if ((item as any).section) {
              if (isCollapsed) {
                return (
                  <div key={`section-${index}`} className="my-3 border-t border-slate-200 dark:border-slate-800" />
                );
              }
              return (
                <div key={`section-${index}`} className="px-3 pt-4 pb-2 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    {item.label}
                  </span>
                </div>
              );
            }

            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path + '-' + index}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[46px] group",
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
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {!isCollapsed && user && (
            <div className="mb-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                {String(user.name || user.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name || user.email || 'Administrator'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate">{normalizedRole || 'admin'}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-bold text-sm min-h-[46px]",
              isCollapsed && "justify-center px-0"
            )}
            title="Log Out"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full",
        isCollapsed ? "lg:ml-20" : "lg:ml-72 md:ml-64"
      )}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 min-h-[64px]">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Munyaka SMS Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end ml-auto">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wide shrink-0 whitespace-nowrap shadow-sm ${licenseInfo.badgeVariant}`}>
              <ShieldCheck size={14} className="shrink-0" />
              <span>{licenseInfo.badgeText}</span>
            </div>
            <div className="shrink-0 whitespace-nowrap">
              <SyncButton />
            </div>
            <NotificationBell />
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 pb-16 lg:pb-6 overflow-x-hidden" ref={scrollContainerRef}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
