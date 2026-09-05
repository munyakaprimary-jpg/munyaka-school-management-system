"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Award,
  Download,
  Search,
  Save,
  Clock,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { notifyDataChanged } from "@/utils/storage";
import { useFileDownload, MUNYAKA_HEADERS } from "@/utils/fileDownloader";
import { getAllAssessmentResults } from "@/utils/assessmentResults";
import { readGradesAndStreams, getStreamsForGrade } from "@/services/gradesStreamsConfig";
import { saveMarkedSubmission } from "@/types/assessment";
import type { StudentSubmission as MarkedSubmission } from "@/types/assessment";
import type {
  Assessment,
  Question,
  StudentResponse,
  StudentSubmission,
  AssessmentResult,
} from "@/types/questions";

// ─── Storage keys ───────────────────────────────────────────────────────────────
const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const SUBMISSION_KEY = "student_submissions";
const RESULTS_KEY = "munyaka_assessment_results";
const ALL_SET_EXAMS_KEY = "all_set_exams";
const MARKED_SUBMISSIONS_KEY = "marked_student_submissions";

// ─── Filter option lists ───────────────────────────────────────────────────────
// Standard Kenyan CBC grade list (PP1, PP2, Grade 1..9). The selector compares
// these values against each Assessment's `classLevel` field, so any extra
// custom values supplied by admins are still passed through as-is.
const GRADE_OPTIONS: string[] = [
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
];
const ALL_GRADES_VALUE = "all";
const ALL_STREAMS_VALUE = "all";
const ALL_EXAMS_VALUE = "all";

/** Normalise a grade string for case-insensitive comparison. */
function normaliseGrade(value: string | undefined | null): string {
  return (value || "").trim().toLowerCase();
}

// ─── Grade level helpers ────────────────────────────────────────────────────────
function computeGradeLevel(pct: number): AssessmentResult["gradeLevel"] {
  if (pct >= 80) return "EE";
  if (pct >= 60) return "ME";
  if (pct >= 40) return "AE";
  return "BE";
}

function gradeLabel(level: AssessmentResult["gradeLevel"]): string {
  switch (level) {
    case "EE": return "Exceeds Expectations";
    case "ME": return "Meets Expectations";
    case "AE": return "Approaches Expectations";
    case "BE": return "Below Expectations";
    default:   return "—";
  }
}

function gradeColor(level: AssessmentResult["gradeLevel"]): string {
  switch (level) {
    case "EE": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "ME": return "bg-blue-100 text-blue-800 border-blue-300";
    case "AE": return "bg-amber-100 text-amber-800 border-amber-300";
    case "BE": return "bg-red-100 text-red-800 border-red-300";
    default:   return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StudentGrade {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  stream?: string;
  /** The assessment this row belongs to (used in 'all exams' mode). */
  assessmentId: string;
  assessmentTitle: string;
  submission: StudentSubmission;
  responses: Record<string, StudentResponse>;
  // Teacher-assigned structured marks: questionId → awarded points
  structuredMarks: Record<string, number>;
  mcqScore: number;
  mcqMax: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradeLevel: AssessmentResult["gradeLevel"];
}

// ─── Data loaders ──────────────────────────────────────────────────────────────
function loadAssessments(): Assessment[] {
  const result: Assessment[] = [];

  // 1. Active question bank
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions?.length > 0) {
        result.push({
          id: "assessment_bank_default",
          title: parsed.metadata?.title || "Current Assessment",
          category: parsed.metadata?.category || "Formative Quiz",
          classLevel: parsed.metadata?.classLevel || "4",
          subject: parsed.metadata?.subject || "Mathematics",
          duration: parsed.metadata?.duration || 60,
          totalMarks: parsed.metadata?.totalMarks || 100,
          randomizeQuestions: parsed.metadata?.randomize || false,
          showImmediateFeedback: parsed.metadata?.showFeedback ?? true,
          questions: parsed.questions,
          createdAt: parsed.savedAt || new Date().toISOString(),
          updatedAt: parsed.savedAt || new Date().toISOString(),
        });
      }
    }
  } catch { /* ignore */ }

  // 2. Saved assessment definitions
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => {
          if (!result.some((r) => r.id === a.id)) result.push(a);
        });
      }
    }
  } catch { /* ignore */ }

  return result;
}

function loadSubmissions(assessmentId: string): StudentSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return [];
    const all: Record<string, StudentSubmission> = JSON.parse(raw);
    const subs = Object.values(all).filter((s) => s.isComplete);
    if (assessmentId === ALL_EXAMS_VALUE) return subs;
    return subs.filter((s) => s.assessmentId === assessmentId);
  } catch { return []; }
}

function loadStudentName(studentId: string): string {
  try {
    const raw = localStorage.getItem("school_learners_data");
    if (raw) {
      const learners = JSON.parse(raw);
      const found = learners.find(
        (l: any) =>
          l.id === studentId ||
          l.admissionNumber === studentId ||
          l.admNo === studentId
      );
      if (found) return found.name || studentId;
    }
  } catch { /* ignore */ }
  return studentId;
}

function loadStudentMeta(studentId: string): { classId: string; className: string; stream?: string } {
  try {
    const raw = localStorage.getItem("school_learners_data");
    if (raw) {
      const learners = JSON.parse(raw);
      const found = learners.find(
        (l: any) =>
          l.id === studentId ||
          l.admissionNumber === studentId ||
          l.admNo === studentId
      );
      if (found) {
        return {
          classId: found.grade || found.gradeLevel || "Grade 4",
          className: found.grade || found.gradeLevel || "Grade 4",
          stream: found.stream,
        };
      }
    }
  } catch { /* ignore */ }
  return { classId: "Grade 4", className: "Grade 4" };
}

