"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Award,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { notifyDataChanged } from "@/utils/storage";
import { getAllAssessmentResults } from "@/utils/assessmentResults";
import { useBackToAssessmentsMenu } from "@/hooks/useBackToAssessmentsMenu";
import { useFileDownload } from "@/utils/fileDownloader";
import type { Assessment, AssessmentResult, StudentSubmission } from "@/types/questions";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const SUBMISSION_KEY = "student_submissions";
const RESULTS_KEY = "munyaka_assessment_results";

function loadAvailableAssessments(): Assessment[] {
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

export default function GradingReview() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");

  const csvExport = useFileDownload();

  const handleBackToParent = useBackToAssessmentsMenu(
    {},
    {
      resets: [
        () => setSelectedAssessmentId(""),
        () => setSelectedAssessment(null),
        () => setSearchTerm(""),
      ],
    }
  );

  useEffect(() => {
    const available = loadAvailableAssessments();
    setAssessments(available);
    if (available.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(available[0].id);
    }
  }, []);

  useEffect(() => {
    if (!selectedAssessmentId) return;
    const assessment = assessments.find((a) => a.id === selectedAssessmentId) || null;
    setSelectedAssessment(assessment);

    try {
      const allRes = getAllAssessmentResults();
      const matched = allRes.filter((r) => r.assessmentId === selectedAssessmentId);
      setResults(matched);

      // Check publish status
      const publishStateRaw = localStorage.getItem(`assessment_published_${selectedAssessmentId}`);
      setIsPublished(publishStateRaw === "true");
    } catch {
      setResults([]);
    }
  }, [selectedAssessmentId, assessments]);

  // Analytics
  const stats = useMemo(() => {
    if (results.length === 0) return { avg: 0, highest: 0, lowest: 0, ee: 0, me: 0, ae: 0, be: 0 };
    const avg = Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length);
    const highest = Math.max(...results.map((r) => r.percentage));
    const lowest = Math.min(...results.map((r) => r.percentage));
    const ee = results.filter((r) => r.gradeLevel === "EE").length;
    const me = results.filter((r) => r.gradeLevel === "ME").length;
    const ae = results.filter((r) => r.gradeLevel === "AE").length;
    const be = results.filter((r) => r.gradeLevel === "BE").length;
    return { avg, highest, lowest, ee, me, ae, be };
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results;
    const q = searchTerm.toLowerCase();
    return results.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        (r.classId || "").toLowerCase().includes(q)
    );
  }, [results, searchTerm]);

  const handleTogglePublish = () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    localStorage.setItem(`assessment_published_${selectedAssessmentId}`, String(nextState));
    notifyDataChanged("assessment_published");
    if (nextState) {
      showSuccess("Assessment marks published to report cards!");
    } else {
      showSuccess("Assessment marks unpublished.");
    }
  };

  const handleExportAuditCSV = async () => {
    if (results.length === 0) {
      showError("No review data to export.");
      return;
    }
    const headers = ["Admission No", "Student Name", "Class", "Stream", "Total Score", "Max Score", "Percentage", "Rubric Level", "Submitted At"];
    const rows = results.map((r) => [
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${r.classId || ""}"`,
      `"${r.stream || ""}"`,
      r.totalScore,
      r.maxScore,
      `${r.percentage}%`,
      `"${r.gradeLevel}"`,
      `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    await csvExport.download({
      filename: `Grading_Review_Audit_${selectedAssessment?.title || "Assessment"}.csv`,
      data: csvContent,
      mimeType: "text/csv;charset=utf-8;",
      fileType: "csv",
      pendingMessage: "Generating audit report...",
      successMessage: "Audit report exported successfully!",
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToParent}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center"
              title="Back to Assessments Menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Grading Review &amp; Analytics</h1>
              <p className="text-sm text-slate-500">Read-only performance audit · Rubric breakdown · Report card publication</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-80">
              <div className="relative flex items-center w-full">
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-2xl shadow-sm text-xs font-bold text-gray-900 truncate focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer appearance-none pr-8"
                >
                  {assessments.length === 0 ? (
                    <option value="" disabled>No assessments found</option>
                  ) : (
                    assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title || "Assessment"} ({a.subject} • {a.category})
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-4 h-4"/>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExportAuditCSV}
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 border-purple-200 bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"
            >
              <Download className="w-4 h-4" /> Export Audit
            </Button>

            <Button
              onClick={handleTogglePublish}
              className={`h-10 px-5 rounded-xl font-semibold shadow-sm gap-2 ${
                isPublished
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-800 hover:bg-slate-900 text-white"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              {isPublished ? "Published (Unpublish)" : "Approve & Publish Marks"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!selectedAssessment ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Assessment Selected</h2>
            <p className="text-slate-500 max-w-md">
              Select an assessment above to review performance statistics and audit finalized marks.
            </p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isPublished ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <div className="flex items-center gap-3">
                {isPublished ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                <div>
                  <p className="font-bold text-sm">
                    {isPublished ? "Marks Published & Approved for Report Cards" : "Pending Publication (Review Mode)"}
                  </p>
                  <p className="text-xs opacity-80">
                    {isPublished
                      ? "Students and parents can view these scores on their report cards."
                      : "Review the analytics and audit trail below before publishing to report cards."}
                  </p>
                </div>
              </div>
              <Badge className={isPublished ? "bg-emerald-200 text-emerald-900 border-0 font-bold" : "bg-amber-200 text-amber-900 border-0 font-bold"}>
                {isPublished ? "Published" : "Draft Audit"}
              </Badge>
            </div>

            {/* High-level summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{results.length}</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Average</p>
                    <h3 className="text-3xl font-black text-indigo-600 mt-1">{stats.avg}%</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Score</p>
                    <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.highest}%</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Award className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lowest Score</p>
                    <h3 className="text-3xl font-black text-red-500 mt-1">{stats.lowest}%</h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rubric performance breakdown */}
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 pt-4 px-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  CBC Rubric Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="text-2xl font-black text-emerald-700">{stats.ee}</div>
                    <div className="text-xs font-bold text-emerald-800 mt-1">EE (Exceeds)</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">80% – 100%</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <div className="text-2xl font-black text-blue-700">{stats.me}</div>
                    <div className="text-xs font-bold text-blue-800 mt-1">ME (Meets)</div>
                    <div className="text-[10px] text-blue-600 mt-0.5">60% – 79%</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <div className="text-2xl font-black text-amber-700">{stats.ae}</div>
                    <div className="text-xs font-bold text-amber-800 mt-1">AE (Approaches)</div>
                    <div className="text-[10px] text-amber-600 mt-0.5">40% – 59%</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
                    <div className="text-2xl font-black text-red-700">{stats.be}</div>
                    <div className="text-xs font-bold text-red-800 mt-1">BE (Below)</div>
                    <div className="text-[10px] text-red-600 mt-0.5">0% – 39%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission status log & audit table */}
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 pt-4 px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Finalized Submission Audit Log
                </CardTitle>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search student or admission no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    No finalized results found for this assessment. Complete grading in <strong>Grading &amp; Marks</strong> and save results to see them here.
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="divide-y divide-slate-100">
                      {filteredResults.map((r) => (
                        <div key={r.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                              {r.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{r.studentName}</p>
                              <p className="text-xs text-slate-500">
                                Adm: {r.studentId} · {r.classId || "Class"} {r.stream ? `· ${r.stream}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 ml-12 sm:ml-0">
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-800">
                                {r.totalScore} / {r.maxScore} <span className="text-indigo-600 font-bold">({r.percentage}%)</span>
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Saved"}
                              </p>
                            </div>
                            <Badge className={`font-bold text-xs px-2.5 py-1 rounded-lg border ${
                              r.gradeLevel === "EE" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                              r.gradeLevel === "ME" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              r.gradeLevel === "AE" ? "bg-amber-100 text-amber-800 border-amber-300" :
                              "bg-red-100 text-red-800 border-red-300"
                            }`}>
                              {r.gradeLevel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
