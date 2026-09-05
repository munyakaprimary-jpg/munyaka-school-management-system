"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ListChecks,
  Clock,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Save,
  RotateCcw,
  FileText,
  GripVertical,
  AlertCircle,
  Eye,
  FileQuestion,
  Layers,
  ImagePlus,
  X,
} from "lucide-react";
import type { Question, QuestionType, Assessment, MCQOption } from "@/types/questions";

const STORAGE_KEY = "question_bank";
const ASSESSMENT_STORAGE_KEY = "assessments";

const ASSESSMENT_CATEGORIES = [
  { value: "formative", label: "Formative Quiz" },
  { value: "summative", label: "Summative Quiz" },
  { value: "midterm", label: "Mid-Term Exam" },
  { value: "endterm", label: "End-Term Exam" },
  { value: "revision", label: "Revision Test" },
];

const CLASS_LEVELS = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];

const SUBJECTS = [
  { value: "mathematics", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "social-studies", label: "Social Studies" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
];

// ─── QuestionCreator Image Field ────────────────────────────────────────────────────

interface QCImageFieldProps {
  imageUrl: string | null;
  position: "above" | "between" | "below";
  onRemove: () => void;
  onPositionChange: (pos: "above" | "between" | "below") => void;
  onImageSelected: (dataUrl: string) => void;
}

const QCImageField: React.FC<QCImageFieldProps> = ({
  imageUrl,
  position,
  onRemove,
  onPositionChange,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("Image is too large. Please use an image under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) onImageSelected(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="max-h-56 mx-auto object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-all cursor-pointer">
          <ImagePlus className="w-4 h-4" />
          Attach Image / Diagram
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {imageUrl && (
        <div className="space-y-1.5">
          <Label className="text-slate-700 font-semibold text-xs">Image Placement</Label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {([
              { value: "above" as const, label: "Top", full: "Above Prompt" },
              { value: "between" as const, label: "Between", full: "Between Context & Question" },
              { value: "below" as const, label: "Below", full: "Below Prompt" },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPositionChange(opt.value)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  position === opt.value
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title={opt.full}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            {position === "above" && "Image renders at the very top of the question."}
            {position === "between" && "Image renders between the context statement and the question prompt."}
            {position === "below" && "Image renders directly under the question prompt."}
          </p>
        </div>
      )}
    </div>
  );
};

const QuestionCreator = () => {
  // Assessment metadata
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [randomize, setRandomize] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeQuestionType, setActiveQuestionType] = useState<QuestionType>("mcq");

  // Dialogs
  const [showPreview, setShowPreview] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load saved question bank on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.questions) {
          setQuestions(parsed.questions);
        }
        if (parsed && parsed.metadata) {
          setTitle(parsed.metadata.title || "");
          setCategory(parsed.metadata.category || "");
          setClassLevel(parsed.metadata.classLevel || "");
          setSubject(parsed.metadata.subject || "");
          setDuration(parsed.metadata.duration || 60);
          setTotalMarks(parsed.metadata.totalMarks || 100);
          setRandomize(parsed.metadata.randomize || false);
          setShowFeedback(parsed.metadata.showFeedback ?? true);
        }
      }
    } catch (e) {
      console.error("Failed to load question bank:", e);
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      prompt: "",
      points: type === "mcq" ? 1 : 5,
      order: questions.length + 1,
      options:
        type === "mcq"
          ? [
              { id: "a", label: "A", text: "" },
              { id: "b", label: "B", text: "" },
              { id: "c", label: "C", text: "" },
              { id: "d", label: "D", text: "" },
            ]
          : undefined,
      modelAnswer: type === "structured" ? "" : undefined,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setExpandedQuestions((prev) => new Set(prev).add(newQuestion.id));
  };

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  const deleteQuestion = (id: string) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, order: i + 1 }))
    );
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const newQuestions = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]];
      return newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  // MCQ: add/remove options
  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    const newLabel = String.fromCharCode(97 + question.options.length); // e, f, g...
    const newOption: MCQOption = { id: newLabel, label: newLabel.toUpperCase(), text: "" };

    updateQuestion(questionId, { options: [...question.options, newOption] });
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options || question.options.length <= 2) return;

    const newOptions = question.options
      .filter((o) => o.id !== optionId)
      .map((o, i) => ({ ...o, id: String.fromCharCode(97 + i), label: String.fromCharCode(65 + i) }));

    updateQuestion(questionId, {
      options: newOptions,
      correctOptionId:
        question.correctOptionId === optionId ? newOptions[0]?.id : question.correctOptionId,
    });
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    updateQuestion(questionId, {
      options: question.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
    });
  };

  const setCorrectOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, { correctOptionId: optionId });
  };

  const handleSave = () => {
    if (!(title ?? '').trim()) {
      setShowSaveDialog(true);
      return;
    }
    setSaveStatus("saving");

    setTimeout(() => {
      const data = {
        metadata: { title, category, classLevel, subject, duration, totalMarks, randomize, showFeedback },
        questions,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 300);
  };

  const handleReset = () => {
    setQuestions([]);
    setTitle("");
    setCategory("");
    setClassLevel("");
    setSubject("");
    setDuration(60);
    setTotalMarks(100);
    setRandomize(false);
    setShowFeedback(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handlePreview = () => {
    const assessment: Assessment = {
      id: `preview_${Date.now()}`,
      title,
      category,
      classLevel,
      subject,
      duration,
      totalMarks,
      randomizeQuestions: randomize,
      showImmediateFeedback: showFeedback,
      questions: questions.map((q, i) => ({ ...q, order: i + 1 })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPreviewAssessment(assessment);
    setShowPreview(true);
  };

  const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Question Creator</h1>
              <p className="text-sm text-slate-500">Build your question bank</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
              <ListChecks className="w-3.5 h-3.5 mr-1" />
              {questions.length} Questions
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Assessment Metadata */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 pb-10 pt-8 px-6">
            <div className="flex items-center gap-2 text-white/90 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wide">Assessment Setup</span>
            </div>
            <CardTitle className="text-2xl text-white">Assessment Details</CardTitle>
            <CardDescription className="text-white/70">
              Configure the basic information for this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Assessment Title</Label>
                <Input
                  placeholder="e.g., Chapter 5 - Algebra Fundamentals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Class Level</Label>
                <Select value={classLevel} onValueChange={setClassLevel}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Duration (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="h-11 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Total Marks (auto-calculated)</Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    min={1}
                    value={calculatedTotalMarks}
                    disabled
                    className="h-11 pl-10 rounded-xl bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={randomize}
                  onChange={(e) => setRandomize(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-violet-600"
                />
                <span className="text-slate-700 font-medium">Randomize Questions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeedback}
                  onChange={(e) => setShowFeedback(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-violet-600"
                />
                <span className="text-slate-700 font-medium">Show Immediate Feedback</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Question Type Selector */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveQuestionType("mcq")}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeQuestionType === "mcq"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300"
              }`}
            >
              📝 Multiple Choice (MCQ)
            </button>
            <button
              onClick={() => setActiveQuestionType("structured")}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeQuestionType === "structured"
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
              }`}
            >
              📄 Structured / Essay
            </button>
          </div>
          <Button
            onClick={() => addQuestion(activeQuestionType)}
            className={`rounded-xl font-semibold ${
              activeQuestionType === "mcq"
                ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                : "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeQuestionType === "mcq" ? "MCQ" : "Structured"} Question
          </Button>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 rounded-3xl">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FileQuestion className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No questions yet</h3>
              <p className="text-slate-500 mb-4">
                Add your first question using the button above
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);
              const isMCQ = question.type === "mcq";
              const accentColor = isMCQ ? "violet" : "teal";

              return (
                <Card
                  key={question.id}
                  className={`border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? isMCQ
                        ? "ring-2 ring-violet-400 shadow-violet-100"
                        : "ring-2 ring-teal-400 shadow-teal-100"
                      : ""
                  }`}
                >
                  {/* Question Header */}
                  <div
                    className={`flex items-center gap-4 p-4 cursor-pointer ${
                      isMCQ ? "bg-gradient-to-r from-violet-50 to-purple-50/50" : "bg-gradient-to-r from-teal-50 to-emerald-50/50"
                    }`}
                    onClick={() => toggleExpand(question.id)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`${
                            isMCQ
                              ? "bg-violet-100 text-violet-700 border-violet-200"
                              : "bg-teal-100 text-teal-700 border-teal-200"
                          }`}
                        >
                          Q{index + 1}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={isMCQ ? "bg-violet-50 text-violet-600" : "bg-teal-50 text-teal-600"}
                        >
                          {isMCQ ? "Multiple Choice" : "Structured"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {question.contextStatement && (
                          <span className="inline-flex items-center gap-1 mr-1 text-violet-500 font-medium">
                            [Context]
                          </span>
                        )}
                        {question.prompt || <span className="italic text-slate-400">No prompt yet...</span>}
                      </p>
                      {question.imageUrl && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <ImagePlus className="w-3 h-3 text-indigo-400" />
                          <span className="text-[10px] text-indigo-400 font-medium">
                            Image · {question.imagePosition || "below"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-700">{question.points}</span>
                        <span className="text-xs text-slate-400 ml-1">pts</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <CardContent className="p-5 space-y-5 border-t border-slate-100">
                      {/* Image — appears ABOVE context when "Above Prompt" is selected */}
                      {(question.imagePosition || "below") === "above" && question.imageUrl && (
                        <QCImageField
                          imageUrl={question.imageUrl}
                          position={question.imagePosition || "below"}
                          onRemove={() => updateQuestion(question.id, { imageUrl: undefined })}
                          onPositionChange={(pos) => updateQuestion(question.id, { imagePosition: pos })}
                          onImageSelected={(dataUrl) => updateQuestion(question.id, { imageUrl: dataUrl })}
                        />
                      )}

                      {/* Context / Intro Statement */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-2">
                          Context / Intro Statement
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200 font-normal">
                            optional
                          </Badge>
                        </Label>
                        <Textarea
                          placeholder="Optional general description or intro shown above the question prompt (e.g. a shared reading passage or scenario)."
                          value={question.contextStatement || ""}
                          onChange={(e) => updateQuestion(question.id, { contextStatement: e.target.value })}
                          className="min-h-[80px] rounded-xl"
                        />
                      </div>

                      {/* Image — appears BETWEEN context and prompt when "Between" is selected */}
                      {(question.imagePosition || "below") === "between" && question.imageUrl && (
                        <QCImageField
                          imageUrl={question.imageUrl}
                          position={question.imagePosition || "below"}
                          onRemove={() => updateQuestion(question.id, { imageUrl: undefined })}
                          onPositionChange={(pos) => updateQuestion(question.id, { imagePosition: pos })}
                          onImageSelected={(dataUrl) => updateQuestion(question.id, { imageUrl: dataUrl })}
                        />
                      )}

                      {/* No image yet — show attach button as the first image slot */}
                      {!question.imageUrl && (
                        <QCImageField
                          imageUrl={null}
                          position={question.imagePosition || "below"}
                          onRemove={() => updateQuestion(question.id, { imageUrl: undefined })}
                          onPositionChange={(pos) => updateQuestion(question.id, { imagePosition: pos })}
                          onImageSelected={(dataUrl) => updateQuestion(question.id, { imageUrl: dataUrl })}
                        />
                      )}

                      {/* Question Prompt */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-2">
                          Question Prompt
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          placeholder={
                            isMCQ
                              ? "e.g., What is the value of x in the equation 2x + 5 = 15?"
                              : "Enter your structured question or essay prompt here..."
                          }
                          value={question.prompt}
                          onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })}
                          className="min-h-[100px] rounded-xl"
                        />
                      </div>

                      {/* Image — appears BELOW prompt when "Below Prompt" is selected */}
                      {(question.imagePosition || "below") === "below" && question.imageUrl && (
                        <QCImageField
                          imageUrl={question.imageUrl}
                          position={question.imagePosition || "below"}
                          onRemove={() => updateQuestion(question.id, { imageUrl: undefined })}
                          onPositionChange={(pos) => updateQuestion(question.id, { imagePosition: pos })}
                          onImageSelected={(dataUrl) => updateQuestion(question.id, { imageUrl: dataUrl })}
                        />
                      )}

                      {/* MCQ Options */}
                      {isMCQ && question.options && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-700 font-semibold">Answer Options</Label>
                            <span className="text-xs text-slate-500">
                              Click the radio button to mark correct answer
                            </span>
                          </div>
                          <div className="space-y-3">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                  question.correctOptionId === option.id
                                    ? "border-emerald-400 bg-emerald-50"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct_${question.id}`}
                                  checked={question.correctOptionId === option.id}
                                  onChange={() => setCorrectOption(question.id, option.id)}
                                  className="w-5 h-5 accent-emerald-600"
                                />
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 shadow-sm">
                                  {option.label}
                                </div>
                                <Input
                                  placeholder={`Option ${option.label}`}
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                  className="flex-1 h-10 rounded-lg"
                                />
                                {question.options && question.options.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOption(question.id, option.id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.id)}
                            className="rounded-lg border-dashed"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {/* Structured: Points, Model Answer */}
                      {!isMCQ && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-700 font-semibold">Point Value</Label>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={question.points}
                                onChange={(e) =>
                                  updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })
                                }
                                className="h-11 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold flex items-center gap-2">
                              Model Answer / Marking Key
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                                Teacher Reference
                              </Badge>
                            </Label>
                            <Textarea
                              placeholder="Enter the ideal answer or key points for grading reference..."
                              value={question.modelAnswer || ""}
                              onChange={(e) =>
                                updateQuestion(question.id, { modelAnswer: e.target.value })
                              }
                              className="min-h-[150px] rounded-xl font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* MCQ Points */}
                      {isMCQ && (
                        <div className="space-y-2 max-w-[200px]">
                          <Label className="text-slate-700 font-semibold">Point Value</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })
                            }
                            className="h-11 rounded-xl"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestion(question.id, "up")}
                            disabled={index === 0}
                            className="rounded-lg"
                          >
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestion(question.id, "down")}
                            disabled={index === questions.length - 1}
                            className="rounded-lg"
                          >
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Down
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          className="rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="h-12 rounded-xl border-2 border-slate-200 font-semibold"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={questions.length === 0}
            className="h-12 rounded-xl border-2 border-slate-200 font-semibold"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Assessment
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className={`h-12 rounded-xl font-semibold flex-1 ${
              saveStatus === "saved"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : saveStatus === "saved" ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Question Bank
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Title Required
            </DialogTitle>
            <DialogDescription>
              Please enter an assessment title before saving the question bank.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-slate-700 font-semibold">Assessment Title</Label>
            <Input
              placeholder="e.g., Chapter 5 - Algebra Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 h-11 rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSaveDialog(false)} className="rounded-xl">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-600" />
              Assessment Preview
            </DialogTitle>
            <DialogDescription>
              This is how students will see the assessment
            </DialogDescription>
          </DialogHeader>
          {previewAssessment && (
            <div className="py-4 space-y-4">
              <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
                <h3 className="font-bold text-lg text-slate-800">{previewAssessment.title || "Untitled Assessment"}</h3>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-600">
                  {previewAssessment.category && (
                    <Badge variant="outline">{previewAssessment.category}</Badge>
                  )}
                  {previewAssessment.classLevel && (
                    <Badge variant="outline">Class {previewAssessment.classLevel}</Badge>
                  )}
                  {previewAssessment.subject && (
                    <Badge variant="outline">{previewAssessment.subject}</Badge>
                  )}
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {previewAssessment.duration} min
                  </Badge>
                  <Badge variant="outline">
                    <FileText className="w-3 h-3 mr-1" />
                    {previewAssessment.totalMarks} marks
                  </Badge>
                </div>
              </div>
              {previewAssessment.questions.map((q, i) => {
                const position = q.imagePosition || "below";
                return (
                  <div key={q.id} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-700 font-bold text-sm shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        {q.contextStatement && (
                          <div className="text-sm text-slate-600 italic bg-violet-50/60 border-l-4 border-violet-300 px-3 py-2 rounded-r-lg">
                            {q.contextStatement}
                          </div>
                        )}
                        {position === "above" && q.imageUrl && (
                          <div className="flex justify-center">
                            <img
                              src={q.imageUrl}
                              alt="Question diagram"
                              className="max-h-48 rounded-xl border border-slate-200 object-contain"
                            />
                          </div>
                        )}
                        {position === "between" && q.imageUrl && (
                          <div className="flex justify-center">
                            <img
                              src={q.imageUrl}
                              alt="Question diagram"
                              className="max-h-48 rounded-xl border border-slate-200 object-contain"
                            />
                          </div>
                        )}
                        <p className="font-medium text-slate-800">{q.prompt || "No prompt"}</p>
                        {position === "below" && q.imageUrl && (
                          <div className="flex justify-center">
                            <img
                              src={q.imageUrl}
                              alt="Question diagram"
                              className="max-h-48 rounded-xl border border-slate-200 object-contain"
                            />
                          </div>
                        )}
                        {q.type === "mcq" && q.options && (
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                              >
                                <div className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-xs">
                                  {opt.label}
                                </div>
                                <span className="text-slate-600">{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "structured" && (
                          <div className="mt-3 p-4 rounded-lg bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400 text-center">
                            Student response area
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-slate-50 shrink-0">
                        {q.points} pts
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)} className="rounded-xl">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionCreator;
