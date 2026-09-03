"use client";

/**
 * LearnerQuickAccess
 *
 * A student-facing Quick Access menu that surfaces the most important
 * navigation shortcuts on a learner's dashboard.  Renders a profile
 * header banner plus a vertical list of interactive navigation cards.
 *
 * Features:
 *   • Student Profile Header Banner — purple accent background, avatar
 *     initials badge, name, grade / stream / student id, and a
 *     graduation-cap icon anchored to the right.
 *   • Interactive navigation list — Book (Subjects), Clipboard
 *     (Assignments), Clock (Attendance), Users (Classmate Directory).
 *   • Soft hover states + a yellow accent border for the active
 *     selection.  Active state is driven by `activeRoute` and matches
 *     the route the user is currently viewing.
 *   • `onNavigate(route)` callback prop triggers navigation when any
 *     menu item is clicked.
 */

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Clock,
  Users,
  GraduationCap,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LearnerQuickAccessStudent {
  /** Full student name e.g. "FRANCIS KAMAU JUMA" */
  name: string;
  /** Grade label e.g. "Grade 6" */
  grade: string;
  /** Stream / class label e.g. "Green" */
  stream: string;
  /** School-issued Student ID / Assessment number e.g. "B004747604" */
  studentId: string;
  /**
   * Optional explicit avatar text (initials) override.  When omitted,
   * the component derives initials from the student's name.
   */
  avatar?: string;
  /** Optional remote avatar URL.  When provided, replaces the initials badge. */
  avatarUrl?: string | null;
}

export interface LearnerQuickAccessProps {
  /** Student profile info used to render the header banner. */
  student: LearnerQuickAccessStudent;
  /**
   * Callback fired when the user clicks any menu item.  Receives the
   * target route (e.g. "/learning-areas") as its only argument.
   */
  onNavigate: (route: string) => void;
  /**
   * The route currently being viewed.  When provided, the matching
   * menu item is rendered with the active yellow-accent state.
   */
  activeRoute?: string;
  /** Optional search term — used to dim non-matching items, if any. */
  searchTerm?: string;
  /** Optional className for the outer container. */
  className?: string;
  /** Optional label for the section heading.  Defaults to "Quick Access". */
  heading?: string;
}

// ─── Static menu items ──────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "subjects",
    label: "My Subjects",
    description: "View your enrolled subjects and topics",
    icon: BookOpen,
    route: "/learning-areas",
  },
  {
    id: "assignments",
    label: "Assignments",
    description: "Track and submit your homework",
    icon: ClipboardList,
    route: "/assessments",
  },
  {
    id: "attendance",
    label: "Attendance History",
    description: "Review your past attendance records",
    icon: Clock,
    route: "/attendance",
  },
  {
    id: "classmates",
    label: "Classmate Directory",
    description: "Browse students in your class",
    icon: Users,
    route: "/students",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const deriveInitials = (name: string, override?: string): string => {
  if (override && override.trim().length > 0) return override.toUpperCase();
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// ─── Subcomponents ──────────────────────────────────────────────────────────

/** Student profile header banner. */
const ProfileBanner: React.FC<{ student: LearnerQuickAccessStudent }> = ({
  student,
}) => {
  const initials = deriveInitials(student.name, student.avatar);
  const meta = useMemo(() => {
    const parts: string[] = [];
    if (student.grade) parts.push(student.grade);
    if (student.stream) parts.push(student.stream);
    if (student.studentId) parts.push(student.studentId);
    return parts.join(" · ");
  }, [student.grade, student.stream, student.studentId]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-sm px-4 py-4"
      data-learner-profile-banner="true"
    >
      {/* Decorative orbs */}
      <span className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <span className="absolute -bottom-8 -left-4 h-16 w-16 rounded-full bg-fuchsia-300/20 blur-2xl pointer-events-none" />

      <div className="relative flex items-center gap-3">
        {/* Avatar / initials badge */}
        {student.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-white/40 shrink-0 shadow-sm"
          />
        ) : (
          <span
            className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm tracking-wider"
            aria-label={`Avatar for ${student.name}`}
          >
            {initials}
          </span>
        )}

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-black truncate leading-tight tracking-wide"
            title={student.name}
          >
            {student.name}
          </p>
          {meta && (
            <p
              className="text-[10px] font-semibold text-white/80 truncate mt-0.5 tracking-wide"
              title={meta}
            >
              {meta}
            </p>
          )}
        </div>

        {/* Academic icon — graduation cap */}
        <span
          className="shrink-0 h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center"
          aria-hidden="true"
        >
          <GraduationCap size={18} className="text-white" />
        </span>
      </div>
    </div>
  );
};

/** A single navigation card with hover + active styling. */
interface NavCardProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: (route: string) => void;
}

const NavCard: React.FC<NavCardProps> = ({ item, isActive, onNavigate }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.route)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left text-sm font-bold transition-all duration-200 min-h-[56px] border bg-white",
        isActive
          ? "border-amber-300 bg-amber-50/60 shadow-sm ring-1 ring-amber-200"
          : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span
        className={cn(
          "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
          isActive
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : "bg-slate-50 text-slate-500 border-slate-200/80 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200",
        )}
      >
        <Icon size={17} className="transition-colors" />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={cn(
            "block truncate",
            isActive ? "text-amber-900" : "text-slate-800 group-hover:text-slate-900",
          )}
        >
          {item.label}
        </span>
        <span
          className={cn(
            "block text-[10.5px] font-medium truncate mt-0.5",
            isActive ? "text-amber-700/80" : "text-slate-400 group-hover:text-slate-500",
          )}
        >
          {item.description}
        </span>
      </span>
      <ChevronRight
        size={16}
        className={cn(
          "shrink-0 transition-all",
          isActive
            ? "text-amber-500 translate-x-0.5"
            : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5",
        )}
      />
    </button>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function LearnerQuickAccess({
  student,
  onNavigate,
  activeRoute,
  searchTerm,
  className,
  heading = "Quick Access",
}: LearnerQuickAccessProps) {
  // Local "active" override so a click immediately highlights the chosen
  // route even if the parent hasn't yet updated `activeRoute`.  Falls back
  // to the prop whenever the prop is provided.
  const [localActive, setLocalActive] = useState<string | null>(null);

  // Sync local highlight whenever the external route prop changes — this
  // ensures that navigating to a different page (e.g. from /assessments
  // to /attendance) correctly moves the yellow accent without a stale click.
  React.useEffect(() => {
    setLocalActive(null);
  }, [activeRoute]);

  const currentRoute = localActive ?? activeRoute;

  const handleClick = (route: string) => {
    setLocalActive(route);
    onNavigate(route);
  };

  return (
    <aside
      className={cn("space-y-4", className)}
      data-learner-quick-access="true"
    >
      {/* Section heading */}
      <div className="px-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Learner Menu
        </p>
        <h2 className="text-base font-black text-slate-900 mt-0.5">
          {heading}
        </h2>
      </div>

      {/* Profile banner */}
      <ProfileBanner student={student} />

      {/* Navigation cards */}
      <div
        className="space-y-2"
        role="navigation"
        aria-label="Learner quick access"
      >
        {NAV_ITEMS.map((item) => (
          <NavCard
            key={item.id}
            item={item}
            isActive={currentRoute === item.route}
            onNavigate={handleClick}
          />
        ))}
      </div>

      {/* Footer hint when search is active */}
      {searchTerm && searchTerm.trim().length > 0 && (
        <div className="px-2 pt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
          <Search size={11} />
          Filtering by “{searchTerm}”
        </div>
      )}
    </aside>
  );
}
