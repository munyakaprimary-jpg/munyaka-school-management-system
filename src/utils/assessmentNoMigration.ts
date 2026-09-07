/**
 * One-time data-cleanup migrations for the Learners table.
 *
 * 1. `migrateFakeAssessmentNumbers`
 *    ─────────────────────────────────
 *    Before the Learners table split the columns properly, the system
 *    used to auto-generate placeholder `MUN-001` style values and
 *    write them into both the `admNo` field AND a synthetic
 *    `assessment` field. KNEC/NEMIS assessment numbers must ONLY come
 *    from the user — never from the system. This migration walks
 *    every learner storage key, deletes any `assessment` value that
 *    matches the fake `MUN-XXX` / `MUN-…-…/…` pattern, and persists
 *    the cleaned dataset.
 *
 * 2. `migrateLegacyAdmNoToAdmissionNo`
 *    ──────────────────────────────────
 *    Pre-admission-column records had their school admission number
 *    stored in `admNo` (e.g. `MUN-001`). The new column expects it in
 *    `admissionNo`. This migration copies `admNo` → `admissionNo`
 *    when `admissionNo` is missing and the existing `admNo` looks
 *    like a legacy admission number. After the copy, the backfill
 *    utility (v6) will re-format the values into the proper
 *    `MUN-{family}-{seq}/{year}` format.
 *
 * Both migrations are idempotent and gated by localStorage flags so
 * they run at most once per browser.
 */

import { notifyDataChanged } from '@/utils/storage';
import { LEARNER_STORAGE_KEYS } from '@/utils/backfillAdmissionNumbers';

const ASSESSMENT_CLEANUP_FLAG = 'munyaka_assessment_cleanup_v1';
const LEGACY_ADMNO_FLAG = 'munyaka_legacy_admno_to_admission_v1';

// ─── Fake assessment-number detection ────────────────────────────────────────

/**
 * Returns true if a value looks like a fake, system-generated
 * assessment number rather than a real KNEC/NEMIS identifier.
 *
 * Matches:
 *   • MUN-001  (legacy sequential placeholder)
 *   • MUN-001/2026
 *   • MUN-G1-001/2026  (any family prefix)
 *   • MUN-PP1-001/2026
 *   • MUN-PG-001/2026
 */
export function isFakeAssessmentNumber(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!s) return false;
  // Anything that looks like a system-generated MUN-* admission number
  // is considered fake if it ever leaked into the assessment field.
  return /^MUN-(\w+-\d+\/\d{4}|\d+(?:\/\d{4})?)$/i.test(s);
}

// ─── Migration 1: clean fake assessment values ───────────────────────────────

export interface AssessmentCleanupReport {
  cleaned: boolean;
  inspected: number;
  cleared: number;
  perKey: Array<{ key: string; cleared: number }>;
}

export function migrateFakeAssessmentNumbers(): AssessmentCleanupReport {
  const report: AssessmentCleanupReport = {
    cleaned: false,
    inspected: 0,
    cleared: 0,
    perKey: [],
  };

  if (typeof window === 'undefined' || !window.localStorage) return report;

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
    let perKeyCleared = 0;

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      if (!row || typeof row !== 'object') continue;

      report.inspected += 1;

      const obj = row as Record<string, unknown>;
      // Only act on rows whose `assessment` field carries a fake value.
      // KNEC/NEMIS values (which start with a letter and do NOT match
      // the MUN-* pattern) are left alone.
      if (!isFakeAssessmentNumber(obj.assessment)) continue;

      parsed[i] = { ...obj, assessment: undefined };
      mutated = true;
      perKeyCleared += 1;
    }

    if (mutated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(parsed));
        notifyDataChanged(key);
      } catch (err) {
        console.error(`[assessment-migration] Failed to persist "${key}":`, err);
      }
    }

    report.cleared += perKeyCleared;
    report.perKey.push({ key, cleared: perKeyCleared });
    if (mutated) report.cleaned = true;
  }

  return report;
}

