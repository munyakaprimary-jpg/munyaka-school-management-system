import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  User,
  GraduationCap,
  Activity,
  TrendingUp,
  DollarSign,
  UsersRound,
  BookOpen,
  Megaphone,
  Wallet,
  CalendarCheck,
  ClipboardList,
  ShieldAlert,
  TrendingDown,
  Receipt,
  AlertCircle,
  Bell,
  PenLine,
  ClipboardCheck,
  CalendarDays,
  Wifi,
  WifiOff,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookMarked,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useCentralData } from '@/hooks/useCentralData';
import { useAuth } from '@/context/AuthContext';
import { getRecentActivity, getActivityColors, getActivityTypeLabel, formatRelativeTime } from '@/services/activityLog';
import {
  hasFullDashboardAccess,
  hasClassDashboardAccess,
  hasFinanceDashboardAccess,
  hasStudentPortalAccess,
  isOwner,
} from '@/rbac/permissionMatrix';
import { getNotices } from '@/utils/notice-board';
import { useLanSync } from '@/hooks/useLanSync';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Stable, machine-readable identifiers for every dashboard widget this
 * page can render.  Consumed by the RBAC matrix in
 * `src/rbac/permissionMatrix.ts` to decide which widgets a role may see,
 * and reused by the internal role-gating switch below.
 */
export type WidgetKey =
  | 'totalStudents'
  | 'totalTeachers'
  | 'todayAttendance'
  | 'feesCollected'
  | 'systemStatus'
  | 'activePortalLogins'
  | 'networkQuotas'
  | 'labSchedule'
  | 'subscriptionStatus'
  | 'totalActiveEnrollment'
  | 'renewalDate'
  | 'myAssignedClassCount'
  | 'myClassAttendanceRate'
  | 'pendingMarks'
  | 'todayLessonSchedule'
  | 'outstandingBalances'
  | 'recentTransactions'
  | 'transactionAlerts'
  | 'myReportCards'
  | 'myAttendanceLog'
  | 'schoolAnnouncements'
  | 'classEnrollment'
  | 'attendanceTrends'
  | 'recentAlerts';

interface RecentAlert {
  id: string;
  type: 'fee' | 'reg' | 'attn';
  msg: string;
  time: string;       // ISO string
  color: string;
  dotClass: string;
  _ts: number;       // unix ms — internal sort key
}

interface ClassRow {
  id: string;
  name: string;
  boys: number;
  girls: number;
  total: number;
  gradeOrder: number; // numeric sort key: PP1=1, PP2=2, Grade 1=3 … Grade 9=11
}

// ─── Weekly attendance bar chart colours ──────────────────────────────────────

const TODAY_IDX = new Date().getDay(); // 0=Sun
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY_NAME = DAY_NAMES[TODAY_IDX];

