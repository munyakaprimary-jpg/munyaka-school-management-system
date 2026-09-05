import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  User,
  GraduationCap,
  Activity,
  Megaphone,
  DollarSign,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  Loader2,
  Clock,
} from 'lucide-react';
import { useCentralData } from '@/hooks/useCentralData';
import { useAuth } from '@/context/AuthContext';
import {
  getRecentActivity,
  logActivity,
  type ActivityLogEntry,
} from '@/services/activityLog';
import { cn } from '@/lib/utils';
import { formatGradeName } from '@/utils/gradeSort';
import { useToast } from '@/hooks/use-toast';

// Demo mode — set to false in production
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || true;

// ─── Local Types ──────────────────────────────────────────────────────────────

interface SystemVitals {
  totalStudents: number;
  totalTeachers: number;
  activeTeacherCount: number;
  todayAttendanceRate: number;
  primarySchoolCount: number;
  juniorSchoolCount: number;
  systemStatus: 'Live';
}

interface WeeklyAttendance {
  day: string;
  dateStr: string;           // "YYYY-MM-DD" for identification
  rate: number;              // 0–100; 0 means no records
  hasRecord: boolean;        // true only when real attendance data exists for this day
}

interface AlertItem {
  id: string;
  type: 'fee' | 'registration' | 'attendance';
  title: string;
  timestamp: string;      // ISO string for exact timestamp
  exactTime: string;     // Formatted exact time string
  relativeTime: string;  // Relative time string for tooltip
}

interface ClassRow {
  name: string;
  boys: number;
  girls: number;
  total: number;
}

/**
 * Complete canonical grade sequence: PP1 → PP2 → Grade 1 → … → Grade 9.
 * All 11 levels are always rendered as rows so every class appears
 * even when it has zero registered learners.
 */
const ALL_GRADES: string[] = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const safeParseRecord = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const todayISO = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


// ─── Sub-components ──────────────────────────────────────────────────────────

const LiveSyncBanner: React.FC = () => (
  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center gap-3">
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
      LIVE FACTUAL SYNC
    </p>
  </div>
);

interface VitalCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string | number;
  subtitle?: string;
}

