/**
 * Transferred Learners Archive
 * ─────────────────────────────
 *
 * Persists the full transfer record (learner snapshot + transfer metadata)
 * so the school can audit historical transfers and re-issue certificates
 * long after the student has left the active roster.
 *
 * Storage model:
 *   key:  munyaka_transferred_learners
 *   shape: TransferredLearnerRecord[]
 *
 * The active roster (school_learners_data) is kept untouched — it is
 * filtered by status === 'Active' in the consumers. The archive holds the
 * full historical record keyed by the same `id`, so cross-references
 * remain stable.
 */

export type TransferExitReason =
  | 'Parent Relocation'
  | 'Family Migration'
  | 'Transfer to Another School'
  | 'Medical Reasons'
  | 'Other';

export interface TransferAuditMetadata {
  /** The admin's name/email who executed the transfer */
  executedBy: string;
  /** ISO timestamp when the transfer was executed */
  executedAt: string;
  /** Original admin password hash (already verified at execution) */
  authorizedVia: 'admin_password' | 'superadmin';
  /** Free-form audit notes (e.g. method of identity verification) */
  notes?: string;
}

export interface TransferredLearnerRecord {
  // ── Snapshot of learner at the time of transfer ───────────────────────
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
  feeBalance: number;
  coCurricularActivities?: string;
  birthCertificateNo?: string;

  // ── Transfer metadata ─────────────────────────────────────────────────
  status: 'TRANSFERRED';
  transferDate: string;             // ISO date (YYYY-MM-DD)
  transferYear: number;             // 4-digit year, for filtering
  destinationSchool: string;
  reason: string;
  headteacherRemarks: string;
  certificateNumber: string;        // TRF-YYYY-####
  isFeeCleared: boolean;
  audit: TransferAuditMetadata;
}

const ARCHIVE_KEY = 'munyaka_transferred_learners';

// ──────────────────────────────────────────────────────────────────────────
//  Internal helpers
// ──────────────────────────────────────────────────────────────────────────

function readArchive(): TransferredLearnerRecord[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TransferredLearnerRecord[]) : [];
  } catch {
    return [];
  }
}

function writeArchive(records: TransferredLearnerRecord[]): void {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('[transferArchive] Could not persist archive:', err);
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────────────────

/**
 * Get the full archive (most recent transfer first).
 */
export function getArchivedLearners(): TransferredLearnerRecord[] {
  return readArchive().sort((a, b) => {
    // Most recent transferDate first; fall back to audit.executedAt
    const aTs = a.transferDate || a.audit.executedAt;
    const bTs = b.transferDate || b.audit.executedAt;
    return new Date(bTs).getTime() - new Date(aTs).getTime();
  });
}

/**
 * Find a single archived learner by ID.
 */
export function getArchivedLearner(id: string): TransferredLearnerRecord | null {
  return readArchive().find((r) => r.id === id) ?? null;
}

/**
 * Persist a transfer record to the archive. If a record with the same
 * `id` already exists, it is overwritten (re-execution of the same
 * transfer is a no-op).
 */
export function archiveLearner(
  record: Omit<TransferredLearnerRecord, 'status' | 'transferYear'>
): TransferredLearnerRecord {
  const fullRecord: TransferredLearnerRecord = {
    ...record,
    status: 'TRANSFERRED',
    transferYear: new Date(record.transferDate || record.audit.executedAt).getFullYear(),
  };

  const archive = readArchive();
  const existingIndex = archive.findIndex((r) => r.id === fullRecord.id);
  if (existingIndex >= 0) {
    archive[existingIndex] = fullRecord;
  } else {
    archive.push(fullRecord);
  }
  writeArchive(archive);

  return fullRecord;
}

/**
 * Remove a learner from the archive. Used internally by the
 * restore-to-active-roster flow.
 *
 * Returns the removed record, or `null` if not found.
 */
export function removeArchivedLearner(id: string): TransferredLearnerRecord | null {
  const archive = readArchive();
  const index = archive.findIndex((r) => r.id === id);
  if (index < 0) return null;
  const [removed] = archive.splice(index, 1);
  writeArchive(archive);
  return removed;
}

/**
 * Search the archive by name, admission number, or certificate number.
 */
export function searchArchive(query: string): TransferredLearnerRecord[] {
  if (!query.trim()) return getArchivedLearners();
  const q = query.trim().toLowerCase();
  return getArchivedLearners().filter((r) => {
    return (
      r.name?.toLowerCase().includes(q) ||
      r.admNo?.toLowerCase().includes(q) ||
      r.certificateNumber?.toLowerCase().includes(q) ||
      r.destinationSchool?.toLowerCase().includes(q)
    );
  });
}

/**
 * Filter the archive by transfer year. Pass `null` to skip the year filter.
 */
export function filterArchiveByYear(year: number | null): TransferredLearnerRecord[] {
  const all = getArchivedLearners();
  if (year === null) return all;
  return all.filter((r) => r.transferYear === year);
}

/**
 * Restore a learner from the archive back to the active roster.
 *
 * Returns the rehydrated learner (without the transfer metadata) so the
 * caller can push it into the active `school_learners_data` storage.
 * The archive entry is left intact (audit history) but the learner gains
 * a `restoredAt` field. To actually delete the archive entry, pass
 * `{ deleteArchiveEntry: true }`.
 */
export interface RestoreOptions {
  /** When true, removes the learner from the archive after restoring. */
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
  /** 'Active' — re-enrolled status */
  status: 'Active';
  /** ISO timestamp of restoration */
  restoredAt: string;
}

export function restoreLearnerFromArchive(
  id: string,
  options: RestoreOptions = {}
): RestoredLearner | null {
  const record = getArchivedLearner(id);
  if (!record) return null;

  const restored: RestoredLearner = {
    id: record.id,
    admNo: record.admNo,
    name: record.name,
    grade: record.grade,
    stream: record.stream,
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

  if (options.deleteArchiveEntry) {
    removeArchivedLearner(id);
  } else {
    // Mark the archived record as restored but keep it for audit
    const archive = readArchive();
    const idx = archive.findIndex((r) => r.id === id);
    if (idx >= 0) {
      archive[idx] = {
        ...archive[idx],
        audit: {
          ...archive[idx].audit,
          notes:
            (archive[idx].audit.notes ?? '') +
            ` [Restored to active roster on ${new Date().toISOString()}]`,
        },
      };
      writeArchive(archive);
    }
  }

  return restored;
}

/**
 * Push a restored learner back into the active roster stored at
 * `school_learners_data`. If a learner with the same `id` already exists,
 * they are replaced (which is the correct behaviour for a re-enrolment).
 */
export function pushRestoredLearnerToActiveRoster(learner: RestoredLearner): boolean {
  try {
    const raw = localStorage.getItem('school_learners_data');
    const learners: any[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(learners)) return false;

    const existingIdx = learners.findIndex((l: any) => l.id === learner.id);
    if (existingIdx >= 0) {
      learners[existingIdx] = { ...learner };
    } else {
      learners.push({ ...learner });
    }
    localStorage.setItem('school_learners_data', JSON.stringify(learners));
    return true;
  } catch (err) {
    console.error('[transferArchive] Failed to push restored learner:', err);
    return false;
  }
}

/**
 * List all distinct transfer years in the archive, sorted descending.
 * Used to populate the year filter dropdown.
 */
export function getArchiveYears(): number[] {
  const years = new Set<number>();
  readArchive().forEach((r) => years.add(r.transferYear));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Total number of archived transfers. Used for the sidebar badge.
 */
export function getArchiveCount(): number {
  return readArchive().length;
}
