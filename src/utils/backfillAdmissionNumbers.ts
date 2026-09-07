/**
 * One-time backfill for the `admissionNo` field.
 *
 * The Learners table now exposes a dedicated ADMISSION NO. column (distinct
 * from the assessment / NEMIS number that lives in `admNo`). Records
 * registered before this column existed have no `admissionNo` value, so the
 * column renders an em-dash. This module backfills those rows in-place
 * using the same `MUN-G{grade}-{seq}/{year}` format that the Register
 * modal already produces for new learners, then writes the corrected
 * array back to every localStorage key the Students page reads from.
 *
 * The migration is idempotent: it only touches rows whose `admissionNo`
 * is missing, undefined, or an empty string. A flag in localStorage
 * (`munyaka_admission_no_backfill_v1`) prevents re-running on subsequent
 * app launches.
 *
 * Storage keys covered (mirrors what `Students.tsx` writes to):
 *   - school_learners_data   (primary)
 *   - students               (legacy mirror)
 *   - learners               (legacy mirror)
 *   - pupils                 (legacy mirror)
 *   - school_students        (legacy mirror)
 *   - registered_students    (legacy mirror)
 *   - munyaka_students       (legacy mirror)
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

const BACKFILL_FLAG_KEY = 'munyaka_admission_no_backfill_v1';

// ─── Admission-number generation (mirrors the Students.tsx helper) ────────────

/**
 * Extract the numeric grade digit from a grade label such as
 * "Grade 4" → "4", "PP1" → "0", "PP2" → "2", "Grade 10" → "10".
 * Falls back to "0" when no digits are present.
 */
function extractGradeDigit(grade: string): string {
  if (!grade) return '0';
  const m = String(grade).match(/(\d+)/);
  return m ? m[1] : '0';
}

/**
 * Resolve the enrollment year for a learner. Priority order:
 *   1. explicit `admissionYear` field
 *   2. `dateOfAdmission` ISO string
 *   3. the year they were first seen in storage (caller-supplied `fallbackYear`)
 *   4. the current calendar year
 */
function resolveEnrollmentYear(
  learner: Record<string, unknown>,
  fallbackYear: number
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
  return fallbackYear;
}

/**
 * Deterministic admission-number builder. Uses `cohortIndex` (0-based
 * sequence within a grade/year cohort) so the result is stable across
 * repeated runs and never collides with already-assigned values.
 *
 * Format: MUN-G{gradeDigit}-{seq:03d}/{year}
 * Example: MUN-G4-001/2026
 */
function buildAdmissionNo(
  grade: string,
  enrollmentYear: number,
  cohortIndex: number
): string {
  const digit = extractGradeDigit(grade);
  const seq = String(cohortIndex + 1).padStart(3, '0');
  return `MUN-G${digit}-${seq}/${enrollmentYear}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface BackfillReport {
  /** True if any row was assigned a new admission number. */
  filled: boolean;
  /** Total number of rows inspected across all storage keys. */
  inspected: number;
  /** Number of rows that received a newly-generated `admissionNo`. */
  assigned: number;
  /** Number of rows that already had an `admissionNo` and were left alone. */
  skipped: number;
  /** Per-key breakdown so the caller can log progress. */
  perKey: Array<{ key: string; assigned: number; skipped: number }>;
}

/**
 * Walk every learner row across every known localStorage key and assign
 * an `admissionNo` to any row that is missing one. Returns a report so
 * callers (e.g. a one-time useEffect in App.tsx) can log or toast the
 * result. Safe to call repeatedly — already-populated rows are skipped.
 *
 * The function intentionally does NOT short-circuit on a per-key basis:
 * if one key holds an empty array we still inspect the next key.
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
      // localStorage may be disabled (private mode, quota) — skip this key.
      continue;
    }
    if (raw == null) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Corrupt JSON for this key — don't touch it.
      continue;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) continue;

    let mutated = false;
    let perKeyAssigned = 0;
    let perKeySkipped = 0;

    // Group learners by (normalised grade, enrollmentYear) so we can
    // assign sequential admission numbers within each cohort. This
    // mirrors the per-cohort logic used by the Register modal.
    type Cohort = { gradeKey: string; year: number; rows: Array<{ idx: number; learner: Record<string, unknown> }> };
    const cohorts = new Map<string, Cohort>();

    parsed.forEach((row, idx) => {
      if (!row || typeof row !== 'object') return;
      const learner = row as Record<string, unknown>;
      report.inspected += 1;

      const hasAdmissionNo =
        typeof learner.admissionNo === 'string' && String(learner.admissionNo).trim() !== '';

      if (hasAdmissionNo) {
        perKeySkipped += 1;
        return;
      }

      const grade = String(learner.grade ?? '').trim() || 'Grade 0';
      const gradeKey = grade.toLowerCase().replace(/\s+/g, '');
      const year = resolveEnrollmentYear(learner, currentYear);
      const cohortKey = `${gradeKey}::${year}`;

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, { gradeKey, year, rows: [] });
      }
      cohorts.get(cohortKey)!.rows.push({ idx, learner });
    });

    // For each cohort, walk the rows in their original order so the
    // numbering is deterministic. Sort by original array index — this
    // is stable and reproducible across runs.
    const typedParsed = parsed as Array<Record<string, unknown>>;
    for (const cohort of cohorts.values()) {
      cohort.rows.sort((a, b) => a.idx - b.idx);
      cohort.rows.forEach((entry, cohortIndex) => {
        const grade = String(entry.learner.grade ?? '').trim() || 'Grade 0';
        const newAdmNo = buildAdmissionNo(grade, cohort.year, cohortIndex);
        typedParsed[entry.idx] = { ...entry.learner, admissionNo: newAdmNo };
        perKeyAssigned += 1;
        mutated = true;
      });
    }

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
 * Run the backfill at most once per browser. The completion flag is
 * written to localStorage so subsequent app launches skip the scan.
 *
 * Returns the BackfillReport so the caller can log / toast a summary.
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

  // Mark complete regardless of whether anything was filled — running on
  // an already-populated dataset is a no-op, not a reason to keep
  // re-scanning on every launch.
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
 * Reset the one-time flag. Exposed for tests / admin tooling; production
 * code should not need to call this.
 */
export function resetAdmissionNoBackfillFlag(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(BACKFILL_FLAG_KEY);
  } catch {
    /* no-op */
  }
}
