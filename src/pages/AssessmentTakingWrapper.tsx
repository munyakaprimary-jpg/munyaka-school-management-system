"use client";

import { useEffect, useState } from "react";
import AssessmentTaking from "./AssessmentTaking";
import type { Assessment } from "@/types/questions";
import { Card } from "@/components/ui/card";
import { BookOpen, AlertCircle, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTION_BANK_KEY = "question_bank";

/**
 * Wrapper component that loads the active assessment from local storage
 * (using the same key as QuestionCreator) and renders the AssessmentTaking screen.
 */
export default function AssessmentTakingWrapper() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  // Load student identity
  const [studentInfo] = useState<{ studentId: string; studentName?: string }>(() => {
    try {
      const session = localStorage.getItem("current_student_session");
      if (session) {
        const parsed = JSON.parse(session);
        return {
          studentId: parsed.id || parsed.studentId || "student_demo_01",
          studentName: parsed.name || parsed.studentName,
        };
      }
    } catch {
      /* ignore */
    }

    // Fallback to first active learner
    try {
      const learnersRaw = localStorage.getItem("school_learners_data");
      if (learnersRaw) {
        const learners = JSON.parse(learnersRaw);
        const active = Array.isArray(learners)
          ? learners.find((l: any) => l.status !== "TRANSFERRED")
          : null;
        if (active) {
          return {
            studentId: active.id || "student_demo_01",
            studentName: active.name,
          };
        }
      }
    } catch {
      /* ignore */
    }

    return { studentId: "student_demo_01" };
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUESTION_BANK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          const loaded: Assessment = {
            id: "assessment_default_01",
            title: parsed.metadata?.title || "Assessment Quiz",
            category: parsed.metadata?.category || "Formative Quiz",
            classLevel: parsed.metadata?.classLevel || "10",
            subject: parsed.metadata?.subject || "Mathematics",
            duration: parsed.metadata?.duration || 60,
            totalMarks: parsed.metadata?.totalMarks || 100,
            randomizeQuestions: parsed.metadata?.randomize || false,
            showImmediateFeedback: parsed.metadata?.showFeedback ?? true,
            questions: parsed.questions,
            createdAt: parsed.savedAt || new Date().toISOString(),
            updatedAt: parsed.savedAt || new Date().toISOString(),
          };
          setAssessment(loaded);
        }
      }
    } catch (e) {
      console.error("Failed to load assessment:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Active Assessment</h2>
          <p className="text-slate-500 mb-6">
            Please create questions using the Question Creator first before opening the Assessment Taking screen.
          </p>
          <Button
            onClick={() => (window.location.href = "/question-creator")}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold"
          >
            Go to Question Creator
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AssessmentTaking
      assessment={assessment}
      studentId={studentInfo.studentId}
      studentName={studentInfo.studentName}
    />
  );
}
