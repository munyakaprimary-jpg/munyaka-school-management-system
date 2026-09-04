"use client";

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Upload, Table2, AlertCircle, CheckCircle2, X, Trash2, ArrowLeft, FileText, BadgeCheck, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/types/questions";
// pdfjs-dist v3 is the last version that exports the legacy build compatible
// with Vite without requiring the .mjs worker rewrite. We use the legacy build
// for simplicity and broad browser support.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// Vite-friendly worker registration — point at the same legacy build's worker.
// This avoids the need to copy the worker into /public and keeps the bundle
// self-contained.
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

// Configure pdf.js to use the bundled worker. Done once at module load.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const ACTIVE_ASSESSMENT_ID_KEY = "csv_importer_active_assessment_id";
const ALL_SET_EXAMS_KEY = "all_set_exams";

// ─── CSV Row Shape ────────────────────────────────────────────────────────────

interface CSVRow {
  question_text: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: string;
}

interface ParsedQuestion extends CSVRow {
  rowIndex: number;
  errors: string[];
  isValid: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_TYPES = ["mcq", "structured", "essay", "short_answer"];
const VALID_ANSWERS_MCQ = ["a", "b", "c", "d", "A", "B", "C", "D"];

function validateRow(row: CSVRow, rowIndex: number): ParsedQuestion {
  const errors: string[] = [];

  if (!row.question_text?.trim()) {
    errors.push("question_text is required");
  }

  const normalizedType = (row.type || "").trim().toLowerCase();
  if (!normalizedType) {
    errors.push("type is required");
  } else if (!VALID_TYPES.includes(normalizedType)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  if (normalizedType === "mcq") {
    if (!row.option_a?.trim()) errors.push("option_a is required for MCQ");
    if (!row.option_b?.trim()) errors.push("option_b is required for MCQ");
    if (!row.correct_answer?.trim()) {
      errors.push("correct_answer is required for MCQ");
    } else if (!VALID_ANSWERS_MCQ.includes(row.correct_answer.trim())) {
      errors.push("correct_answer must be A, B, C, or D for MCQ");
    }
  }

  const points = parseFloat(row.points);
  if (row.points && isNaN(points)) {
    errors.push("points must be a number");
  } else if (!isNaN(points) && points < 0) {
    errors.push("points cannot be negative");
  }

  return {
    ...row,
    rowIndex,
    errors,
    isValid: errors.length === 0,
  };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Partial<CSVRow> = {};
    headers.forEach((header, idx) => {
      (obj as Record<string, string>)[header] = values[idx]?.trim() || "";
    });
    rows.push(obj as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Question Converter ───────────────────────────────────────────────────────

// ─── PDF Text Extractor ───────────────────────────────────────────────────────

/**
 * Extracts plain text from an unprotected PDF using pdfjs-dist.
 * Returns an array of non-empty text lines.
 */
async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const lines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    const paragraphBlocks = pageText
      .split(/\n{2,}|\s{4,}/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    lines.push(...paragraphBlocks);
  }

  return lines;
}

// ─── PDF Line → CSV Row ────────────────────────────────────────────────────────

const QUESTION_PATTERNS = [
  /^(?:\d+)\.\s+(.+)/,
  /^Q(\d+)[.:\s]+(.+)/,
  /^\((\d+)\)\s*(.+)/,
  /^[Qq]uestion\s+(\d+)[.:]\s*(.+)/,
  /^(?:\d+)\)\s+(.+)/,
  /^QUESTION\s+(\d+)[.:]\s*(.+)/,
];

const OPTION_PATTERN = /^([A-D])\.\s*(.+)/i;
const ANSWER_PATTERN = /^(?:answer|correct|answer is|right answer)[:\s]+([A-D])\b/i;
const POINTS_PATTERN  = /^(?:points|marks)[:\s]+(\d+)/i;

/**
 * Detects question-numbering patterns in extracted PDF lines and groups
 * them into individual CSVRow entries.
 */
function groupPDFLinesToRows(lines: string[]): CSVRow[] {
  const rows: CSVRow[] = [];
  let current: Partial<CSVRow> = {};

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    let isNewQuestion = false;
    for (const pattern of QUESTION_PATTERNS) {
      const match = raw.match(pattern);
      if (match) {
        if (current.question_text) {
          rows.push(current as CSVRow);
        }
        current = {
          question_text: match[2] ?? match[1],
          type: "mcq",
        };
        isNewQuestion = true;
        break;
      }
    }
    if (isNewQuestion) continue;

    const optionMatch = raw.match(OPTION_PATTERN);
    if (optionMatch && current.question_text) {
      const key = `option_${optionMatch[1].toLowerCase()}` as keyof CSVRow;
      (current as Record<string, string>)[key] = optionMatch[2];
      continue;
    }

    const answerMatch = raw.match(ANSWER_PATTERN);
    if (answerMatch && current.question_text) {
      current.correct_answer = answerMatch[1].toUpperCase();
      continue;
    }

    const pointsMatch = raw.match(POINTS_PATTERN);
    if (pointsMatch && current.question_text) {
      current.points = pointsMatch[1];
      continue;
    }

    if (current.question_text) {
      current.question_text = (current.question_text as string) + " " + raw;
    }
  }

  if (current.question_text) {
    rows.push(current as CSVRow);
  }

  return rows;
}

async function parsePDF(file: File): Promise<CSVRow[]> {
  const lines = await extractTextFromPDF(file);
  if (lines.length === 0) return [];
  return groupPDFLinesToRows(lines);
}

// ─── Question Converter ────────────────────────────────────────────────────────

function csvRowToQuestion(row: CSVRow, index: number): Question {
  const type: QuestionType = row.type?.trim().toLowerCase() === "structured" ? "structured" : "mcq";
  const correctAnswerNormalized = (row.correct_answer || "").trim().toLowerCase();

  const options =
    type === "mcq"
      ? [
          { id: "a", label: "A", text: row.option_a?.trim() || "" },
          { id: "b", label: "B", text: row.option_b?.trim() || "" },
          ...(row.option_c?.trim()
            ? [{ id: "c" as const, label: "C" as const, text: row.option_c?.trim() || "" }]
            : []),
          ...(row.option_d?.trim()
            ? [{ id: "d" as const, label: "D" as const, text: row.option_d?.trim() || "" }]
            : []),
        ].filter((o) => o.text)
      : undefined;

  const correctOptionId =
    type === "mcq" && options
      ? options.find((o) => o.id === correctAnswerNormalized)?.id || options[0]?.id
      : undefined;

  return {
    id: `q_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    prompt: row.question_text?.trim() || "",
    points: parseFloat(row.points) || (type === "mcq" ? 1 : 5),
    order: index + 1,
    options,
    correctOptionId,
    modelAnswer: type === "structured" ? "" : undefined,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CSVAssessmentImporterProps {
  /** Optional assessment ID to pre-select. If omitted, a new one is generated. */
  assessmentId?: string;
  /** Optional callback fired after questions are saved. */
  onSaved?: (assessmentId: string, count: number) => void;
}

const CSVAssessmentImporter: React.FC<CSVAssessmentImporterProps> = ({
  assessmentId: initialAssessmentId,
  onSaved,
}) => {
  const navigate = useNavigate();
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string>(() => {
    if (initialAssessmentId) return initialAssessmentId;
    const stored = localStorage.getItem(ACTIVE_ASSESSMENT_ID_KEY);
    if (stored) return stored;
    const generated = `assessment_${Date.now()}`;
    localStorage.setItem(ACTIVE_ASSESSMENT_ID_KEY, generated);
    return generated;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Download Template ─────────────────────────────────────────────────────

  const handleDownloadTemplate = useCallback(() => {
    const headers = [
      "question_text",
      "type",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_answer",
      "points",
    ];

    const sampleRows = [
      [
        '"What is 2 + 2?"',
        "mcq",
        '"4"',
        '"3"',
        '"5"',
        '"22"',
        "A",
        "1",
      ],
      [
        '"Explain the water cycle in your own words."',
        "structured",
        "",
        "",
        "",
        "",
        "",
        "5",
      ],
    ];

    const csvContent = [headers.join(","), ...sampleRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assessment_questions_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess("CSV template downloaded successfully!");
  }, []);

  // ── File Upload & Parse ───────────────────────────────────────────────────

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

      if (!isCSV && !isPDF) {
        showError("Please upload a .csv or .pdf file.");
        return;
      }

      setFileName(file.name);

      if (isPDF) {
        try {
          const rows = await parsePDF(file);
          if (rows.length === 0) {
            showError("PDF did not contain any detectable questions.");
            return;
          }

          const validated = rows.map((row, i) => validateRow(row, i + 1));
          setParsedQuestions(validated);

          const validCount = validated.filter((q) => q.isValid).length;
          const invalidCount = validated.length - validCount;

          if (invalidCount === 0) {
            showSuccess(`All ${validCount} PDF questions parsed and valid!`);
          } else {
            showError(
              `${validCount} valid, ${invalidCount} with errors — fix them before saving.`
            );
          }
        } catch (err) {
          console.error("PDF parse error:", err);
          showError("Could not read this PDF. It may be scanned, encrypted, or unprotected text extraction is unsupported.");
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) {
          showError("Could not read file contents.");
          return;
        }

        const rows = parseCSV(text);
        if (rows.length === 0) {
          showError("CSV appears to be empty or has no data rows.");
          return;
        }

        const validated = rows.map((row, i) => validateRow(row, i + 1));
        setParsedQuestions(validated);

        const validCount = validated.filter((q) => q.isValid).length;
        const invalidCount = validated.length - validCount;

        if (invalidCount === 0) {
          showSuccess(`All ${validCount} rows parsed and valid!`);
        } else {
          showError(
            `${validCount} valid, ${invalidCount} with errors — fix them before saving.`
          );
        }
      };

      reader.onerror = () => showError("Failed to read the file.");
      reader.readAsText(file);
    },
    []
  );

  // ── Remove Row ─────────────────────────────────────────────────────────────

  const handleRemoveRow = useCallback((rowIndex: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== rowIndex));
  }, []);

  // ── Save to Assessment ──────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const validQuestions = parsedQuestions.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      showError("No valid questions to save. Fix all errors first.");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    try {
      const questions: Question[] = validQuestions.map((row, i) =>
        csvRowToQuestion(row, i)
      );

      // Read existing question bank
      const existingRaw = localStorage.getItem(QUESTION_BANK_KEY);
      let existingData: { metadata?: Record<string, unknown>; questions: Question[] } = {
        questions: [],
      };

      if (existingRaw) {
        try {
          existingData = JSON.parse(existingRaw);
          if (!Array.isArray(existingData.questions)) {
            existingData.questions = [];
          }
        } catch {
          existingData = { questions: [] };
        }
      }

      // Append new questions (avoid duplicates by question_text)
      const existingPrompts = new Set(existingData.questions.map((q) => q.prompt.trim().toLowerCase()));
      const newUnique = questions.filter((q) => !existingPrompts.has(q.prompt.trim().toLowerCase()));
      const mergedQuestions = [...existingData.questions, ...newUnique];

      // Re-index order
      const reIndexed = mergedQuestions.map((q, i) => ({ ...q, order: i + 1 }));
      const now = new Date().toISOString();

      const updatedBank = {
        ...existingData,
        metadata: {
          ...(existingData.metadata || {}),
          lastImportAssessmentId: currentAssessmentId,
          lastImportAt: now,
          lastImportCount: newUnique.length,
        },
        questions: reIndexed,
      };

      localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(updatedBank));
      localStorage.setItem(ACTIVE_ASSESSMENT_ID_KEY, currentAssessmentId);

      // ── Also save to assessments + all_set_exams so SetExamsList can see it ──
      const assessmentId = currentAssessmentId;
      const totalPoints = reIndexed.reduce((s, q) => s + (q.points || 0), 0);

      const newAssessment = {
        id: assessmentId,
        title: (existingData.metadata?.title as string) || `Imported Assessment ${new Date().toLocaleDateString()}`,
        category: (existingData.metadata?.category as string) || "Formative Quiz",
        classLevel: (existingData.metadata?.classLevel as string) || "Grade 4",
        subject: (existingData.metadata?.subject as string) || "General",
        duration: (existingData.metadata?.duration as number) || 60,
        totalMarks: (existingData.metadata?.totalMarks as number) || totalPoints,
        randomizeQuestions: false,
        showImmediateFeedback: false,
        status: "published" as const,
        questions: reIndexed,
        createdAt: (existingData.metadata as any)?.createdAt || now,
        updatedAt: now,
      };

      // Upsert into assessments
      let existingAssessments: any[] = [];
      try {
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) existingAssessments = JSON.parse(raw);
        if (!Array.isArray(existingAssessments)) existingAssessments = [];
      } catch { existingAssessments = []; }

      const without = existingAssessments.filter((a) => a.id !== assessmentId);
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify([...without, newAssessment]));

      // Upsert into all_set_exams
      let allSetExams: any[] = [];
      try {
        const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
        if (raw) allSetExams = JSON.parse(raw);
        if (!Array.isArray(allSetExams)) allSetExams = [];
      } catch { allSetExams = []; }

      const withoutAll = allSetExams.filter((a) => a.id !== assessmentId);
      localStorage.setItem(ALL_SET_EXAMS_KEY, JSON.stringify([...withoutAll, newAssessment]));

      // Dispatch update event so SetExamsList + StudentAssessmentPage refresh immediately
      window.dispatchEvent(new Event("assessments_updated"));

      const savedCount = newUnique.length;
      showSuccess(
        savedCount > 0
          ? `${savedCount} question(s) added to the question bank!`
          : "All questions already exist in the question bank."
      );
      setParsedQuestions([]);

      if (onSaved) {
        onSaved(currentAssessmentId, savedCount);
      }
    } catch (err) {
      console.error("CSV import save error:", err);
      showError("Failed to save questions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [parsedQuestions, currentAssessmentId, onSaved]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setParsedQuestions([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalRows = parsedQuestions.length;
  const validCount = parsedQuestions.filter((q) => q.isValid).length;
  const invalidCount = totalRows - validCount;

  return (
    <div className="space-y-6">
      {/* In-page Back arrow -> Assessment Repository */}
      <Button
        variant="ghost"
        onClick={() => navigate("/assessments/list")}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-100"
      >
        <ArrowLeft size={16} />
        Back to Repository
      </Button>

      {/* Header Card */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-10 pt-6 px-6">
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Bulk Import</span>
          </div>
          <CardTitle className="text-xl text-white">CSV Assessment Importer</CardTitle>
          <p className="text-white/70 text-sm mt-1">
            Download the template, fill in your questions, and import them into the active assessment.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="rounded-xl h-11 px-5 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all"
              onClick={handleDownloadTemplate}
            >
              <Download size={16} />
              Download CSV Template
            </Button>

            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .pdf,text/csv,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="inline-flex items-center justify-center rounded-xl h-11 px-5 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-100 transition-all w-full sm:w-auto">
                <Upload size={16} />
                {fileName ? `Change: ${fileName}` : "Select CSV or PDF File"}
              </span>
            </label>

            {parsedQuestions.length > 0 && (
              <Button
                variant="ghost"
                className="rounded-xl h-11 px-4 gap-2 text-slate-500 font-bold hover:text-red-600 hover:bg-red-50"
                onClick={handleReset}
              >
                <X size={16} />
                Clear
              </Button>
            )}
          </div>

          {/* File Format Support Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <BadgeCheck size={13} />
              Supports CSV &amp; Unprotected PDF Text Files
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
              <FileSpreadsheet size={11} />
              CSV
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
              <FileText size={11} />
              PDF
            </span>
          </div>

          {/* Assessment ID display */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Active Assessment ID:
            </span>
            <code className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {currentAssessmentId}
            </code>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} />
              CSV Format Guide
            </h4>
            <div className="text-xs text-amber-700 space-y-1">
              <p>
                <span className="font-semibold">question_text</span> — The question prompt (required)
              </p>
              <p>
                <span className="font-semibold">type</span> — Use{" "}
                <code className="bg-amber-100 px-1 rounded">mcq</code> or{" "}
                <code className="bg-amber-100 px-1 rounded">structured</code> (required)
              </p>
              <p>
                <span className="font-semibold">option_a, option_b, option_c, option_d</span> — Required
                for MCQ type
              </p>
              <p>
                <span className="font-semibold">correct_answer</span> — A, B, C, or D (required for MCQ)
              </p>
              <p>
                <span className="font-semibold">points</span> — Numeric value (default: 1 for MCQ, 5 for
                structured)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedQuestions.length > 0 && (
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Table2 size={18} className="text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Preview Questions</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {totalRows} row{totalRows !== 1 ? "s" : ""} parsed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle size={12} />
                    {invalidCount} error{invalidCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[240px]">
                      Question Text
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">
                      Options
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">
                      Answer
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">
                      Points
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">
                      Status
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {parsedQuestions.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={cn(
                        "transition-colors",
                        row.isValid ? "hover:bg-emerald-50/30" : "bg-red-50/30 hover:bg-red-50/50"
                      )}
                    >
                      <td className="px-4 py-3 text-xs font-bold text-slate-400">{row.rowIndex}</td>
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            "text-sm font-medium text-slate-800",
                            !row.question_text?.trim() && "text-red-400 italic"
                          )}
                        >
                          {row.question_text?.trim() || (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle size={12} /> Missing question text
                            </span>
                          )}
                        </p>
                        {row.errors.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {row.errors.map((err, i) => (
                              <p key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                                <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                                {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                            row.type?.trim().toLowerCase() === "mcq"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-teal-100 text-teal-700"
                          )}
                        >
                          {row.type?.trim() || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {["a", "b", "c", "d"].map((opt) => {
                            const val = row[`option_${opt}` as keyof CSVRow] as string;
                            if (!val?.trim()) return null;
                            return (
                              <div key={opt} className="flex items-start gap-1">
                                <span className="text-[10px] font-black text-slate-400 w-4 flex-shrink-0">
                                  {opt.toUpperCase()}.
                                </span>
                                <span className="text-xs text-slate-600 truncate">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.correct_answer?.trim() ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black text-sm">
                            {row.correct_answer.trim().toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700">
                          {row.points?.trim() || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 size={13} />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                            <AlertCircle size={13} />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveRow(row.rowIndex - 1)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Remove row"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                {invalidCount > 0
                  ? `${invalidCount} row${invalidCount !== 1 ? "s" : ""} with errors will be skipped.`
                  : "All rows are valid and ready to import."}
              </p>
              <Button
                onClick={handleSave}
                disabled={isSaving || validCount === 0}
                className="rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save {validCount} Question{validCount !== 1 ? "s" : ""} to Assessment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {parsedQuestions.length === 0 && (
        <Card className="border-2 border-dashed border-slate-200 rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Table2 size={28} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-600 mb-1">No Questions Parsed Yet</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Download the CSV template, fill in your questions, then upload the file to preview them
              here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVAssessmentImporter;
