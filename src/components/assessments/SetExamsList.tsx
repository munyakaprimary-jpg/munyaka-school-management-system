"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Eye,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  Search,
  Clock,
  Award,
  ListChecks,
  Library,
  FileQuestion,
  Calendar,
  Filter,
  Grid3x3,
  Table as TableIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Assessment, Question } from "@/types/questions";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const EXAM_STATUS_KEY = "exam_status_overrides";
const CLOSED_EXAMS_KEY = "closed_exams";

type ExamStatus = "Draft" | "Published" | "Closed";

interface ExamListItem {
  id: string;
  title: string;
  category: string;
  subject: string;
  classLevel: string;
  duration: number;
  totalMarks: number;
  questionCount: number;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
  source: "bank" | "saved";
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadStatusOverrides(): Record<string, ExamStatus> {
  try {
    const raw = localStorage.getItem(EXAM_STATUS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch { return {}; }
}

function saveStatusOverrides(map: Record<string, ExamStatus>) {
  try {
    localStorage.setItem(EXAM_STATUS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function loadClosedExams(): string[] {
  try {
    const raw = localStorage.getItem(CLOSED_EXAMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch { return []; }
}

function saveClosedExams(ids: string[]) {
  try {
    localStorage.setItem(CLOSED_EXAMS_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

function loadExams(): ExamListItem[] {
  const statusMap = loadStatusOverrides();
  const closed = new Set(loadClosedExams());
  const seen = new Set<string>();
  const items: ExamListItem[] = [];

  // 1. The "active" exam from the question bank
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions?.length > 0) {
        const id = parsed.metadata?.assessmentId || "assessment_bank_default";
        seen.add(id);
        const isClosed = closed.has(id);
        const status: ExamStatus = isClosed
          ? "Closed"
          : statusMap[id] || "Published";
        items.push({
          id,
          title: parsed.metadata?.title || "Untitled Assessment",
          category: parsed.metadata?.category || "Formative",
          subject: parsed.metadata?.subject || "—",
          classLevel: parsed.metadata?.classLevel || "—",
          duration: parsed.metadata?.duration || 60,
          totalMarks:
            parsed.metadata?.totalMarks ||
            (parsed.questions || []).reduce((s: number, q: any) => s + (q.points || 0), 0),
          questionCount: (parsed.questions || []).length,
          status,
          createdAt: parsed.savedAt || new Date().toISOString(),
          updatedAt: parsed.savedAt || new Date().toISOString(),
          source: "bank",
        });
      }
    }
  } catch { /* ignore */ }

  // 2. Saved assessments array
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => {
          if (seen.has(a.id)) return;
          seen.add(a.id);
          const isClosed = closed.has(a.id);
          const status: ExamStatus = isClosed ? "Closed" : statusMap[a.id] || "Published";
          items.push({
            id: a.id,
            title: a.title || "Untitled",
            category: a.category || "Formative",
            subject: a.subject || "—",
            classLevel: a.classLevel || "—",
            duration: a.duration || 60,
            totalMarks:
              a.totalMarks || (a.questions || []).reduce((s, q) => s + q.points, 0),
            questionCount: (a.questions || []).length,
            status,
            createdAt: a.createdAt || new Date().toISOString(),
            updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
            source: "saved",
          });
        });
      }
    }
  } catch { /* ignore */ }

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return items;
}

function loadFullAssessment(id: string): Assessment | null {
  // Try question bank first (active exam)
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const bankId = parsed.metadata?.assessmentId || "assessment_bank_default";
      if (bankId === id) {
        return {
          id: bankId,
          title: parsed.metadata?.title || "Untitled",
          category: parsed.metadata?.category || "Formative",
          classLevel: parsed.metadata?.classLevel || "—",
          subject: parsed.metadata?.subject || "—",
          duration: parsed.metadata?.duration || 60,
          totalMarks:
            parsed.metadata?.totalMarks ||
            (parsed.questions || []).reduce((s: number, q: any) => s + (q.points || 0), 0),
          randomizeQuestions: parsed.metadata?.randomize || false,
          showImmediateFeedback: parsed.metadata?.showFeedback ?? false,
          questions: parsed.questions || [],
          createdAt: parsed.savedAt || new Date().toISOString(),
          updatedAt: parsed.savedAt || new Date().toISOString(),
        };
      }
    }
  } catch { /* ignore */ }

  // Then try saved assessments
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      const found = parsed.find((a) => a.id === id);
      if (found) return found;
    }
  } catch { /* ignore */ }

