import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatGradeName } from '@/utils/gradeSort';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRecord {
  id: string;
  name?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  status?: string;
}

interface LiveRegisterEntry {
  session?: string;
  class?: string;
  stream?: string;
  date?: string;
  savedAt?: string;
  [studentId: string]: string | undefined;
}

interface GradeRow {
  /** Display name for the grade e.g. "Grade 4" */
  grade: string;
  /** Number of streams aggregated into this row */
  streamCount: number;
  /** Present — boys, girls, total */
  presentBoys: number;
  presentGirls: number;
  presentTotal: number;
  /** Absent — boys, girls, total */
  absentBoys: number;
  absentGirls: number;
  absentTotal: number;
  /** Enrolled total (presentTotal + absentTotal) */
  totalEnrolled: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  STUDENTS: 'school_learners_data',
  ATTENDANCE_RECORDS: 'munyaka_attendance_records',
  ATTENDANCE_V2_PREFIX: 'munyaka_attendance_v2_',
};

const GRADE_ORDER = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

const todayISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeGender = (g: string | undefined): 'male' | 'female' | 'unknown' => {
  const v = (g || '').toLowerCase().trim();
  if (v === 'male' || v === 'm' || v === 'boy') return 'male';
  if (v === 'female' || v === 'f' || v === 'girl') return 'female';
  return 'unknown';
};

/**
 * Build the localStorage key for the v2 attendance register.
 * Format:  munyaka_attendance_v2_{grade}_{stream}_{date}
 */
