"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { 
  Download, 
  Search, 
  Save, 
  Loader2, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { STUDENTS, GRADES_DATA, Grade } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import html2pdf from 'html2pdf.js';

// Rubric Logic
const getRubric = (score: number) => {
  if (score >= 80) return { code: 'EE', label: 'Exceeding Expectations' };
  if (score >= 65) return { code: 'ME', label: 'Meets Expectations' };
  if (score >= 50) return { code: 'AE', label: 'Approaching Expectations' };
  return { code: 'BE', label: 'Below Expectations' };
};

// Learning Areas Mapping
const SUBJECT_MAP: Record<string, string[]> = {
  'PP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Psychomotor Activities', 'Religious Activities'],
  'Lower': ['Literacy', 'English', 'Kiswahili', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Education'],
  'Upper': ['English', 'Kiswahili', 'Mathematics', 'Science & Tech', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts', 'Religious Education'],
  'Junior': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Pre-Technical Studies', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts & Sports', 'Religious Education']
};

const getCategory = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.includes('PP')) return 'PP';
  const num = parseInt(g.replace(/[^0-9]/g, ''));
  if (num <= 3) return 'Lower';
  if (num <= 6) return 'Upper';
  return 'Junior';
};

const GRADE_ORDER = [
  'playgroup',
  'pp1',
  'pp2',
  'grade 1',
  'grade 2',
  'grade 3',
  'grade 4',
  'grade 5',
  'grade 6',
  'grade 7',
  'grade 8',
  'grade 9',
  'grade 10',
  'grade 11',
  'grade 12'
];

const getGradeSortIndex = (gradeName: string): number => {
  const normalized = gradeName.toLowerCase().trim();
  const match = GRADE_ORDER.findIndex(g => normalized.includes(g));
  return index !== -1 ? index : 999;
};

