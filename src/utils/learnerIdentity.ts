/**
 * Learner Identity & Dedup Utility
 * 
 * Provides consistent normalization and deduplication of learner records
 * keyed by Admission Number + Assessment Number (and Birth Certificate Number).
 * 
 * Invariants:
 * - Two learners are considered the same if they share the same admissionNo
 *   OR the same assessmentNo (or birthCertNo).
 * - On duplicate detection, the existing record is UPDATED (upsert) rather
 *   than creating a duplicate row.
 * - All identity lookups are case-insensitive and whitespace-normalized.
 */

// ---------- Normalization helpers ----------

/**
 * Trim and uppercase a string; return '' if null/undefined/blank.
 */
export const normalizeId = (value: string | null | undefined): string => {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
};

/**
 * Extract the admission number from a learner record, checking all possible field names.
 * Normalized (trimmed, uppercased) for consistent comparison.
 */
export const getLearnerAdmissionNo = (l: any): string => {
  if (!l) return '';
  return normalizeId(
    l.admissionNo ||
    l.admissionNumber ||
    l.admNo ||
    l.admission_number ||
    ''
  );
};

/**
 * Extract the assessment number from a learner record, checking all possible field names.
 * Normalized (trimmed, uppercased) for consistent comparison.
 * Falls back to birth certificate number if no assessment number found.
 */
export const getLearnerAssessmentNo = (l: any): string => {
  if (!l) return '';
  return normalizeId(
    l.assessmentNo ||
    l.assessmentNumber ||
    l.birthCertNo ||
    l.birthCertificateNo ||
    l.birth_cert_no ||
    ''
  );
};

/**
 * Extract the birth certificate number from a learner record.
 */
export const getLearnerBirthCertNo = (l: any): string => {
  if (!l) return '';
  return normalizeId(
    l.birthCertNo ||
    l.birthCertificateNo ||
    l.birth_cert_no ||
    ''
  );
};

/**
 * Return all identity keys for a learner record as a normalized tuple.
 * Used for matching and deduplication.
 */
export const getLearnerIdentityKeys = (l: any): [admissionNo: string, assessmentNo: string, birthCertNo: string] => {
  return [
    getLearnerAdmissionNo(l),
    getLearnerAssessmentNo(l),
    getLearnerBirthCertNo(l)
  ];
};

// ---------- Matching / Lookup helpers ----------

/**
 * Find the index of the first learner in `list` whose admission number matches `targetAdmNo`.
 * Returns -1 if not found.
 */
export const findLearnerByAdmissionNo = (list: any[], targetAdmNo: string): number => {
  const target = normalizeId(targetAdmNo);
  for (let i = 0; i < (list || []).length; i++) {
    if (getLearnerAdmissionNo(list[i]) === target) return i;
  }
  return -1;
};

/**
 * Find the index of the first learner in `list` whose assessment number matches `targetAssNo`.
 * Returns -1 if not found.
 */
export const findLearnerByAssessmentNo = (list: any[], targetAssNo: string): number => {
  const target = normalizeId(targetAssNo);
  for (let i = 0; i < (list || []).length; i++) {
    if (getLearnerAssessmentNo(list[i]) === target) return i;
  }
  return -1;
};

/**
 * Find the index of the first learner in `list` that matches either the admission number
 * OR the assessment number (or birth certificate number). Returns -1 if not found.
 * This is the primary deduplication lookup.
 */
export const findLearnerByIdentity = (list: any[], admissionNo?: string, assessmentNo?: string): number => {
  // If both admissionNo and assessmentNo are provided, match either
  if (admissionNo != null || assessmentNo != null) {
    const targetAdm = normalizeId(admissionNo);
    const targetAss = normalizeId(assessmentNo);

    for (let i = 0; i < (list || []).length; i++) {
      const l = list[i];
      const lAdm = getLearnerAdmissionNo(l);
      const lAss = getLearnerAssessmentNo(l);

      // Match if either admission or assessment number matches
      if (lAdm === targetAdm || lAss === targetAss) return i;
    }
  }
  return -1;
};

// ---------- Upsert / Merge helpers ----------

/**
 * Upsert a learner into a list. If a learner with the same admission number or
 * assessment number already exists, the existing record is updated with the new
 * data (merging fields). If no duplicate is found, the new learner is appended.
 * 
 * Returns: { list, merged, existingIndex }
 *   - list: the (possibly modified) learner list
 *   - merged: true if an existing record was updated
 *   - existingIndex: the index of the existing record (or -1 if new record was appended)
 */
