"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { GRADES_DATA, STUDENTS, Grade, Stream } from '@/lib/mock-data';
import { ExamTypeOption } from '@/types/assessments';
import { DEFAULT_EXAM_TYPES, FALLBACK_CLUSTERS } from '@/lib/assessment-constants';
import { MarksService, buildExamId } from '@/services/MarksService';

// Sub-components
import AssessmentHeader from '@/components/assessments/AssessmentHeader';
import AssessmentFilters from '@/components/assessments/AssessmentFilters';
import MarksTable from '@/components/assessments/MarksTable';
import AssessmentInstructions from '@/components/assessments/AssessmentInstructions';

const Assessments = () => {
  // Dynamically load grades and streams
  const gradesList = useMemo(() => {
    const saved = localStorage.getItem('munyaka_grades');
    const rawList: Grade[] = saved ? JSON.parse(saved) : GRADES_DATA;

    return [...rawList].sort((a, b) => {
      const categoryRank: Record<string, number> = {
        'Pre-Primary': 1,
        'Primary': 2,
        'Junior School': 3
      };
      
      const rankA = categoryRank[a.category] || 99;
      const rankB = categoryRank[b.category] || 99;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      const extractNumber = (name: string) => {
        const match = name.match(/\d+/);
        if (match) return parseInt(match[0], 10);
        if (name.toUpperCase().includes('PP1')) return 1;
        if (name.toUpperCase().includes('PP2')) return 2;
        return 0;
      };

      return extractNumber(a.name) - extractNumber(b.name);
    });
  }, []);

  // Dynamically load exam types
  const examTypesList = useMemo<ExamTypeOption[]>(() => {
    const saved = localStorage.getItem('munyaka_exam_types');
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
    const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
    const [activeExamId, setActiveExamId] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
  
    // Load saved marks for the selected exam only (blank grid for a new exam).
    useEffect(() => {
      if (!currentExamId) return;
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

  const filteredLearningAreas = useMemo(() => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    let clusterId = 'lower-primary';
    if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) clusterId = 'upper-primary';
    else if (gradeName.includes("pp")) clusterId = 'pre-primary';
    else if (currentGrade.category === 'Junior School') clusterId = 'junior-school';
    
    return FALLBACK_CLUSTERS.find(c => c.id === clusterId)?.learningAreas || [];
  }, [currentGrade]);

  const filteredStudents = useMemo(() => {
    if (!currentGrade) return [];
    
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');

    return STUDENTS.filter(s => {
      const matchesGrade = 
        s.grade === gradeNum || 
        s.grade === currentGrade.name ||
        `Grade ${s.grade}` === currentGrade.name;

      let matchesStream = true;
      if (selectedStreamId !== "all") {
        const streamObj = availableStreams.find((sItem: Stream) => sItem.id === selectedStreamId);
        if (streamObj) {
          matchesStream = s.stream.toLowerCase() === streamObj.name.toLowerCase();
        }
      }

      const matchesSearch = 
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.assessment.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [currentGrade, selectedStreamId, availableStreams, searchTerm]);

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, '');
    if (clean !== '' && parseInt(clean, 10) > 100) clean = "100";
    
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

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    try {
      MarksService.saveMarks(currentExamId, marksMatrix);
      setIsSaving(false);
      showSuccess("Marks saved successfully for this exam period.");
    } catch (e) {
      setIsSaving(false);
      showError("Failed to save marks. Please try again.");
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
            const num = parseInt(val, 10);
            return sum + (isNaN(num) ? 0 : num);
          }
          return sum;
        }, 0);

        return [
          `"${student.name.replace(/"/g, '""')}"`,
          `"${student.assessment.replace(/"/g, '""')}"`,
          ...scores.map(s => `"${s}"`),
          `"${hasMarks ? totalMarks : '—'}"`
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
        ...studentRows.map(r => r.join(","))
      ].join("\n");

      // Data URI fallback for Android WebView compatibility
      const BOM = '\uFEFF';
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(BOM + csvContent);
      
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("target", "_blank");
      link.setAttribute("download", "marks_entry.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      showSuccess(`Exported marks sheet for ${filteredStudents.length} learners.`);
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