  return null;
}

// ─── Printable Paper Builder ──────────────────────────────────────────────────
function buildPrintableHTML(exam: Assessment): string {
  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const questionsHTML = exam.questions
    .map((q, i) => {
      const qNum = i + 1;
      const typeLabel = q.type === "mcq" ? "Multiple Choice" : "Structured";

      if (q.type === "mcq" && q.options) {
        const optionsHTML = q.options
          .map(
            (opt) => `
          <div class="option-row">
            <span class="option-label">${opt.label}.</span>
            <span class="option-text">${opt.text || "(no text)"}</span>
          </div>`
          )
          .join("");

        return `
        <div class="question-block">
          <div class="question-header">
            <span class="q-num">${qNum}.</span>
            <span class="q-prompt">${q.prompt}</span>
            <span class="q-points">[${q.points} ${q.points === 1 ? "mark" : "marks"}]</span>
          </div>
          <div class="options-list">${optionsHTML}</div>
          <div class="answer-line"><span class="answer-label">Student's Answer:</span> ______</div>
        </div>`;
      } else {
        return `
        <div class="question-block">
          <div class="question-header">
            <span class="q-num">${qNum}.</span>
            <span class="q-prompt">${q.prompt}</span>
            <span class="q-points">[${q.points} ${q.points === 1 ? "mark" : "marks"}]</span>
          </div>
          ${q.modelAnswer ? `<div class="model-answer"><strong>Model Answer:</strong> ${q.modelAnswer}</div>` : ""}
          <div class="answer-blank"></div>
        </div>`;
      }
    })
    .join('<div class="q-divider"></div>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${exam.title} — Exam Paper</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    color: #1a1a1a;
    padding: 40px 48px;
    max-width: 850px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .school-name {
    text-align: center;
    font-size: 11pt;
    color: #555;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 6px;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  .paper-title {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 8px 0 4px;
  }

  .paper-meta {
    text-align: center;
    font-size: 10pt;
    color: #444;
    margin-bottom: 16px;
  }

  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 11pt;
  }

  .header-table td {
    padding: 4px 8px;
    border: 1px solid #1a1a1a;
  }

  .header-table .label-cell {
    font-weight: bold;
    background: #f5f5f5;
    width: 30%;
  }

  .instructions-box {
    background: #f9f9f9;
    border: 1px solid #ccc;
    border-left: 4px solid #1a1a1a;
    padding: 8px 12px;
    font-size: 10pt;
    margin-bottom: 20px;
  }

  .instructions-box strong { font-size: 11pt; }

  .section-label {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1a1a1a;
    padding-bottom: 2px;
  }

  .question-block { margin-bottom: 16px; page-break-inside: avoid; }

  .question-header {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 6px;
  }

  .q-num { font-weight: bold; min-width: 20px; }
  .q-prompt { flex: 1; }
  .q-points { font-size: 10pt; color: #555; white-space: nowrap; }

  .options-list { padding-left: 28px; display: flex; flex-direction: column; gap: 4px; }

  .option-row { display: flex; gap: 8px; }
  .option-label { font-weight: bold; min-width: 18px; }
  .option-text { flex: 1; }

  .answer-line {
    margin-top: 8px;
    padding-left: 28px;
    font-size: 10pt;
    color: #555;
    border-top: 1px dashed #ccc;
    padding-top: 4px;
  }
  .answer-label { font-weight: bold; }

  .answer-blank {
    margin-top: 8px;
    margin-left: 28px;
    height: 60px;
    border-bottom: 1px solid #1a1a1a;
  }

  .q-divider {
    border-top: 1px solid #e0e0e0;
    margin: 12px 0;
  }

  .model-answer {
    font-size: 10pt;
    color: #444;
    background: #f9f9f9;
    padding: 4px 8px;
    border-left: 2px solid #aaa;
    margin: 4px 0 0 28px;
  }

  .footer-line {
    margin-top: 24px;
    border-top: 1px solid #1a1a1a;
    padding-top: 8px;
    font-size: 9pt;
    color: #666;
    display: flex;
    justify-content: space-between;
  }

  /* ── Print media ── */
  @media print {
    body { padding: 0; font-size: 11pt; }
    .no-print { display: none !important; }
    .question-block { page-break-inside: avoid; }
    .header-table td { font-size: 10pt; }
    .options-list { padding-left: 24px; }
    .answer-blank { height: 40px; }
  }

  /* Print button (shown in preview window only) */
  .no-print {
    position: sticky;
    top: 0;
    background: #f0f0f0;
    border-bottom: 1px solid #ccc;
    padding: 12px 48px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    z-index: 10;
  }
  .btn-print {
    background: #1a1a1a;
    color: white;
    border: none;
    padding: 8px 20px;
    font-size: 11pt;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
  }
  .btn-print:hover { background: #333; }
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
</div>

<div class="school-name">Munyaka E-Learning Platform — Assessment Paper</div>
<div class="paper-title">${exam.title}</div>
<div class="paper-meta">
  ${exam.subject} &nbsp;|&nbsp; ${exam.classLevel} &nbsp;|&nbsp;
  ${formatCategory(exam.category)} &nbsp;|&nbsp; Duration: ${exam.duration} minutes
</div>

<table class="header-table">
  <tr>
    <td class="label-cell">Student Name:</td>
    <td style="width:38%"></td>
    <td class="label-cell">Assessment No.:</td>
    <td></td>
  </tr>
  <tr>
    <td class="label-cell">Grade / Class:</td>
    <td>${exam.classLevel}</td>
    <td class="label-cell">Date:</td>
    <td>${today}</td>
  </tr>
  <tr>
    <td class="label-cell">Subject:</td>
    <td>${exam.subject}</td>
    <td class="label-cell">Total Marks:</td>
    <td>${exam.totalMarks}</td>
  </tr>
</table>

<div class="instructions-box">
  <strong>Instructions:</strong>
  <ul style="margin:4px 0 0 20px;">
    <li>Write your name, assessment number, and date at the top of this paper.</li>
    <li>Answer all questions. For Multiple Choice, circle or tick the correct letter.</li>
    <li>For Structured questions, write your answers in the spaces provided.</li>
    <li>Show all working where necessary. Do not use pencil unless instructed.</li>
    <li>Total time: ${exam.duration} minutes. Manage your time carefully.</li>
  </ul>
</div>

<div class="section-label">Questions</div>

${questionsHTML}

<div class="footer-line">
  <span>${exam.title} — ${exam.subject}</span>
  <span>Page 1 of 1</span>
  <span>© Munyaka E-Learning Platform</span>
</div>
</body>
</html>`;
}

function formatCategory(c: string): string {
  if (!c) return "Formative";
  return c
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function statusBadge(status: ExamStatus) {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Closed":
      return "bg-red-100 text-red-700 border-red-200";
    case "Published":
    default:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

// ─── Exam View Modal ──────────────────────────────────────────────────────────
interface ExamViewModalProps {
  examId: string;
  examTitle: string;
  onClose: () => void;
}

const ExamViewModal: React.FC<ExamViewModalProps> = ({ examId, examTitle, onClose }) => {
  const [exam, setExam] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadFullAssessment(examId);
    setExam(loaded);
    setIsLoading(false);
  }, [examId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handlePrint = useCallback(() => {
    if (!exam) return;
    const html = buildPrintableHTML(exam);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      showError("Please allow pop-ups to open the printable paper.");
      return;
    }
    win.focus();
  }, [exam]);

  const totalMarks = useMemo(() => {
    if (!exam) return 0;
    return exam.questions.reduce((s, q) => s + q.points, 0);
  }, [exam]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-black">{examTitle}</h2>
            <p className="text-white/70 text-sm mt-1">
              {exam ? `${exam.questions.length} questions • ${totalMarks} total marks` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {exam && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors"
                title="Print / Download Exam Paper"
              >
                <Printer size={15} />
                Print
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !exam || exam.questions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No questions found for this exam.</p>
            </div>
          ) : (
            <>
              {/* Meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Subject", value: exam.subject },
                  { label: "Class", value: exam.classLevel },
                  { label: "Duration", value: `${exam.duration} min` },
                  { label: "Total Marks", value: totalMarks },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      {m.label}
                    </div>
                    <div className="font-bold text-slate-800">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {exam.questions.map((q, i) => (
                  <div key={q.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 leading-snug">{q.prompt}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge className="text-[10px] font-bold bg-slate-100 text-slate-600 border-0">
                              {q.type === "mcq" ? "MCQ" : "Structured"}
                            </Badge>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {q.points} {q.points === 1 ? "pt" : "pts"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.type === "mcq" && q.options && q.options.length > 0 && (
                      <div className="px-5 py-4 space-y-2.5 bg-white">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                          >
                            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                              {opt.label}
                            </span>
                            <span className="text-sm text-slate-700">{opt.text || <em className="text-slate-400">(no text)</em>}</span>
                            {opt.id === q.correctOptionId && (
                              <CheckCircle2 size={14} className="text-emerald-500 ml-auto shrink-0" title="Correct answer" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Structured model answer */}
                    {q.type === "structured" && q.modelAnswer && (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                          Model Answer
                        </p>
                        <p className="text-sm text-amber-800 leading-relaxed">{q.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          {exam && (
            <Button
              onClick={handlePrint}
              className="rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold"
            >
              <Printer size={15} />
              Print / Download Paper
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SetExamsList: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isStudent = role === "student" || role === "parent";

  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ExamStatus>("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [previewExamTitle, setPreviewExamTitle] = useState<string>("");

  const refresh = useCallback(() => {
    setExams(loadExams());
  }, []);

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === QUESTION_BANK_KEY ||
        e.key === ASSESSMENTS_KEY ||
        e.key === EXAM_STATUS_KEY ||
        e.key === CLOSED_EXAMS_KEY
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);

    const onDataChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        !detail?.key ||
        detail.key === QUESTION_BANK_KEY ||
        detail.key === ASSESSMENTS_KEY ||
        detail.key === EXAM_STATUS_KEY ||
        detail.key === CLOSED_EXAMS_KEY
      ) {
        refresh();
      }
    };
    window.addEventListener("munyaka:data-changed" as any, onDataChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("munyaka:data-changed" as any, onDataChanged);
    };
  }, [refresh]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
      try {
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const next = parsed.filter((a) => a.id !== id);
            localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(next));
          }
        }
        const bankRaw = localStorage.getItem(QUESTION_BANK_KEY);
        if (bankRaw) {
          const parsed = JSON.parse(bankRaw);
          const bankId = parsed?.metadata?.assessmentId || "assessment_bank_default";
          if (bankId === id) {
            localStorage.removeItem(QUESTION_BANK_KEY);
          }
        }
        const statusMap = loadStatusOverrides();
        delete statusMap[id];
        saveStatusOverrides(statusMap);
        const closed = loadClosedExams().filter((c) => c !== id);
        saveClosedExams(closed);

        showSuccess(`"${title}" deleted.`);
        refresh();
      } catch (e) {
        showError("Failed to delete: " + (e instanceof Error ? e.message : String(e)));
      }
    },
    [refresh]
  );

  const handleViewExam = useCallback((id: string, title: string) => {
    setPreviewExamId(id);
    setPreviewExamTitle(title);
  }, []);

  const handlePrintExam = useCallback((id: string, title: string) => {
    const exam = loadFullAssessment(id);
    if (!exam) {
      showError("Could not load exam data for printing.");
      return;
    }
    const html = buildPrintableHTML(exam);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      showError("Please allow pop-ups to open the printable paper.");
      return;
    }
    win.focus();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    exams.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set);
  }, [exams]);

  const filtered = useMemo(() => {
    let list = exams;
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.classLevel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exams, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: exams.length,
    published: exams.filter((e) => e.status === "Published").length,
    draft: exams.filter((e) => e.status === "Draft").length,
    closed: exams.filter((e) => e.status === "Closed").length,
  }), [exams]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderCard = (exam: ExamListItem) => (
    <Card
      key={exam.id}
      className={cn(
        "border border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group",
        exam.status === "Closed" && "opacity-80"
      )}
    >
      {/* Gradient header bar */}
      <div
        className={cn(
          "h-2 w-full",
          exam.status === "Published"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : exam.status === "Draft"
            ? "bg-gradient-to-r from-slate-400 to-slate-500"
            : "bg-gradient-to-r from-red-400 to-red-500"
        )}
      />
      <CardContent className="p-5 space-y-4">
        {/* Title + status */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-black text-slate-800 line-clamp-2 text-base flex-1">
              {exam.title}
            </h3>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                statusBadge(exam.status)
              )}
            >
              {exam.status}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600">
              {formatCategory(exam.category)}
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="font-semibold">{exam.subject}</span>
            <span className="text-slate-300">•</span>
            <span>Class {exam.classLevel}</span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-violet-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-violet-600 mb-0.5">
              <ListChecks size={12} />
            </div>
            <div className="text-base font-black text-violet-700">{exam.questionCount}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-violet-500">Questions</div>
          </div>
          <div className="bg-blue-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
              <Award size={12} />
            </div>
            <div className="text-base font-black text-blue-700">{exam.totalMarks}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-500">Total Pts</div>
          </div>
          <div className="bg-amber-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-0.5">
              <Clock size={12} />
            </div>
            <div className="text-base font-black text-amber-700">{exam.duration}m</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-500">Time Limit</div>
          </div>
        </div>

        {/* Footer date */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
          <Calendar size={10} />
          Updated {new Date(exam.updatedAt).toLocaleDateString()}
        </div>

        {/* Action buttons: View Exam, Print / Download, Delete */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => handleViewExam(exam.id, exam.title)}
            className="flex-1 rounded-xl h-10 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
            title="View Exam"
          >
            <Eye size={15} />
            View Exam
          </Button>

          <Button
            variant="outline"
            onClick={() => handlePrintExam(exam.id, exam.title)}
            className="flex-1 rounded-xl h-10 gap-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            title="Print / Download Exam Paper"
          >
            <Printer size={15} />
            Print
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(exam.id, exam.title)}
            className="rounded-xl h-10 w-10 text-slate-500 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTable = () => (
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Questions</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pts</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No exams match your filters.</td>
              </tr>
            )}
            {filtered.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-800 line-clamp-1">{exam.title}</p>
                  <p className="text-xs text-slate-400">Class {exam.classLevel}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCategory(exam.category)}</td>
                <td className="px-4 py-3 text-slate-600 font-medium">{exam.subject}</td>
                <td className="px-4 py-3 text-center font-bold text-violet-700">{exam.questionCount}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-700">{exam.totalMarks}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-700">{exam.duration}m</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    statusBadge(exam.status)
                  )}>
                    {exam.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewExam(exam.id, exam.title)}
                      className="rounded-lg h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                      title="View Exam"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintExam(exam.id, exam.title)}
                      className="rounded-lg h-8 w-8 text-slate-600 hover:bg-slate-100"
                      title="Print / Download"
                    >
                      <Printer size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(exam.id, exam.title)}
                      className="rounded-lg h-8 w-8 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 max-w-full">
      {/* Modal */}
      {previewExamId && (
        <ExamViewModal
          examId={previewExamId}
          examTitle={previewExamTitle}
          onClose={() => setPreviewExamId(null)}
        />
      )}

      {/* Top bar — header only */}
      <div className="flex items-center gap-3 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Library className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">All Set Exams</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View, filter, and manage every exam stored on this device.
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by title, subject, category…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-slate-50 border-none"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
            <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-slate-50 border-none font-bold">
              <Filter size={14} className="mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl bg-slate-50 border-none font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-xl bg-slate-100 p-1 h-11">
            <button
              onClick={() => setView("cards")}
              className={cn(
                "flex-1 sm:flex-initial px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all",
                view === "cards" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              <Grid3x3 size={14} /> Cards
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex-1 sm:flex-initial px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all",
                view === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "all", label: "Total", count: stats.total, color: "text-slate-500", icon: <FileQuestion size={14} /> },
          { key: "Published", label: "Published", count: stats.published, color: "text-emerald-600", icon: <CheckCircle2 size={14} /> },
          { key: "Draft", label: "Draft", count: stats.draft, color: "text-slate-500", icon: <FileQuestion size={14} /> },
          { key: "Closed", label: "Closed", count: stats.closed, color: "text-red-500", icon: <X size={14} /> },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key as any)}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all",
              statusFilter === s.key
                ? s.key === "Published" ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : s.key === "Draft" ? "bg-slate-100 border-slate-300 shadow-sm"
                  : s.key === "Closed" ? "bg-red-50 border-red-300 shadow-sm"
                  : "bg-slate-50 border-slate-300 shadow-sm"
                : "bg-white border-slate-100 hover:border-slate-200"
            )}
          >
            <div className={cn("flex items-center gap-2 mb-1", s.color)}>
              {s.icon}
              <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{s.count}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      {exams.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-2xl">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Library className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-1">No exams yet</h2>
            <p className="text-sm text-slate-400 max-w-sm">
              No set exams are currently stored on this device. Create exams from the Exam Creator
              or import them via CSV, then they will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 font-semibold">No exams match the current filters.</p>
            <Button
              variant="ghost"
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCategoryFilter("all"); }}
              className="rounded-xl mt-3"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(renderCard)}
        </div>
      ) : (
        renderTable()
      )}
    </div>
  );
};

export default SetExamsList;
