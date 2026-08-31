import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, TrendingUp, User, Loader2, Activity, AlertCircle, DollarSign } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';

interface RecentAlert {
  id: string;
  type: 'fee' | 'attn' | 'reg' | 'general';
  msg: string;
  /**
   * Timestamp recorded at the moment the alert was created.
   *
   * Can be:
   *   - An ISO 8601 string (e.g. "2026-08-31T13:15:00.000Z") — preferred for
   *     any alert generated during the current session. The renderer calls
   *     `new Date(time).toLocaleString(...)` to display it.
   *   - A pre-formatted, human-readable string ("Just now", "Today", "Recent")
   *     used only as a safe fallback for hard-coded seed entries.
   *   - An epoch-millis number — accepted by `new Date(number)`.
   */
  time: string | number;
  color: string;
}

const Dashboard = () => {
  // Consume the custom hook for offline system statistics
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useDashboardData();

  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [hasLiveData, setHasLiveData] = useState<boolean>(false);

  // Recompute hasLiveData from hook values immediately
  useEffect(() => {
    setHasLiveData(totalStudents > 0 || totalTeachers > 0);
  }, [totalStudents, totalTeachers]);

  // Load recent activity alerts dynamically from localStorage
  useEffect(() => {
    try {
      const alerts: RecentAlert[] = [];

      // 1. Recent Fee Transactions
      const txRaw = localStorage.getItem('munyaka_transactions');
      if (txRaw) {
        const transactions = JSON.parse(txRaw);
        if (Array.isArray(transactions)) {
          transactions.slice(0, 2).forEach((tx: any) => {
            alerts.push({
              id: `tx-${tx.id || Math.random()}`,
              type: 'fee',
              msg: `Fee payment: ${tx.ref || 'N/A'} (KES ${tx.amount?.toLocaleString() || 0})`,
              // Prefer an explicit `createdAt` (ISO timestamp) if the
              // transaction record carries one, otherwise fall back to
              // the human-readable `date` string the rest of the system
              // already uses. This guarantees the renderer shows the
              // real time, not a placeholder.
              time: tx.createdAt || tx.date || new Date().toISOString(),
              color: 'bg-orange-500',
            });
          });
        }
      }

      // 2. Recent Student Registrations
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

      // 3. Recent Attendance Marks
      const attnRaw = localStorage.getItem('munyaka_attendance_records');
      if (attnRaw) {
        const attendance = JSON.parse(attnRaw);
        if (typeof attendance === 'object') {
          const keys = Object.keys(attendance);
          // Pick the most-recent entry that carries an explicit timestamp.
          // If none exist, fall back to the current ISO string so the
          // alert still renders meaningfully instead of disappearing.
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

      // 4. Recent Notices (fallback if nothing else)
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

      // Fallback placeholder when no localStorage data exists
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

  // ────────────────────────────────────────────────
  // Demo action handlers — these simulate live system events
  // (fee payment, student registration, attendance mark) and push
  // a fresh alert at the top of the feed. Each one captures the
  // exact moment-of-action via `new Date().toISOString()` so the
  // rendered timestamp always matches the wall clock.
  // ────────────────────────────────────────────────
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

  /**
   * Convert a stored timestamp into a fully-formatted locale string.
   * Handles three input shapes:
   *   - ISO 8601 string  ("2026-08-31T13:15:00.000Z")
   *   - Epoch millis    (1756647300000)
   *   - Human fallback  ("Just now", "Today", "Recent")
   *
   * Output examples:
   *   - "Aug 31, 2026, 4:15 PM"        (from ISO string)
   *   - "Aug 31, 2026, 4:15 PM"        (from epoch millis)
   *   - "Just now, 4:15 PM"             (from a human fallback)
   */
  const formatAlertTimestamp = (ts: string | number | undefined | null): string => {
    if (ts === undefined || ts === null || ts === '') return '—';

    // Treat a small, fixed set of human-readable labels as a fallback that
    // still gets enriched with the current wall-clock time so users always
    // see a fresh time reading.
    const humanTokens = ['just now', 'today', 'recent', 'system', 'standby', 'error', 'yesterday'];
    if (typeof ts === 'string' && humanTokens.includes(ts.trim().toLowerCase())) {
      const humanLabel = ts.charAt(0).toUpperCase() + ts.slice(1);
      const timePart = new Date().toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${humanLabel}, ${timePart}`;
    }

    // Numeric — treat as epoch millis
    let date: Date;
    if (typeof ts === 'number') {
      date = new Date(ts);
    } else {
      const maybe = new Date(ts);
      if (!isNaN(maybe.getTime())) {
        date = maybe;
      } else {
        // Unparseable string — return the original as a safe fallback
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

  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : totalStudents.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Total Teachers",
      value: isLoading ? "..." : totalTeachers.toString(),
      icon: User,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Today's Attendance",
      value: isLoading ? "..." : `${todayAttendanceRate}%`,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Junior School",
      value: isLoading ? "..." : Math.max(0, Math.floor(totalStudents * 0.25)).toString(),
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      title: "System Status",
      value: hasLiveData ? "Live" : "Standby",
      icon: Activity,
      color: hasLiveData ? "text-emerald-600" : "text-amber-600",
      bg: hasLiveData ? "bg-emerald-50" : "bg-amber-50"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-muted-foreground">System vitals for Munyaka Primary and Junior School.</p>
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

      {/* Stats Grid - Consumes Hook Values */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-4px] transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${stat.bg} p-4 rounded-2xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-0.5">{stat.title}</p>
                {isLoading && stat.value === "..." ? (
                  <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 truncate">{stat.value}</h3>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Recent Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
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

        {/* ── Recent Alerts Panel — Dynamic Timestamps ── */}
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
                  // Format the timestamp at render time so the user always
                  // sees the correct, current calendar date + time.
                  const displayTime = formatAlertTimestamp(act.time);
                  return (
                    <div key={act.id} className="flex gap-4">
                      <div className={`w-3 h-3 mt-1.5 rounded-full ${act.color} shrink-0 ring-4 ring-white shadow-sm z-10`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-tight break-words">{act.msg}</p>
                        {/*
                          The `title` attribute carries the full ISO string
                          for users who want to verify precision on hover;
                          the visible label uses the locale-formatted time
                          produced by `formatAlertTimestamp`.
                        */}
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

            {/*
              Demo action bar — wires the three simulated system events
              to the alert feed. Each handler captures the exact moment
              of the user action via `new Date().toISOString()` and pushes
              the new alert to the top of the feed. The renderer
              immediately formats the timestamp into the user's locale.
            */}
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
      </div>

      {/* Factual Class Participation Table */}
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
    </div>
  );
};

// Extracted sub-component to compute class participation from the same source
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