const VitalCard: React.FC<VitalCardProps> = ({ icon, iconBg, title, value, subtitle }) => (
  <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
    <CardContent className="p-2 sm:p-4 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
      <div className={cn(iconBg, 'w-7 h-7 sm:w-10 sm:h-10 p-1.5 rounded-xl shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4')}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-tight text-gray-500">
          {title}
        </p>
        <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

// ─── Attendance weekly chart ─────────────────────────────────────────────────

const AttendanceTrendsChart: React.FC<{ data: WeeklyAttendance[] }> = ({ data }) => {
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const datum = payload[0].payload as WeeklyAttendance;
      const dayLabel = `${datum.day} · ${datum.dateStr}`;
      if (!datum.hasRecord) {
        return (
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 min-w-[140px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {dayLabel}
            </p>
            <p className="text-sm font-bold text-slate-500">No records</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Register not marked for this day
            </p>
          </div>
        );
      }
      return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 min-w-[140px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {dayLabel}
          </p>
          <p className="text-lg font-black text-emerald-600">
            {datum.rate}% Attendance
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar shape with rounded top corners; uses dashed outline when
  // the day has no record so the bar is visible but clearly "empty".
  const RoundedBar: React.FC<any> = (props) => {
    const { x, y, width, height, fill, payload } = props;
    const radius = 6;
    const hasRecord: boolean = payload?.hasRecord ?? true;

    if (hasRecord) {
      if (height <= 0) return null;
      return (
        <g>
          <path
            d={`
              M ${x},${y + height}
              L ${x},${y + radius}
              Q ${x},${y} ${x + radius},${y}
              L ${x + width - radius},${y}
              Q ${x + width},${y} ${x + width},${y + radius}
              L ${x + width},${y + height}
              Z
            `}
            fill={fill}
          />
        </g>
      );
    }

    // Unrecorded day: render a hollow, dashed-outlined "empty" bar so it
    // is visible in the chart but obviously has no data.
    const emptyY = y + 1; // nudge to show 1px line at zero
    return (
      <g>
        <path
          d={`
            M ${x},${emptyY}
            L ${x},${emptyY - radius}
            Q ${x},${emptyY - radius - 1} ${x + radius},${emptyY - radius - 1}
            L ${x + width - radius},${emptyY - radius - 1}
            Q ${x + width},${emptyY - radius - 1} ${x + width},${emptyY}
            L ${x + width},${emptyY}
            Z
          `}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      </g>
    );
  };

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" strokeWidth={1} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: '#F1F5F9', radius: 6 }}
          />
          <Bar dataKey="rate" shape={<RoundedBar />} maxBarSize={36}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  !entry.hasRecord
                    ? 'transparent'
                    : index === data.length - 1 ? '#10B981' : '#86EFAC'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { totalStudents, totalTeachers, activeTeacherCount, todayAttendanceRate, isLoading } = useCentralData();

  // Local state for re-rendering alerts when the activity log changes
  const [activityVersion, setActivityVersion] = useState(0);

  useEffect(() => {
    const handler = () => setActivityVersion((v) => v + 1);
    window.addEventListener('munyaka:activity-log-changed', handler);
    return () => window.removeEventListener('munyaka:activity-log-changed', handler);
  }, []);

  // ── System Vitals ────────────────────────────────────────────────────────
  const vitals = useMemo<SystemVitals>(() => {
    const learners = safeRead<any[]>('school_learners_data', []);
    const juniorCount = learners.filter((l: any) => {
      if (!l) return false;
      if (l.status && l.status !== 'Active' && l.status !== 'active') return false;
      const g = (l.grade || '').toLowerCase();
      return g.includes('grade 7') || g.includes('grade 8') || g.includes('grade 9') || g.includes('junior');
    }).length;

    return {
      totalStudents: isLoading ? 0 : totalStudents,
      totalTeachers: isLoading ? 0 : totalTeachers,
      activeTeacherCount: isLoading ? 0 : (activeTeacherCount ?? 0),
      todayAttendanceRate: isLoading ? 0 : todayAttendanceRate,
      primarySchoolCount: isLoading ? 0 : Math.max(0, totalStudents - juniorCount),
      juniorSchoolCount: juniorCount,
      systemStatus: 'Live',
    };
  }, [isLoading, totalStudents, totalTeachers, activeTeacherCount, todayAttendanceRate, activityVersion]);

  // ── Weekly attendance — last 7 days, fully driven by real DB-style data
  //   No mock percentages. If a day has no records, the bar shows 0% and
  //   the tooltip says "No records". Formula:
  //     rate = (present_students / total_enrolled_students) * 100
  const weeklyAttendance = useMemo<WeeklyAttendance[]>(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7; // Monday = 0

    // Total enrolled students (denominator) — read once
    const learners = safeRead<any[]>('school_learners_data', []);
    const totalEnrolled = learners.filter((l: any) => {
      if (!l) return false;
      if (l.status && l.status !== 'Active' && l.status !== 'active') return false;
      return true;
    }).length;

    // ── Aggregate present/late counts per date from all known sources
    // Source 1: school_attendance_logs (flat array, {date, status, studentId})
    // Source 2: munyaka_attendance_records (object keyed by class/stream/date)
    // Source 3: per-class v2 keys (munyaka_attendance_v2_*) — morning.P / afternoon.P
    const presentByDate: Record<string, Set<string>> = {};
    const totalMarkedByDate: Record<string, number> = {};

    const notePresent = (dateStr: string, studentId: string) => {
      if (!dateStr || !studentId) return;
      if (!presentByDate[dateStr]) presentByDate[dateStr] = new Set();
      presentByDate[dateStr].add(studentId);
    };
    const noteMarked = (dateStr: string, count: number) => {
      if (!dateStr) return;
      totalMarkedByDate[dateStr] = (totalMarkedByDate[dateStr] || 0) + count;
    };

    // Source 1: school_attendance_logs
    try {
      const raw = localStorage.getItem('school_attendance_logs');
      if (raw) {
        const logs = JSON.parse(raw);
        if (Array.isArray(logs)) {
          for (const l of logs) {
            if (!l?.date) continue;
            if (l.status === 'present' || l.status === 'late') {
              notePresent(l.date, l.studentId);
            }
            noteMarked(l.date, 1);
          }
        }
      }
    } catch { /* ignore */ }

    // Source 2: munyaka_attendance_records
    try {
      const raw = localStorage.getItem('munyaka_attendance_records');
      if (raw) {
        const records = JSON.parse(raw);
        if (records && typeof records === 'object') {
          for (const [, record] of Object.entries(records as Record<string, any>)) {
            if (!record) continue;
            const date = record.date;
            if (!date) continue;
            if (record.morning?.status === 'P' || record.afternoon?.status === 'P') {
              notePresent(date, record.studentId);
            }
            noteMarked(date, 1);
          }
        }
      }
    } catch { /* ignore */ }

    // Source 3: per-class v2 keys (munyaka_attendance_v2_*)
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith('munyaka_attendance_v2_')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const record = safeParseRecord<Record<string, any>>(raw);
        if (!record) continue;
        for (const [, entry] of Object.entries(record)) {
          if (!entry || typeof entry !== 'object') continue;
          const date = entry.date;
          if (!date) continue;
          if (entry.morning?.status === 'P' || entry.afternoon?.status === 'P') {
            notePresent(date, entry.studentId);
          }
          noteMarked(date, 1);
        }
      }
    } catch { /* ignore */ }

    // Build 7-day series (most recent last)
    const result: WeeklyAttendance[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayIdx = (todayIdx - i + 7) % 7;
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const presentCount = presentByDate[dateStr]?.size ?? 0;
      const markedCount = totalMarkedByDate[dateStr] ?? 0;

      // hasRecord: a register was actually marked for this day.
      // We accept the day as "recorded" if either:
      //   (a) the per-student log shows at least one entry, OR
      //   (b) any source flagged present/late that day.
      const hasRecord = markedCount > 0 || presentCount > 0;

      // Formula: (present / total_enrolled) * 100
      // If no records, rate is strictly 0% (no dummy numbers).
      const rate = hasRecord && totalEnrolled > 0
        ? Math.min(100, Math.round((presentCount / totalEnrolled) * 100))
        : 0;

      result.push({ day: days[dayIdx], dateStr, rate, hasRecord });
    }

    return result;
  }, [activityVersion]);

  // ── Toggle: show only today's alerts, or fall back to historical logs
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // ── Exact timestamp formatter: "Sep 3, 2026 at 15:59:48" format
  const formatExactTimestamp = useCallback((iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    // Format: "Sep 3, 2026 at 15:59:48"
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${month} ${day}, ${year} at ${hours}:${minutes}:${seconds}`;
  }, []);

  // ── Relative time formatter: "2 minutes ago" / "1 hour ago" etc.
  const formatRelativeTimestamp = useCallback((iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // ── Recent Alerts — derived from activity log, ordered by timestamp DESC
  const alerts = useMemo<AlertItem[]>(() => {
    // getRecentActivity() already sorts newest-first (created_at DESC)
    const recent = getRecentActivity(100);
    const targetTypes = new Set<ActivityLogEntry['type']>([
      'fee_payment',
      'student_registration',
      'attendance',
    ]);

    // Filter by type AND ensure timestamp is real & parseable
    const realEntries = recent.filter((e: ActivityLogEntry) => {
      if (!targetTypes.has(e.type)) return false;
      const ts = new Date(e.timestamp);
      return !isNaN(ts.getTime());
    });

    // Compare dates by local calendar day (not UTC)
    const isSameLocalDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const now = new Date();

    // Split into "today" vs "previous" based on real timestamps
    const todayEntries = realEntries.filter((e) =>
      isSameLocalDay(new Date(e.timestamp), now)
    );
    const previousEntries = realEntries.filter(
      (e) => !isSameLocalDay(new Date(e.timestamp), now)
    );

    // When "Today Only" is on, return today's only.
    // When off, fall back to the most recent historical logs (top of list).
    const source = showTodayOnly
      ? todayEntries
      : todayEntries.length > 0
        ? todayEntries
        : previousEntries;

    return source.slice(0, 8).map((e: ActivityLogEntry): AlertItem => {
      let title = e.title;
      if (e.type === 'fee_payment') {
        const meta = e.metadata as { ref?: string; amount?: number } | undefined;
        const ref = meta?.ref ?? 'AUTO-GEN';
        const amount = meta?.amount ? `KES ${meta.amount.toLocaleString()}` : '';
        title = `Fee payment: ${ref}${amount ? ` (${amount})` : ''}`;
      } else if (e.type === 'student_registration') {
        title = 'New student registered';
      } else if (e.type === 'attendance') {
        const meta = e.metadata as { recordCount?: number; date?: string } | undefined;
        // Only show the "X record(s) saved today" phrase when the
        // record's date actually matches the current local date.
        const recordDate = meta?.date ? new Date(meta.date) : null;
        const recordIsToday = recordDate
          ? isSameLocalDay(recordDate, now)
          : isSameLocalDay(new Date(e.timestamp), now);

        if (recordIsToday) {
          const count = meta?.recordCount ?? 0;
          title = `Attendance marked: ${count} record${count === 1 ? '' : 's'} saved today`;
        } else {
          title = 'Attendance marked';
        }
      }
      return {
        id: e.id,
        type: e.type === 'fee_payment' ? 'fee' : e.type === 'student_registration' ? 'registration' : 'attendance',
        title,
        timestamp: e.timestamp,
        exactTime: formatExactTimestamp(e.timestamp),
        relativeTime: formatRelativeTimestamp(e.timestamp),
      };
    });
  }, [activityVersion, showTodayOnly, formatExactTimestamp, formatRelativeTimestamp]);

  // ── School Enrollment — render every canonical grade in strict ascending order,
    //    with gender breakdown. Classes with 0 registered learners still appear
    //    as rows (Boys=0, Girls=0, Total=0).
    const classRows = useMemo<ClassRow[]>(() => {
      const learners = safeRead<any[]>('school_learners_data', []);
  
      const isActive = (l: any) => {
        if (!l) return false;
        if (l.status && l.status !== 'Active' && l.status !== 'active') return false;
        return true;
      };
      const isBoy = (l: any) => {
        const g = (l.gender || '').toLowerCase();
        return g === 'male' || g === 'boy';
      };
      const isGirl = (l: any) => {
        const g = (l.gender || '').toLowerCase();
        return g === 'female' || g === 'girl';
      };
  
      // Build a lookup: canonical grade name → raw grade variants in DB.
      // This lets us match "PP 1", "PP1 ", "Grade PP1", etc. → "PP1".
      const variantsByCanonical: Record<string, Set<string>> = {};
      ALL_GRADES.forEach((g) => { variantsByCanonical[g] = new Set(); });
  
      learners.forEach((l: any) => {
              if (!isActive(l)) return;
              const raw = String(l.grade || '').trim();
              if (!raw) return;
              const canonical = formatGradeName(raw);
              if (variantsByCanonical[canonical]) {
                variantsByCanonical[canonical].add(raw);
              }
            });
        
            // Render in strict canonical sequence — never skip empty classes.
            return ALL_GRADES.map((grade) => {
              const variants = variantsByCanonical[grade];
              const classLearners = learners.filter((l: any) => {
                if (!isActive(l)) return false;
                const raw = String(l.grade || '').trim();
                return variants.has(raw);
              });
        const boys = classLearners.filter(isBoy).length;
        const girls = classLearners.filter(isGirl).length;
        return { name: grade, boys, girls, total: boys + girls };
      });
    }, [activityVersion]);

  // ── Real-time action handlers with loading + toast feedback ──
  const { toast } = useToast();
  const [busyAction, setBusyAction] = useState<'fee' | 'registration' | 'attendance' | null>(null);

  const handleRealFeePayment = useCallback(async () => {
    setBusyAction('fee');
    try {
      // Real API endpoint for collecting fee — replace with actual API call
      // const res = await fetch('/api/fees/collect', { method: 'POST', ... });
      // const data = await res.json();

      // For now, persist the action to the activity log so the dashboard reflects it
      const amount = 300;
      logActivity({
        type: 'fee_payment',
        title: IS_DEMO_MODE
          ? `Fee payment recorded (demo)`
          : `Fee payment recorded`,
        metadata: { ref: 'LIVE', amount, date: new Date().toISOString().slice(0, 10) },
      });
      await new Promise((r) => setTimeout(r, 400));
      toast({
        title: IS_DEMO_MODE ? 'Fee payment simulated' : 'Fee collected',
        description: `Successfully recorded a fee payment of KES ${amount.toLocaleString()}.`,
      });
    } catch (err) {
      toast({
        title: 'Fee collection failed',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [toast]);

  const handleRealRegistration = useCallback(async () => {
    setBusyAction('registration');
    try {
      // Real API endpoint for new registration — replace with actual API call
      // const res = await fetch('/api/students/register', { method: 'POST', ... });
      logActivity({
        type: 'student_registration',
        title: IS_DEMO_MODE
          ? 'New student registered (demo)'
          : 'New student registered',
        metadata: { date: new Date().toISOString().slice(0, 10) },
      });
      await new Promise((r) => setTimeout(r, 400));
      toast({
        title: IS_DEMO_MODE ? 'Registration simulated' : 'Student registered',
        description: 'A new learner was added to the active roster.',
      });
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [toast]);

  const handleRealAttendanceCheckIn = useCallback(async () => {
    setBusyAction('attendance');
    try {
      // Real API endpoint for marking attendance — replace with actual API call
      // const res = await fetch('/api/attendance/mark', { method: 'POST', ... });
      const today = new Date().toISOString().slice(0, 10);
      logActivity({
        type: 'attendance',
        title: IS_DEMO_MODE
          ? 'Attendance marked (demo)'
          : 'Attendance marked',
        metadata: { date: today, recordCount: 1 },
      });
      await new Promise((r) => setTimeout(r, 400));
      toast({
        title: IS_DEMO_MODE ? 'Attendance simulated' : 'Attendance marked',
        description: 'Today\u2019s attendance has been recorded successfully.',
      });
    } catch (err) {
      toast({
        title: 'Attendance check-in failed',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [toast]);

  // ── Render
  return (
    <div className="space-y-6 pb-10" data-admin-dashboard="true">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          System vitals for Munyaka Primary and Junior School.
        </p>
      </div>

      {/* ── Live Sync Banner ── */}
      <LiveSyncBanner />

      {/* ── Summary Metric Cards ── */}
      <div className="space-y-4 w-full">
        {/* Row 1: Overall Vitals */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
          <VitalCard
            icon={<Users size={20} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title="Total Students"
            value={vitals.totalStudents.toLocaleString()}
          />
          <VitalCard
            icon={<User size={20} className="text-purple-600" />}
            iconBg="bg-purple-50"
            title="Total Teachers"
            value={vitals.totalTeachers.toLocaleString()}
            subtitle={`Active: ${vitals.activeTeacherCount} | Pending: ${Math.max(0, vitals.totalTeachers - vitals.activeTeacherCount)}`}
          />
          <VitalCard
            icon={<UserCheck size={20} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="Today's Attendance"
            value={`${vitals.todayAttendanceRate}%`}
          />
        </div>

        {/* Row 2: School Level Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
          <VitalCard
            icon={<GraduationCap size={20} className="text-amber-600" />}
            iconBg="bg-amber-50"
            title="Primary School"
            value={vitals.primarySchoolCount.toLocaleString()}
          />
          <VitalCard
            icon={<GraduationCap size={20} className="text-indigo-600" />}
            iconBg="bg-indigo-50"
            title="Junior School"
            value={vitals.juniorSchoolCount.toLocaleString()}
          />
        </div>
      </div>

      {/* ── Attendance Trends (Weekly) ── */}
      <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Attendance Trends (Weekly)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Average daily attendance for the current week
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700 gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Real-time Data
              <TrendingUp size={11} className="ml-0.5" />
            </Badge>
          </div>
          <AttendanceTrendsChart data={weeklyAttendance} />
        </CardContent>
      </Card>

      {/* ── Recent Alerts ── */}
      <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Recent Alerts</h2>
              <p className="text-xs text-slate-500 mt-1">
                Latest activity from across the school
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700 gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              LIVE FACTUAL SYNC
            </Badge>
          </div>

          {/* Filter toggle: Today vs All */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowTodayOnly(true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                showTodayOnly
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              Today Only
            </button>
            <button
              type="button"
              onClick={() => setShowTodayOnly(false)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                !showTodayOnly
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              All Activity
            </button>
          </div>

          {/* Alert timeline list */}
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  No system activities recorded today.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {showTodayOnly
                    ? 'Toggle "All Activity" to see previous days.'
                    : 'No historical activity found in the system log.'}
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const dotColor =
                  alert.type === 'fee' ? 'bg-orange-500' :
                  alert.type === 'registration' ? 'bg-emerald-500' :
                  'bg-purple-500';
                return (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/60 transition-colors group">
                    <span className={cn(dotColor, 'h-2.5 w-2.5 rounded-full shrink-0 mt-2')} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {alert.title}
                      </p>
                      {/* Exact timestamp displayed secondary to title */}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {alert.exactTime}
                        </p>
                        {/* Hover tooltip with relative time */}
                        <div className="relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-10">
                            <span className="text-slate-300">Relative: </span>
                            {alert.relativeTime}
                            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                          <Clock size={11} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Real-time action buttons ── */}
          <div className="flex flex-row items-center gap-3 w-full mt-5 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleRealFeePayment}
              disabled={busyAction !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold sm:text-sm uppercase tracking-wider hover:bg-orange-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="simulate-fee-button"
            >
              {busyAction === 'fee' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <DollarSign size={14} />
              )}
              {IS_DEMO_MODE ? '$ SIMULATE FEE' : 'COLLECT FEE'}
            </button>
            <button
              type="button"
              onClick={handleRealRegistration}
              disabled={busyAction !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold sm:text-sm uppercase tracking-wider hover:bg-emerald-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="simulate-reg-button"
            >
              {busyAction === 'registration' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Users size={14} />
              )}
              {IS_DEMO_MODE ? 'SIMULATE REG' : 'REGISTER STUDENT'}
            </button>
            <button
              type="button"
              onClick={handleRealAttendanceCheckIn}
              disabled={busyAction !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold sm:text-sm uppercase tracking-wider hover:bg-purple-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="simulate-attendance-button"
            >
              {busyAction === 'attendance' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <User size={14} />
              )}
              {IS_DEMO_MODE ? 'SIMULATE ATTENDANCE' : 'MARK ATTENDANCE'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Current School Enrollment ── */}
      <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">Current School Enrollment</h2>
            <p className="text-xs text-slate-500 mt-1">
              Active enrollment by class and gender — live from student records
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CLASS NAME
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    BOYS
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    GIRLS
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                      No enrollment data available.
                    </td>
                  </tr>
                ) : (
                  classRows.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {row.boys}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-purple-600">
                        {row.girls}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-black text-red-600">
                        {row.total}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-200">
                  <td className="px-4 py-3 text-sm font-black text-slate-800">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-black text-blue-700">
                    {classRows.reduce((sum, r) => sum + r.boys, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-black text-purple-700">
                    {classRows.reduce((sum, r) => sum + r.girls, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-black text-red-600">
                    {classRows.reduce((sum, r) => sum + r.total, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
