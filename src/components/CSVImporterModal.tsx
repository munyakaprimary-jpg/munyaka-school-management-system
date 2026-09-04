"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import {
  Upload,
  FileDown,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { Question, QuestionType } from "@/types/questions";

const QUESTION_BANK_KEY = "question_bank";

/** Column headers for the CSV template */
const CSV_HEADERS = [
  "question_text",
  "type",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "points",
  "model_answer",
  "rubric",
];

const QUESTION_BANK_KEYS = ["question_text", "question", "prompt", "text"] as const;
const TYPE_KEYS = ["type", "question_type", "qtype"] as const;
const OPTION_A_KEYS = ["option_a", "option_a", "a", "opt_a"] as const;
const OPTION_B_KEYS = ["option_b", "option_b", "b", "opt_b"] as const;
const OPTION_C_KEYS = ["option_c", "option_c", "c", "opt_c"] as const;
const OPTION_D_KEYS = ["option_d", "option_d", "d", "opt_d"] as const;
const CORRECT_KEYS = ["correct_answer", "correct", "answer", "correct_opt", "correct_option", "key"] as const;
const POINTS_KEYS = ["points", "score", "marks", "point", "mark"] as const;
const MODEL_ANSWER_KEYS = ["model_answer", "model", "modelanswer", "answer_key", "solution"] as const;
const RUBRIC_KEYS = ["rubric", "marking_guide", "rubric_notes", "rubric_guide"] as const;

function normalize(str: string | undefined): string {
  return (str || "").trim();
}

function findField(row: Record<string, string>, keys: readonly string[]): string {
  const lower = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
    acc[k.toLowerCase().trim()] = k;
    return acc;
  }, {});
  for (const key of keys) {
    if (lower[key]) return normalize(row[lower[key]]);
  }
  return "";
}

function parseType(raw: string): QuestionType {
  const t = raw.toLowerCase().trim();
  if (t === "mcq" || t === "multiple choice" || t === "multiple" || t === "choice") return "mcq";
  return "structured";
}

function parsePoints(raw: string): number {
  const n = parseFloat(raw);
  return isNaN(n) || n <= 0 ? 5 : Math.round(n);
}

/** Map letter correct_answer → option id */
function mapCorrectOption(letter: string): string {
  const map: Record<string, string> = {
    a: "a", b: "b", c: "c", d: "d",
    A: "a", B: "b", C: "c", D: "d",
    "1": "a", "2": "b", "3": "c", "4": "d",
  };
  return map[letter.trim()] ?? "a";
}

export interface ParsedQuestionRow {
  rowIndex: number;
  question_text: string;
  type: QuestionType;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  model_answer: string;
  rubric: string;
  isValid: boolean;
  errors: string[];
}

interface CSVImporterModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
  existingCount: number;
}

