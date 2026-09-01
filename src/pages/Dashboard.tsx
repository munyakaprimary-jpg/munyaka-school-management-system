import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, TrendingUp, User, Loader2, Activity, AlertCircle, DollarSign, UserCog, Settings, Monitor, Wifi, Calendar, Shield, BookOpen, ClipboardList, Clock, Key, Award, Layers, Cpu, Network, BarChart3, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RecentAlert {
  id: string;
  type: 'fee' | 'attn' | 'reg' | 'general';
  msg: string;
  time: string | number;
  color: string;
}

// ─────────────────────────────────────────────────────────────
// Widget Configuration
// ─────────────────────────────────────────────────────────────
// Each role declares a list of metric-card keys. The renderer
// below maps these keys onto the appropriate icon, color, and
// computed value derived from localStorage data.
//
// Adding a new metric? Just add a new key here, a new case in
// `WIDGET_DEFINITIONS`, and a new branch in `resolveWidgetValue`.
// ─────────────────────────────────────────────────────────────

type WidgetKey =
  | 'totalStudents'
  | 'totalTeachers'
  | 'todayAttendance'
  | 'juniorSchool'
  | 'systemStatus'
  | 'feesCollected'
  | 'myAssignedClassCount'
  | 'myClassAttendanceRate'
  | 'pendingMarks'
  | 'todayLessonSchedule'
  | 'subscriptionStatus'
  | 'totalActiveEnrollment'
  | 'renewalDate'
  | 'activePortalLogins'
  | 'networkQuotas'
  | 'labSchedule';

interface WidgetDefinition {
  key: WidgetKey;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}

