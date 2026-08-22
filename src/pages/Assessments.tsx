import React, { useState, useEffect, useMemo, useCallback } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Save, Loader2, Search, CheckCircle2 } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { DEFAULT_EXAM_TYPES } from "@/lib/assessment-constants";

// ============================================
// SAFE LOCALSTORAGE READER - ALL WRAPPED IN TRY/CATCH
// ============================================
const safeGetItem = (key: string, defaultValue: any = null): any => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Error reading localStorage key: ${key}`, e);
    return defaultValue;
  }
};

// ============================================
// SCHOOL SETTINGS READER - WITH OPTIONAL CHAINING
// ============================================
const readSchoolSettings = (): {
  schoolName: string;
  schoolAddress: string;
  schoolMotto: string;
} => {
  const settings = safeGetItem("munyaka_system_settings_v3", {});
  return {
    schoolName: settings?.schoolName || "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    schoolAddress: settings?.schoolAddress || "P.O. BOX 5 ELDORET",
    schoolMotto: settings?.schoolMotto || "MOTTO: KNOWLEDGE POWER"
  };
};

// ============================================
// STUDENT LOADER - WITH FALLBACK
// ============================================
const getStudents = (): any[] => {
  const stored = safeGetItem("munyaka_students");
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return STUDENTS;
};

// ============================================
// GRADES LOADER - WITH FALLBACK
// ============================================
const getGrades = (): any[] => {
  const stored = safeGetItem("munyaka_grades");
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return [];
};

// ============================================
// LEARNING AREAS LOADER - WITH FALLBACK
// ============================================
const getLearningAreas = (): any[] => {
  const stored = safeGetItem("munyaka_learning_areas");
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return [];
};

// ============================================
// ASSESSMENT SCORES LOADER - WITH FALLBACK
// ============================================
const getAssessmentScores = (): Record<string, Record<string, string>> => {
  const stored = safeGetItem("munyaka_assessment_scores");
  if (stored && typeof stored === "object") return stored;
  return {};
};

// ============================================
// Assessments Component
// ============================================
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

  // 1. Students List - Safe with fallback
  const studentsList = useMemo(() => getStudents(), []);

  // 2. Grades & Streams from munyaka_grades with fallback
  const gradesListFromStorage = useMemo(() => getGrades(), []);

  // 3. Learning Areas from munyaka_learning_areas with fallback
  const learningAreasFromStorage = useMemo(() => getLearningAreas(), []);

  // 4. Assessment Scores from munyaka_assessment_scores with fallback
  const assessmentScores = useMemo(() => getAssessmentScores(), []);

  // Null-safe grade getter
  const currentGrade = grade || "Grade 1";
  const tierKey = useMemo(() => getTierKey(currentGrade), [currentGrade]);
  const defaultTierSubjects = useMemo(() => TIER_SUBJECTS[tierKey] || TIER_SUBJECTS["lower-primary"], [tierKey]);

  // ============================================
  // FILTERED STUDENTS - DECLARED BEFORE USE EFFECT
  // ============================================
  // Safe: filteredStudents always falls back to [] before .map() or .filter()
  const filteredStudents = useMemo(() => {
    // Safe: studentsList is always an array from getStudents()
    const selectedGradeNormalized = (currentGrade || "Grade 1").trim().toLowerCase();

    return studentsList.filter(s => {
      // Safe: rawStudentGrade defaults to empty string
      const rawStudentGrade = s.grade || s.gradeLevel || s.class || "";
      const studentGradeNormalized = String(rawStudentGrade).trim().toLowerCase();

      // Safe: matchesGrade with null guard
      const matchesGrade = !studentGradeNormalized ||
        studentGradeNormalized === selectedGradeNormalized ||
        studentGradeNormalized.replace(/[^0-9]/g, "") === selectedGradeNormalized.replace(/[^0-9]/g, "") && selectedGradeNormalized.replace(/[^0-9]/g, "") !== "";

      // Safe: Stream filtering with all-streams default
      const rawStudentStream = s.stream || s.classStream || s.section || "";
      const studentStreamNormalized = String(rawStudentStream).trim().toLowerCase();
      const selectedStreamNormalized = stream.trim().toLowerCase();

      const isAllStreams = !stream || selectedStreamNormalized === "all streams" || selectedStreamNormalized === "";
      const matchesStream = isAllStreams || !studentStreamNormalized || studentStreamNormalized === selectedStreamNormalized;

      // Safe: Search with empty term default
      const matchesSearch = searchTerm.trim() === "" ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.assessment && s.assation.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [studentsList, currentGrade, stream, searchTerm]);

  // ============================================
  // GRADES & STREAM DERIVED DATA
  // ============================================
  // Safe: availableGrades always an array
  const availableGrades = useMemo(() => {
    const cbcOrder = [
      "pp1", "pp2", "playgroup", "pp1/pp2",
      "grade 1", "grade 2", "grade 3",
      "grade 4", "grade 5", "grade 6",
      "grade 7", "grade 8", "grade 9"
    ];

    let rawGrades: string[] = [];
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

    // Safe: sorted always an array
    const sorted = [...rawGrades].sort((a, b) => {
      const nameA = (a.name || a).toString().trim().toLowerCase();
      const nameB = (b.name || b).toString().trim().toLowerCase();
      
      const indexA = cbcOrder.indexOf(nameA);
      const indexB = cbcOrder.indexOf(nameB);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      const numA = parseInt(nameA.replace(/[^0-9]/g, ""), 10) || 999;
      const numB = parseInt(nameB.replace(/[^0-9]/g, ""), 10) || 999;
      if (numA !== numB) return numA - numB;

      return nameA.localeCompare(nameB);
    });

    // Safe: display standardization always returns array
    return sorted.map((g: any) => {
      const str = (g.name || g).toString().trim();
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

  // Safe: currentGradeStreams always an array
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

  // Safe: currentGradeStreams always an array
  const currentGradeStreams = useMemo(() => {
    const streams = streamsByGrade[currentGrade] || ["Green", "Yellow", "Blue", "Red", "Neptune", "Jupiter", "Mercury", "Venue"];
    return streams;
  }, [streamsByGrade, currentGrade]);

  // Safe: examTypesList always an array
  const examTypesList = useMemo(() => {
    try {
      const stored = safeGetItem("munyaka_exam_types");
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map((et: any) => ({
          id: et.id || et.code || et.name,
          code: et.code || et.id || et.name,
          name: et.name || et.code || et.id
        }));
      }
    } catch (e) {
      console.error("Error loading munyaka_exam_types:", e);
    }
    // Safe: always returns array
    return DEFAULT_EXAM_TYPES;
  }, []); // Empty array as default to prevent mount crash

  // Set initial exam type if available
  useEffect(() => {
    if (examTypesList.length > 0 && (!examType || !examTypesList.some((et: any) => (et.name || et.code) === examType))) {
      setExamType(examTypesList[0]?.name || examTypesList[0]?.code || "Formative Assessment");
    }
  }, [examTypesList, examType]);

  // Safe: allTierSubjects always an array
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
    // Safe: always returns filtered array
    return subjects.filter((subj: string) => !subj.toLowerCase().includes('ppi') && !subj.toLowerCase().includes('pastoral'));
  }, [learningAreasFromStorage, currentGrade, defaultTierSubjects]);

  // Safe: activeSubjects always an array
  const activeSubjects = useMemo(() => {
    const base = subject === "All Subjects" ? allTierSubjects : [subject];
    // Safe: always returns array, even if subject is undefined
    return (base || []).filter((subj: string) => !subj.toLowerCase().includes('ppi') && !subj.toLowerCase().includes('pastoral'));
  }, [subject, allTierSubjects]);

  // ============================================
  // STRICT 5-PART COMPOSITE KEY GENERATION
  // ============================================
  const targetKey = useMemo(() => {
    return `${academicYear}_${term}_${grade}_${subject}_${examType}`;
  }, [academicYear, term, grade, subject, examType]);

  // ============================================
  // MARK STATE WITH SAFE DEFAULT
  // ============================================
  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  // ... rest of the component calculations ...

  // Safe: studentTotals always an object
  const studentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    // Safe: filteredStudents is always an array
    filteredStudents.forEach(student => {
      const studentId = student.id || student.admissionNumber;
      const studentMarks = marksMatrix[studentId] || {};
      let sum = 0;
      let hasMarks = false;
      // Safe: allTierSubjects is always an array
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
      totals[studentId] = hasMarks ? sum : 0;
    });
    return totals;
  }, [filteredStudents, marksMatrix, allTierSubjects]);

  // ... rest of calculations with safe fallbacks ...

  // Safe: handleMarkChange with targetKey in closure
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

      // Safe: targetKey always defined
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

  // ... rest of the component

  // Safe: handleDownloadCSV with explicit trigger only
  const handleDownloadCSV = () => {
    // Safe: export only runs on explicit click, not mount
    if (filteredStudents.length === 0) {
      showError("No students found to export.");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      // Safe: all variables are arrays or objects with fallbacks
      const {
        schoolName,
        schoolAddress,
        schoolMotto
      } = readSchoolSettings();

      // Build header rows with optional chaining
      const headerLines: string[] = [];
      headerLines.push(schoolName || "MUNYAKA PRIMARY AND JUNIOR SCHOOL");
      headerLines.push(schoolAddress || "P.O. BOX 5 ELDORET");
      headerLines.push(schoolMotto || "MOTTO: KNOWLEDGE POWER");
      headerLines.push(`GRADE: ${grade}  STREAM: ${stream}`);
      headerLines.push(`YEAR: ${academicYear}  TERM: ${term}  EXAM: ${examType}`);
      headerLines.push("");

      // Safe: column headers with allTierSubjects
      const columnHeaders = ["Learner Name", "Admission No", "Stream", ...allTierSubjects, "Total"];
      headerLines.push(columnHeaders.join(","));

      // Safe: data rows
      const rows: string[] = [];
      filteredStudents.forEach(student => {
        const studentId = student.id || student.admissionNumber;
        const studentMarks = marksMatrix[studentId] || {};
        const scores = allTierSubjects.map(subj => studentMarks[subj] !== undefined ? studentMarks[subj] : "");
        const total = studentTotals[studentId] || 0;
        rows.push([
          `"${(student.name || "").replace(/"/g, '""')}"`,
          `"${(student.admissionNumber || student.id || "").replace(/"/g, '""')}"`,
          `"${(student.stream || "").replace(/"/g, '""')}"`,
          ...scores,
          total
        ].join(","));
      });

      // Safe: summary rows
      const subjectTotalRow = ["SUBJECT TOTALS", "", "", ...Object.values(subjectTotals || {}), (grandTotalSum || 0)].join(",");
      const subjectMSSRow = ["SUBJECT MSS", "", "", ...Object.values(subjectMSS || {}), (grandTotalMSS || 0)].join(",");

      const allLines = [...headerLines, ...rows, subjectTotalRow, subjectMSSRow].join("\n");

      const metadataLines = [
        `"Marks Entry & CBC Assessment - ${grade} (${stream})"`,
        `"Academic Year: ${academicYear} | Term: ${term} | Exam: ${examType}"`,
        `Generated: ${new Date().toLocaleString()}`,
        `Total Learners: ${filteredStudents.length}`
      ];

      const csvContent = allLines + "\n" + metadataLines.join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const safeGrade = grade.replace(/\s+/g, "_");
      const safeStream = stream.replace(/\s+/g, "_");
      link.setAttribute("download", `Marks_Entry_${safeGrade}_${safeStream}_${academicYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      showSuccess("CSV report downloaded successfully.");
    }, 600);
  };

  // ... rest of component

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full">
      {/* ... JSX with safe fallbacks ... */}
    </div>
  );
};

export default Assessments;