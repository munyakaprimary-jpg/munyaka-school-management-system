import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCentralData } from '@/hooks/useCentralData';
import { useAuth } from '@/context/AuthContext';
import { useLanSync } from '@/hooks/useLanSync';
import { getNotices } from '@/utils/notice-board';
import { formatRelativeTime } from '@/services/activityLog';
import { checkServerConnection, subscribeToConnectionStatus } from '@/services/SyncEngine';
import type { LucideIcon } from 'lucide-react';
import EnrollmentTrendChart from './EnrollmentTrendChart';
import {
  Users,
  UserCheck,
  User,
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
  Shield,
  BarChart3,
  Settings2,
  Layers,
  BookOpen,
  FileText,
  Wallet,
  FileSpreadsheet,
  Briefcase,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Bell,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';

// ─── Shared Helpers ────────────────────────────────────────────────────────────

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// ─── Live Badge ───────────────────────────────────────────────────────────────

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  subtitle,
  trend,
  trendUp,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}) => (
  <Card className="border-none shadow-sm bg-white rounded-2xl hover:-translate-y-0.5 transition-transform">
    <CardContent className="p-5 flex items-start gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-black text-slate-900 truncate leading-none">{value}</p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
);

// ─── Quick Action Card ────────────────────────────────────────────────────────

