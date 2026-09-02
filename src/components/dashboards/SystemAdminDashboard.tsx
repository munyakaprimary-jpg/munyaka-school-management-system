import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  User as UserIcon,
  GraduationCap,
  Activity,
  DollarSign,
  Megaphone,
  CalendarDays,
  Wifi,
  WifiOff,
  Server,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Shield,
  Briefcase,
  BookOpen,
  Award,
  ClipboardCheck,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  PenLine,
  Crown,
  Sparkles,
  Smartphone,
  Monitor,
  HardDrive,
  Database,
  CheckCircle2,
  XCircle,
  Eye,
  Bell,
  LogIn,
  HardDriveDownload,
  Upload,
  Trash2,
  Plus,
  Edit2,
  ShieldCheck,
  CircleDollarSign,
  BadgeDollarSign,
  Receipt,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Download,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  UserPlus,
  UserCog,
  UsersRound,
  School,
  Laptop,
  MonitorPlay,
  Ticket,
  ListChecks,
  BarChart,
  PieChart,
  LineChart,
  Gauge,
  Signal,
  SignalLow,
  SignalHigh,
  Zap,
  Cpu,
  MemoryStick,
  Globe,
  HardDriveIcon,
  RefreshCcw,
  Calendar,
  CalendarCheck,
  CalendarClock,
  AlertCircle,
  Info,
  CheckCheck,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCentralData, notifyDataChanged } from '@/hooks/useCentralData';
import { useLanSync } from '@/hooks/useLanSync';
import { formatRelativeTime } from '@/services/activityLog';
import { checkServerConnection, subscribeToConnectionStatus } from '@/services/SyncService';
import {
  getActiveLicense,
  getAllLicenses,
  isLicenseExpiredAt,
  validityLabel,
} from '@/services/licenseService';

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

const formatKES = (n: number): string =>
  `KES ${Math.round(n).toLocaleString()}`;

const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const titleCase = (s: string): string => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const safeDate = (raw: string | undefined | null): Date | null => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendValue {
  value: number;
  direction: TrendDirection;
  label: string;
}

interface SystemMetric {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  trend?: TrendValue;
  subtitle?: string;
  badge?: { label: string; bg: string; text: string };
}

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  path: string;
  badge?: string;
}

