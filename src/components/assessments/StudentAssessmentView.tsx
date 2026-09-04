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
  User,
  Search,
  Plus,
  X,
  GraduationCap,
  Loader2,
  ChevronDown,
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

const STUDENTS_STORAGE_KEY = "school_learners_data";
const SUBMISSION_STORAGE_KEY_PREFIX = "submission";
const TIMER_TICK_MS = 1000;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface RegisteredStudent {
  id: string;
  admissionNumber?: string;
  admNo?: string;
  name: string;
  grade?: string;
  stream?: string;
  status?: string;
}

interface LearnerIdentificationGateProps {
  assessment: Assessment;
  onBeginExam: (studentId: string, studentName: string) => void;
}

const LearnerIdentificationGate: React.FC<LearnerIdentificationGateProps> = ({
  assessment,
  onBeginExam,
}) => {
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<RegisteredStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regGrade, setRegGrade] = useState("");
  const [regAdmNo, setRegAdmNo] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load students from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (raw) {
        const parsed: RegisteredStudent[] = JSON.parse(raw);
        // Filter out transferred students
        const active = parsed.filter(
          (s) => !s.status || s.status === "Active" || s.status === "active"
        );
        setStudents(active);
      }
    } catch (err) {
      console.error("[LearnerIdentificationGate] Failed to load students:", err);
    }
    setIsLoading(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(query) ||
        (s.admissionNumber || s.admNo || "").toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleSelectStudent = (student: RegisteredStudent) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowDropdown(false);
    setShowRegistration(false);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleBeginExam = () => {
    if (!selectedStudent && !showRegistration) return;

    if (showRegistration) {
      // Quick inline registration
      if (!regName.trim() || !regAdmNo.trim()) {
        showError("Please fill in the student's name and admission number.");
        return;
      }
      const newStudent: RegisteredStudent = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        admissionNumber: regAdmNo.trim(),
        admNo: regAdmNo.trim(),
        name: regName.trim(),
        grade: regGrade.trim(),
        status: "Active",
      };

      // Save to localStorage
      try {
        const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
        const existing: RegisteredStudent[] = raw ? JSON.parse(raw) : [];
        existing.push(newStudent);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(existing));
        showSuccess("Student registered successfully!");
        onBeginExam(newStudent.id, newStudent.name);
      } catch (err) {
        console.error("[LearnerIdentificationGate] Failed to save student:", err);
        showError("Failed to register student. Please try again.");
      }
    } else if (selectedStudent) {
      onBeginExam(selectedStudent.id, selectedStudent.name);
    }
  };

  const studentId = selectedStudent?.id || selectedStudent?.admissionNumber || selectedStudent?.admNo;
  const studentName = selectedStudent?.name || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Learner Identification</h1>
            <p className="text-white/80 text-sm">
              Please identify yourself before starting the assessment
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Assessment Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                Assessment
              </p>
              <p className="font-bold text-slate-800">{assessment.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {assessment.subject} • {assessment.questions.length} questions •{" "}
                {assessment.duration} minutes
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                {/* Student Search / Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Select Student
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search by name or admission number..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedStudent(null);
                          setShowRegistration(true);
                        }}
                        onFocus={handleSearchFocus}
                        className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          setShowRegistration(!showRegistration);
                          if (!showRegistration) {
                            setSelectedStudent(null);
                            setSearchQuery("");
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                        title={showRegistration ? "Cancel" : "Register new student"}
                      >
                        {showRegistration ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Dropdown Results */}
                    {showDropdown && filteredStudents.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                        {filteredStudents.slice(0, 10).map((student) => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 text-left transition-colors border-b border-slate-100 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {student.admissionNumber || student.admNo || "No ID"} •
                                {student.grade || "N/A"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {searchQuery && filteredStudents.length === 0 && !showRegistration && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span>No student found.</span>
                      <button
                        onClick={() => setShowRegistration(true)}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Register new student
                      </button>
                    </p>
                  )}
                </div>

                {/* Inline Registration Form */}
                {showRegistration && !selectedStudent && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-bold">Quick Student Registration</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">
                          Full Name *
                        </label>
                        <Input
                          placeholder="Enter student's full name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">
                            Admission No. *
                          </label>
                          <Input
                            placeholder="e.g., ADM-001"
                            value={regAdmNo}
                            onChange={(e) => setRegAdmNo(e.target.value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">
                            Grade/Class
                          </label>
                          <Input
                            placeholder="e.g., Grade 4"
                            value={regGrade}
                            onChange={(e) => setRegGrade(e.target.value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Begin Exam Button */}
                <Button
                  onClick={handleBeginExam}
                  disabled={
                    (!selectedStudent && !showRegistration) ||
                    (showRegistration && (!regName.trim() || !regAdmNo.trim()))
                  }
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Begin Exam
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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
}

interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  mcqResults: {
    questionId: string;
    correct: boolean;
    earnedPoints: number;
    maxPoints: number;
  }[];
}

const StudentAssessmentView: React.FC<StudentAssessmentViewProps> = ({
  assessment,
  studentId: initialStudentId,
  studentName: initialStudentName,
  onSubmit,
  submissionKey,
}) => {
  const navigate = useNavigate();

  // ── Gate State ─────────────────────────────────────────────────────────────
  const [isGatePassed, setIsGatePassed] = useState(false);
  const [lockedStudentId, setLockedStudentId] = useState(initialStudentId);
  const [lockedStudentName, setLockedStudentName] = useState(initialStudentName);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // ── Assessment State ────────────────────────────────────────────────────────
  const storageKey =
    submissionKey ||
    `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId || "temp"}`;

  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [timeLeft, setTimeLeft] = useState<number>(assessment.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
  useEffect(() => {
    if (!isGatePassed || !lockedStudentId) return;

    const currentStorageKey = `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId}`;

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
            // Lock timer to whatever time was left at submit
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

      const currentStorageKey = `${SUBMISSION_STORAGE_KEY_PREFIX}_${assessment.id}_${lockedStudentId}`;

      try {
        const list: StudentResponse[] = Object.values(updatedResponses);
        const submission: StudentSubmission = {
          assessmentId: assessment.id,
          studentId: lockedStudentId,
          responses: list,
          startedAt: startedAtRef.current,
          submittedAt: complete ? new Date().toISOString() : undefined,
          isComplete: complete,
        };

        // Write to dedicated key (submission_{assessmentId}_{studentId})
        localStorage.setItem(currentStorageKey, JSON.stringify(submission));

        // Also write to the shared student_submissions map so the existing
        // grading screens can read every student's work.
        const allRaw = localStorage.getItem("student_submissions");
        const all: Record<string, StudentSubmission> = allRaw ? JSON.parse(allRaw) : {};
        all[`${assessment.id}_${lockedStudentId}`] = submission;
        localStorage.setItem("student_submissions", JSON.stringify(all));

        setSaveBadge("saved");
        if (saveBadgeTimeoutRef.current) window.clearTimeout(saveBadgeTimeoutRef.current);
        saveBadgeTimeoutRef.current = window.setTimeout(() => setSaveBadge("idle"), 1500);
      } catch (err) {
        console.error("[StudentAssessmentView] Failed to save progress:", err);
        showError("Could not save your progress locally.");
      }
    },
    [assessment.id, lockedStudentId]
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

  // ── MCQ Auto-Grading ────────────────────────────────────────────────────────
  const autoGradeMCQ = useCallback(
    (questions: Question[], studentResponses: Record<string, StudentResponse>): GradingResult => {
      const mcqResults: GradingResult["mcqResults"] = [];
      let totalScore = 0;
      let maxScore = 0;

      questions.forEach((question) => {
        if (question.type === "mcq") {
          const response = studentResponses[question.id];
          const isCorrect = response?.selectedOptionId === question.correctOptionId;
          const earnedPoints = isCorrect ? question.points : 0;

          mcqResults.push({
            questionId: question.id,
            correct: isCorrect,
            earnedPoints,
            maxPoints: question.points,
          });

          totalScore += earnedPoints;
          maxScore += question.points;
        }
      });

      return {
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        mcqResults,
      };
    },
    []
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isSubmitted || !assessment || !lockedStudentId) return;

    // Auto-grade MCQ
    const gradingResult = autoGradeMCQ(assessment.questions, responses);

    // Save grading result
    try {
      const gradingKey = `grading_result_${assessment.id}_${lockedStudentId}`;
      localStorage.setItem(gradingKey, JSON.stringify(gradingResult));
    } catch (err) {
      console.error("[StudentAssessmentView] Failed to save grading result:", err);
    }

    setIsSubmitted(true);
    persistSubmission(responses, true);

    const submission: StudentSubmission = {
      assessmentId: assessment.id,
      studentId: lockedStudentId,
      responses: Object.values(responses),
      startedAt: startedAtRef.current,
      submittedAt: new Date().toISOString(),
      isComplete: true,
    };

    showSuccess("Assessment submitted successfully! MCQ auto-graded.");
    if (onSubmit) onSubmit(submission);

    // Redirect to assessments list after a brief delay
    setTimeout(() => {
      navigate("/assessments/list");
    }, 1500);
  }, [isSubmitted, assessment, responses, lockedStudentId, persistSubmission, onSubmit, autoGradeMCQ, navigate]);

  // Keep a ref to the latest handleSubmit so the timer interval can call it.
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── Derived UI values ────────────────────────────────────────────────────────
  const currentQuestion = assessment.questions[currentIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const answeredCount = assessment.questions.filter((q) => {
    const r = responses[q.id];
    if (!r) return false;
    if (r.selectedOptionId) return true;
    if (r.answerText && r.answerText.trim() !== "") return true;
    return false;
  }).length;
  const isLastQuestion = currentIndex === assessment.questions.length - 1;

  const timerIsCritical = timeLeft > 0 && timeLeft < 60;
  const timerIsExpired = timeLeft === 0;

  // ── Render: Learner Identification Gate ───────────────────────────────────
  if (!isGatePassed) {
    return (
      <LearnerIdentificationGate assessment={assessment} onBeginExam={handleBeginExam} />
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

  // ── Render: submitted confirmation ────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white">
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">Assessment Submitted</h1>
              <p className="text-white/80 text-sm sm:text-base">
                Your responses have been saved and MCQ has been auto-graded.
              </p>
            </div>
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Student
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {lockedStudentName || lockedStudentId}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Answered
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {answeredCount} / {assessment.questions.length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Total Points
                  </p>
                  <p className="text-sm font-bold text-slate-800">{totalPoints}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Responses Locked</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your answers can no longer be edited. The submission has been timestamped and
                    stored on this device. Redirecting to assessments list...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              Question {currentIndex + 1} of {assessment.questions.length}
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
                {currentQuestion.type === "mcq" ? "Multiple Choice" : "Structured"}
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

            {/* Structured */}
            {currentQuestion.type === "structured" && (
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
            {assessment.questions.map((q, idx) => {
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
              onClick={() => setCurrentIndex((p) => Math.min(assessment.questions.length - 1, p + 1))}
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
