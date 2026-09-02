import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';
import AdminDashboardComponent from '@/components/dashboards/AdminDashboard';
import type { LucideIcon } from 'lucide-react';

/** Identifiers for the dashboard widgets used by the RBAC matrix. */
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
  | 'todayLessonSchedule';
import {
  Users,
  UserCheck,
  GraduationCap,
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
} from 'lucide-react';
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
}: {
  icon: LucideIcon;
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

// ─── Quick Action Card ────────────────────────────────────────────────────────

const QuickActionCard: React.FC<{
  icon: LucideIcon;
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
        ring: 'ring-emerald-200',
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        hover: 'hover:bg-emerald-100',
      }
    : {
        ring: 'ring-amber-200',
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

// ─── Notice Row ──────────────────────────────────────────────────────────────

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

// ─── Role: Teacher Dashboard ──────────────────────────────────────────────────

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connectionStatus } = useLanSync();

  // Local state for refresh updates — synced with the global hook via subscription
  const [localStatus, setLocalStatus] = useState(connectionStatus);

  // Keep localStatus in sync with the global hook's connection status
  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setLocalStatus(status);
    });
    return unsubscribe;
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayLabel = useMemo(
    () => today.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' }),
    [today]
  );

  // Assigned students count
  const assignedStudentsCount = useMemo(() => {
    const learners: any[] = safeRead('school_learners_data', []);
    return learners.filter((l: any) => l.status !== 'TRANSFERRED').length;
  }, []);

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

  // Trigger an immediate ping against the stored LAN server URL.
    // checkServerConnection() reads from localStorage.getItem('lan_server_url')
    // internally, so we just need to invoke it and reflect the result.
    const handleLanRefresh = useCallback(async () => {
      const status = await checkServerConnection();
      setLocalStatus(status);
    }, []);

  const handleOpenLanSettings = () => {
    navigate('/lan-config');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── LAN Server Sync Status Badge (clickable) ── */}
      <LanSyncBanner
        isOnline={localStatus.isOnline}
        isConnected={localStatus.serverReachable}
        serverUrl={serverUrl}
        latency={localStatus.latency}
        onOpenSettings={handleOpenLanSettings}
        onRefresh={handleLanRefresh}
      />

      {/* ── Quick Action Cards ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            description="View your weekly lesson schedule and periods."
            cta="Open Timetable"
            onClick={() => navigate('/timetable')}
          />
        </div>
      </div>

      {/* ── Summary Card: Assigned Students ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          title="Assigned Students"
          value={assignedStudentsCount}
          subtitle="across all active classes"
        />
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────

/**
 * Top-level Dashboard component.
 *
 * Reads the current user's role and renders the role-specific view:
 *   • owner    → OwnerDashboard (subscription / billing / licensing)
 *   • admin    → AdminDashboardComponent (operational system overview,
 *                 LAN status, management cards, notices)
 *   • teacher  → quick action tiles (Enter Marks, Mark Attendance, Timetable)
 *                 + LAN sync status + notice feed
 *
 * The 'admin' and 'owner' roles are STRICTLY SEPARATED. The admin role
 * never sees the OwnerDashboard, and the owner role never sees the
 * AdminDashboardComponent. Each component is a self-contained module
 * under src/components/dashboards/.
 *
 * The header title is dynamic:
 *   • "Owner Dashboard" for the owner role
 *   • "Admin Dashboard" for the admin role
 *   • "Teacher's Dashboard" for the teacher role
 *   • "Dashboard" for every other role
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Owner sees the full Owner Dashboard; no wrapper header needed there
  if (role === 'owner') {
    return <OwnerDashboard />;
  }

  // Admin sees the dedicated Admin Dashboard (operational full admin)
  if (role === 'admin') {
    return (
      <div className="space-y-6">
        {/* ── Admin Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
              >
                Admin Console
              </Badge>
              <LiveBadge label="LIVE SYNC" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Full system access. Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Administrator'}</span>
            </p>
          </div>
        </div>
        <AdminDashboardComponent />
      </div>
    );
  }

  const title = role === 'teacher' ? "Teacher's Dashboard" : "Dashboard";

  return (
    <div className="space-y-6">
      {/* ── Dynamic Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'User'}</span>
          </p>
        </div>
        <LiveBadge label={role === 'teacher' ? 'TEACHER SYNC' : 'LIVE SYNC'} />
      </div>

      {/* ── Teacher-only view ── */}
      {role === 'teacher' && <TeacherDashboard />}
    </div>
  );
};

export default Dashboard;