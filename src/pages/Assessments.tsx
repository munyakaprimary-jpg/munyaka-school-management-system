"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { showSuccess } from '@/utils/toast';
import { Grade, Stream } from '@/lib/mock-data';
import { ExamTypeOption } from '@/types/assessments';
import { DEFAULT_EXAM_TYPES, FALLBACK_CLUSTERS } from '@/lib/assessment-constants';
import { useGradesStreams } from '@/hooks/useGradesStreams';

// Sub-components
import AssessmentHeader from '@/components/assessments/AssessmentHeader';
import AssessmentFilters from '@/components/assessments/AssessmentFilters';
import MarksTable from '@/components/assessments/MarksTable';
import AssessmentInstructions from '@/components/assessments/AssessmentInstructions';

const STORAGE_KEY = 'munyaka_marks_records';

const Assessments = () => {
  const { grades, streams, isLoading } = useGradesStreams();

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
  
  // Data States
  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load saved marks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMarksMatrix(parsed);
        }
      } catch (e) {
        console.error("Error loading saved marks:", e);
      }
    }
  }, []);

  // Persist marks to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(marksMatrix).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marksMatrix));
    }
  }, [marksMatrix]);

  // Set default selected grade
  useEffect(() => {
    if (!selectedGradeId && grades.length > 0) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, selectedGradeId]);

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
    grades.find((g: Grade) => g.id === selectedGradeId), 
    [selectedGradeId, grades]
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
        s.assessment.toLowerCase().includes(searchTerm.toLowerCase().toLowerCase());

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
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    
    // Persist to localStorage as permanent record
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marksMatrix));
    
    setIsSaving(false);
    showSuccess("Marks saved permanently! Records will persist across sessions.");
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