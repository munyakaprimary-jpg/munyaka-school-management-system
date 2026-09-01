/**
 * Password Reset Override Service
 *
 * Reads a local `reset-override.json` file from the Vite public directory
 * (served at the app root) and applies the specified admin/superadmin
 * password reset on app boot, then immediately deletes the file so it
 * cannot be reused.
 *
 * Expected JSON format:
 * {
 *   "action": "reset_password",
 *   "secretKey": "<EMERGENCY_SECRET from env>",
 *   "role": "admin" | "superadmin",
 *   "newPassword": "YourNewSecurePassword"
 * }
 *
 * Security:
 *   The override file must include a `secretKey` field that matches the
 *   value of the `EMERGENCY_SECRET` environment variable baked into the
 *   app at build time. If the keys do not match, the file is REJECTED,
 *   nothing is modified, and a clear error is logged.
 *
 * Role values:
 *   "admin"       → updates the unified MUNYAKA_ADMIN_PASSWORD PIN
 *   "superadmin"  → updates both the unified PIN and the stored
 *                   default system-admin user record
 */

import { MUNYAKA_ADMIN_PASSWORD, saveAdminPassword } from './adminCredentials';

const OVERRIDE_FILE = '/reset-override.json';

/**
 * The expected secret value, baked into the build via Vite's env system.
 * Configure by setting `EMERGENCY_SECRET` in your `.env` file.
 *
 * If no secret is configured, the override is always rejected.
 */
const EXPECTED_SECRET: string =
  // @ts-expect-error import.meta.env is provided by Vite at build time
  (import.meta.env?.VITE_EMERGENCY_SECRET as string | undefined) ||
  // @ts-expect-error import.meta.env is provided by Vite at build time
  (import.meta.env?.EMERGENCY_SECRET as string | undefined) ||
  '';

interface ResetOverride {
  action: string;
  secretKey: string;
  role: 'admin' | 'superadmin';
  newPassword: string;
}

/** Normalize email to the key used in USERS_STORAGE_KEY. */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const DEFAULT_SYSTEM_ADMIN_EMAIL = 'sysadmin@munyaka.sc.ke';
const USERS_STORAGE_KEY = 'munyaka_users';

const log = (msg: string, ...args: unknown[]) =>
  // eslint-disable-next-line no-console
  console.log(`[PasswordResetOverride] ${msg}`, ...args);

const logError = (msg: string, ...args: unknown[]) =>
  // eslint-disable-next-line no-console
  console.error(`[PasswordResetOverride] ERROR: ${msg}`, ...args);

/** Constant-time string comparison to reduce timing-attack leakage. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Apply a password reset for the specified role. */
function applyReset(role: 'admin' | 'superadmin', newPassword: string): boolean {
  const trimmed = newPassword.trim();
  if (!trimmed) {
    logError('newPassword is empty — skipping.');
    return false;
  }

  // ── 1. Always update the unified admin PIN key ───────────────────────────
  const pinSaved = saveAdminPassword(trimmed);
  if (pinSaved) {
    log(`Saved new admin PIN for role "${role}" → localStorage key "${MUNYAKA_ADMIN_PASSWORD}"`);
  } else {
    logError('Failed to write PIN to localStorage.');
  }

  // ── 2. If superadmin, also update the stored user record ─────────────────
  if (role === 'superadmin') {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) {
        logError('No users found in localStorage — skipping user-record update.');
        return pinSaved;
      }

      const users: Record<string, unknown> = JSON.parse(raw);
      const sysAdminKey = normalizeEmail(DEFAULT_SYSTEM_ADMIN_EMAIL);

      if (users[sysAdminKey]) {
        const record = users[sysAdminKey] as Record<string, unknown>;
        record['password'] = trimmed;
        // Add to alternative passwords so old ones keep working
        const alts: string[] = (record['alternativePasswords'] as string[]) || [];
        if (!alts.includes(trimmed)) alts.push(trimmed);
        record['alternativePasswords'] = alts;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        log(`Updated system-admin user record (${sysAdminKey}).`);
      } else {
        log(`No system-admin user record found under key "${sysAdminKey}" — skipping user update.`);
      }
    } catch (e) {
      logError('Failed to update user record:', e);
    }
  }

  return pinSaved;
}

