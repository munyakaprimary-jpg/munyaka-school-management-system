"use client";

/**
 * LearnerManagementMenu
 *
 * Refactored to serve as a student/learner's personal navigation sidebar.
 * The "Filters & Roster" section (which was teacher/admin functionality)
 * has been moved to TeacherRosterMenu in the Admin Dashboard.
 *
 * This menu now provides quick access to:
 *   - My Subjects
 *   - My Assignments
 *   - Attendance History
 *   - Classmate Directory
 *   - My Results
 *   - Library Access
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Clock,
  Users,
  BarChart3,
  Library,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LearnerMenuNavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Route path to navigate to when clicked. */
  route: string;
  /** Optional badge count (e.g. unread assignments). */
  badge?: number;
  /** Color accent for the icon pill. */
  accent: "indigo" | "emerald" | "amber" | "rose" | "violet";
}

export interface LearnerManagementMenuProps {
  /** Whether the menu data is still loading. */
  isLoading?: boolean;
  /** Error message if data failed to load. */
  error?: string | null;
  /** Called when the user clicks the retry button. */
  onRetry?: () => void;
  /** Optional className for the outer container. */
  className?: string;
  /** Student info for display */
  studentInfo?: {
    name?: string;
    grade?: string;
    stream?: string;
    admNo?: string;
  };
}

// ─── Accent tokens ──────────────────────────────────────────────────────────

const ACCENT_STYLES: Record<
  LearnerMenuNavItem["accent"],
  { pill: string; icon: string; hover: string; ring: string }
> = {
  indigo: {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "text-indigo-500",
    hover: "hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700",
    ring: "ring-indigo-200",
  },
  emerald: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "text-emerald-500",
    hover: "hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-700",
    ring: "ring-emerald-200",
  },
  amber: {
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "text-amber-500",
    hover: "hover:border-amber-200 hover:bg-amber-50/40 hover:text-amber-700",
    ring: "ring-amber-200",
  },
  rose: {
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "text-rose-500",
    hover: "hover:border-rose-200 hover:bg-rose-50/40 hover:text-rose-700",
    ring: "ring-rose-200",
  },
  violet: {
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    icon: "text-violet-500",
    hover: "hover:border-violet-200 hover:bg-violet-50/40 hover:text-violet-700",
    ring: "ring-violet-200",
  },
};

// ─── Static navigation items ────────────────────────────────────────────────

const NAV_ITEMS: LearnerMenuNavItem[] = [
  {
    id: "subjects",
    label: "My Subjects",
    description: "View your enrolled subjects and topics",
    icon: BookOpen,
    route: "/learning-areas",
    accent: "indigo",
  },
  {
    id: "assignments",
    label: "Assignments",
    description: "Track and submit your homework",
    icon: FileText,
    route: "/assessments",
    accent: "amber",
  },
  {
    id: "attendance",
    label: "Attendance History",
    description: "Review your past attendance records",
    icon: Clock,
    route: "/attendance",
    accent: "emerald",
  },
  {
    id: "classmates",
    label: "Classmate Directory",
    description: "Browse students in your class",
    icon: Users,
    route: "/students",
    accent: "violet",
  },
  {
    id: "results",
    label: "My Results",
    description: "View your exam results and reports",
    icon: BarChart3,
    route: "/analysis",
    accent: "rose",
  },
  {
    id: "library",
    label: "Library Access",
    description: "Browse and borrow library books",
    icon: Library,
    route: "/library",
    accent: "emerald",
  },
];

// ─── Subcomponents ──────────────────────────────────────────────────────────

function LearnerMenuSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <div className="flex items-center gap-3 px-3 py-4 rounded-2xl bg-white border border-slate-200/80">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/3 rounded" />
          <Skeleton className="h-2 w-1/2 rounded" />
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white border border-slate-200/80"
        >
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-10 bg-rose-50/40 border border-rose-200 rounded-2xl">
      <div className="p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
        {onRetry ? <WifiOff size={26} /> : <AlertCircle size={26} />}
      </div>
      <p className="text-sm font-bold text-rose-800">
        Couldn't load the learner menu
      </p>
      <p className="text-xs text-rose-700/80 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 rounded-xl border-rose-300 text-rose-700 hover:bg-rose-100"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Nav item row ────────────────────────────────────────────────────────────

interface NavRowProps {
  item: LearnerMenuNavItem;
  onNavigate: (route: string) => void;
}
function NavRow({ item, onNavigate }: NavRowProps) {
  const accent = ACCENT_STYLES[item.accent];
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.route)}
      className={cn(
        "group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left text-sm font-semibold transition-all duration-200 min-h-[48px] border border-transparent bg-white hover:border-slate-200 hover:bg-slate-50",
        accent.hover,
      )}
    >
      <span
        className={cn(
          "shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border",
          accent.pill,
        )}
      >
        <Icon size={16} className={accent.icon} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-slate-700 group-hover:text-slate-900">
          {item.label}
        </span>
        <span className="block text-[10px] font-medium text-slate-400 truncate">
          {item.description}
        </span>
      </span>
      {item.badge !== undefined && item.badge > 0 ? (
        <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-white tabular-nums">
          {item.badge}
        </span>
      ) : (
        <ChevronRight
          size={14}
          className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors"
        />
      )}
    </button>
  );
}

// ─── Student identity card ───────────────────────────────────────────────────

const StudentCard: React.FC<{
  info: NonNullable<LearnerManagementMenuProps["studentInfo"]>;
}> = ({ info }) => {
  const initials = (info.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
      <span className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-black flex items-center justify-center shrink-0">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black truncate leading-tight">
          {info.name ?? "Learner"}
        </p>
        <p className="text-[10px] font-medium text-white/70 truncate mt-0.5">
          {info.grade}
          {info.stream ? ` · ${info.stream}` : ""}
          {info.admNo ? ` · ${info.admNo}` : ""}
        </p>
      </div>
      <GraduationCap size={16} className="shrink-0 text-white/50" />
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function LearnerManagementMenu({
  isLoading = false,
  error = null,
  onRetry,
  className,
  studentInfo,
}: LearnerManagementMenuProps) {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <aside className={cn("space-y-4", className)} aria-busy="true">
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Learner Menu
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Quick Access
          </h2>
        </div>
        <LearnerMenuSkeleton />
      </aside>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <aside className={cn("space-y-4", className)}>
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Learner Menu
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Quick Access
          </h2>
        </div>
        <ErrorState message={error} onRetry={onRetry} />
      </aside>
    );
  }

  return (
    <aside className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="px-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Learner Menu
        </p>
        <h2 className="text-base font-black text-slate-900 mt-0.5">
          Quick Access
        </h2>
      </div>

      {/* Student identity card */}
      <StudentCard
        info={studentInfo ?? { name: "Learner" }}
      />

      {/* Navigation items */}
      <div className="space-y-2" role="navigation" aria-label="Learner navigation">
        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Footer */}
      <div className="px-2 text-center">
        <p className="text-[10px] font-medium text-slate-400">
          Access more features from the main menu
        </p>
      </div>
    </aside>
  );
}