// ─── MCQ Auto-grader ───────────────────────────────────────────────────────────
function gradeMCQs(
  questions: Question[],
  responses: Record<string, StudentResponse>
): { score: number; max: number } {
  const mcqs = questions.filter((q) => q.type === "mcq");
  let earned = 0;
  mcqs.forEach((q) => {
    const resp = responses[q.id];
    if (resp?.selectedOptionId === q.correctOptionId) earned += q.points;
  });
  return { score: earned, max: mcqs.reduce((s, q) => s + q.points, 0) };
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface TeacherGradingDashboardProps {
  /** Pre-select this assessment ID on load. */
  preselectedAssessmentId?: string;
}

const TeacherGradingDashboard: React.FC<TeacherGradingDashboardProps> = ({
  preselectedAssessmentId,
}) => {
  const csvExport = useFileDownload();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<Assessment | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Filter controls ────────────────────────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState<string>(ALL_GRADES_VALUE);
  const [selectedStream, setSelectedStream] = useState<string>(ALL_STREAMS_VALUE);

  // ── Auto-reset: when grade or stream changes, select the first matching exam
  //    (but preserve "all" if the user had explicitly chosen it and it's still valid).
  useEffect(() => {
    const first = filteredExams[0];
    if (first) {
      // Only auto-select if the current choice is no longer in the filtered list.
      const stillValid = filteredExams.some((e) => e.id === selectedExamId);
      if (!stillValid) {
        setSelectedExamId(first.id);
      }
    } else {
      setSelectedExamId(ALL_EXAMS_VALUE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade, selectedStream]);

  // ── Load assessments on mount ──────────────────────────────────────────────
  useEffect(() => {
    const available = loadAssessments();
    setAssessments(available);

    // Honour preselectedAssessmentId prop if provided and it exists in the list
    if (preselectedAssessmentId && available.some((a) => a.id === preselectedAssessmentId)) {
      setSelectedExamId(preselectedAssessmentId);
    } else if (available.length > 0 && !selectedExamId) {
      setSelectedExamId(available[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load submissions (always all; filtering is done in filteredGrades) ──────
  useEffect(() => {
    // Resolve the single "active" assessment for the grading panel.
    // When selectedExamId is "all" or empty, there is no single active exam.
    const activeExam =
      selectedExamId && selectedExamId !== ALL_EXAMS_VALUE
        ? assessments.find((a) => a.id === selectedExamId) || null
        : null;
    setSelectedExam(activeExam);

    // Always load every complete submission so cascading filters work on the full set.
    const allSubmissions = loadSubmissions(ALL_EXAMS_VALUE);

    // Load cached structured marks for every submission.
    const structuredMarksCache: Record<string, Record<string, number>> = {};
    allSubmissions.forEach((sub) => {
      try {
        const raw = localStorage.getItem(`grading_structured_${sub.assessmentId}_${sub.studentId}`);
        if (raw) structuredMarksCache[`${sub.assessmentId}_${sub.studentId}`] = JSON.parse(raw);
      } catch { /* ignore */ }
    });

    const grades: StudentGrade[] = [];
    allSubmissions.forEach((sub) => {
      // When a single exam is active, only show its submissions.
      if (activeExam && sub.assessmentId !== activeExam.id) return;

      const assessment = assessments.find((a) => a.id === sub.assessmentId) || null;
      if (!assessment) return;

      const respMap: Record<string, StudentResponse> = {};
      sub.responses.forEach((r) => { respMap[r.questionId] = r; });

      const structuredMarks =
        structuredMarksCache[`${sub.assessmentId}_${sub.studentId}`] || {};
      const { score: mcqScore, max: mcqMax } = gradeMCQs(assessment.questions, respMap);
      const structuredQuestions = assessment.questions.filter((q) => q.type === "structured");
      const structuredMax = structuredQuestions.reduce((s, q) => s + q.points, 0);
      const structuredEarned = structuredQuestions.reduce(
        (s, q) => s + (structuredMarks[q.id] || 0),
        0
      );
      const totalScore = mcqScore + structuredEarned;
      const maxScore = mcqMax + structuredMax;
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      const studentMeta = loadStudentMeta(sub.studentId);
      grades.push({
        studentId: sub.studentId,
        studentName: loadStudentName(sub.studentId),
        classId: studentMeta.classId,
        className: studentMeta.className,
        stream: studentMeta.stream,
        assessmentId: sub.assessmentId,
        assessmentTitle: assessment.title,
        submission: sub,
        responses: respMap,
        structuredMarks,
        mcqScore,
        mcqMax,
        totalScore,
        maxScore,
        percentage,
        gradeLevel: computeGradeLevel(percentage),
      });
    });

    setStudentGrades(grades);
    setSelectedStudentId(grades.length > 0 ? grades[0].studentId : null);
  }, [selectedExamId, assessments]);

  // ── Structured mark change ────────────────────────────────────────────────
  const handleStructuredMarkChange = useCallback(
    (studentId: string, questionId: string, value: number) => {
      setStudentGrades((prev) =>
        prev.map((g) => {
          if (g.studentId !== studentId) return g;
          const newMarks = { ...g.structuredMarks, [questionId]: value };
          const sq = selectedExam?.questions.filter((q) => q.type === "structured") || [];
          const earned = sq.reduce((s, q) => s + (newMarks[q.id] || 0), 0);
          const max = sq.reduce((s, q) => s + q.points, 0);
          const totalScore = g.mcqScore + earned;
          const maxScore = g.mcqMax + max;
          const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
          return {
            ...g,
            structuredMarks: newMarks,
            totalScore,
            maxScore,
            percentage,
            gradeLevel: computeGradeLevel(percentage),
          };
        })
      );

      // Persist to localStorage
      try {
        const raw = localStorage.getItem(`grading_structured_${selectedExamId}_${studentId}`);
        const existing: Record<string, number> = raw ? JSON.parse(raw) : {};
        existing[questionId] = value;
        localStorage.setItem(
          `grading_structured_${selectedExamId}_${studentId}`,
          JSON.stringify(existing)
        );
      } catch { /* ignore */ }
    },
    [selectedExam, selectedExamId]
  );

  // ── Save all results ───────────────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    if (!selectedExam || studentGrades.length === 0) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    try {
      const existingAll = getAllAssessmentResults();
      const others = existingAll.filter((r) => r.assessmentId !== selectedExam.id);

      let academicYear = new Date().getFullYear().toString();
      let term = "Term 1";
      try {
        const settingsRaw = localStorage.getItem("munyaka_system_settings_v3");
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          academicYear = settings.academicYear || academicYear;
          term = settings.term || term;
        }
      } catch { /* ignore */ }

      const newResults: AssessmentResult[] = studentGrades.map((g) => ({
        id: `result_${selectedExam.id}_${g.studentId}_${Date.now()}`,
        studentId: g.studentId,
        studentName: g.studentName,
        classId: g.classId,
        className: g.className,
        stream: g.stream,
        subjectId: selectedExam.subject,
        subjectName: selectedExam.subject,
        academicYear,
        term,
        examType: selectedExam.category,
        assessmentId: selectedExam.id,
        assessmentTitle: selectedExam.title,
        totalScore: g.totalScore,
        maxScore: g.maxScore,
        percentage: g.percentage,
        responses: g.submission.responses,
        startedAt: g.submission.startedAt,
        submittedAt: g.submission.submittedAt || new Date().toISOString(),
        isComplete: true,
        gradeLevel: g.gradeLevel,
      }));

      const merged = [...others, ...newResults];
      localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
      notifyDataChanged(RESULTS_KEY);

      // ── Persist per-student marked snapshots ─────────────────────────────
      // After the aggregate result is stored, snapshot each student's
      // final answers, marks and feedback into the dedicated
      // `marked_student_submissions` ledger so the Marked Scripts
      // management view can list & export them as PDFs.
      studentGrades.forEach((g) => {
        const answers: Record<string, any> = {};
        const marks: Record<string, number> = {};
        g.submission.responses.forEach((r) => {
          if (r.selectedOptionId !== undefined) {
            answers[r.questionId] = r.selectedOptionId;
          } else {
            answers[r.questionId] = r.answerText ?? "";
          }
        });
        // Merge auto-MCQ marks with teacher-entered structured marks.
        selectedExam.questions.forEach((q) => {
          const resp = g.responses[q.id];
          if (q.type === "mcq") {
            marks[q.id] =
              resp?.selectedOptionId === q.correctOptionId ? q.points : 0;
          } else {
            marks[q.id] = g.structuredMarks[q.id] ?? 0;
          }
        });

        const markedRecord: MarkedSubmission = {
          id: `marked_${selectedExam.id}_${g.studentId}`,
          examId: selectedExam.id,
          examTitle: selectedExam.title,
          studentName: g.studentName,
          admissionNo: g.studentId,
          score: g.totalScore,
          totalPoints: g.maxScore,
          percentage: g.percentage,
          submittedAt: g.submission.submittedAt || new Date().toISOString(),
          answers,
          marks,
          feedback: {},
          grade: g.classId,
          stream: g.stream,
        };
        saveMarkedSubmission(markedRecord);
      });

      setIsSaving(false);
      showSuccess("All grades saved successfully!");
    } catch (e) {
      setIsSaving(false);
      showError("Failed to save: " + (e instanceof Error ? e.message : String(e)));
    }
  }, [selectedExam, studentGrades]);

  // ── Export Marks CSV ────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(async () => {
    if (!selectedExam || studentGrades.length === 0) {
      showError("No grades to export.");
      return;
    }

    const questions = selectedExam.questions ?? [];

    // Clean headers: Admission No, Student Name, Q1, Q2, …, Total Score, Percentage, Rubric Level
    const headers = [
      "Admission No",
      "Student Name",
      "Class",
      "Stream",
      ...questions.map((_, i) => `Q${i + 1}`),
      "Total Score",
      "Percentage",
      "Rubric Level",
    ];

    // Build rows: each question column = points earned (1/0 for MCQ, actual points otherwise)
    const rows = studentGrades.map((g) => {
      // Prefer marks from the submission ledger (auto-graded pipeline).
      // Falls back to the dashboard's teacher-entered marks if the submission field is absent.
      const submissionMarks: Record<string, number> = g.submission?.marks ?? {};
      const structuredMarks = g.structuredMarks ?? {};

      const cells: string[] = [
        String(g.submission?.admissionNo ?? g.studentId ?? ""),
        g.studentName ?? "",
        g.classId ?? g.className ?? "",
        g.stream ?? "All",
      ];

      // Per-question points earned
      questions.forEach((q) => {
        // Auto-graded mark from the submission pipeline first; teacher mark as fallback
        const earned =
          submissionMarks[q.id] ?? structuredMarks[q.id] ?? 0;
        cells.push(String(earned));
      });

      cells.push(
        `${g.totalScore}/${g.maxScore}`,
        `${g.percentage}%`,
        g.gradeLevel ?? "",
      );

      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });

    const csvBody = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");

    const filename =
      `Marks_${selectedExam.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

    await csvExport.download({
      filename,
      data: csvBody,
      mimeType: "text/csv;charset=utf-8;",
      fileType: "csv",
      pendingMessage: "Preparing marks export…",
      successMessage: "Marks exported successfully!",
    });
  }, [selectedExam, studentGrades, csvExport]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const filteredGrades = useMemo(() => {
    return studentGrades.filter((g) => {
      const matchesExam =
        selectedExamId === ALL_EXAMS_VALUE ||
        selectedExamId === "" ||
        g.assessmentId === selectedExamId;
      const matchesGrade =
        selectedGrade === ALL_GRADES_VALUE ||
        normaliseGrade(g.classId) === normaliseGrade(selectedGrade) ||
        normaliseGrade(g.className) === normaliseGrade(selectedGrade);
      const matchesStream =
        selectedStream === ALL_STREAMS_VALUE ||
        normaliseGrade(g.stream) === normaliseGrade(selectedStream);
      const matchesSearch =
        !(searchTerm ?? '').trim() ||
        g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.classId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesExam && matchesGrade && matchesStream && matchesSearch;
    });
  }, [studentGrades, searchTerm, selectedGrade, selectedStream, selectedExamId]);

  const selectedStudent = studentGrades.find((g) => g.studentId === selectedStudentId) || null;

  // ── Cascading filter lists ─────────────────────────────────────────────────
  // filteredExams: reads from localStorage (all_set_exams) and narrows the
  // list by selectedGrade + selectedStream, then by any exam that has
  // at least one marked submission in the selected stream.
  const filteredExams = useMemo(() => {
    // 1. Load all-set exams from localStorage.
    let allSetExams: Array<{ id: string; title: string; subject: string; classLevel?: string; grade?: string; stream?: string }> = [];
    try {
      const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        allSetExams = Array.isArray(parsed) ? parsed : [];
      }
    } catch { /* ignore */ }

    // 2. Load marked submissions to discover exams that have saved results.
    let markedSubs: Array<{ examId?: string; stream?: string }> = [];
    try {
      const raw2 = localStorage.getItem(MARKED_SUBMISSIONS_KEY);
      if (raw2) {
        const parsed2 = JSON.parse(raw2) as Record<string, { examId?: string; stream?: string }>;
        markedSubs = Object.values(parsed2).filter(
          (s): s is { examId: string; stream?: string } =>
            typeof s.examId === "string"
        );
      }
    } catch { /* ignore */ }

    return allSetExams.filter((exam) => {
      const needle = normaliseGrade(selectedGrade);
      // a) Match by grade (compare against both classLevel and grade fields).
      const gradeField = (exam.classLevel || exam.grade || "").trim().toLowerCase();
      const matchesGrade =
        selectedGrade === ALL_GRADES_VALUE ||
        needle === "" ||
        gradeField === needle;

      // b) Match by stream: direct match OR the exam has a submission in that stream.
      const matchesStream =
        selectedStream === ALL_STREAMS_VALUE ||
        exam.stream === selectedStream ||
        markedSubs.some(
          (s) =>
            s.examId === exam.id &&
            (s.stream ?? "").trim().toLowerCase() ===
              (selectedStream ?? "").trim().toLowerCase()
        );

      return matchesGrade && matchesStream;
    });
  }, [selectedGrade, selectedStream]);

  // ── Stream options: three-tier lookup ────────────────────────────────────────
  // 1. Read from the Grades & Streams menu (canonical source — readGradesAndStreams).
  // 2. Falls back to extracting unique stream names from in-memory student rows.
  const gradesConfig = readGradesAndStreams();

  // All streams from the Grades & Streams menu registry.
  const allRegistryStreams = [...gradesConfig.streams];

  /**
   * Streams available for display, filtered by the currently selected grade.
   *
   * Priority:
   *  a) If `selectedGrade` is "all" — show every stream from the registry (or
   *     the configured global list if set).
   *  b) If a specific grade is selected — narrow to that grade's streams.
   *  c) If both sources are empty — pull from in-memory student rows as last
   *     resort so the dropdown is never blank.
   */
  const availableStreams = useMemo(() => {
    // a) Narrow by grade using the canonical Grades & Streams menu config.
    if (selectedGrade !== ALL_GRADES_VALUE && selectedGrade) {
      const gradeStreams = getStreamsForGrade(selectedGrade, gradesConfig);
      if (gradeStreams.length > 0) return gradeStreams;
    }

    // b) No grade selected (or no per-grade streams) → return all registry streams.
    if (allRegistryStreams.length > 0) return allRegistryStreams;

    // c) Last resort: extract from the in-memory student rows.
    const fromRows = new Set<string>();
    studentGrades.forEach((g) => {
      const s = (g.stream || "").trim();
      if (s) fromRows.add(s);
    });
    return Array.from(fromRows).sort();
  }, [selectedGrade, studentGrades, gradesConfig, allRegistryStreams]);

  const structuredQuestions =
    selectedExam?.questions.filter((q) => q.type === "structured") || [];
  const mcqQuestions =
    selectedExam?.questions.filter((q) => q.type === "mcq") || [];

  const classStats = useMemo(() => {
    if (filteredGrades.length === 0) return null;
    const avg = filteredGrades.reduce((s, g) => s + g.percentage, 0) / filteredGrades.length;
    const highest = Math.max(...filteredGrades.map((g) => g.percentage));
    const lowest = Math.min(...filteredGrades.map((g) => g.percentage));
    return { avg: Math.round(avg), highest, lowest };
  }, [filteredGrades]);

  const toggleSection = (id: string) =>
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderMCQSection = (g: StudentGrade) => (
    <div className="space-y-3">
      {mcqQuestions.length === 0 ? (
        <p className="text-sm text-slate-400 italic px-1">No MCQ questions in this assessment.</p>
      ) : (
        mcqQuestions.map((q, idx) => {
          const resp = g.responses[q.id];
          const isCorrect = resp?.selectedOptionId === q.correctOptionId;
          const selectedOption = q.options?.find((o) => o.id === resp?.selectedOptionId);
          const correctOption = q.options?.find((o) => o.id === q.correctOptionId);

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                    isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    Q{idx + 1}. {q.prompt || "(No prompt)"}
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      ({q.points} pt{q.points !== 1 ? "s" : ""})
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                        isCorrect
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                          : "bg-red-100 border-red-300 text-red-800"
                      }`}
                    >
                      Student:{" "}
                      {selectedOption ? `${selectedOption.label}. ${selectedOption.text || "(empty)"}` : "(no answer)"}
                    </span>
                    {!isCorrect && correctOption && (
                      <span className="text-xs px-2.5 py-1 rounded-lg border bg-emerald-100 border-emerald-300 text-emerald-800 font-medium">
                        Correct: {correctOption.label}. {correctOption.text || "(empty)"}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1.5 font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                    {isCorrect
                      ? `✓ Correct — awarded ${q.points} pt`
                      : "✗ Incorrect — 0 pts"}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderStructuredSection = (g: StudentGrade) => (
    <div className="space-y-3">
      {structuredQuestions.length === 0 ? (
        <p className="text-sm text-slate-400 italic px-1">No structured questions in this assessment.</p>
      ) : (
        structuredQuestions.map((q, idx) => {
          const resp = g.responses[q.id];
          const studentAnswer = resp?.answerText || "";
          const awarded = g.structuredMarks[q.id] ?? null;
          const sectionId = `str_${q.id}`;
          const isExpanded = !!expandedItems[sectionId];

          return (
            <div key={q.id} className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => toggleSection(sectionId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {mcqQuestions.length + idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {q.prompt || "(No prompt)"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {q.points} pts
                      {(studentAnswer ?? '').trim()
                        ? ` · ${(studentAnswer ?? '').trim().split(/\s+/).length} words`
                        : " · No answer"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {awarded !== null ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        awarded === q.points
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                          : awarded > 0
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-red-100 text-red-700 border-red-300"
                      }`}
                    >
                      {awarded}/{q.points}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-500 border-slate-200 font-medium">
                      Ungraded
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-amber-50/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    {/* Student answer */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          S
                        </div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Student's Response
                        </Label>
                      </div>
                      {(studentAnswer ?? '').trim() ? (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {studentAnswer}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No answer submitted.</p>
                      )}
                    </div>

                    {/* Model answer */}
                    <div className="bg-white rounded-xl border border-emerald-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Model Answer / Marking Key
                        </Label>
                      </div>
                      {(q.modelAnswer ?? '').trim() ? (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {q.modelAnswer}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No model answer provided.</p>
                      )}
                    </div>
                  </div>

                  {/* Mark input row */}
                  <div className="mt-3 flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
                    <Label className="text-sm font-semibold text-slate-600 shrink-0">
                      Award Marks
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={q.points}
                        placeholder="0"
                        value={awarded !== null ? awarded : ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const clamped = isNaN(val) || val < 0 ? 0 : Math.min(val, q.points);
                          handleStructuredMarkChange(g.studentId, q.id, clamped);
                        }}
                        className="w-20 text-center font-bold rounded-lg"
                      />
                      <span className="text-sm text-slate-400">/ {q.points} pts</span>
                    </div>

                    {/* Quick-fill */}
                    <div className="flex gap-1 ml-auto">
                      {[q.points, Math.round(q.points / 2), 0].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleStructuredMarkChange(g.studentId, q.id, preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            awarded === preset
                              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                              : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          {preset === q.points ? "Full" : preset === 0 ? "Zero" : `${preset} pts`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Teacher Grading Dashboard</h1>
              <p className="text-sm text-slate-500">
                Auto-score MCQs · Grade structured responses · Export marks
              </p>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-3">
            {/* ── Grade Selector ─────────────────────────────────────────── */}
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-44 rounded-xl border-slate-200 bg-slate-50 font-medium">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GRADES_VALUE}>All Grades</SelectItem>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Stream Selector (native <select> for dynamic options) ──────── */}
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="h-11 w-36 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              aria-label="Filter by stream"
            >
              <option value={ALL_STREAMS_VALUE}>All Streams</option>
              {availableStreams.map((streamName) => (
                <option key={streamName} value={streamName}>
                  {streamName}
                </option>
              ))}
            </select>

            {/* ── Exam Selector (cascaded by grade & stream) ─────────────────── */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-11 w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              aria-label="Select exam"
            >
              <option value={ALL_EXAMS_VALUE}>All Exams</option>
              {filteredExams.length === 0 ? (
                <option value="" disabled>
                  {selectedGrade !== ALL_GRADES_VALUE
                    ? `No exams found for ${selectedGrade}`
                    : "No exams found"}
                </option>
              ) : (
                filteredExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.subject}
                    {(exam.classLevel || exam.grade) && ` • ${exam.classLevel || exam.grade}`})
                  </option>
                ))
              )}
            </select>

            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 disabled:opacity-50"
              onClick={handleExportCSV}
              disabled={csvExport.isDownloading || studentGrades.length === 0}
            >
              {csvExport.isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Marks
            </Button>

            <Button
              onClick={handleSaveAll}
              disabled={isSaving || studentGrades.length === 0}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold shadow-sm gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save All
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* No assessment */}
        {!selectedExam && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Assessment Selected</h2>
            <p className="text-slate-500 max-w-md">
              Select an assessment from the dropdown above to start grading submitted responses.
            </p>
          </div>
        )}

        {/* No submissions */}
        {selectedExam && studentGrades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Submissions Yet</h2>
            <p className="text-slate-500 max-w-md">
              No students have submitted <strong>{selectedExam.title}</strong> yet.
              Submissions will appear here once students complete the assessment.
            </p>
          </div>
        )}

        {/* Full grading layout */}
        {selectedExam && studentGrades.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Student list */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
              {/* Class stats */}
              {classStats && (
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      Class Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-indigo-600">{classStats.avg}%</div>
                      <div className="text-xs text-slate-500 mt-1">Class Avg</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-black text-emerald-600">{classStats.highest}%</div>
                      <div className="text-xs text-slate-500 mt-1">Highest</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-black text-red-500">{classStats.lowest}%</div>
                      <div className="text-xs text-slate-500 mt-1">Lowest</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-slate-200 bg-white"
                />
              </div>

              {/* Student cards */}
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 pr-2">
                  {filteredGrades.map((g) => {
                    const isSelected = g.studentId === selectedStudentId;

                    return (
                      <button
                        key={g.studentId}
                        onClick={() => setSelectedStudentId(g.studentId)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100 ring-2 ring-indigo-200"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{g.studentName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {g.classId}{g.stream ? ` · ${g.stream}` : ""}
                            </p>
                          </div>
                          <Badge className={`shrink-0 font-bold text-xs px-2 py-0.5 rounded-lg border ${gradeColor(g.gradeLevel)}`}>
                            {g.gradeLevel}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                            <span>{g.totalScore} / {g.maxScore} pts</span>
                            <span className="font-bold text-indigo-600">{g.percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${g.percentage}%`,
                                background:
                                  g.percentage >= 80
                                    ? "linear-gradient(90deg, #10b981, #059669)"
                                    : g.percentage >= 60
                                    ? "linear-gradient(90deg, #3b82f6, #1d4ed8)"
                                    : g.percentage >= 40
                                    ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                    : "linear-gradient(90deg, #ef4444, #dc2626)",
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredGrades.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No students match "{searchTerm}"
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Grading detail */}
            <div className="flex-1 min-w-0">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-400">Select a student to review their responses.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Student summary header */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedStudent.studentName}</h2>
                        <p className="text-indigo-100 text-sm mt-0.5">
                          {selectedStudent.classId}
                          {selectedStudent.stream ? ` · ${selectedStudent.stream}` : ""}
                          {" · "}{selectedExam.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">
                            {selectedStudent.mcqScore}/{selectedStudent.mcqMax}
                          </div>
                          <div className="text-xs text-indigo-200">MCQ Auto</div>
                        </div>
                        <div className="w-px h-10 bg-indigo-300/40 hidden sm:block" />
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">
                            {structuredQuestions.reduce(
                              (s, q) => s + (selectedStudent.structuredMarks[q.id] || 0),
                              0
                            )}
                            /{structuredQuestions.reduce((s, q) => s + q.points, 0)}
                          </div>
                          <div className="text-xs text-indigo-200">Structured</div>
                        </div>
                        <div className="w-px h-10 bg-indigo-300/40 hidden sm:block" />
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">
                            {selectedStudent.totalScore}
                            <span className="text-lg text-indigo-200">/{selectedStudent.maxScore}</span>
                          </div>
                          <div className="text-xs text-indigo-200">
                            {selectedStudent.percentage}% ·{" "}
                            <Badge className="bg-white/20 text-white border-0 text-xs font-bold px-1.5 py-0.5 rounded-md">
                              {selectedStudent.gradeLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedStudent.submission.startedAt && (
                      <div className="px-6 py-2.5 border-t border-indigo-100 flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/50">
                        <Clock className="w-3.5 h-3.5" />
                        Started {new Date(selectedStudent.submission.startedAt).toLocaleString()}
                        {selectedStudent.submission.submittedAt && (
                          <> · Submitted {new Date(selectedStudent.submission.submittedAt).toLocaleString()}</>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* MCQ Auto-Score */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-slate-50 to-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">MCQ</span>
                          </div>
                          <CardTitle className="text-base font-semibold text-slate-700">
                            Multiple Choice — Auto-Scored
                          </CardTitle>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium text-xs">
                          {selectedStudent.mcqScore} / {selectedStudent.mcqMax} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {renderMCQSection(selectedStudent)}
                    </CardContent>
                  </Card>

                  {/* Structured Manual Grading */}
                  {structuredQuestions.length > 0 && (
                    <Card className="border border-amber-200 shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-amber-50 to-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-amber-600">✎</span>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-700">
                              Structured Questions — Manual Grading
                            </CardTitle>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-medium text-xs">
                            {structuredQuestions.reduce(
                              (s, q) => s + (selectedStudent.structuredMarks[q.id] || 0), 0
                            )}
                            /{structuredQuestions.reduce((s, q) => s + q.points, 0)} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {renderStructuredSection(selectedStudent)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Final aggregate */}
                  <Card className="border border-indigo-200 shadow-md rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                      <h3 className="text-white font-bold mb-4 text-lg">Final Aggregate</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">{selectedStudent.totalScore}</div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">Total Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">{selectedStudent.maxScore}</div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">Max Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">{selectedStudent.percentage}%</div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">Percentage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white flex items-center justify-center gap-1.5">
                            {selectedStudent.gradeLevel}
                          </div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">
                            {gradeLabel(selectedStudent.gradeLevel)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherGradingDashboard;
