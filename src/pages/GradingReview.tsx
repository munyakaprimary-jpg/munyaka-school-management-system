"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Save,
  BookOpen,
  FileQuestion,
  Award,
  Clock,
  Loader2,
  AlertCircle,
  GraduationCap,
  ArrowLeft,
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
import { getAllAssessmentResults } from "@/utils/assessmentResults";
import type {
  Assessment,
  Question,
  StudentResponse,
  StudentSubmission,
  AssessmentResult,
} from "@/types/questions";

// ─── Local storage keys ───────────────────────────────────────────────────────
const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const SUBMISSION_KEY = "student_submissions";
const RESULTS_KEY = "munyaka_assessment_results";

// ─── CBC grade level helpers ─────────────────────────────────────────────────
function computeGradeLevel(percentage: number): AssessmentResult["gradeLevel"] {
  if (percentage >= 80) return "EE";
  if (percentage >= 60) return "ME";
  if (percentage >= 40) return "AE";
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

// ─── Per-student grading state ────────────────────────────────────────────────
interface StudentGrade {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  stream?: string;
  submission: StudentSubmission;
  responses: Record<string, StudentResponse>;
  // Per-question structured marks (questionId → awarded points)
  structuredMarks: Record<string, number>;
  // MCQ auto-score
  mcqScore: number;
  mcqMax: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradeLevel: AssessmentResult["gradeLevel"];
}

// ─── Load assessments from storage ─────────────────────────────────────────────
function loadAvailableAssessments(): Assessment[] {
  const result: Assessment[] = [];

  // 1. Active question bank (the current working assessment)
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions?.length > 0) {
        result.push({
          id: "assessment_default_01",
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
          if (!result.some((r) => r.id === a.id)) {
            result.push(a);
          }
        });
      }
    }
  } catch { /* ignore */ }

  return result;
}

// ─── Load submissions for a given assessment ──────────────────────────────────
function loadSubmissions(assessmentId: string): StudentSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return [];
    const all: Record<string, StudentSubmission> = JSON.parse(raw);
    return Object.values(all).filter(
      (s) => s.assessmentId === assessmentId && s.isComplete
    );
  } catch {
    return [];
  }
}

// ─── Load existing results ─────────────────────────────────────────────────────
function loadExistingResults(assessmentId: string): Map<string, AssessmentResult> {
  const map = new Map<string, AssessmentResult>();
  try {
    const all = getAllAssessmentResults();
    all.forEach((r) => {
      if (r.assessmentId === assessmentId) {
        map.set(r.studentId, r);
      }
    });
  } catch { /* ignore */ }
  return map;
}

// ─── Auto-grade MCQs for a student's responses ─────────────────────────────────
function gradeMCQs(
  questions: Question[],
  responses: Record<string, StudentResponse>
): { score: number; max: number } {
  const mcqs = questions.filter((q) => q.type === "mcq");
  let earned = 0;
  mcqs.forEach((q) => {
    const resp = responses[q.id];
    if (resp?.selectedOptionId === q.correctOptionId) {
      earned += q.points;
    }
  });
  return { score: earned, max: mcqs.reduce((s, q) => s + q.points, 0) };
}

// ─── Load student names from learner store ────────────────────────────────────
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

