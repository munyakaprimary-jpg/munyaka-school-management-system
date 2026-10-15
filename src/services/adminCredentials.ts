// ─────────────────────────────────────────────────────────────────────────────
// Admin credentials — single source of truth.
//
// One key, one fallback, one set of helper functions. Every module that
// reads or writes the System Administrator / Super Admin password
// imports from this file so the Configuration / Security update screen
// and the System Administrator login screen stay perfectly in sync.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The ONE localStorage key used for the admin password, by every module.
 *
 * This supersedes the previous web of role-specific and legacy keys
 * (`munyaka_sysadmin_pass`, `munyaka_owner_pass`, `munyaka_system_pass`,
 * `munyaka_admin_pass`). Existing data in those keys is intentionally
 * ignored — admins will re-set their PIN once under the new key.
 */
export const MUNYAKA_ADMIN_PASSWORD = 'munyaka_admin_password';

/** Hard-coded default — used only as a last-resort fallback. */
export const DEFAULT_ADMIN_PASSWORD = 'munyaka2026';


/**
 * Read the active admin password. Returns the value stored under
 * `MUNYAKA_ADMIN_PASSWORD` if present (trimmed), otherwise the
 * hard-coded default.
 */
export const getActiveAdminPassword = (): string => {
  try {
    const raw = localStorage.getItem(MUNYAKA_ADMIN_PASSWORD);
    if (raw != null) {
          const trimmed = String(raw || '').trim();
          if (trimmed.length > 0) return trimmed;
        }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_ADMIN_PASSWORD;
};

/**
 * Persist a new admin password. Writes ONLY to the single
 * `MUNYAKA_ADMIN_PASSWORD` key. No-op for null/undefined/empty values
 * so callers don't need a non-null guarantee.
 */
export const saveAdminPassword = (newPin: string | null | undefined): boolean => {
  if (newPin == null) return false;
  const trimmed = String(newPin || '').trim();
  if (!trimmed) return false;
  try {
    localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, trimmed);
    return true;
  } catch {
    /* localStorage quota exceeded or unavailable */
    return false;
  }
};
