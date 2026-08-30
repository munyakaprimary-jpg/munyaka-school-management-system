// ─────────────────────────────────────────────────────────────────────────────
// Admin credentials
//
// Single source of truth for the System Administrator / Super Admin
// password storage keys and the hard-coded default PINs. Every module
// that reads or writes the admin password MUST import from this file so
// the Configuration / Security update screen and the System
// Administrator login screen stay perfectly in sync.
// ─────────────────────────────────────────────────────────────────────────────

/** The canonical, role-specific localStorage key for the saved admin PIN. */
export const MUNYAKA_ADMIN_PASSWORD = 'munyaka_admin_password';

/** Legacy role-specific key (Configuration → Owner Security, Settings tab). */
export const MUNYAKA_SYSADMIN_PASS = 'munyaka_sysadmin_pass';
export const MUNYAKA_OWNER_PASS = 'munyaka_owner_pass';

/** Older Configuration → System Security key. */
export const MUNYAKA_SYSTEM_PASS = 'munyaka_system_pass';

/**
 * Shared legacy key. Used by Fees, Grades, Attendance, ICT, and the
 * "munyaka5239" fallback. We keep writing to it so any other module
 * that still reads it sees the same freshly-saved value.
 */
export const MUNYAKA_ADMIN_PASS = 'munyaka_admin_pass';

/** Hard-coded defaults — used only as a last-resort fallback. */
export const DEFAULT_ADMIN_PASSWORDS = {
  system_admin: 'sysadmin2026',
  super_admin: 'ownerpass2026',
} as const;

export type AdminRoleId = 'system_admin' | 'super_admin';

/**
 * Return the role-specific Configuration key. The single
 * `MUNYAKA_ADMIN_PASSWORD` key is the canonical read target, but we
 * also resolve the legacy role-specific key so older builds and
 * earlier code paths continue to work.
 */
export const getRoleConfigKey = (role: AdminRoleId): string => {
  switch (role) {
    case 'system_admin':
      return MUNYAKA_SYSADMIN_PASS;
    case 'super_admin':
      return MUNYAKA_OWNER_PASS;
  }
};

/**
 * Read the active admin PIN for the given role, trying every key the
 * app might have written to, in priority order:
 *
 *   1. The unified `MUNYAKA_ADMIN_PASSWORD` key
 *   2. Role-specific Configuration → Owner Security key
 *      (`munyaka_sysadmin_pass` / `munyaka_owner_pass`)
 *   3. Older Configuration → System Security key (`munyaka_system_pass`)
 *   4. Shared legacy key (`munyaka_admin_pass`)
 *   5. Hard-coded default for the role
 *
 * All values are .trim()'d so accidental whitespace on a stored value
 * never causes a comparison to silently fail.
 */
export const getActiveAdminPassword = (
  role: AdminRoleId,
): { password: string; source: 'unified' | 'role' | 'legacy' | 'shared' | 'default' } => {
  const tryRead = (key: string): { value: string; source: 'unified' | 'role' | 'legacy' | 'shared' } | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const normalised = raw.trim();
        if (normalised.length > 0) {
          // Tag which key the value came from so debug logs are explicit.
          let source: 'unified' | 'role' | 'legacy' | 'shared';
          if (key === MUNYAKA_ADMIN_PASSWORD) source = 'unified';
          else if (key === MUNYAKA_SYSADMIN_PASS || key === MUNYAKA_OWNER_PASS) source = 'role';
          else if (key === MUNYAKA_SYSTEM_PASS) source = 'legacy';
          else source = 'shared';
          return { value: normalised, source };
        }
      }
    } catch {
      /* localStorage unavailable */
    }
    return null;
  };

  // 1. Unified canonical key
  const unified = tryRead(MUNYAKA_ADMIN_PASSWORD);
  if (unified) return unified;

  // 2. Role-specific Configuration key
  const roleKey = getRoleConfigKey(role);
  const fromRole = tryRead(roleKey);
  if (fromRole) return fromRole;

  // 3. Older Configuration → System Security key
  const fromSystem = tryRead(MUNYAKA_SYSTEM_PASS);
  if (fromSystem) return fromSystem;

  // 4. Shared legacy key
  const fromShared = tryRead(MUNYAKA_ADMIN_PASS);
  if (fromShared) return fromShared;

  // 5. Hard-coded default
  const fallback = DEFAULT_ADMIN_PASSWORDS[role] ?? '';
  return {
    password: fallback.trim(),
    source: 'default',
  };
};

/**
 * Persist the new admin PIN to every key the rest of the app reads
 * from, so the Login page (which checks Configuration, legacy and
 * shared keys) and the AuthContext all see the same value.
 *
 * @param role      - The admin role whose PIN is being saved.
 * @param newPin    - The new PIN string. Guards against null/undefined
 *                    gracefully so callers don't need non-null guarantees.
 */
export const saveAdminPassword = (
  role: AdminRoleId,
  newPin: string | null | undefined,
): void => {
  if (newPin == null) return; // null or undefined — nothing to save
  const trimmed = newPin.trim();
  if (!trimmed) return;

  const roleKey = getRoleConfigKey(role);
  try {
    // 1. Unified canonical key (the single source of truth going forward)
    localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, trimmed);
    // 2. Role-specific Configuration key
    localStorage.setItem(roleKey, trimmed);
    // 3. Older Configuration → System Security key
    localStorage.setItem(MUNYAKA_SYSTEM_PASS, trimmed);
    // 4. Shared legacy key
    localStorage.setItem(MUNYAKA_ADMIN_PASS, trimmed);
  } catch {
    /* localStorage quota exceeded or unavailable — caller surfaces the error */
    throw new Error('Could not save admin password to local storage.');
  }
};
