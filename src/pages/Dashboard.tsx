"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AdminDashboardComponent from "@/components/dashboards/AdminDashboard";
import { useAcademicCalendar, formatTermBadge } from "@/hooks/useAcademicCalendar";
import { useAuth } from "@/context/AuthContext";
import { getNotices } from "@/utils/notice-board";
import { useLanSync } from "@/hooks/useLanSync";
import { formatRelativeTime } from "@/services/activityLog";
import { checkServerConnection, subscribeToConnectionStatus } from "@/services/SyncEngine";
import { getAllAssessmentResults } from "@/utils/assessmentResults";
import type { Assessment, AssessmentResult, StudentSubmission } from "@/types/questions";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  PenLine,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  UsersRound,
  Wifi,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/** Identifiers for the dashboard widgets used by the RBAC matrix. */
export type WidgetKey =
  | "totalStudents"
  | "totalTeachers"
  | "todayAttendance"
  | "feesCollected"
  | "systemStatus"
  | "activePortalLogins"
  | "networkQuotas"
  | "labSchedule"
  | "subscriptionStatus"
  | "totalActiveEnrollment"
  | "renewalDate"
  | "myAssignedClassCount"
  | "myClassAttendanceRate"
  | "pendingMarks"
  | "todayLessonSchedule";

// ─── Helpers ────────────────────────────────────────────────────────────────────

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
    if (!serverUrl) return "Not configured";
    try {
      return serverUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").slice(0, 32);
    } catch {
      return serverUrl;
    }
  }, [serverUrl]);

  const isHealthy = isOnline && isConnected;
  const statusLabel = !isOnline
    ? "Offline / Local Mode"
    : isConnected
    ? "Online / Connected"
    : "Reachable / Local Mode";
  const StatusIcon = isHealthy ? Wifi : !isOnline ? WifiOff : Server;

  const accent = isHealthy
    ? { ring: "ring-emerald-200", bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", text: "text-emerald-700", dot: "bg-emerald-500", hover: "hover:bg-emerald-100" }
    : { ring: "ring-amber-200", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", text: "text-amber-700", dot: "bg-amber-500", hover: "hover:bg-amber-100" };

  const handleRefresh = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRefreshing) return;
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    },
    [isRefreshing, onRefresh]
  );

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
              <p className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>LAN Sync Status</p>
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
                  <RefreshCw size={11} className="text-slate-400" />
                  {latency} ms
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 text-slate-500 hover:text-indigo-600 hover:bg-white transition-all active:scale-90 ${isRefreshing ? "animate-spin" : ""}`}
              title="Re-test connection"
            >
              <RefreshCw size={16} />
            </button>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${accent.bg} ${accent.text}`}
            >
              {isHealthy ? "Live" : "Cached"}
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
    const category = (notice.category || "General").toLowerCase();
    if (category.includes("urgent") || notice.priority === "high") {
      return { bg: "bg-red-100", text: "text-red-600", icon: AlertTriangle, label: "Urgent" };
    }
    if (category.includes("event")) {
      return { bg: "bg-blue-100", text: "text-blue-600", icon: CalendarDays, label: "Event" };
    }
    return { bg: "bg-purple-100", text: "text-purple-600", icon: Megaphone, label: "Notice" };
  }, [notice]);

  const Icon = meta.icon;
  const displayBody = notice.content || notice.message || notice.description || "";

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
            {notice.title || "School Notice"}
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

const getTodayKey = (): string => {
  const dayIndex = new Date().getDay();
  const days: Record<number, string> = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
  return days[dayIndex] || "mon";
};

const isCurrentPeriod = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
};

export interface ClassScheduleItem {
  id: string | number;
  periodNumber: number;
  subject: string;
  grade: string | null;
  startTime: string;
  endTime: string;
  isLive?: boolean;
  isBreak?: boolean;
  category?: string | null;
}

