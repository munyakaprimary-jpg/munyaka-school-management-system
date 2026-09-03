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
  ClipboardList,
  CalendarDays,
  CalendarClock,
  Wifi,
  WifiOff,
  Server,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  FileText,
  LayoutGrid,
  CheckCircle2,
  Circle,
  UsersRound,
  BookMarked,
  BarChart3,
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

// Helper to get today's day key (mon, tue, wed, thu, fri)
const getTodayKey = (): string => {
  const dayIndex = new Date().getDay();
  const days: Record<number, string> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
  return days[dayIndex] || 'mon';
};

// Helper to check if current time is within a period
const isCurrentPeriod = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// ─── My Daily Schedule Card ────────────────────────────────────────────────────
interface PeriodEntry {
  period: number;
  time: string;
  grade: string;
  subject: string;
  isCurrent: boolean;
  status: 'upcoming' | 'active' | 'completed';
}

const MyDailyScheduleCard: React.FC<{ onViewTimetable: () => void }> = ({ onViewTimetable }) => {
  const todayKey = getTodayKey();
  const todayLabel = new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'short', day: 'numeric' });

  // Mock teacher's assigned lessons for today (in real app, this would come from teacher timetable)
  const todaySchedule: PeriodEntry[] = useMemo(() => {
    const lessons = [
      { period: 1, time: '08:00 - 08:30', grade: 'Grade 4 Blue', subject: 'Mathematics', isCurrent: false },
      { period: 2, time: '08:30 - 09:10', grade: 'Grade 4 Blue', subject: 'English', isCurrent: false },
      { period: 3, time: '09:10 - 09:50', grade: 'Grade 5 Green', subject: 'Agriculture', isCurrent: false },
      { period: 4, time: '09:50 - 10:30', grade: 'Grade 5 Green', subject: 'Science', isCurrent: true },
      { period: 5, time: '10:30 - 11:00', grade: 'Break', subject: '', isCurrent: false, status: 'break' },
      { period: 6, time: '11:00 - 11:40', grade: 'Grade 4 Blue', subject: 'Social Studies', isCurrent: false },
      { period: 7, time: '11:40 - 12:20', grade: 'Grade 4 Blue', subject: 'Creative Arts', isCurrent: false },
      { period: 8, time: '12:20 - 13:00', grade: 'Lunch Break', subject: '', isCurrent: false, status: 'break' },
    ];
    
    return lessons.map((l) => ({
      ...l,
      status: l.isCurrent ? 'active' as const : l.status as 'upcoming' | 'completed' | 'break' || 'upcoming' as const,
    }));
  }, []);

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CalendarClock size={18} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Today's Classes & Learning Areas</CardTitle>
              <p className="text-xs text-slate-500">{todayLabel}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewTimetable}
            className="text-indigo-600 hover:bg-indigo-50 gap-1.5 h-7 text-xs font-bold"
          >
            Full Timetable
            <ArrowRight size={12} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {todaySchedule.map((entry) => (
            <div
              key={entry.period}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                entry.status === 'active'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : entry.status === 'completed'
                  ? 'bg-slate-50 opacity-60'
                  : entry.status === 'break'
                  ? 'bg-amber-50/50'
                  : 'bg-white border border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                entry.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : entry.status === 'completed'
                  ? 'bg-slate-200 text-slate-500'
                  : entry.status === 'break'
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {entry.status === 'completed' ? <CheckCircle2 size={14} /> : entry.period}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold truncate ${entry.status === 'active' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {entry.subject || entry.grade}
                  </p>
                  {entry.status === 'active' && (
                    <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-black bg-emerald-100 text-emerald-700 border-emerald-200">
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {entry.subject ? `${entry.grade}` : ''} • {entry.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Quick Actions Grid ────────────────────────────────────────────────────────
interface QuickActionItem {
  icon: LucideIcon;
  gradient: string;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: 'pending' | 'saved' | 'info';
  onClick: () => void;
}

const QuickActionsGrid: React.FC<{
  attendanceStatus: 'pending' | 'saved';
  pendingMarksCount: number;
  onMarkAttendance: () => void;
  onEnterMarks: () => void;
  onDownloadReports: () => void;
  onViewTimetable: () => void;
}> = ({
  attendanceStatus,
  pendingMarksCount,
  onMarkAttendance,
  onEnterMarks,
  onDownloadReports,
  onViewTimetable,
}) => {
  const actions: QuickActionItem[] = [
    {
      icon: ClipboardCheck,
      gradient: 'from-emerald-500 to-teal-600',
      title: 'Mark Attendance',
      description: attendanceStatus === 'saved' ? 'Register saved for today' : 'Take today\'s roll call',
      badge: attendanceStatus === 'saved' ? 'Saved' : 'Pending',
      badgeVariant: attendanceStatus === 'saved' ? 'saved' : 'pending',
      onClick: onMarkAttendance,
    },
    {
      icon: PenLine,
      gradient: 'from-indigo-500 to-violet-600',
      title: 'Enter Assessment',
      description: 'Record learner scores & evaluations',
      badge: pendingMarksCount > 0 ? `${pendingMarksCount} Pending` : undefined,
      badgeVariant: pendingMarksCount > 0 ? 'pending' : 'info',
      onClick: onEnterMarks,
    },
    {
      icon: FileText,
      gradient: 'from-amber-500 to-orange-600',
      title: 'Report Cards',
      description: 'Generate & download CBC reports',
      onClick: onDownloadReports,
    },
    {
      icon: CalendarDays,
      gradient: 'from-blue-500 to-cyan-600',
      title: 'Class Timetable',
      description: 'View your weekly schedule',
      onClick: onViewTimetable,
    },
  ];

  return (
    <div>
      <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
        Daily Tasks
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={action.onClick}
            className="group text-left bg-white border border-slate-100 shadow-sm rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 relative"
          >
            <div className={`bg-gradient-to-br ${action.gradient} p-2.5 rounded-xl shadow-md mb-3 w-fit`}>
              <action.icon size={18} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">{action.title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{action.description}</p>
            {action.badge && (
              <Badge
                variant="outline"
                className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[9px] font-black border-0 ${
                  action.badgeVariant === 'saved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : action.badgeVariant === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {action.badge}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── My Assigned Classes Summary ───────────────────────────────────────────────
const MyClassesSummary: React.FC = () => {
  const learners = useMemo(() => safeRead<any[]>('school_learners_data', []), []);
  const activeLearners = learners.filter((l: any) => l.status !== 'TRANSFERRED');
  
  // Mock data - in real app, these would come from teacher's assigned class
  const myClass = 'Grade 4 Blue';
  const totalLearners = activeLearners.length;
  const boysCount = activeLearners.filter((l: any) => l.gender?.toLowerCase() === 'male').length;
  const girlsCount = activeLearners.filter((l: any) => l.gender?.toLowerCase() === 'female').length;
  const pendingMarks = 3; // Mock pending marks count

  return (
    <Card className="border-none shadow-sm bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl overflow-hidden text-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80">My Class</p>
            <p className="text-lg font-black">{myClass}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <UsersRound size={14} className="text-white/70" />
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">Enrolled</p>
            </div>
            <p className="text-xl font-black">{totalLearners}</p>
            <p className="text-[10px] text-white/70">
              {boysCount} Boys / {girlsCount} Girls
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookMarked size={14} className="text-white/70" />
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">Pending Marks</p>
            </div>
            <p className="text-xl font-black">{pendingMarks}</p>
            <p className="text-[10px] text-white/70">unsubmitted entries</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Compact LAN Sync Banner ──────────────────────────────────────────────────
const CompactLanSyncBanner: React.FC<{
  isOnline: boolean;
  isConnected: boolean;
  serverUrl: string;
  latency: number | null;
  onOpenSettings: () => void;
  onRefresh: () => Promise<void>;
}> = ({ isOnline, isConnected, serverUrl, latency, onOpenSettings, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isHealthy = isOnline && isConnected;
  
  const displayHost = useMemo(() => {
    if (!serverUrl) return 'Not configured';
    try {
      return serverUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '').slice(0, 24);
    } catch {
      return serverUrl;
    }
  }, [serverUrl]);

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
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${
        isHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-100' : 'bg-amber-100'}`}>
        <Server size={16} className={isHealthy ? 'text-emerald-600' : 'text-amber-600'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-xs font-bold ${isHealthy ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isHealthy ? 'LAN Connected' : 'Offline / Local Mode'}
          </p>
          <span className={`relative flex h-2 w-2 ${isHealthy ? '' : 'opacity-50'}`}>
            {isHealthy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
        </div>
        <p className="text-[10px] text-slate-500 truncate">
          {displayHost}{latency !== null && ` • ${latency}ms`}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        className={`p-2 rounded-lg bg-white/70 hover:bg-white transition-all active:scale-90 ${
          isRefreshing ? 'animate-spin' : ''
        }`}
      >
        <RefreshCw size={14} className={isHealthy ? 'text-emerald-600' : 'text-amber-600'} />
      </button>
    </div>
  );
};

// ─── Teacher Dashboard Component ────────────────────────────────────────────────
const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connectionStatus } = useLanSync();

  const [localStatus, setLocalStatus] = useState(connectionStatus);

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

  const serverUrl = useMemo(() => {
    return localStorage.getItem('lan_server_url') || localStorage.getItem('munyaka_lan_server_url') || '';
  }, []);

  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
  }, []);

  const handleOpenLanSettings = () => navigate('/lan-config');

  // Mock data - in real app, these would come from teacher's assignments
  const attendanceStatus = 'pending'; // or 'saved'
  const pendingMarksCount = 2; // Number of pending assessment entries

  return (
    <div className="space-y-4 pb-10">
      {/* ── Compact LAN Sync Banner ── */}
      <CompactLanSyncBanner
        isOnline={localStatus.isOnline}
        isConnected={localStatus.serverReachable}
        serverUrl={serverUrl}
        latency={localStatus.latency}
        onOpenSettings={handleOpenLanSettings}
        onRefresh={handleLanRefresh}
      />

      {/* ── My Assigned Classes Summary ── */}
      <MyClassesSummary />

      {/* ── Two Column Layout: Schedule + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: My Daily Schedule */}
        <div className="lg:col-span-3">
          <MyDailyScheduleCard onViewTimetable={() => navigate('/timetable')} />
        </div>

        {/* Right: Quick Actions Grid */}
        <div className="lg:col-span-2">
          <QuickActionsGrid
            attendanceStatus={attendanceStatus}
            pendingMarksCount={pendingMarksCount}
            onMarkAttendance={() => navigate('/attendance')}
            onEnterMarks={() => navigate('/assessments')}
            onDownloadReports={() => navigate('/reports')}
            onViewTimetable={() => navigate('/timetable')}
          />
        </div>
      </div>
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
    return <AdminDashboardComponent />;
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