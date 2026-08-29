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
/** Pattern: any key beginning with MUNYAKA-2026- will be accepted. */
export const MASTER_KEY_PATTERN = /^MUNYAKA-2026-[A-Z0-9-]+$/i;

// Characters excluded from codes to avoid ambiguity: 0/O, 1/I/L
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SEGMENT_LEN = 4;
const NUM_SEGMENTS = 4; // MUNYAKA-2026-[AAAA]-[BBBB]-[CCCC]-[DDDD]

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
  const issuedAt = new Date().toISOString().slice(0, 10);
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

/** Validate an activation key:
 *  Returns the License if valid & active, null otherwise.
 *  Also checks expiry date.
 *
 *  Master-key shortcuts:
 *  • MASTER_TEST_KEY  — always valid
 *  • any key matching MASTER_KEY_PATTERN (MUNYAKA-2026-*) — always valid
 *
 *  For master keys we construct a synthetic License so the rest of the
 *  system continues to work without any special casing.
 */
export function validateActivationKey(key: string): License | null {
  const k = key.trim().toUpperCase();

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
      issuedAt: new Date().toISOString().slice(0, 10),
      expiresAt,
      payment: { method: 'cash', refNumber: 'MASTER', amount: '0' },
      autoRenew: false,
    };
  }

  // ── Normal issued-key lookup ──────────────────────────────────────
  const licenses = readLicenses();
  const license = licenses.find(l => l.activationKey === k);
  if (!license) return null;
  if (license.status === 'revoked') return null;
  const today = new Date().toISOString().slice(0, 10);
  if (license.expiresAt < today) {
    // Mark as expired
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
  if (!license) throw new Error('Invalid or expired activation key.');
  setActiveLicense(license.activationKey);
  return license;
}

/** Get the currently active license (if any and not expired) */
export function getActiveLicense(): License | null {
  const key = localStorage.getItem(ACTIVE_LICENSE_KEY);
  if (!key) return null;
  return validateActivationKey(key);
}

/** True if the app is currently locked (no valid active license) */
export function isAppLocked(): boolean {
  return !getActiveLicense();
}

/** Get all licenses (full history) */
export function getAllLicenses(): License[] {
  return readLicenses();
}

/** Get a summary for display */
export function getLicenseStats() {
  const all = readLicenses();
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: all.length,
    active: all.filter(l => l.status === 'active' && l.expiresAt >= today).length,
    expired: all.filter(l => l.status === 'expired' || l.expiresAt < today).length,
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