// ─── Weekly attendance data type ──────────────────────────────────────────────
interface WeeklyAttendancePoint {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  rate: number | null;       // null = no data recorded (unrecorded day)
  present: number;
  enrolled: number;
  dateLabel: string;          // "AUG 26" — date of that weekday
  hasData: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// ─── Main Dashboard Router ─────────────────────────────────────────────────────

/**
 * Top-level Dashboard component.  Mounted at the single route `/dashboard`
 * (and its alias `/`) so EVERY authenticated user — regardless of role —
 * lands on this one component, and the component itself dispatches to the
 * correct role-specific view via a clean switch on `user.role`.
 *
 * No role is ever redirected to a separate path like `/teachers-dashboard`
 * or `/admin-dashboard`; the routing layer stays uniform.
 *
 *   • admin / head_teacher / dev      → <AdminDashboardView />
 *   • teacher / ict_teacher           → <TeacherDashboardView />
 *   • student / parent                → <StudentDashboardView />
 *   • bursar / accountant / finance   → <FinanceDashboardView />
 *   • owner                           → OwnerDashboard (billing-only)
 *   • default (unknown role)          → <GeneralDashboardView />
 *
 * The matrix-level helpers in `src/rbac/permissionMatrix.ts` continue to
 * supply the canonical role list via `normalizeAdmin`.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const raw = user?.role ?? '';
  const role = raw.toLowerCase();
  const normalized = normalizeAdmin(raw);

  // ── Owner — billing-only, completely separate ──────────────────────────────
  if (isOwner(role)) {
    return <OwnerDashboard />;
  }

  // ── Explicit role-based dispatcher ──────────────────────────────────────────
  switch (normalized ?? role) {
    // Administrative / executive — full school-wide overview.
    case 'admin':
    case 'head_teacher':
    case 'dev': {
      return <AdminDashboardView />;
    }

    // Teaching staff — feature-rich class-level dashboard.
    case 'teacher':
    case 'ict_teacher': {
      return <TeacherDashboardView />;
    }

    // Students & parents — personalised portal view.
    case 'student':
    case 'parent': {
      return <StudentDashboardView />;
    }

    // Finance staff — fees / payments / ledger dashboard.
    case 'bursar':
    case 'accountant':
    case 'finance': {
      return <FinanceDashboardView />;
    }

    // Catch-all for any authenticated role that does not yet have a
    // dedicated view.
    default: {
      return <GeneralDashboardView user={user} />;
    }
  }
};

// ─── Role-specific View aliases ───────────────────────────────────────────────
// Thin aliases keep the dispatcher above readable while the implementation
// components below retain their descriptive names (unchanged in the rest
// of this file).  Each maps directly to the existing component:
//   AdminDashboardView    → FullAdminDashboard
//   TeacherDashboardView  → ClassTeacherDashboard
//   StudentDashboardView  → StudentPortalDashboard
//   FinanceDashboardView  → FinanceDashboard
//   GeneralDashboardView  → UnauthenticatedDashboard

const AdminDashboardView = FullAdminDashboard;
const TeacherDashboardView = ClassTeacherDashboard;
const StudentDashboardView = StudentPortalDashboard;
const FinanceDashboardView = FinanceDashboard;
const GeneralDashboardView = UnauthenticatedDashboard;

// ─── Shared Sub-components (used across multiple dashboards) ──────────────────

const LiveBadge = ({ label }: { label: string }) => (
  <Badge
    variant="outline"
    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700 gap-1.5"
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    {label}
  </Badge>
);

const StatCard = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
}) => (
  <Card className="border-none shadow-sm bg-white rounded-2xl hover:-translate-y-0.5 transition-transform">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-black text-slate-900 truncate leading-none">{value}</p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

const AlertItem = ({ alert }: { alert: RecentAlert }) => (
  <div className="flex gap-3 items-start">
    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${alert.dotClass}`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-800 leading-snug break-words">{alert.msg}</p>
      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wide">
        {formatRelativeTime(alert.time)}
      </p>
    </div>
  </div>
);

const EmptyAlertsState = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
      <Activity size={18} className="text-slate-400" />
    </div>
    <p className="text-sm font-semibold text-slate-600">No system activities recorded today.</p>
    <p className="text-xs text-slate-400 max-w-xs">
      Once fee payments, student registrations, or attendance logs are recorded, they will appear here.
    </p>
  </div>
);

const ClassParticipationTable = ({ rows }: { rows: ClassRow[] }) => {
  const grandTotalBoys   = rows.reduce((s, r) => s + (r.boys  || 0), 0);
  const grandTotalGirls = rows.reduce((s, r) => s + (r.girls || 0), 0);
  const grandTotal      = rows.reduce((s, r) => s + (r.total || 0), 0);

  return (
    <div className="w-full overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-1/2">
              Class Name
            </th>
            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Boys
            </th>
            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Girls
            </th>
            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-red-600">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                No class data available yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${row.boys > 0 ? 'text-blue-600' : 'text-blue-200'}`}>
                    {row.boys}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${row.girls > 0 ? 'text-emerald-600' : 'text-emerald-200'}`}>
                    {row.girls}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${row.total > 0 ? 'text-red-600' : 'text-red-200'}`}>
                    {row.total}
                  </span>
                </td>
              </tr>
            ))
          )}
          <tr className="bg-red-50 border-t-2 border-red-200">
            <td className="px-6 py-4 font-black text-red-700 text-sm">Total</td>
            <td className="px-6 py-4 text-right">
              <span className="font-black text-blue-700">{grandTotalBoys}</span>
            </td>
            <td className="px-6 py-4 text-right">
              <span className="font-black text-emerald-700">{grandTotalGirls}</span>
            </td>
            <td className="px-6 py-4 text-right">
              <span className="font-black text-red-700">{grandTotal.toLocaleString()}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── Role: Fallback for unknown / unrecognised roles ───────────────────────────

const UnauthenticatedDashboard = ({ user }: { user: { name?: string; role?: string } | null }) => (
  <div className="space-y-6 p-6">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <ShieldAlert size={22} className="text-slate-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome, {user?.name || 'User'}</p>
      </div>
    </div>
    <Card className="border border-amber-200 bg-amber-50 rounded-2xl">
      <CardContent className="p-6 flex items-start gap-4">
        <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Limited Access</p>
          <p className="text-sm text-amber-700 mt-1">
            Your role <span className="font-semibold">({user?.role || 'unknown'})</span> does not
            have a dedicated dashboard view yet. Contact your school administrator to request
            access to the appropriate module.
          </p>
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={Users}
        iconBg="bg-blue-50"
        iconColor="text-blue-500"
        title="Total Students"
        value="—"
      />
      <StatCard
        icon={User}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-500"
        title="Total Teachers"
        value="—"
      />
      <StatCard
        icon={UserCheck}
        iconBg="bg-green-50"
        iconColor="text-green-500"
        title="Today's Attendance"
        value="—"
      />
    </div>
  </div>
);

// ─── Role: Class Teacher Dashboard (teacher / ict_teacher) ───────────────────

/**
 * Displays a feature-rich class-level dashboard for teachers:
 * - Quick Action Cards (Enter Marks, Mark Attendance, Class Timetable)
 * - Summary Metric Cards (Students, Pending Submissions, Today's Attendance)
 * - Real-Time LAN Server Connection Banner
 * - Notice & Events Feed
 */
const ClassTeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, isOnline, connectionStatus } = useLanSync();

  // ── Today's date helpers ─────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(
    () => today.toISOString().slice(0, 10),
    [today]
  );
  const todayLabel = useMemo(
    () => today.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' }),
    [today]
  );

  // ── Assigned learning areas from localStorage ─────────────────────────────────
  const assignedAreas = useMemo(() => {
    const raw = localStorage.getItem('munyaka_learning_areas');
    if (!raw) return [];
    try {
      const areas = JSON.parse(raw);
      return Array.isArray(areas) ? areas : [];
    } catch {
      return [];
    }
  }, []);

  // ── Assigned classes (grades/streams) ────────────────────────────────────────
  const assignedClasses = useMemo(() => {
    const raw = localStorage.getItem('munyaka_grades');
    if (!raw) return [];
    try {
      const grades = JSON.parse(raw);
      return Array.isArray(grades) ? grades : [];
    } catch {
      return [];
    }
  }, []);

  // ── Assigned Students Count ──────────────────────────────────────────────────
  // Derived from total enrolled learners in the teacher's assigned streams/grades.
  // If no explicit assignment is configured, falls back to all active learners.
  const assignedStudentsCount = useMemo(() => {
    const learners: any[] = safeRead('school_learners_data', []);
    const active = learners.filter((l: any) => l.status !== 'TRANSFERRED');

    if (assignedClasses.length === 0) {
      return active.length;
    }

    const assignedNames = new Set(
      assignedClasses.map((c: any) => (c.name || '').toLowerCase().trim())
    );

    return active.filter((l: any) => {
      const gradeName = (l.grade || '').toLowerCase().trim();
      return assignedNames.has(gradeName);
    }).length;
  }, [assignedClasses]);

  // ── Today's Attendance Summary ───────────────────────────────────────────────
  const todayAttendanceSummary = useMemo(() => {
    const learners: any[] = safeRead('school_learners_data', []);
    const active = learners.filter((l: any) => l.status !== 'TRANSFERRED');

    // Try the v2 storage path (per-grade records)
    const STORAGE_KEY_PREFIX = 'munyaka_attendance_v2_';
    let v2Records: Record<string, any> = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) v2Records = { ...v2Records, ...JSON.parse(raw) };
        } catch { /* ignore */ }
      }
    });

    // Also read the legacy aggregate key
    let legacyRecords: Record<string, any> = {};
    try {
      const raw = localStorage.getItem('munyaka_attendance_records');
      if (raw) legacyRecords = JSON.parse(raw);
    } catch { /* ignore */ }

    const merged = { ...legacyRecords, ...v2Records };

    let present = 0;
    let absent = 0;
    let hasData = false;

    Object.values(merged).forEach((record: any) => {
      if (!record || typeof record !== 'object') return;
      const recDate = (record.date || record.savedAt || record.timestamp || '').slice(0, 10);
      if (recDate !== todayKey) return;
      hasData = true;
      Object.values(record).forEach((entry: any) => {
        if (!entry || typeof entry !== 'object') return;
        const m = entry.morning?.status || entry.morning;
        const a = entry.afternoon?.status || entry.afternoon;
        if (m === 'P' || m === 'present' || m === true || a === 'P' || a === 'present' || a === true) {
          present += 1;
        } else if (m === 'A' || m === 'absent' || a === 'A' || a === 'absent') {
          absent += 1;
        }
      });
    });

    // Also scan legacy keys containing the date string
    Object.entries(legacyRecords).forEach(([key, record]: [string, any]) => {
      if (!key.includes(todayKey) || !record || typeof record !== 'object') return;
      hasData = true;
      Object.values(record).forEach((val: any) => {
        if (val === 'P' || val === 'present' || val === true) present += 1;
        else if (val === 'A' || val === 'absent') absent += 1;
      });
    });

    // Fall back to per-learner attendanceStatus snapshot if no registers
    if (!hasData) {
      present = active.filter((l: any) => {
        const s = (l.attendanceStatus || '').toLowerCase();
        return s === 'present' || s === 'p';
      }).length;
      absent = active.filter((l: any) => {
        const s = (l.attendanceStatus || '').toLowerCase();
        return s === 'absent' || s === 'a';
      }).length;
      hasData = present + absent > 0;
    }

    return { present, absent, hasData };
  }, [todayKey]);

  // ── Pending Assessment Submissions ──────────────────────────────────────────
  // Count of students without a recorded mark for any of the teacher's active
  // learning areas.  We approximate "incomplete mark entries" by computing:
  //   active learners  −  students who have at least one mark per assigned area
  const pendingAssessmentSubmissions = useMemo(() => {
    const learners: any[] = safeRead('school_learners_data', []);
    const active = learners.filter((l: any) => l.status !== 'TRANSFERRED');

    if (assignedAreas.length === 0) {
      return 0;
    }

    const marksRaw = localStorage.getItem('munyaka_marks');
    let marks: any[] = [];
    try {
      if (marksRaw) marks = Array.isArray(JSON.parse(marksRaw)) ? JSON.parse(marksRaw) : [];
    } catch { /* ignore */ }

    // Active learning-area names
    const activeAreaNames = new Set(
      assignedAreas
        .filter((a: any) => a.isActive !== false && a.active !== false)
        .map((a: any) => (a.name || a.code || '').toLowerCase().trim())
    );

    if (activeAreaNames.size === 0) return 0;

    // For each learner, check if they have at least one mark in any active area
    return active.filter((learner: any) => {
      const hasMark = marks.some((m: any) => {
        const learnerMatch =
          m.learnerId === learner.id ||
          m.studentId === learner.id ||
          m.learnerName === learner.name ||
          m.studentName === learner.name;
        if (!learnerMatch) return false;
        const areaName = (m.learningArea || m.subject || '').toLowerCase().trim();
        return activeAreaNames.has(areaName);
      });
      return !hasMark;
    }).length;
  }, [assignedAreas]);

  // ── School notices for the feed ─────────────────────────────────────────────
  const recentNotices = useMemo(() => {
    const notices = getNotices();
    return notices.slice(0, 5);
  }, []);

  // ── LAN server IP for the connection banner ─────────────────────────────────
  const serverUrl = useMemo(() => {
    const primary = localStorage.getItem('lan_server_url');
    if (primary) return primary;
    return localStorage.getItem('munyaka_lan_server_url') || '';
  }, []);

  // ── Quick Action Handlers ───────────────────────────────────────────────────
  const handleEnterMarks = () => navigate('/assessments');
  const handleMarkAttendance = () => navigate('/attendance');
  const handleClassTimetable = () => navigate('/timetable');

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Teacher'}</span> — {todayLabel}
          </p>
        </div>
        <LiveBadge label="TEACHER SYNC" />
      </div>

      {/* ── Real-Time LAN Server Connection Banner ─────────────────────────── */}
      <LanSyncBanner
        isOnline={isOnline}
        isConnected={isConnected}
        serverUrl={serverUrl}
        latency={connectionStatus.latency}
      />

      {/* ── Quick Action Cards ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={PenLine}
            gradient="from-indigo-500 to-violet-600"
            title="Enter Marks / Assessments"
            description="Record learner scores for active learning areas."
            onClick={handleEnterMarks}
            cta="Open Marks Entry"
          />
          <QuickActionCard
            icon={ClipboardCheck}
            gradient="from-emerald-500 to-teal-600"
            title="Mark Attendance"
            description="Take the daily student roll call for your class."
            onClick={handleMarkAttendance}
            cta="Take Roll Call"
          />
          <QuickActionCard
            icon={CalendarDays}
            gradient="from-amber-500 to-orange-600"
            title="Class Timetable"
            description="View your weekly lesson schedule and periods."
            onClick={handleClassTimetable}
            cta="Open Timetable"
          />
        </div>
      </div>

      {/* ── Summary Metric Cards ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Today at a Glance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Assigned Students Count */}
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl shrink-0">
                  <Users size={22} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">
                    Assigned Students
                  </p>
                  <p className="text-3xl font-black text-slate-900 leading-none">
                    {assignedStudentsCount}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">
                    in {assignedClasses.length || '—'} stream(s)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Assessment Submissions */}
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-xl shrink-0">
                  <FileText size={22} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">
                    Pending Submissions
                  </p>
                  <p className="text-3xl font-black text-slate-900 leading-none">
                    {pendingAssessmentSubmissions}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">
                    learners without marks
                  </p>
                </div>
              </div>
              {pendingAssessmentSubmissions > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEnterMarks}
                  className="mt-3 w-full text-amber-700 hover:bg-amber-50 hover:text-amber-800 gap-1.5 h-8 text-xs font-bold"
                >
                  Resolve Now
                  <ArrowRight size={12} />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance Summary */}
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-transform">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="bg-green-50 p-3 rounded-xl shrink-0">
                    <UserCheck size={22} className="text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">
                      Today's Attendance
                    </p>
                    <p className="text-3xl font-black text-slate-900 leading-none">
                      {todayAttendanceSummary.present + todayAttendanceSummary.absent > 0
                        ? `${Math.round(
                            (todayAttendanceSummary.present /
                              Math.max(
                                1,
                                todayAttendanceSummary.present + todayAttendanceSummary.absent
                              )) *
                              100
                          )}%`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="rounded-full bg-emerald-50 text-emerald-700 gap-1.5 px-2.5 py-1 text-xs font-bold">
                  <CheckCircle2 size={12} />
                  Present: {todayAttendanceSummary.present}
                </Badge>
                <Badge className="rounded-full bg-red-50 text-red-700 gap-1.5 px-2.5 py-1 text-xs font-bold">
                  <XCircle size={12} />
                  Absent: {todayAttendanceSummary.absent}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Notice & Events Feed ───────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-purple-500" />
            <CardTitle className="text-base font-bold text-slate-800">
              Notice & Events
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/notices')}
            className="text-purple-700 hover:bg-purple-50 hover:text-purple-800 gap-1.5 h-8 text-xs font-bold"
          >
            View all
            <ArrowRight size={12} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Megaphone size={20} className="text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No new notices</p>
              <p className="text-xs text-slate-400 max-w-xs">
                School announcements published by the admin will appear here in real time.
              </p>
            </div>
          ) : (
            recentNotices.map((notice: any) => (
              <NoticeItem
                key={notice.id}
                notice={notice}
                onClick={() => navigate('/notices')}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Teacher Dashboard sub-components ─────────────────────────────────────────

/**
 * Top mini-card displaying real-time LAN sync status to the school server.
 * Shows online/offline state, server IP, and connection latency.
 */
const LanSyncBanner: React.FC<{
  isOnline: boolean;
  isConnected: boolean;
  serverUrl: string;
  latency: number | null;
}> = ({ isOnline, isConnected, serverUrl, latency }) => {
  const displayHost = useMemo(() => {
    if (!serverUrl) return 'Not configured';
    try {
      // Strip protocol & trailing slash
      return serverUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .slice(0, 32);
    } catch {
      return serverUrl;
    }
  }, [serverUrl]);

  const isHealthy = isOnline && isConnected;
  const statusLabel = !isOnline
    ? 'Offline / Local Mode'
    : isConnected
    ? 'Online / Connected'
    : 'Reachable / Local Mode';
  const StatusIcon = isHealthy ? Wifi : !isOnline ? WifiOff : Server;

  const accent = isHealthy
    ? {
        ring: 'ring-emerald-200',
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
      }
    : {
        ring: 'ring-amber-200',
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
      };

  return (
    <Card className={`border-none shadow-sm ${accent.bg} ring-1 ${accent.ring} rounded-2xl overflow-hidden`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className={`${accent.iconBg} p-3 rounded-xl shrink-0`}>
            <StatusIcon size={20} className={accent.iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>
                LAN Sync Status
              </p>
              <span className="relative flex h-2 w-2">
                {isHealthy && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${accent.dot} opacity-75`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${accent.dot}`} />
              </span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              {statusLabel}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Server size={11} className="text-slate-400" />
                <span className="font-mono">{displayHost}</span>
              </p>
              {latency !== null && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={11} className="text-slate-400" />
                  {latency} ms
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${accent.bg} ${accent.text} hidden sm:inline-flex`}
          >
            {isHealthy ? 'Live' : 'Cached'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Clickable gradient-tinted card used for the three Quick Action entries.
 */
const QuickActionCard: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
}> = ({ icon: Icon, gradient, title, description, cta, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group text-left bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
  >
    <div className="flex items-start gap-4">
      <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-md shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-black text-slate-900 leading-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight size={12} />
        </div>
      </div>
    </div>
  </button>
);

/**
 * Compact notice row used in the Notice & Events feed.
 */
const NoticeItem: React.FC<{
  notice: any;
  onClick: () => void;
}> = ({ notice, onClick }) => {
  const meta = useMemo(() => {
    const category = (notice.category || 'General').toLowerCase();
    if (category.includes('urgent') || notice.priority === 'high') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: AlertTriangle,
        label: 'Urgent',
      };
    }
    if (category.includes('event')) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        icon: CalendarDays,
        label: 'Event',
      };
    }
    if (category.includes('finance')) {
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-600',
        icon: Wallet,
        label: 'Finance',
      };
    }
    return {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      icon: Megaphone,
      label: 'Notice',
    };
  }, [notice]);

  const Icon = meta.icon;
  const displayBody = notice.content || notice.message || notice.description || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
    >
      <div className={`${meta.bg} p-2 rounded-lg shrink-0`}>
        <Icon size={16} className={meta.text} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-bold text-slate-800 truncate">
            {notice.title || 'School Notice'}
          </p>
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-wider border-0 ${meta.bg} ${meta.text}`}
          >
            {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {displayBody}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
          {formatRelativeTime(notice.date || notice.createdAt || new Date().toISOString())}
        </p>
      </div>
    </button>
  );
};

// ─── Role: Finance Dashboard (bursar) ─────────────────────────────────────────

/**
 * Displays a financial-only dashboard for bursars showing:
 * - Fee collection totals
 * - Outstanding balances
 * - Recent transactions
 * - Transaction alerts
 */
const FinanceDashboard = () => {
  const { user } = useAuth();

  // ── Total collected ──────────────────────────────────────────────────────────
  const totalCollected = useMemo(() => {
    const txRaw = localStorage.getItem('munyaka_transactions');
    if (!txRaw) return { amount: 0, count: 0 };
    try {
      const list: any[] = JSON.parse(txRaw);
      const paid = list.filter((t: any) => t?.status === 'paid' || t?.paidAt);
      const amount = paid.reduce((s: number, t: any) => s + (Number(t?.amount) || 0), 0);
      return { amount, count: paid.length };
    } catch {
      return { amount: 0, count: 0 };
    }
  }, []);

  // ── Outstanding balances ──────────────────────────────────────────────────────
  const outstandingBalances = useMemo(() => {
    const learners = safeRead<any[]>('school_learners_data', []);
    const txRaw = localStorage.getItem('munyaka_transactions');
    const paidByLearner: Record<string, number> = {};
    if (txRaw) {
      try {
        const list: any[] = JSON.parse(txRaw);
        list.filter((t: any) => t?.status === 'paid' || t?.paidAt)
          .forEach((t: any) => {
            const key = t.learnerId || t.studentId || '';
            paidByLearner[key] = (paidByLearner[key] || 0) + (Number(t?.amount) || 0);
          });
      } catch { /* ignore */ }
    }
    let total = 0;
    let withBalance = 0;
    learners.filter((l: any) => l.status !== 'TRANSFERRED').forEach((l: any) => {
      const paid = paidByLearner[l.id] || 0;
      const balance = (Number(l.feeBalance) || 0) - paid;
      if (balance > 0) {
        total += balance;
        withBalance += 1;
      }
    });
    return { amount: total, count: withBalance };
  }, []);

  // ── Recent transactions ───────────────────────────────────────────────────────
  const recentTransactions = useMemo(() => {
    const txRaw = localStorage.getItem('munyaka_transactions');
    if (!txRaw) return [];
    try {
      const list: any[] = JSON.parse(txRaw);
      return list
        .filter((t: any) => t?.status === 'paid' || t?.paidAt)
        .sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
        .slice(0, 8)
        .map((t: any) => ({
          id: t.id || Math.random().toString(),
          learner: t.learnerName || t.studentName || 'Unknown Student',
          amount: Number(t.amount) || 0,
          date: t.paidAt || t.date || '',
          method: t.paymentMethod || 'Cash',
          status: t.status || 'paid',
        }));
    } catch {
      return [];
    }
  }, []);

  // ── Transaction alerts ───────────────────────────────────────────────────────
  const transactionAlerts = useMemo(() => {
    const learners = safeRead<any[]>('school_learners_data', []);
    const txRaw = localStorage.getItem('munyaka_transactions');
    const paidByLearner: Record<string, number> = {};
    if (txRaw) {
      try {
        const list: any[] = JSON.parse(txRaw);
        list.filter((t: any) => t?.status === 'paid' || t?.paidAt)
          .forEach((t: any) => {
            const key = t.learnerId || t.studentId || '';
            paidByLearner[key] = (paidByLearner[key] || 0) + (Number(t?.amount) || 0);
          });
      } catch { /* ignore */ }
    }
    return learners
      .filter((l: any) => {
        if (l.status === 'TRANSFERRED') return false;
        const balance = (Number(l.feeBalance) || 0) - (paidByLearner[l.id] || 0);
        return balance > 5000;
      })
      .slice(0, 5)
      .map((l: any) => {
        const paid = paidByLearner[l.id] || 0;
        const balance = (Number(l.feeBalance) || 0) - paid;
        return {
          id: l.id || Math.random().toString(),
          learner: l.name || 'Unknown',
          balance,
          status: balance > 20000 ? 'critical' : 'warning',
        };
      });
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Finance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Fee collection and payment overview for {user?.name || 'Bursar'}.
            </p>
          </div>
          <LiveBadge label="FINANCE SYNC" />
        </div>
      </div>

      {/* ── Financial Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          title="Total Collected"
          value={`KES ${totalCollected.amount.toLocaleString()}`}
          subtitle={`${totalCollected.count} transactions`}
        />
        <StatCard
          icon={Wallet}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          title="Outstanding Balances"
          value={`KES ${outstandingBalances.amount.toLocaleString()}`}
          subtitle={`${outstandingBalances.count} accounts`}
        />
        <StatCard
          icon={Receipt}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          title="Recent Transactions"
          value={recentTransactions.length}
        />
        <StatCard
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          title="Pending Alerts"
          value={transactionAlerts.length}
        />
      </div>

      {/* ── Recent Transactions ──────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Recent Transactions
          </CardTitle>
          <Bell size={18} className="text-slate-400" />
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Receipt size={24} className="text-slate-300" />
              <p className="text-sm text-slate-500">No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Receipt size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{tx.learner}</p>
                      <p className="text-xs text-slate-400">{tx.paymentMethod} • {formatRelativeTime(tx.date)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    KES {tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transaction Alerts ──────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Outstanding Balances
          </CardTitle>
          <Badge className="rounded-full bg-amber-50 text-amber-700 text-xs">
            Requires Attention
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactionAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Activity size={24} className="text-slate-300" />
              <p className="text-sm text-slate-500">All accounts are up to date!</p>
            </div>
          ) : (
            <>
              {transactionAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${alert.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{alert.learner}</p>
                      <p className="text-xs text-slate-400">Outstanding balance</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${alert.status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                    KES {alert.balance.toLocaleString()}
                  </p>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Role: Student Portal Dashboard (student / parent) ───────────────────────

/**
 * Displays a personalized student portal dashboard showing:
 * - Individual report cards
 * - Attendance logs
 * - School announcements
 */
const StudentPortalDashboard = () => {
  const { user } = useAuth();

  // ── User's own data ──────────────────────────────────────────────────────────
  const myData = useMemo(() => {
    if (!user) return null;
    const learners = safeRead<any[]>('school_learners_data', []);
    // Match by user id or name
    const me = learners.find((l: any) =>
      l.id === user.id || l.name === user.name || l.email === user.email
    );
    return me || null;
  }, [user]);

  // ── My report cards ─────────────────────────────────────────────────────────
  const myReportCards = useMemo(() => {
    const raw = localStorage.getItem('munyaka_marks');
    if (!raw || !user) return [];
    try {
      const marks = JSON.parse(raw);
      if (!Array.isArray(marks)) return [];
      // Filter to current user's marks
      const myMarks = marks.filter((m: any) =>
        m.learnerId === user.id ||
        m.studentId === user.id ||
        m.learnerName === user.name ||
        m.studentName === user.name
      );
      // Group by exam/term
      const groups: Record<string, any[]> = {};
      myMarks.forEach((m: any) => {
        const key = m.examType || m.term || 'General';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
      return Object.entries(groups).map(([term, scores]) => ({
        term,
        subjects: scores.map((s: any) => ({
          name: s.subject || s.learningArea || 'Subject',
          score: s.score || 0,
          grade: s.grade || '—',
        })),
        average: Math.round(scores.reduce((a: number, b: any) => a + (b.score || 0), 0) / scores.length),
      })).slice(0, 3);
    } catch {
      return [];
    }
  }, [user]);

  // ── My attendance log ───────────────────────────────────────────────────────
  const myAttendance = useMemo(() => {
    const attnRaw = localStorage.getItem('munyaka_attendance_records');
    if (!attnRaw || !user) return { present: 0, absent: 0, total: 0, rate: 0 };
    try {
      const records = JSON.parse(attnRaw);
      let present = 0;
      let absent = 0;
      Object.values(records).forEach((record: any) => {
        if (!record || typeof record !== 'object') return;
        Object.values(record).forEach((entry: any) => {
          if (!entry) return;
          const status = (entry.status || entry.morning || '').toString().toLowerCase();
          if (status === 'p' || status === 'present' || status === 'true') present++;
          else if (status === 'a' || status === 'absent') absent++;
        });
      });
      const total = present + absent;
      return { present, absent, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
    } catch {
      return { present: 0, absent: 0, total: 0, rate: 0 };
    }
  }, [user]);

  // ── School announcements ────────────────────────────────────────────────────
  const announcements = useMemo(() => {
    const notices = getNotices();
    return notices.slice(0, 5);
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              My Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name || 'Student'}!
            </p>
          </div>
          <LiveBadge label="PORTAL SYNC" />
        </div>
      </div>

      {/* ── Personal Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={GraduationCap}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          title="My Class"
          value={myData?.grade || '—'}
        />
        <StatCard
          icon={CalendarCheck}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          title="Attendance Rate"
          value={`${myAttendance.rate}%`}
          subtitle={`${myAttendance.present} present / ${myAttendance.total} days`}
        />
        <StatCard
          icon={Megaphone}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          title="Announcements"
          value={announcements.length}
        />
      </div>

      {/* ── My Report Cards ────────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            My Report Cards
          </CardTitle>
          <TrendingUp size={18} className="text-emerald-500" />
        </CardHeader>
        <CardContent className="space-y-4">
          {myReportCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <GraduationCap size={24} className="text-slate-300" />
              <p className="text-sm text-slate-500">No report cards available yet.</p>
            </div>
          ) : (
            myReportCards.map((report, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">{report.term}</h3>
                  <Badge className="rounded-full bg-emerald-50 text-emerald-700 text-xs">
                    Avg: {report.average}%
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.subjects.slice(0, 4).map((subj: any, sIdx: number) => (
                    <div key={sIdx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium text-slate-600">{subj.name}</span>
                      <span className="text-xs font-bold text-slate-800">{subj.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── My Attendance Log ───────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-black text-green-600">{myAttendance.present}</p>
              <p className="text-xs font-medium text-green-700 mt-1">Days Present</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-black text-red-600">{myAttendance.absent}</p>
              <p className="text-xs font-medium text-red-700 mt-1">Days Absent</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-black text-blue-600">{myAttendance.total}</p>
              <p className="text-xs font-medium text-blue-700 mt-1">Total Days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── School Announcements ────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            School Announcements
          </CardTitle>
          <Megaphone size={18} className="text-purple-500" />
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Megaphone size={24} className="text-slate-300" />
              <p className="text-sm text-slate-500">No announcements at this time.</p>
            </div>
          ) : (
            announcements.map((notice: any) => (
              <div key={notice.id} className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Megaphone size={18} className="text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{notice.title || 'Announcement'}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {notice.content || notice.message || ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Role: Full Admin Dashboard (admin / head_teacher / dev) ──────────────────

const FullAdminDashboard = () => {
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useCentralData();
  const { user } = useAuth();

  // ── Junior school count ──────────────────────────────────────────────────────
  const juniorSchoolCount = useMemo(() => {
    const learners = safeRead<any[]>('school_learners_data', []);
    const count = learners.filter((l: any) => {
      const g = (l.grade || '').toLowerCase();
      return /^grade [7-9]/.test(g) && l.status !== 'TRANSFERRED';
    }).length;
    return count > 0 ? count : Math.max(0, Math.floor(totalStudents * 0.25));
  }, [totalStudents]);

  // ── Fees collected ───────────────────────────────────────────────────────────
  const feesCollected = useMemo(() => {
    const txRaw = localStorage.getItem('munyaka_transactions');
    if (!txRaw) return 'KES 0';
    try {
      const list: any[] = JSON.parse(txRaw);
      const total = list
        .filter((t: any) => t?.status === 'paid' || t?.paidAt)
        .reduce((s: number, t: any) => s + (Number(t?.amount) || 0), 0);
      return `KES ${total.toLocaleString()}`;
    } catch {
      return 'KES 0';
    }
  }, [totalStudents]);

  // ── Weekly attendance data — computed live from attendance registers ─────────────
  // Each day in the current week (Mon–Fri) is resolved from:
  //   1. The attendance records stored per class/grade in localStorage
  //   2. The total enrolled students per grade (from school_learners_data)
  //
  // Days with NO recorded attendance are shown as null (empty bar), never 0%.
  // Days with recorded data get a real computed percentage.
  const weeklyData = useMemo<WeeklyAttendancePoint[]>(() => {
    const now = new Date();

    // Find Monday of the current week (go back by weekday offset)
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Mon-based offset
    monday.setHours(0, 0, 0, 0);

    // Build the Mon–Fri row for this calendar week
    const DAY_KEYS: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    // ── Read enrolled count per grade from school_learners_data ───────────────
    let gradeEnrollment: Record<string, number> = {};
    try {
      const learners: any[] = safeRead('school_learners_data', []);
      learners.forEach((l: any) => {
        if (l.status === 'TRANSFERRED') return;
        const g = (l.grade || '').replace(/grade\s*/i, '').trim();
        gradeEnrollment[g] = (gradeEnrollment[g] || 0) + 1;
      });
    } catch { /* ignore */ }

    // ── Read all attendance records ──────────────────────────────────────────
    // Storage pattern: munyaka_attendance_v2_<gradeId>  OR  munyaka_attendance_records
    // Each record is keyed by gradeId and contains per-student attendance objects.
    const STORAGE_KEY_PREFIX = 'munyaka_attendance_v2_';
    let allAttnRecords: Record<string, any> = {};
    try {
      const attnRaw = localStorage.getItem('munyaka_attendance_records');
      if (attnRaw) {
        allAttnRecords = JSON.parse(attnRaw);
      }
    } catch { /* ignore */ }

    // Also read per-grade v2 records
    let v2Records: Record<string, any> = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            v2Records = { ...v2Records, ...data };
          }
        } catch { /* ignore */ }
      }
    });

    const mergedRecords = { ...allAttnRecords, ...v2Records };

    // ── Compute attendance % per weekday in the current calendar week ──────────
    return DAY_KEYS.map((dayName, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const dateStr = date.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const dateLabel = date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }).toUpperCase();

      // Total enrolled across all grades for this date
      const totalEnrolled = Object.values(gradeEnrollment).reduce((s, n) => s + n, 0);

      // Count present students from attendance records for this date
      let presentCount = 0;
      let hasData = false;

      Object.entries(mergedRecords).forEach(([, record]: [string, any]) => {
        if (!record || typeof record !== 'object') return;
        const recDate = (record.date || record.savedAt || record.timestamp || '');
        const recDateStr = typeof recDate === 'string' ? recDate.slice(0, 10) : '';
        if (recDateStr !== dateStr) return;

        // Walk through each student's attendance entry
        Object.entries(record).forEach(([, studentEntry]: [string, any]) => {
          if (!studentEntry || typeof studentEntry !== 'object') return;
          // Support both flat "P"/"A" keys and nested { morning: { status }, afternoon: { status } }
          const morning = studentEntry.morning?.status || studentEntry.morning;
          const afternoon = studentEntry.afternoon?.status || studentEntry.afternoon;
          const present =
            morning === 'P' ||
            morning === 'present' ||
            morning === true ||
            afternoon === 'P' ||
            afternoon === 'present' ||
            afternoon === true;
          if (present) presentCount += 1;
          hasData = true;
        });
      });

      // Also scan munyaka_attendance_records for savedAt-timestampmed entries
      // where the key contains the date string (legacy format: "Grade 4_Blue_2026-08-26_morning")
      Object.entries(allAttnRecords).forEach(([key, record]: [string, any]) => {
        if (!record || typeof record !== 'object') return;
        if (!key.includes(dateStr)) return;
        hasData = true;
        // Legacy records store a flat structure — count each property that's P/present
        Object.values(record).forEach((val: any) => {
          if (val === 'P' || val === 'present' || val === true) presentCount += 1;
        });
      });

      const rate = totalEnrolled > 0 && hasData ? Math.round((presentCount / totalEnrolled) * 100) : null;

      return {
        day: dayName,
        rate,
        present: presentCount,
        enrolled: totalEnrolled,
        dateLabel,
        hasData,
      };
    });
  }, [totalStudents]);

  // ── Class participation rows — live gender-split query ────────────────────────────────────
  // • Reads every active (non-TRANSFERRED) learner from school_learners_data
  // • Groups by normalised grade name and splits counts into Boys / Girls
  // • Falls back to 0 for grades with no students
  // • Sorts using GRADE_ORDER index: PP1 → PP2 → Grade 1 … Grade 9
  const classRows = useMemo<ClassRow[]>(() => {
    // Strict ascending grade sequence used for both normalisation and sort
    const GRADE_ORDER = [
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
    ];

    // ── normalise(raw) ──────────────────────────────────────────────────────
    // Maps any variant of a pre-primary or primary grade name to its
    // canonical GRADE_ORDER key:
    //
    //   "Grade PP 1" / "Grade PP1" / "PP 1" / "pp1" / "PP1"  → "PP1"
    //   "Grade PP 2" / "Grade PP2" / "PP 2" / "pp2" / "PP2"  → "PP2"
    //   "Grade 3"   / "grade 3" / "GRADE 3"                 → "Grade 3"
    //
    // Returns the original string unchanged if it doesn't match any pattern.
    const normalise = (raw: string): string => {
      if (!raw) return '';
      const s = raw.trim();
      const u = s.toUpperCase();

      // Pre-primary variants
      // Match "Grade PP 1", "Grade PP1", "PP 1", "pp1", "PP1" → PP1
      // and   "Grade PP 2", "Grade PP2", "PP 2", "pp2", "PP2" → PP2
      const ppMatch = s.match(/^(?:grade\s+)?pp\s*([12])$/i);
      if (ppMatch) return `PP${ppMatch[1]}`;

      // Standard "Grade N" — normalise capitalisation
      const gradeMatch = s.match(/^grade\s+(\d+)$/i);
      if (gradeMatch) return `Grade ${gradeMatch[1]}`;

      // Already-canonical keys (case-insensitive lookup in GRADE_ORDER)
      const canonicalIdx = GRADE_ORDER.findIndex(
        (g) => g.toUpperCase() === u,
      );
      if (canonicalIdx >= 0) return GRADE_ORDER[canonicalIdx];

      return s;
    };

    // ── Accumulate gender counts per normalised grade key ───────────────────
    const learners: any[] = safeRead('school_learners_data', []);
    const acc: Record<string, { boys: number; girls: number }> = {};

    learners.forEach((l: any) => {
      if (l.status === 'TRANSFERRED') return;
      const key = normalise(l.grade || '');
      if (!key) return;
      if (!acc[key]) acc[key] = { boys: 0, girls: 0 };
      const gender = (l.gender || '').toLowerCase().trim();
      if (gender === 'male' || gender === 'boy') {
        acc[key].boys += 1;
      } else if (gender === 'female' || gender === 'girl') {
        acc[key].girls += 1;
      }
    });

    // ── Build unified key list (grades config + learner data) ─────────────────
    const gradeNamesFromConfig: string[] = (() => {
      const raw = localStorage.getItem('munyaka_grades');
      if (!raw) return [];
      try {
        const grades = JSON.parse(raw);
        return Array.isArray(grades)
          ? grades.map((g: any) => normalise(g.name || ''))
          : [];
      } catch { return []; }
    })();

    const allKeys = Array.from(
      new Set([...gradeNamesFromConfig, ...Object.keys(acc)]),
    ).filter(Boolean);

    // ── Map to rows ─────────────────────────────────────────────────────────
    const rows: ClassRow[] = allKeys.map((key) => {
      const counts = acc[key] || { boys: 0, girls: 0 };
      return {
        id: key,
        name: key,
        boys: counts.boys,
        girls: counts.girls,
        total: counts.boys + counts.girls,
        gradeOrder: GRADE_ORDER.indexOf(key), // -1 for unknown grades
      };
    });

    // ── Strict GRADE_ORDER index sort ────────────────────────────────────────
    // GRADE_ORDER.indexOf returns 0 for PP1, 1 for PP2, … 10 for Grade 9.
    // Rows whose name is not in GRADE_ORDER get index -1 and are pushed to the end,
    // then sorted alphabetically among themselves.
    rows.sort((a, b) => {
      const idxA = GRADE_ORDER.indexOf(a.name);
      const idxB = GRADE_ORDER.indexOf(b.name);
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [totalStudents]);

  // ── Recent alerts state ──────────────────────────────────────────────────────
  // Only called inside FullAdminDashboard where the user has full dashboard access,
  // so no role-check guard is needed here — the router already guarantees access.
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);

  useEffect(() => {
    const buildAlerts = (): RecentAlert[] => {
      const activities = getRecentActivity(15); // limit to 15 most recent

      if (activities.length === 0) {
        return [];
      }

      return activities.map((act) => {
        const colors = getActivityColors(act.type);
        const typeLabel = getActivityTypeLabel(act.type);
        return {
          id: act.id,
          type: act.type,
          msg: `${typeLabel}: ${act.title}`,
          time: act.timestamp,
          color: colors.badge,
          dotClass: colors.dot,
          _ts: new Date(act.timestamp).getTime(),
        };
      });
    };

    setRecentAlerts(buildAlerts());
  }, [totalStudents, totalTeachers]);

  // Listen for real-time activity log changes
  useEffect(() => {
    const onActivityLogChanged = () => {
      const activities = getRecentActivity(15);
      if (activities.length === 0) {
        setRecentAlerts([]);
        return;
      }
      setRecentAlerts(activities.map((act) => {
        const colors = getActivityColors(act.type);
        const typeLabel = getActivityTypeLabel(act.type);
        return {
          id: act.id,
          type: act.type,
          msg: `${typeLabel}: ${act.title}`,
          time: act.timestamp,
          color: colors.badge,
          dotClass: colors.dot,
          _ts: new Date(act.timestamp).getTime(),
        };
      }));
    };

    window.addEventListener('munyaka:activity-log-changed', onActivityLogChanged);
    return () => window.removeEventListener('munyaka:activity-log-changed', onActivityLogChanged);
  }, []);

  // ── Simulation handlers ──────────────────────────────────────────────────────
  const pushFeeAlert = () => {
    const now = new Date();
    setRecentAlerts((prev) => [
      {
        id: `tx-live-${now.getTime()}`,
        type: 'fee',
        msg: `Fee payment: AUTO-GEN (KES ${(Math.floor(Math.random() * 9000) + 500).toLocaleString()})`,
        time: now.toISOString(),
        color: 'bg-orange-500',
        dotClass: 'bg-orange-400',
      },
      ...prev,
    ].slice(0, 12));
  };

  const pushRegAlert = () => {
    const now = new Date();
    const names = ['ALICE WAITHAKA', 'BRIAN MUTUA', 'CHRISTINE ACHIENG', 'DAVID KIPNG\'ENO'];
    setRecentAlerts((prev) => [
      {
        id: `reg-live-${now.getTime()}`,
        type: 'reg',
        msg: `New student registered: ${names[Math.floor(Math.random() * names.length)]}`,
        time: now.toISOString(),
        color: 'bg-emerald-500',
        dotClass: 'bg-emerald-500',
      },
      ...prev,
    ].slice(0, 12));
  };

  const pushAttnAlert = () => {
    const now = new Date();
    setRecentAlerts((prev) => [
      {
        id: `attn-live-${now.getTime()}`,
        type: 'attn',
        msg: `Attendance marked: ${Math.floor(Math.random() * 40) + 5} learner(s) present`,
        time: now.toISOString(),
        color: 'bg-purple-500',
        dotClass: 'bg-purple-400',
      },
      ...prev,
    ].slice(0, 12));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  // FullAdminDashboard is ONLY rendered when hasFullDashboardAccess(role) is true
  // (admin / head_teacher / dev). All school-wide executive widgets and the
  // full activity feed are gated here — no additional role check needed.
  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              System vitals for Munyaka Primary and Junior School.
            </p>
          </div>
          <LiveBadge label="LIVE FACTUAL SYNC" />
        </div>
      </div>

      {/* ── System Vitals Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          title="Total Students"
          value={isLoading ? '—' : totalStudents.toString()}
        />
        <StatCard
          icon={User}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          title="Total Teachers"
          value={isLoading ? '—' : totalTeachers.toString()}
        />
        <StatCard
          icon={UserCheck}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          title="Today's Attendance"
          value={isLoading ? '—' : `${todayAttendanceRate}%`}
        />
        <StatCard
          icon={GraduationCap}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          title="Junior School"
          value={isLoading ? '—' : juniorSchoolCount.toString()}
        />
        <StatCard
          icon={Activity}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          title="System Status"
          value="Live"
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          title="Fees Collected"
          value={isLoading ? '—' : feesCollected}
        />
      </div>

      {/* ── Attendance Trends (Weekly) ─────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Attendance Trends (Weekly)
          </CardTitle>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700 gap-1"
          >
            <TrendingUp size={10} />
            Real-time Data
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as WeeklyAttendancePoint;
                              if (!d.hasData || d.rate === null) {
                                return (
                                  <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                      {d.day} · {d.dateLabel}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-500 mt-1">
                                      No records
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Attendance has not been marked yet for this date.
                                    </p>
                                  </div>
                                );
                              }
                              return (
                                <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    {d.day} · {d.dateLabel}
                                  </p>
                                  <p className="text-xl font-black text-slate-900 mt-0.5">
                                    {d.rate}
                                    <span className="text-xs text-slate-400 font-medium ml-1">%</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {d.present} present / {d.enrolled} enrolled
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                          {weeklyData.map((entry) => {
                            // Unrecorded days → no fill (empty bar)
                            if (!entry.hasData || entry.rate === null) {
                              return <Cell key={entry.day} fill="transparent" stroke="#e2e8f0" strokeDasharray="3 3" />;
                            }
                            // Today's bar is highlighted in indigo; other recorded days in indigo-50/slate
                            const isToday = entry.day === TODAY_NAME;
                            return (
                              <Cell
                                key={entry.day}
                                fill={isToday ? '#6366f1' : '#a5b4fc'}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend explaining empty bars */}
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-indigo-500" /> Recorded today
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-indigo-300" /> Recorded (past)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded border border-dashed border-slate-300 bg-transparent" /> No records
                    </span>
                  </div>
                </CardContent>
      </Card>

      {/* ── Recent Alerts ──────────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-bold text-slate-800">Recent Alerts</CardTitle>
          <LiveBadge label="LIVE FACTUAL SYNC" />
        </CardHeader>
        <CardContent className="space-y-5">
          {recentAlerts.length === 0 ? (
            <EmptyAlertsState />
          ) : (
            recentAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))
          )}
        </CardContent>

        {/* Simulation Buttons */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pushFeeAlert}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <DollarSign size={12} />
            Simulate Fee
          </button>
          <button
            type="button"
            onClick={pushRegAlert}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <UsersRound size={12} />
            Simulate Reg
          </button>
          <button
            type="button"
            onClick={pushAttnAlert}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <User size={12} />
            Simulate Attendance
          </button>
        </div>
      </Card>

      {/* ── Current School Enrollment ───────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-800">
            Current School Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ClassParticipationTable rows={classRows} />
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;
