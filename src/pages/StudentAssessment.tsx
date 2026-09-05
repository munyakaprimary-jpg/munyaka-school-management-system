"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  FileQuestion,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { Assessment, StudentSubmission, StudentResponse } from "@/types/questions";
import { buildAndSaveResult } from "@/utils/assessmentResults";

const STORAGE_KEY = "question_bank";
const SUBMISSION_STORAGE_KEY = "student_submissions";

export default function StudentAssessment() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 mins default
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load student identity from the main learner store
  const [studentInfo, setStudentInfo] = useState<{
    studentId: string;
    studentName?: string;
    classId: string;
    className: string;
    stream?: string;
  }>(() => {
    // Try to get the logged-in student from session or default to demo
    const sessionStudent = localStorage.getItem("current_student_session");
    if (sessionStudent) {
      try {
        const parsed = JSON.parse(sessionStudent);
        return {
          studentId: parsed.id || parsed.studentId || "student_demo_01",
          studentName: parsed.name || parsed.studentName,
          classId: parsed.grade || parsed.classId || "Grade 4",
          className: parsed.grade || parsed.classId || "Grade 4",
          stream: parsed.stream,
        };
      } catch { /* fall through */ }
    }

    // Fallback: load first active learner from school_learners_data
    try {
      const learnersRaw = localStorage.getItem("school_learners_data");
      if (learnersRaw) {
        const learners = JSON.parse(learnersRaw);
        const active = Array.isArray(learners) ? learners.find((l: any) => l.status !== "TRANSFERRED") : null;
        if (active) {
          return {
            studentId: active.id || "student_demo_01",
            studentName: active.name,
            classId: active.grade || "Grade 4",
            className: active.grade || "Grade 4",
            stream: active.stream,
          };
        }
      }
    } catch { /* fall through */ }

    return {
      studentId: "student_demo_01",
      classId: "Grade 4",
      className: "Grade 4",
    };
  });

  const studentId = studentInfo.studentId;

  // Load assessment and previous responses on mount
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          const loadedAssessment: Assessment = {
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
          setAssessment(loadedAssessment);
          setTimeLeft(loadedAssessment.duration * 60);

          // Check for saved responses
          const savedSubmissions = localStorage.getItem(SUBMISSION_STORAGE_KEY);
          if (savedSubmissions) {
            const submissions: Record<string, StudentSubmission> = JSON.parse(savedSubmissions);
            const userSub = submissions[`${loadedAssessment.id}_${studentId}`];
            if (userSub) {
              const respMap: Record<string, StudentResponse> = {};
              userSub.responses.forEach((r) => {
                respMap[r.questionId] = r;
              });
              setResponses(respMap);
              if (userSub.isComplete) {
                setIsSubmitted(true);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load assessment:", e);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || !assessment) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, assessment]);

  // Auto-save responses to localStorage
  const saveResponsesToStorage = (updatedResponses: Record<string, StudentResponse>, complete = false) => {
    if (!assessment) return;
    setSaveStatus("saving");

    try {
      const respList = Object.values(updatedResponses);
      const submission: StudentSubmission = {
        assessmentId: assessment.id,
        studentId,
        responses: respList,
        startedAt: new Date().toISOString(),
        submittedAt: complete ? new Date().toISOString() : undefined,
        isComplete: complete,
      };

      const existing = localStorage.getItem(SUBMISSION_STORAGE_KEY);
      const allSubmissions: Record<string, StudentSubmission> = existing ? JSON.parse(existing) : {};
      allSubmissions[`${assessment.id}_${studentId}`] = submission;
      localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(allSubmissions));

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (e) {
      console.error("Failed to save response:", e);
      setSaveStatus("idle");
    }
  };

  const handleSelectMCQ = (questionId: string, optionId: string) => {
    const updated = {
      ...responses,
      [questionId]: {
        assessmentId: assessment?.id || "",
        studentId,
        questionId,
        selectedOptionId: optionId,
        answeredAt: new Date().toISOString(),
      },
    };
    setResponses(updated);
    saveResponsesToStorage(updated, false);
  };

  const handleAnswerStructured = (questionId: string, answerText: string) => {
    const updated = {
      ...responses,
      [questionId]: {
        assessmentId: assessment?.id || "",
        studentId,
        questionId,
        answerText,
        answeredAt: new Date().toISOString(),
      },
    };
    setResponses(updated);
    saveResponsesToStorage(updated, false);
  };

  const handleSubmit = () => {
    if (!assessment) return;
    setIsSubmitted(true);
    saveResponsesToStorage(responses, true);

    // Persist a full AssessmentResult linked to student/class/subject/term
    try {
      // Load academic year + term from system settings
      let academicYear = new Date().getFullYear().toString();
      let term = "Term 1";
      try {
        const settingsRaw = localStorage.getItem("munyaka_system_settings_v3");
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          academicYear = settings.academicYear || academicYear;
          term = settings.term || term;
        }
      } catch { /* use defaults */ }

      buildAndSaveResult(
        assessment,
        {
          responses,
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          isComplete: true,
        },
        studentInfo,
        {
          academicYear,
          term,
          examType: assessment.category,
          subjectId: assessment.subject,
          subjectName: assessment.subject,
          durationSeconds: (assessment.duration * 60) - timeLeft,
        }
      );
    } catch (e) {
      console.error("Failed to save assessment result:", e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!assessment || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Active Assessment</h2>
          <p className="text-slate-500 mb-6">
            Please create questions using the Question Creator first before opening the Student Test View.
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

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestion.id];
  const answeredCount = Object.keys(responses).filter(
    (qId) =>
      responses[qId]?.selectedOptionId ||
      (responses[qId]?.answerText && responses[qId]?.answerText?.trim() !== "")
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{assessment.title}</h1>
              <p className="text-sm text-slate-500">
                {assessment.subject} • Class {assessment.classLevel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                timeLeft < 300
                  ? "bg-red-50 border-red-200 text-red-700 animate-pulse"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-base">{formatTime(timeLeft)}</span>
            </div>

            {/* Connection Status */}
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 ${
                isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? "Online" : "Offline Storage"}</span>
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isSubmitted ? (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden text-center p-8 sm:p-12">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Assessment Submitted Successfully!</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Your responses have been saved securely to local storage. Your teacher will review your structured answers and grade your submission.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="h-12 px-6 rounded-xl font-semibold"
              >
                Review Answers
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar & Status */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">
                  {answeredCount} of {assessment.questions.length} answered
                </span>
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="text-xs text-indigo-500 font-medium animate-pulse flex items-center gap-1">
                    <Save className="w-3 h-3" /> Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved locally
                  </span>
                )}
              </div>
            </div>

            {/* Question Card */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 pb-8 pt-6 px-6">
                <div className="flex items-center justify-between text-white/90 mb-2">
                  <Badge className="bg-white/20 text-white border-0 font-medium">
                    {currentQuestion.type === "mcq" ? "Multiple Choice" : "Structured / Essay"}
                  </Badge>
                  <span className="text-sm font-semibold">{currentQuestion.points} Points</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl text-white leading-relaxed">
                  {currentQuestion.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Question image */}
                {currentQuestion.imageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question diagram"
                      className="max-h-72 rounded-2xl border border-slate-200 object-contain shadow-sm"
                    />
                  </div>
                )}

                {/* MCQ Options */}
                {currentQuestion.type === "mcq" && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = currentResponse?.selectedOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectMCQ(currentQuestion.id, option.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-100"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {option.label}
                          </div>
                          <span
                            className={`font-medium text-base ${
                              isSelected ? "text-indigo-900" : "text-slate-700"
                            }`}
                          >
                            {option.text || <span className="italic text-slate-400">Empty option</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Structured Question Response Area */}
                {currentQuestion.type === "structured" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Your Response</label>
                      <span className="text-xs text-slate-400">
                        Type your detailed answer below
                      </span>
                    </div>
                    <Textarea
                      placeholder="Type your multi-paragraph response or step-by-step solution here..."
                      value={currentResponse?.answerText || ""}
                      onChange={(e) => handleAnswerStructured(currentQuestion.id, e.target.value)}
                      className="min-h-[220px] rounded-2xl border-slate-200 p-4 text-base focus:border-indigo-500 focus:ring-indigo-200"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="h-12 px-6 rounded-xl font-semibold border-slate-200"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {assessment.questions.map((q, idx) => {
                  const isAns =
                    responses[q.id]?.selectedOptionId ||
                    (responses[q.id]?.answerText && responses[q.id]?.answerText?.trim() !== "");
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentQuestionIndex === idx
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : isAns
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentQuestionIndex < assessment.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(assessment.questions.length - 1, prev + 1))}
                  className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="h-12 px-8 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assessment
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