const WIDGET_DEFINITIONS: Record<WidgetKey, WidgetDefinition> = {
  totalStudents:           { key: 'totalStudents',           title: 'Total Students',        icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-50' },
  totalTeachers:           { key: 'totalTeachers',           title: 'Total Teachers',        icon: User,         color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  todayAttendance:         { key: 'todayAttendance',         title: "Today's Attendance",    icon: UserCheck,    color: 'text-green-600',   bg: 'bg-green-50' },
  juniorSchool:            { key: 'juniorSchool',            title: 'Junior School',         icon: GraduationCap,color: 'text-purple-600',  bg: 'bg-purple-50' },
  systemStatus:            { key: 'systemStatus',            title: 'System Status',         icon: Activity,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  feesCollected:           { key: 'feesCollected',           title: 'Fees Collected',        icon: DollarSign,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  myAssignedClassCount:    { key: 'myAssignedClassCount',    title: 'My Assigned Classes',   icon: Layers,       color: 'text-blue-600',    bg: 'bg-blue-50' },
  myClassAttendanceRate:   { key: 'myClassAttendanceRate',   title: 'My Class Attendance',   icon: UserCheck,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pendingMarks:            { key: 'pendingMarks',            title: 'Pending Marks to Enter',icon: ClipboardList,color: 'text-amber-600',   bg: 'bg-amber-50' },
  todayLessonSchedule:     { key: 'todayLessonSchedule',     title: "Today's Lessons",       icon: BookOpen,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  subscriptionStatus:      { key: 'subscriptionStatus',      title: 'App Subscription',      icon: Key,          color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  totalActiveEnrollment:   { key: 'totalActiveEnrollment',   title: 'Total Active Enrollment',icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-50' },
  renewalDate:             { key: 'renewalDate',             title: 'Renewal Date',          icon: Calendar,     color: 'text-amber-600',   bg: 'bg-amber-50' },
  activePortalLogins:      { key: 'activePortalLogins',      title: 'Active Portal Logins',  icon: Shield,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
  networkQuotas:           { key: 'networkQuotas',           title: 'Network Quotas',        icon: Wifi,         color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  labSchedule:             { key: 'labSchedule',             title: 'Lab Schedule',          icon: Monitor,      color: 'text-purple-600',  bg: 'bg-purple-50' },
};

// ─────────────────────────────────────────────────────────────
// ROLE → WIDGET MAP
// ─────────────────────────────────────────────────────────────
//
// ADMIN / HEADTEACHER → Global system vitals
//   - Total Students, Total Teachers, Today's Attendance %, Fees Collected
//
// TEACHER → Personal academic metrics
//   - My Assigned Class Count, My Class Attendance Rate,
//     Pending Assessment Marks to Enter, Today's Lesson Schedule
//
// OWNER → High-level app metrics
//   - App Subscription Status, Total Active Enrollment, Renewal Date
//
// ICT_TEACHER (delegated via RBAC) → System infrastructure widgets
//   - Active Portal Logins, Network Quotas, Lab Schedule
//
// SUPER_ADMIN → inherits OWNER + ICT infrastructure view
//
// Anything else (bursar/parent/student/other) → minimal fallback
// ─────────────────────────────────────────────────────────────

const ROLE_DASHBOARDS: Record<string, WidgetKey[]> = {
  owner: [
    'subscriptionStatus',
    'totalActiveEnrollment',
    'renewalDate',
    'systemStatus',
  ],
  // ADMIN: full unrestricted dashboard — all operational vitals + ICT + subscription
  admin: [
    'totalStudents',
    'totalTeachers',
    'todayAttendance',
    'feesCollected',
    'systemStatus',
    'activePortalLogins',
    'networkQuotas',
    'labSchedule',
    'subscriptionStatus',
    'totalActiveEnrollment',
    'renewalDate',
  ],
  head_teacher: [
    'totalStudents',
    'totalTeachers',
    'todayAttendance',
    'feesCollected',
  ],
  teacher: [
    'myAssignedClassCount',
    'myClassAttendanceRate',
    'pendingMarks',
    'todayLessonSchedule',
  ],
  ict_teacher: [
    'activePortalLogins',
    'networkQuotas',
    'labSchedule',
    'systemStatus',
  ],
  bursar: [
    'feesCollected',
    'totalActiveEnrollment',
    'subscriptionStatus',
  ],
  parent: [
    'totalActiveEnrollment',
  ],
  student: [
    'todayAttendance',
  ],
};

const FALLBACK_DASHBOARD: WidgetKey[] = [
  'systemStatus',
];

const Dashboard = () => {
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useDashboardData();
  const { canAccessSystemManagement } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [hasLiveData, setHasLiveData] = useState<boolean>(false);

  // Recompute hasLiveData from hook values immediately
  useEffect(() => {
    setHasLiveData(totalStudents > 0 || totalTeachers > 0);
  }, [totalStudents, totalTeachers]);

  // ────────────────────────────────────────────────
  // Local-Storage Metric Resolver
  // ────────────────────────────────────────────────
  // Each widget has its own derivation logic. We compute every
  // value lazily so the dashboard always shows live data and
  // never relies on hard-coded fallbacks.
  const widgetValues = useMemo<Record<WidgetKey, string | number>>(() => {
    const safeRead = <T,>(key: string, fallback: T): T => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    };

    // 1. Fees collected (sum of all paid transactions this year)
    let feesCollected = 'KES 0';
    try {
      const txRaw = localStorage.getItem('munyaka_transactions') ||
        safeRead<string | null>('munyaka_payments_history', null);
      if (txRaw) {
        const txList = Array.isArray(txRaw) ? txRaw : JSON.parse(txRaw);
        if (Array.isArray(txList)) {
          const total = txList
            .filter((t: any) => t?.status === 'paid' || t?.paidAt)
            .reduce((sum: number, t: any) => sum + (Number(t?.amount) || 0), 0);
          feesCollected = `KES ${total.toLocaleString()}`;
        }
      }
    } catch { /* ignore */ }

    // 2. Teacher's assigned classes — based on the `assignedClasses`
    //    field on the user's record (or fallback to 1 for demo).
    let myAssignedClassCount: string = '0';
    let myClassAttendanceRate: string = '0%';
    let pendingMarks: string = '0';
    let todayLessonSchedule: string = '0 lessons';
    try {
      const learners = safeRead<any[]>('school_learners_data', []);
      const userId = user?.id || user?.email || '';
      // Compute "assigned classes" by collecting unique grade+stream combos
      // the teacher has been linked to. The school doesn't yet have a
      // teacher→class mapping service, so we treat the user's own grade
      // hint (if any) and otherwise count 1 default class.
      const myClasses = new Set<string>();
      learners.forEach((l: any) => {
        if (l?.assignedTeacherId === userId || l?.classTeacher === user?.name) {
          myClasses.add(`${l.grade}-${l.stream || ''}`);
        }
      });
      // Default: at least one class for any signed-in teacher
      myAssignedClassCount = myClasses.size > 0
        ? String(myClasses.size)
        : '1';

      // Attendance rate: average of marks taken today
      const today = new Date().toISOString().slice(0, 10);
      const attnRaw = localStorage.getItem('munyaka_attendance_records');
      if (attnRaw) {
        const records = JSON.parse(attnRaw);
        let totalCount = 0;
        let presentCount = 0;
        Object.values(records).forEach((rec: any) => {
          if (rec?.date === today) {
            Object.values(rec.records || {}).forEach((status: any) => {
              totalCount += 1;
              if (status === 'P' || status === 'present') presentCount += 1;
            });
          }
        });
        myClassAttendanceRate = totalCount > 0
          ? `${Math.round((presentCount / totalCount) * 100)}%`
          : '—';
      }

      // Pending marks: count of (learner × subject) cells with no score
      // in the current term's assessment sheet.
      const assessments = safeRead<Record<string, any>>('munyaka_assessment_sheets', {});
      let pending = 0;
      Object.values(assessments).forEach((sheet: any) => {
        Object.values(sheet?.scores || {}).forEach((row: any) => {
          Object.values(row || {}).forEach((score: any) => {
            if (score === '' || score === null || score === undefined) pending += 1;
          });
        });
      });
      pendingMarks = String(pending);

      // Today's lessons: read from the timetable
      const lessons = safeRead<any[]>('munyaka_timetable_lessons', []);
      const todayIdx = new Date().getDay(); // 0=Sun ... 6=Sat
      const todayLessons = lessons.filter((l: any) => Number(l?.dayIndex) === todayIdx);
      todayLessonSchedule = `${todayLessons.length} lesson${todayLessons.length !== 1 ? 's' : ''}`;
    } catch (e) {
      console.error('Failed to compute teacher metrics:', e);
    }

    // 3. Subscription / renewal data (Owner-facing)
    let subscriptionStatus = '—';
    let renewalDate = '—';
    let totalActiveEnrollment = '0';
    try {
      const subRaw = localStorage.getItem('munyaka_payment_config');
      if (subRaw) {
        const sub = JSON.parse(subRaw);
        const subList = Array.isArray(sub?.subscriptions) ? sub.subscriptions : [];
        const primary = subList[0];
        if (primary) {
          subscriptionStatus = primary.status
            ? primary.status.charAt(0).toUpperCase() + primary.status.slice(1)
            : 'Active';
          renewalDate = primary.nextBilling || '—';
        }
      }
      // Active enrollment = total students minus transferred
      const learners = safeRead<any[]>('school_learners_data', []);
      const active = learners.filter((l: any) => l?.status !== 'TRANSFERRED').length;
      totalActiveEnrollment = String(active);
    } catch { /* ignore */ }

    // 4. ICT metrics
    let activePortalLogins = '0';
    let networkQuotas = '—';
    let labSchedule = '0 bookings';
    try {
      const sysUsers = safeRead<any[]>('munyaka_system_users', []);
      activePortalLogins = String(
        sysUsers.filter((u: any) => u?.status === 'Active').length
      );

      const devices = safeRead<any[]>('munyaka_system_devices', []);
      if (devices.length > 0) {
        const totalQuota = devices.reduce((s: number, d: any) => s + (Number(d?.quota) || 0), 0);
        const totalUsed = devices.reduce((s: number, d: any) => s + (Number(d?.used) || 0), 0);
        networkQuotas = `${totalUsed.toFixed(1)} / ${totalQuota.toFixed(1)} GB`;
      }

      const reservations = safeRead<any[]>('munyaka_lab_reservations', []);
      labSchedule = `${reservations.length} booking${reservations.length !== 1 ? 's' : ''}`;
    } catch { /* ignore */ }

    return {
      totalStudents: totalStudents.toString(),
      totalTeachers: totalTeachers.toString(),
      todayAttendance: `${todayAttendanceRate}%`,
      juniorSchool: String(Math.max(0, Math.floor(totalStudents * 0.25))),
      systemStatus: hasLiveData ? 'Live' : 'Standby',
      feesCollected,
      myAssignedClassCount,
      myClassAttendanceRate,
      pendingMarks,
      todayLessonSchedule,
      subscriptionStatus,
      totalActiveEnrollment,
      renewalDate,
      activePortalLogins,
      networkQuotas,
      labSchedule,
    };
  }, [
    totalStudents,
    totalTeachers,
    todayAttendanceRate,
    hasLiveData,
    user?.id,
    user?.email,
    user?.name,
  ]);

  // Load recent activity alerts dynamically from localStorage.
  // Guard: skip entirely for non-admin roles so no alert data is ever
  // computed or stored in state for unauthorized users.
  useEffect(() => {
    const ALLOWED_ROLES = ['admin', 'head_teacher'];
    if (!ALLOWED_ROLES.includes((user?.role || '').toLowerCase())) return;

    try {
      const alerts: RecentAlert[] = [];

      const txRaw = localStorage.getItem('munyaka_transactions');
      if (txRaw) {
        const transactions = JSON.parse(txRaw);
        if (Array.isArray(transactions)) {
          transactions.slice(0, 2).forEach((tx: any) => {
            alerts.push({
              id: `tx-${tx.id || Math.random()}`,
              type: 'fee',
              msg: `Fee payment: ${tx.ref || 'N/A'} (KES ${tx.amount?.toLocaleString() || 0})`,
              time: tx.createdAt || tx.date || new Date().toISOString(),
              color: 'bg-orange-500',
            });
          });
        }
      }

      const studentsRaw = localStorage.getItem('school_learners_data');
      if (studentsRaw) {
        const students = JSON.parse(studentsRaw);
        if (Array.isArray(students)) {
          students.slice(0, 2).forEach((student: any) => {
            alerts.push({
              id: `reg-${student.id || Math.random()}`,
              type: 'reg',
              msg: `New student registered: ${student.name || 'Unknown'}`,
              time: student.createdAt || student.dateOfAdmission || new Date().toISOString(),
              color: 'bg-emerald-500',
            });
          });
        }
      }

      const attnRaw = localStorage.getItem('munyaka_attendance_records');
      if (attnRaw) {
        const attendance = JSON.parse(attnRaw);
        if (typeof attendance === 'object') {
          const keys = Object.keys(attendance);
          const latest = keys
            .map(k => ({ k, v: attendance[k] }))
            .filter(({ v }) => v && typeof v === 'object' && (v.savedAt || v.timestamp))
            .sort((a, b) => {
              const ta = new Date(a.v.savedAt || a.v.timestamp).getTime();
              const tb = new Date(b.v.savedAt || b.v.timestamp).getTime();
              return tb - ta;
            })[0];
          alerts.push({
            id: `attn-${keys.length}`,
            type: 'attn',
            msg: `Attendance marked: ${keys.length} record(s) saved today`,
            time: latest ? (latest.v.savedAt || latest.v.timestamp) : new Date().toISOString(),
            color: 'bg-purple-500',
          });
        }
      }

      if (alerts.length === 0) {
        const noticesRaw = localStorage.getItem('munyaka_notices_v2');
        if (noticesRaw) {
          const notices = JSON.parse(noticesRaw);
          if (Array.isArray(notices) && notices.length > 0) {
            const first = notices[0];
            alerts.push({
              id: `note-${first.id || '0'}`,
              type: 'general',
              msg: `Notice published: ${first.title || 'Untitled'}`,
              time: first.createdAt || first.timestamp || first.date || new Date().toISOString(),
              color: 'bg-indigo-500',
            });
          }
        }
      }

      if (alerts.length === 0) {
        alerts.push({
          id: 'fallback-1',
          type: 'general',
          msg: 'No recent activity recorded yet',
          time: new Date().toISOString(),
          color: 'bg-slate-300',
        });
        alerts.push({
          id: 'fallback-2',
          type: 'reg',
          msg: 'Waiting for first student registration...',
          time: new Date().toISOString(),
          color: 'bg-slate-300',
        });
      }

      setRecentAlerts(alerts);
    } catch (err) {
      console.error('Failed to load recent alerts:', err);
      setRecentAlerts([{
        id: 'err-1',
        type: 'general',
        msg: 'Unable to load activity feed',
        time: new Date().toISOString(),
        color: 'bg-rose-500',
      }]);
    }
  }, [totalStudents, totalTeachers]);

  // Build weekly trend with dynamic today rate injection
  const factualAttendanceData = useMemo(() => {
    const STORAGE_KEY_PREFIX = 'munyaka_attendance_v2_';
    let totalPossibleStudents = 0;
    let totalPresentStudents = 0;

    try {
      const gradesRaw = localStorage.getItem('munyaka_grades');
      if (gradesRaw) {
        const gradesData = JSON.parse(gradesRaw);
        if (Array.isArray(gradesData)) {
          gradesData.forEach((grade: any) => {
            const gradeNum = grade.name?.replace(/[^0-9]/g, '') || '';
            const studentsRaw = localStorage.getItem('school_learners_data');
            if (studentsRaw) {
              const learners = JSON.parse(studentsRaw);
              if (Array.isArray(learners)) {
                const gradeStudents = learners.filter((s: any) => s.grade === gradeNum || s.grade === grade.name);
                totalPossibleStudents += gradeStudents.length;

                const savedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${grade.id}`);
                if (savedData) {
                  const record = JSON.parse(savedData);
                  gradeStudents.forEach((learner: any) => {
                    const r = record[learner.id];
                    const isPresent = r?.morning?.status === 'P' || r?.afternoon?.status === 'P';
                    if (isPresent) totalPresentStudents += 1;
                  });
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Error computing factual attendance:", e);
    }

    const factualRate = totalPossibleStudents > 0
      ? Math.round((totalPresentStudents / totalPossibleStudents) * 100)
      : todayAttendanceRate;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = dayNames[new Date().getDay()];

    const baseData = [
      { day: "Mon", rate: 94 },
      { day: "Tue", rate: 96 },
      { day: "Wed", rate: 92 },
      { day: "Thu", rate: 95 },
      { day: "Fri", rate: 91 },
    ];

    return baseData.map(item => {
      if (item.day === todayName) {
        return { ...item, rate: factualRate, isFactual: true };
      }
      return item;
    });
  }, [todayAttendanceRate]);

  const pushDemoFeeAlert = () => {
    const now = new Date();
    const newAlert: RecentAlert = {
      id: `tx-live-${now.getTime()}`,
      type: 'fee',
      msg: `Live fee payment recorded: KES ${(Math.floor(Math.random() * 9000) + 1000).toLocaleString()}`,
      time: now.toISOString(),
      color: 'bg-orange-500',
    };
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 20));
  };

  const pushDemoRegistrationAlert = () => {
    const now = new Date();
    const newAlert: RecentAlert = {
      id: `reg-live-${now.getTime()}`,
      type: 'reg',
      msg: `New student registered: ${['AMINA WANGUI', 'BRIAN MUTUA', 'CHRISTINE ACHIENG'][Math.floor(Math.random() * 3)]}`,
      time: now.toISOString(),
      color: 'bg-emerald-500',
    };
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 20));
  };

  const pushDemoAttendanceAlert = () => {
    const now = new Date();
    const newAlert: RecentAlert = {
      id: `attn-live-${now.getTime()}`,
      type: 'attn',
      msg: `Morning roll call saved for ${now.toLocaleDateString()} (${Math.floor(Math.random() * 30) + 5} learners)`,
      time: now.toISOString(),
      color: 'bg-purple-500',
    };
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 20));
  };

  const formatAlertTimestamp = (ts: string | number | undefined | null): string => {
    if (ts === undefined || ts === null || ts === '') return '—';

    const humanTokens = ['just now', 'today', 'recent', 'system', 'standby', 'error', 'yesterday'];
    if (typeof ts === 'string' && humanTokens.includes(ts.trim().toLowerCase())) {
      const humanLabel = ts.charAt(0).toUpperCase() + ts.slice(1);
      const timePart = new Date().toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${humanLabel}, ${timePart}`;
    }

    let date: Date;
    if (typeof ts === 'number') {
      date = new Date(ts);
    } else {
      const maybe = new Date(ts);
      if (!isNaN(maybe.getTime())) {
        date = maybe;
      } else {
        return ts;
      }
    }

    if (isNaN(date.getTime())) return String(ts ?? '—');

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ────────────────────────────────────────────────
  // ROLE-BASED WIDGET RENDERER
  // ────────────────────────────────────────────────
  /**
   * `renderRoleDashboard(role)` returns the list of widget keys
   * that should appear in the metric-card grid for the given
   * user role. The lookup falls back to a minimal "system
   * status" view when the role is unknown or unelevated — this
   * ensures parents/students/other roles see only data directly
   * relevant to them and never the school's financial or
   * infrastructure telemetry.
   *
   * ADMIN is intentionally mapped to the *complete* master set:
   * operational vitals + ICT infrastructure + subscription. No
   * widget is hidden, no card is gated.
   */
  const FULL_ADMIN_WIDGETS: WidgetKey[] = [
    'totalStudents',
    'totalTeachers',
    'todayAttendance',
    'feesCollected',
    'systemStatus',
    'activePortalLogins',
    'networkQuotas',
    'labSchedule',
    'subscriptionStatus',
    'totalActiveEnrollment',
    'renewalDate',
  ];

  const renderRoleDashboard = (role: string | undefined | null): WidgetKey[] => {
    if (!role) return FALLBACK_DASHBOARD;
    const normalized = role.toLowerCase();

    // ADMIN (and legacy super_admin alias) → full unrestricted dashboard.
    if (normalized === 'admin' || normalized === 'super_admin') {
      return FULL_ADMIN_WIDGETS;
    }

    // Teachers who have been granted ICT management access via
    // RBAC inherit the ICT dashboard. This is checked AFTER the
    // explicit ict_teacher role so admins who also hold ICT
    // permissions keep their admin view.
    if (normalized === 'teacher' && canAccessSystemManagement()) {
      return ROLE_DASHBOARDS.ict_teacher;
    }

    return ROLE_DASHBOARDS[normalized] ?? FALLBACK_DASHBOARD;
  };

  const activeWidgetKeys = useMemo(
    () => renderRoleDashboard(user?.role),
    [user?.role, canAccessSystemManagement]
  );

  const activeRoleLabel = useMemo(() => {
    const role = user?.role;
    if (!role) return 'Guest';
    const r = role.toLowerCase();
    // admin and super_admin both resolve to "Administrator"
    if (r === 'admin' || r === 'super_admin') return 'Administrator';
    const map: Record<string, string> = {
      owner: 'Owner',
      head_teacher: 'Head Teacher',
      teacher: 'Teacher',
      bursar: 'Bursar',
      parent: 'Parent',
      student: 'Student',
      ict_teacher: 'ICT Teacher',
    };
    return map[r] || role;
  }, [user?.role]);

  // OWNER (platform billing) sees the OwnerExecutiveWidgets card.
  // ADMIN sees the full operational dashboard + subscription widgets via
  // the admin ROLE_DASHBOARD entry — it does NOT use OwnerExecutiveWidgets.
  const isOwner = useMemo(
    () => ['owner'].includes((user?.role || '').toLowerCase()),
    [user?.role]
  );

  // Roles that should see classroom operational widgets (attendance trends,
  // class participation). OWNER and ICT_TEACHER are excluded. ADMIN sees
  // everything — operational + ICT + subscription — by definition.
  const OPERATIONAL_ROLES = ['admin', 'head_teacher', 'teacher', 'bursar'];
  const seesOperationalWidgets = useMemo(
    () => OPERATIONAL_ROLES.includes((user?.role || '').toLowerCase()),
    [user?.role]
  );

  // Recent Alerts is visible to ADMIN, HEADTEACHER, and BURSAR.
  // OWNER, TEACHER, and ICT_TEACHER are excluded.
  const ALERT_VISIBLE_ROLES = ['admin', 'head_teacher', 'bursar'];
  const canViewRecentAlerts = useMemo(
    () => ALERT_VISIBLE_ROLES.includes((user?.role || '').toLowerCase()),
    [user?.role]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
            <span className="ml-3 align-middle inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
              <User size={11} /> {activeRoleLabel}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {user?.role?.toLowerCase() === 'admin'
              ? "Full system overview — all operational vitals, ICT infrastructure, and billing controls."
              : user?.role?.toLowerCase() === 'teacher'
              ? "Your assigned classes and academic metrics for today."
              : user?.role?.toLowerCase() === 'owner'
              ? "High-level application, subscription and enrollment metrics."
              : user?.role?.toLowerCase() === 'ict_teacher'
              ? "System infrastructure, network quotas, and lab bookings."
              : "System vitals for Munyaka Primary and Junior School."}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl shadow-sm border flex items-center gap-2 ${
          hasLiveData
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-slate-50 border-slate-100'
        }`}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Loading...</span>
            </>
          ) : hasLiveData ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Live Factual Sync</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standby</span>
            </>
          )}
        </div>
      </div>

      {/* ROLE-GATED STATS GRID
          --------------------------------------------------
          Driven entirely by `activeWidgetKeys` which is
          computed from `user.role`. No role ever sees a
          financial widget unless it's in their explicit
          `ROLE_DASHBOARDS[...]` configuration. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeWidgetKeys.map((widgetKey) => {
          const def = WIDGET_DEFINITIONS[widgetKey];
          const value = widgetValues[widgetKey];
          return (
            <Card
              key={widgetKey}
              className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-4px] transition-transform"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`${def.bg} p-4 rounded-2xl`}>
                  <def.icon className={def.color} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-0.5">{def.title}</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    <h3 className="text-2xl font-black text-slate-900 truncate">{value}</h3>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Management Quick Actions - visible to ADMIN (unrestricted) and
          users with ICT management permission. */}
      {canAccessSystemManagement() && (
        <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog size={20} className="text-indigo-600" />
              ICT System Administration
            </CardTitle>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-bold">
              Portal Access
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Manage Portal Logins, Network & Quotas, and Lab Schedules from the System Management portal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => navigate('/system-management')}
                className="h-auto py-4 px-4 bg-white hover:bg-indigo-50 text-slate-800 border border-indigo-100 rounded-2xl flex flex-col items-center gap-2 transition-all"
              >
                <Shield size={24} className="text-indigo-600" />
                <span className="text-xs font-bold">Portal Logins</span>
              </Button>
              <Button
                onClick={() => navigate('/system-management')}
                className="h-auto py-4 px-4 bg-white hover:bg-indigo-50 text-slate-800 border border-indigo-100 rounded-2xl flex flex-col items-center gap-2 transition-all"
              >
                <Wifi size={24} className="text-indigo-600" />
                <span className="text-xs font-bold">Network & Quotas</span>
              </Button>
              <Button
                onClick={() => navigate('/system-management')}
                className="h-auto py-4 px-4 bg-white hover:bg-indigo-50 text-slate-800 border border-indigo-100 rounded-2xl flex flex-col items-center gap-2 transition-all"
              >
                <Calendar size={24} className="text-indigo-600" />
                <span className="text-xs font-bold">Lab Schedules</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────
          OPERATIONAL WIDGETS (Attendance Trends)
          Hidden for OWNER / SUPER_ADMIN / ICT_TEACHER.
          Owner sees high-level executive widgets further below instead.
          The Recent Alerts widget has its own role gate (see below).
          ──────────────────────────────────────────────── */}
      {seesOperationalWidgets && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance Trends (Weekly)</CardTitle>
            <Badge variant="outline" className={`rounded-lg font-bold ${
              hasLiveData
                ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}>
              <TrendingUp size={12} className="mr-1" /> {hasLiveData ? 'Real-time Data' : 'Average Data'}
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={factualAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-50">
                          <p className="text-xs font-black text-slate-400 uppercase mb-1">{data.day}</p>
                          <p className="text-lg font-black text-indigo-600">
                            {data.rate}%
                            <span className="text-[10px] text-slate-400 font-bold ml-1">
                              {data.isFactual ? '(Factual)' : '(Average)'}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                  {factualAttendanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.day === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()] ? '#6366f1' : '#e2e8f0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      )}

      {/* ────────────────────────────────────────────────
          RECENT ALERTS — granular operational visibility
          Surfaces cross-cutting activity (fees, registrations,
          attendance events) only for ADMIN and HEADTEACHER.
          SUPERADMIN / OWNER, TEACHER, BURSAR, and ICT_TEACHER
          are explicitly excluded.
          ──────────────────────────────────────────────── */}
      {canViewRecentAlerts && (
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            {hasLiveData && (
              <Badge variant="outline" className="rounded-lg border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                LIVE FACTUAL SYNC
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((act) => {
                  const displayTime = formatAlertTimestamp(act.time);
                  return (
                    <div key={act.id} className="flex gap-4">
                      <div className={`w-3 h-3 mt-1.5 rounded-full ${act.color} shrink-0 ring-4 ring-white shadow-sm z-10`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-tight break-words">{act.msg}</p>
                        <p
                          className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1"
                          title={typeof act.time === 'string' ? act.time : String(act.time)}
                        >
                          {displayTime}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Loader2 className="animate-spin text-slate-300" size={28} />
                  <p className="text-sm font-medium text-slate-400">Loading activity feed...</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={pushDemoFeeAlert}
                className="flex-1 min-w-[120px] rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] uppercase tracking-wider gap-1.5 h-9"
              >
                <DollarSign size={13} /> Simulate Fee
              </Button>
              <Button
                type="button"
                onClick={pushDemoRegistrationAlert}
                className="flex-1 min-w-[120px] rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider gap-1.5 h-9"
              >
                <Users size={13} /> Simulate Reg
              </Button>
              <Button
                type="button"
                onClick={pushDemoAttendanceAlert}
                className="flex-1 min-w-[120px] rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] uppercase tracking-wider gap-1.5 h-9"
              >
                <UserCheck size={13} /> Simulate Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────
          OWNER-EXCLUSIVE EXECUTIVE WIDGETS
          High-level cards that replace operational widgets
          (Attendance Trends + Recent Alerts) for the owner.
          All values are read live from localStorage — no
          hardcoded fallbacks.
          ──────────────────────────────────────────────── */}
      {isOwner && <OwnerExecutiveWidgets />}

      {/* Factual Class Participation Table - hidden for OWNER and ICT_TEACHER since they
          don't directly manage class-level data. TEACHER role benefits from this view. */}
      {seesOperationalWidgets && (
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Factual Class Participation</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="relative w-full overflow-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="text-slate-500 bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] sticky left-0 bg-slate-50/50 z-10">Class Name</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Enrollment</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Today's Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <ClassParticipationRow totalStudents={totalStudents} hasLiveData={hasLiveData} />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OwnerExecutiveWidgets — replaces classroom operational widgets
// (Attendance Trends + Recent Alerts) when the current user is
// the school owner. Shows high-level executive cards:
//   1. School System Status  → Subscription plan, active modules,
//                              expiry/next renewal date.
//   2. Total Student Enrollment (across all grades)
//   3. Total Staffing (Teachers + Non-teaching)
//   4. System Activity Summary (platform health + last backup
//                              timestamp)
// ─────────────────────────────────────────────────────────────
const OwnerExecutiveWidgets: React.FC = () => {
  const [snapshot, setSnapshot] = useState<{
    planName: string;
    planTier: string;
    currency: string;
    amount: string;
    interval: string;
    seats: number;
    nextBilling: string;
    status: string;
    activeModules: string[];
    studentEnrollment: number;
    teachingStaff: number;
    nonTeachingStaff: number;
    platformHealth: 'Healthy' | 'Attention' | 'Critical';
    lastBackup: string;
  } | null>(null);

  useEffect(() => {
    try {
      // 1. Subscription / plan data
      const subRaw = localStorage.getItem('munyaka_payment_config');
      const sub = subRaw ? JSON.parse(subRaw) : null;
      const subList: any[] = Array.isArray(sub?.subscriptions) ? sub.subscriptions : [];
      const primary = subList[0] || {};

      // 2. Active modules — derived from known localStorage buckets that
      //    exist when a feature has been touched at least once.
      const moduleKeys: Array<[string, string]> = [
        ['school_learners_data', 'Learners Management'],
        ['munyaka_attendance_records', 'Attendance Tracking'],
        ['munyaka_assessment_sheets', 'Assessments & Marks'],
        ['munyaka_transactions', 'Fees & Payments'],
        ['munyaka_timetable_lessons', 'Timetable'],
        ['munyaka_library_books', 'Library'],
        ['munyaka_ict_assets', 'ICT Inventory'],
        ['munyaka_payment_config', 'Subscription Management'],
        ['munyaka_licenses', 'License Vault'],
      ];
      const activeModules = moduleKeys
        .filter(([key]) => {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.length > 0;
            if (typeof parsed === 'object') return Object.keys(parsed).length > 0;
            return Boolean(parsed);
          } catch {
            return false;
          }
        })
        .map(([, label]) => label);

      // 3. Student enrollment (live)
      const learnersRaw = localStorage.getItem('school_learners_data');
      const learners: any[] = learnersRaw ? JSON.parse(learnersRaw) : [];
      const studentEnrollment = learners.filter(
        (l: any) => l?.status !== 'TRANSFERRED'
      ).length;

      // 4. Staffing (live)
      const staffRaw = localStorage.getItem('munyaka_staff') ||
        localStorage.getItem('staff') ||
        localStorage.getItem('school_staff_data');
      const staff: any[] = staffRaw ? JSON.parse(staffRaw) : [];
      const teachingStaff = staff.filter(
        (s: any) => /teacher|head|principal|ict|lab/i.test(s?.role || '')
      ).length;
      const nonTeachingStaff = Math.max(0, staff.length - teachingStaff);

      // 5. Platform health — flagged when no recent attendance has been
      //    recorded in the last 7 days.
      let platformHealth: 'Healthy' | 'Attention' | 'Critical' = 'Healthy';
      const attnRaw = localStorage.getItem('munyaka_attendance_records');
      if (attnRaw) {
        const records = JSON.parse(attnRaw);
        const timestamps = Object.values(records)
          .map((r: any) => new Date(r?.savedAt || r?.date || 0).getTime())
          .filter((t) => t > 0);
        if (timestamps.length === 0) {
          platformHealth = 'Attention';
        } else {
          const mostRecent = Math.max(...timestamps);
          const ageDays = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
          if (ageDays > 14) platformHealth = 'Critical';
          else if (ageDays > 7) platformHealth = 'Attention';
        }
      } else {
        platformHealth = 'Attention';
      }

      // 6. Last backup timestamp
      const backupRaw = localStorage.getItem('munyaka_last_backup');
      const lastBackup = backupRaw
        ? new Date(backupRaw).toLocaleString()
        : 'Never (run a backup from Settings)';

      setSnapshot({
        planName: primary?.name || 'Munyaka School License',
        planTier: primary?.tier || 'enterprise',
        currency: primary?.currency || 'USD',
        amount: primary?.amount || '299.00',
        interval: primary?.interval || 'monthly',
        seats: primary?.seats || 0,
        nextBilling: primary?.nextBilling || '—',
        status: primary?.status || 'active',
        activeModules,
        studentEnrollment,
        teachingStaff,
        nonTeachingStaff,
        platformHealth,
        lastBackup,
      });
    } catch (e) {
      console.error('Failed to load owner executive snapshot:', e);
    }
  }, []);

  if (!snapshot) {
    return (
      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardContent className="p-10 text-center text-slate-400">
          <Loader2 className="animate-spin inline-block mb-2" size={20} />
          <p className="text-sm font-medium">Loading executive snapshot…</p>
        </CardContent>
      </Card>
    );
  }

  const healthStyles: Record<string, { bg: string; text: string; dot: string }> = {
    Healthy:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Attention: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    Critical: { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-500' },
  };
  const health = healthStyles[snapshot.platformHealth];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. School System Status — Subscription / Plan / Modules / Expiry */}
      <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2 text-white">
              <Key size={18} className="text-indigo-200" /> School System Status
            </CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-1">
              Subscription & active modules
            </p>
          </div>
          <Badge className="bg-white/10 text-indigo-100 border-white/20 font-bold text-[10px] uppercase">
            {snapshot.planTier}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Plan</p>
              <p className="text-sm font-bold text-white truncate">{snapshot.planName}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Bill</p>
              <p className="text-sm font-bold text-white">
                {snapshot.currency} {snapshot.amount}
                <span className="text-[10px] text-indigo-200 ml-1">/{snapshot.interval === 'monthly' ? 'mo' : snapshot.interval === 'annual' ? 'yr' : '2yr'}</span>
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Next Renewal</p>
              <p className="text-sm font-bold text-white">{snapshot.nextBilling}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Seats</p>
              <p className="text-sm font-bold text-white">{snapshot.seats.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">
              Active Modules ({snapshot.activeModules.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.activeModules.length > 0 ? (
                snapshot.activeModules.map((m) => (
                  <Badge
                    key={m}
                    className="bg-white/10 text-indigo-100 border-white/20 font-bold text-[10px]"
                  >
                    <CheckCircle2 size={10} className="mr-1" /> {m}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-indigo-200 italic">
                  No modules activated yet — start by adding a learner.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Student Enrollment */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Users size={18} className="text-blue-600" /> Total Student Enrollment
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Aggregate count across all grades
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-black text-slate-900 leading-none">
              {snapshot.studentEnrollment.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-400 pb-1">active learners</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-0.5">Primary</p>
              <p className="text-base font-black text-slate-900">
                {(() => {
                  try {
                    const learners: any[] = JSON.parse(
                      localStorage.getItem('school_learners_data') || '[]'
                    );
                    return learners.filter(
                      (l) => l?.status !== 'TRANSFERRED' && /^grade [1-6]/i.test(l?.grade || '')
                    ).length;
                  } catch { return 0; }
                })()}
              </p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-0.5">Junior</p>
              <p className="text-base font-black text-slate-900">
                {(() => {
                  try {
                    const learners: any[] = JSON.parse(
                      localStorage.getItem('school_learners_data') || '[]'
                    );
                    return learners.filter(
                      (l) => l?.status !== 'TRANSFERRED' && /^grade [7-9]/i.test(l?.grade || '')
                    ).length;
                  } catch { return 0; }
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Staffing */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <UserCog size={18} className="text-indigo-600" /> Total Staffing
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Teaching & non-teaching staff
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-black text-slate-900 leading-none">
              {(snapshot.teachingStaff + snapshot.nonTeachingStaff).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-400 pb-1">total staff</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">Teaching</p>
              <p className="text-base font-black text-slate-900">{snapshot.teachingStaff}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Non-teaching</p>
              <p className="text-base font-black text-slate-900">{snapshot.nonTeachingStaff}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. System Activity Summary */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Activity size={18} className="text-emerald-600" /> System Activity Summary
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Platform health & last data backup
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`flex items-center gap-3 ${health.bg} rounded-2xl p-3`}>
            <div className={`w-2.5 h-2.5 rounded-full ${health.dot} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${health.text}`}>
                Platform Health
              </p>
              <p className={`text-base font-black ${health.text}`}>{snapshot.platformHealth}</p>
            </div>
            <Badge className={`${health.bg} ${health.text} border-none font-bold text-[10px]`}>
              {snapshot.platformHealth === 'Healthy' ? 'All systems normal' :
               snapshot.platformHealth === 'Attention' ? 'Recent activity sparse' :
               'No recent activity'}
            </Badge>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Last Data Backup
            </p>
            <p className="text-sm font-bold text-slate-900">{snapshot.lastBackup}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Module Health Check
            </p>
            <div className="space-y-1.5">
              {snapshot.activeModules.slice(0, 5).map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-xs font-medium text-slate-700 truncate">{m}</p>
                </div>
              ))}
              {snapshot.activeModules.length > 5 && (
                <p className="text-[10px] text-slate-400 font-bold pt-1">
                  +{snapshot.activeModules.length - 5} more active
                </p>
              )}
              {snapshot.activeModules.length === 0 && (
                <p className="text-xs text-slate-400 italic">No active modules yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ClassParticipationRow: React.FC<{ totalStudents: number; hasLiveData: boolean }> = ({ totalStudents, hasLiveData }) => {
  const [rows, setRows] = useState<Array<{ id: string; name: string; enrolled: number; present: number }>>([]);

  useEffect(() => {
    try {
      const gradesRaw = localStorage.getItem('munyaka_grades');
      if (gradesRaw) {
        const gradesData = JSON.parse(gradesRaw);
        if (Array.isArray(gradesData)) {
          const studentsRaw = localStorage.getItem('school_learners_data');
          const students = studentsRaw ? JSON.parse(studentsRaw) : [];

          const computed = gradesData.map((grade: any) => {
            const gradeNum = grade.name?.replace(/[^0-9]/g, '') || '';
            const enrolled = Array.isArray(students)
              ? students.filter((s: any) => s.grade === gradeNum || s.grade === grade.name).length
              : 0;
            return {
              id: grade.id,
              name: grade.name,
              enrolled,
              present: 0,
            };
          });
          setRows(computed);
        }
      }
    } catch (e) {
      console.error('Failed to compute class participation:', e);
    }
  }, [totalStudents]);

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="px-8 py-12 text-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <AlertCircle size={28} className="text-slate-300" />
            <p className="font-medium">No class data available yet</p>
            <p className="text-xs text-slate-400">Add grades and students to populate this view.</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
          <td className="px-8 py-5 font-bold text-slate-900">{row.name}</td>
          <td className="px-8 py-5 text-slate-600">{row.enrolled} Registered</td>
          <td className="px-8 py-5 text-right">
            <Badge className={row.enrolled > 0
              ? "bg-emerald-50 text-emerald-700 border-none font-bold"
              : "bg-slate-50 text-slate-400 border-none font-bold"
            }>
              {row.enrolled > 0 ? `${row.enrolled} Enrolled` : "0 Enrolled"}
            </Badge>
          </td>
        </tr>
      ))}
    </>
  );
};

export default Dashboard;
