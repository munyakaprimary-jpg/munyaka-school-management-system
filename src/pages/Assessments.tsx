"use client";

import React, { useState, useEffect, useMemo } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { GRADES_DATA, STUDENTS, Grade, Stream } from "@/lib/mock-data";
import { ExamTypeOption, LearningArea } from "@/types/assessments";
import { DEFAULT_EXAM_TYPES, FALLBACK_CLUSTERS } from "@/lib/assessment-constants";
import { MarksService, buildExamId } from "@/services/MarksService";
import { MarksMatrix } from "@/services/schema";
import { LearningAreasService } from "@/services/learning-areas-service";

// Sub-components
import AssessmentHeader from "@/components/assessments/AssessmentHeader";
import AssessmentFilters from "@/components/assessments/AssessmentFilters";
import MarksTable from "@/components/assessments/MarksTable";
import AssessmentInstructions from "@/components/assessments/AssessmentInstructions";

const Assessments = () => {
 // State to hold dynamically fetched grades
 const [gradesList, setGradesList] = useState<Grade[]>([]);
 const [isLoadingGrades, setIsLoadingGrades] = useState(true);

 // Fetch grades from learning areas service on mount
 useEffect(() => {
   LearningAreasService.fetchLearningAreas()
     .then((data) => {
            // Transform learning areas to grades format
            const transformedGrades = data.map((area, index) => ({
              id: `grade-${index + 1}`,
              name: area.name,
              category: area.type === 'Core' ? 'Primary' as const : 'Junior School' as const,
              streams: [
                { id: `s${index}a`, name: 'Class A', teacher: 'Unassigned', studentsCount: 30 },
                { id: `s${index}b`, name: 'Class B', teacher: 'Unassigned', studentsCount: 28 }
              ]
            }));
            setGradesList(transformedGrades.length > 0 ? transformedGrades : GRADES_DATA);
            setIsLoadingGrades(false);
          })
     .catch((error) => {
       console.error("Error fetching learning areas:", error);
       // Fall back to mock data on error
       setGradesList(GRADES_DATA);
       setIsLoadingGrades(false);
     });
 }, []);

 // Dynamically load exam types
 const examTypesList = useMemo<ExamTypeOption[]>(() => {
   const saved = localStorage.getItem("munyaka_exam_types");
   if (saved) {
     try {
       const parsed = JSON.parse(saved);
       if (Array.isArray(parsed) && parsed.length > 0) {
         return parsed;
       }
     } catch (e) {
       console.error("Error parsing saved exam types:", e);
     }
   }
   return DEFAULT_EXAM_TYPES;
 }, []);

 // Filter States
 const [selectedGradeId, setSelectedGradeId] = useState<string>("");
 const [selectedStreamId, setSelectedStreamId] = useState<string>("all");
 const [examType, setExamType] = useState<string>("");
 const [term, setTerm] = useState("term1");
 const [searchTerm, setSearchTerm] = useState("");
 const [academicYear, setAcademicYear] = useState(() => new Date().getFullYear().toString());

 // Derived exam identity for the currently selected exam/session
 const currentExamId = useMemo(() => {
   if (!examType) return "";
   return buildExamId({
     academic_year: academicYear,
     term,
     exam_type: examType,
     gradeId: selectedGradeId,
     streamId: selectedStreamId,
   });
 }, [academicYear, term, examType, selectedGradeId, selectedStreamId]);

 // Data States
  const [marksMatrix, setMarksMatrix] = useState<MarksMatrix>({});
  const [activeExamId, setActiveExamId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
 
  // Load saved marks for the selected exam only (blank grid for a new exam).
  useEffect(() => {
    if (!currentExamId) {
      // When switching to a new exam type with no records, initialize blank fields
      setMarksMatrix({});
      setActiveExamId("");
      return;
    }
    setMarksMatrix(MarksService.getMarks(currentExamId));
    setActiveExamId(currentExamId);
  }, [currentExamId]);

 // Set default selected grade
 useEffect(() => {
   if (!selectedGradeId && gradesList.length > 0) {
     setSelectedGradeId(gradesList[0].id);
   }
 }, [gradesList, selectedGradeId]);

 // Set default selected exam type
 useEffect(() => {
   if (!examType && examTypesList.length > 0) {
     setExamType(examTypesList[0].code || examTypesList[0].id);
   }
 }, [examTypesList, examType]);

 // Reset stream to 'all' whenever Grade Level changes
 useEffect(() => {
   if (selectedGradeId) {
     setSelectedStreamId("all");
   }
 }, [selectedGradeId]);

 const currentGrade = useMemo(() =>
   gradesList.find((g: Grade) => g.id === selectedGradeId),
   [selectedGradeId, gradesList]
 );

 const availableStreams = useMemo(() =>
   currentGrade ? currentGrade.streams : [],
   [currentGrade]
 );

 // Fetch learning areas dynamically from database
 const [dbLearningAreas, setDbLearningAreas] = useState<LearningArea[]>([]);
 const [isLoadingLearningAreas, setIsLoadingLearningAreas] = useState(true);

 useEffect(() => {
   const fetchLearningAreas = async () => {
     try {
       const areas = await LearningAreasService.getLearningAreasForCluster('lower-primary');
       setDbLearningAreas(areas);
     } catch (error) {
       console.error("Error fetching learning areas:", error);
     } finally {
       setIsLoadingLearningAreas(false);
     }
   };
   fetchLearningAreas();
 }, []);

 const filteredLearningAreas = useMemo(() => {
   if (!currentGrade) return [];
   const gradeName = currentGrade.name.toLowerCase();
   let clusterId = "lower-primary";
   if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) clusterId = "upper-primary";
   else if (gradeName.includes("pp")) clusterId = "pre-primary";
   else if (currentGrade.category === "Junior School") clusterId = "junior-school";

   // Use database learning areas if available, otherwise fall back to hardcoded
   if (!isLoadingLearningAreas && dbLearningAreas.length > 0) {
     return dbLearningAreas;
   }

   return FALLBACK_CLUSTERS.find(c => c.id === clusterId)?.learningAreas || [];
 }, [currentGrade, isLoadingLearningAreas, dbLearningAreas]);

 const filteredStudents = useMemo(() => {
   // Load students from student directory master localStorage or mock data
   let masterStudents = STUDENTS;
   const savedStudents = localStorage.getItem('munyaka_students_master');
   if (savedStudents) {
     try {
       const parsed = JSON.parse(savedStudents);
       if (Array.isArray(parsed) && parsed.length > 0) {
         masterStudents = parsed;
       }
     } catch (e) {
       console.error("Error parsing munyaka_students_master:", e);
     }
   }

   if (!currentGrade) return [];

   const gradeNameLower = currentGrade.name.toLowerCase();
   // e.g. "grade 4" or "4" or "pp1"
   const gradeQuery = gradeNameLower.replace("grade ", "").trim();

   return masterStudents.filter(s => {
     const sGrade = (s.grade || "").toLowerCase().trim();
     const sGradeFormatted = `grade ${sGrade}`.trim();
     
     const matchesGrade =
       sGrade === gradeQuery ||
       sGradeFormatted === gradeNameLower ||
       currentGrade.name.toLowerCase() === sGradeFormatted ||
       currentGrade.name.toLowerCase() === sGrade;

     let matchesStream = true;
     if (selectedStreamId !== "all") {
       const streamObj = availableStreams.find((sItem: Stream) => sItem.id === selectedStreamId);
       if (streamObj) {
         matchesStream = s.stream.toLowerCase().trim() === streamObj.name.toLowerCase().trim();
       }
     }

     const matchesSearch =
       !searchTerm.trim() ||
       s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
       s.assessment.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
       (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

     return matchesGrade && matchesStream && matchesSearch;
   });
 }, [currentGrade, selectedStreamId, availableStreams, searchTerm]);

 const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
   let clean = value.replace(/[^0-9]/g, "");
   if (clean !== "" && parseInt(clean, 10) > 100) clean = "100";

   setMarksMatrix(prev => ({
     ...prev,
     [studentId]: {
       ...(prev[studentId] || {}),
       [subjectId]: clean
     }
   }));
 };

 const handleSave = async () => {
   if (!currentExamId) {
     showError("Please select a valid exam period.");
     return;
   }

   // Validate that exam_type_id is present
   const examIdParts = currentExamId.split("|");
   const examTypeId = examIdParts[2];
   if (!examTypeId) {
     showError("Exam type ID is missing. Please select a valid exam period.");
     return;
   }

   setIsSaving(true);
   await new Promise(r => setTimeout(r, 800));

   try {
     MarksService.saveMarks(currentExamId, marksMatrix);
     setIsSaving(false);
     showSuccess("Marks saved successfully for this exam period.");
   } catch (e) {
     setIsSaving(false);
     showError("Error saving marks: " + (e.message || JSON.stringify(e)));
   }
 };

 const handleExport = () => {
   if (filteredStudents.length === 0) {
     showSuccess("No learners found to export.");
     return;
   }
 
   setIsExporting(true);
 
   setTimeout(() => {
     const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
     const row2 = "P.O. BOX 5239-30100,ELDORET";
     const row3 = "MOTTO: KNOWLEDGE POWER";
 
     const currentYear = new Date().getFullYear().toString();
     const gradeName = currentGrade ? currentGrade.name : "All Grades";
 
     const streamObj = availableStreams.find(s => s.id === selectedStreamId);
     const streamName = selectedStreamId === "all" ? "All Streams" : (streamObj ? streamObj.name : "All Streams");
 
     const formattedTerm = term === "term1" ? "Term 1" : term === "term2" ? "Term 2" : "Term 3";
 
     const row4 = `GRADE: ${gradeName}, STREAM: ${streamName}`;
     const row5 = `YEAR: ${currentYear}, TERM: ${formattedTerm}`;
 
     const headers = ["Learner Name", "Assessment ID", ...filteredLearningAreas.map(a => a.name), "Total"];
 
     // Calculate subject totals and MSS for summary rows
     const subjectTotals: Record<string, number> = {};
     const subjectMSS: Record<string, string> = {};
     
     filteredLearningAreas.forEach(area => {
       let sum = 0;
       let count = 0;
       filteredStudents.forEach(student => {
         const studentMarks = marksMatrix[student.id] || {};
         const val = studentMarks[area.id];
         if (val !== undefined && val !== "") {
           const num = parseInt(String(val), 10);
           if (!isNaN(num)) {
             sum += num;
             count++;
           }
         }
       });
       subjectTotals[area.id] = sum;
       subjectMSS[area.id] = count > 0 ? (sum / count).toFixed(2) : "0.00";
     });
     
     const grandTotalSum = Object.values(subjectTotals).reduce((a, b) => a + b, 0);
     const grandTotalMSS = Object.values(subjectMSS).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / Object.values(subjectMSS).length;
 
     const studentRows = filteredStudents.map(student => {
       const studentMarks = marksMatrix[student.id] || {};
       let hasMarks = false;
       const scores = filteredLearningAreas.map(area => {
         const val = studentMarks[area.id];
         if (val !== undefined && val !== "") {
           hasMarks = true;
           return val;
         }
         return "—";
       });
 
       const totalMarks = filteredLearningAreas.reduce((sum, area) => {
         const val = studentMarks[area.id];
         if (val !== undefined && val !== "") {
           const num = parseInt(String(val), 10);
           return sum + (isNaN(num) ? 0 : num);
         }
         return sum;
       }, 0);
 
       return [
         `${student.name.replace(/"/g, '""')}`,
         `${student.assessment.replace(/"/g, '""')}`,
         ...scores.map(s => `${s}`),
         `${hasMarks ? totalMarks : '—'}`
       ];
     });
 
     const csvContent = [
           row1,
           row2,
           row3,
           row4,
           row5,
           "",
           headers.map(h => `"${h}"`).join(","),
           ...studentRows.map(r => r.join(",")),
           // Subject Totals row
           ["Subject Totals", "", ...Object.values(subjectTotals).map(v => v.toString()), grandTotalSum.toString()].join(","),
           // Subject MSS row
           ["Subject MSS", "", ...Object.values(subjectMSS).map(v => v), grandTotalMSS.toFixed(2)].join(",")
         ].join("\n");
 
     // Data URI fallback for Android WebView compatibility
     const BOM = "\uFEFF";
     const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(BOM + csvContent);
 
     const link = document.createElement("a");
     link.setAttribute("href", dataUri);
     link.setAttribute("target", "_blank");
     link.setAttribute("download", "marks_entry.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
 
     setIsExporting(false);
     showSuccess(`Exported marks sheet for ${filteredStudents.length} learners with summary rows.`);
   }, 800);
 };

 return (
   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full table-scroll-viewport">
     <AssessmentHeader
       onExport={handleExport}
       onSave={handleSave}
       isSaving={isSaving}
       isExporting={isExporting}
     />

     <AssessmentFilters
       gradesList={gradesList}
       selectedGradeId={selectedGradeId}
       setSelectedGradeId={setSelectedGradeId}
       availableStreams={availableStreams}
       selectedStreamId={selectedStreamId}
       setSelectedStreamId={setSelectedStreamId}
       examTypesList={examTypesList}
       examType={examType}
       setExamType={setExamType}
       term={term}
       setTerm={setTerm}
       searchTerm={searchTerm}
       setSearchTerm={setSearchTerm}
       academicYear={academicYear}
       setAcademicYear={setAcademicYear}
     />

     <MarksTable
       filteredLearningAreas={filteredLearningAreas}
       filteredStudents={filteredStudents}
       marksMatrix={marksMatrix}
       onMarkChange={handleMarkChange}
     />

     <AssessmentInstructions />
   </div>
 );
};

export default Assessments;