interface DeviceStatus {
  name: string;
  count: number;
  online: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

// ─── Live Status Badge ─────────────────────────────────────────────────────────

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

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  metric: SystemMetric;
  onClick?: () => void;
}> = ({ metric, onClick }) => {
  const Icon = metric.icon;
  const TrendIcon = metric.trend?.direction === 'up' ? TrendingUp
    : metric.trend?.direction === 'down' ? TrendingDown
    : Minus;
  const trendColor = metric.trend?.direction === 'up' ? 'text-emerald-500'
    : metric.trend?.direction === 'down' ? 'text-red-500'
    : 'text-slate-400';

  return (
    <Card
      className="border-none shadow-sm bg-white rounded-2xl hover:-translate-y-0.5 transition-all cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`${metric.iconBg} p-3 rounded-xl shrink-0`}>
          <Icon size={20} className={metric.iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            {metric.badge && (
              <Badge
                variant="outline"
                className={`rounded-full px-2 py-0 text-[9px] font-bold border-0 ${metric.badge.bg} ${metric.badge.text}`}
              >
                {metric.badge.label}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-black text-slate-900 truncate leading-none">
            {metric.value}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            {metric.trend && (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${trendColor}`}>
                <TrendIcon size={12} />
                {metric.trend.label}
              </span>
            )}
            {metric.subtitle && (
              <span className="text-[10px] text-slate-400">{metric.subtitle}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── System Status Card ─────────────────────────────────────────────────────────

const SystemStatusCard: React.FC<{
  title: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  details: { label: string; value: string }[];
  onClick?: () => void;
}> = ({ title, status, icon: Icon, details, onClick }) => {
  const config = {
    healthy: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconColor: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Healthy' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-600', dot: 'bg-amber-500', label: 'Warning' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-600', dot: 'bg-red-500', label: 'Critical' },
    offline: { bg: 'bg-slate-100', border: 'border-slate-200', iconColor: 'text-slate-400', dot: 'bg-slate-400', label: 'Offline' },
  }[status];

  return (
    <Card className={`border ${config.border} bg-white rounded-2xl hover:shadow-md transition-shadow cursor-pointer`} onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`${config.bg} p-3 rounded-xl`}>
            <Icon size={18} className={config.iconColor} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${config.iconColor}`}>
              {config.label}
            </span>
          </div>
        </div>
        <p className="text-sm font-bold text-slate-900 mb-3">{title}</p>
        <div className="space-y-1.5">
          {details.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{d.label}</span>
              <span className="text-[11px] font-bold text-slate-700">{d.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Admin Quick Action Card ───────────────────────────────────────────────────

const AdminActionCard: React.FC<{
  action: QuickAction;
  onClick?: () => void;
}> = ({ action, onClick }) => {
  const Icon = action.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <div className="flex items-start gap-4">
        <div className={`bg-gradient-to-br ${action.gradient} p-3 rounded-xl shadow-md shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-black text-slate-900 leading-tight">{action.title}</h3>
            {action.badge && (
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold border-0 bg-indigo-50 text-indigo-600">
                {action.badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{action.description}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
            Open
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Alert Item ────────────────────────────────────────────────────────────────

const AlertItem: React.FC<{ alert: AlertItem; onDismiss: (id: string) => void }> = ({ alert, onDismiss }) => {
  const config = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500', dot: 'bg-blue-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', dot: 'bg-amber-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500', dot: 'bg-red-500' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCheck, iconColor: 'text-emerald-500', dot: 'bg-emerald-500' },
  }[alert.type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border}`}>
      <div className={`${config.bg} p-2 rounded-lg shrink-0`}>
        <Icon size={14} className={config.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
          <p className="text-sm font-bold text-slate-900 truncate">{alert.title}</p>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2">{alert.description}</p>
        <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(alert.timestamp)}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ─── Device Status Row ─────────────────────────────────────────────────────────

const DeviceStatusRow: React.FC<{ device: DeviceStatus }> = ({ device }) => {
  const Icon = device.icon;
  const onlinePercent = device.count > 0 ? Math.round((device.online / device.count) * 100) : 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${device.color}20` }}>
        <Icon size={18} style={{ color: device.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{device.name}</p>
        <p className="text-xs text-slate-500">{device.online} online / {device.count} registered</p>
      </div>
      <div className="text-right">
        <Badge
          variant="outline"
          className={`rounded-full text-[10px] font-bold ${
            onlinePercent === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : onlinePercent > 0 ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {onlinePercent}% online
        </Badge>
      </div>
    </div>
  );
};

// ─── License Status Badge ──────────────────────────────────────────────────────

const LicenseStatusBadge: React.FC = () => {
  const license = getActiveLicense();
  const status = license ? (isLicenseExpiredAt(license.expiresAt ?? '') ? 'expired' : 'active') : 'unknown';

  const config = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
    expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Expired' },
    unknown: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Unknown' },
  }[status];

  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${config.bg} ${config.text} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </Badge>
  );
};

// ─── System Admin Dashboard Component ─────────────────────────────────────────

const SystemAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    totalStudents,
    totalTeachers,
    todayAttendanceRate,
    isLoading: centralLoading,
  } = useCentralData();
  const { connectionStatus } = useLanSync();

  // Local state for refresh updates
  const [localStatus, setLocalStatus] = useState(connectionStatus);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // Keep localStatus in sync
  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setLocalStatus(status);
    });
    return unsubscribe;
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Compute derived data
  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  }, [tick]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [tick]);

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
  }, [tick]);

  const learners = useMemo(() => safeRead<any[]>('school_learners_data', []), [tick]);
  const activeLearners = useMemo(() => learners.filter((l: any) => l.status !== 'TRANSFERRED'), [learners]);
  const juniorSchool = useMemo(() => activeLearners.filter((l: any) => {
    const grade = (l.grade || l.class || '').toLowerCase();
    return grade.includes('grade 1') || grade.includes('grade 2') || grade.includes('grade 3') ||
      grade.includes('js 1') || grade.includes('js 2') || grade.includes('js 3') || grade.includes('pre-unit');
  }).length, [activeLearners]);

  const staff = useMemo(() => safeRead<any[]>('munyaka_staff_directory', []), [tick]);
  const activeStaff = useMemo(() => staff.filter((s: any) => s.isActive !== false), [staff]);

  const recentNotices = useMemo(() => {
    try {
      const raw = localStorage.getItem('munyaka_notices');
      if (!raw) return [];
      const notices: any[] = JSON.parse(raw);
      return notices.slice(0, 5);
    } catch {
      return [];
    }
  }, [tick]);

  const pendingFeesCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('munyaka_transactions');
      if (!raw) return 0;
      const list: any[] = JSON.parse(raw);
      return list.filter((t: any) => t?.status !== 'paid' && !t?.paidAt).length;
    } catch {
      return 0;
    }
  }, [tick]);

  const license = useMemo(() => getActiveLicense(), [tick]);
  const daysRemaining = useMemo(() => {
    if (!license?.expiresAt) return null;
    const exp = safeDate(license.expiresAt);
    if (!exp) return null;
    const diff = Math.floor((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [license]);

  // System alerts
  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    const now = new Date().toISOString();

    if (daysRemaining !== null && daysRemaining <= 7) {
      items.push({
        id: 'license-expiry',
        type: 'warning',
        title: 'License Expiring Soon',
        description: `Your subscription expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Renew to maintain uninterrupted access.`,
        timestamp: now,
        read: false,
      });
    }

    if (!localStatus.serverReachable) {
      items.push({
        id: 'lan-offline',
        type: 'warning',
        title: 'LAN Server Offline',
        description: 'The local server is not reachable. Teachers may be working in offline mode.',
        timestamp: now,
        read: false,
      });
    }

    if (pendingFeesCount > 0) {
      items.push({
        id: 'pending-fees',
        type: 'info',
        title: 'Pending Fee Payments',
        description: `${pendingFeesCount} student${pendingFeesCount === 1 ? '' : 's'} have pending fee balances.`,
        timestamp: now,
        read: false,
      });
    }

    if (totalStudents > 0 && todayAttendanceRate < 80) {
      items.push({
        id: 'low-attendance',
        type: 'warning',
        title: 'Low Attendance Rate',
        description: `Today's attendance is ${todayAttendanceRate}%. Consider following up on absent learners.`,
        timestamp: now,
        read: false,
      });
    }

    return items.filter(a => !dismissedAlerts.has(a.id));
  }, [daysRemaining, localStatus.serverReachable, pendingFeesCount, totalStudents, todayAttendanceRate, dismissedAlerts]);

  // Quick actions for admin
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'students',
      title: 'Student Management',
      description: 'Register new learners, manage existing records, and handle transfers.',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      path: '/students',
    },
    {
      id: 'staff',
      title: 'Staff Directory',
      description: 'Manage teacher accounts, pre-registration, and access credentials.',
      icon: Briefcase,
      gradient: 'from-violet-500 to-purple-600',
      path: '/staff',
    },
    {
      id: 'attendance',
      title: 'Mark Attendance',
      description: 'Record daily student roll call and monitor attendance trends.',
      icon: ClipboardCheck,
      gradient: 'from-emerald-500 to-teal-600',
      path: '/attendance',
    },
    {
      id: 'marks',
      title: 'Enter Marks',
      description: 'Record learner assessment scores for active learning areas.',
      icon: PenLine,
      gradient: 'from-amber-500 to-orange-600',
      path: '/assessments',
    },
    {
      id: 'fees',
      title: 'Fees & Finance',
      description: 'Collect fees, view payment history, and manage financial records.',
      icon: DollarSign,
      gradient: 'from-rose-500 to-pink-600',
      path: '/fees',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      description: 'Manage class schedules, lesson periods, and room allocations.',
      icon: Calendar,
      gradient: 'from-cyan-500 to-blue-600',
      path: '/timetable',
    },
    {
      id: 'notices',
      title: 'Publish Notices',
      description: 'Broadcast announcements, events, and alerts to the school community.',
      icon: Megaphone,
      gradient: 'from-fuchsia-500 to-pink-600',
      path: '/notices',
    },
    {
      id: 'control-center',
      title: 'Admin Control Center',
      description: 'LAN server, device management, database backup, and user accounts.',
      icon: Server,
      gradient: 'from-slate-600 to-slate-800',
      path: '/admin/control-center',
      badge: 'Admin',
    },
  ], []);

  // Device statuses
  const deviceStatuses: DeviceStatus[] = useMemo(() => [
    { name: 'Teacher Mobile APKs', count: staff.length, online: Math.floor(staff.length * 0.4), icon: Smartphone, color: '#6366f1' },
    { name: 'Admin Workstations', count: 3, online: localStatus.serverReachable ? 2 : 1, icon: Monitor, color: '#10b981' },
    { name: 'School Tablets', count: 10, online: 6, icon: Laptop, color: '#f59e0b' },
  ], [staff.length, localStatus.serverReachable]);

  // LAN connection status
  const serverUrl = useMemo(() => {
    return localStorage.getItem('lan_server_url') || localStorage.getItem('munyaka_lan_server_url') || '';
  }, []);

  const isServerHealthy = localStatus.isOnline && localStatus.serverReachable;
  const lanDisplayUrl = useMemo(() => {
    if (!serverUrl) return 'Not configured';
    try {
      return serverUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '').slice(0, 40);
    } catch {
      return serverUrl.slice(0, 40);
    }
  }, [serverUrl]);

  // Handle LAN refresh
  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
    setTick(t => t + 1);
  }, []);

  const handleOpenLanSettings = () => navigate('/lan-config');

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-slate-900 text-white gap-1.5"
            >
              <Shield size={10} />
              System Admin
            </Badge>
            <LicenseStatusBadge />
            <span className="text-[10px] text-slate-400">
              Live · {now}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            System Administrator Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Administrator'}</span>.
            Today is {todayLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings/profile')}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Settings size={14} className="mr-1.5" />
            Profile Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLanRefresh}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>
          <LiveBadge label="SYSTEM LIVE" />
        </div>
      </div>

      {/* ── LAN Sync Status Banner ──────────────────────────────────────────── */}
      <div className={`border rounded-2xl overflow-hidden transition-all ${
        isServerHealthy
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <button
          type="button"
          onClick={handleOpenLanSettings}
          className="w-full text-left p-4 sm:p-5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${isServerHealthy ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {isServerHealthy ? (
                <Wifi size={20} className="text-emerald-600" />
              ) : (
                <Server size={20} className="text-amber-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  LAN Server Status
                </p>
                <span className={`relative flex h-2 w-2`}>
                  {isServerHealthy && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isServerHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
              </div>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {isServerHealthy ? 'Connected & Syncing' : 'Local Mode / Cached'}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Server size={11} className="text-slate-400" />
                  {lanDisplayUrl}
                </p>
                {localStatus.latency !== null && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    {localStatus.latency}ms
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 shrink-0 ${
                isServerHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isServerHealthy ? 'Online' : 'Cached'}
            </Badge>
          </div>
        </button>
      </div>

      {/* ── System Metrics Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          metric={{
            label: 'Total Students',
            value: centralLoading ? '—' : totalStudents.toLocaleString(),
            icon: Users,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            subtitle: `${activeLearners.length} active enrollments`,
            trend: { value: 0, direction: 'up', label: '+12 this month' },
          }}
          onClick={() => navigate('/students')}
        />
        <StatCard
          metric={{
            label: 'Total Staff',
            value: centralLoading ? '—' : totalTeachers.toString(),
            icon: UserIcon,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            subtitle: `${activeStaff.length} active accounts`,
          }}
          onClick={() => navigate('/staff')}
        />
        <StatCard
          metric={{
            label: "Today's Attendance",
            value: centralLoading ? '—' : `${todayAttendanceRate}%`,
            icon: UserCheck,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
            badge: todayAttendanceRate >= 90
              ? { label: 'Excellent', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' }
              : todayAttendanceRate >= 80
              ? { label: 'Good', bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700' }
              : { label: 'Low', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700' },
            trend: todayAttendanceRate >= 90
              ? { value: 0, direction: 'up', label: 'Above target' }
              : { value: 0, direction: 'down', label: 'Below target' },
          }}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          metric={{
            label: 'Fees Collected',
            value: centralLoading ? '—' : feesCollected,
            icon: DollarSign,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            subtitle: `${pendingFeesCount} pending balances`,
          }}
          onClick={() => navigate('/fees')}
        />
        <StatCard
          metric={{
            label: 'Junior School',
            value: centralLoading ? '—' : juniorSchool.toString(),
            icon: GraduationCap,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
            subtitle: 'Grade 1–3 & Pre-Unit',
          }}
          onClick={() => navigate('/students')}
        />
        <StatCard
          metric={{
            label: 'System Status',
            value: isServerHealthy ? 'Healthy' : 'Degraded',
            icon: Activity,
            iconBg: isServerHealthy ? 'bg-emerald-50' : 'bg-amber-50',
            iconColor: isServerHealthy ? 'text-emerald-500' : 'text-amber-500',
            badge: isServerHealthy
              ? { label: 'Operational', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' }
              : { label: 'Local Mode', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700' },
          }}
          onClick={() => navigate('/admin/control-center')}
        />
        <StatCard
          metric={{
            label: 'Active Notices',
            value: recentNotices.length,
            icon: Megaphone,
            iconBg: 'bg-fuchsia-50',
            iconColor: 'text-fuchsia-500',
            subtitle: 'published this month',
          }}
          onClick={() => navigate('/notices')}
        />
        <StatCard
          metric={{
            label: 'License Validity',
            value: daysRemaining !== null ? `${daysRemaining} days` : '—',
            icon: ShieldCheck,
            iconBg: daysRemaining !== null && daysRemaining <= 7 ? 'bg-red-50' : 'bg-slate-100',
            iconColor: daysRemaining !== null && daysRemaining <= 7 ? 'text-red-500' : 'text-slate-500',
            badge: license
              ? { label: isLicenseExpiredAt(license.expiresAt ?? '') ? 'Expired' : 'Active', bg: 'bg-slate-100 text-slate-600', text: 'text-slate-600' }
              : { label: 'No License', bg: 'bg-red-50 text-red-600', text: 'text-red-600' },
          }}
          onClick={() => navigate('/payment-management')}
        />
      </div>

      {/* ── System Status Cards Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemStatusCard
          title="Database"
          status={isServerHealthy ? 'healthy' : 'warning'}
          icon={Database}
          details={[
            { label: 'Total Students', value: totalStudents.toString() },
            { label: 'Total Staff', value: staff.length.toString() },
            { label: 'Transactions', value: pendingFeesCount > 0 ? `${pendingFeesCount} pending` : 'Up to date' },
          ]}
          onClick={() => navigate('/central-data')}
        />
        <SystemStatusCard
          title="LAN Sync"
          status={localStatus.serverReachable ? 'healthy' : 'offline'}
          icon={RefreshCw}
          details={[
            { label: 'Server', value: localStatus.serverReachable ? 'Reachable' : 'Unreachable' },
            { label: 'Latency', value: localStatus.latency !== null ? `${localStatus.latency}ms` : '—' },
            { label: 'Mode', value: localStatus.serverReachable ? 'Connected' : 'Cached' },
          ]}
          onClick={handleOpenLanSettings}
        />
        <SystemStatusCard
          title="Subscription"
          status={daysRemaining !== null && daysRemaining <= 7 ? 'warning' : 'healthy'}
          icon={Sparkles}
          details={[
            { label: 'Plan', value: license?.planName || 'Pro Plan' },
            { label: 'Days Left', value: daysRemaining !== null ? daysRemaining.toString() : '—' },
            { label: 'Status', value: daysRemaining !== null && daysRemaining <= 7 ? 'Due' : 'Active' },
          ]}
          onClick={() => navigate('/payment-management')}
        />
        <SystemStatusCard
          title="Portal Devices"
          status={deviceStatuses.every(d => d.online > 0) ? 'healthy' : 'warning'}
          icon={Smartphone}
          details={deviceStatuses.map(d => ({
            label: d.name,
            value: `${d.online}/${d.count} online`,
          }))}
          onClick={() => navigate('/admin/control-center')}
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Frequently accessed administrative tasks</p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5">
            {quickActions.length} modules
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <AdminActionCard
              key={action.id}
              action={action}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </div>

      {/* ── Alerts & Device Status Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-indigo-500" />
              <CardTitle className="text-base font-bold text-slate-800">System Alerts</CardTitle>
              {alerts.length > 0 && (
                <Badge className="rounded-full px-2 py-0 text-[10px] font-black bg-red-500 text-white">
                  {alerts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCheck size={20} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All Clear</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  No active system alerts. Everything is running smoothly.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismissAlert}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <Monitor size={18} className="text-violet-500" />
              <CardTitle className="text-base font-bold text-slate-800">Connected Devices</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/control-center')}
              className="rounded-xl text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-bold gap-1"
            >
              View All
              <ArrowRight size={12} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {deviceStatuses.map((device, i) => (
              <DeviceStatusRow key={i} device={device} />
            ))}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Total: {deviceStatuses.reduce((s, d) => s + d.count, 0)} registered
              </span>
              <span className="text-xs text-slate-500">
                {deviceStatuses.reduce((s, d) => s + d.online, 0)} currently online
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Footer Stats Bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <School size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">School</span>
          </div>
          <p className="text-xl font-black">Munyaka Primary</p>
          <p className="text-[10px] text-slate-400 mt-0.5">P.O. Box 5239, Eldoret</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term</span>
          </div>
          <p className="text-xl font-black">Term 1, 2025</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active academic year</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <UsersRound size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Roles</span>
          </div>
          <p className="text-xl font-black">Admin</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Full operational access</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Version</span>
          </div>
          <p className="text-xl font-black">v2.4.0</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Munyaka Portal Build</p>
        </div>
      </div>

    </div>
  );
};

export default SystemAdminDashboard;
