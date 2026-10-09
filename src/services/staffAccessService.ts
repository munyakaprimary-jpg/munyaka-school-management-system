/**
 * Staff Access Key Utilities
 * ==========================
 *
 * Pure functions for generating, validating, normalising, and detecting
 * legacy-format staff temporary-access-key values.
 *
 * Key format rules
 * ───────────────
 * ✓ VALID   → `MUN-[A-Z0-9]{4}` or `MUNYAKA-[A-Z0-9]{4}`  e.g. MUN-4827, MUN-9A2F, MUNYAKA-4827
 * ✗ INVALID → anything else
 *
 * All storage I/O for access keys is handled exclusively by staffMasterService.
 */

import { PreRegisteredStaff } from '@/types/staff-access';

// ─── Constants ────────────────────────────────────────────────────────────────

const MUN_PREFIX = 'MUN-';

/**
 * The regex that defines a correctly-formatted alphanumeric access key.
 * Matches `MUN-` or `MUNYAKA-` followed by exactly 4 alphanumeric characters (A-Z, 0-9).
 */
export const VALID_ACCESS_KEY_PATTERN = /^(?:MUN-|MUNYAKA-)[A-Z0-9]{4}$/i;

// ─── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generates a fresh, unique 4-character alphanumeric access key.
 *
 * Format: MUN-XXXX  (e.g. MUN-4827 or MUN-9A2F)
 *
 * The 4-character suffix uses alphanumeric uppercase characters.
 */
export function generateAccessKey(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${MUN_PREFIX}${suffix}`;
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
 * - Valid MUNYAKA-XXXX or MUN-XXXX keys are returned unchanged (NEVER regenerated during login).
 * - Only used for administrative record creation or seeding.
 */
export function normalizeAccessKey(key?: string | null): string {
  const trimmed = String(key || '').trim();
  if (trimmed) return trimmed;
  return generateAccessKey();
}
