/**
 * Admission-number generation & one-time backfill for the `admissionNo` field.
 *
 * Format: MUN-G{gradeDigit}-{seq:03d}/{year}
 *   gradeDigit  — numeric suffix of the grade label ("Grade 4" → 4, "PP1" → 0)
 *   seq         — zero-padded 3-digit integer, unique within (grade, year)
 *   year        — 4-digit enrollment / admission year
 *
 * Key invariants
 * ─────────────
 * 1. No two rows in the same (grade, year) cohort may share the same seq.
 * 2. For backfill rows (no existing admissionNo): each row gets
 *    `positionInCohort + 1` as its sequence, where positionInCohort is
 *    the row's sorted-array index within its (grade, year) cohort.
 *    Result: MUN-G1-001, MUN-G1-002, … in array order.
 * 3. For new-registration callers (generateAdmissionNo): scan the
 *    in-memory learners AND all known storage keys for every
 *    admission number, find the absolute maximum seq integer across
 *    all cohorts, and return `max + 1` for the requested (grade, year).
 */

import { notifyDataChanged } from '@/utils/storage';

// Every key the Students page (or any older code path) may have written
// learner data to. We touch all of them so the backfill is reflected
// regardless of which key the consumer reads from.
export const LEARNER_STORAGE_KEYS: readonly string[] = [
  'school_learners_data',
  'students',
  'learners',
  'pupils',
  'school_students',
  'registered_students',
  'munyaka_students',
] as const;

const BACKFILL_FLAG_KEY = 'munyaka_admission_no_backfill_v3';

// ─── Parsing helpers ──────────────────────────────────────────────────────────

interface AdmNoParts {
  gradeDigit: string; // "0".."10"
  seq: number;        // integer ≥ 1
  year: number;       // e.g. 2026
  cohortKey: string;  // "{gradeDigit}::{year}"
}

/**
 * Parse a value that might be an admission number.
 * Returns null if the string is null/undefined/blank or doesn't match the
 * expected `MUN-G{grade}-{seq}/{year}` pattern.
 */
function parseAdmissionNo(value: unknown): AdmNoParts | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  const m = s.match(/^MUN-G(\d+)-(\d+)\/(\d{4})$/);
  if (!m) return null;
  const seq = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (!Number.isFinite(seq) || !Number.isFinite(year)) return null;
  return {
    gradeDigit: m[1],
    seq,
    year,
    cohortKey: `${m[1]}::${m[3]}`,
  };
}

/**
 * Extract the numeric grade digit from a grade label.
 * "Grade 4" → "4", "PP1" → "0", "PP2" → "2", "Grade 10" → "10".
 * Falls back to "0" when no digits are found.
 */
export function extractGradeDigit(grade: string): string {
  if (!grade) return '0';
  const m = String(grade).match(/(\d+)/);
  return m ? m[1] : '0';
}

/**
 * Resolve the enrollment year for a learner. Priority order:
 *   1. explicit `admissionYear` number field
 *   2. `dateOfAdmission` ISO string
 *   3. `currentYear` fallback
 */
function resolveEnrollmentYear(
  learner: Record<string, unknown>,
  currentYear: number
): number {
  if (typeof learner.admissionYear === 'number' && Number.isFinite(learner.admissionYear)) {
    return learner.admissionYear;
  }
  if (typeof learner.dateOfAdmission === 'string' && learner.dateOfAdmission.trim()) {
    const parsed = new Date(learner.dateOfAdmission);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
  }
  return currentYear;
}

// ─── Core build function ─────────────────────────────────────────────────────

/**
 * Build a single admission number for a given cohort.
 * `seq` must already be confirmed unique within that cohort.
 *
 * Format: MUN-G{gradeDigit}-{seq:03d}/{year}
 * Example: MUN-G4-007/2026
 */
function buildAdmissionNo(grade: string, year: number, seq: number): string {
  const digit = extractGradeDigit(grade);
  return `MUN-G${digit}-${String(seq).padStart(3, '0')}/${year}`;
}

/**
 * Derive the cohortKey for a learner row (used during backfill).
 * Normalises the grade label and resolves the enrollment year.
 */
function deriveCohortInfo(
  learner: Record<string, unknown>,
  currentYear: number
): { cohortKey: string; grade: string; year: number } {
  const grade = String(learner.grade ?? '').trim() || 'Grade 0';
  const digit = extractGradeDigit(grade);
  const year = resolveEnrollmentYear(learner, currentYear);
  return { cohortKey: `${digit}::${year}`, grade, year };
}

// ─── Public API — admission-number generation for new registrations ──────────

/**
 * Generate the next unique admission number for a new learner being registered.
 *
 * Algorithm — strict global sequence tracker:
 *   1. Scan the passed `learners` array and every known storage key for
 *      every admission number matching the `MUN-G{grade}-{seq}/{year}`
 *      pattern.
 *   2. Parse the `{seq}` portion of each match as an integer and track
 *      the absolute maximum across ALL cohorts (any grade, any year).
 *   3. Return the next sequence integer as `max + 1`, formatted for the
 *      requested (grade, year) cohort.
 *
 * Why global instead of per-cohort?
 *   • The user requested "Find the highest existing index matching
 *     MUN-G1-XXX/2026, parse XXX as integer N, and assign N+1".
 *   • Treating the seq space as a single monotonic counter (scoped to
 *     the same physical format) guarantees uniqueness even when
 *     legacy keys contain numbers for grades the current user
 *     doesn't know about.
 *   • Per-cohort numbers can collide if two cohorts ever reuse the
 *     same seq (e.g. two different grades both containing seq=5);
 *     a global counter removes that risk.
 *
 * Output format: MUN-G{gradeDigit}-{seq:03d}/{year}
 * Example: MUN-G4-008/2026
 */
export function generateAdmissionNo(
  grade: string,
  enrollmentYear: number,
  learners: Array<Record<string, unknown>>
): string {
  // 1. Gather every admission number from the in-memory array + storage
  const allValues: unknown[] = [];

  for (const learner of learners) {
    if (learner && typeof learner === 'object') {
      allValues.push((learner as Record<string, unknown>).admissionNo);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of LEARNER_STORAGE_KEYS) {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        continue;
      }
      if (raw == null) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;

      for (const row of parsed) {
        if (row && typeof row === 'object') {
          allValues.push((row as Record<string, unknown>).admissionNo);
        }
      }
    }
  }

  // 2. Find the absolute maximum seq integer across every parsed number
  let maxSeq = 0;
  for (const v of allValues) {
    const parts = parseAdmissionNo(v);
    if (parts && parts.seq > maxSeq) {
      maxSeq = parts.seq;
    }
  }

  // 3. Increment and format
  return buildAdmissionNo(grade, enrollmentYear, maxSeq + 1);
}

// ─── Public API — one-time backfill ─────────────────────────────────────────

export interface BackfillReport {
  filled: boolean;
  inspected: number;
  assigned: number;
  skipped: number;
  perKey: Array<{ key: string; assigned: number; skipped: number }>;
}

/**
 * Walk every learner row across every known localStorage key and assign
 * an `admissionNo` to any row that is missing one.
 *
 * Algorithm:
 *   1. For each storage key, classify every row:
 *      • already has an admissionNo → skip
 *      • missing → collect into (grade, year) cohorts
 *   2. Sort each cohort's rows by original array index (deterministic).
 *   3. Assign `positionInCohort + 1` as the sequence for each row
 *      in that cohort, formatted as MUN-G{grade}-{seq:03d}/{year}.
 *
 * Idempotent: already-populated rows are never touched.
 */
export function backfillMissingAdmissionNumbers(): BackfillReport {
  const report: BackfillReport = {
    filled: false,
    inspected: 0,
    assigned: 0,
    skipped: 0,
    perKey: [],
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return report;
  }

  const currentYear = new Date().getFullYear();

  for (const key of LEARNER_STORAGE_KEYS) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      continue;
    }
    if (raw == null) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) continue;

    let mutated = false;
    let perKeyAssigned = 0;
    let perKeySkipped = 0;

    // Work directly on the in-place array (we'll JSON.stringify it back at the end)
    const typedParsed = parsed as Array<Record<string, unknown>>;

    // ── Step 2: classify rows ───────────────────────────────────────────────
    //   • already-populated → skipped counter
    //   • needs-backfill    → collect into cohorts, sorted by array index
    type Cohort = {
      grade: string;
      year: number;
      cohortKey: string;
      rows: Array<{ idx: number }>;
    };
    const cohorts = new Map<string, Cohort>();

    for (let i = 0; i < typedParsed.length; i++) {
      const row = typedParsed[i];
      if (!row || typeof row !== 'object') continue;

      report.inspected += 1;

      const hasAdmNo =
        typeof row.admissionNo === 'string' && row.admissionNo.trim() !== '';

      if (hasAdmNo) {
        perKeySkipped += 1;
        continue;
      }

      const { cohortKey, grade, year } = deriveCohortInfo(row, currentYear);
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, { grade, year, cohortKey, rows: [] });
      }
      cohorts.get(cohortKey)!.rows.push({ idx: i });
    }

    // ── Step 3: assign using array-index position within cohort ──────────────
    // Each backfill row gets `positionInCohort + 1` as its sequence. Rows
    // are sorted by their original array index so the assignment is
    // deterministic and reproducible across re-runs.
    // Format per row: MUN-G{gradeDigit}-{positionInCohort+1:03d}/{year}
    // Example cohort [row-idx 3, row-idx 7, row-idx 12] → 001, 002, 003
    cohorts.forEach((cohort) => {
      const sortedRows = cohort.rows.slice().sort((a, b) => a.idx - b.idx);

      sortedRows.forEach((entry, positionInCohort) => {
        const nextSeq = positionInCohort + 1;

        const existing = typedParsed[entry.idx];
        if (!existing || typeof existing !== 'object') return;

        typedParsed[entry.idx] = {
          ...(existing as Record<string, unknown>),
          admissionNo: buildAdmissionNo(cohort.grade, cohort.year, nextSeq),
        };

        mutated = true;
        perKeyAssigned += 1;
      });
    });

    if (mutated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(typedParsed));
        notifyDataChanged(key);
      } catch (err) {
        console.error(`[backfill] Failed to persist "${key}":`, err);
      }
    }

    report.assigned += perKeyAssigned;
    report.skipped += perKeySkipped;
    report.perKey.push({ key, assigned: perKeyAssigned, skipped: perKeySkipped });
    if (mutated) report.filled = true;
  }

  return report;
}

/**
 * Run the backfill once per browser. The flag is written regardless of
 * whether anything was assigned (a no-op on already-populated data).
 */
export function runOneTimeAdmissionNoBackfill(): BackfillReport {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { filled: false, inspected: 0, assigned: 0, skipped: 0, perKey: [] };
  }

  const flag = window.localStorage.getItem(BACKFILL_FLAG_KEY);
  if (flag === 'done') {
    return { filled: false, inspected: 0, assigned: 0, skipped: 0, perKey: [] };
  }

  const report = backfillMissingAdmissionNumbers();

  try {
    window.localStorage.setItem(BACKFILL_FLAG_KEY, 'done');
  } catch {
    /* storage unavailable */
  }

  if (report.assigned > 0) {
    console.info(
      `[backfill] Admission-number backfill assigned ${report.assigned} new value(s) across ${report.perKey.length} storage key(s).`,
      report
    );
  }

  return report;
}

/**
 * Reset the one-time flag — use only for testing or admin tooling.
 */
export function resetAdmissionNoBackfillFlag(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(BACKFILL_FLAG_KEY);
  } catch {
    /* no-op */
  }
}
