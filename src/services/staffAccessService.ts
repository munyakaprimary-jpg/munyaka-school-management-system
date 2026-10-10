/**
 * Staff Access Key Utilities
 * ==========================
 *
 * Standardized to exclusively use the `MUN-[A-Z0-9]{4}` format for all staff access codes.
 */

const MUN_PREFIX = 'MUN-';

/**
 * The regex that defines a correctly-formatted MUN access key.
 * Matches `MUN-` followed by exactly 4 alphanumeric characters (A-Z, 0-9).
 */
export const VALID_ACCESS_KEY_PATTERN = /^MUN-[A-Z0-9]{4}$/i;

/**
 * Generates a fresh, unique 4-character alphanumeric access key.
 * Format: MUN-XXXX (e.g. MUN-NMWT)
 */
export function generateAccessKey(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${MUN_PREFIX}${suffix}`;
}

/**
 * Returns true when `key` is a valid MUN-XXXX key.
 */
export function isValidAccessKey(key?: string | null): boolean {
  if (!key) return false;
  return VALID_ACCESS_KEY_PATTERN.test(key);
}

/**
 * Returns true if the key is in an old format.
 */
export function isOldAccessKeyFormat(key?: string | null): boolean {
  if (!key) return true;
  return !isValidAccessKey(key);
}

/**
 * Returns a normalised access key strictly conforming to MUN-XXXX.
 */
export function normalizeAccessKey(key?: string | null): string {
  const trimmed = String(key || '').trim();
  if (isValidAccessKey(trimmed)) return trimmed.toUpperCase();
  return generateAccessKey();
}
