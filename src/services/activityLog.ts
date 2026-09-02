// ─────────────────────────────────────────────────────────────────────────────
// Activity Log Service — real-time event feed for the Dashboard "Recent Alerts"
// ─────────────────────────────────────────────────────────────────────────────
//
// Records every significant user action across the app:
//   • Student Registration
//   • Attendance Marking
//   • Fee Payments
//   • Marks Entry
//   • Staff Registration
//   • System events
//
// Each entry includes: id, type, title, timestamp, schoolId, metadata.
// Stored in localStorage under 'munyaka_activity_log'.
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'student_registration'
  | 'attendance'
  | 'fee_payment'
  | 'marks_entry'
  | 'staff_registration'
  | 'system';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string;        // ISO-8601 UTC
  schoolId: string | null;  // null = single-tenant / legacy
  metadata?: Record<string, unknown>; // optional extra context
}

const ACTIVITY_LOG_KEY = 'munyaka_activity_log';
const ACTIVE_SCHOOL_ID_KEY = 'munyaka_active_school_id';
const SCHOOL_PROFILE_KEY = 'munyaka_school_profile';

const MAX_LOG_ENTRIES = 500; // cap to prevent localStorage quota issues

/**
 * Resolve the currently active school id.
 */
const getActiveSchoolId = (): string | null => {
  try {
    const direct = localStorage.getItem(ACTIVE_SCHOOL_ID_KEY);
    if (direct) return direct;
    const profile = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_KEY) || '{}');
    return profile?.schoolId ?? null;
  } catch {
    return null;
  }
};

/**
 * Generate a short unique id.
 */
const genId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/**
 * Append an activity log entry.
 * Automatically caps the log at MAX_LOG_ENTRIES (oldest dropped).
 */
export const logActivity = (
  entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'schoolId'>
): void => {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    const log: ActivityLogEntry[] = raw ? JSON.parse(raw) : [];

    const schoolId = getActiveSchoolId();

    log.unshift({
      ...entry,
      id: genId(),
      timestamp: new Date().toISOString(),
      schoolId,
    });

    // Cap the log size
    if (log.length > MAX_LOG_ENTRIES) {
      log.length = MAX_LOG_ENTRIES;
    }

    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));

    // Notify same-tab listeners (Dashboard hook)
    try {
      window.dispatchEvent(
        new CustomEvent('munyaka:activity-log-changed', { detail: { key: ACTIVITY_LOG_KEY } })
      );
    } catch { /* SSR / no window */ }
  } catch {
    // Quota exceeded or parse error — discard silently
  }
};

/**
 * Retrieve the full activity log, optionally filtered by schoolId.
 * Returns entries sorted newest-first.
 */
export const getActivityLog = (schoolId?: string | null): ActivityLogEntry[] => {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const targetSchoolId = schoolId ?? getActiveSchoolId();

    return parsed
      .filter((e: ActivityLogEntry) => {
        if (!targetSchoolId) return true; // single-tenant → include all
        return e.schoolId === targetSchoolId;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
};

/**
 * Get the most recent N activities for the active school.
 */
export const getRecentActivity = (limit = 15): ActivityLogEntry[] => {
  return getActivityLog().slice(0, limit);
};

/**
 * Clear the activity log (admin only).
 */
export const clearActivityLog = (): void => {
  try {
    localStorage.removeItem(ACTIVITY_LOG_KEY);
  } catch { /* ignore */ }
};

/**
 * Format a timestamp into a human-friendly relative string.
 *   "Just now"          — < 30 seconds
 *   "X minutes ago"     — < 60 minutes
 *   "X hours ago"       — < 24 hours
 *   "Yesterday, HH:MM"  — yesterday
 *   "MMM DD, HH:MM"     — older
 */
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 30) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Older — full date + time
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Get the Tailwind color classes for an activity type.
 */
export const getActivityColors = (type: ActivityType): {
  dot: string;
  badge: string;
  text: string;
} => {
  switch (type) {
    case 'student_registration':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600' };
    case 'attendance':
      return { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700', text: 'text-purple-600' };
    case 'fee_payment':
      return { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', text: 'text-orange-600' };
    case 'marks_entry':
      return { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-600' };
    case 'staff_registration':
      return { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', text: 'text-blue-600' };
    case 'system':
    default:
      return { dot: 'bg-slate-500', badge: 'bg-slate-50 text-slate-700', text: 'text-slate-600' };
  }
};

/**
 * Get a human-readable label for an activity type.
 */
export const getActivityTypeLabel = (type: ActivityType): string => {
  switch (type) {
    case 'student_registration': return 'Registration';
    case 'attendance': return 'Attendance';
    case 'fee_payment': return 'Fee Payment';
    case 'marks_entry': return 'Marks Entry';
    case 'staff_registration': return 'Staff Registration';
    case 'system': return 'System';
    default: return 'Activity';
  }
};