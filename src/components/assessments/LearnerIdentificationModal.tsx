"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  X,
  User,
  ChevronDown,
  CheckCircle2,
  Loader2,
  BookOpen,
  Users,
  FileQuestion,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const STUDENTS_STORAGE_KEYS = ["students_data", "school_learners_data"];

interface RegisteredStudent {
  id: string;
  admissionNumber?: string;
  admNo?: string;
  assessmentNo?: string;
  birthCertNo?: string;
  name: string;
  grade?: string;
  stream?: string;
  status?: string;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  grade?: string;
  stream?: string;
  duration?: number;
  questions?: unknown[];
}

interface LearnerIdentificationModalProps {
  assessmentTitle: string;
  assessmentSubject: string;
  assessmentQuestionCount: number;
  assessmentDuration: number;
  onBeginExam: (studentId: string, studentName: string) => void;
  onClose?: () => void;
}

export const LearnerIdentificationModal: React.FC<LearnerIdentificationModalProps> = ({
  assessmentTitle,
  assessmentSubject,
  assessmentQuestionCount,
  assessmentDuration,
  onBeginExam,
  onClose,
}) => {
  // ── State Controls ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // UI State
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regAssessmentNo, setRegAssessmentNo] = useState("");

  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // ── Load configured data from localStorage ─────────────────────────────────
  // Read grades from any of the common system storage keys, with a safe
  // standard-grade fallback so the dropdowns are never empty.
  const gradesList = useMemo<string[]>(() => {
    const raw =
      localStorage.getItem("configured_streams") ||
      localStorage.getItem("school_classes") ||
      localStorage.getItem("grades_and_streams") ||
      "[]";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const names = parsed
          .map((g: unknown) => {
            if (typeof g === "string") return g;
            if (g && typeof g === "object") {
              const obj = g as { grade?: string; name?: string };
              return obj.grade || obj.name;
            }
            return null;
          })
          .filter((n): n is string => typeof n === "string" && n.length > 0);
        if (names.length > 0) return Array.from(new Set(names)).sort();
      }
    } catch {
      // fall through to defaults
    }
    return [
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
  }, []);

  // All streams (across grades) so the Stream dropdown is never permanently
  // empty if the configured_streams data is sparse.
  const allStreams = useMemo<string[]>(() => {
    const raw =
      localStorage.getItem("configured_streams") ||
      localStorage.getItem("grades_and_streams") ||
      "[]";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const streams = parsed
          .map((item: unknown) => {
            if (item && typeof item === "object") {
              const obj = item as { stream?: string };
              return obj.stream;
            }
            return null;
          })
          .filter((s): s is string => typeof s === "string" && s.length > 0);
        if (streams.length > 0) return Array.from(new Set(streams)).sort();
      }
    } catch {
      // fall through to defaults
    }
    return ["A", "B", "C", "D"];
  }, []);

  // Streams for the currently selected grade (falls back to all streams
  // so the dropdown is always usable once a grade is picked).
  const availableStreams = useMemo<string[]>(() => {
    if (!selectedGrade) return [];
    try {
      const raw =
        localStorage.getItem("configured_streams") ||
        localStorage.getItem("grades_and_streams") ||
        "[]";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const streamsForGrade = parsed
          .filter(
            (item: unknown) =>
              item &&
              typeof item === "object" &&
              (item as { grade?: string }).grade === selectedGrade
          )
          .map((item: unknown) => (item as { stream?: string }).stream)
          .filter((s): s is string => typeof s === "string" && s.length > 0);
        if (streamsForGrade.length > 0) {
          return Array.from(new Set(streamsForGrade)).sort();
        }
      }
    } catch {
      // fall through
    }
    return allStreams;
  }, [selectedGrade, allStreams]);

  // All configured exams — populated as soon as a grade is picked, even if
  // none match exactly, so the Target Exam dropdown can show its options.
  const allExams = useMemo<Exam[]>(() => {
    try {
      const raw = localStorage.getItem("all_set_exams");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Exam[];
    } catch {
      return [];
    }
    return [];
  }, []);

  // Filtered exams — match the selected grade and (optionally) stream.
  // When no exam matches the chosen grade, we still want the dropdown to be
  // openable (it just shows the "No exams found for this grade" message).
  const filteredExams = useMemo<Exam[]>(() => {
    return allExams.filter((exam) => {
      const matchesGrade = !selectedGrade || exam.grade === selectedGrade;
      const matchesStream = !selectedStream || exam.stream === selectedStream;
      return matchesGrade && matchesStream;
    });
  }, [allExams, selectedGrade, selectedStream]);

  // ── Load students from localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      let loadedStudents: RegisteredStudent[] = [];
      for (const key of STUDENTS_STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed: RegisteredStudent[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedStudents = parsed;
            break;
          }
        }
      }
      // Filter out transferred students
      const active = loadedStudents.filter(
        (s) => !s.status || s.status === "Active" || s.status === "active"
      );
      setStudents(active);
    } catch (err) {
      console.error("[LearnerIdentificationModal] Failed to load students:", err);
    }
    setIsLoading(false);
  }, []);

  // ── Close student dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(e.target as Node)
      ) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filter students based on selectedGrade, selectedStream, and searchTerm ──
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesGrade = !selectedGrade || s.grade === selectedGrade;
      const matchesStream = !selectedStream || s.stream === selectedStream;
      const matchesQuery =
        !searchTerm ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.assessmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.birthCertNo?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGrade && matchesStream && matchesQuery;
    });
  }, [students, selectedGrade, selectedStream, searchTerm]);

  // ── Reset downstream selections when parent changes ──────────────────────────
  useEffect(() => {
    setSelectedStream("");
    setSelectedExamId("");
  }, [selectedGrade]);

  useEffect(() => {
    setSelectedExamId("");
  }, [selectedStream]);

  // ── Selection handlers ──────────────────────────────────────────────────────
  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);
    // Cascade: picking a grade resets downstream state and re-populates streams/exams
    setSelectedStudentId("");
    setSearchTerm("");
  };

  const handleSelectStream = (stream: string) => {
    setSelectedStream(stream);
    setSelectedStudentId("");
    setSearchTerm("");
  };

  const handleSelectStudent = (student: RegisteredStudent) => {
    setSelectedStudentId(student.id);
    setSearchTerm(student.name);
    setShowStudentDropdown(false);
    setShowRegistration(false);
  };

  // ── Get selected objects for display ────────────────────────────────────────
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedExam = allExams.find((e) => e.id === selectedExamId);

  // ── Begin exam handler ──────────────────────────────────────────────────────
  const handleBeginExam = () => {
    if (showRegistration) {
      // Quick inline registration
      if (!regName.trim() || !regAssessmentNo.trim()) {
        showError("Please fill in the student's name and Assessment / Birth Certificate number.");
        return;
      }
      const newStudent: RegisteredStudent = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assessmentNo: regAssessmentNo.trim(),
        birthCertNo: regAssessmentNo.trim(),
        admissionNumber: regAssessmentNo.trim(),
        admNo: regAssessmentNo.trim(),
        name: regName.trim(),
        grade: selectedGrade || undefined,
        stream: selectedStream || undefined,
        status: "Active",
      };

      // Save to localStorage
      try {
        for (const key of STUDENTS_STORAGE_KEYS) {
          const raw = localStorage.getItem(key);
          const existing: RegisteredStudent[] = raw ? JSON.parse(raw) : [];
          const duplicate = existing.some(
            (s) =>
              s.id === newStudent.id ||
              s.assessmentNo === newStudent.assessmentNo ||
              s.birthCertNo === newStudent.birthCertNo
          );
          if (!duplicate) {
            existing.push(newStudent);
            localStorage.setItem(key, JSON.stringify(existing));
            break;
          }
        }
        showSuccess("Student registered successfully!");
        onBeginExam(newStudent.id, newStudent.name);
      } catch (err) {
        console.error("[LearnerIdentificationModal] Failed to save student:", err);
        showError("Failed to register student. Please try again.");
      }
    } else if (selectedStudentId) {
      onBeginExam(selectedStudentId, selectedStudent?.name || "");
    }
  };

  const canBeginExam =
    (selectedStudentId && (selectedExamId || filteredExams.length === 0)) ||
    (showRegistration &&
      regName.trim() &&
      regAssessmentNo.trim() &&
      (selectedExamId || filteredExams.length === 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white relative">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                title="Close and return to exam list"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Learner Identification</h1>
            <p className="text-white/80 text-sm">
              Identify yourself before starting the assessment
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Assessment Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Assessment
                </p>
              </div>
              <p className="font-bold text-slate-800">{assessmentTitle}</p>
              <p className="text-sm text-slate-500 mt-1">
                {assessmentSubject} • {assessmentQuestionCount} questions • {assessmentDuration} minutes
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                {/* Step 1: Grade & Stream Selectors (2-column layout) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">1</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Select Class</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Grade Selector — always enabled, uses native select */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Grade
                      </label>
                      <div className="relative">
                        <select
                          value={selectedGrade}
                          onChange={(e) => handleSelectGrade(e.target.value)}
                          className={cn(
                            "w-full h-10 px-3 rounded-lg border appearance-none text-sm transition-colors pr-8",
                            selectedGrade
                              ? "border-indigo-300 bg-indigo-50 text-slate-800"
                              : "border-slate-200 bg-white text-slate-400"
                          )}
                        >
                          <option value="">Select Grade…</option>
                          {gradesList.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Stream Selector — enabled as soon as a grade is picked; "No stream" option allows all-stream filter */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Stream
                      </label>
                      <div className="relative">
                        <select
                          value={selectedStream}
                          onChange={(e) => handleSelectStream(e.target.value)}
                          disabled={!selectedGrade}
                          className={cn(
                            "w-full h-10 px-3 rounded-lg border appearance-none text-sm transition-colors pr-8",
                            !selectedGrade && "opacity-50 cursor-not-allowed bg-slate-50",
                            selectedStream
                              ? "border-indigo-300 bg-indigo-50 text-slate-800"
                              : "border-slate-200 bg-white text-slate-400"
                          )}
                        >
                          <option value="">All Streams</option>
                          {availableStreams.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {selectedGrade && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Badge
                        variant="outline"
                        className="bg-indigo-50 border-indigo-200 text-indigo-600"
                      >
                        {selectedGrade}
                        {selectedStream && ` • ${selectedStream}`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Step 2: Target Exam Selector */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">2</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Target Exam</p>
                  </div>
                  <div className="relative">
                    <div className="relative">
                      <select
                        value={selectedExamId}
                        onChange={(e) => {
                          setSelectedExamId(e.target.value);
                        }}
                        disabled={!selectedGrade}
                        className={cn(
                          "w-full h-12 px-4 pl-12 rounded-xl border appearance-none text-sm transition-colors pr-10",
                          !selectedGrade && "opacity-50 cursor-not-allowed bg-slate-50",
                          selectedExamId
                            ? "border-indigo-300 bg-indigo-50 text-slate-800"
                            : "border-slate-200 bg-white text-slate-400"
                        )}
                      >
                        <option value="">
                          {selectedGrade ? "Select Exam…" : "Select grade first"}
                        </option>
                        {filteredExams.length > 0 ? (
                          filteredExams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title} — {exam.subject}
                              {exam.duration ? ` (${exam.duration} min)` : ""}
                            </option>
                          ))
                        ) : selectedGrade ? (
                          <option value="" disabled>
                            No exams found for this grade
                          </option>
                        ) : null}
                      </select>
                      <FileQuestion
                        className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4",
                          selectedExamId ? "text-indigo-500" : "text-slate-400"
                        )}
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {selectedGrade && filteredExams.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        No exams are set for{" "}
                        {selectedGrade}
                        {selectedStream ? ` ${selectedStream}` : ""} yet.
                        You can still register and attempt this assessment.
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3 & 4: Student Search & Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">3</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Select Learner</p>
                  </div>

                  {/* Student Search */}
                  <div className="relative" ref={studentDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search by name, Assessment No., or Admission No..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSelectedStudentId("");
                          setShowRegistration(true);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          setShowRegistration(!showRegistration);
                          if (!showRegistration) {
                            setSelectedStudentId("");
                            setSearchTerm("");
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                        title={showRegistration ? "Cancel" : "Register new student"}
                      >
                        {showRegistration ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Student Dropdown Results */}
                    {showStudentDropdown && filteredStudents.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                        {filteredStudents.slice(0, 10).map((student) => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 hover:bg-indigo-50 text-left transition-colors border-b border-slate-100 last:border-0",
                              selectedStudentId === student.id && "bg-indigo-50"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate">
                                {student.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>
                                  {student.assessmentNo ||
                                    student.birthCertNo ||
                                    student.admissionNumber ||
                                    student.admNo ||
                                    "No ID"}
                                </span>
                                {student.grade && (
                                  <>
                                    <span>•</span>
                                    <span>{student.grade}</span>
                                  </>
                                )}
                                {student.stream && (
                                  <>
                                    <span>•</span>
                                    <span>{student.stream}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {selectedStudentId === student.id && (
                              <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {searchTerm && filteredStudents.length === 0 && !showRegistration && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>No learner found in {selectedGrade || "any class"}.</span>
                      <button
                        onClick={() => setShowRegistration(true)}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Register new learner
                      </button>
                    </p>
                  )}
                </div>

                {/* Inline Registration Form */}
                {showRegistration && !selectedStudentId && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-bold">Quick Learner Registration</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">
                          Full Name *
                        </label>
                        <Input
                          placeholder="Enter learner's full name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">
                          Assessment No. / Birth Certificate No. *
                        </label>
                        <Input
                          placeholder="e.g., Assessment No. or Birth Cert No."
                          value={regAssessmentNo}
                          onChange={(e) => setRegAssessmentNo(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                      {(selectedGrade || selectedStream) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Registering for:</span>
                          <Badge
                            variant="outline"
                            className="bg-white border-amber-200 text-amber-700"
                          >
                            {selectedGrade}
                            {selectedStream && ` ${selectedStream}`}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Start Assessment Button */}
                <Button
                  onClick={handleBeginExam}
                  disabled={!canBeginExam}
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Start Assessment
                </Button>

                {/* Selection Summary */}
                {selectedStudent && selectedExam && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">
                        {selectedStudent.name}
                      </p>
                      <p className="text-xs text-emerald-600 truncate">
                        {selectedStudent.assessmentNo || selectedStudent.admissionNumber || "ID not set"} •{" "}
                        {selectedGrade}
                        {selectedStream && ` ${selectedStream}`}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearnerIdentificationModal;
