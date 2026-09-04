/**
 * Persistent storage schema for marked student assessments.
 *
 * Once a teacher finishes grading a student's submission (or an assessment
 * is auto-graded and locked), we snapshot the final state — answers,
 * awarded marks, optional per-question teacher comments — and persist it
 * under the `marked_student_submissions` localStorage key. The dedicated
 * "Marked Scripts" management view reads from this list to render
 * per-student tables and printable PDF reports.
 *
 * Why a separate key?
 *  - `student_submissions` is the live, in-flight attempt ledger used by
 *    the grading dashboard. It can be overwritten as grading progresses.
 *  - `marked_student_submissions` is the *frozen* end-of-flow record. It
 *    is only ever appended to (or updated when re-saving the same
 *    (examId, studentId) pair), so the marked-scripts list and any PDF
 *    exports always reflect a known, stable snapshot.
 */

/**
 * The canonical, persisted shape of a fully-marked student submission.
 *
 * `answers` / `marks` / `feedback` are keyed by `questionId` so a
 * downstream view can render per-question breakdowns without having to
 * re-derive them from the live student_submissions map.
 */
export interface StudentSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentName: string;
  admissionNo: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  /** questionId -> student answer (string for structured, option id for MCQ, etc.) */
  answers: Record<string, any>;
  /** questionId -> awarded score (out of question.points) */
  marks: Record<string, number>;
  /** questionId -> teacher comment (optional) */
  feedback?: Record<string, string>;
  /** Class / grade the student belongs to (e.g. "Grade 4"). Optional but
   *  preserved when present so downstream filters can re-apply class
   *  filtering without re-querying the student roster. */
  grade?: string;
  /** Stream / section within the class (e.g. "East"). */
  stream?: string;
  /** CBC performance level (EE / ME / AE / BE). Calculated from percentage. */
  level?: "EE" | "ME" | "AE" | "BE";
  /** Submission status. Auto-submissions are always "completed". */
  status?: "completed" | "pending";
  /** Flag: whether any structured question is still awaiting teacher grading.
   *  Auto-submissions force this to `false`. */
  hasPendingStructured?: boolean;
  /** Flag: whether the submission requires any manual teacher grading. */
  requiresManualGrading?: boolean;
  /** Per-question grading breakdown (drives MarkedScripts list / PDF). */
  gradedDetails?: Array<{
    questionId: string;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    earnedPoints: number;
    possiblePoints: number;
    isGraded: boolean;
  }>;
}

/** LocalStorage key for the marked-submissions ledger. */
export const MARKED_SUBMISSIONS_KEY = "marked_student_submissions";

/**
 * Read the full marked-submissions ledger from localStorage.
 * Returns an empty object if the key is missing or unparseable.
 */
export function readMarkedSubmissions(): Record<string, StudentSubmission> {
  try {
    const raw = localStorage.getItem(MARKED_SUBMISSIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, StudentSubmission>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Persist a single marked submission, merging it into the existing ledger
 * by `id`. If a record with the same id already exists, it is replaced
 * (preserves idempotency for repeat saves of the same submission).
 *
 * Emits the `submissions_updated` window event so any subscribed views
 * refresh automatically.
 */
export function saveMarkedSubmission(submission: StudentSubmission): boolean {
  try {
    const ledger = readMarkedSubmissions();
    ledger[submission.id] = submission;
    localStorage.setItem(MARKED_SUBMISSIONS_KEY, JSON.stringify(ledger));
    if (typeof window !== "undefined") {
      // Notify same-tab listeners
      window.dispatchEvent(new Event("submissions_updated"));
      // Notify cross-tab listeners via the storage event
      window.dispatchEvent(new StorageEvent("storage", { key: MARKED_SUBMISSIONS_KEY }));
    }
    return true;
  } catch (err) {
    console.error("[markedSubmissions] Failed to save submission:", err);
    return false;
  }
}

/**
 * Persist multiple marked submissions in a single transaction.
 * Same merge semantics as `saveMarkedSubmission` but applied across a list.
 */
export function saveMarkedSubmissions(submissions: StudentSubmission[]): boolean {
  try {
    const ledger = readMarkedSubmissions();
    submissions.forEach((s) => {
      ledger[s.id] = s;
    });
    localStorage.setItem(MARKED_SUBMISSIONS_KEY, JSON.stringify(ledger));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("submissions_updated"));
    }
    return true;
  } catch (err) {
    console.error("[markedSubmissions] Failed to save submissions:", err);
    return false;
  }
}

/**
 * Delete a marked submission by id. Returns true if a record was removed.
 */
export function deleteMarkedSubmission(id: string): boolean {
  try {
    const ledger = readMarkedSubmissions();
    if (!(id in ledger)) return false;
    delete ledger[id];
    localStorage.setItem(MARKED_SUBMISSIONS_KEY, JSON.stringify(ledger));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("submissions_updated"));
    }
    return true;
  } catch (err) {
    console.error("[markedSubmissions] Failed to delete submission:", err);
    return false;
  }
}

/**
 * Return all marked submissions as a flat array, sorted newest-first by
 * `submittedAt`.
 */
export function listMarkedSubmissions(): StudentSubmission[] {
  const ledger = readMarkedSubmissions();
  return Object.values(ledger).sort((a, b) => {
    const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return tb - ta;
  });
}