/**
 * Attempt to read, validate, and apply the reset-override.json file.
 * Returns `true` if a valid file was found and processed, `false` otherwise.
 */
export async function processPasswordResetOverride(): Promise<boolean> {
  try {
    // ── Guard: no secret configured ⇒ reject everything ──────────────────
    if (!EXPECTED_SECRET) {
      // The app was built without VITE_EMERGENCY_SECRET (or EMERGENCY_SECRET).
      // To avoid leaking the absence of a secret, we quietly skip the file.
      return false;
    }

    const response = await fetch(OVERRIDE_FILE, { cache: 'no-store' });

    if (!response.ok) {
      // 404 / network error — no override file present; nothing to do
      return false;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      logError('reset-override.json is not valid JSON — skipping.');
      return false;
    }

    // ── Validate shape ────────────────────────────────────────────────────
    if (!data || typeof data !== 'object') {
      logError('reset-override.json must be a JSON object — skipping.');
      return false;
    }

    const obj = data as Record<string, unknown>;

    if (obj['action'] !== 'reset_password') {
      log(`action is "${String(obj['action'])}" — expected "reset_password". Skipping.`);
      return false;
    }

    // ── Validate secretKey (constant-time comparison) ──────────────────────
    const providedSecret = obj['secretKey'];
    if (typeof providedSecret !== 'string' || providedSecret.length === 0) {
      logError('secretKey is missing or not a string — REJECTED. No changes made.');
      return false;
    }
    if (!safeEqual(providedSecret, EXPECTED_SECRET)) {
      logError('secretKey does not match EMERGENCY_SECRET — REJECTED. No changes made.');
      // Do NOT delete the file in this case so an admin can inspect it
      return false;
    }

    const role = obj['role'];
    if (role !== 'admin' && role !== 'superadmin') {
      logError(`role must be "admin" or "superadmin", got "${String(role)}" — skipping.`);
      return false;
    }

    const newPassword = obj['newPassword'];
    if (typeof newPassword !== 'string' || !newPassword.trim()) {
      logError('newPassword must be a non-empty string — skipping.');
      return false;
    }

    // ── Apply the reset ───────────────────────────────────────────────────
    const label = role === 'superadmin' ? 'superadmin' : 'admin';
    log(`✓ Valid override with matching secretKey — resetting password for: ${label}`);
    const success = applyReset(role, newPassword);

    // ── Delete the file (best-effort) ────────────────────────────────────
    // For a Vite SPA served from a static host, a DELETE fetch to a
    // public file is not natively supported by most static hosts. We call
    // the endpoint anyway; if the host supports it (e.g. a custom dev
    // server that does support it), the file gets deleted. Otherwise the
    // app falls back to logging the intent clearly.
    try {
      const deleteRes = await fetch(OVERRIDE_FILE, { method: 'DELETE' });
      if (deleteRes.ok) {
        log(`✓ Deleted override file "${OVERRIDE_FILE}".`);
      } else {
        log(`⚠ Could not delete "${OVERRIDE_FILE}" (status ${deleteRes.status}). ` +
          `Please delete the file manually to prevent reuse.`);
      }
    } catch {
      log(`⚠ Network error while deleting "${OVERRIDE_FILE}". Please delete the file manually.`);
    }

    if (success) {
      log(`═══════════════════════════════════════════════════════`);
      log(`  ✅  PASSWORD RESET SUCCESSFUL`);
      log(`  Account: ${label.toUpperCase()}`);
      log(`  New password is now active — reload to sign in.`);
      log(`═══════════════════════════════════════════════════════`);
    } else {
      logError('Reset was applied but localStorage write may have failed.');
    }

    return true;
  } catch (e) {
    logError('Unexpected error while processing override:', e);
    return false;
  }
}
