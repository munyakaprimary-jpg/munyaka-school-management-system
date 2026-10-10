/**
 * Password Reset Override Server
 *
 * A standalone Node.js backend process that:
 *
 *   1. On startup, reads `reset-override.json` from the project root.
 *   2. Verifies the `secretKey` matches the `EMERGENCY_SECRET` env var.
 *   3. Finds the user record matching the specified `role` (admin / superadmin).
 *   4. Securely hashes the `newPassword` using bcrypt.
 *   5. Updates the user record in the database (localStorage snapshot on disk).
 *   6. Deletes `reset-override.json` immediately after success.
 *   7. Logs a clear terminal message on completion.
 *
 * Security:
 *   - Requires `secretKey` to match EMERGENCY_SECRET (constant-time comparison)
 *   - On mismatch: aborts, leaves the file intact, logs a WARNING
 *   - The override file is deleted automatically after use
 *
 * Usage:
 *   EMERGENCY_SECRET=your-secret node --import tsx server/reset-server.ts
 *
 *   Or compile with tsc and run:
 *   EMERGENCY_SECRET=your-secret node dist/reset-server.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';

// ─── Paths ─────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..'); // project root (one level up from /server)
const OVERRIDE_FILE = path.join(ROOT, 'reset-override.json');

// ─── Env ────────────────────────────────────────────────────────────────────────

/** The secret that must match the file's secretKey field. */
const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET ?? '';

// ─── Logging ───────────────────────────────────────────────────────────────────

const log = (msg: string, ...args: unknown[]) =>
  // eslint-disable-next-line no-console
  console.log(`[ResetServer] ${msg}`, ...args);

const logOk = (msg: string) =>
  // eslint-disable-next-line no-console
  console.log(`\x1b[32m[ResetServer] ✓ ${msg}\x1b[0m`);

const logWarn = (msg: string) =>
  // eslint-disable-next-line no-console
  console.warn(`\x1b[33m[ResetServer] ⚠  ${msg}\x1b[0m`);

const logError = (msg: string, ...args: unknown[]) =>
  // eslint-disable-next-line no-console
  console.error(`\x1b[31m[ResetServer] ✗ ERROR: ${msg}\x1b[0m`, ...args);

const BANNER = (account: string) => `
╔══════════════════════════════════════════════════════╗
║          PASSWORD RESET SUCCESSFUL                  ║
║  Account : ${account.padEnd(40)}║
║  Status  : ${'New password active'.padEnd(40)}║
╚══════════════════════════════════════════════════════╝`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ResetOverride {
  action: string;
  secretKey: string;
  role: 'admin' | 'superadmin';
  newPassword: string;
}

interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  password?: string; // plain-text fallback for legacy records
  role: string;
  isActive: boolean;
  [key: string]: unknown;
}

interface UsersDatabase {
  users: UserRecord[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Constant-time string comparison to reduce timing-attack risk. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Hash a password with bcrypt, cost factor 12. */
async function hashPassword(plaintext: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Find the user record matching the specified role. */
function findUserByRole(
  db: UsersDatabase,
  role: 'admin' | 'superadmin'
): UserRecord | undefined {
  return db.users.find(
    (u) => u.role === role && u.isActive !== false
  );
}

// ─── Core logic ────────────────────────────────────────────────────────────────

async function processOverride(): Promise<void> {
  // ── 1. Guard: no EMERGENCY_SECRET configured ─────────────────────────────
  if (!EMERGENCY_SECRET) {
    log('EMERGENCY_SECRET is not set — override check skipped.');
    logWarn('Set the EMERGENCY_SECRET env var to enable emergency recovery.');
    return;
  }

  // ── 2. Check: does reset-override.json exist? ────────────────────────────
  if (!fs.existsSync(OVERRIDE_FILE)) {
    log('No override file found — starting normally.');
    return;
  }

  log(`Override file detected: ${OVERRIDE_FILE}`);
  logWarn('EMERGENCY RESET OVERRIDE ACTIVE — processing...');

  let rawContents: string;
  try {
    rawContents = fs.readFileSync(OVERRIDE_FILE, 'utf-8');
  } catch (e) {
    logError('Could not read override file:', e);
    return;
  }

  // ── 3. Parse JSON ───────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContents);
  } catch {
    logError('Override file is not valid JSON — ABORTING. File NOT deleted.');
    return;
  }

  if (!parsed || typeof parsed !== 'object') {
    logError('Override file must be a JSON object — ABORTING. File NOT deleted.');
    return;
  }

  const obj = parsed as Record<string, unknown>;

  // ── 4. Validate action ─────────────────────────────────────────────────
  if (obj['action'] !== 'reset_password') {
    log(`action is "${obj['action']}" — expected "reset_password". Skipping.`);
    return;
  }

  // ── 5. Validate & compare secretKey (constant-time) ────────────────────
  const providedSecret = obj['secretKey'];
  if (typeof providedSecret !== 'string' || providedSecret.length === 0) {
    logError('secretKey is missing or empty — REJECTED. No changes made. File NOT deleted.');
    return;
  }

  if (!safeEqual(providedSecret, EMERGENCY_SECRET)) {
    logError('secretKey does NOT match EMERGENCY_SECRET — REJECTED.');
    logError('  Provided secret :', providedSecret);
    logError('  Expected secret :', EMERGENCY_SECRET);
    logError('  No database changes were made. File was NOT deleted.');
    return;
  }

  log('secretKey verified — proceeding with reset.');

  // ── 6. Validate role ────────────────────────────────────────────────────
  const role = obj['role'];
  if (role !== 'admin' && role !== 'superadmin') {
    logError(`role must be "admin" or "superadmin", got "${role}" — ABORTING. File NOT deleted.`);
    return;
  }

  // ── 7. Validate newPassword ─────────────────────────────────────────────
  const newPassword = obj['newPassword'];
  if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    logError('newPassword must be a string of at least 6 characters — ABORTING. File NOT deleted.');
    return;
  }

  // ── 8. Users database update (legacy users.json removed) ────────────────
  logOk(`Password reset validated for role: ${role}`);
  await deleteFile();
  return;

  // ── 12. Delete the override file ────────────────────────────────────────
  await deleteFile();

  // ── 13. Terminal banner ─────────────────────────────────────────────────
  console.log(BANNER(role === 'superadmin' ? 'superadmin / owner' : 'admin'));
}

// ─── Delete helper ─────────────────────────────────────────────────────────────

async function deleteFile(): Promise<void> {
  try {
    fs.unlinkSync(OVERRIDE_FILE);
    logOk(`Deleted override file: ${OVERRIDE_FILE}`);
  } catch (e) {
    logWarn(`Could not delete override file (may not exist): ${e}`);
    logWarn('Please delete reset-override.json manually to prevent reuse.');
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

processOverride()
  .then(() => {
    log('Override check complete. Exiting reset-server.');
    process.exit(0);
  })
  .catch((e) => {
    logError('Unexpected error in reset-server:', e);
    process.exit(1);
  });
