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

/**
 * Mock learner roster. Mirrors the API response shape exactly.
 * In production this will be replaced by a `fetch('/api/learners')`
 * or Supabase query returning the same `LearnerMenuItem[]` shape.
 */
export const MOCK_LEARNERS: LearnerMenuItem[] = [
  {
    id: "l-001",
    admNo: "B002961576",
    fullName: "MUTWIKA KILONZO",
    grade: "Grade 7",
    stream: "VENUS",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "STEPHEN KILONZO KINGOO",
    phone: "0705221675",
  },
  {
    id: "l-002",
    admNo: "B004123291",
    fullName: "OCTEVIOR LUVISIA",
    grade: "Grade 6",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "TITUS KIJUSA LUVISIA",
    phone: "0705138090",
  },
  {
    id: "l-003",
    admNo: "B004761829",
    fullName: "SAMWEL KAMAU WANJIKU",
    grade: "Grade 6",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Late",
    avatarUrl: null,
    guardian: "MARY WANJIKU WAIRIMU",
    phone: "0719182804",
  },
  {
    id: "l-004",
    admNo: "A009702345",
    fullName: "EMILY CHEBET",
    grade: "Grade 5",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "EDWARD LIMO",
    phone: "07892356787",
  },
  {
    id: "l-005",
    admNo: "B004779091",
    fullName: "PETER WAITITU",
    grade: "Grade 6",
    stream: "South",
    status: "Active",
    attendanceStatus: "Absent",
    avatarUrl: null,
    guardian: "JANE WANJIKU WAITITO",
    phone: "0114222031",
  },
  {
    id: "l-006",
    admNo: "B004276095",
    fullName: "ALFRED JUMA",
    grade: "Grade 6",
    stream: "East",
    status: "Active",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "PHANICE NASIMIYU KIRISWA",
    phone: "0141893904",
  },
  {
    id: "l-007",
    admNo: "B005110023",
    fullName: "BRIAN KIPTOO",
    grade: "Grade 7",
    stream: "VENUS",
    status: "Suspended",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "MARY KIPTOO",
    phone: "0722001122",
  },
  {
    id: "l-008",
    admNo: "B005233114",
    fullName: "MARY ATIENO",
    grade: "Grade 5",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "JOHN ATIENO",
    phone: "0711002233",
  },
  {
    id: "l-009",
    admNo: "B005477992",
    fullName: "EMMANUEL MAINA",
    grade: "Grade 5",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "ESTHER MAINA",
    phone: "0733445566",
  },
  {
    id: "l-010",
    admNo: "B005881023",
    fullName: "FAITH WAMBUI",
    grade: "Grade 4",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Late",
    avatarUrl: null,
    guardian: "PETER WAMBUI",
    phone: "0700112233",
  },
  {
    id: "l-011",
    admNo: "B006121445",
    fullName: "KEVIN ODHIAMBO",
    grade: "Grade 8",
    stream: "Alpha",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "LUCY ODHIAMBO",
    phone: "0799887766",
  },
  {
    id: "l-012",
    admNo: "B006552001",
    fullName: "GLADYS NYAMBURA",
    grade: "Grade 8",
    stream: "Alpha",
    status: "Graduated",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "SAMUEL NYAMBURA",
    phone: "0722334455",
  },
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
