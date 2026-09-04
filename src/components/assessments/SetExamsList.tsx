"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
  ClipboardCheck,
  CheckCircle2,
  Search,
  Clock,
  Award,
  ListChecks,
  BookOpen,
  Library,
  FileQuestion,
  Eye,
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
import type { Assessment } from "@/types/questions";

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

  // Sort: newest first
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return items;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
const SetExamsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isStudent = role === "student" || role === "parent";
  const isTeacher =
    role === "admin" ||
    role === "super_admin" ||
    role === "head_teacher" ||
    role === "teacher";

  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ExamStatus>("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  // Refresh on mount
  const refresh = useCallback(() => {
    setExams(loadExams());
  }, []);

  useEffect(() => {
    refresh();

    // Listen for storage changes from other tabs
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

    // Listen for in-app data changes
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
        // 1. Remove from assessments array
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const next = parsed.filter((a) => a.id !== id);
            localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(next));
          }
        }
        // 2. Remove from question_bank IF this is the active exam
        const bankRaw = localStorage.getItem(QUESTION_BANK_KEY);
        if (bankRaw) {
          const parsed = JSON.parse(bankRaw);
          const bankId = parsed?.metadata?.assessmentId || "assessment_bank_default";
          if (bankId === id) {
            localStorage.removeItem(QUESTION_BANK_KEY);
          }
        }
        // 3. Remove from status / closed lists
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

  const handleToggleStatus = useCallback(
    (id: string) => {
      const statusMap = loadStatusOverrides();
      const closed = new Set(loadClosedExams());
      const current = closed.has(id) ? "Closed" : statusMap[id] || "Published";

      let next: ExamStatus;
      if (current === "Published") next = "Draft";
      else if (current === "Draft") next = "Closed";
      else next = "Published";

      if (next === "Closed") closed.add(id);
      else closed.delete(id);
      saveClosedExams(Array.from(closed));

      statusMap[id] = next;
      saveStatusOverrides(statusMap);

      showSuccess(`Status changed to ${next}.`);
      refresh();
    },
    [refresh]
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = exams;
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
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
  }, [exams, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: exams.length,
      published: exams.filter((e) => e.status === "Published").length,
      draft: exams.filter((e) => e.status === "Draft").length,
      closed: exams.filter((e) => e.status === "Closed").length,
    };
  }, [exams]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderCard = (exam: ExamListItem) => {
    const isOpen = exam.status === "Published";
    return (
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
              <div className="text-[9px] font-black uppercase tracking-widest text-violet-500">
                Questions
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl py-2.5 px-1">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
                <Award size={12} />
              </div>
              <div className="text-base font-black text-blue-700">{exam.totalMarks}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                Total Pts
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl py-2.5 px-1">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-0.5">
                <Clock size={12} />
              </div>
              <div className="text-base font-black text-amber-700">{exam.duration}m</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                Time Limit
              </div>
            </div>
          </div>

          {/* Footer date + actions */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <Calendar size={10} />
            Updated {new Date(exam.updatedAt).toLocaleDateString()}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {isStudent ? (
              <Button
                asChild
                disabled={!isOpen}
                className="flex-1 rounded-xl h-10 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold disabled:opacity-50"
              >
                <Link to={`/assessments/student?id=${encodeURIComponent(exam.id)}`}>
                  <PlayCircle size={16} />
                  Take Exam
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  disabled={!isOpen}
                  className="flex-1 rounded-xl h-10 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold disabled:opacity-50"
                >
                  <Link to={`/assessments/student?id=${encodeURIComponent(exam.id)}`}>
                    <PlayCircle size={16} />
                    Take
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 rounded-xl h-10 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
                >
                  <Link to={`/assessments/grading?id=${encodeURIComponent(exam.id)}`}>
                    <ClipboardCheck size={16} />
                    Grade
                  </Link>
                </Button>
              </>
            )}

            {isTeacher && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl h-10 w-10 text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                  title="Edit"
                >
                  <Link to={`/assessments/create?id=${encodeURIComponent(exam.id)}`}>
                    <Pencil size={16} />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleStatus(exam.id)}
                  className="rounded-xl h-10 w-10 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  title={`Cycle status (currently ${exam.status})`}
                >
                  <Eye size={16} />
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTable = () => (
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Assessment
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Subject
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Questions
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Pts
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Time
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No exams match your filters.
                </td>
              </tr>
            )}
            {filtered.map((exam) => {
              const isOpen = exam.status === "Published";
              return (
                <tr key={exam.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800 line-clamp-1">{exam.title}</p>
                    <p className="text-xs text-slate-400">Class {exam.classLevel}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCategory(exam.category)}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{exam.subject}</td>
                  <td className="px-4 py-3 text-center font-bold text-violet-700">
                    {exam.questionCount}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700">
                    {exam.totalMarks}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-amber-700">
                    {exam.duration}m
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        statusBadge(exam.status)
                      )}
                    >
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        disabled={!isOpen}
                        className="rounded-lg h-8 w-8 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                        title="Take Exam"
                      >
                        <Link to={`/assessments/student?id=${encodeURIComponent(exam.id)}`}>
                          <PlayCircle size={14} />
                        </Link>
                      </Button>
                      {!isStudent && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="rounded-lg h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                          title="Grade Submissions"
                        >
                          <Link to={`/assessments/grading?id=${encodeURIComponent(exam.id)}`}>
                            <ClipboardCheck size={14} />
                          </Link>
                        </Button>
                      )}
                      {isTeacher && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="rounded-lg h-8 w-8 text-violet-600 hover:bg-violet-50"
                            title="Edit"
                          >
                            <Link to={`/assessments/create?id=${encodeURIComponent(exam.id)}`}>
                              <Pencil size={14} />
                            </Link>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 max-w-full">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Library className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">All Set Exams</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage every published, draft, and closed exam from one place.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="rounded-xl h-11 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-violet-100 gap-2"
          >
            <Link to="/assessments/create">
              <Plus size={16} />
              Create New Exam
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            statusFilter === "all"
              ? "bg-slate-50 border-slate-300 shadow-sm"
              : "bg-white border-slate-100 hover:border-slate-200"
          )}
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileQuestion size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total</span>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total}</div>
        </button>
        <button
          onClick={() => setStatusFilter("Published")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            statusFilter === "Published"
              ? "bg-emerald-50 border-emerald-300 shadow-sm"
              : "bg-white border-slate-100 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Published</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.published}</div>
        </button>
        <button
          onClick={() => setStatusFilter("Draft")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            statusFilter === "Draft"
              ? "bg-slate-100 border-slate-300 shadow-sm"
              : "bg-white border-slate-100 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileQuestion size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Draft</span>
          </div>
          <div className="text-2xl font-black text-slate-700">{stats.draft}</div>
        </button>
        <button
          onClick={() => setStatusFilter("Closed")}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            statusFilter === "Closed"
              ? "bg-red-50 border-red-300 shadow-sm"
              : "bg-white border-slate-100 hover:border-red-200"
          )}
        >
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <X size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Closed</span>
          </div>
          <div className="text-2xl font-black text-red-700">{stats.closed}</div>
        </button>
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl bg-slate-50 border-none font-bold">
              <Filter size={14} className="mr-1" />
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

      {/* Empty state */}
      {exams.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-2xl">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Library className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-1">No exams yet</h2>
            <p className="text-sm text-slate-400 max-w-sm mb-5">
              Create your first exam using the Exam Creator, or import questions in bulk via CSV.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button asChild className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-purple-600">
                <Link to="/assessments/create">
                  <Plus size={16} /> Create New Exam
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl gap-2 border-indigo-200 bg-indigo-50 text-indigo-700">
                <Link to="/assessments/import">
                  <BookOpen size={16} /> Bulk Import
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 font-semibold">
              No exams match the current filters.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
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
