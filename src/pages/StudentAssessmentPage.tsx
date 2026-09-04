"use client";

import React, { useState, useEffect } from "react";
import StudentAssessmentView from "@/components/assessments/StudentAssessmentView";
import type { Assessment } from "@/types/questions";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTION_BANK_KEY = "question_bank";

/**
 * Take Assessment page.
 * Loads the active assessment from question_bank and renders it via StudentAssessmentView.
 */
const StudentAssessmentPage: React.FC = () => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    // Load assessment
    try {
      const raw = localStorage.getItem(QUESTION_BANK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.questions?.length > 0) {
          setAssessment({
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
          });
        }
      }
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
      } catch { /* ignore */ }
    }

    if (!studentId) {
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
          }
        }
      } catch { /* ignore */ }
    }

    if (!studentId) {
      setStudentId("student_demo_01");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!assessment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No Assessment Available</h2>
          <p className="text-sm text-slate-500">
            An assessment has not been created yet. Please ask your teacher to create one using the
            Question Bank &amp; Import tool.
          </p>
          <Button
            onClick={() => (window.location.href = "/assessments/import")}
            className="rounded-xl"
          >
            Go to Question Bank
          </Button>
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
