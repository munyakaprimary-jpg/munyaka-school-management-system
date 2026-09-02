import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
  Settings,
  Shield,
  Database,
  FileText,
  BarChart3,
  BookOpen,
  Award,
  Contact2,
  Key,
  Layers,
  Laptop,
  Monitor,
  Box,
  Wallet,
  FileSpreadsheet,
  GraduationCapIcon,
} from 'lucide-react';
import { useCentralData } from '@/hooks/useCentralData';
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
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
}) => (
  <Card 
    className={`border-none shadow-sm bg-white rounded-2xl hover:-translate-y-0.5 transition-transform ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    onClick={onClick}
  >
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

// ─── System Administrator Dashboard Component ─────────────────────────────────

/**
 * System Administrator Dashboard
 * 
 * This dashboard is for the 'admin' role (System Administrator) who handles
 * operational tasks like student management, staff management, fees, attendance,
 * assessments, and system configuration.
 * 
 * This is DIFFERENT from the Owner Dashboard ('owner'/'super_admin') which focuses
 * on billing, subscriptions, and executive-level financial overview.
 */
const SystemAdminDashboard: React.FC = () => {
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

  const { totalStudents, totalTeachers, todayAttendanceRate, isLoading } = useCentralData();

  // Total staff count (teachers + admin)
  const totalStaffCount = useMemo(() => {
    const staff: any[] = safeRead('munyaka_staff_directory', []);
    return staff.filter((s: any) => s.status !== 'Suspended').length;
  }, []);

  // Fees collected this month
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

  // Active classes/streams count
  const activeStreams = useMemo(() => {
    const streams: any[] = safeRead('school_grades_streams', []);
    return streams.filter((s: any) => s.status === 'active').length;
  }, []);

  // Trigger an immediate ping against the stored LAN server URL.
  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
  }, []);

  const handleOpenLanSettings = () => {
    navigate('/lan-config');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
            >
              <Shield size={10} />
              System Administrator
            </Badge>
            <LiveBadge label="ADMIN SYNC" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Administrator'}</span>
            <span className="text-slate-400 ml-2">• {todayLabel}</span>
          </p>
        </div>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Users}
            gradient="from-blue-500 to-indigo-600"
            title="Student Management"
            description="View, register, and manage all enrolled learners."
            cta="Open Students"
            onClick={() => navigate('/students')}
          />
          <QuickActionCard
            icon={Contact2}
            gradient="from-violet-500 to-purple-600"
            title="Staff Directory"
            description="Manage teachers, admin staff, and their access."
            cta="Open Staff"
            onClick={() => navigate('/staff')}
          />
          <QuickActionCard
            icon={Wallet}
            gradient="from-emerald-500 to-teal-600"
            title="Fees & Finance"
            description="Track fees collections, invoices, and payments."
            cta="View Fees"
            onClick={() => navigate('/fees')}
          />
          <QuickActionCard
            icon={ClipboardCheck}
            gradient="from-amber-500 to-orange-600"
            title="Student Attendance"
            description="Take daily roll call and monitor attendance."
            cta="Take Attendance"
            onClick={() => navigate('/attendance')}
          />
        </div>
      </div>

      {/* ── System Vitals Cards ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          System Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            title="Total Students"
            value={isLoading ? '—' : totalStudents.toString()}
            subtitle="enrolled learners"
            onClick={() => navigate('/students')}
          />
          <StatCard
            icon={Contact2}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            title="Total Staff"
            value={isLoading ? '—' : totalStaffCount.toString()}
            subtitle="active members"
            onClick={() => navigate('/staff')}
          />
          <StatCard
            icon={UserCheck}
            iconBg="bg-green-50"
            iconColor="text-green-500"
            title="Today's Attendance"
            value={isLoading ? '—' : `${todayAttendanceRate}%`}
            subtitle="attendance rate"
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            icon={GraduationCap}
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
            title="Active Streams"
            value={isLoading ? '—' : activeStreams.toString()}
            subtitle="grades & classes"
            onClick={() => navigate('/grades')}
          />
          <StatCard
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            title="Fees Collected"
            value={isLoading ? '—' : feesCollected}
            subtitle="total paid"
            onClick={() => navigate('/fees')}
          />
          <StatCard
            icon={Activity}
            iconBg="bg-teal-50"
            iconColor="text-teal-500"
            title="System Status"
            value="Live"
            subtitle="operational"
          />
          <StatCard
            icon={Layers}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            title="Exam Types"
            value={isLoading ? '—' : 'CBC'}
            subtitle="curriculum"
            onClick={() => navigate('/exam-types')}
          />
          <StatCard
            icon={CalendarDays}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            title="Timetable"
            value="Active"
            subtitle="schedule"
            onClick={() => navigate('/timetable')}
          />
        </div>
      </div>

      {/* ── Admin Control Links ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          System Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Settings}
            gradient="from-slate-600 to-slate-800"
            title="Admin Control Center"
            description="System configuration, accounts, and operational settings."
            cta="Open Control Center"
            onClick={() => navigate('/admin/control-center')}
          />
          <QuickActionCard
            icon={Key}
            gradient="from-cyan-500 to-blue-600"
            title="Staff Access Master"
            description="Manage pre-registrations and staff access permissions."
            cta="Manage Access"
            onClick={() => navigate('/staff/pre-registration')}
          />
          <QuickActionCard
            icon={Monitor}
            gradient="from-violet-600 to-indigo-700"
            title="ICT Lab & Devices"
            description="Manage school devices, assets, and ICT infrastructure."
            cta="Open ICT Lab"
            onClick={() => navigate('/ict-lab')}
          />
          <QuickActionCard
            icon={Box}
            gradient="from-orange-500 to-red-600"
            title="Tools & Inventory"
            description="Track and manage school tools and inventory assets."
            cta="View Inventory"
            onClick={() => navigate('/inventory')}
          />
          <QuickActionCard
            icon={Database}
            gradient="from-teal-500 to-emerald-600"
            title="Central Data & APK"
            description="Manage central data and APK distribution."
            cta="Open Central Data"
            onClick={() => navigate('/central-data')}
          />
          <QuickActionCard
            icon={FileSpreadsheet}
            gradient="from-pink-500 to-rose-600"
            title="Enter Marks"
            description="Record learner scores and assessments."
            cta="Open Assessments"
            onClick={() => navigate('/assessments')}
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

export default SystemAdminDashboard;
