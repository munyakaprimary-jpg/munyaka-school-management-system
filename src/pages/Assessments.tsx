import React, { useState, useEffect, useMemo, useCallback } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Save, Loader2, Search, CheckCircle2 } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { DEFAULT_EXAM_TYPES } from "@/lib/assessment-constants";

// Educational Tier Subject Mappings & Parsing Logic
const TIER_SUBJECTS: Record<string, string[]> = {
  "pre-primary": [
    "Language Activities",
    "Mathematical Activities",
    "Environmental Activities",
    "Psychomotor & Creative Activities",
    "Religious Education"
  ],
  "lower-primary": [
    "Literacy",
    "Kiswahili/Indigenous Language",
    "English Language",
    "Mathematical Activities",
    "Environmental Activities",
    "Hygiene & Nutrition Activities",
    "Religious Education",
    "Movement & Creative Activities"
  ],
  "upper-primary": [
    "English",
    "Kiswahili",
    "Mathematics",
    "Science & Technology",
    "Agriculture & Nutrition",
    "Social Studies",
    "Religious Education (CRE/IRE/HRE)",
    "Creative Arts"
  ],
  "junior-secondary": [
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

const getTierKey = (gradeName: string): string => {
  const g = gradeName.toLowerCase();
  if (g.includes("pp1") || g.includes("pp2") || g.includes("pre-primary")) return "pre-primary";
  if (g.includes("grade 1") || g.includes("grade 2") || g.includes("grade 3")) return "lower-primary";
  if (g.includes("grade 4") || g.includes("grade 5") || g.includes("grade 6")) return "upper-primary";
  if (g.includes("grade 7") || g.includes("grade 8") || g.includes("grade 9") || g.includes("junior")) return "junior-secondary";
  return "lower-primary";
};

const getLevelNameForGrade = (gradeName: string): string => {
  const g = gradeName.toLowerCase();
  if (g.includes("pp1") || g.includes("pp2") || g.includes("pre-primary")) return "Pre-Primary";
  if (g.includes("grade 1") || g.includes("grade 2") || g.includes("grade 3")) return "Lower Primary";
  if (g.includes("grade 4") || g.includes("grade 5") || g.includes("grade 6")) return "Upper Primary";
  if (g.includes("grade 7") || g.includes("grade 8") || g.includes("grade 9") || g.includes("junior")) return "Junior Secondary";
  return "Lower Primary";
};

const Assessments = () => {
  // Control States bound to localStorage / defaults
  const [academicYear, setAcademicYear] = useState<string>(() => new Date().getFullYear().toString());
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>(() => {
    const currentY = new Date().getFullYear();
    return [String(currentY - 1), String(currentY), String(currentY + 1), String(currentY + 2)];
  });
  
  const [grade, setGrade] = useState<string>(() => "Grade 4");
  const [stream, setStream] = useState<string>("All Streams");
  const [examType, setExamType] = useState<string>("Formative Assessment");
  const [term, setTerm] = useState<string>("Term 1");
  const [subject, setSubject] = useState<string>("All Subjects");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  // Null-safe grade getter
  const currentGrade = grade || "Grade 1";
  const tierKey = useMemo(() => getTierKey(currentGrade), [currentGrade]);
  const defaultTierSubjects = useMemo(() => TIER_SUBJECTS[tierKey] || TIER_SUBJECTS["lower-primary"], [tierKey]);

  // 1. Retrieve Students Directory from localStorage with munyaka_students and fallback
  const studentsList = useMemo(() => {
    try {
      const stored = localStorage.getItem("munyaka_students") || localStorage.getItem("students_directory") || localStorage.getItem("learners") || localStorage.getItem("munyaka_students_master");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading munyaka_students:", e);
    }
    return STUDENTS;
  }, []);

  // 2. Grades & Streams from munyaka_grades with fallback protection
  const gradesListFromStorage = useMemo(() => {
    try {
      const stored = localStorage.getItem("munyaka_grades");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading munyaka_grades:", e);
    }
    return [];
  }, []);

  const availableGrades = useMemo(() => {
    const cbcOrder = [
      "pp1", "pp2", "playgroup", "pp1/pp2",
      "grade 1", "grade 2", "grade 3",
      "grade 4", "grade 5", "grade 6",
      "grade 7", "grade 8", "grade 9"
    ];

    let rawGrades: any[] = [];
    if (gradesListFromStorage.length > 0) {
      rawGrades = gradesListFromStorage.map((g: any) => g.name || g.grade || String(g));
    } else {
      const gradesSet = new Set<string>();
      studentsList.forEach(s => {
        const gName = s.grade || s.gradeLevel || s.class;
        if (gName) gradesSet.add(gName);
      });
      rawGrades = Array.from(gradesSet);
      if (rawGrades.length === 0) {
        rawGrades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];
      }
    }

    // Sort according to cbcOrder with normalization
    const sorted = [...rawGrades].sort((a, b) => {
      const nameA = (a.name || a).toString().trim().toLowerCase();
      const nameB = (b.name || b).toString().trim().toLowerCase();
      
      const indexA = cbcOrder.indexOf(nameA);
      const indexB = cbcOrder.indexOf(nameB);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Extract numeric value if any for ascending order fallback
      const numA = parseInt(nameA.replace(/[^0-9]/g, ""), 10) || 999;
      const numB = parseInt(nameB.replace(/[^0-9]/g, ""), 10) || 999;
      if (numA !== numB) return numA - numB;

      return nameA.localeCompare(nameB);
    });

    // Display Standardization: Format nicely (e.g. capitalize "grade 5" -> "Grade 5")
    return sorted.map((g: any) => {
      const str = (g.name || g).toString().trim();
      // If it starts with grade in lowercase, capitalize Grade
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
  }, [gradesListFromStorage, studentsList]);

  // Set initial grade if availableGrades has items
  useEffect(() => {
    if (availableGrades.length > 0 && (!grade || !availableGrades.includes(grade))) {
      setGrade(availableGrades[0]);
    }
  }, [availableGrades, grade]);

  // Extract streams per grade from munyaka_grades or studentsList with fallback
  const streamsByGrade = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (gradesListFromStorage.length > 0) {
      gradesListFromStorage.forEach((g: any) => {
        const gName = g.name || g.grade;
        if (gName) {
          if (Array.isArray(g.streams)) {
            map[gName] = g.streams.map((st: any) => typeof st === 'string' ? st : (st.name || st.stream));
          } else if (Array.isArray(g.classes)) {
            map[gName] = g.classes.map((c: any) => typeof c === 'string' ? c : (c.name || c.class));
          }
        }
      });
    }
    studentsList.forEach(s => {
      if (s.grade && s.stream) {
        if (!map[s.grade]) map[s.grade] = [];
        if (!map[s.grade].includes(s.stream)) map[s.grade].push(s.stream);
      }
    });
    return map;
  }, [gradesListFromStorage, studentsList]);

  // Available streams for selected grade with fallback
  const currentGradeStreams = useMemo(() => {
    const streams = streamsByGrade[currentGrade] || ["Green", "Yellow", "Blue", "Red", "Neptune", "Jupiter", "Mercury", "Venus"];
    return streams;
  }, [streamsByGrade, currentGrade]);

  // 3. Exam Types from munyaka_exam_types with fallback
  const examTypesList = useMemo(() => {
    try {
      const stored = localStorage.getItem("munyaka_exam_types");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((et: any) => ({
            id: et.id || et.code || et.name,
            code: et.code || et.id || et.name,
            name: et.name || et.code || et.id
          }));
        }
      }
    } catch (e) {
      console.error("Error loading munyaka_exam_types:", e);
    }
    return DEFAULT_EXAM_TYPES;
  }, []);

  // Set initial exam type if available
  useEffect(() => {
    if (examTypesList.length > 0 && (!examType || !examTypesList.some((et: any) => (et.name || et.code) === examType))) {
      setExamType(examTypesList[0]?.name || examTypesList[0]?.code || "Formative Assessment");
    }
  }, [examTypesList, examType]);

  // 4. Learning Areas / Subjects from munyaka_learning_areas with robust nested parsing logic
  const learningAreasFromStorage = useMemo(() => {
    try {
      const stored = localStorage.getItem("munyaka_learning_areas");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading munyaka_learning_areas:", e);
    }
    return [];
  }, []);

  const allTierSubjects = useMemo(() => {
    let subjects = defaultTierSubjects;
    if (!currentGrade) subjects = defaultTierSubjects;
    else if (learningAreasFromStorage.length > 0) {
      const targetLevelName = getLevelNameForGrade(currentGrade).toLowerCase();
      
      for (const item of learningAreasFromStorage) {
        if (item && typeof item === 'object') {
          const catName = (item.category || item.name || item.title || "").toString().toLowerCase();
          if (catName.includes(targetLevelName) || catName === targetLevelName || (targetLevelName.includes("junior") && catName.includes("junior"))) {
            const nestedList = item.subjects || item.learningAreas || item.items || item.subcategories;
            if (Array.isArray(nestedList) && nestedList.length > 0) {
              const extracted = nestedList
                .map((sub: any) => typeof sub === 'string' ? sub : (sub.name || sub.title || sub.subjectName))
                .filter(Boolean);
              if (extracted.length > 0) subjects = extracted;
            }
          }
        }
      }

      const flatExtracted = learningAreasFromStorage
        .map((la: any) => typeof la === 'string' ? la : (la.name || la.title || la.subjectName))
        .filter(Boolean);
      if (flatExtracted.length > 0 && !learningAreasFromStorage.some((item: any) => item?.subjects || item?.learningAreas || item?.items || item?.category)) {
        subjects = flatExtracted;
      }
    }
    return subjects.filter((subj: string) => !subj.toLowerCase().includes('ppi') && !subj.toLowerCase().includes('pastoral'));
  }, [learningAreasFromStorage, currentGrade, defaultTierSubjects]);

  // Active subjects list based on Subject filter ("All Subjects" vs specific subject)
  const activeSubjects = useMemo(() => {
    const base = subject === "All Subjects" ? allTierSubjects : [subject];
    return base.filter((subj: string) => !subj.toLowerCase().includes('ppi') && !subj.toLowerCase().includes('pastoral'));
  }, [subject, allTierSubjects]);

  // ============================================
  // STRICT 5-PART COMPOSITE KEY GENERATION
  // ============================================
  const targetKey = useMemo(() => {
    return `${academicYear}_${term}_${grade}_${subject}_${examType}`;
  }, [academicYear, term, grade, subject, examType]);

  // ============================================
  // FILTERED STUDENTS - DECLARED BEFORE USE EFFECT
  // ============================================
  const filteredStudents = useMemo(() => {
    const selectedGradeNormalized = currentGrade.trim().toLowerCase();

    return studentsList.filter(s => {
      // 3. Debugging / Fallback Data Retrieval checking student.grade, student.gradeLevel, and student.class
      const rawStudentGrade = s.grade || s.gradeLevel || s.class || "";
      const studentGradeNormalized = String(rawStudentGrade).trim().toLowerCase();

      // 1. String Normalization & Sanitization for Grade (handling "9", "Grade 9", "GRADE 9", "grade 9")
      const matchesGrade = !studentGradeNormalized ||
        studentGradeNormalized === selectedGradeNormalized ||
        studentGradeNormalized.replace(/[^0-9]/g, "") === selectedGradeNormalized.replace(/[^0-9]/g, "") && selectedGradeNormalized.replace(/[^0-9]/g, "") !== "";

      // 2. Stream Filtering Flexibility (if Stream selection is set to "All Streams" or empty, ignore stream matching)
      const rawStudentStream = s.stream || s.classStream || s.section || "";
      const studentStreamNormalized = String(rawStudentStream).trim().toLowerCase();
      const selectedStreamNormalized = stream.trim().toLowerCase();

      const isAllStreams = !stream || selectedStreamNormalized === "all streams" || selectedStreamNormalized === "";
      const matchesStream = isAllStreams || !studentStreamNormalized || studentStreamNormalized === selectedStreamNormalized;

      const matchesSearch = !searchTerm.trim() ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.assessment && s.assessment.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [studentsList, grade, stream, searchTerm]);

  // ============================================
  // RE-TRIGGER LOAD ON TERM SWITCH
  // Include selectedTerm (term) in dependency array
  // ============================================
  useEffect(() => {
    // 1. Immediately clear marks when term or any key filter changes
    setMarksMatrix({});

    try {
      let loadedData: Record<string, Record<string, string>> = {};

      // 2. Strict composite key matching - NO FALLBACKS to other terms
      const storedScores = localStorage.getItem("munyaka_assessment_scores");
      if (storedScores) {
        const parsedMaster = JSON.parse(storedScores);
        if (parsedMaster && typeof parsedMaster === "object" && parsedMaster[targetKey]) {
          loadedData = parsedMaster[targetKey];
        }
      }

      // Also check direct key storage
      const directStored = localStorage.getItem(targetKey);
      if (directStored) {
        const parsedDirect = JSON.parse(directStored);
        if (parsedDirect && typeof parsedDirect === "object") {
          loadedData = { ...loadedData, ...parsedDirect };
        }
      }

      // 3. Ensure ALL filtered students have entries (blank if no saved marks)
      const completeData: Record<string, Record<string, string>> = {};
      filteredStudents.forEach(student => {
        const studentId = student.id || student.admissionNumber;
        // Start with blank entries for all subjects
        const blankEntries: Record<string, string> = {};
        allTierSubjects.forEach(subj => {
          blankEntries[subj] = "";
        });
        // Merge with any saved marks
        completeData[studentId] = { ...blankEntries, ...(loadedData[studentId] || {}) };
      });

      setMarksMatrix(completeData);
    } catch (e) {
      console.error("Error loading marks for targetKey:", e);
      setMarksMatrix({});
    }
  }, [targetKey, filteredStudents, allTierSubjects]);

  // ============================================
  // IMMEDIATE LOCALSTORAGE AUTOSAVE & HISTORY PRESERVATION
  // Uses strict 5-part targetKey for isolation
  // ============================================
  const handleMarkChange = useCallback((studentId: string, subj: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean !== "" && parseInt(clean, 10) > 100) clean = "100";

    setMarksMatrix(prev => {
      const updated = {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [subj]: clean
        }
      };

      // 3. History Preservation & Merging: Save into specific targetKey
      try {
        localStorage.setItem(targetKey, JSON.stringify(updated));

        const existingMasterStr = localStorage.getItem("munyaka_assessment_scores");
        let masterObj: Record<string, any> = {};
        if (existingMasterStr) {
          try {
            masterObj = JSON.parse(existingMasterStr);
          } catch (err) {
            masterObj = {};
          }
        }
        masterObj[targetKey] = updated;
        localStorage.setItem("munyaka_assessment_scores", JSON.stringify(masterObj));
      } catch (e) {
        console.error("Autosave/History preservation error:", e);
      }

      return updated;
    });

    setShowSavedBadge(true);
    setTimeout(() => setShowSavedBadge(false), 2000);
  }, [targetKey]);

  // Calculations for Totals, Subject Totals, Subject MSS, Class Average
  const studentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredStudents.forEach(student => {
      const studentMarks = marksMatrix[student.id || student.admissionNumber] || {};
      let sum = 0;
      let hasMarks = false;
      allTierSubjects.forEach(subj => {
        const val = studentMarks[subj];
        if (val !== undefined && val !== "") {
          const num = parseInt(String(val), 10);
          if (!isNaN(num)) {
            sum += num;
            hasMarks = true;
          }
        }
      });
      totals[student.id || student.admissionNumber] = hasMarks ? sum : 0;
    });
    return totals;
  }, [filteredStudents, marksMatrix, allTierSubjects]);

  const subjectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    allTierSubjects.forEach(subj => {
      let sum = 0;
      filteredStudents.forEach(student => {
        const studentMarks = marksMatrix[student.id || student.admissionNumber] || {};
        const val = studentMarks[subj];
        if (val !== undefined && val !== "") {
          const num = parseInt(String(val), 10);
          if (!isNaN(num)) sum += num;
        }
      });
      totals[subj] = sum;
    });
    return totals;
  }, [allTierSubjects, filteredStudents, marksMatrix]);

  const subjectMSS = useMemo(() => {
    const mss: Record<string, number> = {};
    allTierSubjects.forEach(subj => {
      let sum = 0;
      let count = 0;
      filteredStudents.forEach(student => {
        const studentMarks = marksMatrix[student.id || student.admissionNumber] || {};
        const val = studentMarks[subj];
        if (val !== undefined && val !== "") {
          const num = parseInt(String(val), 10);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      mss[subj] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    });
    return mss;
  }, [allTierSubjects, filteredStudents, marksMatrix]);

  const grandTotalSum = useMemo(() => {
    return Object.values(subjectTotals).reduce((a, b) => a + b, 0);
  }, [subjectTotals]);

  const grandTotalMSS = useMemo(() => {
    const vals = Object.values(subjectMSS).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  }, [subjectMSS]);

  // Class Average & Completion Progress Calculation
  const classStats = useMemo(() => {
    let totalScoreSum = 0;
    let entriesCount = 0;
    const maxPossibleEntries = filteredStudents.length * allTierSubjects.length;

    filteredStudents.forEach(student => {
      const studentMarks = marksMatrix[student.id || student.admissionNumber] || {};
      allTierSubjects.forEach(subj => {
        const val = studentMarks[subj];
        if (val !== undefined && val !== "") {
          const num = parseInt(String(val), 10);
          if (!isNaN(num)) {
            totalScoreSum += num;
            entriesCount++;
          }
        }
      });
    });

    const meanPercentage = entriesCount > 0 ? (totalScoreSum / (entriesCount * 100)) * 100 : 0;
    return {
      meanFormatted: `${meanPercentage.toFixed(1)}%`,
      completionText: `${entriesCount}/${maxPossibleEntries} entered`
    };
  }, [filteredStudents, marksMatrix, allTierSubjects]);

  // Save All Marks explicitly commits to localStorage under targetKey
  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      localStorage.setItem(targetKey, JSON.stringify(marksMatrix));

      const existingMasterStr = localStorage.getItem("munyaka_assessment_scores");
      let masterObj: Record<string, any> = {};
      if (existingMasterStr) {
        try {
          masterObj = JSON.parse(existingMasterStr);
        } catch (err) {
          masterObj = {};
        }
      }
      masterObj[targetKey] = marksMatrix;
      localStorage.setItem("munyaka_assessment_scores", JSON.stringify(masterObj));

      setIsSaving(false);
      showSuccess("All marks successfully committed to localStorage!");
    } catch (e) {
      setIsSaving(false);
      showError("Error saving marks: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Download CSV export
  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      showError("No students found to export.");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      const headers = ["Learner Name", "Admission/ID", "Stream", ...allTierSubjects, "Total"];
      const rows = filteredStudents.map(student => {
        const id = student.id || student.admissionNumber;
        const studentMarks = marksMatrix[id] || {};
        const scores = allTierSubjects.map(subj => studentMarks[subj] !== undefined ? studentMarks[subj] : "");
        const total = studentTotals[id] || 0;
        return [
          `"${(student.name || "").replace(/"/g, '""')}"`,
          `"${(student.admissionNumber || student.id || "").replace(/"/g, '""')}"`,
          `"${(student.stream || "").replace(/"/g, '""')}"`,
          ...scores,
          total
        ].join(",");
      });

      const csvContent = [
        `"Marks Entry & CBC Assessment - ${grade} (${stream})"`,
        `"Academic Year: ${academicYear} | Term: ${term} | Exam: ${examType}"`,
        "",
        headers.join(","),
        ...rows,
        ["SUBJECT TOTALS", "", "", ...allTierSubjects.map(subj => subjectTotals[subj] || 0), grandTotalSum].join(","),
        ["SUBJECT MSS", "", "", ...allTierSubjects.map(subj => subjectMSS[subj] || 0), grandTotalMSS].join(",")
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Marks_Entry_${grade.replace(/\s+/g, "_")}_${stream.replace(/\s+/g, "_")}_${academicYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      showSuccess("CSV report downloaded successfully.");
    }, 600);
  };

  // Download PDF simulation / print
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full">
      {/* 1. Header & Quick Actions Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Marks Entry & CBC Assessment</h1>
            {showSavedBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <CheckCircle2 size={12} /> Saved to LocalStorage
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enter class marks for one subject or switch to All Subjects to fill a full matrix. Valid scores autosave to localStorage; use Save All for bulk commit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700"
            onClick={handleDownloadCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />} Download CSV
          </Button>
          <Button
            variant="outline"
            className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700"
            onClick={handleDownloadPDF}
          >
            <FileText size={16} /> Download PDF
          </Button>
          <Button
            className="rounded-xl h-11 px-6 bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-lg shadow-emerald-100 gap-2"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Marks
          </Button>
        </div>
      </div>

      {/* 3. Dynamic Filter Bar & Controls (Grid Card Container) */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          
          {/* 1. Academic Year */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Academic Year</label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYearOptions.map(yr => (
                  <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Grade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Stream */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stream</label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Streams">All Streams</SelectItem>
                {currentGradeStreams.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Exam Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                {examTypesList.map((et: any) => (
                  <SelectItem key={et.id || et.code} value={et.name || et.code}>
                    {et.name || et.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Term */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 6. Subject */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Subjects">All Subjects</SelectItem>
                {allTierSubjects.map(subj => (
                  <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 7. Find Learner */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Find Learner</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name/ID..."
                className="pl-9 h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
              />
            </div>
          </div>

          {/* 8. Class Average Card */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Class Average</label>
            <div className="h-11 rounded-xl bg-indigo-50 px-3 flex items-center justify-between">
              <span className="font-black text-indigo-700 text-sm">{classStats.meanFormatted}</span>
              <span className="text-[10px] font-bold text-indigo-500">{classStats.completionText}</span>
            </div>
          </div>

        </div>
      </Card>

      {/* 4. Educational Tier-Based Mark Sheet Table Matrix */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-72 min-w-[240px]">
                  Learner Details ({filteredStudents.length})
                </th>
                {activeSubjects.map(subj => (
                  <th key={subj} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-600 text-center border-r min-w-[120px] max-w-[160px]">
                    {subj}
                  </th>
                ))}
                <th className="bg-indigo-50 px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center min-w-[100px] border-l">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                <>
                  {filteredStudents.map(student => {
                    const studentId = student.id || student.admissionNumber;
                    const studentMarks = marksMatrix[studentId] || {};
                    const totalMarks = studentTotals[studentId] || 0;
                    const hasMarks = totalMarks > 0;

                    return (
                      <tr key={studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 border-r min-w-[240px]">
                          <p className="font-bold text-slate-900 truncate">{student.name || "Unknown Student"}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            ID: {student.admissionNumber || student.assessment || studentId} • Stream: {student.stream || "Main"}
                          </p>
                        </td>

                        {activeSubjects.map(subj => (
                          <td key={subj} className="px-2 py-3 border-r text-center min-w-[120px] max-w-[160px]">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={studentMarks[subj] !== undefined ? studentMarks[subj] : ""}
                              onChange={e => handleMarkChange(studentId, subj, e.target.value)}
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
                    <td className="px-6 py-4 border-r font-black text-slate-900 min-w-[240px]">
                      SUBJECT TOTALS
                    </td>
                    {activeSubjects.map(subj => (
                      <td key={`tot-${subj}`} className="px-2 py-3 border-r text-center font-bold text-slate-800 min-w-[120px] max-w-[160px] bg-slate-50">
                        {subjectTotals[subj] || 0}
                      </td>
                    ))}
                    <td className="bg-indigo-100/60 px-4 py-3 text-center font-black text-indigo-700 min-w-[100px] border-l">
                      {grandTotalSum}
                    </td>
                  </tr>

                  {/* Summary Row 2: SUBJECT MSS */}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-6 py-4 border-r font-black text-slate-900 min-w-[240px]">
                      SUBJECT MSS
                    </td>
                    {activeSubjects.map(subj => (
                      <td key={`mss-${subj}`} className="px-2 py-3 border-r text-center font-bold text-slate-800 min-w-[120px] max-w-[160px] bg-slate-50">
                        {subjectMSS[subj] !== undefined ? subjectMSS[subj].toFixed(2) : "0.00"}
                      </td>
                    ))}
                    <td className="bg-indigo-100/60 px-4 py-3 text-center font-black text-indigo-700 min-w-[100px] border-l">
                      {grandTotalMSS.toFixed(2)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={activeSubjects.length + 2} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-800 font-bold text-base">No learners found for {grade} / {stream}.</p>
                      <p className="text-xs text-slate-400 font-medium max-w-sm">
                        Please check your student directory or select another grade and stream from the controls above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Assessments;