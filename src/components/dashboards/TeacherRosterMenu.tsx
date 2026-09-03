"use client";

/**
 * TeacherRosterMenu
 *
 * Relocated from the Learner Dashboard to the Teacher / Admin Dashboard.
 * Roster management and daily roll-call tracking live here because they
 * are operational concerns owned by teachers and admins — not by
 * individual learners.
 *
 * Counters are fully driven by `useTeacherRoster`, which reads the same
 * `school_learners_data` + attendance logs the rest of the app uses.
 * No numbers are hardcoded; every value is recomputed when data changes.
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, Search, WifiOff, Users, UserCheck, UserMinus, UserCog, ClipboardList, RefreshCw } from "lucide-react";
import type {
  AttendanceStatus,
  LearnerMenuFilter,
  LearnerMenuItem,
} from "@/types/learnerMenu";
import type { TeacherRosterCounts } from "@/hooks/useTeacherRoster";
import { Button } from "@/components/ui/button";

// ─── Styling tokens ──────────────────────────────────────────────────────────

const ACCENT_STYLES: Record<
  NonNullable<LearnerMenuFilter["accent"]>,
  { pill: string; ring: string; count: string; icon: string }
> = {
  indigo: {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ring: "ring-indigo-300",
    count: "bg-indigo-600 text-white",
    icon: "text-indigo-500",
  },
  emerald: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-300",
    count: "bg-emerald-600 text-white",
    icon: "text-emerald-500",
  },
  amber: {
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-300",
    count: "bg-amber-500 text-white",
    icon: "text-amber-500",
  },
  rose: {
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    ring: "ring-rose-300",
    count: "bg-rose-600 text-white",
    icon: "text-rose-500",
  },
  slate: {
    pill: "bg-slate-50 text-slate-700 border-slate-200",
    ring: "ring-slate-300",
    count: "bg-slate-600 text-white",
    icon: "text-slate-500",
  },
};

const ATTENDANCE_BADGE: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  Present: {
    label: "Present",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Late: {
    label: "Late",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Absent: {
    label: "Absent",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  Unmarked: {
    label: "Unmarked",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

// Lucide icon lookup so the hook-built filter list (which uses stub
// components) renders with the real icons here in the UI layer.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  all: Users,
  active: UserCheck,
  present: UserCheck,
  absent: UserMinus,
  suspended: UserCog,
};

const resolveIcon = (filter: LearnerMenuFilter) =>
  ICON_MAP[filter.id] ?? filter.icon ?? ClipboardList;

// ─── Subcomponents ───────────────────────────────────────────────────────────

function TeacherRosterSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-2"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white border border-slate-200/80"
        >
          <Skeleton className="h-5 w-5 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  filterLabel?: string;
  searchTerm?: string;
}
function EmptyState({ filterLabel, searchTerm }: EmptyStateProps) {
  const hasSearch = !!searchTerm && searchTerm.trim().length > 0;
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="p-4 rounded-full bg-slate-50 text-slate-300 mb-3">
        <Inbox size={28} />
      </div>
      <p className="text-sm font-bold text-slate-800">No learners found</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">
        {hasSearch
          ? `No results for “${searchTerm}”${filterLabel ? ` in ${filterLabel}` : ""}.`
          : filterLabel
            ? `There are no learners in the “${filterLabel}” category right now.`
            : "Add a learner to get started — your roster is currently empty."}
      </p>
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
        Couldn’t load the roster
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

// ─── Filter row ──────────────────────────────────────────────────────────────

interface FilterRowProps {
  filter: LearnerMenuFilter;
  onSelect: (id: string) => void;
}
function FilterRow({ filter, onSelect }: FilterRowProps) {
  const accent = ACCENT_STYLES[filter.accent ?? "slate"];
  const Icon = resolveIcon(filter);
  return (
    <button
      type="button"
      onClick={() => onSelect(filter.id)}
      aria-pressed={filter.isActive}
      className={cn(
        "group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left text-sm font-semibold transition-all duration-200 min-h-[48px] border",
        filter.isActive
          ? `bg-white border-transparent shadow-sm ring-2 ${accent.ring}`
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50",
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
        <span
          className={cn(
            "block truncate",
            filter.isActive ? "text-slate-900" : "text-slate-700",
          )}
        >
          {filter.label}
        </span>
        {filter.hint && (
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
            {filter.hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black tabular-nums",
          filter.isActive
            ? accent.count
            : "bg-slate-100 text-slate-600 border border-slate-200",
        )}
      >
        {filter.count}
      </span>
    </button>
  );
}

// ─── Learner row ─────────────────────────────────────────────────────────────

interface LearnerRowProps {
  learner: LearnerMenuItem;
  onClick?: (learner: LearnerMenuItem) => void;
}
function LearnerRow({ learner, onClick }: LearnerRowProps) {
  const attendance = ATTENDANCE_BADGE[learner.attendanceStatus];
  const initials = learner.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick?.(learner)}
      className="w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 group"
    >
      {learner.avatarUrl ? (
        <img
          src={learner.avatarUrl}
          alt={learner.fullName}
          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
        />
      ) : (
        <span className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
          {initials || "?"}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700">
          {learner.fullName}
        </span>
        <span className="block text-[11px] font-medium text-slate-500 truncate">
          {learner.grade} · {learner.stream} · {learner.admNo}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
          attendance.className,
        )}
      >
        {attendance.label}
      </span>
    </button>
  );
}

// ─── Roll-call summary strip ─────────────────────────────────────────────────

const RollCallSummary: React.FC<{ counts: TeacherRosterCounts }> = ({
  counts,
}) => {
  const presentRate =
    counts.totalEnrolled > 0
      ? Math.min(100, Math.round((counts.present / counts.totalEnrolled) * 100))
      : 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
          Present
        </p>
        <p className="text-2xl font-black text-emerald-700 leading-none mt-1 tabular-nums">
          {counts.present}
        </p>
        <p className="text-[10px] font-bold text-emerald-600/80 mt-1">
          {presentRate}% of roster
        </p>
      </div>
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
          Absent
        </p>
        <p className="text-2xl font-black text-rose-700 leading-none mt-1 tabular-nums">
          {counts.absent}
        </p>
        <p className="text-[10px] font-bold text-rose-600/80 mt-1">
          Follow-up needed
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Unmarked
        </p>
        <p className="text-2xl font-black text-slate-700 leading-none mt-1 tabular-nums">
          {counts.unmarked}
        </p>
        <p className="text-[10px] font-bold text-slate-500/80 mt-1">
          Awaiting roll call
        </p>
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export interface TeacherRosterMenuProps {
  data: {
    learners: LearnerMenuItem[];
    filters: LearnerMenuFilter[];
    activeFilterId: string;
    isLoading: boolean;
    error: string | null;
    counts: TeacherRosterCounts;
  };
  /** Max number of learner rows to render in the embedded list. */
  rowLimit?: number;
  /** Optional search term forwarded to the empty state. */
  searchTerm?: string;
  /** Called when the user picks a filter. */
  onFilterChange: (filterId: string) => void;
  /** Called when the user clicks a learner row. */
  onLearnerClick?: (learner: LearnerMenuItem) => void;
  /** Called when the user clicks the retry button in the error state. */
  onRetry?: () => void;
  /** Optional className for the outer container. */
  className?: string;
  /** Optional: force the menu to show its full data set without preview truncation. */
  showFullRoster?: boolean;
}

