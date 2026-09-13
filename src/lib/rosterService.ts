import { Learner } from '@/types/learners';

/**
 * Centralized roster insertion service.
 *
 * Every module that needs to enroll a learner into a class roster
 * (transfer-in, promotion, restore-from-archive, etc.) MUST call into
 * this service so that the active class list, grade register, marksheets
 * and attendance rosters all stay in lock-step.
 *
 * Roster storage strategy
 * -----------------------
 * The application persists roster-shaped data to localStorage under a
 * small set of well-known keys:
 *
 *   • school_learners_data  — The single source of truth for the
 *                              learner's row (id, name, grade, stream…).
 *                              The Students page already reads/writes
 *                              this directly.
 *   • school_attendance_rosters  — per (grade, stream) attendance roster
 *   • school_marksheets         — per (grade, stream) marksheet roster
 *   • school_grade_registers    — per (grade, stream) grade register
 *   • school_active_classes     — flat list of active class codes
 *   • school_academic_history   — audit log of student events
 *
 * Each per-roster key holds an array of learner *records* (not full
 * `Learner` objects) so that the file size stays small. The roster
 * records are reconciled against `school_learners_data` on every load
 * so that name/grade/stream changes propagate automatically.
 *
 * The functions below are deliberately idempotent — calling them twice
 * with the same learner will NOT add two roster rows, so the system
 * can safely retry without duplicates.
 */

/** A compact roster row used by attendance / marksheet / register views. */
export interface RosterEntry {
  /** Learner id — the primary join key against `school_learners_data`. */
  id: string;
  /** Admission / assessment number — kept for fast lookup & export. */
  admNo: string;
  /** Full name as recorded at the time of insertion. */
  name: string;
  /** Cached grade so the roster can be filtered without a join. */
  grade: string;
  /** Cached stream so the roster can be filtered without a join. */
  stream: string;
  /** Gender — needed for class lists that group by gender. */
  gender: 'Male' | 'Female' | 'Other';
  /** ISO timestamp the learner was inserted into this roster. */
  enrolledAt: string;
  /**
   * The lifecycle source for this roster entry:
   *   • REGISTERED   — added at first registration
   *   • TRANSFERRED_IN — added via the Transfer In workflow
   *   • PROMOTED     — added by an end-of-year promotion
   *   • RESTORED     — restored from the transferred-learner archive
   */
  source: 'REGISTERED' | 'TRANSFERRED_IN' | 'PROMOTED' | 'RESTORED';
}

export interface AcademicHistoryEntry {
  id: string;
  studentId: string;
  /** Event code — e.g. "TRANSFERRED_IN", "PROMOTED", "TRANSFERRED_OUT". */
  event: string;
  /** Grade at the time of the event. */
  grade: string;
  /** Stream at the time of the event. */
  stream: string;
  /** Free-form description of the event for audit purposes. */
  description: string;
  /** ISO timestamp the event happened. */
  occurredAt: string;
  /** User (admin / staff) who performed the event, when known. */
  actorName?: string;
}

/** Storage keys — exported so the rest of the app can read them. */
export const ROSTER_KEYS = {
  learners: 'school_learners_data',
  attendance: 'school_attendance_rosters',
  marksheets: 'school_marksheets',
  gradeRegister: 'school_grade_registers',
  activeClasses: 'school_active_classes',
  academicHistory: 'school_academic_history',
} as const;

/** Storage keys grouped for `storage` event listeners. */
export const ROSTER_STORAGE_KEYS: string[] = Object.values(ROSTER_KEYS);

/** A per-class (grade + stream) bucket key. */
export const classKey = (grade: string, stream: string): string =>
  `${(grade || '').trim()}::${(stream || '').trim()}`;

/* ────────────────────────── low-level helpers ────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[rosterService] Failed to write ${key}:`, err);
  }
}

function emitRosterUpdated(): void {
  try {
    window.dispatchEvent(new Event('munyaka_roster_updated'));
  } catch {
    /* ignore */
  }
  // Also fan out a generic storage event so listeners on individual keys wake up.
  ROSTER_STORAGE_KEYS.forEach((key) => {
    try {
      window.dispatchEvent(new StorageEvent('storage', { key }));
    } catch {
      /* ignore */
    }
  });
}

/* ──────────────────────────── roster writers ─────────────────────────── */