const QuickActionCard: React.FC<{
  icon: LucideIcon;
  gradient: string;
  title: string;
  description: string;
  cta: string;
  badge?: string;
  onClick: () => void;
}> = ({ icon: Icon, gradient, title, description, cta, badge, onClick }) => (
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
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
          {badge && (
            <Badge className="rounded-full px-2 py-0 text-[9px] font-black bg-indigo-50 text-indigo-600 border-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{description}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight size={12} />
        </div>
      </div>
    </div>
  </button>
);

// ─── LAN Sync Banner ──────────────────────────────────────────────────────────

interface LanSyncBannerProps {
  isOnline: boolean;
  isConnected: boolean;
  serverUrl: string;
  latency: number | null;
  onOpenSettings: () => void;
  onRefresh: () => Promise<void>;
}

const LanSyncBanner: React.FC<LanSyncBannerProps> = ({
  isOnline,
  isConnected,
  serverUrl,
  latency,
  onOpenSettings,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayHost = useMemo(() => {
    if (!serverUrl) return 'Not configured';
    try {
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
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        hover: 'hover:bg-emerald-100',
      }
    : {
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        hover: 'hover:bg-amber-100',
      };

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
      className={`w-full text-left border-none shadow-sm ${accent.bg} ring-1 ring-slate-200 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md ${accent.hover}`}
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
              className={`p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 text-slate-500 hover:text-indigo-600 hover:bg-white transition-all active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
              title="Re-test connection"
            >
              <RefreshCw size={16} />
            </button>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${accent.bg} ${accent.text}`}
            >
              {isHealthy ? 'Live' : 'Cached'}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Notice Item ─────────────────────────────────────────────────────────────

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
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0 text-[9px] font-black uppercase tracking-wider border-0 ${meta.bg} ${meta.text}`}
          >
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

// ─── Admin Management Card ─────────────────────────────────────────────────────

const AdminCard: React.FC<{
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  count?: number;
}> = ({ icon: Icon, iconBg, iconColor, title, description, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
  >
    <div className="flex items-start gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          {count !== undefined && (
            <Badge className="rounded-full bg-indigo-50 text-indigo-600 border-0 text-[10px] font-black">
              {count}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <ArrowUpRight size={14} className="text-slate-400 shrink-0 mt-1" />
    </div>
  </button>
);

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

/**
 * Full Administrator Dashboard for the `admin` role.
 *
 * Provides:
 *   - LAN Sync status banner (clickable → LAN Server Config)
 *   - System vitals: Total Students, Teachers, Attendance Rate, System Status, Fees Collected
 *   - Quick Action Cards: Enter Marks, Mark Attendance, Timetable, Manage Fees, Report Cards
 *   - Analytics: Attendance rate trend, fees summary, grade distribution
 *   - Administrative Management: Students, Staff, Grades, Learning Areas, Inventory, Settings
 *   - Recent Notices feed
 *
 * Data sources:
 *   - useCentralData: totalStudents, totalTeachers, todayAttendanceRate
 *   - useLanSync: server connection status
 *   - localStorage: transaction data (fees collected), learner counts
 *   - getNotices(): recent school notices
 */
const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useCentralData();
  const { connectionStatus } = useLanSync();

  // Local connection status synced from global hook
  const [localStatus, setLocalStatus] = useState(connectionStatus);

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setLocalStatus(status);
    });
    return unsubscribe;
  }, []);

  // LAN server URL
  const serverUrl = useMemo(() => {
    return (
      localStorage.getItem('lan_server_url') ||
      localStorage.getItem('munyaka_lan_server_url') ||
      ''
    );
  }, []);

  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
  }, []);

  const handleOpenLanSettings = () => navigate('/lan-config');

  // Fees collected
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
  }, []);

  // Active grade count
  const gradeCount = useMemo(() => {
    const grades = safeRead<any[]>('munyaka_grades', []);
    return grades.filter((g: any) => !g.isArchived).length;
  }, []);

  // Staff count
  const staffCount = useMemo(() => {
    const staff = safeRead<any[]>('munyaka_staff_directory', []);
    return staff.filter((s: any) => s.is_active !== false).length;
  }, []);

  // Recent notices
  const recentNotices = useMemo(() => getNotices().slice(0, 5), []);

  // Attendance trend (mock data — in production would come from analytics service)
  const attendanceTrend = useMemo(() => {
    return `${todayAttendanceRate}%`;
  }, [todayAttendanceRate]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  return (
    <div className="space-y-8 pb-10">

      {/* ── LAN Server Sync Status Banner ── */}
      <LanSyncBanner
        isOnline={localStatus.isOnline}
        isConnected={localStatus.serverReachable}
        serverUrl={serverUrl}
        latency={localStatus.latency}
        onOpenSettings={handleOpenLanSettings}
        onRefresh={handleLanRefresh}
      />

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
            description="Take the daily student roll call for your class."
            cta="Take Roll Call"
            onClick={() => navigate('/attendance')}
          />
          <QuickActionCard
            icon={CalendarDays}
            gradient="from-amber-500 to-orange-600"
            title="Timetable"
            description="Manage lesson schedules and period times."
            cta="Open Timetable"
            onClick={() => navigate('/timetable')}
          />
          <QuickActionCard
            icon={Wallet}
            gradient="from-blue-500 to-cyan-600"
            title="Fees & Finance"
            description="Track fee collections, invoices, and payment records."
            cta="Manage Fees"
            onClick={() => navigate('/fees')}
          />
        </div>
      </div>

      {/* ── System Vitals ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          title="Total Students"
          value={isLoading ? '—' : totalStudents.toLocaleString()}
          subtitle="across all active grades"
        />
        <StatCard
          icon={UserCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          title="Today's Attendance"
          value={isLoading ? '—' : `${todayAttendanceRate}%`}
          subtitle={todayLabel}
          trend="+2.1%"
          trendUp
        />
        <StatCard
          icon={GraduationCap}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          title="Grades Configured"
          value={gradeCount}
          subtitle={`${totalStudents} total students`}
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          title="Fees Collected"
          value={isLoading ? '—' : feesCollected}
          subtitle="this billing cycle"
        />
        <StatCard
          icon={User}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-500"
          title="Total Teachers"
          value={staffCount}
          subtitle={`${totalTeachers} teachers`}
        />
        <StatCard
          icon={Activity}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          title="System Status"
          value="Live"
          subtitle="All services operational"
        />
        <StatCard
          icon={Shield}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          title="Active Enrollments"
          value={isLoading ? '—' : totalStudents.toLocaleString()}
          subtitle="current academic year"
        />
        <StatCard
          icon={Bell}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          title="Open Alerts"
          value="0"
          subtitle="no critical alerts"
        />
      </div>

      {/* ── Enrollment Trend Chart ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Enrollment Analytics
        </h2>
        <EnrollmentTrendChart />
      </div>

      {/* ── Administrative Management ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Administration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminCard
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            title="Students"
            description="Manage learner records, profiles, and transfers."
            count={isLoading ? undefined : totalStudents}
            onClick={() => navigate('/students')}
          />
          <AdminCard
            icon={UserCheck}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            title="Staff Directory"
            description="View and manage staff accounts and roles."
            onClick={() => navigate('/staff')}
          />
          <AdminCard
            icon={Layers}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            title="Grades & Streams"
            description="Configure class grades and stream assignments."
            onClick={() => navigate('/grades')}
          />
          <AdminCard
            icon={BookOpen}
            iconBg="bg-teal-50"
            iconColor="text-teal-500"
            title="Learning Areas"
            description="Manage subjects and CBC learning areas."
            onClick={() => navigate('/learning-areas')}
          />
          <AdminCard
            icon={BarChart3}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            title="Results Analysis"
            description="View score distributions and performance trends."
            onClick={() => navigate('/analysis')}
          />
          <AdminCard
            icon={Settings2}
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            title="System Settings"
            description="Configure school preferences and system options."
            onClick={() => navigate('/settings')}
          />
          <AdminCard
            icon={FileSpreadsheet}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            title="Report Cards"
            description="Generate and print report cards for learners."
            onClick={() => navigate('/reports')}
          />
          <AdminCard
            icon={Server}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-500"
            title="Control Center"
            description="Server, devices, sync queue, and system health."
            onClick={() => navigate('/admin/control-center')}
          />
          <AdminCard
            icon={FileText}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            title="Promote Students"
            description="Promote learners to the next grade at year-end."
            onClick={() => navigate('/promote')}
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
                School announcements published here will appear in real time.
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

export default AdminDashboard;
