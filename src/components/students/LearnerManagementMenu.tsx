"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, Search, WifiOff } from "lucide-react";
import {
  AttendanceStatus,
  LearnerMenuData,
  LearnerMenuFilter,
  LearnerMenuItem,
} from "@/types/learnerMenu";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Shared styling tokens                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Subcomponents — loading / empty / error                                   */
/* -------------------------------------------------------------------------- */

/** Skeleton used while the dataset is in flight. */
function LearnerMenuSkeleton() {
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

/** Empty state shown when no learners match the active filter. */
interface EmptyStateProps {
  filterLabel?: string;
  searchTerm?: string;
}
function EmptyState({ filterLabel, searchTerm }: EmptyStateProps) {
  const hasSearch = !!(searchTerm ?? '').trim().length > 0;
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

/** Error state shown when the API call failed. */
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
        Couldn’t load the learner menu
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

/* -------------------------------------------------------------------------- */
/*  Filter row                                                                */
/* -------------------------------------------------------------------------- */

interface FilterRowProps {
  filter: LearnerMenuFilter;
  onSelect: (id: string) => void;
}
function FilterRow({ filter, onSelect }: FilterRowProps) {
  const accent = ACCENT_STYLES[filter.accent ?? "slate"];
  const Icon = filter.icon;
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

/* -------------------------------------------------------------------------- */
/*  Learner row                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export interface LearnerManagementMenuProps {
  data: LearnerMenuData;
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
}

/**
 * LearnerManagementMenu
 *
 * A fully dynamic side menu for the Learners page. Every counter, label,
 * and list item is driven by `data.learners` — there are no hardcoded
 * counts or hardcoded rows in the JSX. Loading, empty, and error states
 * are all derived from the `isLoading` / `error` props and from the
 * presence of data in the active filter.
 */
export default function LearnerManagementMenu({
  data,
  rowLimit = 5,
  searchTerm,
  onFilterChange,
  onLearnerClick,
  onRetry,
  className,
}: LearnerManagementMenuProps) {
  // ── Loading state ─────────────────────────────────────────────────────
  if (data.isLoading) {
    return (
      <aside className={cn("space-y-4", className)} aria-busy="true">
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Learner Menu
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <LearnerMenuSkeleton />
      </aside>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (data.error) {
    return (
      <aside className={cn("space-y-4", className)}>
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Learner Menu
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <ErrorState message={data.error} onRetry={onRetry} />
      </aside>
    );
  }

  // Active learner rows for the embedded preview.
  // We derive the active filter's label from the filters array so the
  // empty state copy always matches whatever the user has selected.
  const activeFilter = data.filters.find((f) => f.isActive);
  const previewLearners = data.learners.slice(0, rowLimit);
  const hasLearners = previewLearners.length > 0;
  const totalForActiveFilter = activeFilter?.count ?? 0;

  return (
    <aside className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="px-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Learner Menu
          </p>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Filters & Roster
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
          {data.learners.length} total
        </span>
      </div>

      {/* Filter list — entirely driven by `data.filters` */}
      <div className="space-y-2" role="listbox" aria-label="Learner filters">
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
        {activeFilter && totalForActiveFilter > rowLimit && (
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
      {hasLearners && totalForActiveFilter > rowLimit && (
        <div className="px-2 pt-1">
          <p className="text-[10px] font-medium text-slate-400 inline-flex items-center gap-1.5">
            <Search size={11} />
            Use the search bar to find a specific learner
          </p>
        </div>
      )}
    </aside>
  );
}
