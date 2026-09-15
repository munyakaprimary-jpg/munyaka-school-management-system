/**
 * localStorage-backed CRUD for the Transferred Learners Archive.
 *
 * Storage layout:
 *   key:   `munyaka_transferred_archive`
 *   value: JSON-encoded `TransferredLearnerArchive[]` (most recent first)
 *
 * The archive is intentionally separate from the active roster
 * (`school_learners_data`). The active roster holds a `status: 'TRANSFERRED'`
 * marker on the learner record so existing filters exclude them; the
 * archive holds the full historical snapshot for audit and re-issuance.
 */

import type {
  TransferredLearnerArchive,
  ArchiveAuditMetadata,
} from '@/types/archive';

const ARCHIVE_KEY = 'munyaka_transferred_archive';

/** Event names — exported so consumers can subscribe. */
export const ARCHIVE_UPDATED_EVENT = 'archive_updated';
export const LEARNERS_UPDATED_EVENT = 'learners_data_updated';

// ──────────────────────────────────────────────────────────────────────────
//  Internal helpers
// ──────────────────────────────────────────────────────────────────────────

function readArchive(): TransferredLearnerArchive[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TransferredLearnerArchive[];
  } catch (err) {
    console.warn('[archiveStorage] Failed to read archive:', err);
    return [];
  }
}

function writeArchive(records: TransferredLearnerArchive[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('[archiveStorage] Failed to write archive:', err);
  }
}

function sortByDateDesc(
  records: TransferredLearnerArchive[]
): TransferredLearnerArchive[] {
  return [...records].sort((a, b) => {
    const aTs = a.transferDate || a.audit?.executedAt || '';
    const bTs = b.transferDate || b.audit?.executedAt || '';
    return new Date(bTs).getTime() - new Date(aTs).getTime();
  });
}

/**
 * Fire a 'cross-component' event so other components that subscribe to
 * 'archive_updated' get notified without needing a shared context.
 * We dispatch BOTH `archive_updated` and a `storage` event for the
 * archive key so legacy listeners still wake up.
 */
function emitArchiveUpdated(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(ARCHIVE_UPDATED_EVENT));
    window.dispatchEvent(new StorageEvent('storage', { key: ARCHIVE_KEY }));
  } catch {
    /* SSR / worker context */
  }
}

/**
 * Notify subscribers that the active roster (`school_learners_data`) has
 * changed — used after a restore to flush any "still showing the old
 * status" UI without waiting for the user to refresh the page.
 */