const BREAK_CATEGORIES = new Set([
  "Break",
  "Lunch Break",
  "Games / PE",
  "Assembly",
  "Pastoral / Clubs",
]);

const SAMPLE_MOCK_SCHEDULE: ClassScheduleItem[] = [
  { id: "p1", periodNumber: 1, subject: "Mathematics", grade: "Grade 4 Blue", startTime: "08:00", endTime: "08:30", isLive: false },
  { id: "p2", periodNumber: 2, subject: "English", grade: "Grade 4 Blue", startTime: "08:30", endTime: "09:10", isLive: false },
  { id: "p3", periodNumber: 3, subject: "Agriculture", grade: "Grade 5 Green", startTime: "09:10", endTime: "09:50", isLive: false },
  { id: "p4", periodNumber: 4, subject: "Science", grade: "Grade 5 Green", startTime: "09:50", endTime: "10:30", isLive: true },
  { id: "p5", periodNumber: 5, subject: "", grade: null, startTime: "10:30", endTime: "11:00", isBreak: true, category: "Break" },
  { id: "p6", periodNumber: 6, subject: "Social Studies", grade: "Grade 4 Blue", startTime: "11:00", endTime: "11:40", isLive: false },
  { id: "p7", periodNumber: 7, subject: "Creative Arts", grade: "Grade 4 Blue", startTime: "11:40", endTime: "12:20", isLive: false },
  { id: "p8", periodNumber: 8, subject: "", grade: null, startTime: "12:20", endTime: "13:00", isBreak: true, category: "Lunch Break" },
  { id: "p9", periodNumber: 9, subject: "Kiswahili", grade: "Grade 4 Blue", startTime: "13:00", endTime: "13:40", isLive: false },
  { id: "p10", periodNumber: 10, subject: "Religious Education", grade: "Grade 4 Blue", startTime: "13:40", endTime: "14:20", isLive: false },
];

const getTeacherDailySchedule = (teacherGradeId?: string): ClassScheduleItem[] => {
  const todayKey = getTodayKey();
  const GRADES_KEY = "school-timetable-grades";
  const TIMETABLE_KEY = "school-timetable-data";

  try {
    const gradesRaw = localStorage.getItem(GRADES_KEY);
    const timetableRaw = localStorage.getItem(TIMETABLE_KEY);

    if (gradesRaw && timetableRaw) {
      const grades = JSON.parse(gradesRaw) as { id: string; name: string }[];
      const timetables = JSON.parse(timetableRaw) as Record<string, { timeSlots: any[]; entries: any[] }>;

      const targetGrade = teacherGradeId
        ? grades.find((g) => g.id === teacherGradeId)
        : grades[0];

      if (!targetGrade || !timetables[targetGrade.id]) {
        return SAMPLE_MOCK_SCHEDULE;
      }

      const { timeSlots, entries } = timetables[targetGrade.id];

      const schedule: ClassScheduleItem[] = timeSlots.map((slot: any, slotIndex: number) => {
        const dayEntry = entries[slotIndex]?.[todayKey];
        const subject = dayEntry?.subject || slot.category || "";
        const isBreak = !dayEntry || BREAK_CATEGORIES.has(subject);

        return {
          id: slot.id || `slot-${slotIndex}`,
          periodNumber: slotIndex + 1,
          subject: isBreak ? "" : subject,
          grade: isBreak ? null : targetGrade.name || null,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isLive: isCurrentPeriod(slot.startTime, slot.endTime),
          isBreak,
          category: slot.category || (isBreak ? subject : null),
        };
      });

      return schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
  } catch (err) {
    console.warn("[getTeacherDailySchedule] Failed to load from localStorage, using mock data:", err);
  }

  return SAMPLE_MOCK_SCHEDULE.map((item) => ({
    ...item,
    isLive: isCurrentPeriod(item.startTime, item.endTime),
  }));
};

const EmptyScheduleState: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
      <CalendarClock size={24} className="text-slate-400" />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-700">No classes scheduled for today</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        Your timetable for today is empty. Check the weekly view for full schedule details.
      </p>
    </div>
  </div>
);

