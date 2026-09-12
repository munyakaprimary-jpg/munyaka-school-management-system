/**
 * MarkedScriptsList
 *
 * A dedicated management view for fully-marked student assessments.
 *
 * Pulls all entries from `marked_student_submissions` (via
 * useMarkedSubmissions) and renders them in a clean table with:
 *   - Student Name
 *   - Admission No.
 *   - Exam Title
 *   - Score (e.g. 85%)
 *   - Date (submittedAt)
 *   - Actions: "View Script" (open the in-page preview dialog) and
 *              "Download PDF" (uses html2pdf.js over the
 *              `script-pdf-{submission.id}` element).
 *
 * The PDF export handler is the canonical one described in the spec:
 *   const handleDownloadScriptPDF = (submission) => {
 *     const element = document.getElementById(`script-pdf-${submission.id}`);
 *     if (!element) return;
 *     const opt = { ... };
 *     html2pdf().set(opt).from(element).save();
 *   };
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  Loader2,
  Trash2,
  X,
  Award,
  CalendarDays,
  Hash,
  GraduationCap,
  Printer,
  Filter,
  Inbox,
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import html2pdf from "html2pdf.js";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { showSuccess, showError } from "@/utils/toast";
import { useMarkedSubmissions, type StudentSubmission } from "@/hooks/useMarkedSubmissions";
import type { Assessment, Question } from "@/types/questions";
import MarkedScriptPDF from "@/components/assessments/MarkedScriptPDF";

// ─── Storage keys (mirrors of the values used elsewhere in the app) ──────────
const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const SCHOOL_NAME = "Munyaka Portal";

// ─── Local helpers ──────────────────────────────────────────────────────────

/** Resolve the question list for a given examId from any known source. */
function loadQuestionsForExam(examId: string): Question[] {
  if (!examId) return [];

  // 1. Saved assessments array
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (raw) {
      const parsed: Assessment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = parsed.find((a) => a.id === examId);
        if (found?.questions) return found.questions;
      }
    }
  } catch {
    /* ignore */
  }

  // 2. Active question bank (only if its id matches the exam)
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions && Array.isArray(parsed.questions)) {
        // The active bank is keyed by its own id — if the calling examId
        // happens to match, return its questions directly.
        if (parsed.id === examId || parsed.metadata?.id === examId) {
          return parsed.questions;
        }
      }
    }
  } catch {
    /* ignore */
  }

  return [];
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gradeLetter(pct: number): {
  letter: string;
  label: string;
  className: string;
} {
  if (pct >= 80)
    return {
      letter: "A",
      label: "Exceeds Expectations",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  if (pct >= 60)
    return {
      letter: "B",
      label: "Meets Expectations",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    };
  if (pct >= 40)
    return {
      letter: "C",
      label: "Approaches Expectations",
      className: "bg-amber-100 text-amber-800 border-amber-300",
    };
  return {
    letter: "D",
    label: "Below Expectations",
    className: "bg-red-100 text-red-800 border-red-300",
  };
}

// ─── PDF download handler (the canonical one from the spec) ──────────────────

async function handleDownloadScriptPDF(submission: StudentSubmission): Promise<void> {
  const element = document.getElementById(`script-pdf-${submission.id}`);
  if (!element) {
    showError("Could not find the marked script element to export.");
    return;
  }

  // Wait for every image in the export region to fully decode before we
  // hand the DOM to html2pdf.js.  This prevents blank image placeholders
  // for nursery beds, diagrams, and CBC visual prompts.
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      // decode() returns a promise that resolves once the image is ready
      // to be painted.  For already-cached images it's a no-op.
      if (typeof img.decode === "function") {
        return img.decode().catch(() => undefined);
      }
      // Fallback: wait for the onload event.
      return new Promise<void>((resolve) => {
        if (img.complete) return resolve();
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    // Coerce names to safe strings so a missing field can't blow up the
    // filename generation inside html2pdf.js.
    filename: `${String(submission?.studentName || "Student")
      .replace(/[^a-zA-Z0-9_\- ]/g, "_")
      .replace(/\s+/g, "_")}_${String(submission?.examTitle || "Exam")
      .replace(/[^a-zA-Z0-9_\- ]/g, "_")
      .replace(/\s+/g, "_")}_Marked.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    html2pdf()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .set(opt)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .from(element)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .save();
    showSuccess("Marked script PDF generated.");
  } catch (err) {
    console.error("[MarkedScriptsList] PDF generation failed:", err);
    showError("Failed to generate PDF. Please try again.");
  }
}

// ─── Preview Dialog (renders the PDF wrapper + a Print button) ──────────────

interface ScriptPreviewDialogProps {
  submission: StudentSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ScriptPreviewDialog: React.FC<ScriptPreviewDialogProps> = ({
  submission,
  open,
  onOpenChange,
}) => {
  if (!submission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Marked Script</DialogTitle>
            <DialogDescription>No submission selected.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const questions = useMemo(
    () => loadQuestionsForExam(submission.examId),
    [submission.examId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-3xl border-0">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest opacity-80">
              Marked Script Preview
            </p>
            <h2 className="font-bold truncate">
              {submission.studentName} · {submission.examTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => handleDownloadScriptPDF(submission)}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-xl bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => onOpenChange(false)}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[78vh] bg-slate-100">
          <div className="p-6 flex justify-center">
            {/* The printable wrapper rendered as a paper sheet */}
            <div className="shadow-2xl rounded-2xl overflow-hidden bg-white">
              <MarkedScriptPDF
                submission={submission}
                questions={questions}
                schoolName={SCHOOL_NAME}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────

const GRADE_OPTIONS_LIST: string[] = [
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

const MarkedScriptsList: React.FC = () => {
  const { submissions, isLoading, deleteSubmission } = useMarkedSubmissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const [previewing, setPreviewing] = useState<StudentSubmission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Build a unique list of exam titles for the filter dropdown.
  const examOptions = useMemo(() => {
    const seen = new Map<string, string>();
    submissions.forEach((s) => {
      if (!seen.has(s.examId)) seen.set(s.examId, s.examTitle || "Untitled exam");
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [submissions]);

  // Streams actually present on the current submissions list.
  const streamOptions = useMemo(() => {
    const seen = new Set<string>();
    submissions.forEach((s) => {
      if (s.stream) seen.add(s.stream);
    });
    return Array.from(seen).sort();
  }, [submissions]);

  // Grades actually present on the current submissions list (so admins
  // who use custom grade labels still see their values in the dropdown).
  const gradeOptions = useMemo(() => {
    const seen = new Set<string>();
    submissions.forEach((s) => {
      if (s.grade) seen.add(s.grade);
    });
    // Always expose the canonical CBC list as a baseline.
    GRADE_OPTIONS_LIST.forEach((g) => seen.add(g));
    return Array.from(seen);
  }, [submissions]);

  const filtered = useMemo(() => {
      const q = String(searchTerm || '').trim().toLowerCase();
    return submissions.filter((s) => {
      if (examFilter !== "all" && s.examId !== examFilter) return false;
      if (
              gradeFilter !== "all" &&
                            String(s.grade || '').trim().toLowerCase() !== String(gradeFilter || '').trim().toLowerCase()
            ) {
              return false;
            }
            if (
              streamFilter !== "all" &&
                            String(s.stream || '').trim().toLowerCase() !== String(streamFilter || '').trim().toLowerCase()
            ) {
              return false;
            }
      if (!q) return true;
      return (
        (s.studentName || "").toLowerCase().includes(q) ||
        (s.admissionNo || "").toLowerCase().includes(q) ||
        (s.examTitle || "").toLowerCase().includes(q) ||
        (s.grade || "").toLowerCase().includes(q) ||
        (s.stream || "").toLowerCase().includes(q)
      );
    });
  }, [submissions, searchTerm, examFilter, gradeFilter, streamFilter]);

  // Class-level roll-up for the stats card.
  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const total = filtered.reduce((s, x) => s + x.percentage, 0);
    const avg = Math.round(total / filtered.length);
    const highest = Math.max(...filtered.map((s) => s.percentage));
    const lowest = Math.min(...filtered.map((s) => s.percentage));
    return { avg, highest, lowest, count: filtered.length };
  }, [filtered]);

  const handlePreview = (submission: StudentSubmission) => {
    setPreviewing(submission);
    setPreviewOpen(true);
  };

  const handleDownload = (submission: StudentSubmission) => {
    setDownloadingId(submission.id);
    // The PDF wrapper is always rendered (off-screen via the dialog), so
    // make sure the previewing element exists. The simplest cross-cutting
    // path is: if a preview is open for the same submission, just call
    // the handler; otherwise, briefly mount the wrapper for this single
    // submission off-screen to satisfy the lookup.
    if (previewing?.id === submission.id && previewOpen) {
      handleDownloadScriptPDF(submission);
      setDownloadingId(null);
      return;
    }
    // Force-mount the element for one tick so html2pdf can find it.
    const mount = document.createElement("div");
    mount.style.position = "fixed";
    mount.style.left = "-99999px";
    mount.style.top = "0";
    mount.style.width = "210mm";
    document.body.appendChild(mount);
    // Use a tiny render via React DOM so the id is present.
    // We rebuild a minimal container with the same id and rely on the
    // existing dialog element by opening it first.
    setPreviewing(submission);
    setPreviewOpen(true);
    // After mount, fire the export. The preview dialog renders
    // MarkedScriptPDF which exposes script-pdf-{id}.
    window.setTimeout(() => {
      handleDownloadScriptPDF(submission);
      document.body.removeChild(mount);
      setDownloadingId(null);
    }, 250);
  };

  const handleDelete = (submission: StudentSubmission) => {
    const ok = window.confirm(
      `Delete the marked script for ${submission.studentName}? This cannot be undone.`
    );
    if (!ok) return;
    if (deleteSubmission(submission.id)) {
      showSuccess("Marked script removed.");
    } else {
      showError("Could not remove the marked script.");
    }
  };

  // Close the preview if the underlying record is deleted.
  useEffect(() => {
    if (previewing && !submissions.some((s) => s.id === previewing.id)) {
      setPreviewing(null);
      setPreviewOpen(false);
    }
  }, [submissions, previewing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-800 truncate">
                Marked Scripts
              </h1>
              <p className="text-sm text-slate-500">
                Persistent archive of graded student assessments with PDF export.
              </p>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1.5 font-semibold"
            >
              <Inbox className="w-3.5 h-3.5 mr-1.5" />
              {submissions.length} script{submissions.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              icon={<Inbox className="w-4 h-4" />}
              label="Total Scripts"
              value={String(stats.count)}
              tone="indigo"
            />
            <StatTile
              icon={<GraduationCap className="w-4 h-4" />}
              label="Class Average"
              value={`${stats.avg}%`}
              tone="blue"
            />
            <StatTile
              icon={<Award className="w-4 h-4" />}
              label="Highest"
              value={`${stats.highest}%`}
              tone="emerald"
            />
            <StatTile
              icon={<Award className="w-4 h-4" />}
              label="Lowest"
              value={`${stats.lowest}%`}
              tone="rose"
            />
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by student, admission number, or exam title…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl border-slate-200"
                aria-label="Search marked scripts"
              />
            </div>
            <div className="sm:w-72">
                  <Select value={examFilter} onValueChange={setExamFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <SelectValue placeholder="All exams" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All exams</SelectItem>
                      {examOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Grade filter */}
                <div className="sm:w-44">
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {gradeOptions.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Stream filter */}
                <div className="sm:w-36">
                  <Select value={streamFilter} onValueChange={setStreamFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="All Streams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Streams</SelectItem>
                      {streamOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
          </CardContent>
        </Card>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {isLoading ? (
            <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm">Loading marked scripts…</p>
            </CardContent>
          ) : filtered.length === 0 ? (
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4 shadow-inner">
                <FileText className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-700 mb-1">
                {submissions.length === 0
                  ? "No Marked Scripts Yet"
                  : "No Scripts Match Your Filters"}
              </h2>
              <p className="text-sm text-slate-500 max-w-md">
                {submissions.length === 0
                  ? "Marked scripts appear here automatically once a teacher finishes grading an assessment. Use the Teacher Grading dashboard to publish a script."
                  : "Try clearing your search or switching to a different exam."}
              </p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600">
                  <tr>
                    <Th>Student Name</Th>
                    <Th>Admission No.</Th>
                    <Th>Exam Title</Th>
                    <Th>Score</Th>
                    <Th>Date</Th>
                    <Th className="text-right pr-6">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const grade = gradeLetter(s.percentage);
                    return (
                      <tr
                        key={s.id}
                        className="border-t border-slate-100 hover:bg-indigo-50/40 transition-colors"
                      >
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {s.studentName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {s.studentName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {s.score} / {s.totalPoints} pts
                              </p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-mono text-xs">
                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                            {s.admissionNo || "—"}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-slate-700 line-clamp-1 max-w-[220px] inline-block">
                            {s.examTitle}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-indigo-700">
                              {s.percentage}%
                            </span>
                            <Badge
                              className={`text-[10px] font-bold rounded-lg border ${grade.className}`}
                            >
                              {grade.letter}
                            </Badge>
                          </div>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {fmtDate(s.submittedAt)}
                          </span>
                        </Td>
                        <Td className="text-right pr-6">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-3 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              onClick={() => handlePreview(s)}
                              data-testid={`view-script-${s.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              View Script
                            </Button>
                            <Button
                              size="sm"
                              className="h-9 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                              onClick={() => handleDownload(s)}
                              disabled={downloadingId === s.id}
                              data-testid={`download-script-${s.id}`}
                            >
                              {downloadingId === s.id ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-1.5" />
                              )}
                              Download PDF
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(s)}
                              title="Delete marked script"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Preview dialog ─────────────────────────────────────────────── */}
      <ScriptPreviewDialog
        submission={previewing}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
};

// ─── Tiny presentational helpers ────────────────────────────────────────────

const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
  ...rest
}) => (
  <th
    {...rest}
    className={`text-left text-[11px] font-black uppercase tracking-widest px-6 py-3.5 ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
  ...rest
}) => (
  <td {...rest} className={`px-6 py-4 align-middle ${className}`}>
    {children}
  </td>
);

const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "indigo" | "blue" | "emerald" | "rose";
}> = ({ icon, label, value, tone }) => {
  const toneMap: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-700 border-indigo-200",
    blue: "from-blue-500/10 to-blue-500/0 text-blue-700 border-blue-200",
    emerald:
      "from-emerald-500/10 to-emerald-500/0 text-emerald-700 border-emerald-200",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-700 border-rose-200",
  };
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm bg-gradient-to-br ${toneMap[tone]} p-4 flex items-center gap-3`}
    >
      <div className="w-10 h-10 rounded-xl bg-white shadow-inner flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </div>
        <div className="text-2xl font-black text-slate-800">{value}</div>
      </div>
    </div>
  );
};

export default MarkedScriptsList;