export const upsertLearnerIntoList = (
  list: any[],
  incoming: any
): { list: any[]; merged: boolean; existingIndex: number } => {
  if (!incoming || !list) return { list: [...(list || [])], merged: false, existingIndex: -1 };

  const incomingAdm = getLearnerAdmissionNo(incoming);
  const incomingAss = getLearnerAssessmentNo(incoming);

  // 1. Try to find existing learner by admission number or assessment number
  const existingIdx = findLearnerByIdentity(list, incomingAdm, incomingAss);

  if (existingIdx >= 0) {
      // 2. Upsert: merge incoming data into existing record
      const existing = { ...list[existingIdx] };
      const merged = { ...existing, ...incoming };
  
      // Preserve the existing id/admissionNo/assessmentNo if they exist
      if (existing.id) merged.id = existing.id;
      const existingAdm = getLearnerAdmissionNo(existing);
      const existingAss = getLearnerAssessmentNo(existing);
      if (existingAdm) merged.admissionNo = existingAdm;
      if (existingAss) merged.assessmentNo = existingAss;
  
      const newList = [...list];
      newList[existingIdx] = merged;
      return { list: newList, merged: true, existingIndex: existingIdx };
    }

  // 3. No duplicate found — append the new learner
  const newList = [...list, incoming];
  return { list: newList, merged: false, existingIndex: -1 };
};

/**
 * Check whether a learner with the given admission number or assessment number
 * already exists in the list. Used for validation before registration.
 */
export const isDuplicateLearner = (
  list: any[],
  admissionNo?: string,
  assessmentNo?: string
): boolean => {
  if (!list || list.length === 0) return false;
  return findLearnerByIdentity(list, admissionNo, assessmentNo) >= 0;
};

// ---------- Strict Assessment / Birth Certificate duplicate check ----------

export interface AssessmentDuplicateMatch {
  /** The existing learner record that already owns this number. */
  learner: any;
  /** Which field(s) on the existing record collided. */
  matchedFields: string[];
}

/**
 * Strictly find an existing learner whose Assessment / Birth Certificate number
 * collides with the submitted one, on a DIFFERENT record (excluding `excludeId`).
 *
 * The submitted number is compared against the existing record's `assessmentNo`,
 * `assessmentNumber`, `birthCertNo`, and `birthCertificateNo` fields.
 * Comparison is case-insensitive and whitespace-normalized.
 *
 * Returns the match (record + collided fields) or null when the number is free.
 */
export const findAssessmentBirthCertDuplicate = (
  list: any[],
  submittedNo: string,
  excludeId?: string | null
): AssessmentDuplicateMatch | null => {
  const target = normalizeId(submittedNo);
  if (!target) return null;

  for (const l of list || []) {
    if (!l) continue;

    // Skip the record currently being edited (self-match is allowed on update).
    if (excludeId != null && excludeId !== '') {
      const recId = String(l.id || l._id || '').trim();
      if (recId && recId === String(excludeId).trim()) continue;
    }

    const matchedFields: string[] = [];
    const candidates: Array<[string, string]> = [
      ['assessmentNo', normalizeId(l.assessmentNo)],
      ['assessmentNumber', normalizeId(l.assessmentNumber)],
      ['birthCertNo', normalizeId(l.birthCertNo)],
      ['birthCertificateNo', normalizeId(l.birthCertificateNo)],
    ];
    for (const [field, value] of candidates) {
      if (value && value === target) matchedFields.push(field);
    }

    if (matchedFields.length > 0) {
      return { learner: l, matchedFields };
    }
  }
  return null;
};

/**
 * Build the user-facing error message for a duplicate Assessment / Birth
 * Certificate number, e.g.
 * "Error: Assessment / Birth Certificate number already registered under Jane Doe (MUN-1234)."
 */
export const formatAssessmentDuplicateError = (match: AssessmentDuplicateMatch): string => {
  const l = match.learner || {};
  const name = String(l.fullName || l.name || l.studentName || 'Unknown Learner').trim();
  const admNo = String(
    l.admissionNo || l.admissionNumber || l.admNo || l.id || 'N/A'
  ).trim();
  return `Error: Assessment / Birth Certificate number already registered under ${name} (${admNo})`;
};

/**
 * Remove duplicate learners from a list, keeping only the first occurrence
 * keyed by admission number or assessment number. Returns a cleaned list.
 */
export const dedupeLearnersByIdentity = (list: any[]): any[] => {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const l of list || []) {
    if (!l) continue;

    const [adm, ass, bc] = getLearnerIdentityKeys(l);
    const key = `${adm}|${ass}|${bc}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(l);
    }
    // else: duplicate — skip (keep first occurrence)
  }

  return unique;
};

/**
 * Safely format a learner record, normalizing all identity fields.
 * Returns a clean Learner-like object with consistent field names.
 */
export const formatLearnerIdentity = (l: any): any => ({
  id: String(l.id || getLearnerAdmissionNo(l) || `lrn_${Math.random().toString(36).slice(2, 9)}`),
  admissionNo: getLearnerAdmissionNo(l),
  assessmentNo: getLearnerAssessmentNo(l),
  birthCertNo: getLearnerBirthCertNo(l),
  fullName: String(l.fullName || l.name || l.studentName || '').trim(),
  grade: String(l.grade || l.gradeLevel || '').trim(),
  stream: String(l.stream || '').trim(),
  gender: String(l.gender || '').trim(),
});