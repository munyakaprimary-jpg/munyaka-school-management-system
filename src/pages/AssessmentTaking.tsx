"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  BookOpen,
  FileText,
  Lock,
  CheckSquare,
  Square,
  Circle,
  Timer,
  Target,
} from "lucide-react";
import type { Assessment, StudentResponse, StudentSubmission } from "@/types/questions";

const STORAGE_KEY = "assessment_taking_progress";
const SUBMISSION_KEY = "assessment_submissions";

interface AssessmentTakingProps {
  assessment: Assessment;
  studentId: string;
  studentName?: string;
  onSubmit?: (submission: StudentSubmission) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatTimeFull(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export default function AssessmentTaking({
  assessment,
  studentId,
  studentName,
  onSubmit,
}: AssessmentTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [timeLeft, setTimeLeft] = useState(assessment.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);

  // Calculate answered questions
  const answeredQuestions = assessment.questions.filter((q) => {
    const response = responses[q.id];
    return response?.selectedOptionId || (response?.answerText?.trim() ?? "");
  });

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`${STORAGE_KEY}_${assessment.id}_${studentId}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed.responses) {
          setResponses(parsed.responses);
        }
        if (parsed.timeLeft && parsed.timeLeft > 0) {
          setTimeLeft(parsed.timeLeft);
        }
        if (parsed.elapsedTime) {
          setElapsedTime(parsed.elapsedTime);
        }
        if (parsed.isSubmitted) {
          setIsSubmitted(true);
        }
      } catch (e) {
        console.error("Failed to load saved progress:", e);
      }
    }
  }, [assessment.id, studentId]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  // Auto-save to localStorage
  const saveToStorage = useCallback(
    (complete = false) => {
      setSaveStatus("saving");
      try {
        const data = {
          assessmentId: assessment.id,
          studentId,
          responses,
          timeLeft,
          elapsedTime,
          isSubmitted: complete,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `${STORAGE_KEY}_${assessment.id}_${studentId}`,
          JSON.stringify(data)
        );

        // Also save to submissions if complete
        if (complete) {
          const submission: StudentSubmission = {
            assessmentId: assessment.id,
            studentId,
            responses: Object.values(responses),
            startedAt: new Date(Date.now() - elapsedTime * 1000).toISOString(),
            submittedAt: new Date().toISOString(),
            isComplete: true,
          };
          localStorage.setItem(
            `${SUBMISSION_KEY}_${assessment.id}_${studentId}`,
            JSON.stringify(submission)
          );
          onSubmit?.(submission);
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("Failed to save progress:", e);
        setSaveStatus("idle");
      }
    },
    [assessment.id, studentId, responses, timeLeft, elapsedTime, onSubmit]
  );

  // Auto-save every 30 seconds
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      saveToStorage(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [saveToStorage, isSubmitted]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (!isSubmitted) {
        saveToStorage(false);
      }
    };
  }, [saveToStorage, isSubmitted]);

  // MCQ selection handler
  const handleMCQSelect = (questionId: string, optionId: string) => {
    const updated: Record<string, StudentResponse> = {
      ...responses,
      [questionId]: {
        assessmentId: assessment.id,
        studentId,
        questionId,
        selectedOptionId: optionId,
        answeredAt: new Date().toISOString(),
      },
    };
    setResponses(updated);
    saveToStorage(false);
  };

  // Structured answer handler
  const handleStructuredAnswer = (questionId: string, text: string) => {
    const updated: Record<string, StudentResponse> = {
      ...responses,
      [questionId]: {
        assessmentId: assessment.id,
        studentId,
        questionId,
        answerText: text,
        answeredAt: new Date().toISOString(),
      },
    };
    setResponses(updated);
    saveToStorage(false);
  };

  // Submit handler
  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
    setShowSubmittedDialog(true);
    saveToStorage(true);
  };

  // Navigation handlers
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(Math.max(0, Math.min(assessment.questions.length - 1, index)));
  };

  // Calculate progress percentage
  const progressPercent = (answeredQuestions.length / assessment.questions.length) * 100;

  // Timer warning states
  const isTimeWarning = timeLeft <= 300 && timeLeft > 60; // 5 min warning
  const isTimeCritical = timeLeft <= 60; // 1 min critical

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-0 shadow-2xl rounded-3xl overflow-hidden text-center">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 pt-12">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Assessment Submitted!</h2>
            <p className="text-slate-500 mb-6">
              Your responses have been saved securely. Here's a summary:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-indigo-600">
                  {answeredQuestions.length}
                </div>
                <div className="text-sm text-slate-500">Questions Answered</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-teal-600">
                  {formatTimeFull(elapsedTime)}
                </div>
                <div className="text-sm text-slate-500">Time Taken</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
              <Lock className="w-4 h-4" />
              <span>This assessment is now locked</span>
            </div>

            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your teacher will review your structured responses and provide feedback once grading is complete.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submitted Dialog */}
        <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Submission Confirmed
              </DialogTitle>
              <DialogDescription>
                Your assessment has been submitted successfully. You can close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Assessment</span>
                  <span className="font-semibold text-slate-800">{assessment.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Questions Answered</span>
                  <span className="font-semibold text-slate-800">{answeredQuestions.length}/{assessment.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Points</span>
                  <span className="font-semibold text-slate-800">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Time Taken</span>
                  <span className="font-semibold text-slate-800">{formatTimeFull(elapsedTime)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowSubmittedDialog(false)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title & Subject */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-800 truncate">{assessment.title}</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{assessment.subject}</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {totalPoints} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Timer & Status */}
            <div className="flex items-center gap-3">
              {/* Save Status */}
              {saveStatus !== "idle" && (
                <div className={`hidden sm:flex items-center gap-1.5 text-sm ${
                  saveStatus === "saving" ? "text-indigo-500" : "text-emerald-600"
                }`}>
                  {saveStatus === "saving" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved</span>
                    </>
                  )}
                </div>
              )}

              {/* Connection Status */}
              <Badge
                variant="outline"
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isOnline 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </Badge>

              {/* Timer */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg transition-all ${
                  isTimeCritical
                    ? "bg-red-100 border-red-300 text-red-700 animate-pulse shadow-lg shadow-red-100"
                    : isTimeWarning
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-600 font-medium">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </span>
              <span className="text-slate-500">
                {answeredQuestions.length} answered
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Question Card */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm font-medium">
                  {currentQuestion.type === "mcq" ? (
                    <span className="flex items-center gap-1.5">
                      <Circle className="w-3.5 h-3.5" />
                      Multiple Choice
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Written Response
                    </span>
                  )}
                </Badge>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-sm font-medium">{currentQuestion.points} point{currentQuestion.points !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold leading-relaxed">
                {currentQuestion.prompt}
              </h2>
            </div>

            <CardContent className="p-6">
              {/* MCQ Options */}
              {currentQuestion.type === "mcq" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = responses[currentQuestion.id]?.selectedOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleMCQSelect(currentQuestion.id, option.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-100"
                            : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/80"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0 transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {option.label}
                        </div>
                        <span
                          className={`text-base font-medium flex-1 ${
                            isSelected ? "text-indigo-900" : "text-slate-700"
                          }`}
                        >
                          {option.text || <span className="italic text-slate-400">No option text</span>}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-slate-300"
                        }`}>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Structured Response Area */}
              {currentQuestion.type === "structured" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Your Response
                    </label>
                    <span className="text-xs text-slate-400">
                      {responses[currentQuestion.id]?.answerText?.length || 0} characters
                    </span>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your detailed answer here. You can write multiple paragraphs to fully address the question..."
                    value={responses[currentQuestion.id]?.answerText || ""}
                    onChange={(e) => handleStructuredAnswer(currentQuestion.id, e.target.value)}
                    className="min-h-[200px] rounded-xl border-slate-200 p-4 text-base focus:border-indigo-500 focus:ring-indigo-200 resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="h-11 px-5 rounded-lg font-semibold border-slate-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Question Navigator */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {assessment.questions.map((q, idx) => {
                const response = responses[q.id];
                const isAnswered = response?.selectedOptionId || (response?.answerText?.trim() ?? "");
                const isCurrent = idx === currentQuestionIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300"
                        : isAnswered
                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Next / Submit Button */}
            {currentQuestionIndex < assessment.questions.length - 1 ? (
              <Button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                className="h-11 px-5 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowSubmitConfirm(true)}
                className="h-11 px-6 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Assessment
              </Button>
            )}
          </div>

          {/* Question Type Legend */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border-2 border-transparent" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-300" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-600" />
              <span>Current</span>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to submit your assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Questions Answered</span>
                <span className="font-semibold text-slate-800">
                  {answeredQuestions.length} of {assessment.questions.length}
                </span>
              </div>
              
              {answeredQuestions.length < assessment.questions.length && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-amber-800">
                    You have {assessment.questions.length - answeredQuestions.length} unanswered question{assessment.questions.length - answeredQuestions.length !== 1 ? "s" : ""}.
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Time Remaining</span>
                <span className="font-semibold text-slate-800">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
              className="rounded-lg"
            >
              Continue Assessment
            </Button>
            <Button
              onClick={handleSubmit}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
