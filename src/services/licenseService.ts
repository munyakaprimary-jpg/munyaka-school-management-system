import {
  License,
  LicenseMethod,
  ValidityDuration,
  LicensePaymentDetails,
  LicenseStatus,
} from '@/types/license';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
export const LICENSE_STORAGE_KEY = 'munyaka_licenses';
export const ACTIVE_LICENSE_KEY = 'munyaka_active_license';
export const APP_LOCKED_KEY = 'munyaka_app_locked';
export const IS_ACTIVATED_KEY = 'is_activated';

// ─────────────────────────────────────────────
// Master / wildcard keys (bypass the issued-license lookup)
// ─────────────────────────────────────────────
/** A single, well-known master test key that always validates. */
export const MASTER_TEST_KEY = 'MUNYAKA-2026-A3B7-X9K2-M8N4-R7T1';
/** Pattern: any key beginning with MUNYAKA-2026- followed by exactly 4-char segments. */
export const MASTER_KEY_PATTERN = /^MUNYAKA-2026-(?:[A-Z0-9]{4}-){3}[A-Z0-9]{4}$/i;

// Characters excluded from codes to avoid ambiguity: 0/O, 1/I/L
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SEGMENT_LEN = 4;
const NUM_SEGMENTS = 4; // MUNYAKA-2026-[AAAA]-[BBBB]-[CCCC]-[DDDD]

// Roles that bypass license expiration locks. The School Owner / Super Admin
// must always be able to reach the Payment & Subscriptions / activation page
// so they can renew the license. Without this carve-out they would be
// locked out of the very screen they need to fix the lock.
export const LICENSE_EXEMPT_ROLES = new Set(['owner', 'admin']);

// Storage key for the *currently authenticated role* (string). The lock
// screen consults this key to decide whether to render the lock gate or
// let the user through to the dashboard. The AuthContext writes this
// whenever the user logs in, logs out, or switches roles.
export const CURRENT_AUTH_ROLE_KEY = 'munyaka_current_auth_role';

// ─────────────────────────────────────────────
// Key generation
// ─────────────────────────────────────────────

/** Generate a cryptographically-structured activation key:
 *  MUNYAKA-YYYY-XXXX-XXXX-XXXX-XXXX
 *  e.g. MUNYAKA-2026-A3B7-X9K2-M8N4-R7T1
 */
export function generateActivationKey(year?: number): string {
  const yyyy = year ?? new Date().getFullYear();
  const prefix = `MUNYAKA-${yyyy}`;
  const segments: string[] = [];
  for (let s = 0; s < NUM_SEGMENTS; s++) {
    let seg = '';
    const array = new Uint32Array(SEGMENT_LEN);
    crypto.getRandomValues(array);
    for (let i = 0; i < SEGMENT_LEN; i++) {
      seg += CHARS[array[i] % CHARS.length];
    }
    segments.push(seg);
  }
  return `${prefix}-${segments.join('-')}`;
}

/** Compute expiry date from today + validityDays */
export function computeExpiry(validityDays: ValidityDuration): string {
  const d = new Date();
  d.setDate(d.getDate() + validityDays);
  return d.toISOString().slice(0, 10);
}

/** Human-readable duration label */
export function validityLabel(days: ValidityDuration): string {
  switch (days) {
    case 30:  return '30 Days (Trial)';
    case 365: return '1 Year';
    case 730: return '2 Years';
    default:  return `${days} days`;
  }
}

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

/** Today in YYYY-MM-DD (local time). */
export function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse YYYY-MM-DD into a Date at 23:59:59.999 (local time) on that day.
 *  Returns NaN for invalid input.
 */
function endOfDay(dateStr: string): number {
  if (!dateStr) return NaN;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return NaN;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return dt.getTime();
}

/** Parse YYYY-MM-DD into a Date at 00:00:00 (local time) on that day. */
function startOfDay(dateStr: string): number {
  if (!dateStr) return NaN;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return NaN;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return dt.getTime();
}

/**
 * Decide whether `expiresAt` should be considered *expired* at the current
 * wall-clock time.
 *
 * Rules:
 *   - An empty / invalid `expiresAt` is treated as expired.
 *   - The license is FULLY ACTIVE throughout the entire `expiresAt` day
 *     (00:00:00 through 23:59:59.999). It only flips to "expired" once
 *     the system clock reaches 11:59 PM on that day.
 *   - Once the clock crosses 11:59 PM, the next calendar day is treated
 *     as fully expired.
 *
 * This guarantees that a license with `expiresAt = 2026-05-01` is
 * usable from midnight through 23:59:59.999 on May 1st, and only
 * becomes expired at the stroke of midnight on May 2nd.
 */
