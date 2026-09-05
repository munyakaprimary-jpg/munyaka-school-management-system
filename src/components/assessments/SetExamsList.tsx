"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Printer,
  FileDown,
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
  Download,
  FileText,
  PlayCircle,
  ArrowLeft,
  FileSpreadsheet,
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
import { generateExamPDF } from "@/utils/examPdfGenerator";
import { useBackToAssessmentsMenu } from "@/hooks/useBackToAssessmentsMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Assessment, Question } from "@/types/questions";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const ALL_SET_EXAMS_KEY = "all_set_exams";
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
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveStatusOverrides(map: Record<string, ExamStatus>) {
  try { localStorage.setItem(EXAM_STATUS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

function loadClosedExams(): string[] {
  try {
    const raw = localStorage.getItem(CLOSED_EXAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveClosedExams(ids: string[]) {
  try { localStorage.setItem(CLOSED_EXAMS_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

function loadExams(): ExamListItem[] {
  const statusMap = loadStatusOverrides();
  const closed = new Set(loadClosedExams());
  const seen = new Set<string>();
  const items: ExamListItem[] = [];

  // 1. Unified all_set_exams (primary source — both ExamCreator + CSVImporter write here)
  try {
    const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => {
          if (!seen.has(a.id)) {
            seen.add(a.id);
            const status: ExamStatus = closed.has(a.id) ? "Closed" : statusMap[a.id] || (a.status === "draft" ? "Draft" : "Published");
            items.push({
              id: a.id,
              title: a.title || "Untitled",
              category: a.category || "Formative",
              subject: a.subject || "—",
              classLevel: a.classLevel || "—",
              duration: a.duration || 60,
              totalMarks: a.totalMarks || (a.questions || []).reduce((s, q) => s + (q.points || 0), 0),
              questionCount: (a.questions || []).length,
              status,
              createdAt: a.createdAt || new Date().toISOString(),
              updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
              source: "saved",
            });
          }
        });
      }
    }
  } catch { /* ignore */ }

  // 2. Active exam from question bank (legacy fallback for exams saved before this fix)
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions?.length > 0) {
        const id = parsed.metadata?.assessmentId || "assessment_bank_default";
        if (!seen.has(id)) {
          seen.add(id);
          const status: ExamStatus = closed.has(id) ? "Closed" : statusMap[id] || "Published";
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
    }
  } catch { /* ignore */ }

  // 3. Saved assessments (legacy fallback)
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => {
          if (!seen.has(a.id)) {
            seen.add(a.id);
            const status: ExamStatus = closed.has(a.id) ? "Closed" : statusMap[a.id] || (a.status === "draft" ? "Draft" : "Published");
            items.push({
              id: a.id,
              title: a.title || "Untitled",
              category: a.category || "Formative",
              subject: a.subject || "—",
              classLevel: a.classLevel || "—",
              duration: a.duration || 60,
              totalMarks: a.totalMarks || (a.questions || []).reduce((s, q) => s + (q.points || 0), 0),
              questionCount: (a.questions || []).length,
              status,
              createdAt: a.createdAt || new Date().toISOString(),
              updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
              source: "saved",
            });
          }
        });
      }
    }
  } catch { /* ignore */ }

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return items;
}

function loadFullAssessment(id: string): Assessment | null {
  // 1. Check unified all_set_exams first (primary source for newly created/imported exams)
  try {
    const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      const found = parsed.find((a) => a.id === id);
      if (found) return found;
    }
  } catch { /* ignore */ }

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCategory(c: string): string {
  if (!c) return "Formative";
  return c.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function statusBadge(status: ExamStatus) {
  switch (status) {
    case "Draft":  return "bg-slate-100 text-slate-700 border-slate-200";
    case "Closed": return "bg-red-100 text-red-700 border-red-200";
    default:        return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch { return dateStr; }
}

// ─── Global Print Styles ──────────────────────────────────────────────────────
const PRINT_STYLE_ID = "exam-print-global-styles";

function injectGlobalPrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = PRINT_STYLE_ID;
  s.textContent = `
    /* ── Hide everything except the printable paper when printing ── */
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body * {
        visibility: hidden !important;
      }

      /*
       * The printable paper container — matched by id AND by class.
       * Only #printable-exam-paper and its children become visible.
       */
      #printable-exam-paper,
      #printable-exam-paper * {
        visibility: visible !important;
      }

      #printable-exam-paper {
        position: absolute;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 40px 48px !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 11pt !important;
        color: #1a1a1a !important;
        background: #fff !important;
        line-height: 1.5 !important;
        box-sizing: border-box !important;
      }

      /* Restore display types for structured content */
      #printable-exam-paper div,
      #printable-exam-paper p,
      #printable-exam-paper ul,
      #printable-exam-paper li,
      #printable-exam-paper span {
        display: revert !important;
        visibility: visible !important;
      }
      #printable-exam-paper table {
        display: table !important;
        visibility: visible !important;
        width: 100% !important;
      }
      #printable-exam-paper thead    { display: table-header-group !important; }
      #printable-exam-paper tbody    { display: table-row-group !important; }
      #printable-exam-paper tr      { display: table-row !important; }
      #printable-exam-paper td      { display: table-cell !important; }

      /* Hide screen-only ornament elements inside the paper */
      #printable-exam-paper .no-print,
      #printable-exam-paper svg {
        display: none !important;
        visibility: hidden !important;
      }

      /* Flex helpers */
      #printable-exam-paper .pp-q-hdr   { display: flex !important; }
      #printable-exam-paper .pp-opt-row { display: flex !important; }
      #printable-exam-paper .pp-footer { display: flex !important; justify-content: space-between; }
      #printable-exam-paper .pp-ans-blank { display: block !important; height: 40px; }

      /* Page-break control */
            #printable-exam-paper .pp-q-block { page-break-inside: avoid; }
          }
      
          /* ── Web view: keep the printable paper off-screen ── */
          #printable-exam-paper {
            position: absolute;
            left: -9999px !important;
            top: 0;
            width: 800px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12pt;
            color: #1a1a1a;
            line-height: 1.5;
            background: #fff;
            padding: 40px 48px;
            box-sizing: border-box;
          }
      
          /* Paper elements (live styles used in both screen & print) */
          .pp-school { text-align: center; font-size: 11pt; color: #555; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 4px; }
          .pp-paper-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 4px; }
          .pp-paper-meta { text-align: center; font-size: 10pt; color: #444; margin-bottom: 16px; }
          .pp-hdr-tbl { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .pp-hdr-tbl td { padding: 4px 8px; border: 1px solid #1a1a1a; }
          .pp-lbl { font-weight: bold; background: #f5f5f5; }
          .pp-instr-box { background: #f9f9f9; border: 1px solid #ccc; border-left: 4px solid #1a1a1a; padding: 8px 12px; font-size: 10pt; margin-bottom: 20px; }
          .pp-instr-box ul { margin: 4px 0 0 20px; }
          .pp-sec-lbl { font-weight: bold; font-size: 11pt; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; }
          .pp-q-block { margin-bottom: 16px; page-break-inside: avoid; }
          .pp-q-hdr { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; }
          .pp-q-n { font-weight: bold; min-width: 20px; }
          .pp-q-p { flex: 1; }
          .pp-q-pt { font-size: 10pt; color: #555; white-space: nowrap; }
          .pp-q-img { text-align: center; margin: 8px 0; }
          .pp-q-img img { max-height: 200px; max-width: 100%; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; }
          .pp-q-img-inner { max-height: 200px; max-width: 100%; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; }
          .pp-ctx-stmt { font-size: 10pt; color: #333; background: #f9f9f9; border-left: 3px solid #aaa; padding: 4px 8px; margin-bottom: 6px; font-style: italic; }
          .pp-opt-lst { padding-left: 28px; display: flex; flex-direction: column; gap: 4px; }
          .pp-opt-row { display: flex; gap: 8px; }
          .pp-opt-lbl { font-weight: bold; min-width: 18px; }
          .pp-opt-txt { flex: 1; }
          .pp-ans-line { margin-top: 8px; padding-left: 28px; font-size: 10pt; color: #555; border-top: 1px dashed #ccc; padding-top: 4px; }
          .pp-ans-lbl { font-weight: bold; }
          .pp-ans-blank { margin-top: 8px; margin-left: 28px; height: 60px; border-bottom: 1px solid #1a1a1a; }
          .pp-mod-ans { font-size: 10pt; color: #444; background: #f9f9f9; padding: 4px 8px; border-left: 2px solid #aaa; margin-top: 4px; }
          .pp-footer { margin-top: 24px; border-top: 1px solid #1a1a1a; padding-top: 8px; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
        `;
        document.head.appendChild(s);
      }

// ─── Printable Question Row ──────────────────────────────────────────────────
function PrintableQuestionRow({ q, index }: { q: Question; index: number }) {
  const position = q.imagePosition || "below";
  const scoreLabel = `[${q.points} ${q.points === 1 ? "mark" : "marks"}]`;

  const imageBlock = q.imageUrl ? (
    <div className="pp-q-img">
      <img src={q.imageUrl} alt="Question diagram" />
    </div>
  ) : null;

  const contextBlock = q.contextStatement ? (
    <div className="pp-ctx-stmt">{q.contextStatement}</div>
  ) : null;

  const promptBlock = (
    <div className="pp-q-hdr">
      <span className="pp-q-n">{index + 1}.</span>
      <span className="pp-q-p">{q.prompt}</span>
      <span className="pp-q-pt">{scoreLabel}</span>
    </div>
  );

  if (q.type === "mcq" && q.options) {
    return (
      <div className="pp-q-block">
        {position === "above" && imageBlock}
        {contextBlock}
        {position === "between" && imageBlock}
        {promptBlock}
        {position === "below" && imageBlock}
        <div className="pp-opt-lst">
          {q.options.map((opt) => (
            <div key={opt.id} className="pp-opt-row">
              <span className="pp-opt-lbl">{opt.label}.</span>
              <span className="pp-opt-txt">{opt.text || "(no text)"}</span>
            </div>
          ))}
        </div>
        <div className="pp-ans-line">
          <span className="pp-ans-lbl">Student's Answer:</span> ____________________
        </div>
      </div>
    );
  }

  return (
    <div className="pp-q-block">
      {position === "above" && imageBlock}
      {contextBlock}
      {position === "between" && imageBlock}
      {promptBlock}
      {position === "below" && imageBlock}
      {q.modelAnswer && (
        <div className="pp-mod-ans">
          <strong>Model Answer:</strong> {q.modelAnswer}
        </div>
      )}
      <div className="pp-ans-blank" />
    </div>
  );
}

// ─── Dedicated Printable Exam Paper Component ────────────────────────────────
interface PrintableExamPaperProps {
  exam: Assessment;
  totalMarks: number;
  today: string;
}

/**
 * Off-screen assessment template — hidden in web view (left: -9999px),
 * fully visible in @media print via global CSS rules injected in injectGlobalPrintStyles().
 *
 * Contains:
 * - Official School Header (School Name, Exam Title, Subject, Date)
 * - Learner Credentials Block (Learner Name, Assessment No./Birth Cert No., Grade/Class, Duration, Total Marks)
 * - General Instructions section
 * - Cleanly formatted MCQ options or lined answer boxes for structured questions
 */
const PrintableExamPaper = React.forwardRef<HTMLDivElement, PrintableExamPaperProps>(
  ({ exam, totalMarks, today }, ref) => (
  <div ref={ref} id="printable-exam-paper" aria-hidden="true" className="pp-root">
    {/* ── Official School Header ── */}
    <div className="pp-school">Munyaka E-Learning Platform — Assessment Paper</div>
    <div className="pp-paper-title">{exam.title}</div>
    <div className="pp-paper-meta">
      {exam.subject} &nbsp;|&nbsp; {exam.classLevel} &nbsp;|&nbsp;
      {formatCategory(exam.category)} &nbsp;|&nbsp; Duration: {exam.duration} minutes
    </div>

    {/* ── Learner Credentials Block ── */}
    <table className="pp-hdr-tbl">
      <tbody>
        <tr>
          <td className="pp-lbl">Learner Name:</td>
          <td style={{ width: "38%" }} />
          <td className="pp-lbl">Assessment No. / Birth Cert No.:</td>
          <td />
        </tr>
        <tr>
          <td className="pp-lbl">Grade / Class:</td>
          <td>{exam.classLevel}</td>
          <td className="pp-lbl">Date:</td>
          <td>{today}</td>
        </tr>
        <tr>
          <td className="pp-lbl">Subject:</td>
          <td>{exam.subject}</td>
          <td className="pp-lbl">Total Marks:</td>
          <td>{totalMarks}</td>
        </tr>
      </tbody>
    </table>

    {/* ── General Instructions ── */}
    <div className="pp-instr-box">
      <strong>Instructions:</strong>
      <ul>
        <li>Write your name, Assessment No. / Birth Certificate No., and date at the top of this paper.</li>
        <li>Answer all questions. For Multiple Choice, circle or tick the correct letter.</li>
        <li>For Structured questions, write your answers in the spaces provided.</li>
        <li>Show all working where necessary.</li>
        <li>Total time: {exam.duration} minutes. Manage your time carefully.</li>
      </ul>
    </div>

    <div className="pp-sec-lbl">Questions</div>

    {/* ── Questions ── */}
    {exam.questions.map((q, i) => (
      <PrintableQuestionRow key={q.id} q={q} index={i} />
    ))}

    {/* ── Footer ── */}
        <div className="pp-footer">
          <span>{exam.title} — {exam.subject}</span>
          <span>© Munyaka E-Learning Platform</span>
        </div>
      </div>
      )
    );
    PrintableExamPaper.displayName = "PrintableExamPaper";

// ─── Exam View Modal ──────────────────────────────────────────────────────────
interface ExamViewModalProps {
  examId: string;
  examTitle: string;
  onClose: () => void;
}

const ExamViewModal: React.FC<ExamViewModalProps> = ({ examId, examTitle, onClose }) => {
  const [exam, setExam] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const printPaperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadFullAssessment(examId);
    setExam(loaded);
    setIsLoading(false);
    injectGlobalPrintStyles();
  }, [examId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Native Print (browser print dialog) ──────────────────────────────────────
  // Calls window.print() — the global @media print CSS hides all UI and shows
  // ONLY #printable-exam-paper (the PrintableExamPaper component below).
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Download PDF via html2pdf.js ─────────────────────────────────────────────
  // Captures the #pdf-paper-content element (only the exam body, with header
  // action buttons and footer action buttons excluded via
  // data-html2canvas-ignore="true") and saves it as a PDF file.
  const handleDownloadPDF = useCallback(async () => {
    if (!exam) return;
    setIsPdfGenerating(true);
    try {
      const ok = await generateExamPDF(exam.id, "download");
      if (!ok) showError("Failed to generate PDF. Try the Print button instead.");
      else showSuccess("Exam paper downloaded.");
    } finally {
      setIsPdfGenerating(false);
    }
  }, [exam]);

  const totalMarks = useMemo(
    () => (exam ? exam.questions.reduce((s, q) => s + q.points, 0) : 0),
    [exam]
  );
  const today = formatDate(new Date().toISOString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — wrapped in printable-exam-content so html2pdf.js can target it */}
      <div
        id="printable-exam-content"
        ref={modalRef}
        className="relative bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-black">{examTitle}</h2>
            <p className="text-white/70 text-sm mt-0.5">
              {exam ? `${exam.questions.length} questions • ${totalMarks} total marks` : "Loading…"}
            </p>
          </div>
          <div
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 shrink-0"
          >
            {/* Print */}
            {exam && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors"
                title="Print / Save as PDF via browser"
              >
                <Printer size={15} />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
            {/* Download PDF */}
            {exam && (
              <button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
                title="Download as PDF"
              >
                <FileDown size={15} />
                <span className="hidden sm:inline">
                  {isPdfGenerating ? "Generating…" : "PDF"}
                </span>
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

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* ── Dedicated Printable Paper Component ─────────────────────── */}
          {/* Off-screen in web view, fully visible via @media print */}
          {exam && (
            <PrintableExamPaper
              ref={printPaperRef}
              exam={exam}
              totalMarks={totalMarks}
              today={today}
            />
          )}

          {/* ── On-screen preview ─────────────────────────────────────── */}
          {isLoading ? (
            <div
              data-html2canvas-ignore="true"
              className="flex items-center justify-center py-16"
            >
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !exam || exam.questions.length === 0 ? (
            <div
              data-html2canvas-ignore="true"
              className="text-center py-16 text-slate-400"
            >
              <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No questions found for this exam.</p>
            </div>
          ) : (
            <div
              id="pdf-paper-content"
              className="p-6 bg-white text-slate-900 space-y-6"
            >
              {/* Paper Title Header (visible in the PDF) */}
              <div className="border-b-2 border-slate-200 pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  Munyaka E-Learning Platform — Assessment Paper
                </p>
                <h1 className="text-2xl font-black text-slate-900 text-center mt-1">
                  {exam.title}
                </h1>
                <p className="text-sm text-slate-600 text-center mt-1">
                  {exam.subject} &nbsp;|&nbsp; {exam.classLevel} &nbsp;|&nbsp;{" "}
                  {formatCategory(exam.category)} &nbsp;|&nbsp; Duration: {exam.duration} minutes
                </p>
                <p className="text-[10px] text-slate-500 text-center mt-1">{today}</p>
              </div>

              {/* Meta grid */}
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

              {/* Questions (screen preview) */}
              <div className="space-y-4">
                {exam.questions.map((q, i) => (
                  <div key={q.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
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

                    {q.contextStatement && (
                      <div className="px-5 py-3 bg-violet-50/60 border-b border-violet-100">
                        <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap">
                          {q.contextStatement}
                        </p>
                      </div>
                    )}

                    {(q.imagePosition || "below") === "above" && q.imageUrl && (
                      <div className="px-5 py-4 flex justify-center bg-white border-b border-slate-50">
                        <img
                          src={q.imageUrl}
                          alt="Question diagram"
                          className="max-h-56 rounded-xl border border-slate-200 object-contain"
                        />
                      </div>
                    )}

                    {(q.imagePosition || "below") === "between" && q.imageUrl && (
                      <div className="px-5 py-4 flex justify-center bg-white border-b border-slate-50">
                        <img
                          src={q.imageUrl}
                          alt="Question diagram"
                          className="max-h-56 rounded-xl border border-slate-200 object-contain"
                        />
                      </div>
                    )}

                    {q.type === "mcq" && q.options && q.options.length > 0 && (
                      <div className="px-5 py-4 space-y-2.5 bg-white">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                              {opt.label}
                            </span>
                            <span className="text-sm text-slate-700 flex-1">{opt.text || <em className="text-slate-400">(no text)</em>}</span>
                            {opt.id === q.correctOptionId && (
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(q.imagePosition || "below") === "below" && q.imageUrl && (
                      <div className="px-5 py-4 flex justify-center bg-white">
                        <img
                          src={q.imageUrl}
                          alt="Question diagram"
                          className="max-h-56 rounded-xl border border-slate-200 object-contain"
                        />
                      </div>
                    )}

                    {q.type === "structured" && q.modelAnswer && (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Model Answer</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{q.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Paper Footer */}
              <div className="border-t-2 border-slate-200 pt-3 mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>{exam.title} — {exam.subject}</span>
                <span>© Munyaka E-Learning Platform</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          data-html2canvas-ignore="true"
          className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50"
        >
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          {exam && (
            <>
              <Button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                className="rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold"
              >
                <Download size={15} />
                {isPdfGenerating ? "Generating..." : "Download PDF"}
              </Button>
              <Button
                onClick={handlePrint}
                className="rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold"
              >
                <Printer size={15} />
                Print / Save PDF
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Results Table Helpers ────────────────────────────────────────────────────

interface ExamTableRow {
  "Adm No": string;
  "Student Name": string;
  "Grade": string;
  "Stream": string;
  [questionHeader: string]: string | number;
  "Total Score": string;
  "Percentage": string;
  "Level": string;
}

interface ExamTableData {
  headers: string[];
  rows: ExamTableRow[];
  totalPossiblePoints: number;
}

/**
 * Build the per-question marksheet view for an exam directly from
 * `all_set_exams` (question metadata) merged with `marked_student_submissions`
 * (graded student results).
 *
 * Returns an empty row set when no submissions are found so the caller can
 * surface an explicit empty-state message instead of rendering a blank table.
 */
function loadExamTableData(examId: string): ExamTableData {
  const empty: ExamTableData = { headers: [], rows: [], totalPossiblePoints: 0 };

  try {
    const allExams: Assessment[] = JSON.parse(
      localStorage.getItem(ALL_SET_EXAMS_KEY) || "[]"
    );
    if (!Array.isArray(allExams) || allExams.length === 0) return empty;

    const targetExam = allExams.find(
      (e: any) => String(e?.id) === String(examId)
    );
    if (!targetExam) return empty;

    const ledger = JSON.parse(
      localStorage.getItem("marked_student_submissions") || "{}"
    );

    // The ledger may be either a record (id -> submission) or an array.
    const submissionsList: any[] = Array.isArray(ledger)
      ? ledger
      : ledger && typeof ledger === "object"
        ? Object.values(ledger)
        : [];

    const examSubmissions = submissionsList
      .filter((s: any) => s && String(s.examId) === String(examId))
      // Newest first by submittedAt, fall back to id for stability.
      .sort((a: any, b: any) => {
        const ta = a?.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b?.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });

    const questions: any[] = Array.isArray(targetExam.questions)
      ? targetExam.questions
      : [];

    const totalPossiblePoints =
      questions.reduce((sum, q) => sum + (Number(q?.points) || 0), 0) ||
      questions.length ||
      0;

    // Build dynamic question headers (Q1, Q2, …)
    const headers = [
      "Adm No",
      "Student Name",
      "Grade",
      "Stream",
      ...questions.map((_: any, idx: number) => `Q${idx + 1}`),
      "Total Score",
      "Percentage",
      "Level",
    ];

    const rows: ExamTableRow[] = examSubmissions.map((sub: any) => {
      const row: ExamTableRow = {
        "Adm No":
          sub?.admissionNo ||
          sub?.studentId ||
          sub?.admNo ||
          "N/A",
        "Student Name": sub?.studentName || "Unknown",
        "Grade":
          sub?.grade ||
          targetExam?.classLevel ||
          targetExam?.targetGrade ||
          "",
        "Stream": sub?.stream || "All",
        "Total Score": "0/0",
        "Percentage": "0%",
        "Level": sub?.level || "BE",
      };

      // Derive awarded points per question. The grading pipeline stores
      // marks as a record keyed by questionId, but submissions from older
      // versions may have `answers` with `pointsEarned` or `isCorrect`.
      const marksRecord: Record<string, number> =
        sub?.marks && typeof sub.marks === "object" ? sub.marks : {};
      const answersArr: any[] = Array.isArray(sub?.answers)
        ? sub.answers
        : [];

      let earned = 0;
      questions.forEach((q: any, idx: number) => {
        const qId = q?.id != null ? String(q.id) : `q${idx + 1}`;
        const possible = Number(q?.points) || 1;

        // 1) Prefer explicit per-question marks
        let points = marksRecord[qId];
        if (typeof points !== "number" || Number.isNaN(points)) {
          // 2) Look inside the answers array (legacy or auto-graded)
          const answerObj = answersArr.find(
            (a: any) => String(a?.questionId) === qId
          );
          if (answerObj) {
            if (typeof answerObj.pointsEarned === "number") {
              points = answerObj.pointsEarned;
            } else if (answerObj.isCorrect === true) {
              points = possible;
            } else if (typeof answerObj.score === "number") {
              points = answerObj.score;
            } else {
              points = 0;
            }
          } else {
            points = 0;
          }
        }
        points = Math.max(0, Math.min(possible, Number(points) || 0));
        row[`Q${idx + 1}`] = points;
        earned += points;
      });

      // Prefer server-computed totals when present, otherwise recompute.
      const reportedTotal =
        typeof sub?.score === "number"
          ? sub.score
          : typeof sub?.totalScore === "number"
            ? sub.totalScore
            : null;
      const reportedMax =
        typeof sub?.totalPoints === "number"
          ? sub.totalPoints
          : typeof sub?.maxScore === "number"
            ? sub.maxScore
            : null;

      const total =
        reportedTotal != null ? reportedTotal : earned;
      const max = reportedMax != null && reportedMax > 0 ? reportedMax : totalPossiblePoints;

      row["Total Score"] = `${total}/${max || 0}`;

      const pct =
        typeof sub?.percentage === "number"
          ? sub.percentage
          : max > 0
            ? Math.round((total / max) * 100)
            : 0;
      row["Percentage"] = `${pct}%`;
      row["Level"] = sub?.level || (pct >= 80 ? "EE" : pct >= 60 ? "ME" : pct >= 40 ? "AE" : "BE");

      return row;
    });

    return { headers, rows, totalPossiblePoints };
  } catch (err) {
    console.error("[SetExamsList] loadExamTableData failed:", err);
    return empty;
  }
}

// ─── Exam Results Table Modal ─────────────────────────────────────────────────

interface ExamResultsTableModalProps {
  examId: string;
  examTitle: string;
  examSubject?: string;
  onClose: () => void;
}

/**
 * A read-only marksheet view that renders the per-student, per-question
 * results for a specific exam and exposes XLSX / CSV download actions.
 *
 * Design notes:
 *  - Always renders a table (headers + an explicit empty-state row) so the
 *    modal surface never appears blank.
 *  - Download actions are guarded: if there are no rows, the user gets an
 *    inline error rather than a corrupt empty file.
 */
const ExamResultsTableModal: React.FC<ExamResultsTableModalProps> = ({
  examId,
  examTitle,
  examSubject,
  onClose,
}) => {
  const [tableData, setTableData] = useState<ExamTableData>({
    headers: [],
    rows: [],
    totalPossiblePoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setTableData(loadExamTableData(examId));
    setIsLoading(false);
  }, [examId]);

  useEffect(() => {
    refresh();
    const onSubUpdated = () => refresh();
    window.addEventListener("submissions_updated", onSubUpdated);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "marked_student_submissions" || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("submissions_updated", onSubUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── XLSX download ────────────────────────────────────────────────────────
  const handleDownloadExcel = useCallback(() => {
    if (tableData.rows.length === 0) {
      showError("No submission data available to export for this exam.");
      return;
    }
    import("xlsx")
      .then((XLSX) => {
        const worksheet = XLSX.utils.json_to_sheet(tableData.rows, {
          header: tableData.headers,
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Marksheet");
        XLSX.writeFile(
          workbook,
          `Assessment_Results_${examId}.xlsx`
        );
        showSuccess("Marksheet exported as Excel.");
      })
      .catch((err) => {
        console.error("[ExamResultsTableModal] XLSX export failed:", err);
        showError("Excel export failed. Please try CSV instead.");
      });
  }, [tableData, examId]);

  // ── CSV download ─────────────────────────────────────────────────────────
  const handleDownloadCSV = useCallback(() => {
    if (tableData.rows.length === 0) {
      showError("No submission data available to export for this exam.");
      return;
    }
    try {
      const escapeCell = (val: any) => {
        const s = val == null ? "" : String(val);
        // Quote any cell that contains a comma, quote, newline, or carriage return
        if (/[",\n\r]/.test(s)) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const csvRows: string[] = [];
      csvRows.push(tableData.headers.map(escapeCell).join(","));
      tableData.rows.forEach((row) => {
        csvRows.push(
          tableData.headers.map((h) => escapeCell(row[h])).join(",")
        );
      });
      // UTF-8 BOM so Excel renders correctly
      const csv = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Assessment_Results_${examId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showSuccess("Marksheet exported as CSV.");
    } catch (err) {
      console.error("[ExamResultsTableModal] CSV export failed:", err);
      showError("CSV export failed. Please try again.");
    }
  }, [tableData, examId]);

  const hasRows = tableData.rows.length > 0;
  const totalMarksColumnIdx = tableData.headers.indexOf("Total Score");
  const questionColumnCount = Math.max(
    0,
    tableData.headers.length - 7 /* Adm, Name, Grade, Stream, Total, %, Level */
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
              <FileSpreadsheet size={12} />
              Results Table View
            </div>
            <h2 className="text-xl font-black truncate">
              {(() => {
                const subject = String(examSubject || "").trim().toUpperCase();
                const title = String(examTitle || "").trim();
                return subject ? `${subject} — ${title}` : title || "Results Table";
              })()}
            </h2>
            <p className="text-white/80 text-xs mt-0.5">
              {isLoading
                ? "Loading…"
                : hasRows
                  ? `${tableData.rows.length} submission${tableData.rows.length === 1 ? "" : "s"} • ${questionColumnCount} question${questionColumnCount === 1 ? "" : "s"}`
                  : "No submissions found for this exam yet."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadExcel}
              disabled={!hasRows}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download as Excel"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">XLSX</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={!hasRows}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download as CSV"
            >
              <Download size={15} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : !hasRows ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">
                No completed student submissions found for this exam.
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Once learners submit this exam, their graded results will
                populate this table automatically.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      {tableData.headers.map((head, idx) => (
                        <th
                          key={`${head}-${idx}`}
                          className={cn(
                            "border border-slate-200 p-2 text-left font-bold text-[11px] uppercase tracking-wider text-slate-600 whitespace-nowrap",
                            head === "Total Score" ||
                              head === "Percentage" ||
                              head === "Level" ||
                              /^Q\d+$/.test(head)
                              ? "text-center"
                              : ""
                          )}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-emerald-50/40 transition-colors"
                      >
                        {tableData.headers.map((head, cIdx) => {
                          const isNumericColumn =
                            head === "Total Score" ||
                            head === "Percentage" ||
                            head === "Level" ||
                            /^Q\d+$/.test(head);
                          return (
                            <td
                              key={`${rIdx}-${cIdx}`}
                              className={cn(
                                "border border-slate-100 p-2 text-slate-700",
                                isNumericColumn
                                  ? "text-center font-semibold tabular-nums"
                                  : ""
                              )}
                            >
                              {String(row[head] ?? "")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Always render a small summary block so the modal never looks empty */}
          {!isLoading && (
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 px-1">
              <span>
                <strong className="font-bold text-slate-700">
                  {tableData.rows.length}
                </strong>{" "}
                student{tableData.rows.length === 1 ? "" : "s"} listed
              </span>
              {tableData.totalPossiblePoints > 0 && (
                <span>
                  Total marks:{" "}
                  <strong className="font-bold text-slate-700">
                    {tableData.totalPossiblePoints}
                  </strong>
                </span>
              )}
              {hasRows && totalMarksColumnIdx >= 0 && (
                <span>
                  Last column:{" "}
                  <strong className="font-bold text-slate-700">
                    {tableData.headers[tableData.headers.length - 1]}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          <Button
            onClick={handleDownloadCSV}
            disabled={!hasRows}
            className="rounded-xl gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
          >
            <Download size={15} />
            Download CSV
          </Button>
          <Button
            onClick={handleDownloadExcel}
            disabled={!hasRows}
            className="rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            Download Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SetExamsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role || "").toLowerCase();
  const isStudent = role === "student" || role === "parent";

  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ExamStatus>("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [previewExamTitle, setPreviewExamTitle] = useState<string>("");
  const [resultsExamId, setResultsExamId] = useState<string | null>(null);
  const [resultsExamTitle, setResultsExamTitle] = useState<string>("");
  const [resultsExamSubject, setResultsExamSubject] = useState<string>("");

  // Returns to the Assessments parent menu and resets in-page nested state.
  const handleBackToParent = useBackToAssessmentsMenu(
    {},
    {
      resets: [
        () => setPreviewExamId(null),
        () => setResultsExamId(null),
        () => setSearchTerm(""),
        () => setStatusFilter("all"),
        () => setCategoryFilter("all"),
        () => setView("cards"),
      ],
    }
  );

  const refresh = useCallback(() => setExams(loadExams()), []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if ([QUESTION_BANK_KEY, ASSESSMENTS_KEY, ALL_SET_EXAMS_KEY, EXAM_STATUS_KEY, CLOSED_EXAMS_KEY].includes(e.key || "")) refresh();
    };
    window.addEventListener("storage", onStorage);
    const onDataChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.key || [QUESTION_BANK_KEY, ASSESSMENTS_KEY, ALL_SET_EXAMS_KEY, EXAM_STATUS_KEY, CLOSED_EXAMS_KEY].includes(detail.key)) refresh();
    };
    window.addEventListener("munyaka:data-changed" as any, onDataChanged);
    // Listen for assessments_updated — fired by ExamCreator + CSVImporter on same-tab saves
    const onAssessmentsUpdated = () => refresh();
    window.addEventListener("assessments_updated", onAssessmentsUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("munyaka:data-changed" as any, onDataChanged);
      window.removeEventListener("assessments_updated", onAssessmentsUpdated);
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
        // Also clean up all_set_exams
        const allRaw = localStorage.getItem(ALL_SET_EXAMS_KEY);
        if (allRaw) {
          const parsed: Assessment[] = JSON.parse(allRaw);
          if (Array.isArray(parsed)) {
            const next = parsed.filter((a) => a.id !== id);
            localStorage.setItem(ALL_SET_EXAMS_KEY, JSON.stringify(next));
          }
        }
        const bankRaw = localStorage.getItem(QUESTION_BANK_KEY);
        if (bankRaw) {
          const parsed = JSON.parse(bankRaw);
          const bankId = parsed?.metadata?.assessmentId || "assessment_bank_default";
          if (bankId === id) localStorage.removeItem(QUESTION_BANK_KEY);
        }
        const statusMap = loadStatusOverrides();
        delete statusMap[id];
        saveStatusOverrides(statusMap);
        const closed = loadClosedExams().filter((c) => c !== id);
        saveClosedExams(closed);
        window.dispatchEvent(new Event("assessments_updated"));
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

  const handleViewResults = useCallback((id: string, title: string, subject?: string) => {
    setResultsExamId(id);
    setResultsExamTitle(title);
    setResultsExamSubject(subject || "");
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
    if (String(searchTerm || '').trim()) {
          const q = String(searchTerm || '').toLowerCase();
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
        "border border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all",
        exam.status === "Closed" && "opacity-80"
      )}
    >
      <div className={cn("h-2 w-full",
        exam.status === "Published" ? "bg-gradient-to-r from-emerald-500 to-teal-500"
          : exam.status === "Draft" ? "bg-gradient-to-r from-slate-400 to-slate-500"
          : "bg-gradient-to-r from-red-400 to-red-500"
      )} />
      <CardContent className="p-5 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-black text-slate-800 line-clamp-2 text-base flex-1">{exam.title}</h3>
            <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", statusBadge(exam.status))}>
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

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-violet-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-violet-600 mb-0.5"><ListChecks size={12} /></div>
            <div className="text-base font-black text-violet-700">{exam.questionCount}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-violet-500">Questions</div>
          </div>
          <div className="bg-blue-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5"><Award size={12} /></div>
            <div className="text-base font-black text-blue-700">{exam.totalMarks}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-500">Total Pts</div>
          </div>
          <div className="bg-amber-50 rounded-xl py-2.5 px-1">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-0.5"><Clock size={12} /></div>
            <div className="text-base font-black text-amber-700">{exam.duration}m</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-500">Time Limit</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
          <Calendar size={10} />
          Updated {new Date(exam.updatedAt).toLocaleDateString()}
        </div>

        {/* Action buttons: Take Exam, View Exam, Download PDF, Delete */}
        <div className="flex items-center gap-2 w-full pt-2 border-t border-slate-100">
          {/* Primary: Take Exam */}
          {exam.status !== "Closed" && (
            <Button
              onClick={() => navigate(`/assessments/student?id=${exam.id}`)}
              className="flex-1 h-10 px-3 rounded-lg text-sm font-medium gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <PlayCircle size={15} />
              Take Exam
            </Button>
          )}
          {/* Secondary: View Exam */}
          <Button
            onClick={() => handleViewExam(exam.id, exam.title)}
            className="h-10 w-24 rounded-lg text-sm font-medium gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          >
            <Eye size={15} />
            View
          </Button>
          {/* Results / Marksheet */}
          <Button
            onClick={() => handleViewResults(exam.id, exam.title, exam.subject)}
            className="h-10 w-28 rounded-lg text-sm font-medium gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          >
            <FileSpreadsheet size={15} />
            Results
          </Button>
          {/* Utility: Download PDF */}
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await generateExamPDF(exam.id, "download");
              if (!ok) showError("Could not generate the PDF. Please try the Print button in the preview.");
              else showSuccess("Exam paper downloaded.");
            }}
            className="h-10 w-20 rounded-lg text-sm font-medium gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Download size={15} />
            PDF
          </Button>
          {/* Icon: Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(exam.id, exam.title)}
            className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50"
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
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No exams match your filters.</td></tr>
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
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", statusBadge(exam.status))}>
                    {exam.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {exam.status !== "Closed" && (
                      <Button variant="ghost" size="icon"
                        onClick={() => navigate(`/assessments/student?id=${exam.id}`)}
                        className="rounded-lg h-8 w-8 text-indigo-600 hover:bg-indigo-50" title="Take Exam">
                        <PlayCircle size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleViewExam(exam.id, exam.title)}
                      className="rounded-lg h-8 w-8 text-indigo-600 hover:bg-indigo-50" title="View Exam">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleViewResults(exam.id, exam.title, exam.subject)}
                      className="rounded-lg h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="View Results">
                      <FileSpreadsheet size={14} />
                    </Button>
                    <Button variant="ghost" size="icon"
                      onClick={async () => {
                        const ok = await generateExamPDF(exam.id, "download");
                        if (!ok) showError("Could not generate the PDF.");
                        else showSuccess("PDF saved.");
                      }}
                      className="rounded-lg h-8 w-8 text-slate-600 hover:bg-slate-100" title="Download PDF">
                      <Download size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exam.id, exam.title)}
                      className="rounded-lg h-8 w-8 text-red-600 hover:bg-red-50" title="Delete">
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
      {previewExamId && (
        <ExamViewModal
          examId={previewExamId}
          examTitle={previewExamTitle}
          onClose={() => setPreviewExamId(null)}
        />
      )}
      {resultsExamId && (
        <ExamResultsTableModal
          examId={resultsExamId}
          examTitle={resultsExamTitle}
          examSubject={resultsExamSubject}
          onClose={() => setResultsExamId(null)}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        {/* Back arrow -> Assessments parent menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToParent}
          className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex-shrink-0"
          title="Back to Assessments"
        >
          <ArrowLeft size={18} />
        </Button>
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
            <button onClick={() => setView("cards")}
              className={cn("flex-1 sm:flex-initial px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all",
                view === "cards" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}>
              <Grid3x3 size={14} /> Cards
            </button>
            <button onClick={() => setView("table")}
              className={cn("flex-1 sm:flex-initial px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all",
                view === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}>
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
          <button key={s.key} onClick={() => setStatusFilter(s.key as any)}
            className={cn("p-4 rounded-2xl border-2 text-left transition-all",
              statusFilter === s.key
                ? s.key === "Published" ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : s.key === "Draft" ? "bg-slate-100 border-slate-300 shadow-sm"
                  : s.key === "Closed" ? "bg-red-50 border-red-300 shadow-sm"
                  : "bg-slate-50 border-slate-300 shadow-sm"
                : "bg-white border-slate-100 hover:border-slate-200"
            )}>
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
            <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCategoryFilter("all"); }}
              className="rounded-xl mt-3">Clear filters</Button>
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