const ReportCards = () => {
  // Filters State
  const [year, setYear] = useState("2026");
  const [grade, setGrade] = useState("4");
  const [stream, setStream] = useState("all");
  const [term, setTerm] = useState("term1");
  const [type, setType] = useState("endterm");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isExportingCurrent, setIsExportingCurrent] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [sortedGrades] = useMemo(() => {
    return [...storedGrades].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return getGradeSortIndex(nameA) - getGradeSortIndex(nameB);
    });
  }, [storedGrades]);

  // Dynamic Streams
  const availableStreams = useMemo(() => {
    if (!storedGrades || storedGrades.length === 0) return [];
    if (grade === 'all') {
      const names = new Set<string>();
      storedGrades.forEach(g => g.streams?.forEach(s => streamNames.add(s.name)));
      return Array.from(streamNames).sort().map(name => ({ name }));
    }
    
    const gradeObj = storedGrades.find(g => 
      g.name === `Grade ${grade}` || 
      g.name === grade || 
      g.name.replace(/[^0-9]/g, '') === grade
    );
    return gradeObj?.streams?.map(s => ({ name: s.name })) || [];
  }, [storedGrades, grade]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade;
      const matchesStream = stream === "all" || s.stream.toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  // Export Handlers
  const handleDownloadCurrent = async () => {
    if (!searchTerm.trim()) {
      showError("Please type a learner's name or ULI/Assessment No in the search box to download an individual report card.");
      return;
    }
    if (filteredStudents.length === 0) {
      showError(`No learner found matching "${searchTerm}".`);
      return;
    }

    setIsExportingCurrent(true);
    try {
      const element = wrapperRef.current;
      const targetLearner = filteredStudents[0];
      const safeLearnerName = targetLearner.name.toLowerCase().replace(/\s+/g, '_');

      if (element) {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: `report_card_${safeLearnerName}_${year}_${term}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css'] }
        };

        await html2pdf().set(opt).from(element).save();
        showSuccess(`Generated individual 1-page portrait report card for ${targetLearner.name}!`);
      } else {
        const content = [
          "MUNYAKA PRIMARY AND JUNIOR SCHOOL - INDIVIDUAL LEARNER REPORT",
          `Learner: ${targetLearner.name} | ULI: ${targetLearner.assessment}`,
          `Grade: Grade ${targetLearner.grade} — ${targetLearner.stream} Stream`,
          `Academic Year: ${year} | Term: ${term.toUpperCase()}`,
          `Generated: ${new Date().toLocaleString()}`,
          "--------------------------------------------------",
          `Guardian: ${targetLearner.guardian} | Contact: ${targetLearner.phone}`
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute("href", url);
        link.setAttribute("download", `report_card_${safeLearnerName}_${year}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess(`Exported individual report card for ${targetLearner.name}`);
      } finally {
        setIsExportingCurrent(false);
      }
    }, 800);

    const handleDownloadAll = async () => {
      setIsDownloadingAll(true);
      try {
        await new Promise(r => setTimeout(r, 600));
        const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
        const row2 = "P.O. BOX 5239-30100, ELDORET";
        const row3 = "MOTTO: KNOWLEDGE POWER";
        const row4 = `GRADE ${grade}, STREAM ${stream}, YEAR ${year}, TERM ${term.toUpperCase()}`;
        const row5 = `CLASS MEAN SCORE: ${classMeanScore}%, TOTAL LEARNERS: ${filteredStudents.length}`;
        const headers = ["Name", "Assessment No", "Grade", "Stream", "Guardian", "Phone Contact", "Email"];
        const rows = filteredStudents.map(s => [
          `"${s.name.replace(/"/g, '""')}"`,
          `"${s.assessment.replace(/"/g, '""')}"`,
          `"Grade ${s.grade}"`,
          `"${s.stream.replace(/"/g, '""')}"`,
          `"${s.guardian.replace(/"/g, '""')}"`,
          `"${s.phone.replace(/"/g, '""')}"`,
          `"${s.email.replace(/"/g, '""')}"`
        ]);
        const csvContent = [
          row1,
          row2,
          row3,
          row4,
          row5,
          "",
          headers.join(","),
          ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `all_school_records_master_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess(`Exported ${filteredStudents.length} learners to CSV`);
      } catch (err) {
        console.error("Export error:", err);
        showError("Failed to generate bulk report.");
      } finally {
        setIsDownloadingAll(false);
      }
    };

  // Export Handlers
  const handleDownloadCurrent = async () => {
    if (!searchTerm.trim()) {
      showError("Please type a learner's name or ULI/Assessment No in the search box to download an individual report card.");
      return;
    }
    if (filteredStudents.length === 0) {
      showError(`No learner found matching "${searchTerm}".`);
      return;
    }

    setIsExportingCurrent(true);
    await handleDownloadCurrent();
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await handleDownloadAll();
    } catch (err) {
      console.error("Bulk export error:", err);
      showError("Failed to generate bulk report.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Derived Values
  const sortedGrades = useMemo(() => {
    return [...storedGrades].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return getGradeSortIndex(nameA) - getGradeSortIndex(nameB);
    });
  }, [storedGrades]);

  const selectedStreams = useMemo(() => {
    if (grade === 'all') {
      const names = new Set<string>();
      storedGrades.forEach(g => g.streams?.forEach(s => streamNames.add(s.name)));
      return Array.from(streamNames).sort().map(name => ({ name }));
    }
    const gradeObj = storedGrades.find(g => 
      g.name === `Grade ${grade}` || 
      g.name === grade || 
      g.name.replace(/[^0-9]/g, '') === grade
    );
    return gradeObj?.streams?.map(s => ({ name: s.name })) || [];
  }, [storedGrades, grade]);

  const classMeanScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const total = filteredStudents.reduce((sum, s) => sum + s.meanScore, 0);
    return Math.round((total / filteredStudents.length) * 10) / 10;
  }, [filteredStudents]);

  // Student Details for Export
  const selectedStudent = useMemo(() => filteredStudents[0], [filteredStudents]);

  // Print Styles (hidden on screen, visible when printing)
  return (
    <div className="reports-print-wrapper">
      {/* Print Styles */}
      <style>{`
        .report-card {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          padding: 1rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 297mm; /* A4 height */
          min-width: 210mm;
          box-sizing: border-box;
        }

        .no-print {
          display: none;
        }

        @media print {
          .report-card {
            width: 100% !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 1rem !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          .report-card {
            width: 100% !important;
            height: 100% !important;
            padding: 1rem !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Main Container - ensures full A4 height */}
      <div className="report-page">
        <Card className="report-card">
          {/* Header Section */}
          <div className="metadata-header">
            <div className="flex items-center gap-3">
              <BackButton fallback="/" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                MUNYAKA PRIMARY AND JUNIOR SCHOOL
              </h1>
            </div>
            <p className="text-sm text-slate-600">
              P.O. BOX 5239-30100, ELDORET
            </p>
            <p className="text-[9.5px] text-slate-500 font-medium mb-[12px]">
              MOTTO: Knowledge is Power
            </p>
            <h3 className="font.black text-[10.5px] uppercase tracking-wider text-slate-800 bg-slate-100 px-4 py-1.5 rounded border border-slate-200">
              COMPETENCY BASED CURRICULUM PROGRESS REPORT — {term.toUpperCase()} · ACADEMIC YEAR {year}
            </h3>
          </div>

          {/* Metadata Header */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-5">
            <div className="flex items-center justify-between">
              <span className="font.black uppercase text-slate-500 text-[9px]">Name</span>
              <span className="font.bold text-slate-900 text-[11px]">{s.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font.black uppercase text-slate-500 text-[9px]">ULI / Assessment No</span>
              <span className="font.black text-slate-900 text-[11px]">{s.assessment}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font.black uppercase text-slate-500 text-[9px]">Grade / Stream</span>
              <span className="font.bold text-slate-900 text-[11px]">{s.grade} — {s.stream}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font.black uppercase text-slate-500 text-[9px]">Overall Rank</span>
              <span className="font.black text-indigo-600 text-[11px]">#{idx + 1} of {filteredStudents.length}</span>
            </div>
          </div>

          {/* 3. Grading Table */}
          <div className="overflow-hidden border border-slate-300 rounded-sm mt-4">
            <table className="w-full text-left text-[8.5px]">
              <thead className="bg-slate-100 border-b">
                <tr className="text-slate-400 uppercase tracking-wider">
                  <th className="px-2.5 py-1.5">Subject / Learning Area</th>
                  <th className="px-1.5 py-1.5 text-center border-r border-slate-300">Mid</th>
                  <th className="px-1.5 py-1.5 text-center border-r border-slate-300 w-[12%]">End</th>
                  <th className="px-1.5 py-1.5 text-center border-r border-slate-300 w-[12%] bg-indigo-50/50">Avg</th>
                  <th className="px-2.5 py-1.5 text-center w-[19%]">Rubric</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((sub, i) => {
                  const mid = 70 + (i % 25);
                  const end = 72 + (i % 20);
                  const avg = Math.round((mid + end) / 2);
                  const r = getRubric(avg);
                  return (
                    <tr className="text-[9px] hover:bg-slate-50/50 transition-colors">
                      <td className="px-2.5 py-1.5 border-r">{sub}</td>
                      <td className="px-1.5 py-1.5 text-center border-r">{mid}</td>
                      <td className="px-1.5 py-1.5 text-center border-r border-slate-300">{end}</td>
                      <td className="px-1.5 py-1.5 text-center bg-indigo-50/20 font-black">{avg}%</td>
                      <td className="px-2.5 py-1.5 text-center">
                        <Badge variant="outline" className={cn(
                          "rounded border-none text-[8px]",
                          r.code === 'EE' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          r.code === 'ME' && "bg-blue-50 text-blue-700 border-blue-200",
                          r.code === 'AE' && "bg-amber-50 text-amber-700 border-amber-200",
                          r.code === 'BE' && "bg-rose-50 text-rose-700 border-rose-200"
                        )}>{r.code} — {r.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Remarks & Footer Section - Pushed to bottom */}
        <div className="remarks-section mt-[16px] p-4 bg-slate-50/50 rounded-lg border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">Class Teacher's Remarks</p>
              <p className="text-sm text-slate-600 leading-relaxed">{s.description || "No remarks provided."}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Date:</span>
              <span className="text-sm text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Teacher:</span>
              <span className="text-slate-600">{s.teacher ?? "Unassigned"}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportCards;