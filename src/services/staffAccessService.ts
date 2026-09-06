/**
 * Staff Access Key Utilities
 * ==========================
 *
 * Pure functions for generating, validating, normalising, and detecting
 * legacy-format staff temporary-access-key values.
 *
 * Key format rules
 * ───────────────
 * ✓ VALID   → `MUNYAKA-\d{4}`  e.g. MUNYAKA-4827, MUNYAKA-9632
 * ✗ INVALID → anything else
 *   - starts with `PR-staff-`
 *   - starts with `PR-` followed by a timestamp / long numeric string
 *   - contains bare UUIDs or long raw IDs
 *   - empty / undefined
 *
 * All storage I/O for access keys is handled exclusively by staffMasterService.
 */

import { PreRegisteredStaff } from '@/types/staff-access';

// ─── Constants ────────────────────────────────────────────────────────────────

const MUNYAKA_PREFIX = 'MUNYAKA-';

/**
 * The regex that defines a correctly-formatted access key.
 * Matches `MUNYAKA-` followed by exactly 4 decimal digits.
 */
export const VALID_ACCESS_KEY_PATTERN = /^MUNYAKA-\d{4}$/;

// ─── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generates a fresh, unique-ish 4-digit access key.
 *
 * Format: MUNYAKA-XXXX  (e.g. MUNYAKA-4827)
 *
 * The 4-digit suffix is a random integer in [1000, 9999].
 * Collision risk is negligible for typical school-staff volumes.
 */
export function generateAccessKey(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${MUNYAKA_PREFIX}${randomDigits}`;
}

// ─── Key Validation ─────────────────────────────────────────────────────────

/**
 * Returns true when `key` is a valid MUNYAKA-XXXX key.
 * An empty/undefined/null string is treated as INVALID (needs generation).
 */
export function isValidAccessKey(key?: string | null): boolean {
  if (!key) return false;
  return VALID_ACCESS_KEY_PATTERN.test(key);
}

// ─── Old-format Detection ────────────────────────────────────────────────────

/**
 * Patterns that identify a non-MUNYAKA-XXXX access key that must be normalised.
 *
 * Matches:
 *   - `PR-staff-1234567890123`  (legacy prefixed + timestamp)
 *   - `PR-1788452152692`        (bare timestamp after PR-)
 *   - `PR-abc-def-...`          (raw UUIDs after PR-)
 *   - bare timestamps `1788452152692`
 *   - any key that does NOT match VALID_ACCESS_KEY_PATTERN
 *
 * Note: this check deliberately over-matches so that we never silently keep
 * an old-format key — a false-positive (re-generating a key that was already
 * valid) causes no harm, while a false-negative would leave a bad key in place.
 */
export function isOldAccessKeyFormat(key?: string | null): boolean {
  if (!key) return true; // missing = needs generation
  if (isValidAccessKey(key)) return false; // already correct = skip

  // Explicitly-known legacy prefixes
  if (/^PR-staff-/i.test(key)) return true;
  if (/^PR-\d{10,}$/i.test(key)) return true; // PR- + long timestamp
  if (/^PR-[a-f0-9]{8,}/i.test(key)) return true; // PR- + long UUID-ish string

  // Any bare timestamp (10+ digits)
  if (/^\d{10,}$/.test(key)) return true;

  // Anything that does not match the target pattern and has unusual length
  if (key.length > 20 && !isValidAccessKey(key)) return true;

  return false;
}

// ─── Key Normalisation ──────────────────────────────────────────────────────

/**
 * Returns a normalised access key.
 *
 * - Valid MUNYAKA-XXXX keys are returned unchanged.
 * - Old-format / missing keys are regenerated using `generateAccessKey()`.
 */
export function normalizeAccessKey(key?: string | null): string {
  if (isValidAccessKey(key)) return key as string;
  return generateAccessKey();
}
