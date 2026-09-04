"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Upload,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Check,
  BookOpen,
  Clock,
  Award,
  Percent,
  ListChecks,
  CheckCircle,
  Library,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { writeStorage, generateId } from "@/utils/storage";
import { cn } from "@/lib/utils";
import type { Assessment, Question, QuestionType } from "@/types/questions";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const ALL_SET_EXAMS_KEY = "all_set_exams";
const ASSESSMENT_CATEGORIES = [
  { value: "formative", label: "Formative Quiz" },
  { value: "summative", label: "Summative Quiz" },
  { value: "midterm", label: "Mid-Term Exam" },
  { value: "endterm", label: "End-Term Exam" },
  { value: "revision", label: "Revision Test" },
  { value: "opener", label: "Opener Quiz" },
  { value: "opener-term1", label: "Opener – Term 1" },
  { value: "opener-term2", label: "Opener – Term 2" },
  { value: "opener-term3", label: "Opener – Term 3" },
];

// ─── Target grade / stream constants ─────────────────────────────────────────
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
const ALL_STREAMS_VALUE = "all";

/** Read configured streams from school admin keys; falls back to []. */
function loadConfiguredStreams(): string[] {
  const keys = ["configured_streams", "school_classes"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((item: unknown) =>
            typeof item === "string" ? item : (item as Record<string, unknown>)?.name ?? ""
          )
          .map((s: string) => String(s).trim())
          .filter(Boolean);
      }
    } catch { /* ignore */ }
  }
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────
const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  // Exam meta
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("formative");
  // selectedGrade feeds the new dropdown; classLevel stays in sync so existing
  // Assessment.classLevel consumers keep working without changes.
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [classLevel, setClassLevel] = useState("");
  const [selectedStream, setSelectedStream] = useState<string>(ALL_STREAMS_VALUE);
  const [availableStreams, setAvailableStreams] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingPercentage, setPassingPercentage] = useState(50);

  // Populate the stream dropdown once on mount.
  useEffect(() => {
    setAvailableStreams(loadConfiguredStreams());
  }, []);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAssessmentId, setPublishedAssessmentId] = useState<string>("");

  // Active question form (used for both "add" and "edit")
  const [draftType, setDraftType] = useState<QuestionType>("mcq");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftPoints, setDraftPoints] = useState(1);
  const [draftOptionA, setDraftOptionA] = useState("");
  const [draftOptionB, setDraftOptionB] = useState("");
  const [draftOptionC, setDraftOptionC] = useState("");
  const [draftOptionD, setDraftOptionD] = useState("");
  const [draftCorrectOption, setDraftCorrectOption] = useState<"a" | "b" | "c" | "d">("a");
  const [draftModelAnswer, setDraftModelAnswer] = useState("");

  // ── Reset draft form ──────────────────────────────────────────────────────
  const resetDraft = useCallback(() => {
    setDraftType("mcq");
    setDraftPrompt("");
    setDraftPoints(1);
    setDraftOptionA("");
    setDraftOptionB("");
    setDraftOptionC("");
    setDraftOptionD("");
    setDraftCorrectOption("a");
    setDraftModelAnswer("");
    setEditingQuestionId(null);
  }, []);

  // ── Validate draft ────────────────────────────────────────────────────────
  const validateDraft = useCallback((): string | null => {
    if (!draftPrompt.trim()) return "Please enter a question prompt.";

    if (draftType === "mcq") {
      if (!draftOptionA.trim() || !draftOptionB.trim()) {
        return "MCQ questions need at least Options A and B filled in.";
      }
    }

    if (!draftPoints || draftPoints < 1) {
      return "Points must be at least 1.";
    }
    return null;
  }, [draftPrompt, draftType, draftOptionA, draftOptionB, draftPoints]);

  // ── Add or update a question ──────────────────────────────────────────────
  const handleAddOrUpdateQuestion = useCallback(() => {
    const error = validateDraft();
    if (error) {
      showError(error);
      return;
    }

    if (draftType === "mcq") {
      const options = [
        { id: "a" as const, label: "A" as const, text: draftOptionA.trim() },
        { id: "b" as const, label: "B" as const, text: draftOptionB.trim() },
        ...(draftOptionC.trim()
          ? [{ id: "c" as const, label: "C" as const, text: draftOptionC.trim() }]
          : []),
        ...(draftOptionD.trim()
          ? [{ id: "d" as const, label: "D" as const, text: draftOptionD.trim() }]
          : []),
      ];

      if (editingQuestionId) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === editingQuestionId
              ? {
                  ...q,
                  prompt: draftPrompt.trim(),
                  points: draftPoints,
                  options,
                  correctOptionId: draftCorrectOption,
                }
              : q
          )
        );
        showSuccess("Question updated.");
      } else {
        const newQ: Question = {
          id: generateId("q"),
          type: "mcq",
          prompt: draftPrompt.trim(),
          points: draftPoints,
          order: questions.length + 1,
          options,
          correctOptionId: draftCorrectOption,
        };
        setQuestions((prev) => [...prev, newQ]);
        setExpandedQuestionId(newQ.id);
        showSuccess("MCQ question added.");
      }
    } else {
      if (editingQuestionId) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === editingQuestionId
              ? {
                  ...q,
                  prompt: draftPrompt.trim(),
                  points: draftPoints,
                  modelAnswer: draftModelAnswer.trim(),
                }
              : q
          )
        );
        showSuccess("Question updated.");
      } else {
        const newQ: Question = {
          id: generateId("q"),
          type: "structured",
          prompt: draftPrompt.trim(),
          points: draftPoints,
          order: questions.length + 1,
          modelAnswer: draftModelAnswer.trim(),
        };
        setQuestions((prev) => [...prev, newQ]);
        setExpandedQuestionId(newQ.id);
        showSuccess("Structured question added.");
      }
    }
    resetDraft();
  }, [validateDraft, draftType, draftPrompt, draftPoints, draftOptionA, draftOptionB, draftOptionC, draftOptionD, draftCorrectOption, draftModelAnswer, editingQuestionId, questions.length, resetDraft]);

  // ── Edit existing question ────────────────────────────────────────────────
  const handleEditQuestion = useCallback((q: Question) => {
    setDraftType(q.type);
    setDraftPrompt(q.prompt);
    setDraftPoints(q.points);
    if (q.type === "mcq" && q.options) {
      setDraftOptionA(q.options.find((o) => o.id === "a")?.text || "");
      setDraftOptionB(q.options.find((o) => o.id === "b")?.text || "");
      setDraftOptionC(q.options.find((o) => o.id === "c")?.text || "");
      setDraftOptionD(q.options.find((o) => o.id === "d")?.text || "");
      setDraftCorrectOption((q.correctOptionId as "a" | "b" | "c" | "d") || "a");
    } else {
      setDraftOptionA(""); setDraftOptionB(""); setDraftOptionC(""); setDraftOptionD("");
      setDraftCorrectOption("a");
    }
    setDraftModelAnswer(q.modelAnswer || "");
    setEditingQuestionId(q.id);
    setExpandedQuestionId(q.id);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Delete question ───────────────────────────────────────────────────────
  const handleDeleteQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
    );
    if (editingQuestionId === id) resetDraft();
    showSuccess("Question removed.");
  }, [editingQuestionId, resetDraft]);

  // ── Move question up/down ─────────────────────────────────────────────────
  const handleMove = useCallback((id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((q, i) => ({ ...q, order: i + 1 }));
    });
  }, []);

  // ── Publish assessment ────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      showError("Please enter an assessment title before publishing.");
      return;
    }
    if (!selectedGrade || !subject.trim()) {
      showError("Please pick a target grade and enter a subject.");
      return;
    }
    if (questions.length === 0) {
      showError("Add at least one question before publishing.");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    try {
      const now = new Date().toISOString();
      const assessmentId = publishedAssessmentId || generateId("asm");
      const calcTotalMarks = totalMarks || questions.reduce((s, q) => s + q.points, 0);
      const resolvedClassLevel = (classLevel.trim() || selectedGrade).trim();
      const resolvedStream =
        selectedStream && selectedStream !== ALL_STREAMS_VALUE
          ? selectedStream.trim()
          : "all";

      // 1. Update question bank so StudentAssessmentView can find this exam.
      const bankPayload = {
        metadata: {
          title: title.trim(),
          category,
          classLevel: resolvedClassLevel,
          subject: subject.trim(),
          duration,
          totalMarks: calcTotalMarks,
          randomize: false,
          showFeedback: false,
          passingPercentage,
          assessmentId,
          createdAt: now,
          grade: selectedGrade,
          stream: resolvedStream,
        },
        questions: questions.map((q, i) => ({ ...q, order: i + 1 })),
        savedAt: now,
      };
      writeStorage(QUESTION_BANK_KEY, bankPayload);

      // 2. Build full assessment with status + all required metadata.
      //    `grade` and `stream` are explicit top-level fields so the
      //    Teacher Grading Dashboard's cascading filter can match them directly.
      const newAssessment: Assessment & { grade: string; stream: string } = {
        id: assessmentId,
        title: title.trim(),
        category,
        classLevel: resolvedClassLevel,
        grade: selectedGrade,
        stream: resolvedStream,
        subject: subject.trim(),
        duration,
        totalMarks: calcTotalMarks,
        randomizeQuestions: false,
        showImmediateFeedback: false,
        status: "published",
        questions: bankPayload.questions,
        createdAt: now,
        updatedAt: now,
      };

      // Upsert into assessments key
      let existing: Array<Assessment & { grade?: string; stream?: string }> = [];
      try {
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) existing = parsed;
        }
      } catch { /* ignore */ }
      const without = existing.filter((a) => a.id !== newAssessment.id);
      writeStorage(ASSESSMENTS_KEY, [...without, newAssessment]);

      // Also save to unified all_set_exams key (used by the grading dashboard)
      let allSetExams: Array<Assessment & { grade?: string; stream?: string }> = [];
      try {
        const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) allSetExams = parsed;
        }
      } catch { /* ignore */ }
      const withoutAll = allSetExams.filter((a) => a.id !== newAssessment.id);
      writeStorage(ALL_SET_EXAMS_KEY, [...withoutAll, newAssessment]);

      // Dispatch event so SetExamsList + Teacher Grading Dashboard + Marked Scripts
      // list refresh their dropdown options automatically.
      window.dispatchEvent(new Event("assessments_updated"));

      setIsPublished(true);
      setPublishedAssessmentId(newAssessment.id);
      setIsSaving(false);
      showSuccess("Assessment published — students can now take it!");
    } catch (e) {
      setIsSaving(false);
      showError("Failed to publish: " + (e instanceof Error ? e.message : String(e)));
    }
  }, [title, category, classLevel, selectedGrade, selectedStream, subject, duration, totalMarks, passingPercentage, questions, publishedAssessmentId]);

  // ── Derived values ────────────────────────────────────────────────────────
  const calculatedTotal = questions.reduce((s, q) => s + q.points, 0);
  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const structuredCount = questions.filter((q) => q.type === "structured").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 max-w-full">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          {/* Back to Repository */}
          <Button
            variant="ghost"
            onClick={() => navigate("/assessments/list")}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to Repository
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <FileQuestion className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Exam Creator</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Build a full assessment with MCQ and structured questions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl h-11 px-4 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
          >
            <Link to="/assessments/import">
              <Upload size={16} />
              Bulk Import via CSV
            </Link>
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isSaving}
            className="rounded-xl h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-100 gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Save size={16} />
                Publish Assessment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Published confirmation banner */}
      {isPublished && (
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-bold">Assessment Published Successfully!</p>
                <p className="text-sm text-white/80">
                  ID: <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{publishedAssessmentId}</code>
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="secondary"
              className="rounded-xl font-bold h-10 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <Link to="/assessments/student">Preview as Student →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Meta + Question Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Exam meta */}
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden lg:col-span-1">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen size={18} className="text-violet-600" />
              <h2 className="font-black text-slate-800">Exam Meta</h2>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Assessment Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Grade 4 Mathematics – Chapter 5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Category
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                {ASSESSMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Class <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Grade 4"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> Time (min)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Award size={10} /> Total Marks
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={totalMarks || calculatedTotal}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
                  className="rounded-xl h-11"
                  placeholder={String(calculatedTotal)}
                />
                <p className="text-[10px] text-slate-400">
                  Auto: <span className="font-bold text-slate-600">{calculatedTotal}</span> from questions
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Percent size={10} /> Passing Percentage
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 0)}
                  className="rounded-xl h-11"
                />
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, passingPercentage))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Question Builder */}
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-violet-600" />
                <h2 className="font-black text-slate-800">
                  {editingQuestionId ? "Edit Question" : "Add Question"}
                </h2>
              </div>
              {editingQuestionId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDraft}
                  className="rounded-lg h-8 text-xs font-bold text-slate-500 hover:text-red-600"
                >
                  <X size={14} className="mr-1" /> Cancel Edit
                </Button>
              )}
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              <button
                onClick={() => setDraftType("mcq")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                  draftType === "mcq"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ListChecks size={14} /> Multiple Choice
              </button>
              <button
                onClick={() => setDraftType("structured")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                  draftType === "structured"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Library size={14} /> Structured / Short Answer
              </button>
            </div>

            {/* Question prompt */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Question Prompt <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder={
                  draftType === "mcq"
                    ? "e.g. What is the value of x in 2x + 5 = 15?"
                    : "e.g. Explain the process of photosynthesis in your own words."
                }
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>

            {/* Type-specific fields */}
            {draftType === "mcq" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["a", "b", "c", "d"] as const).map((opt) => {
                    const valueMap = {
                      a: draftOptionA,
                      b: draftOptionB,
                      c: draftOptionC,
                      d: draftOptionD,
                    };
                    const setterMap = {
                      a: setDraftOptionA,
                      b: setDraftOptionB,
                      c: setDraftOptionC,
                      d: setDraftOptionD,
                    };
                    return (
                      <div
                        key={opt}
                        className={cn(
                          "rounded-xl border-2 p-3 transition-colors",
                          draftCorrectOption === opt
                            ? "border-emerald-400 bg-emerald-50/50"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setDraftCorrectOption(opt)}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border-2 transition-all",
                              draftCorrectOption === opt
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-slate-400 border-slate-300 hover:border-emerald-300"
                            )}
                            title="Mark as correct answer"
                          >
                            {opt.toUpperCase()}
                          </button>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Option {opt.toUpperCase()}
                            {draftCorrectOption === opt && (
                              <span className="ml-1 text-emerald-600">✓ Correct</span>
                            )}
                          </span>
                        </div>
                        <Input
                          placeholder={`Enter option ${opt.toUpperCase()}…`}
                          value={valueMap[opt]}
                          onChange={(e) => setterMap[opt](e.target.value)}
                          className="rounded-lg h-10"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  Click the letter badge to mark the correct answer. Options C and D are optional but
                  at least A and B are required.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Model Answer / Marking Key (Teacher Reference)
                </Label>
                <Textarea
                  placeholder="Enter the ideal answer or key points for grading reference…"
                  value={draftModelAnswer}
                  onChange={(e) => setDraftModelAnswer(e.target.value)}
                  className="rounded-xl min-h-[120px] font-mono text-sm"
                />
              </div>
            )}

            {/* Points */}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-2 w-32">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Points
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={draftPoints}
                  onChange={(e) => setDraftPoints(parseInt(e.target.value) || 1)}
                  className="rounded-xl h-11 text-center font-black"
                />
              </div>
              <Button
                onClick={handleAddOrUpdateQuestion}
                className="rounded-xl h-11 px-5 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold"
              >
                {editingQuestionId ? <Check size={16} /> : <Plus size={16} />}
                {editingQuestionId ? "Update Question" : "Add to List"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question List Preview */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ListChecks className="text-violet-600" size={18} />
            <h2 className="font-black text-slate-800">Question List Preview</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 font-bold">
              {questions.length} total
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold">
              {mcqCount} MCQ
            </Badge>
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 font-bold">
              {structuredCount} structured
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
              {calculatedTotal} pts
            </Badge>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileQuestion className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No questions yet</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Add your first question using the form above. You can mix MCQ and structured questions
              in the same exam.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;
              const isEditing = editingQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "transition-colors",
                    isEditing ? "bg-violet-50/40" : "hover:bg-slate-50/50"
                  )}
                >
                  {/* Question row */}
                  <div
                    className="px-6 py-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0",
                        q.type === "mcq"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-teal-100 text-teal-700"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold text-[10px] uppercase",
                            q.type === "mcq"
                              ? "bg-violet-50 text-violet-600 border-violet-200"
                              : "bg-teal-50 text-teal-600 border-teal-200"
                          )}
                        >
                          {q.type === "mcq" ? "MCQ" : "Structured"}
                        </Badge>
                        <span className="text-xs text-slate-400 font-bold">{q.points} pts</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {q.prompt || (
                          <span className="italic text-slate-400">No prompt yet…</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(q.id, "up");
                        }}
                        disabled={idx === 0}
                        className="rounded-lg h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(q.id, "down");
                        }}
                        disabled={idx === questions.length - 1}
                        className="rounded-lg h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditQuestion(q);
                        }}
                        className="rounded-lg h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit question"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id);
                        }}
                        className="rounded-lg h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pl-[88px] space-y-3">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {q.prompt}
                      </p>

                      {q.type === "mcq" && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const isCorrect = q.correctOptionId === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "flex items-center gap-2 p-2.5 rounded-xl border text-sm",
                                  isCorrect
                                    ? "bg-emerald-50 border-emerald-300"
                                    : "bg-white border-slate-200"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0",
                                    isCorrect
                                      ? "bg-emerald-500 text-white"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  )}
                                >
                                  {opt.label}
                                </div>
                                <span
                                  className={cn(
                                    "font-medium",
                                    isCorrect ? "text-emerald-900" : "text-slate-700"
                                  )}
                                >
                                  {opt.text || <span className="italic text-slate-400">empty</span>}
                                </span>
                                {isCorrect && (
                                  <CheckCircle size={14} className="ml-auto text-emerald-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "structured" && q.modelAnswer && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                            Model Answer
                          </p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {q.modelAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExamCreator;
