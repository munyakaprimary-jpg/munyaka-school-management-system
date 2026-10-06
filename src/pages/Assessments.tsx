"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CentralDataService } from "@/services/centralDataService";
import { showSuccess, showError } from "@/utils/toast";
import { notifyDataChanged } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Save, Loader2, Search, CheckCircle2, ClipboardCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_EXAM_TYPES } from "@/lib/assessment-constants";
import { useFileDownload } from "@/utils/fileDownloader";
import { MUNYAKA_HEADERS } from "@/utils/downloadHelper";
import { saveTeacherInputResult } from "@/utils/assessmentResults";
import { cn } from "@/lib/utils";
import { useBackToAssessmentsMenu } from "@/hooks/useBackToAssessmentsMenu";

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

interface Student {
  id?: string;
  admissionNumber?: string;
  assessment?: string;
  grade?: string;
  gradeLevel?: string;
  class?: string;
  stream?: string;
  classStream?: string;
  section?: string;
  name?: string;
}

const Assessments = () => {
  const { user } = useAuth();
  // Control States bound to localStorage / defaults
  const [academicYear, setAcademicYear] = useState<string>(() => new Date().getFullYear().toString());
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>(() => {
    const currentY = new Date().getFullYear();
    return [String(currentY - 1), String(currentY), String(currentY + 1), String(currentY + 2)];
  });
  
  const [grade, setGrade] = useState<string>(() => "Grade 4");
  const [stream, setStream] = useState<string>("All Streams");
  const [examType, setExamType] = useState<string>("Formative Assessment");
  // Helper function to ensure consistent string formatting
  const formatTerm = (val: any): string => {
    if (!val) return 'Term 3'; // Safety fallback
    const s = val.toString().trim();
    return s.toLowerCase().includes('term') ? s : `Term ${s}`;
  };

  const getActiveTermFromStorage = (): string => {
    try {
      localStorage.removeItem("munyaka_term_filter_stale");
      localStorage.removeItem("selectedTerm");
      const settingsRaw = localStorage.getItem("munyaka_system_settings_v3") || localStorage.getItem("munyaka_system_settings");
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        const activeT = settings.academic?.activeTerm || settings.term || settings.currentTerm;
        if (activeT) return formatTerm(activeT);
      }
      const rawTerm = localStorage.getItem('activeTerm');
      if (rawTerm) return formatTerm(rawTerm);
    } catch {
      // ignore
    }
    return 'Term 3';
  };

  const [term, setTerm] = useState<string>(() => getActiveTermFromStorage());
  const [subject, setSubject] = useState<string>("All Subjects");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  // Load system settings for default academic year and active term on mount and setup sync effect
  useEffect(() => {
    const syncSettings = () => {
      try {
        const settingsRaw = localStorage.getItem("munyaka_system_settings_v3") || localStorage.getItem("munyaka_system_settings");
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          const activeY = settings.academic?.activeYear || settings.academicYear;
          if (activeY) setAcademicYear(activeY);
          const activeT = settings.academic?.activeTerm || settings.term || settings.currentTerm;
          if (activeT) {
            setTerm(formatTerm(activeT));
          }
        }
        const rawTerm = localStorage.getItem('activeTerm');
        if (rawTerm) {
          setTerm(formatTerm(rawTerm));
        }
      } catch {
        // ignore
      }
    };

    syncSettings();

    // Listen for storage changes or custom settings update events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "munyaka_system_settings_v3" || e.key === "munyaka_system_settings" || e.key === "activeTerm") {
        syncSettings();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  const [lockedTermsMap, setLockedTermsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('munyaka_term_locks');
      if (stored) {
        setLockedTermsMap(JSON.parse(stored));
      }
    } catch { /* ignore */ }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'munyaka_term_locks' && e.newValue) {
        try { setLockedTermsMap(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isLocked = useMemo(() => {
    try {
      // 1. Check munyaka_academic_calendar
      const cal = JSON.parse(localStorage.getItem('munyaka_academic_calendar') || '{}');
      if (cal.terms && Array.isArray(cal.terms)) {
        const currentTermObj = cal.terms.find((t: any) => t.isCurrent || t.active || t.name === term || t.name?.toLowerCase() === term.toLowerCase());
        if (currentTermObj && (currentTermObj.isLocked || currentTermObj.locked)) {
          return true;
        }
      }
      // 2. Check munyaka_system_settings
      const settings = JSON.parse(localStorage.getItem('munyaka_system_settings') || localStorage.getItem('munyaka_system_settings_v3') || '{}');
      if (settings.academic?.termLocked && (settings.academic?.activeTerm === term || !settings.academic?.activeTerm)) {
        return true;
      }
      // 3. Check munyaka_term_locks map
      const locksMap = JSON.parse(localStorage.getItem('munyaka_term_locks') || '{}');
      const termKey = `${term} ${academicYear}`;
      if (locksMap[termKey] || locksMap[term] || locksMap[term.toLowerCase()]) {
        return true;
      }
    } catch { /* ignore */ }

    return false;
  }, [term, academicYear]);

  const inputDisabled = isLocked;

  // ====== Navigation ======
  const navigate = useNavigate();

  // Returns the user to the parent Assessments menu. Local selection state
  // is reset so re-entry starts clean, but persisted marks remain intact.
  const handleBackToParent = useBackToAssessmentsMenu(
    {}, // no module-style setters in this route — falls back to navigate()
    { resets: [() => setSearchTerm("")] }
  );

  // ====== Unified file-download state for CSV & PDF ======
  const csvExport = useFileDownload();
  const pdfExport = useFileDownload();

  // Null-safe grade getter
  const currentGrade = grade || "Grade 1";
  const tierKey = useMemo(() => getTierKey(currentGrade), [currentGrade]);
  const defaultTierSubjects = useMemo(() => TIER_SUBJECTS[tierKey] || TIER_SUBJECTS["lower-primary"], [tierKey]);

  // 1. Retrieve Students Directory from localStorage with munyaka_learners_db and school_learners_data (unified Learner Management state) and fallbacks
  // Cold start: returns [] when localStorage is empty — no mock data.
  const [studentsList, setStudentsList] = useState<Student[]>(() => {
    try {
      const stored =
        localStorage.getItem("munyaka_learners_db") ||
        localStorage.getItem("school_learners_data") ||
        localStorage.getItem("munyaka_students") ||
        localStorage.getItem("students_directory") ||
        localStorage.getItem("learners") ||
        localStorage.getItem("munyaka_students_master");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is Student =>
            item !== null && typeof item === "object"
          );
        }
      }
    } catch (e) {
      console.error("Error loading munyaka_learners_db / school_learners_data:", e);
    }
    return [];
  });

  // State listener for dynamic updates to student profiles / localStorage changes
  useEffect(() => {
    const loadLearners = () => {
      try {
        const stored =
          localStorage.getItem("munyaka_learners_db") ||
          localStorage.getItem("school_learners_data") ||
          localStorage.getItem("munyaka_students") ||
          localStorage.getItem("students_directory") ||
          localStorage.getItem("learners") ||
          localStorage.getItem("munyaka_students_master");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setStudentsList(
              parsed.filter((item): item is Student =>
                item !== null && typeof item === "object"
              )
            );
          }
        }
      } catch (e) {
        console.error("Error reloading learners in event listener:", e);
      }
    };

    window.addEventListener("storage", loadLearners);
    window.addEventListener("munyaka:data-changed" as any, loadLearners);
    return () => {
      window.removeEventListener("storage", loadLearners);
      window.removeEventListener("munyaka:data-changed" as any, loadLearners);
    };
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

  const { user } = useAuth();

  const availableGrades = useMemo(() => {
    const roleLower = String(user?.role || (typeof window !== 'undefined' ? localStorage.getItem('current_user_role') : '') || '').toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'owner' || roleLower.includes('admin') || roleLower === 'administrator';
    const teacherName = user?.name || 'Lawrence Mwangi';
    const assignedTeacherGrade = (!isAdmin && (teacherName.toLowerCase().includes('lawrence') || !isAdmin)) ? 'Grade 1' : ((user as any)?.grade || (user as any)?.assignedClass || 'Grade 1');

    if (!isAdmin) {
      return [assignedTeacherGrade];
    }

    const cbcOrderList = [
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

    // Sort according to cbcOrderList with normalization
    const sorted = [...rawGrades].sort((a, b) => {
      const itemA = typeof a === 'object' && a !== null ? a.name : a;
      const itemB = typeof b === 'object' && b !== null ? b.name : b;

      const nameA = String(itemA ?? '').trim();
      const nameB = String(itemB ?? '').trim();

      const indexA = cbcOrderList.indexOf(nameA.toLowerCase());
      const indexB = cbcOrderList.indexOf(nameB.toLowerCase());

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return nameA.localeCompare(nameB);
    });

    return sorted.length > 0 ? sorted : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
  }, [gradesListFromStorage, studentsList, user]);
      return nameA.localeCompare(nameB);
    });

    return sorted.length > 0 ? sorted : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
  }, [gradesListFromStorage, studentsList, user]);
          return nameA.localeCompare(nameB);
        });

    // Display Standardization: Format nicely (e.g. capitalize "grade 5" -> "Grade 5")
    return sorted.map((g: any) => {
      const str = String(g.name || g || '').trim();
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
            map[gName] = g.streams.map((st: any) =>
              typeof st === 'string' ? st : (st.name || st.label || st.streamName)
            );
          } else if (Array.isArray(g.classes)) {
            map[gName] = g.classes.map((c: any) =>
              typeof c === 'string' ? c : (c.name || c.label)
            );
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
  // FILTERED STUDENTS - ROBUST GRADE & STREAM MATCHER
  // ============================================
  const filteredStudents = useMemo(() => {
    return studentsList.filter((learner: any) => {
      // Grade matching with robust normalization
      if (!grade || grade === 'ALL' || grade === 'All Grades') {
        // match all
      } else {
        const cleanSelected = grade.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLearnerGrade = (learner.grade || learner.gradeLevel || learner.class || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchesGrade = cleanLearnerGrade.includes(cleanSelected) || cleanSelected.includes(cleanLearnerGrade);
        if (!matchesGrade) return false;
      }

      // Stream matching
      if (!stream || stream === 'ALL' || stream === 'All Streams') {
        // match all streams
      } else {
        const cleanSelectedStream = stream.toString().toLowerCase().trim();
        const cleanLearnerStream = (learner.stream || learner.classStream || learner.section || '').toString().toLowerCase().trim();
        if (cleanLearnerStream && cleanSelectedStream && cleanLearnerStream !== cleanSelectedStream) {
          return false;
        }
      }

      // Search term matching
      const matchesSearch = !String(searchTerm || '').trim() ||
              (learner.name && learner.name.toLowerCase().includes(String(searchTerm || '').toLowerCase().trim())) ||
              (learner.admissionNumber && learner.admissionNumber.toLowerCase().includes(String(searchTerm || '').toLowerCase().trim())) ||
              (learner.assessment && learner.assessment.toLowerCase().includes(String(searchTerm || '').toLowerCase().trim())) ||
              (learner.id && learner.id.toLowerCase().includes(String(searchTerm || '').toLowerCase().trim()));

      return matchesSearch;
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
    // Also persists an AssessmentResult record linked to student/class/subject/term.
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
          notifyDataChanged(targetKey);
  
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
          notifyDataChanged("munyaka_assessment_scores");
  
          // Also write an AssessmentResult record linked to student/class/subject/term
          if (clean !== "") {
            const score = parseInt(clean, 10);
            if (!isNaN(score)) {
              const student = filteredStudents.find(
                (s) => (s.id || s.admissionNumber) === studentId
              );
              if (student) {
                saveTeacherInputResult(score, {
                  studentId,
                  studentName: student.name,
                  classId: student.grade || student.gradeLevel || currentGrade,
                  className: student.grade || student.gradeLevel || currentGrade,
                  stream: student.stream || student.classStream,
                }, {
                  academicYear,
                  term,
                  examType,
                  subjectId: subj,
                  subjectName: subj,
                  assessmentTitle: `${subj} – ${examType}`,
                  maxScore: 100,
                });
              }
            }
          }
        } catch (e) {
          console.error("Autosave/History preservation error:", e);
        }
  
        return updated;
      });
  
      setShowSavedBadge(true);
      setTimeout(() => setShowSavedBadge(false), 2000);
    }, [targetKey, filteredStudents, academicYear, term, examType, currentGrade]);

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
    // Also writes AssessmentResult records for every entered mark
    const handleSaveAll = async () => {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 600));
      try {
        localStorage.setItem(targetKey, JSON.stringify(marksMatrix));
        notifyDataChanged(targetKey);
  
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
        notifyDataChanged("munyaka_assessment_scores");
  
        // Bulk write AssessmentResult records for every entered mark
        filteredStudents.forEach((student) => {
          const studentId = student.id || student.admissionNumber;
          const studentMarks = marksMatrix[studentId] || {};
          Object.entries(studentMarks).forEach(([subj, rawScore]) => {
            const scoreStr = String(rawScore || "").trim();
            if (scoreStr !== "") {
              const score = parseInt(scoreStr, 10);
              if (!isNaN(score)) {
                saveTeacherInputResult(score, {
                  studentId,
                  studentName: student.name,
                  classId: student.grade || student.gradeLevel || currentGrade,
                  className: student.grade || student.gradeLevel || currentGrade,
                  stream: student.stream || student.classStream,
                }, {
                  academicYear,
                  term,
                  examType,
                  subjectId: subj,
                  subjectName: subj,
                  assessmentTitle: `${subj} – ${examType}`,
                  maxScore: 100,
                });
              }
            }
          });
        });
  
        setIsSaving(false);
        showSuccess("All marks successfully committed to localStorage!");
      } catch (e) {
        setIsSaving(false);
        showError("Error saving marks: " + (e instanceof Error ? e.message : String(e)));
      }
    };

  // ====== UNIFIED DOWNLOAD HANDLER: CSV export ======
  // Builds the CSV with EXACTLY these first rows in order:
  //   1. MUNYAKA PRIMARY AND JUNIOR
  //   2. P.O. BOX 5239, ELDORET
  //   3. MOTTO: Knowledge Is Power
  //   4. [blank]
  //   5. Column headers
  //   6. Data rows
  const handleDownloadCSV = async () => {
    if (filteredStudents.length === 0) {
      showError("No students found to export.");
      return;
    }

    // ============================================
    // STEP 1: Build the first 4 institutional rows
    // These are pushed to the array FIRST so they appear as the
    // topmost rows in the exported CSV file.
    // ============================================
    const headerRows: string[] = [
      MUNYAKA_HEADERS.schoolLine1,         // "MUNYAKA PRIMARY AND JUNIOR"
      MUNYAKA_HEADERS.schoolLine2,         // "P.O. BOX 5239, ELDORET"
      MUNYAKA_HEADERS.schoolLine3,         // "MOTTO: Knowledge Is Power"
      "",                                  // Blank separator row
    ];

    // ============================================
    // STEP 2: Build the column headers row
    // ============================================
    const columnHeaders = ["Learner Name", "Admission/ID", "Stream", ...allTierSubjects, "Total"];

    // ============================================
    // STEP 3: Build the per-student data rows
    // ============================================
    const dataRows: string[] = filteredStudents.map(student => {
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

    // ============================================
    // STEP 4: Build the optional summary rows
    // (Subject Totals + Subject MSS) — these go AFTER the data.
    // ============================================
    const summaryRows: string[] = [
      ["SUBJECT TOTALS", "", "", ...allTierSubjects.map(subj => subjectTotals[subj] || 0), grandTotalSum].join(","),
      ["SUBJECT MSS", "", "", ...allTierSubjects.map(subj => subjectMSS[subj] || 0), grandTotalMSS].join(","),
    ];

    // ============================================
    // STEP 5: Concatenate every section in the EXACT order required:
    //   institutional header (4 rows) -> column headers (1 row) -> data rows -> summary rows
    // ============================================
    const csvContent = [
      ...headerRows,
      columnHeaders.join(","),
      ...dataRows,
      ...summaryRows,
    ].join("\n");

    await csvExport.download({
      filename: `Marks_Entry_${grade.replace(/\s+/g, "_")}_${stream.replace(/\s+/g, "_")}_${academicYear}.csv`,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
    });
  };

  // ====== UNIFIED DOWNLOAD HANDLER: PDF export (uses browser print) ======
  const handleDownloadPDF = async () => {
    // Build a simple text-based "PDF" data payload that we'll write via
    // the unified file downloader (which uses Capacitor's Filesystem on
    // native and a blob anchor on web). For the actual visual PDF, we fall
    // back to the browser's native print dialog on web, which produces
    // a real PDF when the user selects "Save as PDF" in the dialog.
    if (typeof window !== 'undefined') {
      // On web, trigger the browser's native "Save as PDF" path
      const isNative = (await import('@capacitor/core')).Capacitor.isNativePlatform();
      if (!isNative) {
        try {
          window.print();
          return;
        } catch (err) {
          console.error('window.print() failed:', err);
        }
      }
    }

    // On native, write a plain-text summary to Documents so the user can share
    // it through the OS share sheet.
    const summary = `Marks Entry Export
=====================
Grade: ${grade}
Stream: ${stream}
Academic Year: ${academicYear}
Term: ${historyMode ? historyTerm : term}
Exam Type: ${examType}
Generated: ${new Date().toLocaleString()}

Class Mean: ${classStats.meanFormatted}
Completion: ${classStats.completionText}

${filteredStudents.length} learner(s) included.
`;
    await pdfExport.download({
      filename: `Marks_Entry_${grade.replace(/\s+/g, "_")}_${academicYear}.txt`,
      data: summary,
      mimeType: 'text/plain;charset=utf-8;',
      fileType: 'txt',
      pendingMessage: 'Preparing PDF report...',
      successMessage: 'PDF report downloaded successfully.',
      errorMessage: 'Download failed. Please check app permissions.',
    });
  };

  // State for View Marks History / Academic Archive tab
  const [historyMode, setHistoryMode] = useState<boolean>(false);
  const [historyYear, setHistoryYear] = useState<string>(() => new Date().getFullYear().toString());
  const [historyTerm, setHistoryTerm] = useState<string>("Term 1");
  const [historyGrade, setHistoryGrade] = useState<string>(() => "Grade 4");
  const [historyExamType, setHistoryExamType] = useState<string>("Formative Assessment");

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Term Locked Warning Banner */}
      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <div className="text-sm font-medium">
            <strong>Term Locked:</strong> {term} {academicYear} is currently locked. All score entries and submissions are in read-only mode.
          </div>
        </div>
      )}

      {/* 1. Header & Quick Actions Layout - stacks on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-full overflow-hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleBackToParent}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center shrink-0"
              title="Back to Assessments Menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 whitespace-normal break-words">Marks Entry & CBC Assessment</h1>
            {showSavedBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <CheckCircle2 size={12} /> Saved to LocalStorage
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 break-words hyphens-auto">
            {historyMode ? "Academic Archive & Marks History Review (Read-Only Mode)." : "Enter class marks for one subject or switch to All Subjects to fill a full matrix. Valid scores autosave to localStorage; use Save All for bulk commit."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 my-4 w-full sm:w-auto">
          <Button
            variant={historyMode ? "default" : "outline"}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors h-11",
              historyMode
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md border-transparent"
                : ""
            )}
            onClick={() => setHistoryMode(!historyMode)}
          >
            <ClipboardCheck size={16} /> {historyMode ? "Back to Live" : "View Marks History"}
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors h-11"
            onClick={handleDownloadCSV}
            disabled={csvExport.isDownloading}
          >
            {csvExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />} Download CSV
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors h-11"
            onClick={handleDownloadPDF}
            disabled={pdfExport.isDownloading}
          >
            {pdfExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />} Download PDF
          </Button>
          <Button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors h-11 disabled:opacity-50"
            onClick={handleSaveAll}
            disabled={isSaving || isLocked}
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Marks
          </Button>
        </div>
      </div>

      {/* History Mode Active Banner */}
      {historyMode && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-300 px-5 py-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
            <div className="text-sm font-semibold">
              <strong>Academic Archive Mode:</strong> Reviewing historical marks for <strong>{historyTerm} {historyYear}</strong> ({historyGrade}, {historyExamType}). All filters below are fully enabled in read-only mode for audit and reporting.
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-indigo-700 hover:bg-indigo-100/50 rounded-lg h-8"
            onClick={() => setHistoryMode(false)}
          >
            Exit Archive
          </Button>
        </div>
      )}

      {/* 3. Dynamic Filter Bar & Controls (Responsive Grid Card Container) */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 w-full max-w-full overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-3">
          
          {/* 1. Academic Year */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Academic Year</label>
            <Select
              value={historyMode ? historyYear : academicYear}
              onValueChange={historyMode ? setHistoryYear : setAcademicYear}
            >
              <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
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
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Grade</label>
            <Select
              value={historyMode ? historyGrade : grade}
              onValueChange={historyMode ? setHistoryGrade : setGrade}
            >
              <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
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
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Stream</label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
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
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Exam Type</label>
            <Select
              value={historyMode ? historyExamType : examType}
              onValueChange={historyMode ? setHistoryExamType : setExamType}
            >
              <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
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
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Term</label>
            {historyMode ? (
              <Select value={historyTerm} onValueChange={setHistoryTerm}>
                <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="relative pointer-events-none select-none">
                <Select value={term} onValueChange={() => {}}>
                  <SelectTrigger
                    disabled={true}
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg shadow-sm h-9 opacity-90 pointer-events-none focus:ring-0"
                    tabIndex={-1}
                  >
                    <SelectValue placeholder={term} />
                  </SelectTrigger>
                  <SelectContent className="hidden">
                    <SelectItem value={term}>{term}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 6. Subject */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9">
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
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Find Learner</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name/ID..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm h-9"
              />
            </div>
          </div>

          {/* 8. Class Average Card */}
          <div className="flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Class Average</label>
            <div className="w-full px-2.5 py-1.5 text-xs bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm h-9 flex items-center justify-between">
              <span className="font-bold text-indigo-700">{classStats.meanFormatted}</span>
              <span className="text-[10px] font-semibold text-indigo-500">{classStats.completionText}</span>
            </div>
          </div>

        </div>
      </Card>

      {/* 4. Educational Tier-Based Mark Sheet Table Matrix */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-normal text-slate-600 border-r w-64 min-w-[220px]">
                  Learner Details ({filteredStudents.length})
                </th>
                {activeSubjects.map(subj => {
                  // Abbreviate or split long subject titles for clean presentation
                  let mainSubj = subj;
                  let subLabel = "";
                  if (subj.includes("(") && subj.includes(")")) {
                    const match = subj.match(/^(.*?)\s*\((.*?)\)$/);
                    if (match) {
                      mainSubj = match[1].trim();
                      subLabel = match[2].trim();
                    }
                  }
                  return (
                    <th key={subj} className="py-2 px-2 text-[11px] font-semibold tracking-normal text-slate-600 uppercase text-center border-r min-w-[90px] max-w-[110px] leading-tight">
                      <div className="truncate" title={subj}>{mainSubj}</div>
                      {subLabel && <div className="text-[9px] text-slate-400 font-normal truncate">({subLabel})</div>}
                    </th>
                  );
                })}
                <th className="bg-indigo-50 py-2 px-3 text-[11px] font-semibold tracking-normal text-indigo-700 uppercase text-center min-w-[90px] max-w-[100px] border-l">
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
                          <td key={subj} className="px-2 py-3 border-r text-center min-w-[100px] max-w-[140px]">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={studentMarks[subj] !== undefined ? studentMarks[subj] : ""}
                              onChange={e => handleMarkChange(studentId, subj, e.target.value)}
                              disabled={inputDisabled}
                              readOnly={inputDisabled}
                              placeholder="—"
                              className={cn(
                                "w-16 sm:w-20 h-10 mx-auto text-center font-black text-sm rounded-lg bg-slate-50 border-none focus:bg-white focus:ring-2 ring-indigo-100 transition-all",
                                inputDisabled && "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500"
                              )}
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