/**
 * Type definitions for the Transferred Learners Archive.
 *
 * When a learner is transferred out of the active roster, the system
 * captures a full snapshot of the student together with the transfer
 * metadata so the school can audit the exit, re-issue the clearance
 * certificate, and re-enrol the learner later if needed.
 */

export type ArchiveTransferReason =
  | 'Parent Relocation'
  | 'Family Migration'
  | 'Transfer to Another School'
  | 'Medical Reasons'
  | 'Disciplinary'
  | 'Other';

export interface ArchiveAuditMetadata {
  /** Display name of the admin who executed the transfer. */
  executedBy: string;
  /** ISO timestamp when the transfer was authorised. */
  executedAt: string;
  /** The method used to authorise the transfer. */
  authorizedVia: 'admin_password' | 'superadmin' | 'import';
  /** Free-form audit notes (e.g. identity verification method). */
  notes?: string;
}

export interface TransferredLearnerArchive {
  // ── Stable identity (mirrors the active roster) ────────────────────────
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
  birthCertificateNo?: string;
  dateOfAdmission?: string;

  // ── Transfer exit details ──────────────────────────────────────────────
  transferDate: string;          // ISO date (YYYY-MM-DD)
  transferYear: number;          // 4-digit calendar year (for filtering)
  destinationSchool: string;
  reason: ArchiveTransferReason | string;
  reasonNotes?: string;
  headteacherRemarks: string;
  coCurricularActivities?: string;

  // ── Certificate & financial state ──────────────────────────────────────
  certificateNumber: string;     // TRF-YYYY-####
  feeBalanceAtExit: number;
  isFeeCleared: boolean;

  // ── Audit trail ────────────────────────────────────────────────────────
  audit: ArchiveAuditMetadata;
}
