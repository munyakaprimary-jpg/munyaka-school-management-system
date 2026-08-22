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

// ============================================
// SCHOOL SETTINGS READER - DYNAMIC RETRIEVAL
// ============================================
const readSchoolSettings = (): {
  schoolName: string;
  schoolAddress: string;
  schoolMotto: string;
} => {
  try {
    const stored = localStorage.getItem("munyaka_system_settings_v3");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return {
          schoolName: parsed.schoolName || "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
          schoolAddress: parsed.schoolAddress || "P.O. BOX 5 ELDORET",
          schoolMotto: parsed.schoolMotto || "MOTTO: KNOWLEDGE POWER"
        };
      }
    }
  } catch (e) {
    console.error("Error reading school settings:", e);
  }
  // Defaults if not found in localStorage
  return {
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    schoolAddress: "P.O. BOX 5 ELDORET",
    schoolMotto: "MOTTO: KNOWLEDGE POWER"
  };
};

// ============================================
// EXPORT CSV WITH OFFICIAL LETTERHEAD HEADER
// ============================================
const exportCSVWithHeader = (
  filteredStudents: any[],
  allTierSubjects: string[],
  studentTotals: Record<string, number>,
  subjectTotals: Record<string, number>,
  subjectMSS: Record<string, number>,
  grade: string,
  stream: string,
  academicYear: string,
  term: string,
  examType: string
) => {
  const {
    schoolName,
    schoolAddress,
    schoolMotto
  } = readSchoolSettings();

  // Build the header rows
  const headerLines: string[] = [];

  // Row 1: School Name
  headerLines.push(schoolName);

  // Row 2: Address details
  headerLines.push(schoolAddress);

  // Row 3: Motto
  headerLines.push(schoolMotto);

  // Row 4: Grade and Stream
  headerLines.push(`GRADE: ${grade}  STREAM: ${stream}`);

  // Row 5: Year, Term, Exam Type
  headerLines.push(`YEAR: ${academicYear}  TERM: ${term}  EXAM: ${examType}`);

  // Row 6: Blank separator
  headerLines.push("");

  // Row 7: Column headers (starting the table)
  const columnHeaders = ["Learner Name", "Admission No", "Stream", ...allTierSubjects, "Total"];
  headerLines.push(columnHeaders.join(","));

  // Build data rows
  const rows: string[] = [];

  // Add student data rows
  filteredStudents.forEach(student => {
    const studentId = student.id || student.admissionNumber;
    const studentMarks = studentTotals[studentId] || 0;
    const scores = allTierSubjects.map(subj => {
      const val = studentTotals[student.id] !== undefined ? studentTotals[student.id] : 0;
      return String(val);
    });
    const row = [
      `"${(student.name || "").replace(/"/g, '""')}"`,
      `"${(student.admissionNumber || student.id || "").replace(/"/g, '""')}"`,
      `"${(student.stream || "").replace(/"/g, '""')}"`,
      ...scores,
      studentTotals[studentId] || 0
    ];
    rows.push(row.join(","));
  });

  // Add summary rows
  const subjectTotalRow = ["SUBJECT TOTALS", "", "", ...Object.values(subjectTotals), grandTotalSum].join(",");
  const subjectMSSRow = ["SUBJECT MSS", "", "", ...Object.values(subjectMSS), grandTotalMSS].join(",");

  // Combine all lines
  const allLines = [...headerLines, ...rows, subjectTotalRow, subjectMSSRow].join("\n");

  // Add metadata footer
  const metadataLines = [
    `"Marks Entry & CBC Assessment - ${grade} (${stream})"`,
    `"Academic Year: ${academicYear} | Term: ${term} | Exam: ${examType}"`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total Learners: ${filteredStudents.length}`
  ];

  return allLines + "\n" + metadataLines.join("\n");
};

// Keep the original handleDownloadCSV for backward compatibility but enhanced
const handleDownloadCSV = (filteredStudents: any[], allTierSubjects: string[], studentTotals: Record<string, number>, subjectTotals: Record<string, number>, subjectMSS: Record<string, number>, grade: string, stream: string, academicYear: string, term: string, examType: string) => {
  if (filteredStudents.length === 0) {
    showError("No students found to export.");
    return;
  }
  setIsExporting(true);
  setTimeout(() => {
    const csvContent = exportCSVWithHeader(
      filteredStudents,
      allTierSubjects,
      studentTotals,
      subjectTotals,
      subjectMSS,
      grade,
      stream,
      academicYear,
      term,
      examType
    );

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    // Dynamic filename based on grade, stream, and year
    const safeGrade = grade.replace(/\s+/g, "_");
    const safeStream = stream.replace(/\s+/g, "_");
    const fileName = `Marks_Entry_${safeGrade}_${safeStream}_${academicYear}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    showSuccess("CSV report downloaded successfully with official school letterhead header.");
  }, 600);
};

// Keep the original handleDownloadPDF for print functionality
const handleDownloadPDF = () => {
  window.print();
};

const Assessments = () => {
  // ... rest of the component code

  // In the return section, update the Download CSV button onClick to use the new function
  // The button should pass the necessary parameters

  // Example update in the JSX:
  // <Button
  //   variant="outline"
  //   className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700"
  //   onClick={() => handleDownloadCSV(filteredStudents, allTierSubjects, studentTotals, subjectTotals, subjectMSS, grade, stream, academicYear, term, examType)}
  //   disabled={isExporting}
  // >
  //   {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />} Download CSV
  // </Button>

  // ... rest of the component
};

export default Assessments;