interface ScheduleRowProps {
  item: ClassScheduleItem;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({ item }) => {
  const timeRange = `${item.startTime} – ${item.endTime}`;
  const now = new Date();
  const [endH, endM] = item.endTime.split(":").map(Number);
  const isCompleted =
    !item.isLive &&
    !item.isBreak &&
    now.getHours() * 60 + now.getMinutes() >= endH * 60 + endM;
  const displayName = item.isBreak ? item.category || "Break" : item.subject;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        item.isLive
          ? "bg-emerald-50 border border-emerald-200"
          : item.isBreak
          ? "bg-amber-50/50 border border-amber-100"
          : isCompleted
          ? "bg-slate-50 opacity-60 border border-transparent"
          : "bg-white border border-slate-100 hover:border-slate-200"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
          item.isLive
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
            : item.isBreak
            ? "bg-amber-200 text-amber-700"
            : isCompleted
            ? "bg-slate-200 text-slate-500"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 size={14} />
        ) : item.isBreak ? (
          <span className="text-[10px]">☕</span>
        ) : (
          item.periodNumber
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-bold truncate ${
              item.isLive ? "text-emerald-700" : item.isBreak ? "text-amber-700" : "text-slate-800"
            }`}
          >
            {displayName}
          </p>
          {item.isLive && (
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0 text-[9px] font-black bg-emerald-100 text-emerald-700 border-emerald-200"
            >
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {item.grade ? `${item.grade} • ` : ""}
          {timeRange}
        </p>
      </div>
    </div>
  );
};

const MyDailyScheduleCard: React.FC<{ onViewTimetable: () => void }> = ({ onViewTimetable }) => {
  const todayLabel = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const scheduleItems: ClassScheduleItem[] = useMemo(() => getTeacherDailySchedule(), []);
  const isEmpty = !scheduleItems || scheduleItems.length === 0;

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CalendarClock size={18} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Today&apos;s Classes &amp; Learning Areas
              </CardTitle>
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
        {isEmpty ? (
          <EmptyScheduleState />
        ) : (
          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <ScheduleRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Quick Actions Grid ──────────────────────────────────────────────────────

interface QuickActionItem {
  icon: LucideIcon;
  gradient: string;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "pending" | "saved" | "info";
  onClick: () => void;
}

const QuickActionsGrid: React.FC<{
  attendanceStatus: "pending" | "saved";
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
      gradient: "from-emerald-500 to-teal-600",
      title: "Mark Attendance",
      description:
        attendanceStatus === "saved"
          ? "Register saved for today"
          : "Take today's roll call",
      badge: attendanceStatus === "saved" ? "Saved" : "Pending",
      badgeVariant: attendanceStatus === "saved" ? "saved" : "pending",
      onClick: onMarkAttendance,
    },
    {
      icon: PenLine,
      gradient: "from-indigo-500 to-violet-600",
      title: "Enter Assessment",
      description: "Record learner scores & evaluations",
      badge: pendingMarksCount > 0 ? `${pendingMarksCount} Pending` : undefined,
      badgeVariant: pendingMarksCount > 0 ? "pending" : "info",
      onClick: onEnterMarks,
    },
    {
      icon: FileText,
      gradient: "from-amber-500 to-orange-600",
      title: "Report Cards",
      description: "Generate & download CBC reports",
      onClick: onDownloadReports,
    },
    {
      icon: CalendarDays,
      gradient: "from-blue-500 to-cyan-600",
      title: "Class Timetable",
      description: "View your weekly schedule",
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
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {action.description}
            </p>
            {action.badge && (
              <Badge
                variant="outline"
                className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[9px] font-black border-0 ${
                  action.badgeVariant === "saved"
                    ? "bg-emerald-100 text-emerald-700"
                    : action.badgeVariant === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
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
  const learners = useMemo(() => safeRead<any[]>("school_learners_data", []), []);
  const activeLearners = learners.filter((l: any) => l.status !== "TRANSFERRED");
  const boysCount = activeLearners.filter((l: any) => l.gender?.toLowerCase() === "male").length;
  const girlsCount = activeLearners.filter((l: any) => l.gender?.toLowerCase() === "female").length;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl overflow-hidden text-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/80">My Class</p>
            <p className="text-lg font-black">Grade 4 Blue</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <UsersRound size={14} className="text-white/70" />
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">Enrolled</p>
            </div>
            <p className="text-xl font-black">{activeLearners.length}</p>
            <p className="text-[10px] text-white/70">
              {boysCount} Boys / {girlsCount} Girls
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookMarked size={14} className="text-white/70" />
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">
                Pending Marks
              </p>
            </div>
            <p className="text-xl font-black">3</p>
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
    if (!serverUrl) return "Not configured";
    try {
      return serverUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").slice(0, 24);
    } catch {
      return serverUrl;
    }
  }, [serverUrl]);

  const handleRefresh = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRefreshing) return;
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    },
    [isRefreshing, onRefresh]
  );

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${
        isHealthy ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className={`p-2 rounded-lg ${isHealthy ? "bg-emerald-100" : "bg-amber-100"}`}>
        <Server size={16} className={isHealthy ? "text-emerald-600" : "text-amber-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-xs font-bold ${isHealthy ? "text-emerald-700" : "text-amber-700"}`}>
            {isHealthy ? "LAN Connected" : "Offline / Local Mode"}
          </p>
          <span className={`relative flex h-2 w-2 ${isHealthy ? "" : "opacity-50"}`}>
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
        </div>
        <p className="text-[10px] text-slate-500 truncate">
          {displayHost}
          {latency !== null && ` • ${latency}ms`}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        className={`p-2 rounded-lg bg-white/70 hover:bg-white transition-all active:scale-90 ${
          isRefreshing ? "animate-spin" : ""
        }`}
      >
        <RefreshCw size={14} className={isHealthy ? "text-emerald-600" : "text-amber-600"} />
      </button>
    </div>
  );
};

