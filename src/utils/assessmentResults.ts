/**
 * Assessment Results Storage Utility
 * Persists assessment results to localStorage, linked to student/class/subject/term/academicYear.
 * Mirrors the shape of the canonical `AssessmentResult` interface in `@/types/questions`.
 */

import type { AssessmentResult, Assessment, StudentResponse } from "@/types/questions";
import { notifyDataChanged } from "@/utils/storage";

/** Master storage key for all assessment results */
export const ASSESSMENT_RESULTS_STORAGE_KEY = "munyaka_assessment_results";

/** Cross-tab storage event key */
export const ASSESSMENT_RESULTS_CHANGE_KEY = "munyaka_assessment_results_changed";

// ─── Persistence helpers ──────────────────────────────────────────────────────

/** Retrieve all assessment results from localStorage. Returns [] if empty. */
export function getAllAssessmentResults(): AssessmentResult[] {
  try {
    const raw = localStorage.getItem(ASSESSMENT_RESULTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save all assessment results (full overwrite). */
export function saveAllAssessmentResults(results: AssessmentResult[]): void {
  localStorage.setItem(ASSESSMENT_RESULTS_STORAGE_KEY, JSON.stringify(results));
  notifyDataChanged(ASSESSMENT_RESULTS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ASSESSMENT_RESULTS_CHANGE_KEY));
}

// ─── Per-assessment-instance helpers ────────────────────────────────────────

/** Unique composite key for a student's result record: assessment × student */
export function resultRecordKey(assessmentId: string, studentId: string): string {
  return `${assessmentId}__${studentId}`;
}

/**
 * Compute a CBC grade level from percentage score.
 * Competency-Based Assessment uses: EE, ME, AE, BE
 *   EE – Exceeds Expectations
 *   ME – Meets Expectations
 *   AE – Approaches Expectations
 *   BE – Below Expectations
 */
export function computeGradeLevel(percentage: number): AssessmentResult["gradeLevel"] {
  if (percentage >= 80) return "EE";
  if (percentage >= 60) return "ME";
  if (percentage >= 40) return "AE";
  return "BE";
}

// ─── Read helpers ────────────────────────────────────────────────────────────

/**
 * Get all results for a specific student across all assessments.
 */
export function getResultsByStudent(studentId: string): AssessmentResult[] {
  return getAllAssessmentResults().filter((r) => r.studentId === studentId);
}

/**
 * Get all results for a specific class+stream within an academic year+term.
 */
export function getResultsByClass(
  academicYear: string,
  term: string,
  classId: string,
  stream?: string
): AssessmentResult[] {
  return getAllAssessmentResults().filter(
    (r) =>
      r.academicYear === academicYear &&
      r.term === term &&
      r.classId === classId &&
      (stream ? r.stream === stream : true)
  );
}

/**
 * Get all results for a specific subject within an academic year+term.
 */
export function getResultsBySubject(
  academicYear: string,
  term: string,
  subjectId: string
): AssessmentResult[] {
  return getAllAssessmentResults().filter(
    (r) =>
      r.academicYear === academicYear &&
      r.term === term &&
      r.subjectId === subjectId
  );
}

/**
 * Get the single result record for a student + assessment combo.
 * Returns undefined if not yet recorded.
 */
export function getResultByAssessmentAndStudent(
  assessmentId: string,
  studentId: string
): AssessmentResult | undefined {
  const results = getAllAssessmentResults();
  return results.find(
    (r) => r.assessmentId === assessmentId && r.studentId === studentId
  );
}

// ─── Write helpers ───────────────────────────────────────────────────────────

/**
 * Save (upsert) an AssessmentResult record.
 * If a result already exists for the same assessmentId + studentId, it is replaced.
 */
export function saveAssessmentResult(result: AssessmentResult): void {
  const all = getAllAssessmentResults();
  const existingIndex = all.findIndex(
    (r) => r.assessmentId === result.assessmentId && r.studentId === result.studentId
  );

  if (existingIndex >= 0) {
    all[existingIndex] = result;
  } else {
    all.push(result);
  }

  saveAllAssessmentResults(all);
}

/**
 * Build and persist an AssessmentResult from a completed StudentSubmission.
 * Call this after the student submits their test.
 *
 * @param assessment  – The assessment definition loaded in StudentAssessment
 * @param submission  – The student's submission data
 * @param studentInfo – Student metadata (id, name, grade, stream)
 * @param metadata    – Academic context (academicYear, term, examType)
 */
export function buildAndSaveResult(
  assessment: Assessment,
  submission: {
    responses: Record<string, StudentResponse>;
    startedAt: string;
    submittedAt: string;
    isComplete: boolean;
  },
  studentInfo: {
    studentId: string;
    studentName?: string;
    classId: string;
    className: string;
    stream?: string;
  },
  metadata: {
    academicYear: string;
    term: string;
    examType?: string;
    subjectId?: string;
    subjectName?: string;
    durationSeconds?: number;
  }
): AssessmentResult {
  // Calculate score
  let totalScore = 0;
  const responseList = Object.values(submission.responses);

  responseList.forEach((resp) => {
    if (resp.selectedOptionId) {
      // MCQ — find the question and check correct answer
      const question = assessment.questions.find((q) => q.id === resp.questionId);
      if (question?.correctOptionId === resp.selectedOptionId) {
        totalScore += question.points;
      }
    } else if (resp.answerText && resp.answerText.trim() !== "") {
      // Structured — award full marks for any non-empty answer
      const question = assessment.questions.find((q) => q.id === resp.questionId);
      if (question) totalScore += question.points;
    }
  });

  const maxScore = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const result: AssessmentResult = {
    id: `result_${assessment.id}_${studentInfo.studentId}_${Date.now()}`,
    studentId: studentInfo.studentId,
    studentName: studentInfo.studentName,
    classId: studentInfo.classId,
    className: studentInfo.className,
    stream: studentInfo.stream,
    subjectId: metadata.subjectId || assessment.subject,
    subjectName: metadata.subjectName || assessment.subject,
    academicYear: metadata.academicYear,
    term: metadata.term,
    examType: metadata.examType || assessment.category || "Formative Assessment",
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    totalScore,
    maxScore,
    percentage,
    responses: responseList,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt || new Date().toISOString(),
    durationSeconds: metadata.durationSeconds,
    isComplete: submission.isComplete,
    gradeLevel: computeGradeLevel(percentage),
  };

  saveAssessmentResult(result);
  return result;
}

// ─── Teacher score entry helper ───────────────────────────────────────────────

/**
 * Build and persist an AssessmentResult from a teacher-inputted mark.
 * Used when a teacher enters numeric scores in Assessments.tsx.
 *
 * @param score  – Numeric score entered by the teacher (0-100)
 * @param studentInfo – Student metadata
 * @param metadata    – Academic context + assessment info
 */
export function saveTeacherInputResult(
  score: number,
  studentInfo: {
    studentId: string;
    studentName?: string;
    classId: string;
    className: string;
    stream?: string;
  },
  metadata: {
    academicYear: string;
    term: string;
    examType?: string;
    subjectId: string;
    subjectName: string;
    assessmentTitle?: string;
    maxScore?: number;
  }
): AssessmentResult {
  const maxScore = metadata.maxScore ?? 100;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const assessmentId = `teacher_${metadata.subjectId}_${metadata.academicYear}_${metadata.term}_${metadata.examType || "formative"}`;

  const result: AssessmentResult = {
    id: `result_${assessmentId}_${studentInfo.studentId}_${Date.now()}`,
    studentId: studentInfo.studentId,
    studentName: studentInfo.studentName,
    classId: studentInfo.classId,
    className: studentInfo.className,
    stream: studentInfo.stream,
    subjectId: metadata.subjectId,
    subjectName: metadata.subjectName,
    academicYear: metadata.academicYear,
    term: metadata.term,
    examType: metadata.examType || "Formative Assessment",
    assessmentId,
    assessmentTitle: metadata.assessmentTitle || `${metadata.subjectName} – ${metadata.examType || "Assessment"}`,
    totalScore: score,
    maxScore,
    percentage,
    responses: [],
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    isComplete: true,
    gradeLevel: computeGradeLevel(percentage),
  };

  saveAssessmentResult(result);
  return result;
}

// ─── Export for CSV / analysis ───────────────────────────────────────────────

/**
 * Get all results for a given academicYear + term combination,
 * optionally filtered by grade/classId.
 */
export function getResultsForReport(
  academicYear: string,
  term: string,
  classId?: string
): AssessmentResult[] {
  return getAllAssessmentResults().filter(
    (r) =>
      r.academicYear === academicYear &&
      r.term === term &&
      (classId ? r.classId === classId : true)
  );
}
