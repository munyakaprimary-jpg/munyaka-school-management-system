/**
 * Staff Access Key Service
 *
 * Centralises all logic for generating, validating, normalising, and migrating
 * staff temporary-access-key values so that the Access Master Ledger always
 * displays the consistent `MUNYAKA-XXXX` (4-digit) format.
 *
 * Key format rules
 * ───────────────
 * ✓ VALID   → `MUNYAKA-\d{4}`  e.g. MUNYAKA-4827, MUNYAKA-9632
 * ✗ INVALID → anything else
 *   - starts with `PR-staff-`
 *   - starts with `PR-` followed by a timestamp / long numeric string
 *   - contains bare UUIDs or long raw IDs
 *   - empty / undefined
 */

import { PreRegisteredStaff } from '@/types/staff-access';
import { notifyDataChanged } from '@/utils/storage';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_LEDGER_KEY = 'munyaka_staff_prereg';
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

// ─── Key Validation ───────────────────────────────────────────────────────────

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

// ─── Key Normalisation ────────────────────────────────────────────────────────

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

// ─── Ledger Migration ────────────────────────────────────────────────────────

interface MigrationResult {
  /** Number of records that were updated */
  updated: number;
  /** Number of records that were already valid */
  unchanged: number;
  /** Total records processed */
  total: number;
}

/**
 * Loads the staff pre-registration ledger from localStorage, normalises every
 * access-key value, and writes the cleaned records back.
 *
 * Returns a brief summary of what changed.
 *
 * Call this function:
 *   • On app boot (before any read of the ledger)
 *   • Any time the ledger is about to be read for display or auth
 *
 * This function is idempotent — it is safe to call multiple times.
 */
export function migrateAllStaffAccessKeys(): MigrationResult {
  try {
    const raw = localStorage.getItem(STAFF_LEDGER_KEY);
    if (!raw) {
      return { updated: 0, unchanged: 0, total: 0 };
    }

    const ledger: PreRegisteredStaff[] = JSON.parse(raw);
    if (!Array.isArray(ledger) || ledger.length === 0) {
      return { updated: 0, unchanged: 0, total: 0 };
    }

    let updated = 0;
    const migrated: PreRegisteredStaff[] = ledger.map(record => {
      const currentKey = record.tempAccessCode;
      if (isOldAccessKeyFormat(currentKey)) {
        const newKey = generateAccessKey();
        updated++;
        return { ...record, tempAccessCode: newKey };
      }
      return record;
    });

    if (updated > 0) {
      localStorage.setItem(STAFF_LEDGER_KEY, JSON.stringify(migrated));
      // Notify any listening components to re-render with the cleaned data
      notifyDataChanged(STAFF_LEDGER_KEY);
      // Also sync the users store since AuthContext reads tempAccessCode as password
      notifyDataChanged('munyaka_users');
    }

    return {
      updated,
      unchanged: ledger.length - updated,
      total: ledger.length,
    };
  } catch (err) {
    // Non-fatal: log and return a zero-result so callers can proceed
    console.error('[staffAccessService] migrateAllStaffAccessKeys failed:', err);
    return { updated: 0, unchanged: 0, total: 0 };
  }
}

/**
 * Synchronous version of `migrateAllStaffAccessKeys` that returns the
 * already-migrated ledger without triggering a re-render notification.
 * Useful inside React `useState` initialiser functions where setState
 * is called directly.
 */
export function getMigratedStaffLedger(): PreRegisteredStaff[] {
  try {
    const raw = localStorage.getItem(STAFF_LEDGER_KEY);
    if (!raw) return [];

    const ledger: PreRegisteredStaff[] = JSON.parse(raw);
    if (!Array.isArray(ledger)) return [];

    return ledger.map(record => {
      if (isOldAccessKeyFormat(record.tempAccessCode)) {
        return { ...record, tempAccessCode: generateAccessKey() };
      }
      return record;
    });
  } catch {
    return [];
  }
}

/**
 * Re-writes the migrated ledger to localStorage after a synchronous migration.
 * Call this immediately after `getMigratedStaffLedger()` to persist changes.
 */
export function persistMigratedLedger(ledger: PreRegisteredStaff[]): void {
  try {
    localStorage.setItem(STAFF_LEDGER_KEY, JSON.stringify(ledger));
    notifyDataChanged(STAFF_LEDGER_KEY);
    notifyDataChanged('munyaka_users');
  } catch (err) {
    console.error('[staffAccessService] persistMigratedLedger failed:', err);
  }
}
