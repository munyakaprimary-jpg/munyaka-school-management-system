/**
 * Type definitions for the Learner Management Menu system.
 *
 * These interfaces define the shape of data flowing from the backend
 * (or mock data) into the LearnerManagementMenu component. They are the
 * single source of truth for the menu's rendering logic.
 *
 * NOTE: This file must never import runtime symbols from client-side
 * libraries (e.g. lucide-react). Only use `import type {}` so that
 * TypeScript erases the imports entirely at compile time. Mixing runtime
 * imports with type-only usage in a non-"use client" file can corrupt
 * the React module context and cause hooks to receive `null`.
 */
import type { ComponentType } from "react";

/**
 * Lifecycle status of a learner on the active roster.
 * Mirrors the canonical `Learner.status` field from `@/types/learners`.
 */
export type LearnerStatus =
  | "Active"
  | "TRANSFERRED"
  | "Graduated"
  | "Suspended";

/**
 * Attendance state for the current school day.
 * Used to render per-row attendance indicators and to compute
 * dashboard-level roll-call summaries.
 */
export type AttendanceStatus = "Present" | "Absent" | "Late" | "Unmarked";

/**
 * Canonical Learner record used by the Learner Management Menu.
 *
 * Extends the core `Learner` interface with the menu-specific fields
 * the menu component needs (avatar, attendance, normalized grade/stream).
 */
export interface LearnerMenuItem {
  /** Stable database id (UUID or generated). */
  id: string;
  /** School-issued Assessment / Admission number. */
  admNo: string;
  /** Full learner name (display-ready). */
  fullName: string;
  /** Normalized grade label e.g. "Grade 4". */
  grade: string;
  /** Normalized stream label e.g. "Blue". */
  stream: string;
  /** Current lifecycle status. */
  status: LearnerStatus;
  /** Optional remote avatar URL. Falls back to initials badge when null. */
  avatarUrl?: string | null;
  /** Today's attendance state. */
  attendanceStatus: AttendanceStatus;
  /** Optional secondary contact (parent/guardian name). */
  guardian?: string;
  /** Optional phone number for the listed guardian. */
  phone?: string;
  /** Optional birth certificate number. */
  birthCertificateNo?: string;
}

/**
 * A single filter / navigation entry in the Learner Management Menu.
 *
 * Counters (`count`) and active state (`isActive`) are computed by the
 * parent at render time — never hardcoded — so the UI always reflects
 * the current dataset length and the user's current selection.
 *
 * The `icon` field accepts any React component-like object — in practice a
 * Lucide icon function (`() => JSX.Element`). Declared as a generic
 * `React.ComponentType<any>` so this type file has NO runtime lucide-react
 * dependency.
 */
export interface LearnerMenuFilter {
  /** Unique id (used as React key + active-state lookup). */
  id: string;
  /** Display label shown in the menu (e.g. "All Learners"). */
  label: string;
  /** Number of learners in this category. Computed, not hardcoded. */
  count: number;
  /** Lucide icon component for the menu row. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ComponentType<any>;
  /** Whether this filter is currently selected. */
  isActive: boolean;
  /** Optional color token used for the count badge. */
  accent?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  /** Optional sub-label rendered under the count. */
  hint?: string;
}

/**
 * Aggregated menu state passed from the parent (Students page) into
 * the LearnerManagementMenu. Splitting the shape this way keeps the
 * menu component pure and easy to test in isolation.
 */
export interface LearnerMenuData {
  /** Full list of learners (used to compute filter counts). */
  learners: LearnerMenuItem[];
  /** Computed list of filter / navigation entries. */
  filters: LearnerMenuFilter[];
  /** The id of the filter currently selected by the user. */
  activeFilterId: string;
  /** Loading / error state flags. */
  isLoading: boolean;
  error: string | null;
}

/**
 * Standardized API response shape.
 * Lets the menu work against any backend that returns data in this
 * envelope without leaking transport details into the UI.
 */
export interface LearnerApiResponse {
  ok: boolean;
  data: LearnerMenuItem[];
  message?: string;
}
