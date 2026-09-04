"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import StudentAssessmentView from "@/components/assessments/StudentAssessmentView";
import type { Assessment } from "@/types/questions";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTION_BANK_KEY = "question_bank";
const ASSESSMENTS_KEY = "assessments";
const ALL_SET_EXAMS_KEY = "all_set_exams";

/**
 * Take Assessment page.
 * Reads `?id=` from the URL — if present, looks up that assessment in the
 * `all_set_exams` (primary) or `assessments` localStorage keys. Otherwise
 * falls back to the active assessment in `question_bank`.
 */
const StudentAssessmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("id");

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");

  const loadAssessment = useCallback((): Assessment | null => {
    // 1. If a specific exam id is requested, check `all_set_exams` first
    if (requestedId) {
      try {
        const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((a) => a.id === requestedId);
            if (found) return found;
          }
        }
      } catch { /* ignore */ }

      try {
        const raw = localStorage.getItem(ASSESSMENTS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((a) => a.id === requestedId);
            if (found) return found;
          }
        }
      } catch { /* ignore */ }
    }

    // 2. Fall back to the active exam in `question_bank`
    try {
      const raw = localStorage.getItem(QUESTION_BANK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.questions?.length > 0) {
          return {
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
    } catch { /* ignore */ }

    // 3. If no specific id, fall back to first item in all_set_exams
    if (!requestedId) {
      try {
        const raw = localStorage.getItem(ALL_SET_EXAMS_KEY);
        if (raw) {
          const parsed: Assessment[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
        }
      } catch { /* ignore */ }
    }

    return null;
  }, [requestedId]);

  useEffect(() => {
    try {
      const loaded = loadAssessment();
      if (loaded) setAssessment(loaded);
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
  }, [loadAssessment]);

  // Listen for assessments_updated so same-tab saves show up immediately
  useEffect(() => {
    const onUpdate = () => {
      const loaded = loadAssessment();
      if (loaded) setAssessment(loaded);
    };
    window.addEventListener("assessments_updated", onUpdate);
    const onStorage = (e: StorageEvent) => {
      if ([ALL_SET_EXAMS_KEY, ASSESSMENTS_KEY, QUESTION_BANK_KEY].includes(e.key || "")) {
        onUpdate();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("assessments_updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadAssessment]);

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