export function isLicenseExpiredAt(expiresAt: string, now: Date = new Date()): boolean {
  const end = endOfDay(expiresAt);
  if (isNaN(end)) return true; // Invalid dates are treated as expired
  return now.getTime() > end;
}

/** Days remaining until expiration. Returns 0 once expired. */
export function daysRemainingUntil(expiresAt: string, now: Date = new Date()): number {
  if (isLicenseExpiredAt(expiresAt, now)) return 0;
  const start = startOfDay(expiresAt);
  if (isNaN(start)) return 0;
  const diff = start - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────

function readLicenses(): License[] {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLicenses(licenses: License[]): void {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenses));
}

/** Persist a new license after a payment is recorded */
export function issueLicense(params: {
  issuedTo: string;
  deviceId: string;
  validityDays: ValidityDuration;
  payment: LicensePaymentDetails;
  autoRenew?: boolean;
  notes?: string;
}): License {
  const licenses = readLicenses();
  const issuedAt = todayIso();
  const expiresAt = computeExpiry(params.validityDays);
  const license: License = {
    id: `LIC-${Date.now()}`,
    activationKey: generateActivationKey(),
    issuedTo: params.issuedTo,
    deviceId: params.deviceId,
    status: 'active',
    validityDays: params.validityDays,
    issuedAt,
    expiresAt,
    payment: params.payment,
    autoRenew: params.autoRenew ?? false,
    notes: params.notes,
  };
  licenses.push(license);
  writeLicenses(licenses);
  // Also set as the currently active license (and sync the is_activated
  // flag + activation_expires_at in localStorage so the lock screen
  // recognises the app as active for the next 30 days).
  setActiveLicense(license.activationKey, expiresAt);
  return license;
}

/** Mark a license as the active (currently installed) license */
export function setActiveLicense(activationKey: string, expiresAt?: string): void {
  localStorage.setItem(ACTIVE_LICENSE_KEY, activationKey);
  localStorage.setItem(IS_ACTIVATED_KEY, 'true');
  localStorage.removeItem(APP_LOCKED_KEY);
  if (expiresAt) {
    localStorage.setItem('activation_expires_at', expiresAt);
  }
}

/** Revoke / expire a license */
export function revokeLicense(activationKey: string, reason?: string): void {
  const licenses = readLicenses();
  const idx = licenses.findIndex(l => l.activationKey === activationKey);
  if (idx === -1) return;
  licenses[idx] = { ...licenses[idx], status: 'revoked', notes: reason ?? licenses[idx].notes };
  writeLicenses(licenses);
  // If this was the active license, re-lock the app
  if (localStorage.getItem(ACTIVE_LICENSE_KEY) === activationKey) {
    localStorage.removeItem(ACTIVE_LICENSE_KEY);
    localStorage.setItem(APP_LOCKED_KEY, 'true');
  }
}

/**
 * Validate an activation key:
 * Returns the License if valid & active, null otherwise.
 * Also checks expiry date.
 *
 * Master-key shortcuts:
 *  - MASTER_TEST_KEY  — always valid
 *  - any key matching MASTER_KEY_PATTERN (MUNYAKA-2026-XXXX-XXXX-XXXX-XXXX) — always valid
 *
 * For master keys we construct a synthetic License so the rest of the
 * system continues to work without any special casing.
 */
export function validateActivationKey(key: string): License | null {
  // ── Lenient normalization ────────────────────────────────────────
  // Strip whitespace AND hyphens, then uppercase. This lets users enter
  // the key with or without hyphens and still have it validate
  // identically (e.g. "MUNYAKA-2026-A3B7" ≡ "MUNYAKA2026A3B7").
  const normalized = key.replace(/[\s-]/g, '').toUpperCase();

  // Re-hyphenate into the canonical form so downstream comparisons
  // (master-key check, stored license lookup) work against a single,
  // predictable shape.
  const rehyphenate = (s: string): string => {
    const prefix = 'MUNYAKA2026';
    if (s.startsWith(prefix)) {
      const tail = s.slice(prefix.length);
      const chunks = tail.match(/.{1,4}/g) || [];
      return ['MUNYAKA-2026', ...chunks].join('-');
    }
    // Generic 4-char chunking for master/wildcard keys that don't
    // carry the issued prefix.
    return s.match(/.{1,4}/g)?.join('-') ?? s;
  };
  const k = rehyphenate(normalized);

  // ── Master / wildcard shortcuts ──────────────────────────────────
  if (k === MASTER_TEST_KEY || MASTER_KEY_PATTERN.test(k)) {
    // Store the activation flag so the app stays unlocked across refreshes
    const expiresAt = computeExpiry(365);
    localStorage.setItem(IS_ACTIVATED_KEY, 'true');
    localStorage.setItem('activation_expires_at', expiresAt);
    return {
      id: 'MASTER-KEY',
      activationKey: k,
      issuedTo: 'MASTER',
      deviceId: 'MASTER',
      status: 'active',
      validityDays: 365,
      issuedAt: todayIso(),
      expiresAt,
      payment: { method: 'cash', refNumber: 'MASTER', amount: '0' },
      autoRenew: false,
    };
  }

  // ── Strict 4-character segment validation for issued keys ────────
  // Enforce exact format: MUNYAKA-YYYY-XXXX-XXXX-XXXX-XXXX (4 segments of 4 chars)
  const issuedKeyPattern = /^MUNYAKA-\d{4}-(?:[A-Z0-9]{4}-){3}[A-Z0-9]{4}$/i;
  if (!issuedKeyPattern.test(k)) {
    return null; // Reject keys that don't match strict 4-char segment format
  }

  // ── Normal issued-key lookup ──────────────────────────────────────
  const licenses = readLicenses();
  const license = licenses.find(l => l.activationKey === k);
  if (!license) return null;
  if (license.status === 'revoked') return null;
  // Expiry check uses the same logic as isLicenseExpiredAt so the lock
  // and the validate path can never disagree.
  if (isLicenseExpiredAt(license.expiresAt)) {
    // Mark as expired on disk for bookkeeping.
    const idx = licenses.findIndex(l => l.id === license.id);
    licenses[idx] = { ...licenses[idx], status: 'expired' };
    writeLicenses(licenses);
    return null;
  }
  return license;
}