// ─── Class Attendance Widget ─────────────────────────────────────────────────

interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
  total: number;
  unmarked: number;
  percentage: number;
}

const getTodayDate = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getAttendanceForClass = (grade: string, stream: string): AttendanceStats => {
  const todayStr = getTodayDate();
  const stats: AttendanceStats = {
    present: 0,
    absent: 0,
    excused: 0,
    late: 0,
    total: 0,
    unmarked: 0,
    percentage: 0,
  };

  const learners: any[] = safeRead("school_learners_data", []);
  const classLearners = learners.filter(
    (l: any) => l.grade === grade && l.stream === stream && l.status !== "TRANSFERRED"
  );
  stats.total = classLearners.length;

  const legacyKey = "school_attendance_logs";
  const legacyData: any[] = safeRead(legacyKey, []);
  const legacyToday = legacyData.filter((a: any) => a.date === todayStr);

  const rosterKey = "school_attendance_rosters";
  const rosterData: any[] = safeRead(rosterKey, []);
  const rosterToday = rosterData.filter((r: any) => {
    if (r.grade !== grade || r.stream !== stream) return false;
    if (!r.records) return false;
    return Object.values(r.records).some((entry: any) => {
      if (!entry || typeof entry !== "object") return false;
      const entryDate = entry.date || entry.morning?.date;
      if (entryDate && entryDate !== todayStr) return false;
      const morningStatus = entry.morning?.status || entry.morning;
      const afternoonStatus = entry.afternoon?.status || entry.afternoon;
      return morningStatus || afternoonStatus;
    });
  });

  legacyToday.forEach((a: any) => {
    const learner = classLearners.find((l: any) => l.id === a.studentId);
    if (!learner) return;
    if (a.status === "present" || a.status === "late") stats.present++;
    else if (a.status === "absent") stats.absent++;
    else if (a.status === "excused") stats.excused++;
  });

  rosterToday.forEach((r: any) => {
    if (!r.records) return;
    Object.values(r.records).forEach((entry: any) => {
      if (!entry || typeof entry !== "object") return;
      const morningStatus = entry.morning?.status || entry.morning;
      const afternoonStatus = entry.afternoon?.status || entry.afternoon;
      const status = morningStatus || afternoonStatus || "";
      if (status === "P" || status === "present") stats.present++;
      else if (status === "A" || status === "absent") stats.absent++;
      else if (status === "E" || status === "excused") stats.excused++;
      else if (status === "L" || status === "late") stats.late++;
    });
  });

  const marked = new Set<string>();
  legacyToday.forEach((a: any) => {
    if (classLearners.some((l: any) => l.id === a.studentId)) marked.add(a.studentId);
  });
  rosterToday.forEach((r: any) => {
    if (r.records) {
      Object.entries(r.records).forEach(([studentId, entry]: [string, any]) => {
        if (classLearners.some((l: any) => l.id === studentId)) {
          const morningStatus = entry?.morning?.status || entry?.morning;
          const afternoonStatus = entry?.afternoon?.status || entry?.afternoon;
          if (morningStatus || afternoonStatus) marked.add(studentId);
        }
      });
    }
  });

  stats.unmarked = Math.max(0, stats.total - marked.size);
  stats.percentage = stats.total > 0 ? Math.round((marked.size / stats.total) * 100) : 0;
  return stats;
};

