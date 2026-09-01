import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Users,
  UserCheck,
  User,
  GraduationCap,
  Activity,
  TrendingUp,
  DollarSign,
  UsersRound,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  enrolled: number;
  gradeOrder: number; // numeric sort key: PP1=0, PP2=0, Grade 1=1 … Grade 9=9
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

function formatTimestamp(ts: string | number | null | undefined): string {
  if (!ts) return '—';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return String(ts);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tsStr = d.toISOString().slice(0, 10);

  // If it's today → show time only
  if (tsStr === todayStr) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  // If it's yesterday → show "Yesterday, HH:MM"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (tsStr === yesterday.toISOString().slice(0, 10)) {
    return `Yesterday, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Past date → show "MON DD, HH:MM AM/PM"
  return d
    .toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
}) => (
  <Card className="border-none shadow-sm bg-white rounded-2xl hover:-translate-y-0.5 transition-transform">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-black text-slate-900 truncate leading-none">{value}</p>
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
        {formatTimestamp(alert.time)}
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
  // Live total — recomputed on every render from the rows (which are themselves
  // re-aggregated from the live school_learners_data whenever it changes).
  const totalEnrollment = rows.reduce((sum, row) => sum + (row.enrolled || 0), 0);

  return (
    <div className="w-full overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Class Name
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Enrollment
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-sm">
                No class data available yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${row.enrolled > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                    {row.enrolled} Registered
                  </span>
                </td>
              </tr>
            ))
          )}

          {/* Total Summary Row — always rendered at the bottom */}
          <tr className="bg-slate-50/80 border-t-2 border-slate-200">
            <td className="px-6 py-4 font-black text-slate-900 text-sm">
              Total Enrollment
            </td>
            <td className="px-6 py-4">
              <span className="text-sm font-black text-indigo-600">
                Total: {totalEnrollment.toLocaleString()}
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {totalEnrollment === 1 ? 'Registered' : 'Total Registered'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Dashboard Component ──────────────────────────────────────────────────

const Dashboard = () => {
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useDashboardData();
  const { user } = useAuth();
  const { canAccessSystemManagement } = usePermissions();

  const isAdmin = useMemo(
    () => ['admin', 'super_admin'].includes((user?.role || '').toLowerCase()),
    [user?.role]
  );

  // Only compute full admin data when the user is admin
  const hasLiveData = totalStudents > 0 || totalTeachers > 0;

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

  // ── Class participation rows — live query from school_learners_data ───────────────────
  // • Reads every active learner from school_learners_data (real-time, no mock data)
  // • Groups count by the normalised grade string (e.g. "Grade 1", "Grade 8", "PP1")
  // • Joins against munyaka_grades to get the authoritative class list and IDs
  // • Sorts by grade order: PP1/PP2 → Grade 1–6 → Grade 7–9
  // • Re-computes whenever totalStudents changes (which tracks school_learners_data)
  const classRows = useMemo<ClassRow[]>(() => {
    const gradesRaw = localStorage.getItem('munyaka_grades');
    if (!gradesRaw) return [];

    let grades: any[] = [];
    try {
      grades = JSON.parse(gradesRaw);
      if (!Array.isArray(grades)) grades = [];
    } catch {
      return [];
    }

    // Live learner data — any new registration/transferred status is reflected immediately
    const learners: any[] = safeRead('school_learners_data', []);

    // Normalise a grade name to a numeric sort key
    // "PP1" / "pp1" → 0, "PP2" / "pp2" → 1, "Grade 1" → 1, "Grade 8" → 8, "GRADE 9" → 9
    const gradeOrderOf = (name: string): number => {
      const upper = name.trim().toUpperCase();
      if (/^PP\s*1$/i.test(upper) || upper === 'PP1') return 0;
      if (/^PP\s*2$/i.test(upper) || upper === 'PP2') return 1;
      const match = upper.match(/GRADE\s*(\d+)/);
      if (match) return parseInt(match[1], 10);
      return 99; // unknown grades go at the bottom
    };

    // Count enrolled (non-transferred) learners per normalised grade string
    // Build a map: "Grade 1" → 3, "Grade 8" → 12, etc.
    const countByGrade: Record<string, number> = {};
    learners.forEach((l: any) => {
      if (l.status === 'TRANSFERRED') return;
      const raw = (l.grade || '').trim();
      if (!raw) return;
      countByGrade[raw] = (countByGrade[raw] || 0) + 1;
    });

    // Map: raw grade name → display name (standardised casing)
    const displayName = (raw: string): string => {
      const upper = raw.trim().toUpperCase();
      if (/^PP\s*1$/i.test(raw)) return 'PP 1';
      if (/^PP\s*2$/i.test(raw)) return 'PP 2';
      const match = raw.match(/^([A-Za-z]+\s*)(\d+)$/);
      if (match) return `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    };

    // Build rows from the grades master list (authoritative), joined with live counts
    const rows: ClassRow[] = grades.map((g: any) => {
      const rawName = g.name || '';
      return {
        id: g.id,
        name: displayName(rawName),
        enrolled: countByGrade[rawName] || 0,
        gradeOrder: gradeOrderOf(rawName),
      };
    });

    // Also include any grade names that appear in school_learners_data but are NOT
    // in munyaka_grades yet (e.g., a class that was registered before grades were set up)
    Object.entries(countByGrade).forEach(([rawName, count]) => {
      const alreadyExists = rows.some((r) => r.name.toUpperCase() === displayName(rawName).toUpperCase());
      if (!alreadyExists) {
        rows.push({
          id: `dynamic-${rawName}`,
          name: displayName(rawName),
          enrolled: count,
          gradeOrder: gradeOrderOf(rawName),
        });
      }
    });

    // Sort: PP1 → PP2 → Grade 1 … Grade 9, then unknown
    rows.sort((a, b) => {
      if (a.gradeOrder !== b.gradeOrder) return a.gradeOrder - b.gradeOrder;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [totalStudents]);

  // ── Recent alerts state ──────────────────────────────────────────────────────
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const buildAlerts = (): RecentAlert[] => {
      const alerts: RecentAlert[] = [];
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

      // ── Helper: parse a timestamp field into a Date, or null ───────────────
      const parseDate = (raw: unknown): Date | null => {
        if (!raw) return null;
        if (typeof raw === 'number') return new Date(raw);
        if (typeof raw === 'string') {
          const d = new Date(raw);
          return isNaN(d.getTime()) ? null : d;
        }
        return null;
      };

      // ── 1. Fee transactions ────────────────────────────────────────────────
      try {
        const txRaw = localStorage.getItem('munyaka_transactions');
        if (txRaw) {
          const txs: any[] = JSON.parse(txRaw);
          txs.forEach((tx: any) => {
            const ts = tx.createdAt || tx.date || tx.paidAt;
            const date = parseDate(ts);
            if (!date) return;
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            alerts.push({
              id: `tx-${tx.id || Math.random()}`,
              type: 'fee',
              msg: `Fee payment: ${tx.ref || 'AUTO-GEN'} (KES ${(tx.amount || 0).toLocaleString()})`,
              time: date.toISOString(),
              color: 'bg-orange-500',
              dotClass: 'bg-orange-400',
              // Track whether this is a today entry for filtering
              _isToday: isToday,
              _ts: date.getTime(),
            });
          });
        }
      } catch { /* ignore */ }

      // ── 2. Student registrations ───────────────────────────────────────────
      try {
        const studentsRaw = localStorage.getItem('school_learners_data');
        if (studentsRaw) {
          const students: any[] = JSON.parse(studentsRaw);
          students.forEach((s: any) => {
            const ts = s.createdAt || s.dateOfAdmission || s.enrolledAt;
            const date = parseDate(ts);
            if (!date) return;
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            alerts.push({
              id: `reg-${s.id || Math.random()}`,
              type: 'reg',
              msg: `New student registered: ${s.name || s.fullName || 'Unknown'}`,
              time: date.toISOString(),
              color: 'bg-emerald-500',
              dotClass: 'bg-emerald-500',
              _isToday: isToday,
              _ts: date.getTime(),
            });
          });
        }
      } catch { /* ignore */ }

      // ── 3. Attendance logs ─────────────────────────────────────────────────
      // Only include attendance records whose date actually matches today.
      // Never stamp with "today" unless the record's date field is today's date.
      try {
        const attnRaw = localStorage.getItem('munyaka_attendance_records');
        if (attnRaw) {
          const attn: Record<string, any> = JSON.parse(attnRaw);
          Object.entries(attn).forEach(([key, record]: [string, any]) => {
            if (!record || typeof record !== 'object') return;
            const savedAt = record.savedAt || record.timestamp || record.date;
            const date = parseDate(savedAt);
            if (!date) return;
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            // The message says "today" only when the record's date matches today
            const count = 1; // individual records don't expose a count here
            alerts.push({
              id: `attn-${key}`,
              type: 'attn',
              msg: isToday
                ? `Attendance marked: ${count} record(s) saved today`
                : `Attendance marked: ${date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} (${dateStr})`,
              time: date.toISOString(),
              color: 'bg-purple-500',
              dotClass: 'bg-purple-400',
              _isToday: isToday,
              _ts: date.getTime(),
            });
          });
        }
      } catch { /* ignore */ }

      // ── 4. Sort all alerts descending by timestamp ─────────────────────────
      alerts.sort((a, b) => (b as any)._ts - (a as any)._ts);

      // ── 5. Separate today's logs from historical logs ──────────────────────
      const todayAlerts = alerts.filter((a) => (a as any)._isToday);
      const historicalAlerts = alerts.filter((a) => !(a as any)._isToday);

      // If there is any real activity today → show only today's activity (no historical).
      // If there is NO activity today → show previous historical logs (if any).
      // If there is NO data at all → show the empty state message.
      if (alerts.length === 0) {
        return []; // empty array triggers the "no activity" empty state
      }

      if (todayAlerts.length > 0) {
        // Return only today's logs (already sorted by timestamp DESC)
        return todayAlerts;
      }

      // No today's activity — return up to 6 most-recent historical logs
      return historicalAlerts.slice(0, 6);
    };

    setRecentAlerts(buildAlerts());
  }, [isAdmin, totalStudents, totalTeachers]);

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
  // The entire admin dashboard is rendered unconditionally for the ADMIN role.
  // No component is hidden; no section is gated for admins.
  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name || 'User'}. Your role ({user?.role}) does not have access to the full dashboard.
        </p>
      </div>
    );
  }

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
