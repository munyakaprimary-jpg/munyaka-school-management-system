/**
 * Shape of a learner row as stored in `school_learners_data`.
 *
 * This type is the single source of truth for the active learner
 * directory — both the Students page table and the various per-class
 * roster views read against this contract.
 */
export interface Learner {
  id: string;
  admNo: string;
  /** Alias for admNo — used by some result analysis views. */
  admissionNumber?: string;
  /** School-issued admission number (distinct from the assessment / NEMIS number). */
  admissionNo?: string;
  name: string;
  grade: string;
  stream: string;
  gender: string;
  guardian: string;
  phone: string;
  birthCertificateNo?: string;

  /**
   * Lifecycle status:
   *   • Active        — currently enrolled and on the roster
   *   • TRANSFERRED   — moved to the Transferred Learners Archive
   *   • Graduated     — completed final grade
   *   • Suspended     — temporarily off the roster
   */
  status?: string;

  /** ISO date string. Optional so legacy rows still load. */
  dob?: string;
  /** ISO date string. */
  dateOfAdmission?: string;
  /** NEMIS / UPI / Assessment number — defaults to `admNo`. */
  nemisUpi?: string;
  /** Previous school captured at registration or transfer-in. */
  previousSchool?: string;
  /** Previous school's clearance / transfer reference number. */
  previousSchoolClearanceRef?: string;
  /** Free-form reason captured at registration or transfer-in. */
  transferReason?: string;

  // ── Optional enrichment fields used by dashboard/analysis pages ──
  email?: string;
  health?: string;
  needs?: string;
  feeBalance?: number;
  /** Total invoiced / billed for the current term — 0 until a fee structure is configured. */
  totalBilled?: number;
  /** Total amount paid by the learner across all recorded transactions. */
  totalPaid?: number;
  /** Remaining balance: totalBilled - totalPaid. Clamped to ≥ 0. */
  balance?: number;
  /** History of individual fee payments. */
  feeHistory?: unknown[];
  coCurricularActivities?: string;
  examType?: string;
  /** Optional assessment / notes field. */
  assessment?: string;
  /**
   * KNEC / NEMIS / UPI assessment number. Distinct from `admNo`
   * (the school-issued admission number) and from `nemisUpi`.
   * Empty string means the field has not been captured yet.
   */
  assessmentNo?: string;
}
