"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import StudentAssessmentView from "@/components/assessments/StudentAssessmentView";
import type { Assessment } from "@/types/questions";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";

/**
 * Take Assessment page.
 * Reads `?id=` from the URL — if present, looks up that assessment in the
 * `assessments` localStorage key. Otherwise falls back to the active
 * assessment in `question_bank`.
 */
const StudentAssessmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("id");

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    let loadedAssessment: Assessment | null = null;

    try {
      // 1. If a specific exam id is requested, look it up in `assessments`
      if (requestedId) {
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((a) => a.id === requestedId);
            if (found) loadedAssessment = found;
          }
        }
      }

      // 2. Fall back to the active exam in `question_bank`
      if (!loadedAssessment) {
        const raw = localStorage.getItem(QUESTION_BANK_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.questions?.length > 0) {
            loadedAssessment = {
              id: parsed.metadata?.assessmentId || "assessment_default",
              title: parsed.metadata?.title || "Assessment",
              category: parsed.metadata?.category || "Formative Quiz",
              classLevel: parsed.metadata?.classLevel || "4",
              subject: parsed.metadata?.subject || "General",
              duration: parsed.metadata?.duration || 60,
              totalMarks: parsed.metadata?.totalMarks || 100,
              randomizeQuestions: parsed.metadata?.randomize || false,
              showImmediateFeedback: parsed.metadata?.showFeedback ?? false,
              questions: parsed.questions,
              createdAt: parsed.savedAt || new Date().toISOString(),
              updatedAt: parsed.savedAt || new Date().toISOString(),
            };
          }
        }
      }

      if (loadedAssessment) setAssessment(loadedAssessment);
    } catch (err) {
      console.error("[StudentAssessmentPage] Failed to load assessment:", err);
    }

    // Load student identity from session
    const sessionStudent = localStorage.getItem("current_student_session");
    if (sessionStudent) {
      try {
        const parsed = JSON.parse(sessionStudent);
        setStudentId(parsed.id || parsed.studentId || "student_demo_01");
        setStudentName(parsed.name || parsed.studentName || "");
        return;
      } catch { /* ignore */ }
    }

    // Fall back to first active learner
    try {
      const learnersRaw = localStorage.getItem("school_learners_data");
      if (learnersRaw) {
        const learners = JSON.parse(learnersRaw);
        const active = Array.isArray(learners)
          ? learners.find((l: any) => l.status !== "TRANSFERRED")
          : null;
        if (active) {
          setStudentId(active.id || active.admissionNumber || "student_demo_01");
          setStudentName(active.name || "");
          return;
        }
      }
    } catch { /* ignore */ }

    setStudentId("student_demo_01");
  }, [requestedId]);

  if (!assessment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No Assessment Available</h2>
          <p className="text-sm text-slate-500">
            The requested assessment could not be found, or no assessment has been created yet.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => (window.location.href = "/assessments/list")}
              className="rounded-xl"
            >
              View All Set Exams
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/assessments/import")}
              className="rounded-xl"
            >
              Bulk Import
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentAssessmentView
      assessment={assessment}
      studentId={studentId}
      studentName={studentName}
    />
  );
};

export default StudentAssessmentPage;