/** Activate / install a license key:
 *  Validates, sets as active, and unlocks the app.
 *  Returns the License on success, throws on failure.
 */
export function activateLicense(key: string): License {
  const license = validateActivationKey(key);
  if (!license) throw new Error('Invalid or expired activation key. Keys must follow the format: MUNYAKA-YYYY-XXXX-XXXX-XXXX-XXXX');
  setActiveLicense(license.activationKey);
  return license;
}

/** Get the currently active license (if any and not expired) */
export function getActiveLicense(): License | null {
  const key = localStorage.getItem(ACTIVE_LICENSE_KEY);
  if (!key) return null;
  return validateActivationKey(key);
}

/** True if the app is currently locked (no valid active license).
 *  The School Owner / Super Admin is exempt from the lock so they can
 *  always reach the Payment & Subscriptions screen to renew the
 *  license. Read the current authenticated role from
 *  `munyaka_current_auth_role` (written by AuthContext).
 */
export function isAppLocked(opts: { currentRole?: string | null } = {}): boolean {
  // If there's no active license, the app is locked for everyone
  // EXCEPT the Owner / Super Admin — they can still log in to renew.
  if (!getActiveLicense()) {
    return !isExemptRole(opts.currentRole ?? currentAuthRole());
  }
  return false;
}

/** Read the role of the user currently signed in. */
function currentAuthRole(): string | null {
  try {
    return localStorage.getItem(CURRENT_AUTH_ROLE_KEY);
  } catch {
    return null;
  }
}

/** True if the supplied role is allowed to bypass the license lock. */
export function isExemptRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return LICENSE_EXEMPT_ROLES.has(role);
}

/** True if the app should show the license gate to the current user. */
export function shouldShowLicenseGate(opts: { currentRole?: string | null } = {}): boolean {
  try {
    const globalLock = localStorage.getItem('munyaka_global_app_lock');
    const role = opts.currentRole || currentAuthRole() || '';
    const isOwnerOrAdmin = isExemptRole(role) || role.toLowerCase() === 'admin' || role.toLowerCase() === 'owner';

    if (globalLock === 'true' && !isOwnerOrAdmin) {
      return true;
    }
  } catch {
    /* fallback */
  }

  if (isExemptRole(opts.currentRole ?? currentAuthRole())) {
    // Exempt role: only show the gate if there is no active license at
    // all (so a fresh install with no key still shows the lock screen
    // so an Owner can enter their first key).
    return !getActiveLicense();
  }
  return isAppLocked(opts);
}

/** Get all licenses (full history) */
export function getAllLicenses(): License[] {
  return readLicenses();
}

/** Get a summary for display */
export function getLicenseStats() {
  const all = readLicenses();
  const today = todayIso();
  return {
    total: all.length,
    active: all.filter(l => l.status === 'active' && !isLicenseExpiredAt(l.expiresAt)).length,
    expired: all.filter(l => l.status === 'expired' || isLicenseExpiredAt(l.expiresAt)).length,
    revoked: all.filter(l => l.status === 'revoked').length,
  };
}

// ─────────────────────────────────────────────
// Developer bypass
// ─────────────────────────────────────────────

/** Instantly activate the app using the master test key without any UI.
 *  Useful for local development / testing so you never get stuck on the
 *  lock screen.
 */
export function devBypass(): void {
  activateLicense(MASTER_TEST_KEY);
}