/**
 * Insert a learner into every per-(grade, stream) roster that the active
 * class list relies on. Each insertion is idempotent — re-running with
 * the same learner id is a no-op.
 *
 * Returns the number of roster buckets that were updated (useful for
 * success notifications).
 */
export function insertLearnerIntoRosters(
  learner: Pick<Learner, 'id' | 'admNo' | 'name' | 'grade' | 'stream' | 'gender'>,
  source: RosterEntry['source'] = 'TRANSFERRED_IN',
): { updatedBuckets: number } {
  if (!learner.id || !learner.grade || !learner.stream) return { updatedBuckets: 0 };

  const entry: RosterEntry = {
    id: learner.id,
    admNo: learner.admNo,
    name: learner.name,
    grade: learner.grade,
    stream: learner.stream,
    gender: (learner.gender || 'Other') as any,
    enrolledAt: new Date().toISOString(),
    source,
  };

  const bucket = classKey(learner.grade, learner.stream);
  let updatedBuckets = 0;

  // ── 1. Active class list (flat set of "Grade::Stream" codes) ───────────
  const activeClasses = readJSON<string[]>(ROSTER_KEYS.activeClasses, []);
  if (!activeClasses.includes(bucket)) {
    activeClasses.push(bucket);
    writeJSON(ROSTER_KEYS.activeClasses, activeClasses);
  }
  updatedBuckets++;

  // ── 2. Per-class roster buckets ────────────────────────────────────────
  const rosterBuckets: { storageKey: string }[] = [
    { storageKey: ROSTER_KEYS.attendance },
    { storageKey: ROSTER_KEYS.marksheets },
    { storageKey: ROSTER_KEYS.gradeRegister },
  ];

  rosterBuckets.forEach(({ storageKey }) => {
    const all = readJSON<Record<string, RosterEntry[]>>(storageKey, {});
    const list = all[bucket] ?? [];
    const exists = list.some((r) => r.id === learner.id);
    if (!exists) {
      list.push(entry);
      all[bucket] = list;
      writeJSON(storageKey, all);
      updatedBuckets++;
    }
  });

  emitRosterUpdated();
  return { updatedBuckets };
}

/**
 * Log an academic-history entry for the learner. Used to keep an audit
 * trail of promotions, transfers, suspensions, etc.
 */
export function appendAcademicHistory(entry: Omit<AcademicHistoryEntry, 'id'>): void {
  const list = readJSON<AcademicHistoryEntry[]>(ROSTER_KEYS.academicHistory, []);
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `hist-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  list.unshift({ id, ...entry });
  writeJSON(ROSTER_KEYS.academicHistory, list);
  emitRosterUpdated();
}

/**
 * Compose a TRANSFERRED_IN academic-history record for the freshly
 * inserted learner and persist it.
 */
export function logTransferInEvent(
  learner: Pick<Learner, 'id' | 'grade' | 'stream'>,
  meta: {
    previousSchool: string;
    clearanceRef: string;
    reason: string;
    dateAdmitted: string;
    actorName?: string;
  },
): void {
  const description =
    `Transferred in from ${meta.previousSchool || 'previous school'} ` +
    `(clearance ref: ${meta.clearanceRef || 'n/a'}). ` +
    `Reason: ${meta.reason || 'not specified'}. ` +
    `Date admitted: ${meta.dateAdmitted || 'today'}.`;

  appendAcademicHistory({
    studentId: learner.id,
    event: 'TRANSFERRED_IN',
    grade: learner.grade,
    stream: learner.stream,
    description,
    occurredAt: new Date().toISOString(),
    actorName: meta.actorName,
  });
}

/**
 * All-in-one convenience helper that:
 *   1. Inserts the learner into every active roster bucket
 *   2. Logs a TRANSFERRED_IN entry to academic history
 *   3. Emits a roster-updated event so listeners refresh
 *
 * Call this from the Transfer In submit handler after the learner
 * record itself has been written to `school_learners_data`.
 */
export function registerTransferredInLearner(
  learner: Pick<Learner, 'id' | 'admNo' | 'name' | 'grade' | 'stream' | 'gender'>,
  meta: {
    previousSchool: string;
    clearanceRef: string;
    reason: string;
    dateAdmitted: string;
    actorName?: string;
  },
): { updatedBuckets: number } {
  const result = insertLearnerIntoRosters(learner, 'TRANSFERRED_IN');
  logTransferInEvent(learner, meta);
  return result;
}