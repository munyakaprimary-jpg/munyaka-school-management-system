import React, { useState, useEffect, useMemo, useCallback } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Save, Loader2, Search, CheckCircle2 } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { DEFAULT_EXAM_TYPES } from "@/lib/assessment-constants";
import { downloadAssessmentCSV } from "@/utils/export";

// ============================================
// 1. LOCALSTORAGE SAFETY HELPERS
// ============================================
const safeParseStudents = () => {
  try {
    const stored = localStorage.getItem("munyaka_students");
    if (!stored) return STUDENTS;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : STUDENTS;
  } catch {
    return STUDENTS;
  }
};

const safeParseGrades = () => {
  try {
    const stored = localStorage.getItem("munyaka_grades");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeParseLearningAreas = () => {
  try {
    const stored = localStorage.getItem("munyaka_learning_areas");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeParseAssessmentScores = () => {
  try {
    const stored = localStorage.getItem("munyaka_assessment_scores");
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const safeParseSystemSettings = () => {
  try {
    const stored = localStorage.getItem("munyaka_system_settings_v3");
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

// ============================================
// 2. TIER KEY & GRADE NORMALIZATION
// ============================================
const getTierKey = (gradeName: string) => {
  const g = (gradeName || "").toString().trim().toLowerCase();
  if (g.includes("pp1") || g.includes("pp2") || g.includes("pre-primary")) return "pre_primary";
  if (g.includes("grade 1") || g.includes("grade 2") || g.includes("grade 3")) return "lower_primary";
  if (g.includes("grade 4") || g.includes("grade 5") || g.includes("grade 6")) return "upper_primary";
  if (g.includes("grade 7") || g.includes("grade 8") || g.includes("grade 9") || g.includes("junior")) return "junior_school";
  return "lower_primary";
};

const normalizeGrade = (g: string) => (g || "").trim().toLowerCase();

// ============================================
// 3. CBC GRADE SORTING & FORMATTING
// ============================================
const cbcOrder = ["pp1", "pp2", "playgroup", "pp1/pp2", "grade 1", "grade 2", "grade 3", "grade 4", "grade 5", "grade 6", "grade 7", "grade 8", "grade 9"];

const sortGradesCBC = (grades: string[]) => {
  const sorted = [...grades].sort((a, b) => {
    const aNorm = normalizeGrade(a);
    const bNorm = normalizeGrade(b);
    const idxA = cbcOrder.indexOf(aNorm);
    const idxB = cbcOrder.indexOf(bNorm);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return aNorm.localeCompare(bNorm);
  });
  return sorted.map(g => {
    const str = g.toString().trim();
    if (str.toLowerCase().startsWith("grade ")) {
      const numPart = str.substring(6);
      return `Grade ${numPart}`;
    }
    if (str.toLowerCase() === "pp1") return "PP1";
    if (str.toLowerCase() === "pp2") return "PP2";
    if (str.toLowerCase() === "playgroup") return "Playgroup";
    if (str.toLowerCase() === "pp1/pp2") return "PP1/PP2";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
};

// ============================================
// 4. SUBJECT EXTRACTION FROM TIER
// ============================================
const TIER_SUBJECTS: Record<string, string[]> = {
  pre_primary: [
    "Language Activities",
    "Mathematical Activities",
    "Environmental Activities",
    "Psychomotor & Creative Activities",
    "Religious Education"
  ],
  lower_primary: [
    "Literacy",
    "Kiswahili/Indigenous Language",
    "English Language",
    "Mathematical Activities",
    "Environmental Activities",
    "Hygiene & Nutrition Activities",
    "Religious Education",
    "Movement & Creative Activities"
  ],
  upper_primary: [
    "English",
    "Kiswahili",
    "Mathematics",
    "Science & Technology",
    "Agriculture & Nutrition",
    "Social Studies",
    "Religious Education (CRE/IRE/HRE)",
    "Creative Arts"
  ],
  junior_school: [
    "English",
    "Kiswahili",
    "Mathematics",
    "Integrated Science",
    "Health Education",
    "Agriculture & Nutrition",
    "Social Studies",
    "Religious Education",
    "Pre-Technical Studies",
    "Computer Science",
    "Creative Arts & Sports"
  ]
};

const extractSubjectsFromTier = (tier: string) => {
  return (TIER_SUBJECTS[tier] || TIER_SUBJECTS.lower_primary).filter(s => !s.toLowerCase().includes("ppi") && !s.toLowerCase().includes("pastoral"));
};

// ============================================
// 5. MAIN COMPONENT
// ============================================
const Assessments = () => {
  // --- State Initialization with Safe LocalStorage ---
  const [academicYear, setAcademicYear] = useState(() => new Date().getFullYear().toString());
  const [grade, setGrade] = useState(() => "Grade 4");
  const [stream, setStream] = useState("All Streams");
  const [examType, setExamType] = useState("Formative Assessment");
  const [term, setTerm] = useState("Term 1");
  const [subject, setSubject] = useState("All Subjects");
  const [searchTerm, setSearchTerm] = useState("");

  // Safe localStorage reads
  const studentsList = useMemo(() => safeParseStudents(), []);
  const gradesListFromStorage = useMemo(() => safeParseGrades(), []);
  const learningAreasFromStorage = useMemo(() => safeParseLearningAreas(), []);
  const assessmentScoresRaw = useMemo(() => safeParseAssessmentScores(), []);
  const systemSettings = useMemo(() => safeParseSystemSettings(), []);

  // --- Derived Grades & Streams ---
  const availableGrades = useMemo(() => {
    let raw: string[] = [];
    if (gradesListFromStorage.length > 0) {
      raw = gradesListFromStorage.map((g: any) => g.name || g.grade || String(g));
    } else {
      const gs = new Set<string>();
      studentsList.forEach(s => { if (s.grade) gs.add(s.grade); });
      raw = Array.from(gs);
    }
    if (raw.length === 0) raw = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];
    return sortGradesCBC(raw);
  }, [gradesListFromStorage]);

  // Available streams for selected grade
  const currentGradeStreams = useMemo(() => {
    const g = availableGrades.find(g => normalizeGrade(g) === normalizeGrade(grade));
    return g ? g.streams : ["Green", "Yellow", "Blue", "Red"];
  }, [availableGrades, grade]);

  // Exam types with fallback
  const examTypesList = useMemo(() => {
    try {
      const stored = localStorage.getItem("munyaka_exam_types");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map((et: any) => ({ id: et.id || et.code || et.name, code: et.code || et.id || et.name, name: et.name || et.code || et.id }));
      }
    } catch { }
    return DEFAULT_EXAM_TYPES;
  }, []);

  // Learning areas / subjects from tier
  const tier = useMemo(() => getTierKey(grade), [grade]);
  const allTierSubjects = useMemo(() => extractSubjectsFromTier(tier), [tier]);

  // Active subjects based on filter
  const activeSubjects = useMemo(() => subject === "All Subjects" ? allTierSubjects : [subject], [subject, allTierSubjects]);

  // --- Filtered Students with Grade/Stream Normalization ---
  const filteredStudents = useMemo(() => {
    const gNorm = normalizeGrade(grade);
    return studentsList.filter(s => {
      const rawSGrade = s.grade || s.gradeLevel || s.class || "";
      const sNorm = normalizeGrade(rawSGrade);
      const gradeMatch = !gNorm || sNorm === gNorm || sNorm.replace(/[^0-9]/g, "") === gNorm.replace(/[^0-9]/g, "");

      const rawSStream = s.stream || s.classStream || s.section || "";
      const sStreamNorm = normalizeGrade(rawSStream);
      const isAllStreams = !stream || stream.trim().toLowerCase() === "all streams" || stream.trim().toLowerCase() === "";
      const streamMatch = isAllStreams || !sStreamNorm || sStreamNorm === normalizeGrade(stream);

      const searchLower = (searchTerm || "").trim().toLowerCase();
      const nameMatch = s.name && s.name.toLowerCase().includes(searchLower);
      const idMatch = s.admissionNumber && s.admissionNumber.toLowerCase().includes(searchLower);
      const assessmentMatch = s.assessment && s.assessment.toLowerCase().includes(searchLower);
      const searchMatch = nameMatch || idMatch || assessmentMatch;

      return gradeMatch && streamMatch && searchMatch;
    });
  }, [grade, stream, searchTerm]);

  // --- Composite Key & Score Management ---
  const compositeKey = useMemo(() => `${academicYear}_${term}_${grade}_${examType}`, [academicYear, term, grade, examType]);

  // Reset scores matrix when term or examType changes (strict isolation)
  useEffect(() => {
    setMarksMatrix({});
  }, [academicYear, term, examType, grade]);

  // Load scores from localStorage composite key, ensure every filtered student has an entry
  useEffect(() => {
    const scores = assessmentScoresRaw[compositeKey] || {};
    const complete: Record<string, Record<string, string>> = {};
    filteredStudents.forEach(student => {
      const sid = student.id || student.admissionNumber || String(student);
      const entry: Record<string, string> = {};
      allTierSubjects.forEach(subj => {
        entry[subj] = scores[sid] && scores[sid][subj] !== undefined ? String(scores[sid][subj]) : "";
      });
      complete[sid] = entry;
    });
    setMarksMatrix(complete);
  }, [compositeKey, filteredStudents, allTierSubjects, assessmentScoresRaw]);

  // marksMatrix state
  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});

  // Ensure every filtered student has blank entries for all subjects under the active composite key
  useEffect(() => {
    const scores = assessmentScoresRaw[compositeKey] || {};
    const init: Record<string, Record<string, string>> = {};
    filteredStudents.forEach(student => {
      const sid = student.id || student.admissionNumber || String(student);
      const entry: Record<string, string> = {};
      allTierSubjects.forEach(subj => {
        entry[subj] = scores[subj] !== undefined ? String(scores[subj]) : "";
      });
      entry[sid] = entry[sid] || {};
      init[sid] = entry;
    });
    setMarksMatrix(prev => ({ ...prev, ...init }));
  }, [compositeKey, filteredStudents, allTierSubjects, assessmentScoresRaw]);

  // --- Calculations ---
  const studentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredStudents.forEach(student => {
      const sid = student.id || student.admissionNumber || String(student);
      const studentMarks = marksMatrix[sid] || {};
      let sum = 0; let hasMarks = false;
      allTierSubjects.forEach(subj => { const val = studentMarks[subj]; if (val !== undefined && val !== "") { const n = parseInt(String(val), 10); if (!isNaN(n)) { sum += n; hasMarks = true; } } });
      totals[sid] = hasMarks ? sum : 0;
    });
    return totals;
  }, [filteredStudents, marksMatrix, allTierSubjects]);

  const subjectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    allTierSubjects.forEach(subj => { let sum = 0; filteredStudents.forEach(s => { const sid = s.id || s.admissionNumber || String(s); const v = marksMatrix[sid]?.[subj]; if (v !== undefined && v !== "") { const n = parseInt(String(v), 10); if (!isNaN(n)) sum += n; } }); totals[subj] = sum; });
    return totals;
  }, [allTierSubjects, filteredStudents, marksMatrix]);

  const subjectMSS = useMemo(() => {
    const mss: Record<string, number> = {};
    allTierSubjects.forEach(subj => { let sum = 0; let count = 0; filteredStudents.forEach(s => { const sid = s.id || s.admissionNumber || String(s); const v = marksMatrix[sid]?.[subj]; if (v !== undefined && v !== "") { const n = parseInt(String(v), 10); if (!isNaN(n)) { sum += n; count++; } } }); mss[subj] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0; });
    return mss;
  }, [allTierSubjects, filteredStudents, marksMatrix]);

  const grandTotalSum = useMemo(() => Object.values(subjectTotals).reduce((a, b) => a + b, 0), [subjectTotals]);
  const grandTotalMSS = useMemo(() => { const vals = Object.values(subjectMSS).filter(v => v > 0); return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0; }, [subjectMSS]);

  // --- Handle Mark Change with Autosave & Blank Enforcement ---
  const handleMarkChange = useCallback((studentId: string, subj: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean !== "" && parseInt(clean, 10) > 100) clean = "100";
    setMarksMatrix(prev => {
      const updated = { ...prev, [studentId]: { ...(prev[studentId] || {}), [subj]: clean } };
      // Autosave to localStorage under composite key
      try {
        localStorage.setItem(compositeKey, JSON.stringify(updated));
        const existingMasterStr = localStorage.getItem("munyaka_assessment_scores");
        let masterObj: Record<string, any> = {};
        if (existingMasterStr) { try { masterObj = JSON.parse(existingMasterStr); } catch { masterObj = {}; } }
        masterObj[compositeKey] = updated;
        localStorage.setItem("munyaka_assessment_scores", JSON.stringify(masterObj));
      } catch { }
      return updated;
    });
  }, [compositeKey]);

  // --- CSV Export using utility ---
  const handleDownloadCSV = useCallback(() => {
    if (filteredStudents.length === 0) { showError("No students found to export."); return; }
    // Gather class stats for the export utility
    const classStats = useMemo(() => {
      let totalScoreSum = 0; let entriesCount = 0; const maxPossible = filteredStudents.length * allTierSubjects.length;
      filteredStudents.forEach(s => { const sid = s.id || s.admissionNumber || String(s); const sm = marksMatrix[sid] || {}; allTierSubjects.forEach(subj => { const v = sm[subj]; if (v !== undefined && v !== "") { const n = parseInt(String(v), 10); if (!isNaN(n)) { totalScoreSum += n; entriesCount++; } } }); });
      const meanPct = entriesCount > 0 ? (totalScoreSum / (entriesCount * 100)) * 100 : 0;
      return { meanFormatted: `${meanPct.toFixed(1)}%`, completionText: `${entriesCount}/${maxPossible} entered` };
    }, [filteredStudents, marksMatrix, allTierSubjects]);

    downloadAssessmentCSV({
      academicYear,
      term,
      grade,
      stream,
      examType,
      filteredStudents,
      allTierSubjects,
      studentTotals,
      classStats
    });
  }, [academicYear, term, grade, stream, examType, filteredStudents, allTierSubjects, studentTotals]);

  // --- Render JSX ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Marks Entry & CBC Assessment</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Enter class marks for one subject or switch to All Subjects to fill a full matrix. Valid scores autosave to localStorage; use Download CSV for official report.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700" onClick={handleDownloadCSV} disabled={false}>
            <FileDown size={16} className="text-emerald-600" /> Download CSV
          </Button>
          <Button variant="outline" className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700" onClick={() => window.print()}>
            <FileText size={16} /> Download PDF
          </Button>
          <Button className="rounded-xl h-11 px-6 bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-lg shadow-emerald-100 gap-2" onClick={() => {/* Save All logic */}} disabled={false}>
            <Save size={16} /> Save All Marks
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Academic Year</label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{["2024", "2025", "2026"].map(yr => <SelectItem key={yr} value={yr}>{yr}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>{availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stream</label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue placeholder="All Streams" /></SelectTrigger>
              <SelectContent><SelectItem value="All Streams">All Streams</SelectItem>{currentGradeStreams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue placeholder="Exam Type" /></SelectTrigger>
              <SelectContent>{examTypesList.map((et: any) => <SelectItem key={et.id || et.code} value={et.name || et.code}>{et.name || et.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>{allTierSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Find Learner</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name/ID..." className="pl-9 h-11 rounded-xl bg-slate-50 border-none font-bold text-sm" /></div>
          </div>
          <div className="space-y-1.5 flex flex-col justify-end"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Class Average</label><div className="h-11 rounded-xl bg-indigo-50 px-3 flex items-center justify-between"><span className="font-black text-indigo-700 text-sm">{grandTotalMSS.toFixed(1)}%</span><span className="text-[10px] font-bold text-indigo-500">{grandTotalSum} entered</span></div></div>
        </div>
      </Card>

      {/* Mark Sheet Table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-72 min-w-[240px]">Learner Details ({filteredStudents.length})</th>
                {allTierSubjects.map(subj => <th key={subj} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-600 text-center border-r min-w-[120px] max-w-[160px]">{subj}</th>)}
                <th className="bg-indigo-50 px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center min-w-[100px] border-l">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                <>
                  {filteredStudents.map(student => {
                    const sid = student.id || student.admissionNumber || String(student);
                    const studentMarks = marksMatrix[sid] || {};
                    const totalMarks = studentTotals[sid] || 0;
                    const hasMarks = totalMarks > 0;
                    return (
                      <tr key={sid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 border-r min-w-[240px]">
                          <p className="font-bold text-slate-900 truncate">{student.name || "Unknown Student"}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {student.admissionNumber || student.assessment || sid} • Stream: {student.stream || "Main"}</p>
                        </td>
                        {allTierSubjects.map(subj => (
                          <td key={subj} className="px-2 py-3 border-r text-center min-w-[120px] max-w-[160px]">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={studentMarks[subj] !== undefined ? studentMarks[subj] : ""}
                              onChange={e => handleMarkChange(sid, subj, e.target.value)}
                              placeholder="—"
                              className="w-20 h-10 mx-auto text-center font-black text-sm rounded-lg bg-slate-50 border-none focus:bg-white focus:ring-2 ring-indigo-100 transition-all"
                            />
                          </td>
                        ))}
                        <td className="bg-indigo-50/60 px-4 py-3 text-center font-black text-sm text-indigo-600 min-w-[100px] border-l">
                          {hasMarks ? totalMarks : "—"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Row 1: SUBJECT TOTALS */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-6 py-4 border-r font-black text-slate-900 min-w-[240px]">SUBJECT TOTALS</td>
                    {allTierSubjects.map(subj => <td key={`tot-${subj}`} className="px-2 py-3 border-r text-center font-bold text-slate-800 min-w-[120px] max-w-[160px] bg-slate-50">{subjectTotals[subj] || 0}</td>)}
                    <td className="bg-indigo-100/60 px-4 py-3 text-center font-black text-indigo-700 min-w-[100px] border-l">{grandTotalSum}</td>
                  </tr>

                  {/* Summary Row 2: SUBJECT MSS */}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-6 py-4 border-r font-black text-slate-900 min-w-[240px]">SUBJECT MSS</td>
                    {allTierSubjects.map(subj => <td key={`mss-${subj}`} className="px-2 py-3 border-r text-center font-bold text-slate-800 min-w-[120px] max-w-[160px] bg-slate-50">{subjectMSS[subj] !== undefined ? subjectMSS[subj].toFixed(2) : "0.00"}</td>)}
                    <td className="bg-indigo-100/60 px-4 py-3 text-center font-black text-indigo-700 min-w-[100px] border-l">{grandTotalMSS.toFixed(2)}</td>
                  </tr>
                </>
              ) : (
                <tr><td colSpan={allTierSubjects.length + 2} className="px-8 py-20 text-center"><div className="flex flex-col items-center gap-3"><div className="p-4 bg-slate-50 rounded-full text-slate-300"><Search size={32} /></div><p className="text-slate-800 font-bold text-base">No learners found for {grade} / {stream}.</p><p className="text-xs text-slate-400 font-medium max-w-sm">Please check your student directory or select another grade and stream from the controls above.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Assessments;