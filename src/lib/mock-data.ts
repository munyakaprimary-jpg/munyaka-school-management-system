/**
 * mock-data.ts — DEPRECATED
 * ──────────────────────────
 * This module previously exported hardcoded learner, staff, book, notice,
 * and timetable data for the demo. Those values surfaced as mock data on
 * cold start, contaminating executive dashboards and grade rosters.
 *
 * All exports are now empty (typed) so any remaining import site compiles
 * and renders an empty list, instead of seeding the app with synthetic
 * records. New data should be created through the app's own mutation
 * flows, which persist to localStorage and are reflected back to the UI.
 *
 * If a component still needs to render a placeholder, it should derive
 * data from localStorage (via the helpers in `@/utils/storage`) and fall
 * back to `[]` when nothing has been recorded yet.
 */

import { sortGrades, formatGradeName } from '@/utils/gradeSort';

export interface Student {
  id: string;
  admNo: string;
  assessment: string;
  admissionNumber?: string;
  name: string;
  grade: string;
  stream: string;
  gender: string;
  guardian: string;
  phone: string;
  email?: string;
  dob?: string;
  status?: string;
  schoolId?: string;
}

/** Empty roster — learners are populated via the app, not seeded. */
export const STUDENTS: Student[] = [];

// ── Grade & Stream scaffolding ───────────────────────────────────────────────
// Grades are still exposed (the school needs PP1 → Grade 9 by default) so
// the Grade-Stream configuration page has a starting point. The stream
// student counts are zeroed out — they are filled in from the real roster.
export interface Stream {
  id: string;
  name: string;
  teacher: string;
  studentsCount: number;
}

export interface Grade {
  id: string;
  name: string;
  category: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: Stream[];
}

export const GRADES_DATA: Grade[] = sortGrades([
  { id: 'gpp1', name: 'PP1',  category: 'Pre-Primary', streams: [
    { id: 'spp1a', name: 'Yellow', teacher: 'Unassigned', studentsCount: 0 },
    { id: 'spp1b', name: 'Green',  teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'gpp2', name: 'PP2',  category: 'Pre-Primary', streams: [
    { id: 'spp2a', name: 'Yellow', teacher: 'Unassigned', studentsCount: 0 },
    { id: 'spp2b', name: 'Green',  teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g1', name: 'Grade 1', category: 'Primary', streams: [
    { id: 's1', name: 'Blue',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's2', name: 'Green', teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g2', name: 'Grade 2', category: 'Primary', streams: [
    { id: 's2a', name: 'Blue',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's2b', name: 'Green', teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g3', name: 'Grade 3', category: 'Primary', streams: [
    { id: 's3a', name: 'Blue',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's3b', name: 'Green', teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g4', name: 'Grade 4', category: 'Primary', streams: [
    { id: 's3', name: 'Blue',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's4', name: 'Green', teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g5', name: 'Grade 5', category: 'Primary', streams: [
    { id: 's5', name: 'Alpha', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's6', name: 'Beta',  teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g6', name: 'Grade 6', category: 'Primary', streams: [
    { id: 's6a', name: 'Yellow', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's6b', name: 'Green',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's6c', name: 'South',  teacher: 'Unassigned', studentsCount: 0 },
    { id: 's6d', name: 'East',   teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g7', name: 'Grade 7', category: 'Junior School', streams: [
    { id: 's7a', name: 'MERCURY', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's7b', name: 'VENUS',   teacher: 'Unassigned', studentsCount: 0 },
    { id: 's7c', name: 'JUPITER', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's7d', name: 'NEPTUNE', teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g8', name: 'Grade 8', category: 'Junior School', streams: [
    { id: 's9',  name: 'Alpha', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's10', name: 'Beta',  teacher: 'Unassigned', studentsCount: 0 },
  ]},
  { id: 'g9', name: 'Grade 9', category: 'Junior School', streams: [
    { id: 's11', name: 'Alpha', teacher: 'Unassigned', studentsCount: 0 },
    { id: 's12', name: 'Beta',  teacher: 'Unassigned', studentsCount: 0 },
  ]},
].map((g) => ({
  ...g,
  name: formatGradeName(g.name),
  streams: Array.from(
    new Map(g.streams.map((s) => [s.name.trim().toLowerCase(), s])).values()
  ),
})) as unknown as Grade[]);

/** Empty library — books are created through the Library page. */
export const BOOKS: unknown[] = [];

/** Empty messaging inbox. */
export const MESSAGES: unknown[] = [];

/** Empty noticeboard. */
export const NOTICES: unknown[] = [];

/** Empty inventory log. */
export const INVENTORY: unknown[] = [];

/** Empty asset-issuance log. */
export const ASSET_LOGS: unknown[] = [];

export interface StaffMember {
  id: string;
  id_no: string;
  tsc_no?: string;
  name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  joined: string;
  department: string;
}

/** Empty staff roster — staff are added through the Pre-Registration flow. */
export const STAFF: StaffMember[] = [];

/** Empty calendar. */
export const EVENTS: unknown[] = [];

/** Empty class timetable. */
export const TIMETABLE: unknown[] = [];

/** Empty attendance-trend series. */
export const ATTENDANCE_TREND: unknown[] = [];

/** Empty fee ledger. */
export const FEES_DATA: unknown[] = [];

/** Empty transaction log. */
export const TRANSACTIONS: unknown[] = [];