function loadStudentMeta(studentId: string): {
  classId: string;
  className: string;
  stream?: string;
} {
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GradingReview() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  const handleBackToParent = useCallback(() => {
    setSelectedAssessmentId("");
    setSelectedAssessment(null);
    setSelectedStudentId(null);
    navigate("/assessments");
  }, [navigate]);

  // Load available assessments on mount
  useEffect(() => {
    const available = loadAvailableAssessments();
    setAssessments(available);
    if (available.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(available[0].id);
    }
  }, []);

  // When assessment changes, load submissions and build grading state
  useEffect(() => {
    if (!selectedAssessmentId) return;
    const assessment = assessments.find((a) => a.id === selectedAssessmentId) || null;
    setSelectedAssessment(assessment);

    if (!assessment) {
      setStudentGrades([]);
      setSelectedStudentId(null);
      return;
    }

    const submissions = loadSubmissions(selectedAssessmentId);
    const existingResults = loadExistingResults(selectedAssessmentId);

    const grades: StudentGrade[] = submissions.map((sub) => {
      const respMap: Record<string, StudentResponse> = {};
      sub.responses.forEach((r) => {
        respMap[r.questionId] = r;
      });

      // Load any existing structured marks from saved result
      const existing = existingResults.get(sub.studentId);
      const structuredMarks: Record<string, number> = {};
      if (existing?.responses) {
        // Reconstruct from existing result responses (structured answers)
        existing.responses.forEach((r) => {
          if (r.answerText) {
            // We store awarded marks in a side-channel via the result's totalScore minus mcq
            // For now, initialise from existing result if available
          }
        });
        // Pull structured marks from localStorage cached result metadata
        try {
          const cachedRaw = localStorage.getItem(`grading_structured_${selectedAssessmentId}_${sub.studentId}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            Object.assign(structuredMarks, cached);
          }
        } catch { /* ignore */ }
      }

      const { score: mcqScore, max: mcqMax } = gradeMCQs(assessment.questions, respMap);
      const structuredQuestions = assessment.questions.filter((q) => q.type === "structured");
      const structuredMax = structuredQuestions.reduce((s, q) => s + q.points, 0);
      const structuredEarned = structuredQuestions.reduce((s, q) => s + (structuredMarks[q.id] || 0), 0);
      const totalScore = mcqScore + structuredEarned;
      const maxScore = mcqMax + structuredMax;
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      return {
        studentId: sub.studentId,
        studentName: loadStudentName(sub.studentId),
        classId: loadStudentMeta(sub.studentId).classId,
        className: loadStudentMeta(sub.studentId).className,
        stream: loadStudentMeta(sub.studentId).stream,
        submission: sub,
        responses: respMap,
        structuredMarks,
        mcqScore,
        mcqMax,
        totalScore,
        maxScore,
        percentage,
        gradeLevel: computeGradeLevel(percentage),
      };
    });

    setStudentGrades(grades);
    if (grades.length > 0 && !selectedStudentId) {
      setSelectedStudentId(grades[0].studentId);
    } else {
      setSelectedStudentId(null);
    }
  }, [selectedAssessmentId, assessments]);

  // Update a structured question mark and recompute totals
  const handleStructuredMarkChange = useCallback(
    (studentId: string, questionId: string, value: number) => {
      setStudentGrades((prev) =>
        prev.map((g) => {
          if (g.studentId !== studentId) return g;

          const newMarks = { ...g.structuredMarks, [questionId]: value };

          const structuredQuestions =
            selectedAssessment?.questions.filter((q) => q.type === "structured") || [];
          const structuredEarned = structuredQuestions.reduce(
            (s, q) => s + (newMarks[q.id] || 0),
            0
          );
          const structuredMax = structuredQuestions.reduce(
            (s, q) => s + q.points,
            0
          );
          const totalScore = g.mcqScore + structuredEarned;
          const maxScore = g.mcqMax + structuredMax;
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

      // Cache per-student structured marks
      try {
        const raw = localStorage.getItem(`grading_structured_${selectedAssessmentId}_${studentId}`);
        const existing: Record<string, number> = raw ? JSON.parse(raw) : {};
        existing[questionId] = value;
        localStorage.setItem(
          `grading_structured_${selectedAssessmentId}_${studentId}`,
          JSON.stringify(existing)
        );
      } catch { /* ignore */ }
    },
    [selectedAssessment]
  );

  // Save all grades for the selected assessment
  const handleSaveAll = useCallback(async () => {
    if (!selectedAssessment) return;
    setIsSaving(true);

    await new Promise((r) => setTimeout(r, 500));

    try {
      const existingAll = getAllAssessmentResults();
      const others = existingAll.filter(
        (r) => r.assessmentId !== selectedAssessment.id
      );

      const newResults: AssessmentResult[] = studentGrades.map((g) => {
              return {
                id: `result_${selectedAssessment.id}_${g.studentId}_${Date.now()}`,
                studentId: g.studentId,
                studentName: g.studentName,
                classId: g.classId,
                className: g.className,
                stream: g.stream,
                subjectId: selectedAssessment.subject,
                subjectName: selectedAssessment.subject,
                academicYear: new Date().getFullYear().toString(),
                term: "Term 1",
                examType: selectedAssessment.category,
                assessmentId: selectedAssessment.id,
                assessmentTitle: selectedAssessment.title,
                totalScore: g.totalScore,
                maxScore: g.maxScore,
                percentage: g.percentage,
                responses: g.submission.responses,
                startedAt: g.submission.startedAt,
                submittedAt: g.submission.submittedAt || new Date().toISOString(),
                isComplete: true,
                gradeLevel: g.gradeLevel,
              };
            });

      const merged = [...others, ...newResults];
      localStorage.setItem(RESULTS_KEY, JSON.stringify(merged));
      notifyDataChanged(RESULTS_KEY);

      setIsSaving(false);
      setSaveSuccessId("all");
      showSuccess("All grades saved successfully!");
      setTimeout(() => setSaveSuccessId(null), 2000);
    } catch (e) {
      setIsSaving(false);
      showError("Failed to save grades: " + (e instanceof Error ? e.message : String(e)));
    }
  }, [selectedAssessment, studentGrades]);

  // Filter students by search term
  const filteredGrades = useMemo(() => {
    if (!searchTerm.trim()) return studentGrades;
    const q = searchTerm.toLowerCase();
    return studentGrades.filter(
      (g) =>
        g.studentName.toLowerCase().includes(q) ||
        g.studentId.toLowerCase().includes(q) ||
        (g.classId || "").toLowerCase().includes(q)
    );
  }, [studentGrades, searchTerm]);

  const selectedStudent = studentGrades.find(
    (g) => g.studentId === selectedStudentId
  );

  const structuredQuestions =
    selectedAssessment?.questions.filter((q) => q.type === "structured") || [];
  const mcqQuestions =
    selectedAssessment?.questions.filter((q) => q.type === "mcq") || [];

  const classStats = useMemo(() => {
    if (studentGrades.length === 0) return null;
    const avg =
      studentGrades.reduce((s, g) => s + g.percentage, 0) / studentGrades.length;
    const highest = Math.max(...studentGrades.map((g) => g.percentage));
    const lowest = Math.min(...studentGrades.map((g) => g.percentage));
    return { avg: Math.round(avg), highest, lowest };
  }, [studentGrades]);

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToParent}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center"
              title="Back to Assessments Menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Grading &amp; Marks Entry</h1>
              <p className="text-sm text-slate-500">Auto-score MCQs · Grade structured responses · View aggregates</p>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-3">
            {/* Assessment selector */}
            <Select
              value={selectedAssessmentId}
              onValueChange={setSelectedAssessmentId}
            >
              <SelectTrigger className="w-64 rounded-xl border-slate-200 bg-slate-50 font-medium">
                <SelectValue placeholder="Select assessment..." />
              </SelectTrigger>
              <SelectContent>
                {assessments.length === 0 && (
                  <SelectItem value="none" disabled>
                    No assessments found
                  </SelectItem>
                )}
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex flex-col">
                      <span className="font-medium">{a.title}</span>
                      <span className="text-xs text-slate-500">
                        {a.subject} · {a.category} · Class {a.classLevel}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Save All */}
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || studentGrades.length === 0}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All Grades
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── No assessment selected ──────────────────────────────────────── */}
        {!selectedAssessment && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Assessment Selected</h2>
            <p className="text-slate-500 max-w-md">
              Select an assessment above to begin grading. Students who have submitted their responses will appear here.
            </p>
          </div>
        )}

        {/* ── Empty submissions ───────────────────────────────────────────── */}
        {selectedAssessment && studentGrades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Submissions Yet</h2>
            <p className="text-slate-500 max-w-md">
              No students have submitted <strong>{selectedAssessment.title}</strong> yet.
              Once students complete the assessment, their responses will appear here for grading.
            </p>
          </div>
        )}

        {/* ── Grading layout ─────────────────────────────────────────────── */}
        {selectedAssessment && studentGrades.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Left: Student list ─────────────────────────────────────── */}
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
                      <div className="text-2xl font-bold text-indigo-600">{classStats.avg}%</div>
                      <div className="text-xs text-slate-500 mt-1">Class Avg</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-bold text-emerald-600">{classStats.highest}%</div>
                      <div className="text-xs text-slate-500 mt-1">Highest</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-bold text-red-500">{classStats.lowest}%</div>
                      <div className="text-xs text-slate-500 mt-1">Lowest</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Student search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student..."
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
                    const needsStructured = structuredQuestions.some(
                      (q) => !g.structuredMarks[q.id] && g.structuredMarks[q.id] !== 0
                    );

                    return (
                      <button
                        key={g.studentId}
                        onClick={() => setSelectedStudentId(g.studentId)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100 ring-2 ring-indigo-200"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{g.studentName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {g.classId}
                              {g.stream ? ` · ${g.stream}` : ""}
                            </p>
                          </div>
                          <Badge
                            className={`shrink-0 font-bold text-xs px-2 py-0.5 rounded-lg border ${gradeColor(g.gradeLevel)}`}
                          >
                            {g.gradeLevel}
                          </Badge>
                        </div>

                        {/* Score bar */}
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

                        {needsStructured && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="w-3 h-3" />
                            Structured pending
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {filteredGrades.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No students match &quot;{searchTerm}&quot;
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* ── Right: Selected student detail ───────────────────────────── */}
            <div className="flex-1 min-w-0">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-400">Select a student from the list to review their responses.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* ── Student summary header ──────────────────────────────── */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedStudent.studentName}</h2>
                        <p className="text-indigo-100 text-sm mt-0.5">
                          {selectedStudent.classId}
                          {selectedStudent.stream ? ` · ${selectedStudent.stream}` : ""}
                          {" · "}
                          {selectedAssessment.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* MCQ score */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {selectedStudent.mcqScore}/{selectedStudent.mcqMax}
                          </div>
                          <div className="text-xs text-indigo-200">MCQ Auto-score</div>
                        </div>
                        <div className="w-px h-10 bg-indigo-300/40" />
                        {/* Structured score */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {structuredQuestions.reduce(
                              (s, q) => s + (selectedStudent.structuredMarks[q.id] || 0),
                              0
                            )}
                            /{structuredQuestions.reduce((s, q) => s + q.points, 0)}
                          </div>
                          <div className="text-xs text-indigo-200">Structured</div>
                        </div>
                        <div className="w-px h-10 bg-indigo-300/40" />
                        {/* Total */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {selectedStudent.totalScore}
                            <span className="text-lg text-indigo-200">
                              /{selectedStudent.maxScore}
                            </span>
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

                    {/* Duration info */}
                    {selectedStudent.submission.startedAt && (
                      <div className="px-6 py-2.5 border-t border-indigo-100 flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/50">
                        <Clock className="w-3.5 h-3.5" />
                        Started{" "}
                        {new Date(selectedStudent.submission.startedAt).toLocaleString()}
                        {selectedStudent.submission.submittedAt && (
                          <>
                            {" · "}Submitted{" "}
                            {new Date(selectedStudent.submission.submittedAt).toLocaleString()}
                          </>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* ── MCQ Auto-Score Section ─────────────────────────────── */}
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
                    <CardContent className="p-0">
                      {mcqQuestions.map((question, qIdx) => {
                        const response = selectedStudent.responses[question.id];
                        const isCorrect =
                          response?.selectedOptionId === question.correctOptionId;
                        const selectedOption = question.options?.find(
                          (o) => o.id === response?.selectedOptionId
                        );
                        const correctOption = question.options?.find(
                          (o) => o.id === question.correctOptionId
                        );

                        return (
                          <div
                            key={question.id}
                            className={`px-5 py-4 border-b border-slate-100 last:border-0 ${
                              isCorrect ? "bg-emerald-50/60" : "bg-red-50/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                                  isCorrect
                                    ? "bg-emerald-500 text-white"
                                    : "bg-red-500 text-white"
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
                                  Q{qIdx + 1}. {question.prompt || "(No prompt)"}
                                  <span className="ml-2 text-xs text-slate-400 font-normal">
                                    ({question.points} pt{question.points !== 1 ? "s" : ""})
                                  </span>
                                </p>

                                <div className="flex flex-wrap gap-3 mt-2">
                                  {/* Student's answer */}
                                  <div
                                    className={`text-xs px-3 py-1.5 rounded-lg border ${
                                      isCorrect
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                        : "bg-red-100 border-red-300 text-red-800"
                                    }`}
                                  >
                                    <span className="font-semibold mr-1">Student:</span>
                                    {selectedOption
                                      ? `${selectedOption.label}. ${selectedOption.text || "(no text)"}`
                                      : "(no answer)"}
                                  </div>

                                  {/* Correct answer */}
                                  {!isCorrect && correctOption && (
                                    <div className="text-xs px-3 py-1.5 rounded-lg border bg-emerald-100 border-emerald-300 text-emerald-800">
                                      <span className="font-semibold mr-1">Correct:</span>
                                      {correctOption.label}.{" "}
                                      {correctOption.text || "(no text)"}
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs mt-2 font-medium text-slate-500">
                                  {isCorrect ? (
                                    <span className="text-emerald-600">
                                      ✓ Correct — awarded {question.points} point
                                      {question.points !== 1 ? "s" : ""}
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      ✗ Incorrect — 0 points awarded
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {mcqQuestions.length === 0 && (
                        <div className="px-5 py-6 text-sm text-slate-400 text-center">
                          No multiple choice questions in this assessment.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Structured Questions Review Section ──────────────────── */}
                  {structuredQuestions.length > 0 && (
                    <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
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
                              (s, q) =>
                                s + (selectedStudent.structuredMarks[q.id] ?? 0),
                              0
                            )}
                            /{structuredQuestions.reduce((s, q) => s + q.points, 0)}{" "}
                            pts awarded
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {structuredQuestions.map((question, qIdx) => {
                          const response = selectedStudent.responses[question.id];
                          const studentAnswer = response?.answerText || "";
                          const currentMark =
                            selectedStudent.structuredMarks[question.id] ?? null;
                          const sectionId = `structured_${question.id}`;

                          return (
                            <div
                              key={question.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              {/* Question header (always visible) */}
                              <button
                                onClick={() => toggleSection(sectionId)}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber-50/30 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center">
                                    {qIdx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                      {question.prompt || "(No prompt)"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {question.points} point{question.points !== 1 ? "s" : ""}
                                      {" · "}
                                      {studentAnswer.trim()
                                        ? `${studentAnswer.trim().split(/\s+/).length} words typed`
                                        : "No answer submitted"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  {currentMark !== null && currentMark !== undefined ? (
                                    <Badge
                                      className={`font-bold text-xs ${
                                        currentMark === question.points
                                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                          : currentMark > 0
                                          ? "bg-amber-100 text-amber-700 border-amber-300"
                                          : "bg-red-100 text-red-700 border-red-300"
                                      }`}
                                    >
                                      {currentMark}/{question.points}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                                      Ungraded
                                    </Badge>
                                  )}
                                  {expandedSections[sectionId] ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </button>

                              {/* Expanded review panel */}
                              {expandedSections[sectionId] && (
                                <div className="px-5 pb-5 bg-amber-50/20">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    {/* Student's answer */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                          S
                                        </div>
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                          Student&apos;s Response
                                        </Label>
                                      </div>
                                      {studentAnswer.trim() ? (
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                          {studentAnswer}
                                        </p>
                                      ) : (
                                        <p className="text-sm text-slate-400 italic">
                                          No answer submitted.
                                        </p>
                                      )}
                                    </div>

                                    {/* Model answer / marking key */}
                                    <div className="bg-white rounded-xl border border-emerald-200 p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                          ✓
                                        </div>
                                        <Label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                          Model Answer / Marking Key
                                        </Label>
                                      </div>
                                      {question.modelAnswer?.trim() ? (
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                          {question.modelAnswer}
                                        </p>
                                      ) : (
                                        <p className="text-sm text-slate-400 italic">
                                          No model answer provided.
                                        </p>
                                      )}

                                      {/* Rubric */}
                                      {question.rubric?.trim() && (
                                        <div className="mt-3 pt-3 border-t border-emerald-100">
                                          <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">
                                            Rubric / Notes
                                          </p>
                                          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                            {question.rubric}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mark input */}
                                  <div className="mt-4 flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4">
                                    <Label className="text-sm font-semibold text-slate-600 shrink-0">
                                      Awarded Marks
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={question.points}
                                        placeholder="0"
                                        value={
                                          currentMark !== null && currentMark !== undefined
                                            ? currentMark
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          const clamped =
                                            isNaN(val) || val < 0
                                              ? 0
                                              : Math.min(val, question.points);
                                          handleStructuredMarkChange(
                                            selectedStudent.studentId,
                                            question.id,
                                            clamped
                                          );
                                        }}
                                        className="w-20 text-center font-bold rounded-lg border-slate-200"
                                      />
                                      <span className="text-sm text-slate-400">
                                        / {question.points} pts
                                      </span>
                                    </div>

                                    {/* Quick-fill buttons */}
                                    <div className="flex gap-1.5 ml-auto">
                                      {[question.points, Math.round(question.points / 2), 0].map(
                                        (preset) => (
                                          <button
                                            key={preset}
                                            onClick={() =>
                                              handleStructuredMarkChange(
                                                selectedStudent.studentId,
                                                question.id,
                                                preset
                                              )
                                            }
                                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                              currentMark === preset
                                                ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                                : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                                            }`}
                                          >
                                            {preset === question.points
                                              ? "Full"
                                              : preset === 0
                                              ? "Zero"
                                              : `${preset} pts`}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Final aggregate ─────────────────────────────────────── */}
                  <Card className="border border-indigo-200 shadow-md rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                      <h3 className="text-white font-bold mb-4 text-lg">Final Aggregate</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">
                            {selectedStudent.totalScore}
                          </div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">
                            Total Score
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">
                            {selectedStudent.maxScore}
                          </div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">
                            Max Score
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">
                            {selectedStudent.percentage}%
                          </div>
                          <div className="text-xs text-indigo-200 mt-1 font-medium">
                            Percentage
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
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
}
