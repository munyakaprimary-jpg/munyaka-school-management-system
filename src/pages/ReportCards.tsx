"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
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

// Define the order we want grades to appear
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

// Helper function to get the sort index for a grade name
const getGradeSortIndex = (gradeName: string): number => {
  const normalized = gradeName.toLowerCase().trim();
  const index = GRADE_ORDER.findIndex(g => normalized.includes(g));
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dynamic Stored Grades State
  const [storedGrades, setStoredGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Re-read localStorage whenever the page gains focus or storage changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      const saved = localStorage.getItem('munyaka_grades');
      if (saved) {
        try {
          setStoredGrades(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse grades from storage", e);
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, []);

  // Sort grades logically
  const sortedGrades = useMemo(() => {
    return [...storedGrades].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return getGradeSortIndex(nameA) - getGradeSortIndex(nameB);
    });
  }, [storedGrades]);

  // Compute available streams dynamically from storedGrades according to selected grade
  const availableStreams = useMemo(() => {
    if (!storedGrades || storedGrades.length === 0) return [];

    if (grade === 'all') {
      const streamNames = new Set<string>();
      storedGrades.forEach(g => {
        g.streams?.forEach(s => streamNames.add(s.name));
      });
      return Array.from(streamNames).sort().map(name => ({ name }));
    }

    const gradeObj = storedGrades.find(g => 
      g.name === `Grade ${grade}` || 
      g.name === grade || 
      g.name.replace(/[^0-9]/g, '') === grade
    );

    return gradeObj && Array.isArray(gradeObj.streams) 
      ? gradeObj.streams.map(s => ({ name: s.name }))
      : [];
  }, [storedGrades, grade]);

  // Reset stream selection to "all" when grade changes
  useEffect(() => {
    setStream("all");
  }, [grade]);

  // Derived Filtered Students based on current Academic Year & Grade/Stream/Search filters
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade;
      const matchesStream = stream === "all" || s.stream.toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  // Handler: "Download Current"
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
          `MUNYAKA PRIMARY AND JUNIOR SCHOOL - INDIVIDUAL LEARNER REPORT`,
          `Learner: ${targetLearner.name} | ULI: ${targetLearner.assessment}`,
          `Grade: Grade ${targetLearner.grade} — ${targetLearner.stream} Stream`,
          `Academic Year: ${year} | Term: ${term.toUpperCase()}`,
          `Generated: ${new Date().toLocaleString()}`,
          `--------------------------------------------------`,
          `Guardian: ${targetLearner.guardian} | Contact: ${targetLearner.phone}`
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_card_${safeLearnerName}_${year}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess(`Exported individual report card for ${targetLearner.name}`);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      showError("Failed to generate individual learner report card.");
    } finally {
      setIsExportingCurrent(false);
    }
  };

  // Handler: "Download All"
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);

    try {
      await new Promise(r => setTimeout(r, 600));

      const headers = ["Student Name", "Assessment No (ULI)", "Grade Level", "Stream", "Guardian", "Phone Contact", "Email"];
      
      const rows = STUDENTS.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.assessment.replace(/"/g, '""')}"`,
        `"Grade ${s.grade}"`,
        `"${s.stream.replace(/"/g, '""')}"`,
        `"${s.guardian.replace(/"/g, '""')}"`,
        `"${s.phone.replace(/"/g, '""')}"`,
        `"${s.email.replace(/"/g, '""')}"`
      ]);

      const csvContent = [
        "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
        "ALL ACADEMIC RECORDS & BULK REPORT DATASET",
        `Generated: ${new Date().toLocaleString()}`,
        `Total Records Included: ${STUDENTS.length}`,
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

      showSuccess(`Bulk export completed! Downloaded all ${STUDENTS.length} student records across all grades.`);
    } catch (err) {
      console.error("Error during bulk export:", err);
      showError("Failed to generate bulk report.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
          }
          .no-print { display: none !important; }
        }

        .report-card {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          box-sizing: border-box !important;
        }

        .remarks-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <h1 className="text-2xl font-black text-slate-900">CBC Report Generator</h1>
        </div>
        <div className="flex gap-2">
          {/* Button 1: Download Current */}
          <Button 
            onClick={handleDownloadCurrent}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
            disabled={isExportingCurrent}
          >
            {isExportingCurrent ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Current
          </Button>

          {/* Button 2: Download All */}
          <Button 
            onClick={handleDownloadAll}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
            disabled={isDownloadingAll}
          >
            {isDownloadingAll ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            Download All
          </Button>
        </div>
      </div>

      {/* Filters & Info Section */}
      <div className="flex flex-col lg:flex-row gap-8 items-start no-print">
        {/* Left Side: Filters Stack */}
        <div className="w-full lg:w-72 space-y-6">
          <div className="space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Academic Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="2026">2026</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {sortedGrades.map(g => (
                    <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stream</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {availableStreams.length > 0 ? (
                    availableStreams.map(s => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="none">
                      No streams found in Grades & Streams
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Active Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Exam Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="opener">Opener</SelectItem><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="endterm">Endterm</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="pt-2 space-y-1">
              <Label className="text-[10px] font-black uppercase text-indigo-600 ml-1">Search Individual Learner</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Type Learner Name / ULI..." 
                  className="pl-9 h-10 rounded-xl bg-slate-50 border-indigo-200 text-xs font-bold focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Page Info */}
        <div className="flex-1 space-y-2">
          <p className="text-slate-500 text-sm font-medium">
            {searchTerm.trim() 
              ? `Filtered individual search: Previewing ${filteredStudents.length} report card(s) for "${searchTerm}". Click "Download Current" to download.` 
              : `Previewing ${filteredStudents.length} report cards for Grade ${grade} (${year}). Type a learner's name in the search box to download an individual report.`}
          </p>
        </div>
      </div>

      {/* A4 Single-Page Report Cards Container */}
      <div 
        ref={wrapperRef} 
        className="reports-print-wrapper flex flex-col items-center gap-6 w-full max-w-[190mm] mx-auto"
      >
        {filteredStudents.map((s, idx) => {
          const cat = getCategory(s.grade);
          const subjects = SUBJECT_MAP[cat];

          return (
            <Card 
              key={s.id} 
              className="report-card bg-white w-full max-w-[190mm] shadow-sm rounded-sm p-6 border border-slate-200 space-y-5 box-border"
            >
              {/* 1. Header Letterhead */}
              <div className="text-center space-y-0.5 border-b border-slate-200 pb-3 pt-1">
                <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                  MUNYAKA PRIMARY AND JUNIOR SCHOOL
                </h2>
                <p className="font-bold text-[10px] text-slate-600 leading-none">P.O.BOX 5239-30100, ELDORET</p>
                <p className="italic text-[9.5px] text-slate-500 font-medium leading-none">MOTTO: Knowledge is Power</p>
                <div className="bg-slate-100 py-0.5 px-2.5 inline-block rounded mt-1.5">
                  <p className="font-black text-[8.5px] uppercase tracking-tighter text-indigo-900 leading-none">
                    Competency-Based Curriculum Progress Report — {term.toUpperCase()} · Academic Year {year}
                  </p>
                </div>
              </div>

              {/* 2. Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 p-2.5 rounded-md border border-slate-100 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-slate-400 text-[8.5px]">Name</span>
                  <span className="font-bold text-slate-900 truncate max-w-[130px]">{s.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-slate-400 text-[8.5px]">ULI</span>
                  <span className="font-black font-mono text-slate-900">{s.assessment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-slate-400 text-[8.5px]">Grade / Stream</span>
                  <span className="font-bold text-slate-900">Grade {s.grade} — {s.stream}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-slate-400 text-[8.5px]">Overall Rank</span>
                  <span className="font-black text-indigo-600">#{idx + 1} of {filteredStudents.length}</span>
                </div>
              </div>

              {/* 3. Grading Table */}
              <div className="overflow-hidden border border-slate-300 rounded">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr className="text-[8.5px] font-black uppercase">
                      <th className="px-2.5 py-1.5 border-r border-slate-300 text-left min-w-[45%]">Subject / Learning Area</th>
                      <th className="px-1.5 py-1.5 text-center border-r border-slate-300 w-[12%]">Mid</th>
                      <th className="px-1.5 py-1.5 text-center border-r border-slate-300 w-[12%]">End</th>
                      <th className="px-1.5 py-1.5 text-center border-r border-slate-300 w-[12%] bg-indigo-50/50">Avg</th>
                      <th className="px-2.5 py-1.5 text-center w-[19%]">Rubric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subjects.map((sub, i) => {
                      const mid = 70 + (i % 25);
                      const end = 72 + (i % 20);
                      const avg = Math.round((mid + end) / 2);
                      const r = getRubric(avg);
                      return (
                        <tr key={i} className="text-[9px]">
                          <td className="px-2.5 py-1.5 border-r border-slate-200 font-bold text-slate-700">{sub}</td>
                          <td className="px-1.5 py-1.5 text-center border-r border-slate-200 font-medium">{mid}</td>
                          <td className="px-1.5 py-1.5 text-center border-r border-slate-200 font-medium">{end}</td>
                          <td className="px-1.5 py-1.5 text-center border-r border-slate-200 font-black text-indigo-700 bg-indigo-50/20">{avg}%</td>
                          <td className="px-2.5 py-1.5 text-center font-black text-[8.5px]">
                            <Badge variant="outline" className={cn(
                              "rounded border-none font-black text-[8px] px-1.5 py-0.5 leading-none",
                              r.code === 'EE' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                              r.code === 'ME' && "bg-blue-50 text-blue-700 border-blue-200",
                              r.code === 'AE' && "bg-amber-50 text-amber-700 border-amber-200",
                              r.code === 'BE' && "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {r.code} — {r.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 4. Remarks & Signatures Section (Positioned directly below the table with mt-6) */}
              <div className="remarks-block space-y-3 pt-4 border-t border-slate-200 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Class Teacher's Remarks */}
                  <div className="space-y-1 p-2 bg-slate-50/70 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Class Teacher's Remarks</span>
                      <Button size="sm" className="no-print h-4 px-1.5 bg-slate-900 text-[#CCFF00] font-bold text-[7.5px] rounded gap-1">
                        <Save size={8} /> Save
                      </Button>
                    </div>
                    <textarea rows={2} className="w-full bg-transparent border-none p-0 text-[8.5px] italic text-slate-600 resize-none outline-none font-medium leading-tight" defaultValue="Excellent performance. Very disciplined learner." />
                    <p className="text-[7.5px] font-bold text-slate-400 pt-1">Sign: .......................................</p>
                  </div>

                  {/* HOI Remarks */}
                  <div className="space-y-1 p-2 bg-slate-50/70 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">HOI Remarks</span>
                      <Button size="sm" className="no-print h-4 px-1.5 bg-slate-900 text-[#CCFF00] font-bold text-[7.5px] rounded gap-1">
                        <Save size={8} /> Save
                      </Button>
                    </div>
                    <textarea rows={2} className="w-full bg-transparent border-none p-0 text-[8.5px] italic text-slate-600 resize-none outline-none font-medium leading-tight" defaultValue="Maintain the same effort in Term 2." />
                    <p className="text-[7.5px] font-bold text-slate-400 pt-1">Sign & Stamp: .............................</p>
                  </div>
                </div>

                {/* Footer Dates & System Info */}
                <div className="flex items-center justify-between text-[7.5px] font-bold text-slate-500 bg-slate-100/70 p-2 rounded">
                  <div className="flex gap-4">
                    <span>Closing Date: <span className="text-slate-900 font-black">10/04/2026</span></span>
                    <span>Opening Date: <span className="text-slate-900 font-black">04/05/2026</span></span>
                  </div>
                  <div className="text-right italic font-black text-slate-400">
                    System Powered by Jamlyan Analytics
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Layers size={16} className="text-indigo-600" />
          <span>
            {searchTerm.trim() 
              ? `Ready to download individual 1-page portrait report for ${filteredStudents[0]?.name || 'searched learner'}` 
              : `Type a learner's name in search to download their individual report card`}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Button 1: Download Current */}
          <Button 
            onClick={handleDownloadCurrent}
            variant="outline"
            className="rounded-xl border-slate-200 bg-white font-bold h-11 px-6 text-slate-700"
            disabled={isExportingCurrent}
          >
            {isExportingCurrent ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download Current
          </Button>

          {/* Button 2: Download All */}
          <Button 
            onClick={handleDownloadAll}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 px-8 gap-2"
            disabled={isDownloadingAll}
          >
            {isDownloadingAll ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Download All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCards;