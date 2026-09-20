/**
 * Admission-number generation & one-time backfill for the `admissionNo` field.
 *
 * Supported formats
 * ─────────────────
 *  • Numbered primary school grades:  MUN-G{n}-{seq:03d}/{year}
 *      Examples: MUN-G1-001/2026, MUN-G4-007/2026, MUN-G9-015/2026
 *  • Early Childhood Education (ECE):  MUN-PP{1|2}-{seq:03d}/{year}
 *      Examples: MUN-PP1-001/2026, MUN-PP2-001/2026
 *
 *   seq   — zero-padded 3-digit integer, unique within (family, year)
 *   year  — 4-digit enrollment / admission year
 *
 * The parser is permissive: it accepts BOTH the `MUN-G{…}` (legacy
 * numbered grade) and `MUN-PP{1|2}` (ECE) forms so the backfill can
 * deduplicate against any number that already exists in storage, no
 * matter which family it belongs to.
 *
 * Key invariants
 * ─────────────
 * 1. No two rows in the same (family, year) cohort may share the same seq.
 * 2. For backfill rows (no existing admissionNo): each row gets
 *    `positionInCohort + 1` as its sequence, where positionInCohort is
 *    the row's sorted-array index within its (family, year) cohort.
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

const BACKFILL_FLAG_KEY = 'munyaka_admission_no_backfill_v6';

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/**
 * Family codes used in admission numbers.
 *   "G1".."G9"  — numbered primary school grades
 *   "PP1"/"PP2" — early childhood education (Pre-Primary)
 *   "G0"        — fallback for any unrecognised grade label
 */
type FamilyCode = `G${number}` | 'PP1' | 'PP2' | 'G0';

interface AdmNoParts {
  family: FamilyCode; // "G1".."G9" or "PP1" / "PP2" / "G0"
  seq: number;        // integer ≥ 1
  year: number;       // e.g. 2026
  cohortKey: string;  // "{family}::{year}"
}

/**
 * Parse a value that might be an admission number.
 * Returns null if the string is null/undefined/blank or doesn't match
 * either of the supported patterns:
 *   • MUN-G{1..9}-{seq:03d}/{year}   (numbered primary)
 *   • MUN-PP{1|2}-{seq:03d}/{year}   (early childhood education)
 *   • MUN-G0-{seq:03d}/{year}        (fallback / unrecognised grade)
 *
 * The legacy "Grade 4" → digit "4" mapping is preserved so existing
 * `MUN-G{n}-…` numbers in storage still parse correctly.
 */
function parseAdmissionNo(value: unknown): AdmNoParts | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  const m = s.match(/^MUN-(G\d+|PP[12])-(\d+)\/(\d{4})$/);
  if (!m) return null;
  const family = m[1] as FamilyCode;
  const seq = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (!Number.isFinite(seq) || !Number.isFinite(year)) return null;
  return {
    family,
    seq,
    year,
    cohortKey: `${family}::${m[3]}`,
  };
}

/**
 * Resolve a grade label to a family code used in admission numbers.
 *
 * Explicit mapping for Early Childhood Education:
 *   • "PP1" / "pp1" / "Playgroup" / "Pre-Primary 1" / "Pre Primary 1" → "PP1"
 *   • "PP2" / "pp2" / "Pre-Primary 2" / "Pre Primary 2"             → "PP2"
 *
 * Numbered primary grades:
 *   • "Grade 1".."Grade 9" → "G1".."G9" (the numeric digit is preserved)
 *   • "Grade 10"+"         → "G9"      (only G1..G9 are used in admission
 *                                       numbers, anything higher is
 *                                       bucketed under G9 for uniqueness)
 *
 * Anything else falls back to "G0".
 *
 * Never returns NaN, never returns an empty string.
 */
export function gradeToFamilyCode(grade: string): FamilyCode {
  const g = String(grade || '').trim();
  if (!g) return 'G0';

  const norm = g.toLowerCase().replace(/[\s\-_]+/g, '');

  // ECE explicit mappings
  if (
    norm === 'pp1' ||
    norm === 'playgroup' ||
    norm === 'preprimary1' ||
    norm === 'preprimaryone'
  ) {
    return 'PP1';
  }
  if (
    norm === 'pp2' ||
    norm === 'preprimary2' ||
    norm === 'preprimarytwo'
  ) {
    return 'PP2';
  }

  // Numbered primary grades — "Grade 4" → 4 → "G4"
  const m = g.match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n)) {
      if (n >= 1 && n <= 9) return `G${n}` as FamilyCode;
      if (n >= 10) return 'G9'; // overflow bucket
      return 'G0';
    }
  }

  return 'G0';
}

/**
 * Backwards-compatible alias — returns the family code in the same
 * "G{n}" or "PP{n}" shape used in admission numbers. Older callers
 * that expected a numeric digit now receive "G{n}" / "PP1" / "PP2"
 * instead, which is what the rest of the engine expects.
 *
 * @deprecated Prefer `gradeToFamilyCode` for new code.
 */
export function extractGradeDigit(grade: string): string {
  return gradeToFamilyCode(grade);
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
 * Format: MUN-{family}-{seq:03d}/{year}
 *   family is derived from `gradeToFamilyCode`:
 *     Grade 1..9   → "G1".."G9"
 *     PP1          → "PP1"
 *     PP2          → "PP2"
 *     anything else → "G0"
 *
 * Examples: MUN-G4-007/2026, MUN-PP1-001/2026, MUN-PP2-003/2026
 */
function buildAdmissionNo(grade: string, year: number, seq: number): string {
  const family = gradeToFamilyCode(grade);
  return `MUN-${family}-${String(seq).padStart(3, '0')}/${year}`;
}

/**
 * Derive the cohortKey for a learner row (used during backfill).
 * Normalises the grade label into a family code (e.g. "PP1", "G4")
 * and resolves the enrollment year.
 */
function deriveCohortInfo(
  learner: Record<string, unknown>,
  currentYear: number
): { cohortKey: string; grade: string; year: number; family: FamilyCode } {
  const grade = String(learner.grade ?? '').trim() || 'Grade 0';
  const family = gradeToFamilyCode(grade);
  const year = resolveEnrollmentYear(learner, currentYear);
  return { cohortKey: `${family}::${year}`, grade, year, family };
}

// ─── Public API — admission-number generation for new registrations ──────────

/**
 * Generate the next unique admission number for a new learner being registered.
 *
 * Algorithm — strict global sequence tracker:
 *   1. Scan the passed `learners` array and every known storage key for
 *      every admission number matching any supported format
 *      (`MUN-G{n}-…`, `MUN-PP1-…`, `MUN-PP2-…`).
 *   2. Parse the `{seq}` portion of each match as an integer and track
 *      the absolute maximum across ALL cohorts (any grade, any year).
 *   3. Return the next sequence integer as `max + 1`, formatted for the
 *      requested (grade, year) cohort using the correct family prefix
 *      (G{n} for numbered grades, PP1 / PP2 for early childhood).
 *
 * Output format:
 *   • Grade 1–9:    MUN-G{n}-{seq:03d}/{year}  e.g. MUN-G4-008/2026
 *   • PP1 / PP2:    MUN-PP{n}-{seq:03d}/{year} e.g. MUN-PP1-001/2026
 */
export function generateAdmissionNo(
  grade: string,
  enrollmentYear: number,
  learners: Array<Record<string, unknown>>
): string {
  // 1. Normalize the target grade for matching (e.g., "Grade 1" -> "G1", "PP1" -> "PP1")
  const targetGradeNormalized = grade.toLowerCase().replace(/\s+/g, '');

  // Helper to check if a learner's grade matches the target grade
  const matchesGrade = (learnerGrade: unknown): boolean => {
    if (!learnerGrade || typeof learnerGrade !== 'string') return false;
    const norm = learnerGrade.toLowerCase().replace(/\s+/g, '');
    return norm === targetGradeNormalized || norm.includes(targetGradeNormalized) || targetGradeNormalized.includes(norm);
  };

  // 2. Gather admission numbers belonging strictly to the same target grade
  const gradeValues: unknown[] = [];

  for (const learner of learners) {
    if (learner && typeof learner === 'object') {
      const lGrade = (learner as Record<string, unknown>).grade || (learner as Record<string, unknown>).class;
      if (matchesGrade(lGrade)) {
        gradeValues.push((learner as Record<string, unknown>).admissionNo);
      }
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
          const rGrade = (row as Record<string, unknown>).grade || (row as Record<string, unknown>).class;
          if (matchesGrade(rGrade)) {
            gradeValues.push((row as Record<string, unknown>).admissionNo);
          }
        }
      }
    }
  }

  // 3. Find the maximum seq integer strictly within this grade cohort
  let maxSeq = 0;
  for (const v of gradeValues) {
    const parts = parseAdmissionNo(v);
    if (parts && parts.seq > maxSeq) {
      maxSeq = parts.seq;
    }
  }

  // 4. Increment and format with zero-padding (padStart(3, '0'))
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
      family: FamilyCode;
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

      const { cohortKey, grade, year, family } = deriveCohortInfo(row, currentYear);
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, { grade, year, cohortKey, family, rows: [] });
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
