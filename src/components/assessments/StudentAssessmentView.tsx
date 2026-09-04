"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  FileQuestion,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import type {
  Assessment,
  StudentSubmission,
  StudentResponse,
  Question,
} from "@/types/questions";
import { LearnerIdentificationModal } from "./LearnerIdentificationModal";

const SUBMISSION_STORAGE_KEY_PREFIX = "submission";
const TIMER_TICK_MS = 1000;

/**
 * Strip answer keys (correctOptionId / modelAnswer / rubric) from questions
 * while the student is actively sitting for the assessment. These are kept
 * on the original assessment object for grading but never shown to the
 * student during the active attempt.
 */
function sanitizeQuestionsForAttempt(
  questions: Question[]
): Question[] {
  return questions.map((q) => {
    const sanitized: Question = { ...q };
    delete sanitized.correctOptionId;
    delete sanitized.modelAnswer;
    delete sanitized.rubric;
    return sanitized;
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface StudentAssessmentViewProps {
  /** The assessment to render. */
  assessment: Assessment;
  /** ID of the active student. */
  studentId: string;
  /** Optional student name for headers/logs. */
  studentName?: string;
  /** Called after a successful submission. */
  onSubmit?: (submission: StudentSubmission) => void;
  /** Custom storage key for this student's submission. */
  submissionKey?: string;
  /**
   * When true, the component skips the student-identification gate and loads
   * the pre-authenticated session directly (used when the parent page already
   * knows the student identity).
   */
  skipGate?: boolean;
  /**
   * Called when the user clicks "Back to All Exams" / the in-page back arrow.
   * Parent should reset any session flags and explicitly route back to the
   * exam listing (typically `/assessments/list`). Falls back to
   * `navigate(-1)` when omitted.
   */
  onBackToExams?: () => void;
}

interface QuestionGradingResult {
  questionId: string;
  type: Question["type"];
  correct: boolean;
  earnedPoints: number;
  maxPoints: number;
  userAnswer?: string;
  expectedAnswer?: string;
}

interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  /** Per-MCQ details (kept for the existing MCQ breakdown panel). */
  mcqResults: QuestionGradingResult[];
  /** Per-question details for ALL question types (drives the post-submit summary). */
  questionResults: QuestionGradingResult[];
}

const StudentAssessmentView: React.FC<StudentAssessmentViewProps> = ({
  assessment,
  studentId: initialStudentId,
  studentName: initialStudentName,
  onSubmit,
  submissionKey,
  skipGate = false,
  onBackToExams,
}) => {
  const navigate = useNavigate();

  // ── Back navigation helper ──────────────────────────────────────────────────
  // Cleans up the local session state and routes back to the exams listing.
  // When `onBackToExams` is provided the parent owns navigation; otherwise we
  // fall back to browser-history back.
  const handleBackToExams = useCallback(() => {
    // Clear the current student session so the next launch starts fresh
    try {
      localStorage.removeItem("current_student_session");
    } catch { /* ignore */ }

    if (onBackToExams) {
      onBackToExams();
    } else {
      navigate(-1);
    }
  }, [onBackToExams, navigate]);

  // ── Gate State ─────────────────────────────────────────────────────────────
  const [isGatePassed, setIsGatePassed] = useState(skipGate);
  const [lockedStudentId, setLockedStudentId] = useState(initialStudentId);
  const [lockedStudentName, setLockedStudentName] = useState(initialStudentName);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(
    skipGate ? new Date().toISOString() : null
  );

  // ── Fresh Attempt ID ───────────────────────────────────────────────────────
  // Generate a unique attempt ID per launch so prior submissions cannot
  // pre-fill or leak into this active test view.
  const attemptIdRef = useRef<string>(
    `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  // ── Sanitised Question Set ─────────────────────────────────────────────────
  // Strip answer keys while the student is actively sitting for the test.
  const sanitizedQuestions = useMemo(
    () => sanitizeQuestionsForAttempt(assessment.questions),
    [assessment.questions]
  );

  // ── Assessment State ────────────────────────────────────────────────────────
  // Storage key is keyed off the fresh attempt ID so past attempts cannot
  // pre-fill or leak in. Blank by default — every question starts unselected.
  const storageKey =
    submissionKey ||
    `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId || "temp"}_${
      attemptIdRef.current
    }`;

  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [timeLeft, setTimeLeft] = useState<number>(assessment.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [saveBadge, setSaveBadge] = useState<"idle" | "saved">("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const saveBadgeTimeoutRef = useRef<number | null>(null);

  const totalPoints = useMemo(
    () => assessment.questions.reduce((sum, q) => sum + q.points, 0),
    [assessment.questions]
  );

  // ── Gate Handler ────────────────────────────────────────────────────────────
  const handleBeginExam = useCallback((studentId: string, studentName: string) => {
    setLockedStudentId(studentId);
    setLockedStudentName(studentName);
    setSessionStartTime(new Date().toISOString());
    startedAtRef.current = new Date().toISOString();
    setIsGatePassed(true);
  }, []);

  // ── Load saved progress on mount (only after gate) ──────────────────────────
  // We only ever load from the fresh, attempt-scoped key. Past submissions
  // for this student live under older keys and are NEVER restored into the
  // active test view, ensuring a blank answer sheet every attempt.
  useEffect(() => {
    if (!isGatePassed || !lockedStudentId) return;

    const currentStorageKey =
      submissionKey ||
      `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId}_${attemptIdRef.current}`;

    try {
      const raw = localStorage.getItem(currentStorageKey);
      if (raw) {
        const parsed: StudentSubmission = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.responses)) {
          const map: Record<string, StudentResponse> = {};
          parsed.responses.forEach((r) => {
            map[r.questionId] = r;
          });
          setResponses(map);

          if (parsed.startedAt) startedAtRef.current = parsed.startedAt;
          if (parsed.isComplete) {
            setIsSubmitted(true);
            const elapsed = parsed.submittedAt
              ? Math.floor(
                  (new Date(parsed.submittedAt).getTime() - new Date(parsed.startedAt).getTime()) /
                    1000
                )
              : 0;
            const remaining = Math.max(0, assessment.duration * 60 - elapsed);
            setTimeLeft(remaining);
          }
        }
      }
    } catch (err) {
      console.error("[StudentAssessmentView] Failed to load saved progress:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGatePassed, lockedStudentId, assessment.id]);

  // ── Persist helper ──────────────────────────────────────────────────────────
  const persistSubmission = useCallback(
    (updatedResponses: Record<string, StudentResponse>, complete: boolean) => {
      if (!lockedStudentId) return;

      const currentStorageKey =
        submissionKey ||
        `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId}_${attemptIdRef.current}`;

      try {
        const list: StudentResponse[] = Object.values(updatedResponses);
        const submission: StudentSubmission = {
          assessmentId: assessment.id,
          studentId: lockedStudentId,
          attemptId: attemptIdRef.current,
          responses: list,
          startedAt: startedAtRef.current,
          submittedAt: complete ? new Date().toISOString() : undefined,
          isComplete: complete,
        };

        // Write to dedicated, attempt-scoped key
        localStorage.setItem(currentStorageKey, JSON.stringify(submission));

        // Also write to the shared student_submissions map so the existing
        // grading screens can read every student's work.
        const allRaw = localStorage.getItem("student_submissions");
        const all: Record<string, StudentSubmission> = allRaw ? JSON.parse(allRaw) : {};
        all[`${assessment.id}_${lockedStudentId}_${attemptIdRef.current}`] = submission;
        localStorage.setItem("student_submissions", JSON.stringify(all));

        setSaveBadge("saved");
        if (saveBadgeTimeoutRef.current) window.clearTimeout(saveBadgeTimeoutRef.current);
        saveBadgeTimeoutRef.current = window.setTimeout(() => setSaveBadge("idle"), 1500);
      } catch (err) {
        console.error("[StudentAssessmentView] Failed to save progress:", err);
        showError("Could not save your progress locally.");
      }
    },
    [assessment.id, lockedStudentId, submissionKey]
  );

  // ── Online/offline listener ────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted || !isGatePassed) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          // Time up — auto-submit
          handleSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, TIMER_TICK_MS);
    return () => window.clearInterval(id);
  }, [isSubmitted, isGatePassed]);

  // ── Response handlers (auto-save on every change) ──────────────────────────
  const handleSelectMCQ = useCallback(
    (questionId: string, optionId: string) => {
      if (isSubmitted) return;
      const updated: Record<string, StudentResponse> = {
        ...responses,
        [questionId]: {
          assessmentId: assessment.id,
          studentId: lockedStudentId,
          questionId,
          selectedOptionId: optionId,
          answeredAt: new Date().toISOString(),
        },
      };
      setResponses(updated);
      persistSubmission(updated, false);
    },
    [assessment.id, lockedStudentId, responses, persistSubmission, isSubmitted]
  );

  const handleAnswerStructured = useCallback(
    (questionId: string, text: string) => {
      if (isSubmitted) return;
      const updated: Record<string, StudentResponse> = {
        ...responses,
        [questionId]: {
          assessmentId: assessment.id,
          studentId: lockedStudentId,
          questionId,
          answerText: text,
          answeredAt: new Date().toISOString(),
        },
      };
      setResponses(updated);
      persistSubmission(updated, false);
    },
    [assessment.id, lockedStudentId, responses, persistSubmission, isSubmitted]
  );

  // ── Flexible Math & Numeric Normaliser ──────────────────────────────────────
  // Handles integers, decimals, fractions (e.g. "1/2", "3 1/4"), and responses
  // with optional units (e.g. "12.5 cm", "50%"). Returns true when the student's
  // cleaned answer is numerically equivalent to the expected answer.
  const evaluateNumericOrMathAnswer = useCallback(
    (studentInput: string | undefined, expectedAnswer: string | undefined): boolean => {
      if (!studentInput || !expectedAnswer) return false;

      const rawStudent = studentInput.trim().toLowerCase();
      const rawExpected = expectedAnswer.trim().toLowerCase();

      // 1. Exact string match after normalisation
      if (rawStudent === rawExpected) return true;

      // 2. Extract raw numbers (integers / decimals)
      const extractNum = (str: string): number | null => {
        const match = str.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : null;
      };

      const numStudent = extractNum(rawStudent);
      const numExpected = extractNum(rawExpected);

      if (numStudent !== null && numExpected !== null) {
        // Allow small precision variance for rounded decimals (e.g. 0.33 vs 0.333)
        if (Math.abs(numStudent - numExpected) < 0.01) return true;
      }

      // 3. Handle fraction parsing (e.g. "1/2" or "3/4")
      const parseFraction = (str: string): number | null => {
        const match = str.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (match) {
          const num = parseFloat(match[1]);
          const den = parseFloat(match[2]);
          if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
        }
        return null;
      };

      const fracStudent = parseFraction(rawStudent) ?? numStudent;
      const fracExpected = parseFraction(rawExpected) ?? numExpected;

      if (fracStudent !== null && fracExpected !== null) {
        return Math.abs(fracStudent - fracExpected) < 0.01;
      }

      return false;
    },
    []
  );

  // ── Full Assessment Marking Engine ──────────────────────────────────────────
  // Auto-grades all question types: MCQ (exact option match), structured / math
  // / numeric / fill_blank (numeric or math comparison via evaluateNumericOrMathAnswer).
  const calculateGradingResult = useCallback(
    (questions: Question[], studentResponses: Record<string, StudentResponse>): GradingResult => {
      const mcqResults: QuestionGradingResult[] = [];
      const questionResults: QuestionGradingResult[] = [];
      let totalScore = 0;
      let maxScore = 0;

      questions.forEach((question) => {
        const response = studentResponses[question.id];
        let isCorrect = false;
        let earnedPoints = 0;
        let userAnswer = "";
        let expectedAnswer = "";

        if (question.type === "mcq") {
          isCorrect = response?.selectedOptionId === question.correctOptionId;
          earnedPoints = isCorrect ? question.points : 0;
          userAnswer = response?.selectedOptionId ?? "";
          expectedAnswer = question.correctOptionId ?? "";
        } else {
          // structured / math / numeric / fill_blank — use numeric/math evaluator
          userAnswer = response?.answerText ?? "";
          expectedAnswer =
            question.correctAnswer ?? question.modelAnswer ?? "";

          isCorrect = evaluateNumericOrMathAnswer(userAnswer, expectedAnswer);
          earnedPoints = isCorrect ? question.points : 0;
        }

        const result: QuestionGradingResult = {
          questionId: question.id,
          type: question.type,
          correct: isCorrect,
          earnedPoints,
          maxPoints: question.points,
          userAnswer,
          expectedAnswer,
        };

        if (question.type === "mcq") mcqResults.push(result);
        questionResults.push(result);

        totalScore += earnedPoints;
        maxScore += question.points;
      });

      return {
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        mcqResults,
        questionResults,
      };
    },
    [evaluateNumericOrMathAnswer]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isSubmitted || !assessment || !lockedStudentId) return;

    // Auto-grade all question types (uses full question set with answer keys; only available after submit)
    const gradingResult = calculateGradingResult(assessment.questions, responses);
    setGradingResult(gradingResult);

    // Save grading result (attempt-scoped so it doesn't leak into other attempts)
    try {
      const gradingKey = `grading_result_${assessment.id}_${lockedStudentId}_${attemptIdRef.current}`;
      localStorage.setItem(gradingKey, JSON.stringify(gradingResult));
    } catch (err) {
      console.error("[StudentAssessmentView] Failed to save grading result:", err);
    }

    setIsSubmitted(true);
    persistSubmission(responses, true);

    const submission: StudentSubmission = {
      assessmentId: assessment.id,
      studentId: lockedStudentId,
      attemptId: attemptIdRef.current,
      responses: Object.values(responses),
      startedAt: startedAtRef.current,
      submittedAt: new Date().toISOString(),
      isComplete: true,
    };

    showSuccess("Assessment submitted! Answers auto-graded across all question types.");
    if (onSubmit) onSubmit(submission);
  }, [
    isSubmitted,
    assessment,
    responses,
    lockedStudentId,
    persistSubmission,
    onSubmit,
    calculateGradingResult,
  ]);

  // Keep a ref to the latest handleSubmit so the timer interval can call it.
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── Derived UI values ────────────────────────────────────────────────────────
  // Use the sanitized question set during the active test so answer keys are never in scope.
  const activeQuestions = isSubmitted ? assessment.questions : sanitizedQuestions;
  const currentQuestion = activeQuestions[currentIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const answeredCount = activeQuestions.filter((q) => {
    const r = responses[q.id];
    if (!r) return false;
    if (r.selectedOptionId) return true;
    if (r.answerText && r.answerText.trim() !== "") return true;
    return false;
  }).length;
  const isLastQuestion = currentIndex === activeQuestions.length - 1;

  const timerIsCritical = timeLeft > 0 && timeLeft < 60;
  const timerIsExpired = timeLeft === 0;

  // ── Render: Learner Identification Gate ───────────────────────────────────
  if (!isGatePassed) {
    return (
      <LearnerIdentificationModal
        assessmentTitle={assessment.title}
        assessmentSubject={assessment.subject}
        assessmentQuestionCount={assessment.questions.length}
        assessmentDuration={assessment.duration}
        onBeginExam={handleBeginExam}
        onClose={handleBackToExams}
      />
    );
  }

  // ── Render: empty / no questions ───────────────────────────────────────────
  if (!assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-3xl border-0 shadow-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">No Questions Available</h2>
          <p className="text-sm text-slate-500">This assessment has no questions to display.</p>
        </Card>
      </div>
    );
  }

  // ── Render: submitted — results breakdown ──────────────────────────────────
  // Score, per-question MCQ result, and model answers are ONLY shown here,
  // after the student has explicitly submitted. This is the only place where
  // correctOptionId / modelAnswer are accessed for display.
  if (isSubmitted) {
    const scorePct = gradingResult?.percentage ?? 0;
    const scoreColor =
      scorePct >= 80 ? "text-emerald-600" : scorePct >= 60 ? "text-amber-600" : "text-red-600";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Header Card */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white">
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">Assessment Submitted</h1>
              <p className="text-white/80 text-sm sm:text-base">
                Your responses have been saved. MCQ, math, numeric, and fill-in-the-blank
                questions are auto-graded; structured answers are pending teacher review.
              </p>
            </div>
            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Student</p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {lockedStudentName || lockedStudentId}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Answered</p>
                  <p className="text-sm font-bold text-slate-800">
                    {answeredCount} / {assessment.questions.length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Score</p>
                  <p className={cn("text-2xl font-black", scoreColor)}>
                    {gradingResult ? `${gradingResult.totalScore}/${gradingResult.maxScore} (${gradingResult.percentage}%)` : "—"}
                  </p>
                </div>
              </div>

              {/* Responses locked notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Responses Locked</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Your answers can no longer be edited. The submission has been timestamped and stored on this device.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleBackToExams}
                className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              >
                <FileQuestion className="w-4 h-4 mr-2" />
                Back to All Exams
              </Button>
            </CardContent>
          </Card>

          {/* Numeric / Math / Fill-blank results breakdown — only after submission */}
          {gradingResult && gradingResult.questionResults.some(
            (r) => r.type !== "mcq"
          ) && (
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white">
                <h2 className="font-black text-lg">Numeric &amp; Math Results</h2>
                <p className="text-white/70 text-sm mt-0.5">
                  Auto-graded structured, math, numeric, and fill-in-the-blank answers.
                </p>
              </div>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {gradingResult.questionResults.map((result, i) => {
                  if (result.type === "mcq") return null;
                  const question = assessment.questions.find((q) => q.id === result.questionId);
                  if (!question) return null;
                  const qIndex = assessment.questions.findIndex((q) => q.id === result.questionId);

                  return (
                    <div key={result.questionId} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex items-start gap-3 p-4 bg-slate-50">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm",
                            result.correct
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {result.correct ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 mb-2">
                            Q{qIndex + 1}. {question.prompt}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                Your answer
                              </p>
                              <p
                                className={cn(
                                  "text-sm font-mono break-words",
                                  result.correct ? "text-emerald-700" : "text-red-700"
                                )}
                              >
                                {result.userAnswer || (
                                  <span className="italic text-slate-400">No answer</span>
                                )}
                              </p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">
                                Correct answer
                              </p>
                              <p className="text-sm font-mono break-words text-emerald-800">
                                {result.expectedAnswer || (
                                  <span className="italic text-slate-400">—</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              "text-sm font-black",
                              result.correct ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {result.earnedPoints}/{result.maxPoints}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Per-question results — ONLY shown after explicit submission */}
          {gradingResult && gradingResult.mcqResults.length > 0 && (
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 text-white">
                <h2 className="font-black text-lg">MCQ Results Breakdown</h2>
                <p className="text-white/70 text-sm mt-0.5">Correct answers and model solutions are now visible.</p>
              </div>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {assessment.questions.map((q, i) => {
                  if (q.type !== "mcq") return null;
                  const result = gradingResult.mcqResults.find((r) => r.questionId === q.id);
                  const isCorrect = result?.correct ?? false;
                  const studentResp = responses[q.id];

                  return (
                    <div key={q.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex items-start gap-3 p-4 bg-slate-50">
                        {/* Result indicator */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm",
                            isCorrect
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {isCorrect ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <AlertCircle size={16} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 mb-1">
                            Q{i + 1}. {q.prompt}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {q.options?.map((opt) => {
                              const isStudentChoice = studentResp?.selectedOptionId === opt.id;
                              const isCorrectChoice = q.correctOptionId === opt.id;
                              return (
                                <span
                                  key={opt.id}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                    isCorrectChoice
                                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                      : isStudentChoice && !isCorrectChoice
                                      ? "bg-red-100 border-red-300 text-red-800"
                                      : "bg-slate-100 border-slate-200 text-slate-600"
                                  )}
                                >
                                  {opt.label}. {opt.text}
                                  {isCorrectChoice && <span className="ml-1 text-[10px] font-black">(Correct)</span>}
                                  {isStudentChoice && !isCorrectChoice && (
                                    <span className="ml-1 text-[10px] font-black">(Your answer)</span>
                                  )}
                                  {isCorrectChoice && isStudentChoice && (
                                    <CheckCircle2 size={10} className="ml-0.5 text-emerald-600" />
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={cn("text-sm font-black", isCorrect ? "text-emerald-600" : "text-red-600")}>
                            {result?.earnedPoints ?? 0}/{result?.maxPoints ?? q.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Structured question model answers — only shown after submit */}
          {assessment.questions.some(
            (q) =>
              (q.type === "structured" && !!q.modelAnswer) ||
              (["math", "numeric", "fill_blank"].includes(q.type) && !!q.correctAnswer)
          ) && (
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white">
                <h2 className="font-black text-lg">Model Answers &amp; Solutions</h2>
                <p className="text-white/70 text-sm mt-0.5">
                  Reference solutions for structured, math, and fill-in-the-blank questions.
                </p>
              </div>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {assessment.questions.map((q, i) => {
                  if (
                    (q.type !== "structured" || !q.modelAnswer) &&
                    !["math", "numeric", "fill_blank"].includes(q.type)
                  )
                    return null;

                  const displayAnswer =
                    q.correctAnswer ??
                    q.modelAnswer ??
                    null;

                  if (!displayAnswer) return null;

                  return (
                    <div key={q.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-slate-800 mb-2">
                        Q{i + 1}. {q.prompt}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed font-mono bg-amber-100/60 rounded-lg px-3 py-2">
                        {displayAnswer}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ── Render: active assessment ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* In-page Back arrow — routes back to exam listing */}
            <button
              onClick={handleBackToExams}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to exam listing"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">
                {assessment.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {assessment.subject} • Total {totalPoints} pts
                {lockedStudentName ? ` • ${lockedStudentName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timer */}
            <div
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base transition-colors",
                timerIsCritical || timerIsExpired
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              )}
              title="Time remaining"
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Online/Offline */}
            <Badge
              variant="outline"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-0",
                isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="text-xs font-semibold">
                {isOnline ? "Online" : "Offline"}
              </span>
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Status / progress bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs sm:text-sm">
              {answeredCount} answered
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {saveBadge === "saved" && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Auto-saved
              </span>
            )}
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 sm:py-7">
            <div className="flex items-center justify-between text-white/90 mb-3 flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-0 font-semibold">
                {currentQuestion.type === "mcq"
                  ? "Multiple Choice"
                  : currentQuestion.type === "math"
                  ? "Math"
                  : currentQuestion.type === "numeric"
                  ? "Numeric"
                  : currentQuestion.type === "fill_blank"
                  ? "Fill in the Blank"
                  : "Structured"}
              </Badge>
              <span className="text-sm font-bold">{currentQuestion.points} Points</span>
            </div>
            <h2 className="text-lg sm:text-2xl text-white font-semibold leading-relaxed">
              {currentQuestion.prompt}
            </h2>
          </div>

          <CardContent className="p-5 sm:p-8 space-y-6">
            {/* MCQ */}
            {currentQuestion.type === "mcq" && currentQuestion.options && (
              <div className="space-y-3" role="radiogroup" aria-label="Answer options">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentResponse?.selectedOptionId === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-100"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleSelectMCQ(currentQuestion.id, option.id)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all",
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        )}
                      >
                        {option.label}
                      </div>
                      <span
                        className={cn(
                          "font-medium text-sm sm:text-base break-words",
                          isSelected ? "text-indigo-900" : "text-slate-700"
                        )}
                      >
                        {option.text || <span className="italic text-slate-400">Empty option</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Structured / Math / Numeric / Fill-in-the-Blank */}
            {["structured", "math", "numeric", "fill_blank"].includes(currentQuestion.type) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label
                    htmlFor={`ta-${currentQuestion.id}`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Your Response
                  </label>
                  <span className="text-xs text-slate-400">
                    {(currentResponse?.answerText || "").length} characters
                  </span>
                </div>
                <Textarea
                  id={`ta-${currentQuestion.id}`}
                  placeholder="Type your detailed answer here..."
                  value={currentResponse?.answerText || ""}
                  onChange={(e) => handleAnswerStructured(currentQuestion.id, e.target.value)}
                  className="min-h-[220px] rounded-2xl border-slate-200 p-4 text-sm sm:text-base focus:border-indigo-500 focus:ring-indigo-200"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question palette */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Question Palette
          </p>
          <div className="flex flex-wrap gap-2">
            {activeQuestions.map((q, idx) => {
              const r = responses[q.id];
              const isAnswered =
                !!r?.selectedOptionId || (!!r?.answerText && r.answerText.trim() !== "");
              const isActive = currentIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : isAnswered
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                  aria-label={`Go to question ${idx + 1}${isAnswered ? " (answered)" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="h-12 px-4 sm:px-6 rounded-xl font-semibold border-slate-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              className="h-12 px-6 sm:px-8 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((p) => Math.min(activeQuestions.length - 1, p + 1))}
              className="h-12 px-4 sm:px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
            </Button>
          )}
        </div>

        {/* Timer warning */}
        {timerIsCritical && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-red-700 font-semibold">
              Less than a minute remaining! Your assessment will auto-submit when the timer reaches
              zero.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentAssessmentView;