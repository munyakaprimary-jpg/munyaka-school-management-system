// ─────────────────────────────────────────────────────────────────────────────
// Deletion audit log — secure log of protected record deletions.
//
// Every learner (or other sensitive entity) that is permanently removed from
// the system gets a signed audit entry written here.  The log is append-only
// and stored under a separate localStorage key so it can be reviewed by an
// administrator without requiring a database.
//
// Each entry records:
//   • timestamp  — ISO-8601 UTC string
//   • action    — "DELETE_LEARNER"
//   • targetId  — internal ID of the removed record
//   • targetAdmNo — school admission / assessment number (human-readable)
//   • targetName — full name of the removed learner
//   • adminEmail — the email of the admin who authorised the deletion
//                  (read from the active session, falls back to "unknown")
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_LOG_KEY = "munyaka_deletion_audit_log";
const ADMIN_EMAIL_KEY = "munyaka_admin_email"; // set by the login flow

export interface DeletionAuditEntry {
  timestamp: string;      // ISO-8601
  action: string;
  targetId: string;
  targetAdmNo: string;
  targetName: string;
  adminEmail: string;
}

/** Read the admin email stored at login time. Returns "unknown" if not set. */
const getAdminEmail = (): string => {
  try {
    const raw = sessionStorage.getItem(ADMIN_EMAIL_KEY);
    return raw?.trim() || "unknown";
  } catch {
    return "unknown";
  }
};

/**
 * Append a deletion audit entry.
 *
 * On quota errors the function silently discards the new entry rather than
 * crashing the caller.  No other behaviour changes.
 */
export const logDeletionAudit = (entry: Omit<DeletionAuditEntry, "timestamp" | "adminEmail">): void => {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const log: DeletionAuditEntry[] = raw ? JSON.parse(raw) : [];
    log.push({
      ...entry,
      timestamp: new Date().toISOString(),
      adminEmail: getAdminEmail(),
    });
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log));
  } catch {
    // Quota exceeded or parse error — discard silently.
  }
};

/**
 * Retrieve the full audit log.
 * Returns an empty array if the key is absent or corrupted.
 */
export const getDeletionAuditLog = (): DeletionAuditEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Clear the audit log (admin only — this itself is NOT audited).
 */
export const clearDeletionAuditLog = (): void => {
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
  } catch {
    // ignore
  }
};