function emitLearnersUpdated(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(LEARNERS_UPDATED_EVENT));
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'school_learners_data' },
    ));
  } catch {
    /* ignore */
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────────────────

/** Get the full archive, most recent transfer first. */
export function getArchive(): TransferredLearnerArchive[] {
  return sortByDateDesc(readArchive());
}

/** Look up a single archived record by learner ID. */
export function getArchivedLearner(
  id: string
): TransferredLearnerArchive | null {
  return readArchive().find((r) => r.id === id) ?? null;
}

/**
 * Insert or replace a transfer record in the archive.
 * Idempotent: re-saving the same certificate number is a no-op overwrite.
 *
 * Always emits `archive_updated` so the Transferred Learners Archive
 * page (and any other listener) refreshes immediately. Without this,
 * the page would not know a new row was written by `TransferWorkflow`
 * and the learner would appear to have "disappeared".
 */
export function saveArchivedLearner(
  record: TransferredLearnerArchive
): TransferredLearnerArchive {
  const all = readArchive();
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  writeArchive(all);
  emitArchiveUpdated();
  return record;
}

/** Delete a single archive entry (used by the restore flow). */
export function deleteArchivedLearner(id: string): boolean {
  const all = readArchive();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  writeArchive(filtered);
  emitArchiveUpdated();
  return true;
}

/**
 * Search the archive. Matches against name, admission number, certificate
 * number, and destination school. Case-insensitive.
 */
export function searchArchive(
  query: string
): TransferredLearnerArchive[] {
  const all = getArchive();
  const q = String(query || '').trim().toLowerCase();
  if (!q) return all;
  return all.filter((r) =>
    [
      r.name,
      r.admNo,
      r.certificateNumber,
      r.destinationSchool,
      r.guardian,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Filter the archive by transfer year. Pass `null` to skip. */
export function filterArchiveByYear(
  year: number | null
): TransferredLearnerArchive[] {
  const all = getArchive();
  if (year === null) return all;
  return all.filter((r) => r.transferYear === year);
}

/** Distinct transfer years in the archive, newest first. */
export function getArchiveYears(): number[] {
  const years = new Set<number>();
  readArchive().forEach((r) => years.add(r.transferYear));
  return Array.from(years).sort((a, b) => b - a);
}

/** Total number of archived transfers (used for the sidebar badge). */
export function getArchiveCount(): number {
  return readArchive().length;
}

/**
 * Restore a learner to the active roster.
 *
 * Writes the learner back into `school_learners_data` with
 * `status: 'Active'` so they reappear in attendance, marks, and fee
 * rosters. By default the archive entry is preserved (audit history
 * remains intact); pass `{ deleteArchiveEntry: true }` to also remove
 * the archived record.
 *
 * Emits both `learners_data_updated` and `archive_updated` events on
 * success so the Learners table AND the Archive page reflect the
 * restore immediately.
 */
export interface RestoreOptions {
  /**
   * When true (the default), permanently removes the archive entry so the
   * learner does not reappear in the archive list after a page refresh or a
   * cross-tab storage sync. Set to false only if the archive row must be
   * preserved for audit purposes — in that case the caller is responsible for
   * keeping the UI in sync with the storage state.
   */
  deleteArchiveEntry?: boolean;
}

export interface RestoredLearner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
  email?: string;
  dob?: string;
  dateOfAdmission?: string;
  birthCertificateNo?: string;
  /** Canonical active status. Must be the exact string 'Active' (case-sensitive)
   *  so that roster filters using `status === 'Active'` work correctly. */
  status: 'Active';
  restoredAt: string;
}

/**
 * Restore multiple learners to the active roster in a single batch.
 *
 * Returns an array of successfully restored learners and a list of
 * IDs that failed to restore (e.g. not found in archive).
 */
export interface BatchRestoreResult {
  restored: RestoredLearner[];
  failed: { id: string; error: string }[];
}

export function batchRestoreLearnersToActiveRoster(
  ids: string[],
  targetGrade?: string,
  targetStream?: string,
  options: RestoreOptions = { deleteArchiveEntry: true }
): BatchRestoreResult {
  const result: BatchRestoreResult = { restored: [], failed: [] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return result;
  }

  for (const id of ids) {
    const restored = restoreLearnerToActiveRoster(id, targetGrade, targetStream, options);
    if (restored) {
      result.restored.push(restored);
    } else {
      result.failed.push({ id, error: 'Learner not found in archive or restore failed.' });
    }
  }

  return result;
}

export function restoreLearnerToActiveRoster(
  id: string,
  targetGrade?: string,
  targetStream?: string,
  options: RestoreOptions = { deleteArchiveEntry: true }
): RestoredLearner | null {
  const record = getArchivedLearner(id);
  if (!record) return null;

  // Allow the caller to specify the grade/stream to restore to.
  // If not provided, defaults to the last known grade/stream from the archive.
  const restoredGrade = targetGrade ?? record.grade;
  const restoredStream = targetStream ?? record.stream;

  const restored: RestoredLearner = {
    id: record.id,
    admNo: record.admNo,
    name: record.name,
    grade: restoredGrade,
    stream: restoredStream,
    gender: record.gender,
    guardian: record.guardian,
    phone: record.phone,
    email: record.email,
    dob: record.dob,
    dateOfAdmission: record.dateOfAdmission,
    birthCertificateNo: record.birthCertificateNo,
    status: 'Active',
    restoredAt: new Date().toISOString(),
  };

  // Push to the active roster, overwriting any existing entry (including one
  // that may have status === 'TRANSFERRED' from a previous transfer-out).
  try {
    const raw = window.localStorage.getItem('school_learners_data');
    const learners: RestoredLearner[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(learners)) {
      throw new Error('Active roster is not an array');
    }
    const idx = learners.findIndex((l) => l.id === id);
    if (idx >= 0) {
      learners[idx] = { ...restored };
    } else {
      learners.push({ ...restored });
    }
    window.localStorage.setItem(
      'school_learners_data',
      JSON.stringify(learners)
    );
  } catch (err) {
    console.error('[archiveStorage] Failed to push restored learner:', err);
    return null;
  }

  // ── Archive cleanup ──────────────────────────────────────────────────────
  //
  // By default (deleteArchiveEntry: true) the archive row is PERMANENTLY
  // REMOVED so it will NOT bounce back into the archive list on any future
  // load() call (page refresh, cross-tab storage sync, etc.).
  //
  // The archive entry is deleted BEFORE any success is returned to prevent
  // a race condition where a concurrent storage event could re-fire load()
  // and re-populate the table before the component's setRecords runs.
  if (options.deleteArchiveEntry) {
    deleteArchivedLearner(id);
  } else {
    // Only mark the audit trail — caller is responsible for keeping the
    // component state in sync since the row stays in localStorage.
    const all = readArchive();
    const idx = all.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const existing = all[idx];
      const audit: ArchiveAuditMetadata = {
        ...existing.audit,
        notes:
          (existing.audit?.notes ?? '') +
          ` [Restored to active roster on ${new Date().toISOString()}]`,
      };
      all[idx] = { ...existing, audit };
      writeArchive(all);
    }
  }

  // Notify listeners on BOTH ends: the active roster changed (restore
  // happened) AND the archive changed (row was deleted). Without these
  // emissions, the Learners page and Archive page would still show stale
  // state until the user manually refreshed.
  emitLearnersUpdated();
  emitArchiveUpdated();

  return restored;
}