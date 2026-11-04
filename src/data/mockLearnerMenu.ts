/**
 * Mock dataset for the Learner Management Menu.
 *
 * This file represents the expected API response shape so the UI can
 * be fully exercised before the real backend is wired in. Once the
 * backend endpoint is available, replace the consumer of this module
 * with a real fetch call — no UI changes required.
 */

import type {
  LearnerMenuItem,
  LearnerMenuFilter,
} from "@/types/learnerMenu";
import {
  Users,
  UserCheck,
  UserMinus,
  UserCog,
  GraduationCap,
  Archive,
} from "lucide-react";
];

/**
 * Derive the filter / navigation list dynamically from the dataset.
 *
 * Every counter here is computed from `learners` so the menu never
 * shows a stale number. The same function is invoked on every render
 * of the Students page, so it stays in sync with the current data.
 */
export function buildLearnerMenuFilters(
  learners: LearnerMenuItem[],
  activeFilterId: string,
): LearnerMenuFilter[] {
  const total = learners.length;
  const active = learners.filter((l) => l.status === "Active").length;
  const present = learners.filter(
    (l) => l.attendanceStatus === "Present" || l.attendanceStatus === "Late",
  ).length;
  const absent = learners.filter((l) => l.attendanceStatus === "Absent").length;
  const suspended = learners.filter((l) => l.status === "Suspended").length;
  const graduated = learners.filter((l) => l.status === "Graduated").length;
  const transferred = learners.filter(
    (l) => l.status === "TRANSFERRED",
  ).length;

  const items: LearnerMenuFilter[] = [
    {
      id: "all",
      label: "All Learners",
      count: total,
      icon: Users,
      isActive: activeFilterId === "all",
      accent: "indigo",
      hint: "Total enrolled",
    },
    {
      id: "active",
      label: "Active Roster",
      count: active,
      icon: UserCheck,
      isActive: activeFilterId === "active",
      accent: "emerald",
      hint: "On the active list",
    },
    {
      id: "present",
      label: "Present Today",
      count: present,
      icon: UserCheck,
      isActive: activeFilterId === "present",
      accent: "emerald",
      hint: "Checked in for roll call",
    },
    {
      id: "absent",
      label: "Absent Today",
      count: absent,
      icon: UserMinus,
      isActive: activeFilterId === "absent",
      accent: "rose",
      hint: "Need follow-up",
    },
    {
      id: "suspended",
      label: "Suspended",
      count: suspended,
      icon: UserCog,
      isActive: activeFilterId === "suspended",
      accent: "amber",
      hint: "Temporarily off roster",
    },
    {
      id: "graduated",
      label: "Graduated",
      count: graduated,
      icon: GraduationCap,
      isActive: activeFilterId === "graduated",
      accent: "slate",
      hint: "Completed final grade",
    },
    {
      id: "transferred",
      label: "Transferred Archive",
      count: transferred,
      icon: Archive,
      isActive: activeFilterId === "transferred",
      accent: "slate",
      hint: "Moved to archive",
    },
  ];

  return items;
}

/**
 * Apply the active filter id to a learner list.
 * Centralized here so the page and the menu agree on what each
 * filter means.
 */
export function applyLearnerFilter(
  learners: LearnerMenuItem[],
  activeFilterId: string,
): LearnerMenuItem[] {
  switch (activeFilterId) {
    case "active":
      return learners.filter((l) => l.status === "Active");
    case "present":
      return learners.filter(
        (l) =>
          l.attendanceStatus === "Present" || l.attendanceStatus === "Late",
      );
    case "absent":
      return learners.filter((l) => l.attendanceStatus === "Absent");
    case "suspended":
      return learners.filter((l) => l.status === "Suspended");
    case "graduated":
      return learners.filter((l) => l.status === "Graduated");
    case "transferred":
      return learners.filter((l) => l.status === "TRANSFERRED");
    case "all":
    default:
      return learners;
  }
}