/**
 * TeacherRosterMenu
 *
 * The Filters & Roster panel as it appears in the Teacher / Admin Dashboard.
 * Backed entirely by `useTeacherRoster` — there are no hardcoded counts.
 */
export default function TeacherRosterMenu({
  data,
  rowLimit = 5,
  searchTerm,
  onFilterChange,
  onLearnerClick,
  onRetry,
  className,
  showFullRoster = false,
}: TeacherRosterMenuProps) {
  // ── Loading state ─────────────────────────────────────────────────────
  if (data.isLoading) {
    return (
      <aside className={cn("space-y-4", className)} aria-busy="true">
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Teacher Dashboard
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <TeacherRosterSkeleton />
      </aside>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (data.error) {
    return (
      <aside className={cn("space-y-4", className)}>
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Teacher Dashboard
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <ErrorState message={data.error} onRetry={onRetry} />
      </aside>
    );
  }

  const activeFilter = data.filters.find((f) => f.isActive);
  const previewLearners = showFullRoster
    ? data.learners
    : data.learners.slice(0, rowLimit);
  const hasLearners = previewLearners.length > 0;
  const totalForActiveFilter = activeFilter?.count ?? 0;

  return (
    <aside className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="px-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
            Teacher Dashboard
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            {data.learners.length} in view
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Refresh roster"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Roll-call summary strip */}
      <RollCallSummary counts={data.counts} />

      {/* Filter list — entirely driven by `data.filters` */}
      <div className="space-y-2" role="listbox" aria-label="Roster filters">
        {data.filters.map((filter) => (
          <FilterRow
            key={filter.id}
            filter={filter}
            onSelect={onFilterChange}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Preview header */}
      <div className="px-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {activeFilter?.label ?? "Preview"}
        </p>
        {activeFilter && totalForActiveFilter > rowLimit && !showFullRoster && (
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            showing {rowLimit} of {totalForActiveFilter}
          </span>
        )}
      </div>

      {/* Preview list — empty state when nothing matches */}
      {hasLearners ? (
        <div className="space-y-2">
          {previewLearners.map((learner) => (
            <LearnerRow
              key={learner.id}
              learner={learner}
              onClick={onLearnerClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          filterLabel={activeFilter?.label}
          searchTerm={searchTerm}
        />
      )}

      {/* Footer hint when there are more rows than we display */}
      {hasLearners && totalForActiveFilter > rowLimit && !showFullRoster && (
        <div className="px-2 pt-1">
          <p className="text-[10px] font-medium text-slate-400 inline-flex items-center gap-1.5">
            <Search size={11} />
            Use the Learners page to search the full roster
          </p>
        </div>
      )}
    </aside>
  );
}
