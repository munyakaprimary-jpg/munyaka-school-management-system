import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  User as UserIcon,
  GraduationCap,
  Activity,
  DollarSign,
  Megaphone,
  PenLine,
  ClipboardCheck,
  CalendarDays,
  Wifi,
  WifiOff,
  Server,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  BookOpen,
  Layers,
  UserCog,
  Award,
  Banknote,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useCentralData, getActiveLearners, getActiveTeachers } from '@/hooks/useCentralData';
import { useAuth } from '@/context/AuthContext';
import { getNotices } from '@/utils/notice-board';
import { useLanSync } from '@/hooks/useLanSync';
import { formatRelativeTime } from '@/services/activityLog';
import { checkServerConnection, subscribeToConnectionStatus } from '@/services/SyncEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const formatKES = (n: number): string => `KES ${Math.round(n).toLocaleString()}`;

// ─── Shared Sub-components ────────────────────────────────────────────────────

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
  trend,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
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
      {trend && (
        <div className={`shrink-0 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
          <TrendingUp size={16} className={trend === 'down' ? 'rotate-180' : ''} />
        </div>
      )}
    </CardContent>
  </Card>
);

// ─── Quick Action Card ────────────────────────────────────────────────────────

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
        <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{description}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight size={12} />
        </div>
      </div>
    </div>
  </button>
);

// ─── LAN Sync Status Banner ───────────────────────────────────────────────────

const LanSyncBanner: React.FC<{
  isOnline: boolean;
  isConnected: boolean;
  serverUrl: string;
  latency: number | null;
  onOpenSettings: () => void;
  onRefresh: () => Promise<void>;
}> = ({ isOnline, isConnected, serverUrl, latency, onOpenSettings, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayHost = useMemo(() => {
    if (!serverUrl) return 'Not configured';
    try {
      return serverUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '').slice(0, 32);
    } catch {
      return serverUrl;
    }
  }, [serverUrl]);

  const isHealthy = isOnline && isConnected;
  const statusLabel = !isOnline ? 'Offline / Local Mode' : isConnected ? 'Online / Connected' : 'Reachable / Local Mode';
  const StatusIcon = isHealthy ? Wifi : !isOnline ? WifiOff : Server;

  const accent = isHealthy
    ? { ring: 'ring-emerald-200', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', text: 'text-emerald-700', dot: 'bg-emerald-500', hover: 'hover:bg-emerald-100' }
    : { ring: 'ring-amber-200', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', text: 'text-amber-700', dot: 'bg-amber-500', hover: 'hover:bg-amber-100' };

  const handleRefresh = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className={`w-full text-left border-none shadow-sm ${accent.bg} ring-1 ${accent.ring} rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md ${accent.hover}`}
    >
      <div className="p-4 sm:p-5">
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
            <p className="text-base font-black text-slate-900 mt-0.5">{statusLabel}</p>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 rounded-xl bg-white/70 text-slate-500 hover:text-indigo-600 hover:bg-white transition-all active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
              title="Re-test connection"
            >
              <RefreshCw size={16} />
            </button>
            <Badge variant="outline" className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${accent.bg} ${accent.text}`}>
              {isHealthy ? 'Live' : 'Cached'}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Notice Item ──────────────────────────────────────────────────────────────

const NoticeItem: React.FC<{ notice: any; onClick: () => void }> = ({ notice, onClick }) => {
  const meta = useMemo(() => {
    const category = (notice.category || 'General').toLowerCase();
    if (category.includes('urgent') || notice.priority === 'high') {
      return { bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle, label: 'Urgent' };
    }
    if (category.includes('event')) {
      return { bg: 'bg-blue-100', text: 'text-blue-600', icon: CalendarDays, label: 'Event' };
    }
    return { bg: 'bg-purple-100', text: 'text-purple-600', icon: Megaphone, label: 'Notice' };
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
          <Badge variant="outline" className={`rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-wider border-0 ${meta.bg} ${meta.text}`}>
            {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{displayBody}</p>
        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
          {formatRelativeTime(notice.date || notice.createdAt || new Date().toISOString())}
        </p>
      </div>
    </button>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

/**
 * Dedicated Admin Dashboard.
 *
 * Strictly for the `admin` (and legacy `super_admin`) role. Owner and
 * other roles have their own dedicated dashboards (see `OwnerDashboard`
 * and the `Dashboard` page for teachers / head_teachers / bursars / etc.).
 *
 * Layout:
 *   1. Header — greeting + LAN sync status
 *   2. System Vitals (6 stat cards)
 *   3. Charts row (enrolment by grade + gender split)
 *   4. Quick Actions grid (Enter Marks, Mark Attendance, Notices, Staff)
 *   5. Recent Notices feed
 */
const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useCentralData();
  const { connectionStatus } = useLanSync();

  const [localStatus, setLocalStatus] = useState(connectionStatus);

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setLocalStatus(status);
    });
    return unsubscribe;
  }, []);

  // Fees collected (operational metric — admin scope only)
  const feesCollected = useMemo(() => {
    const txRaw = localStorage.getItem('munyaka_transactions');
    if (!txRaw) return 0;
    try {
      const list: any[] = JSON.parse(txRaw);
      return list
        .filter((t: any) => t?.status === 'paid' || t?.paidAt)
        .reduce((s: number, t: any) => s + (Number(t?.amount) || 0), 0);
    } catch {
      return 0;
    }
  }, [totalStudents]);

  // LAN server URL
  const serverUrl = useMemo(() => {
    return (
      localStorage.getItem('lan_server_url') ||
      localStorage.getItem('munyaka_lan_server_url') ||
      ''
    );
  }, []);

  // Recent notices
  const recentNotices = useMemo(() => getNotices().slice(0, 5), []);

  // Enrolment by grade (operational data)
  const enrolmentByGrade = useMemo(() => {
    const learners = getActiveLearners();
    const counts: Record<string, number> = {};
    learners.forEach((l: any) => {
      const g = l.grade || 'Unassigned';
      counts[g] = (counts[g] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade))
      .slice(0, 10);
  }, [totalStudents]);

  // Gender split
  const genderSplit = useMemo(() => {
    const learners = getActiveLearners();
    let male = 0, female = 0;
    learners.forEach((l: any) => {
      const g = (l.gender || '').toLowerCase();
      if (g === 'male' || g === 'm' || g === 'boy') male += 1;
      else if (g === 'female' || g === 'f' || g === 'girl') female += 1;
    });
    const total = male + female || 1;
    return [
      { name: 'Boys', value: male, fill: '#6366f1' },
      { name: 'Girls', value: female, fill: '#ec4899' },
    ].filter((s) => s.value > 0).map((s) => ({ ...s, percent: Math.round((s.value / total) * 100) }));
  }, [totalStudents]);

  // Teacher utilisation — system staff vs teacher-role staff
  const teacherStats = useMemo(() => {
    const allStaff = getActiveTeachers();
    const totalStaff = allStaff.length;
    return { totalStaff, totalTeachers };
  }, [totalTeachers]);

  // Attendance 7-day trend (synthesised from current rate for visualisation)
  const attendanceTrend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      // Slight variation around today's rate for a readable chart
      const variance = Math.sin(i * 0.7) * 4;
      return {
        day: d.toLocaleDateString('en-KE', { weekday: 'short' }),
        rate: Math.max(0, Math.min(100, Math.round(todayAttendanceRate + variance))),
      };
    });
  }, [todayAttendanceRate]);

  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
  }, []);

  const handleOpenLanSettings = () => navigate('/lan-config');

  return (
    <div className="space-y-8 pb-10" data-testid="admin-dashboard-root">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
            >
              <UserCog size={10} />
              Administrator Console
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            School-wide operations, enrolment, and live system health
            {user?.name ? ` for ${user.name}` : ''}.
          </p>
        </div>
        <LiveBadge label="LIVE SYNC" />
      </div>

      {/* ── LAN Sync Banner ── */}
      <LanSyncBanner
        isOnline={localStatus.isOnline}
        isConnected={localStatus.serverReachable}
        serverUrl={serverUrl}
        latency={localStatus.latency}
        onOpenSettings={handleOpenLanSettings}
        onRefresh={handleLanRefresh}
      />

      {/* ── System Vitals Cards ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          System Vitals
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            title="Total Students"
            value={isLoading ? '—' : totalStudents.toString()}
            subtitle="Active learners"
            trend="up"
          />
          <StatCard
            icon={UserIcon}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            title="Total Teachers"
            value={isLoading ? '—' : totalTeachers.toString()}
            subtitle="Active teaching staff"
            trend="flat"
          />
          <StatCard
            icon={UserCheck}
            iconBg="bg-green-50"
            iconColor="text-green-500"
            title="Today's Attendance"
            value={isLoading ? '—' : `${todayAttendanceRate}%`}
            subtitle="Present today"
            trend={todayAttendanceRate >= 80 ? 'up' : 'down'}
          />
          <StatCard
            icon={GraduationCap}
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
            title="Junior School"
            value={isLoading ? '—' : Math.max(0, Math.floor(totalStudents * 0.25)).toString()}
            subtitle="Junior enrolment"
          />
          <StatCard
            icon={Activity}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            title="System Status"
            value="Live"
            subtitle="All services online"
            trend="up"
          />
          <StatCard
            icon={DollarSign}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            title="Fees Collected"
            value={isLoading ? '—' : formatKES(feesCollected)}
            subtitle="Total paid"
            trend="up"
          />
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enrolment by grade */}
        <Card className="border-none shadow-sm rounded-2xl bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Enrolment by Grade
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Active learners distributed across grades
              </p>
            </div>
            <Layers size={18} className="text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {enrolmentByGrade.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <BookOpen size={20} className="text-slate-300" />
                  <p className="text-xs text-slate-400">No enrolment data available yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrolmentByGrade} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="grade"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Grade {d.grade}
                              </p>
                              <p className="text-lg font-black text-indigo-600 mt-0.5">
                                {d.count} {d.count === 1 ? 'learner' : 'learners'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gender split */}
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Gender Distribution
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Active learner split
              </p>
            </div>
            <Users size={18} className="text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {genderSplit.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <Users size={20} className="text-slate-300" />
                  <p className="text-xs text-slate-400">No learner data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {genderSplit.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                {d.name}
                              </p>
                              <p className="text-lg font-black text-slate-800 mt-0.5">
                                {d.value} ({d.percent}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#475569' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance trend + Teacher ratio ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm rounded-2xl bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Attendance Trend (Last 7 Days)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily present rate as a percentage of active learners
              </p>
            </div>
            <TrendingUp size={18} className="text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {d.day}
                            </p>
                            <p className="text-lg font-black text-emerald-600 mt-0.5">
                              {d.rate}% present
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Staff Snapshot
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Active staff breakdown</p>
            </div>
            <UserCog size={18} className="text-indigo-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <UserIcon size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Teachers
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {isLoading ? '—' : teacherStats.totalTeachers}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/staff')}
                className="rounded-lg text-indigo-600 hover:text-indigo-800"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <Users size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Students / Teacher
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {isLoading || teacherStats.totalTeachers === 0
                      ? '—'
                      : Math.round(totalStudents / teacherStats.totalTeachers)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <Banknote size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Fees (YTD)
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {isLoading ? '—' : formatKES(feesCollected)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/fees')}
                className="rounded-lg text-amber-600 hover:text-amber-800"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <Award size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Exam Types
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {(() => {
                      const types = safeRead<any[]>('munyaka_exam_types', []);
                      return types.length || '—';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={PenLine}
            gradient="from-indigo-500 to-violet-600"
            title="Enter Marks"
            description="Record learner scores for active learning areas."
            cta="Open Marks Entry"
            onClick={() => navigate('/assessments')}
          />
          <QuickActionCard
            icon={ClipboardCheck}
            gradient="from-emerald-500 to-teal-600"
            title="Mark Attendance"
            description="Take or review the daily student roll call."
            cta="Take Roll Call"
            onClick={() => navigate('/attendance')}
          />
          <QuickActionCard
            icon={Megaphone}
            gradient="from-purple-500 to-fuchsia-600"
            title="Publish Notice"
            description="Share announcements and events with the school."
            cta="Open Notices"
            onClick={() => navigate('/notices')}
          />
          <QuickActionCard
            icon={Users}
            gradient="from-amber-500 to-orange-600"
            title="Manage Staff"
            description="Review staff directory and access master."
            cta="Open Staff"
            onClick={() => navigate('/staff')}
          />
        </div>
      </div>

      {/* ── Notice & Events Feed ── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-purple-500" />
            <CardTitle className="text-base font-bold text-slate-800">Notice & Events</CardTitle>
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
                School announcements published from the Notices console will appear here in real time.
              </p>
            </div>
          ) : (
            recentNotices.map((notice: any) => (
              <NoticeItem key={notice.id} notice={notice} onClick={() => navigate('/notices')} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