export default function CSVImporterModal({
  open,
  onClose,
  onImport,
  existingCount,
}: CSVImporterModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasParsed, setHasParsed] = useState(false);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setParsedRows([]);
    setIsParsing(false);
    setIsSaving(false);
    setHasParsed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── 1. Download CSV Template ──────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const rows = [
      CSV_HEADERS.join(","),
      // Example MCQ row
      [
        "What is 5 + 3?",
        "mcq",
        "6",
        "8",
        "10",
        "12",
        "b",
        "1",
        "",
        "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
      // Example structured row
      [
        "Explain the water cycle in your own words.",
        "structured",
        "",
        "",
        "",
        "",
        "",
        "5",
        "The water cycle describes how water evaporates from surfaces, forms clouds, and returns as precipitation.",
        "Award full marks for describing evaporation, condensation, and precipitation in sequence.",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assessment_questions_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    showSuccess("CSV template downloaded!");
  };

  // ── 2. Parse CSV ──────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      showError("Please upload a .csv file");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setHasParsed(false);
    setParsedRows([]);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

      if (lines.length < 2) {
        showError("CSV must have a header row and at least one data row.");
        setIsParsing(false);
        return;
      }

      // Parse header
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);

      const results: ParsedQuestionRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] ?? "";
        });

        const question_text = findField(row, QUESTION_BANK_KEYS);
        const typeRaw = findField(row, TYPE_KEYS);
        const option_a = findField(row, OPTION_A_KEYS);
        const option_b = findField(row, OPTION_B_KEYS);
        const option_c = findField(row, OPTION_C_KEYS);
        const option_d = findField(row, OPTION_D_KEYS);
        const correct_answer = findField(row, CORRECT_KEYS);
        const points = parsePoints(findField(row, POINTS_KEYS));
        const model_answer = findField(row, MODEL_ANSWER_KEYS);
        const rubric = findField(row, RUBRIC_KEYS);
        const type = parseType(typeRaw);

        const errors: string[] = [];
        if (!question_text) errors.push("Missing question_text");
        if (type === "mcq") {
          if (!option_a) errors.push("Missing option_a");
          if (!option_b) errors.push("Missing option_b");
          if (!correct_answer) errors.push("Missing correct_answer");
        }

        results.push({
          rowIndex: i + 1,
          question_text,
          type,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          points,
          model_answer,
          rubric,
          isValid: errors.length === 0,
          errors,
        });
      }

      setParsedRows(results);
      setHasParsed(true);

      const validCount = results.filter((r) => r.isValid).length;
      if (validCount === 0) {
        showError("No valid questions found in the CSV. Check your column headers.");
      } else {
        showSuccess(`Parsed ${validCount} question${validCount !== 1 ? "s" : ""} (${results.length - validCount} with errors)`);
      }
    } catch (err) {
      console.error("CSV parse error:", err);
      showError("Failed to parse CSV file. Make sure it is a valid CSV.");
    } finally {
      setIsParsing(false);
    }
  };

  // ── 3. Save to Assessment ───────────────────────────────────────────────
  const handleSaveToAssessment = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showError("No valid questions to import.");
      return;
    }

    setIsSaving(true);

    try {
      const newQuestions: Question[] = validRows.map((row, idx) => {
        const base = {
          id: `q_csv_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
          prompt: row.question_text,
          points: row.points,
          order: existingCount + idx + 1,
          modelAnswer: row.model_answer || undefined,
          rubric: row.rubric || undefined,
        };

        if (row.type === "mcq") {
          const options = [
            { id: "a", label: "A", text: row.option_a },
            { id: "b", label: "B", text: row.option_b },
          ];
          if (row.option_c) options.push({ id: "c", label: "C", text: row.option_c });
          if (row.option_d) options.push({ id: "d", label: "D", text: row.option_d });

          return {
            ...base,
            type: "mcq" as QuestionType,
            options,
            correctOptionId: mapCorrectOption(row.correct_answer),
          };
        }

        return {
          ...base,
          type: "structured" as QuestionType,
        };
      });

      onImport(newQuestions);

      // Also persist directly to question_bank for immediate availability
      try {
        const stored = localStorage.getItem(QUESTION_BANK_KEY);
        const existing = stored ? JSON.parse(stored) : { metadata: {}, questions: [] };
        existing.questions = [...(existing.questions || []), ...newQuestions];
        localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(existing));
      } catch { /* best-effort */ }

      showSuccess(`Imported ${newQuestions.length} question${newQuestions.length !== 1 ? "s" : ""}!`);
      setTimeout(() => {
        resetState();
        onClose();
      }, 400);
    } catch (err) {
      console.error("Save error:", err);
      showError("Failed to save imported questions.");
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={20} className="text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Import Questions from CSV
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Upload a CSV file or download the template below.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-1">
          {/* ── Step 1: Template ────────────────────────────────────────── */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <FileDown size={16} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">Step 1 — Download the Template</h3>
                <p className="text-xs text-indigo-700 mb-3">
                  Download the CSV template to see the exact column format. Fill it in and upload below.
                </p>
                <Button
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
                >
                  <FileDown size={14} />
                  Download CSV Template
                </Button>
              </div>
            </div>
          </div>

          {/* CSV column reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              CSV Column Reference
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 pr-4 font-semibold text-slate-600">Column</th>
                    <th className="text-left py-1.5 pr-4 font-semibold text-slate-600">Required</th>
                    <th className="text-left py-1.5 font-semibold text-slate-600">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {[
                    { col: "question_text", req: "Yes", note: "The question prompt text" },
                    { col: "type", req: "Yes", note: '"mcq" or "structured"' },
                    { col: "option_a", req: "For MCQ", note: "Text for option A" },
                    { col: "option_b", req: "For MCQ", note: "Text for option B" },
                    { col: "option_c", req: "Optional", note: "Text for option C" },
                    { col: "option_d", req: "Optional", note: "Text for option D" },
                    { col: "correct_answer", req: "For MCQ", note: "a, b, c, or d (letter of the correct option)" },
                    { col: "points", req: "No", note: "Default: 5 pts if omitted" },
                    { col: "model_answer", req: "For structured", note: "Reference answer for marking" },
                    { col: "rubric", req: "No", note: "Marking notes / guidance for the teacher" },
                  ].map((row) => (
                    <tr key={row.col} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-indigo-600">{row.col}</td>
                      <td className={`py-1.5 pr-4 font-medium ${row.req === "Yes" ? "text-emerald-600" : row.req === "For MCQ" ? "text-amber-600" : "text-slate-400"}`}>
                        {row.req}
                      </td>
                      <td className="py-1.5 text-slate-500">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Step 2: Upload ─────────────────────────────────────────── */}
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload-input"
            />
            <label
              htmlFor="csv-upload-input"
              className="flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                {isParsing ? (
                  <Loader2 size={22} className="text-indigo-500 animate-spin" />
                ) : selectedFile ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                  <Upload size={22} className="text-indigo-500" />
                )}
              </div>
              <div>
                {isParsing ? (
                  <p className="text-sm font-semibold text-slate-700">Parsing CSV…</p>
                ) : selectedFile ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to choose a different file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">
                      Drop your CSV here or <span className="text-indigo-600 underline">click to browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Accepts .csv files only</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* ── Step 3: Preview Table ────────────────────────────────────── */}
          {hasParsed && parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-indigo-500" />
                    Preview — {parsedRows.length} Row{parsedRows.length !== 1 ? "s" : ""} Detected
                  </h3>
                  {validCount > 0 && (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full px-2 py-0.5">
                      <CheckCircle2 size={10} className="mr-1" />
                      {validCount} valid
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-full px-2 py-0.5">
                      <AlertCircle size={10} className="mr-1" />
                      {errorCount} with errors
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-8">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-16">Status</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-20">Type</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Question Text</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-10">Pts</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Correct</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-16">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`border-b border-slate-100 last:border-0 ${
                            row.isValid ? "bg-white" : "bg-red-50/50"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-slate-400 font-medium">{row.rowIndex}</td>
                          <td className="px-3 py-2.5">
                            {row.isValid ? (
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : (
                              <div className="flex items-center gap-1 text-red-500">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-medium">Error</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border-0 ${
                                row.type === "mcq"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {row.type === "mcq" ? "MCQ" : "Structured"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 max-w-[240px]">
                            <p className={`font-medium truncate ${row.isValid ? "text-slate-800" : "text-red-700"}`}>
                              {row.question_text || "(no question text)"}
                            </p>
                            {!row.isValid && row.errors.length > 0 && (
                              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                                {row.errors.join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-semibold">{row.points}</td>
                          <td className="px-3 py-2.5">
                            {row.type === "mcq" ? (
                              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {row.correct_answer || "—"}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.type === "mcq" ? (
                              <div className="flex flex-col gap-0.5">
                                {[
                                  { label: "A", text: row.option_a },
                                  { label: "B", text: row.option_b },
                                  { label: "C", text: row.option_c },
                                  { label: "D", text: row.option_d },
                                ]
                                  .filter((o) => o.text)
                                  .map((opt) => (
                                    <span
                                      key={opt.label}
                                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                        opt.label.toLowerCase() === row.correct_answer.toLowerCase()
                                          ? "bg-emerald-100 text-emerald-700 font-bold"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {opt.label}. {opt.text}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                {row.model_answer ? "Model ✓" : "No model answer"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {hasParsed && parsedRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No questions found in this CSV.</p>
              <p className="text-xs text-slate-400 mt-1">Check that the header row is present and contains question_text.</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 pt-4 flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="h-10 rounded-xl border-slate-200 font-semibold gap-1.5"
          >
            <X size={15} />
            Cancel
          </Button>
          <Button
            onClick={handleSaveToAssessment}
            disabled={isSaving || !hasParsed || validCount === 0}
            className="h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <ChevronRight size={15} />
                Save {validCount > 0 ? validCount : ""} Question{validCount !== 1 ? "s" : ""} to Assessment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Parse a single CSV line, respecting double-quote delimited fields.
 * Handles: field,"field with , comma",field
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        current += '"';
        i++; // skip next
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
