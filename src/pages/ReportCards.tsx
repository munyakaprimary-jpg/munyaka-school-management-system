"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { 
  Printer, 
  School, 
  Download, 
  Save, 
  RotateCcw, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  Layers,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import html2pdf from 'html2pdf.js';

// Rubric Definition
export type CBCRubric = 'EE' | 'ME' | 'AE' | 'BE';

export interface RubricConfig {
  code: CBCRubric;
  label: string;
  badgeStyle: string;
}

export const getRubricFromScore = (score: number): RubricConfig => {
  if (score >= 80) {
    return { code: 'EE', label: 'EE (80-100%)', badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black' };
  } else if (score >= 65) {
    return { code: 'ME', label: 'ME (65-79%)', badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300 font-black' };
  } else if (score >= 50) {
    return { code: 'AE', label: 'AE (50-64%)', badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 font-black' };
  } else {
    return { code: 'BE', label: 'BE (<50%)', badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300 font-black' };
  }
};

// Learning Areas mapped strictly to Grade Levels
export const SUBJECT_MAP: Record<string, string[]> = {
  'Pre-Primary': [
    'Language Activities',
    'Mathematical Activities',
    'Environmental Activities',
    'Psychomotor Activities',
    'Religious Activities'
  ],
  'Lower Primary': [
    'Literacy',
    'English',
    'Kiswahili',
    'Mathematical Activities',
    'Environmental Activities',
    'Creative Activities',
    'Religious Education'
  ],
  'Upper Primary': [
    'English',
    'Kiswahili',
    'Mathematics',
    'Science & Tech',
    'Social Studies',
    'Agriculture & Nutrition',
    'Creative Arts',
    'Religious Education'
  ],
  'Junior School': [
    'English',
    'Kiswahili',
    'Mathematics',
    'Integrated Science',
    'Pre-Technical Studies',
    'Social Studies',
    'Agriculture & Nutrition',
    'Creative Arts & Sports',
    'Religious Education'
  ]
};

export const getCohortCategory = (gradeStr: string): string => {
  const norm = gradeStr.trim().toUpperCase();
  if (norm.includes('PP1') || norm.includes('PP2') || norm.includes('PRE')) {
    return 'Pre-Primary';
  }
  const match = norm.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 3) return 'Lower Primary';
    if (num >= 4 && num <= 6) return 'Upper Primary';
    if (num >= 7 && num <= 9) return 'Junior School';
  }
  return 'Upper Primary'; // default fallback
};

export interface SubjectScoreRow {
  subject: string;
  midTerm: number;
  endTerm: number;
}

export interface LearnerReportData {
  id: string;
  studentName: string;
  assessmentNo: string;
  grade: string;
  stream: string;
  term: string;
  academicYear: string;
  scores: SubjectScoreRow[];
  teacherRemarks: string;
  hoiRemarks: string;
  closingDate: string;
  openingDate: string;
}

const ReportCards = () => {
  // Step 1: Filters
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>("all");
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [term, setTerm] = useState<string>("term1");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Dates
  const [closingDate, setClosingDate] = useState<string>("2026-04-10");
  const [openingDate, setOpeningDate] = useState<string>("2026-05-04");

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtered Learners
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesGrade = true;
      if (selectedGradeFilter !== "all") {
        const normFilter = selectedGradeFilter.replace(/[^0-9]/g, '');
        matchesGrade = s.grade === normFilter || s.grade === selectedGradeFilter || `Grade ${s.grade}` === selectedGradeFilter;
      }

      let matchesStream = true;
      if (selectedStreamFilter !== "all") {
        matchesStream = s.stream.toLowerCase() === selectedStreamFilter.toLowerCase();
      }

      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, selectedGradeFilter, selectedStreamFilter]);

  // Generate Score Records for each learner
  const [reportsData, setReportsData] = useState<Record<string, LearnerReportData>>({});

  // Initialize or Sync Report Data
  React.useEffect(() => {
    const updated: Record<string, LearnerReportData> = { ...reportsData };

    filteredStudents.forEach(student => {
      if (!updated[student.id]) {
        const category = getCohortCategory(student.grade);
        const subjects = SUBJECT_MAP[category] || SUBJECT_MAP['Upper Primary'];
        
        const initialScores: SubjectScoreRow[] = subjects.map((sub, idx) => {
          const mid = 62 + ((idx * 8 + parseInt(student.id)) % 32);
          const end = 65 + ((idx * 9 + parseInt(student.id)) % 30);
          return { subject: sub, midTerm: mid, endTerm: end };
        });

        updated[student.id] = {
          id: student.id,
          studentName: student.name,
          assessmentNo: `KNEC/CBC/${student.assessment}`,
          grade: `Grade ${student.grade}`,
          stream: student.stream,
          term,
          academicYear,
          scores: initialScores,
          teacherRemarks: "A disciplined and focused learner. Demonstrates active participation and consistent academic performance in all learning areas.",
          hoiRemarks: "Commendable progress shown throughout the term. Keep up the high level of dedication and excellence.",
          closingDate,
          openingDate
        };
      } else {
        // Ensure subject list matches current grade level category if grade changes
        const category = getCohortCategory(student.grade);
        const subjects = SUBJECT_MAP[category] || SUBJECT_MAP['Upper Primary'];
        const existingSubjects = updated[student.id].scores.map(s => s.subject);
        const needsResync = subjects.some(s => !existingSubjects.includes(s)) || subjects.length !== existingSubjects.length;

        if (needsResync) {
          updated[student.id].scores = subjects.map((sub, idx) => {
            const mid = 62 + ((idx * 8 + parseInt(student.id)) % 32);
            const end = 65 + ((idx * 9 + parseInt(student.id)) % 30);
            return { subject: sub, midTerm: mid, endTerm: end };
          });
        }
      }
    });

    setReportsData(updated);
  }, [filteredStudents, term, academicYear]);

  // Field change handlers
  const handleScoreChange = (studentId: string, subjectIdx: number, field: 'midTerm' | 'endTerm', val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;

    setReportsData(prev => {
      const studentReport = prev[studentId];
      if (!studentReport) return prev;

      const updatedScores = [...studentReport.scores];
      updatedScores[subjectIdx] = {
        ...updatedScores[subjectIdx],
        [field]: num
      };

      return {
        ...prev,
        [studentId]: {
          ...studentReport,
          scores: updatedScores
        }
      };
    });
  };

  const handleRemarkChange = (studentId: string, field: 'teacherRemarks' | 'hoiRemarks', text: string) => {
    setReportsData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: text
      }
    }));
  };

  const handleSaveRemarks = (studentId: string, type: 'Teacher' | 'HOI') => {
    showSuccess(`${type}'s remarks saved successfully for ${reportsData[studentId]?.studentName || 'Learner'}!`);
  };

  // Programmatic PDF Export Engine (single card or all cards)
  const downloadPDF = (mode: 'current' | 'all') => {
    setIsExporting(true);

    setTimeout(() => {
      const targetElement = wrapperRef.current;
      if (!targetElement) {
        showError("Unable to locate report card print wrapper.");
        setIsExporting(false);
        return;
      }

      // Add temporary class to filter elements during capture
      targetElement.classList.add('exporting-pdf');

      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4], // 0.4cm margins as specified
        filename: mode === 'all' 
          ? `munyaka_cbc_reports_${selectedGradeFilter}_${term}_${academicYear}.pdf`
          : `cbc_report_card_${reportsData[filteredStudents[0]?.id]?.studentName.toLowerCase().replace(/\s+/g, '_') || 'learner'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      html2pdf()
        .set(opt)
        .from(targetElement)
        .save()
        .then(() => {
          targetElement.classList.remove('exporting-pdf');
          setIsExporting(false);
          showSuccess(`PDF exported successfully in A4 Landscape format!`);
        })
        .catch((err: any) => {
          targetElement.classList.remove('exporting-pdf');
          setIsExporting(false);
          showError("PDF Export failed. Triggering browser print fallback.");
          window.print();
        });
    }, 500);
  };

  const handlePrintWindow = () => {
    window.print();
  };

  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(s.name)));
    return Array.from(streams).sort();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Dynamic CSS for Print & PDF Export Filtration */}
      <style>{`
        @media print {
          .no-print, .btn-save-remark, .top-bottom-controls, header, sidebar, aside, nav {
            display: none !important;
          }
          body, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .reports-print-wrapper {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            grid-template-columns: 1fr !important;
          }
          .card-report-page {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
            margin-bottom: 0 !important;
            padding: 1.5cm !important;
          }
        }

        .exporting-pdf .no-print,
        .exporting-pdf .btn-save-remark,
        .exporting-pdf .top-bottom-controls {
          display: none !important;
        }
      `}</style>

      {/* Screen Page Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">CBC Learner Report Cards</h1>
            <p className="text-muted-foreground font-medium">Generate print-ready A4 landscape 4-Band CBC progress reports with custom grade subject rows.</p>
          </div>
        </div>

        {/* TOP BUTTON SET */}
        <div className="flex flex-wrap items-center gap-2 top-bottom-controls">
          <Button 
            variant="outline"
            onClick={() => downloadPDF('current')}
            disabled={isExporting || filteredStudents.length === 0}
            className="rounded-2xl h-11 px-4 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 font-bold gap-2 text-xs shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Current
          </Button>

          <Button 
            variant="outline"
            onClick={() => downloadPDF('all')}
            disabled={isExporting || filteredStudents.length === 0}
            className="rounded-2xl h-11 px-4 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold gap-2 text-xs shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} className="text-emerald-600" />}
            Download All ({filteredStudents.length})
          </Button>

          <Button 
            onClick={handlePrintWindow}
            className="rounded-2xl h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-100 gap-2"
          >
            <Printer size={16} /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Step 1: Filter Bar Controls (Hidden on Print) */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Step 1: Grade Level Filter</Label>
            <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="All Grade Levels" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Grade Levels</SelectItem>
                <SelectItem value="PP1">Pre-Primary 1 (PP1)</SelectItem>
                <SelectItem value="PP2">Pre-Primary 2 (PP2)</SelectItem>
                <SelectItem value="1">Grade 1 (Lower Primary)</SelectItem>
                <SelectItem value="2">Grade 2 (Lower Primary)</SelectItem>
                <SelectItem value="3">Grade 3 (Lower Primary)</SelectItem>
                <SelectItem value="4">Grade 4 (Upper Primary)</SelectItem>
                <SelectItem value="5">Grade 5 (Upper Primary)</SelectItem>
                <SelectItem value="6">Grade 6 (Upper Primary)</SelectItem>
                <SelectItem value="7">Grade 7 (Junior School)</SelectItem>
                <SelectItem value="8">Grade 8 (Junior School)</SelectItem>
                <SelectItem value="9">Grade 9 (Junior School)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Stream Filter</Label>
            <Select value={selectedStreamFilter} onValueChange={setSelectedStreamFilter}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Streams</SelectItem>
                {uniqueStreams.map(s => <SelectItem key={s} value={s}>{s} Stream</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* REPORTS PRINT WRAPPER CONTAINER (TARGET FOR HTML2PDF)                     */}
      {/* ========================================================================= */}
      <div ref={wrapperRef} className="reports-print-wrapper space-y-12">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const report = reportsData[student.id];
            if (!report) return null;

            const category = getCohortCategory(student.grade);
            const totalScoreSum = report.scores.reduce((sum, item) => sum + Math.round((item.midTerm + item.endTerm) / 2), 0);
            const overallAverage = report.scores.length > 0 ? Math.round(totalScoreSum / report.scores.length) : 0;
            const overallRubric = getRubricFromScore(overallAverage);

            return (
              <Card 
                key={student.id} 
                className="card-report-page border border-slate-200 shadow-xl rounded-[2.5rem] bg-white p-8 md:p-12 transition-all duration-300 relative overflow-hidden"
              >
                <CardContent className="space-y-8 p-0">
                  
                  {/* 1. CLEAN HEADER */}
                  <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 relative">
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md">
                        <School size={28} />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                          MUNYAKA PRIMARY AND JUNIOR SCHOOL
                        </h1>
                        <p className="text-xs md:text-sm font-bold text-slate-700">
                          P.O. BOX 5239-30100, ELDORET • TEL: +254 712 345 678
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-black uppercase tracking-widest text-indigo-800">
                      MOTTO: "KNOWLEDGE IS POWER"
                    </p>

                    <div className="pt-2">
                      <Badge className="bg-slate-900 text-white border-none rounded-lg px-4 py-1 font-black text-xs md:text-sm uppercase tracking-widest">
                        END OF TERM CBC LEARNER PROGRESS REPORT
                      </Badge>
                    </div>
                  </div>

                  {/* 2. LEARNER META SECTION */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs md:text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learner Name</p>
                      <p className="font-black text-slate-900 text-base">{report.studentName}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assessment / Admin No.</p>
                      <p className="font-black text-slate-900 uppercase font-mono">{report.assessmentNo}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grade & Stream</p>
                      <p className="font-bold text-slate-900">{report.grade} ({report.stream} Stream)</p>
                      <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Academic Context</p>
                      <p className="font-bold text-slate-900">{report.term === 'term1' ? 'Term 1' : report.term === 'term2' ? 'Term 2' : 'Term 3'} • {report.academicYear}</p>
                    </div>
                  </div>

                  {/* 3. DYNAMIC ACADEMIC GRADING TABLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Layers size={14} className="text-indigo-600" />
                        Academic Performance ({category} Learning Areas)
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 no-print">
                        Editable scoresheet
                      </span>
                    </div>

                    <div className="border border-slate-300 rounded-2xl overflow-hidden">
                      <table className="w-full text-xs md:text-sm text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-300 text-slate-800">
                          <tr>
                            <th className="px-4 py-3 font-black uppercase tracking-wider border-r border-slate-300">Subject / Learning Area</th>
                            <th className="px-3 py-3 font-black uppercase tracking-wider text-center border-r border-slate-300 w-28">Mid Term (%)</th>
                            <th className="px-3 py-3 font-black uppercase tracking-wider text-center border-r border-slate-300 w-28">End Term (%)</th>
                            <th className="px-3 py-3 font-black uppercase tracking-wider text-center border-r border-slate-300 w-28 bg-indigo-50/50">Average (%)</th>
                            <th className="px-4 py-3 font-black uppercase tracking-wider text-center w-36">Rubric</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {report.scores.map((row, idx) => {
                            const avg = Math.round((row.midTerm + row.endTerm) / 2);
                            const rubric = getRubricFromScore(avg);

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-200">
                                  {row.subject}
                                </td>
                                
                                <td className="px-2 py-2 text-center border-r border-slate-200">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.midTerm}
                                    onChange={(e) => handleScoreChange(student.id, idx, 'midTerm', e.target.value)}
                                    className="w-16 text-center font-black bg-slate-50 border border-slate-200 rounded-md py-1 focus:bg-white focus:ring-1 ring-indigo-300 no-print"
                                  />
                                  <span className="hidden print:inline font-bold">{row.midTerm}</span>
                                </td>

                                <td className="px-2 py-2 text-center border-r border-slate-200">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.endTerm}
                                    onChange={(e) => handleScoreChange(student.id, idx, 'endTerm', e.target.value)}
                                    className="w-16 text-center font-black bg-slate-50 border border-slate-200 rounded-md py-1 focus:bg-white focus:ring-1 ring-indigo-300 no-print"
                                  />
                                  <span className="hidden print:inline font-bold">{row.endTerm}</span>
                                </td>

                                <td className="px-3 py-3 text-center font-black text-indigo-900 bg-indigo-50/30 border-r border-slate-200 text-sm">
                                  {avg}%
                                </td>

                                <td className="px-4 py-3 text-center">
                                  <Badge className={cn("px-3 py-1 rounded-lg border text-xs", rubric.badgeStyle)}>
                                    {rubric.code}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900">
                          <tr>
                            <td className="px-4 py-3.5 text-right uppercase tracking-wider border-r border-slate-300" colSpan={3}>
                              Overall Cohort Mean Score:
                            </td>
                            <td className="px-3 py-3.5 text-center text-base font-black text-indigo-900 bg-indigo-100/50 border-r border-slate-300">
                              {overallAverage}%
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge className={cn("px-3 py-1 text-xs font-black border uppercase", overallRubric.badgeStyle)}>
                                {overallRubric.code} Rating
                              </Badge>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 4. COMPACT ADMINISTRATIVE BLOCK & FOOTER */}
                  <div className="space-y-6 pt-2">
                    
                    {/* Remarks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Class Teacher's Remarks */}
                      <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Class Teacher's Remarks
                          </Label>
                          {/* Dark-styled Save Button with Lime-Green Text */}
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={() => handleSaveRemarks(student.id, 'Teacher')}
                            className="btn-save-remark rounded-lg h-7 px-3 bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-[11px] border border-slate-800 gap-1.5 shadow-sm"
                          >
                            <Save size={12} /> Save
                          </Button>
                        </div>

                        <Textarea 
                          value={report.teacherRemarks}
                          onChange={(e) => handleRemarkChange(student.id, 'teacherRemarks', e.target.value)}
                          className="bg-transparent border-none p-0 focus-visible:ring-0 text-xs italic text-slate-800 leading-relaxed min-h-[60px] resize-none"
                        />

                        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Signature: .......................................</span>
                          <span className="text-[10px] text-slate-400 font-normal">Date: ..................</span>
                        </div>
                      </div>

                      {/* Head of Institution (HOI) Remarks */}
                      <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Head of Institution (HOI) Remarks
                          </Label>
                          {/* Dark-styled Save Button with Lime-Green Text */}
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={() => handleSaveRemarks(student.id, 'HOI')}
                            className="btn-save-remark rounded-lg h-7 px-3 bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-[11px] border border-slate-800 gap-1.5 shadow-sm"
                          >
                            <Save size={12} /> Save
                          </Button>
                        </div>

                        <Textarea 
                          value={report.hoiRemarks}
                          onChange={(e) => handleRemarkChange(student.id, 'hoiRemarks', e.target.value)}
                          className="bg-transparent border-none p-0 focus-visible:ring-0 text-xs italic text-slate-800 leading-relaxed min-h-[60px] resize-none"
                        />

                        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Signature & Stamp: .......................................</span>
                          <span className="text-[10px] text-slate-400 font-normal">Date: ..................</span>
                        </div>
                      </div>

                    </div>

                    {/* Horizontal Term Dates & Powered By Label */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-100/60 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-800">
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Closing Date:</span>
                          <input 
                            type="date"
                            value={closingDate}
                            onChange={(e) => setClosingDate(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Opening Date:</span>
                          <input 
                            type="date"
                            value={openingDate}
                            onChange={(e) => setOpeningDate(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black italic tracking-wide text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                          System Powered by Jamlyan Analytics
                        </span>
                      </div>

                    </div>

                  </div>

                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Search size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No report cards match selected filters</h3>
            <p className="text-slate-400 text-xs mt-1">Try selecting "All Grade Levels" or clearing search query.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DUPLICATE ACTION BUTTON SET OUTSIDE & BELOW THE PRINT WRAPPER             */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 no-print top-bottom-controls">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Ready to export {filteredStudents.length} report card(s) in A4 Landscape</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => downloadPDF('current')}
            disabled={isExporting || filteredStudents.length === 0}
            className="rounded-2xl h-11 px-5 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 font-bold gap-2 text-xs shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Current
          </Button>

          <Button 
            variant="outline"
            onClick={() => downloadPDF('all')}
            disabled={isExporting || filteredStudents.length === 0}
            className="rounded-2xl h-11 px-5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold gap-2 text-xs shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} className="text-emerald-600" />}
            Download All ({filteredStudents.length})
          </Button>

          <Button 
            onClick={handlePrintWindow}
            className="rounded-2xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-100 gap-2"
          >
            <Printer size={16} /> Print / Save PDF
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ReportCards;