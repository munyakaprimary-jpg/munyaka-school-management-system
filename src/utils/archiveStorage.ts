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
  return record;
}

/** Delete a single archive entry (used by the restore flow). */
export function deleteArchivedLearner(id: string): boolean {
  const all = readArchive();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  writeArchive(filtered);
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
  const q = query.trim().toLowerCase();
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
 */
export interface RestoreOptions {
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
  status: 'Active';
  restoredAt: string;
}

export function restoreLearnerToActiveRoster(
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

  // Push to the active roster
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

  // Optionally remove from archive
  if (options.deleteArchiveEntry) {
    deleteArchivedLearner(id);
  } else {
    // Mark the audit trail but keep the row
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

  return restored;
}