const buildV2Key = (grade: string, stream: string, date: string): string =>
  `${STORAGE_KEYS.ATTENDANCE_V2_PREFIX}${grade}_${stream}_${date}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryStat: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  iconBg: string;
}> = ({ label, value, icon: Icon, bg, text, border, iconBg }) => (
  <div className={cn('flex items-center gap-3 p-3 rounded-xl border', bg, border)}>
    <div className={cn('p-2 rounded-lg', iconBg)}>
      <Icon size={16} className={text} />
    </div>
    <div>
      <p className={cn('text-lg font-black leading-none', text)}>{value}</p>
      <p className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
        {label}
      </p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * DailyAttendanceSummary
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates learner attendance for a selected date, grouped by grade.
 *
 *   • Column groups:  Present (Boys, Girls, Total) | Absent (Boys, Girls, Total)
 *   • "Total Enrolled" = Present Total + Absent Total
 *   • Bottom row aggregates column totals across all grades.
 *   • Date picker defaults to today; users can browse historical attendance.
 *   • Live updates whenever attendance v2 registers or the students list change.
 */
export const DailyAttendanceSummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [version, setVersion] = useState(0);

  // ── Live recompute: re-read localStorage whenever version changes ──
  const recompute = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    recompute();
    const interval = window.setInterval(recompute, 5_000);
    const onStorage = () => recompute();
    const onCustom = () => recompute();
    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
    };
  }, [recompute]);

  // ── Aggregate: roll per-student entries into per-grade totals ──
  const rows = useMemo<GradeRow[]>(() => {
    try {
      // 1. Load active students
      const students = safeParse<StudentRecord[]>(
        localStorage.getItem(STORAGE_KEYS.STUDENTS)
      );
      if (!Array.isArray(students) || students.length === 0) return [];

      const activeStudents = students.filter((s) => {
        if (!s) return false;
        if (s.status && s.status !== 'Active' && s.status !== 'active') return false;
        return true;
      });

      // 2. Build per-(grade,stream) bucket of student ids + genders
      const buckets = new Map<string, {
        grade: string;
        stream: string;
        students: { id: string; gender: 'male' | 'female' | 'unknown' }[];
      }>();

      for (const s of activeStudents) {
        const grade = (s.grade || '').trim();
        const stream = (s.stream || '').trim();
        if (!grade || !stream) continue;
        const key = `${grade}::${stream}`;
        if (!buckets.has(key)) {
          buckets.set(key, { grade, stream, students: [] });
        }
        buckets.get(key)!.students.push({
          id: s.id,
          gender: normalizeGender(s.gender),
        });
      }

      // 3. For each bucket, read the v2 register and tally present / absent
      const gradeAgg = new Map<string, GradeRow>();

      for (const [, bucket] of buckets) {
        const v2Key = buildV2Key(bucket.grade, bucket.stream, selectedDate);
        const register = safeParse<LiveRegisterEntry>(localStorage.getItem(v2Key));

        // Default: if no register exists, all enrolled learners are "absent"
        let presentBoys = 0;
        let presentGirls = 0;
        let absentBoys = 0;
        let absentGirls = 0;

        if (register && register.date === selectedDate) {
          for (const student of bucket.students) {
            const status = register[student.id];
            if (status === 'P') {
              if (student.gender === 'male') presentBoys++;
              else if (student.gender === 'female') presentGirls++;
            } else {
              // Treat A, L, E, or missing status as absent
              if (student.gender === 'male') absentBoys++;
              else if (student.gender === 'female') absentGirls++;
            }
          }
        } else {
          // No register — count all as absent
          for (const student of bucket.students) {
            if (student.gender === 'male') absentBoys++;
            else if (student.gender === 'female') absentGirls++;
          }
        }

        // Aggregate this stream into its grade row
        const canonicalGrade = formatGradeName(bucket.grade);
        const existing = gradeAgg.get(canonicalGrade) || {
          grade: canonicalGrade,
          streamCount: 0,
          presentBoys: 0,
          presentGirls: 0,
          presentTotal: 0,
          absentBoys: 0,
          absentGirls: 0,
          absentTotal: 0,
          totalEnrolled: 0,
        };

        existing.streamCount += 1;
        existing.presentBoys += presentBoys;
        existing.presentGirls += presentGirls;
        existing.absentBoys += absentBoys;
        existing.absentGirls += absentGirls;
        existing.presentTotal = existing.presentBoys + existing.presentGirls;
        existing.absentTotal = existing.absentBoys + existing.absentGirls;
        existing.totalEnrolled = existing.presentTotal + existing.absentTotal;

        gradeAgg.set(canonicalGrade, existing);
      }

      // 4. Sort by canonical grade order, return as array
      const result = Array.from(gradeAgg.values()).sort((a, b) => {
        const ai = GRADE_ORDER.indexOf(a.grade);
        const bi = GRADE_ORDER.indexOf(b.grade);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

      return result;
    } catch (err) {
      console.error('[DailyAttendanceSummary] aggregation error:', err);
      return [];
    }
  }, [version, selectedDate]);

  // ── Summary row totals ──
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        presentBoys: acc.presentBoys + r.presentBoys,
        presentGirls: acc.presentGirls + r.presentGirls,
        presentTotal: acc.presentTotal + r.presentTotal,
        absentBoys: acc.absentBoys + r.absentBoys,
        absentGirls: acc.absentGirls + r.absentGirls,
        absentTotal: acc.absentTotal + r.absentTotal,
        totalEnrolled: acc.totalEnrolled + r.totalEnrolled,
      }),
      {
        presentBoys: 0,
        presentGirls: 0,
        presentTotal: 0,
        absentBoys: 0,
        absentGirls: 0,
        absentTotal: 0,
        totalEnrolled: 0,
      }
    );
  }, [rows]);

  const attendanceRate = totals.totalEnrolled > 0
    ? Math.round((totals.presentTotal / totals.totalEnrolled) * 100)
    : 0;

  const isToday = selectedDate === todayISO();

  // ── Date-picker handlers ──
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setSelectedDate(e.target.value);
  };

  const handleJumpToday = () => setSelectedDate(todayISO());
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Daily Learners Attendance Summary
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Aggregated present / absent by grade for the selected date
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700 gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              LIVE
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={recompute}
              className="h-8 w-8 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        {/* ── Date Picker ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
              title="Previous day"
            >
              ←
            </button>
            <div className="flex items-center gap-2 px-2 py-1">
              <CalendarDays size={14} className="text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="h-7 w-[150px] border-0 bg-transparent p-0 text-sm font-bold text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
              title="Next day"
            >
              →
            </button>
          </div>

          {!isToday && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleJumpToday}
              className="h-8 rounded-xl text-xs font-bold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowRight size={12} />
              Jump to Today
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">
              {new Date(selectedDate).toLocaleDateString('en-KE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* ── Quick Stat Strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <SummaryStat
            label="Present"
            value={totals.presentTotal}
            icon={CheckCircle2}
            bg="bg-emerald-50"
            text="text-emerald-700"
            border="border-emerald-200"
            iconBg="bg-emerald-100"
          />
          <SummaryStat
            label="Absent"
            value={totals.absentTotal}
            icon={XCircle}
            bg="bg-red-50"
            text="text-red-700"
            border="border-red-200"
            iconBg="bg-red-100"
          />
          <SummaryStat
            label="Total Enrolled"
            value={totals.totalEnrolled}
            icon={Users}
            bg="bg-indigo-50"
            text="text-indigo-700"
            border="border-indigo-200"
            iconBg="bg-indigo-100"
          />
          <SummaryStat
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={TrendingUp}
            bg="bg-amber-50"
            text="text-amber-700"
            border="border-amber-200"
            iconBg="bg-amber-100"
          />
        </div>

        {/* ── Grouped Summary Table ─────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              {/* Grouped header row 1: spans for Present / Absent / Enrolled */}
              <tr className="bg-slate-100">
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-r border-slate-200 align-bottom"
                >
                  Grade / Class
                </th>
                <th
                  colSpan={3}
                  className="px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700 border-b border-r border-slate-200 bg-emerald-50/60"
                >
                  Present
                </th>
                <th
                  colSpan={3}
                  className="px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-red-700 border-b border-r border-slate-200 bg-red-50/60"
                >
                  Absent
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-700 border-b border-slate-200 bg-slate-50 align-bottom"
                >
                  Total Enrolled
                </th>
              </tr>
              {/* Grouped header row 2: Boys / Girls / Total sub-columns */}
              <tr className="bg-slate-50">
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200">
                  Boys
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200">
                  Girls
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200 bg-emerald-50/40">
                  Total
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200">
                  Boys
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200">
                  Girls
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 border-b border-r border-slate-200 bg-red-50/40">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No active learners enrolled yet.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Register students to start tracking attendance.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const presentRate = row.totalEnrolled > 0
                    ? Math.round((row.presentTotal / row.totalEnrolled) * 100)
                    : 0;
                  return (
                    <tr
                      key={row.grade}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm font-bold text-slate-800">
                          {row.grade}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {row.streamCount} {row.streamCount === 1 ? 'stream' : 'streams'} · {presentRate}% present
                        </p>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-blue-600 tabular-nums">
                        {row.presentBoys}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-pink-600 tabular-nums">
                        {row.presentGirls}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-black text-emerald-700 tabular-nums bg-emerald-50/30">
                        {row.presentTotal}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-blue-600 tabular-nums">
                        {row.absentBoys}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold text-pink-600 tabular-nums">
                        {row.absentGirls}
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-black text-red-700 tabular-nums bg-red-50/30">
                        {row.absentTotal}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-black text-slate-800 tabular-nums">
                        {row.totalEnrolled}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td className="px-4 py-3 text-sm font-black text-slate-800">
                    School Total
                    <span className="block text-[10px] text-slate-500 font-semibold">
                      {rows.length} grades
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-black text-blue-700 tabular-nums">
                    {totals.presentBoys}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-black text-pink-700 tabular-nums">
                    {totals.presentGirls}
                  </td>
                  <td className="px-2 py-3 text-center text-base font-black text-emerald-700 tabular-nums bg-emerald-100/50">
                    {totals.presentTotal}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-black text-blue-700 tabular-nums">
                    {totals.absentBoys}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-black text-pink-700 tabular-nums">
                    {totals.absentGirls}
                  </td>
                  <td className="px-2 py-3 text-center text-base font-black text-red-700 tabular-nums bg-red-100/50">
                    {totals.absentTotal}
                  </td>
                  <td className="px-4 py-3 text-center text-base font-black text-slate-900 tabular-nums">
                    {totals.totalEnrolled}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Footnote ──────────────────────────────────────────────────── */}
        <p className="text-[10px] text-slate-400 mt-3 italic">
          Present = marked "P" in the register. Absent = marked "A", "L", "E", or unmarked.
          {' '}Live data is sourced from <code className="font-mono text-slate-500">munyaka_attendance_v2_&#123;grade&#125;_&#123;stream&#125;_&#123;date&#125;</code>.
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyAttendanceSummary;