const StatBadge: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  iconBg: string;
}> = ({ label, value, icon: Icon, bg, text, border, iconBg }) => (
  <div className={`flex items-center gap-2 p-3 rounded-xl ${bg} border ${border}`}>
    <div className={`p-1.5 rounded-lg ${iconBg}`}>
      <Icon size={14} className={text} />
    </div>
    <div>
      <p className={`text-lg font-black ${text} leading-none`}>{value}</p>
      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const ClassAttendanceWidget: React.FC<{ onTakeAttendance: () => void }> = ({ onTakeAttendance }) => {
  const todayLabel = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const myClassGrade = "Grade 4";
  const myClassStream = "Blue";

  const attendance = useMemo(
    () => getAttendanceForClass(myClassGrade, myClassStream),
    [myClassGrade, myClassStream]
  );

  const isComplete = attendance.unmarked === 0 && attendance.total > 0;
  const hasStarted =
    attendance.present > 0 ||
    attendance.absent > 0 ||
    attendance.excused > 0 ||
    attendance.late > 0;
  const markedCount = attendance.present + attendance.absent + attendance.excused + attendance.late;

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck size={18} className="text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Today&apos;s Class Attendance
              </CardTitle>
              <p className="text-xs text-slate-500">{todayLabel}</p>
            </div>
          </div>
          <Badge className="rounded-full px-3 py-1 text-[10px] font-black bg-indigo-100 text-indigo-700 border-indigo-200">
            {myClassGrade} {myClassStream}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {!hasStarted && attendance.total > 0 && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <AlertCircle size={16} className="text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-amber-700">
              Roll call for today has not been submitted yet.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBadge
            label="Present"
            value={attendance.present}
            icon={CheckCircle2}
            bg="bg-emerald-50"
            text="text-emerald-700"
            border="border-emerald-200"
            iconBg="bg-emerald-100"
          />
          <StatBadge
            label="Absent"
            value={attendance.absent}
            icon={XCircle}
            bg="bg-red-50"
            text="text-red-700"
            border="border-red-200"
            iconBg="bg-red-100"
          />
          <StatBadge
            label="Excused / Sick"
            value={attendance.excused}
            icon={AlertTriangle}
            bg="bg-amber-50"
            text="text-amber-700"
            border="border-amber-200"
            iconBg="bg-amber-100"
          />
          <StatBadge
            label="Unmarked"
            value={attendance.unmarked}
            icon={Circle}
            bg="bg-slate-50"
            text="text-slate-600"
            border="border-slate-200"
            iconBg="bg-slate-100"
          />
        </div>

        {attendance.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">
                {markedCount}/{attendance.total} Learners Marked
              </p>
              <p className="text-xs font-black text-indigo-600">{attendance.percentage}%</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${attendance.percentage}%` }}
              />
            </div>
          </div>
        )}

        {attendance.total === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Users size={18} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              No learners enrolled in this class
            </p>
            <p className="text-xs text-slate-400">
              Assign learners to {myClassGrade} {myClassStream} to begin tracking attendance.
            </p>
          </div>
        )}

        {attendance.total > 0 && (
          <Button
            onClick={onTakeAttendance}
            className={`w-full font-bold gap-2 rounded-xl h-10 ${
              isComplete
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : hasStarted
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            {isComplete ? (
              <>
                <CheckCircle2 size={16} />
                Update Register
              </>
            ) : hasStarted ? (
              <>
                <ClipboardList size={16} />
                Update Attendance
              </>
            ) : (
              <>
                <ClipboardCheck size={16} />
                Take Today&apos;s Attendance
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
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

  const serverUrl = useMemo(() => {
    return (
      localStorage.getItem("lan_server_url") ||
      localStorage.getItem("munyaka_lan_server_url") ||
      ""
    );
  }, []);

  const handleLanRefresh = useCallback(async () => {
    const status = await checkServerConnection();
    setLocalStatus(status);
  }, []);

  const handleOpenLanSettings = () => {
    if ((user?.role ?? "").toLowerCase() === "owner") {
      navigate("/lan-config");
    }
  };

  const attendanceStatus: "pending" | "saved" = "pending";
  const pendingMarksCount = 2;

  const [assessmentStats, setAssessmentStats] = useState<{
    activeTests: number;
    pendingGrading: number;
    totalResults: number;
    recentResults: AssessmentResult[];
  }>({ activeTests: 0, pendingGrading: 0, totalResults: 0, recentResults: [] });

  useEffect(() => {
    const loadAssessmentStats = () => {
      try {
        const qbRaw = localStorage.getItem("question_bank");
        let activeTests = 0;
        if (qbRaw) {
          const qb = JSON.parse(qbRaw);
          if (qb?.questions?.length > 0) activeTests++;
        }
        const asmtsRaw = localStorage.getItem("assessments");
        if (asmtsRaw) {
          const asmts: Assessment[] = JSON.parse(asmtsRaw);
          if (Array.isArray(asmts)) activeTests += asmts.length;
        }

        const results = getAllAssessmentResults();
        const recentResults = [...results]
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 3);

        const subRaw = localStorage.getItem("student_submissions");
        let pendingGrading = 0;
        if (subRaw) {
          const subs: Record<string, StudentSubmission> = JSON.parse(subRaw);
          const resultKeys = new Set(results.map((r) => `${r.assessmentId}_${r.studentId}`));
          Object.values(subs).forEach((sub) => {
            if (sub.isComplete && !resultKeys.has(`${sub.assessmentId}_${sub.studentId}`)) {
              pendingGrading++;
            }
          });
        }

        setAssessmentStats({ activeTests, pendingGrading, totalResults: results.length, recentResults });
      } catch {
        /* ignore */
      }
    };

    loadAssessmentStats();
    window.addEventListener("storage", loadAssessmentStats);
    window.addEventListener("munyaka_assessment_results_changed", loadAssessmentStats as EventListener);
    return () => {
      window.removeEventListener("storage", loadAssessmentStats);
      window.removeEventListener("munyaka_assessment_results_changed", loadAssessmentStats as EventListener);
    };
  }, []);

  return (
    <div className="space-y-4 pb-10">
      <CompactLanSyncBanner
        isOnline={localStatus.isOnline}
        isConnected={localStatus.serverReachable}
        serverUrl={serverUrl}
        latency={localStatus.latency}
        onOpenSettings={handleOpenLanSettings}
        onRefresh={handleLanRefresh}
      />

      {/* ── Assessment & Examinations Summary ── */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <ClipboardList size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Assessments &amp; Examinations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active tests and grading status</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/assessments-hub")}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:gap-2.5 transition-all"
          >
            Open Hub <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50/70 rounded-xl p-4 text-center border border-indigo-100">
            <FileQuestion size={18} className="text-indigo-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-indigo-700">{assessmentStats.activeTests}</p>
            <p className="text-[10px] text-indigo-500 font-medium mt-1">Active Tests</p>
          </div>

          <div
            className={`rounded-xl p-4 text-center border ${
              assessmentStats.pendingGrading > 0
                ? "bg-amber-50/70 border-amber-200"
                : "bg-emerald-50/70 border-emerald-100"
            }`}
          >
            {assessmentStats.pendingGrading > 0 ? (
              <AlertCircle size={18} className="text-amber-500 mx-auto mb-1.5" />
            ) : (
              <TrendingUp size={18} className="text-emerald-500 mx-auto mb-1.5" />
            )}
            <p
              className={`text-2xl font-black ${
                assessmentStats.pendingGrading > 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {assessmentStats.pendingGrading}
            </p>
            <p
              className={`text-[10px] font-medium mt-1 ${
                assessmentStats.pendingGrading > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              Pending Grading
            </p>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-4 text-center border border-emerald-100">
            <TrendingUp size={18} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-emerald-700">{assessmentStats.totalResults}</p>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">Graded Results</p>
          </div>
        </div>

        {assessmentStats.recentResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-indigo-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Recent Results
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {assessmentStats.recentResults.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2 min-w-[120px]"
                >
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {r.studentName || r.studentId}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {r.subjectName || r.assessmentTitle}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-black text-slate-900">{r.percentage}%</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                        r.gradeLevel === "EE"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : r.gradeLevel === "ME"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : r.gradeLevel === "AE"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }`}
                    >
                      {r.gradeLevel || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MyClassesSummary />

      <ClassAttendanceWidget onTakeAttendance={() => navigate("/attendance")} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <MyDailyScheduleCard onViewTimetable={() => navigate("/timetable")} />
        </div>

        <div className="lg:col-span-2">
          <QuickActionsGrid
            attendanceStatus={attendanceStatus}
            pendingMarksCount={pendingMarksCount}
            onMarkAttendance={() => navigate("/attendance")}
            onEnterMarks={() => navigate("/assessments")}
            onDownloadReports={() => navigate("/reports")}
            onViewTimetable={() => navigate("/timetable")}
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
 *   • admin    → AdminDashboardComponent (operational system overview)
 *   • teacher  → TeacherDashboard (quick actions, attendance, timetable, assessment summary)
 *
 * The 'admin' and 'owner' roles are strictly separated.
 * Each sub-view is a self-contained module under src/components/dashboards/.
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
  const { activeTerm, activeYear } = useAcademicCalendar();
  const termBadge = formatTermBadge(activeTerm, activeYear);

  if (role === "owner") {
    return <OwnerDashboard />;
  }

  if (role === "admin") {
    return <AdminDashboardComponent />;
  }

  const title = role === "teacher" ? "Teacher's Dashboard" : "Dashboard";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full shadow-2xs">
              {termBadge}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name || "User"}</span>
          </p>
        </div>
        <LiveBadge label={role === "teacher" ? "TEACHER SYNC" : "LIVE SYNC"} />
      </div>

      {role === "teacher" && <TeacherDashboard />}
    </div>
  );
};

export default Dashboard;
