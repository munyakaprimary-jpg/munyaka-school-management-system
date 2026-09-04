"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  FileSpreadsheet,
  BarChart3,
  BookOpen,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileQuestion,
  TrendingUp,
  Users,
  Award,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllAssessmentResults } from "@/utils/assessmentResults";
import type { Assessment, AssessmentResult, StudentSubmission } from "@/types/questions";

// ─── Storage keys ──────────────────────────────────────────────────────────────
const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const SUBMISSION_KEY = "student_submissions";

// ─── Load helpers ────────────────────────────────────────────────────────────
function loadActiveAssessments(): Assessment[] {
  const result: Assessment[] = [];

  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.questions?.length > 0) {
        result.push({
          id: "assessment_default_01",
          title: parsed.metadata?.title || "Current Assessment",
          category: parsed.metadata?.category || "Formative Quiz",
          classLevel: parsed.metadata?.classLevel || "—",
          subject: parsed.metadata?.subject || "—",
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

function loadSubmissions(assessmentId?: string): StudentSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return [];
    const all: Record<string, StudentSubmission> = JSON.parse(raw);
    const values = Object.values(all).filter((s) => s.isComplete);
    if (assessmentId) return values.filter((s) => s.assessmentId === assessmentId);
    return values;
  } catch {
    return [];
  }
}

function countPendingGrading(assessmentId?: string): number {
  const submissions = loadSubmissions(assessmentId);
  if (submissions.length === 0) return 0;

  let pending = 0;
  submissions.forEach((sub) => {
    try {
      const cachedRaw = localStorage.getItem(
        `grading_structured_${assessmentId || sub.assessmentId}_${sub.studentId}`
      );
      if (!cachedRaw) {
        // No grading data at all — count as pending if assessment has structured questions
        pending++;
        return;
      }
      const cached: Record<string, number> = JSON.parse(cachedRaw);
      // Check if any structured question is ungraded
      // We'll count the submission as pending if we don't have grading data
      // This is approximate since we don't have the question list here
      const gradedCount = Object.keys(cached).length;
      if (gradedCount === 0) pending++;
    } catch {
      pending++;
    }
  });
  return pending;
}

// ─── Grade level helpers ──────────────────────────────────────────────────────
function gradeColor(level: AssessmentResult["gradeLevel"]): string {
  switch (level) {
    case "EE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ME": return "bg-blue-100 text-blue-700 border-blue-200";
    case "AE": return "bg-amber-100 text-amber-700 border-amber-200";
    case "BE": return "bg-red-100 text-red-700 border-red-200";
    default:   return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function gradeLabel(level: AssessmentResult["gradeLevel"] | undefined): string {
  switch (level) {
    case "EE": return "Exceeds Expectations";
    case "ME": return "Meets Expectations";
    case "AE": return "Approaches Expectations";
    case "BE": return "Below Expectations";
    default:   return "—";
  }
}

// ─── Quick Link Card ──────────────────────────────────────────────────────────
interface QuickLink {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  path: string;
  accent: string;
  badge?: string;
  badgeVariant?: string;
}

const QuickLinkCard: React.FC<QuickLink> = ({
  icon: Icon,
  label,
  description,
  path,
  accent,
  badge,
  badgeVariant = "bg-indigo-50 text-indigo-600",
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
    >
      <div className="flex items-start gap-3">
        <div className={`${accent} p-2.5 rounded-xl shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-800 text-sm">{label}</p>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeVariant}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
        <ChevronRight
          size={14}
          className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
        />
      </div>
    </button>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AssessmentsHub() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [recentResults, setRecentResults] = useState<AssessmentResult[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all data in parallel
    const activeAsmts = loadActiveAssessments();
    const allResults = getAllAssessmentResults();
    const submissions = loadSubmissions();

    setAssessments(activeAsmts);
    setRecentResults(
      [...allResults]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5)
    );
    setTotalSubmissions(submissions.length);
    setIsLoading(false);
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const pendingGradeCount = recentResults.filter(
      (r) => r.isComplete && r.responses.some((resp) => resp.answerText && !("awardedPoints" in resp))
    ).length;
    // Count submissions without any result yet
    const submissions = loadSubmissions();
    const resultStudentIds = new Set(recentResults.map((r) => `${r.assessmentId}_${r.studentId}`));
    const unprocessedSubmissions = submissions.filter(
      (s) => !resultStudentIds.has(`${s.assessmentId}_${s.studentId}`)
    ).length;

    return {
      totalActiveTests: assessments.length,
      pendingGrading: unprocessedSubmissions + pendingGradeCount,
      totalSubmissions,
      totalResults: recentResults.length,
    };
  }, [assessments, recentResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessments &amp; Examinations</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage tests, grade submissions, and analyse results — all in one place.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Summary Stats Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Active Tests */}
          <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
                <FileQuestion size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Active Tests</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalActiveTests}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Total assessments available</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Grading */}
          <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${stats.pendingGrading > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
                {stats.pendingGrading > 0 ? (
                  <AlertCircle size={20} className="text-amber-600" />
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Pending Grading</p>
                <p className={`text-2xl font-black leading-none ${stats.pendingGrading > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {stats.pendingGrading}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Submissions awaiting marks</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Submissions */}
          <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Total Submissions</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalSubmissions}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Student test completions</p>
              </div>
            </CardContent>
          </Card>

          {/* Graded Results */}
          <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl shrink-0">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Graded Results</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalResults}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Assessment records saved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Quick Links ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <ArrowRight size={14} className="text-indigo-500" />
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLinkCard
                icon={FileSpreadsheet}
                label="Enter Marks"
                description="Input numeric scores for students per subject and term."
                path="/assessments"
                accent="bg-gradient-to-br from-emerald-500 to-teal-600"
                badge="Marks"
                badgeVariant="bg-emerald-50 text-emerald-600"
              />
              <QuickLinkCard
                icon={Award}
                label="Grading Review"
                description="Auto-score MCQs and manually grade structured responses."
                path="/grading"
                badge="Review"
                badgeVariant="bg-indigo-50 text-indigo-600"
                accent="bg-gradient-to-br from-indigo-500 to-purple-600"
              />
              <QuickLinkCard
                icon={BarChart3}
                label="Results Analysis"
                description="View performance breakdowns, class averages and trends."
                path="/analysis"
                accent="bg-gradient-to-br from-blue-500 to-cyan-600"
                badge="Analytics"
                badgeVariant="bg-blue-50 text-blue-600"
              />
              <QuickLinkCard
                icon={BookOpen}
                label="Question Creator"
                description="Build MCQ and structured question banks for any subject."
                path="/question-creator"
                accent="bg-gradient-to-br from-violet-500 to-purple-600"
                badge="Create"
                badgeVariant="bg-violet-50 text-violet-600"
              />
              <QuickLinkCard
                icon={Settings}
                label="Assessment Settings"
                description="Configure grading scales, exam types, and academic terms."
                path="/assessment-settings"
                accent="bg-gradient-to-br from-slate-500 to-slate-600"
                badge="Config"
                badgeVariant="bg-slate-100 text-slate-600"
              />
              <QuickLinkCard
                icon={FileText}
                label="Report Cards"
                description="Generate and download report cards for students."
                path="/reports"
                accent="bg-gradient-to-br from-amber-500 to-orange-600"
                badge="Reports"
                badgeVariant="bg-amber-50 text-amber-600"
              />
            </div>
          </div>

          {/* Right: Recent Results + Active Tests ───────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recent Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <ArrowRight size={14} className="text-indigo-500" />
                  Recent Results
                </h2>
                <button
                  onClick={() => navigate("/analysis")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View All <ArrowRight size={10} />
                </button>
              </div>

              {recentResults.length === 0 ? (
                <Card className="border border-slate-200 bg-white rounded-2xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No results yet</p>
                  <p className="text-xs text-slate-400">
                    Results will appear here once students complete and submit assessments.
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentResults.map((result) => (
                    <Card
                      key={result.id}
                      className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate("/grading")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {result.studentName || result.studentId}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {result.assessmentTitle || result.subjectName}
                            {" · "}{result.className}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(result.submittedAt).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-slate-900">
                            {result.percentage}%
                          </p>
                          <Badge
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${gradeColor(result.gradeLevel)}`}
                          >
                            {result.gradeLevel || "—"}
                          </Badge>
                        </div>
                      </div>
                      {/* Mini score bar */}
                      <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${result.percentage}%`,
                            background:
                              result.percentage >= 80
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : result.percentage >= 60
                                ? "linear-gradient(90deg, #3b82f6, #1d4ed8)"
                                : result.percentage >= 40
                                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                : "linear-gradient(90deg, #ef4444, #dc2626)",
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Active Tests */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <ArrowRight size={14} className="text-indigo-500" />
                  Active Tests
                </h2>
                <button
                  onClick={() => navigate("/question-creator")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Create New <ArrowRight size={10} />
                </button>
              </div>

              {assessments.length === 0 ? (
                <Card className="border border-slate-200 bg-white rounded-2xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <FileQuestion size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No active tests</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Create a question bank to set up your first assessment.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/question-creator")}
                    className="h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-xs"
                  >
                    Go to Question Creator
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {assessments.slice(0, 3).map((a) => (
                    <Card
                      key={a.id}
                      className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-all cursor-pointer"
                      onClick={() => navigate("/question-creator")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {a.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {a.subject || "—"} · {a.category}
                            {" · "}Class {a.classLevel}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <FileQuestion size={10} /> {a.questions.length} Qs
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {a.duration} min
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Award size={10} /> {a.totalMarks} pts
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 text-[10px] font-semibold shrink-0">
                          {a.questions.length} Qs
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