export function runOneTimeAssessmentCleanup(): AssessmentCleanupReport {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { cleaned: false, inspected: 0, cleared: 0, perKey: [] };
  }
  if (window.localStorage.getItem(ASSESSMENT_CLEANUP_FLAG) === 'done') {
    return { cleaned: false, inspected: 0, cleared: 0, perKey: [] };
  }
  const report = migrateFakeAssessmentNumbers();
  try {
    window.localStorage.setItem(ASSESSMENT_CLEANUP_FLAG, 'done');
  } catch {
    /* no-op */
  }
  if (report.cleared > 0) {
    console.info(
      `[assessment-migration] Cleared ${report.cleared} fake assessment value(s) across ${report.perKey.length} storage key(s).`,
      report
    );
  }
  return report;
}

export function resetAssessmentCleanupFlag(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ASSESSMENT_CLEANUP_FLAG);
  } catch {
    /* no-op */
  }
}

// ─── Migration 2: legacy admNo → admissionNo ─────────────────────────────────

export interface LegacyAdmNoReport {
  migrated: boolean;
  inspected: number;
  migratedCount: number;
  perKey: Array<{ key: string; copied: number }>;
}

/**
 * True if a value looks like a legacy school admission number that
 * should be copied into the new `admissionNo` field. We accept:
 *   • "MUN-001" (bare sequential)
 *   • "MUN-001/2026"
 *   • anything in the MUN-{anything} family
 *
 * Plain NEMIS numbers (which start with a letter and are NOT in the
 * MUN-* family) are left alone.
 */
function isLegacyAdmissionNo(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!s) return false;
  return /^MUN-[\w/]+$/i.test(s);
}

export function migrateLegacyAdmNoToAdmissionNo(): LegacyAdmNoReport {
  const report: LegacyAdmNoReport = {
    migrated: false,
    inspected: 0,
    migratedCount: 0,
    perKey: [],
  };

  if (typeof window === 'undefined' || !window.localStorage) return report;

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
    let perKeyCopied = 0;

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      if (!row || typeof row !== 'object') continue;

      report.inspected += 1;

      const obj = row as Record<string, unknown>;
      const hasAdmissionNo =
        typeof obj.admissionNo === 'string' && obj.admissionNo.trim() !== '';

      // Only copy when admissionNo is missing and admNo looks like a
      // legacy admission number. This avoids overwriting correctly
      // auto-generated admission numbers.
      if (hasAdmissionNo) continue;
      if (!isLegacyAdmissionNo(obj.admNo)) continue;

      parsed[i] = { ...obj, admissionNo: obj.admNo };
      mutated = true;
      perKeyCopied += 1;
    }

    if (mutated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(parsed));
        notifyDataChanged(key);
      } catch (err) {
        console.error(`[legacy-admno-migration] Failed to persist "${key}":`, err);
      }
    }

    report.migratedCount += perKeyCopied;
    report.perKey.push({ key, copied: perKeyCopied });
    if (mutated) report.migrated = true;
  }

  return report;
}

export function runOneTimeLegacyAdmNoMigration(): LegacyAdmNoReport {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { migrated: false, inspected: 0, migratedCount: 0, perKey: [] };
  }
  if (window.localStorage.getItem(LEGACY_ADMNO_FLAG) === 'done') {
    return { migrated: false, inspected: 0, migratedCount: 0, perKey: [] };
  }
  const report = migrateLegacyAdmNoToAdmissionNo();
  try {
    window.localStorage.setItem(LEGACY_ADMNO_FLAG, 'done');
  } catch {
    /* no-op */
  }
  if (report.migratedCount > 0) {
    console.info(
      `[legacy-admno-migration] Copied ${report.migratedCount} legacy admNo value(s) to admissionNo across ${report.perKey.length} storage key(s).`,
      report
    );
  }
  return report;
}

export function resetLegacyAdmNoFlag(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(LEGACY_ADMNO_FLAG);
  } catch {
    /* no-op */
  }
}
