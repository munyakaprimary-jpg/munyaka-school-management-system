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
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { GRADES_DATA, Grade } from '@/lib/mock-data';
import { getStudents } from '@/services/persistentStore';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { downloadCSV, SCHOOL_HEADERS, generateCSVHeader } from '@/utils/downloadHelper';

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

// Format YYYY-MM-DD into DD/MM/YYYY
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

const ReportCards = () => {
  // Filters State
  const [year, setYear] = useState("2026");
  const [grade, setGrade] = useState("4");
  const [stream, setStream] = useState("all");
  const [term, setTerm] = useState("term1");
  const [type, setType] = useState("endterm");
  const [searchTerm, setSearchTerm] = useState("");

  // Dynamic Term Calendar Dates State
  const [closingDate, setClosingDate] = useState("2026-04-10");
  const [openingDate, setOpeningDate] = useState("2026-05-04");
  
  const [isExportingCurrent, setIsExportingCurrent] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dynamic Stored Grades State (matches Grades & Streams key 'munyaka_grades')
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
    const students = getStudents();
    return students.filter(s => {
      const matchesSearch = !searchTerm ||
        String(s.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.assessment ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade;
      const matchesStream = stream === "all" || String(s.stream ?? "").toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  // Handler: "Download Current"
  const handleDownloadCurrent = async () => {
    // 1. Sync live values from textareas into DOM text
    document.querySelectorAll('textarea').forEach(textarea => {
      textarea.innerText = textarea.value;
    });

    // 2. Clone the report card element
    const reportElement = wrapperRef.current || (document.querySelector('.reports-print-wrapper') as HTMLElement | null);
    if (!reportElement) {
      showError("Report card container not found.");
      return;
    }
    const printContent = reportElement.cloneNode(true) as HTMLElement;

    // 3. Remove .no-print elements (save buttons, top controls)
    printContent.querySelectorAll('.no-print, [data-html2canvas-ignore]').forEach(el => el.remove());

    // 4. Create or reuse a hidden iframe
    let printFrame = document.getElementById('pdf-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'pdf-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    // 5. Write the printable content into the iframe
    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      showError("Could not access print iframe document.");
      return;
    }
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CBC_Report_Card</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { background: #ffffff; padding: 0; margin: 0; }
            @page { size: A4 portrait; margin: 5mm; }
            .reports-print-wrapper {
              width: 100%;
              padding: 10mm;
              border: none !important;
              box-shadow: none !important;
              font-size: 11px;
              line-height: 1.3;
            }
            .school-header { text-align: center; margin-bottom: 8px; }
            .school-name { font-size: 13px; font-weight: bold; }
            .school-motto { font-style: italic; color: #4b5563; margin: 2px 0; }
            .report-subtitle { font-weight: bold; color: #1e3a8a; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin-top: 4px; }
            .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 10px; }
            .meta-item { display: flex; gap: 4px; }
            .meta-label { font-weight: bold; }
            .grading-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .grading-table th, .grading-table td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            .grading-table th { background: #f1f5f9; font-weight: bold; }
            .admin-block { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
            .remark-box { border: 1px solid #e2e8f0; padding: 6px; }
            .remark-header { font-weight: bold; margin-bottom: 4px; }
            .signature-line { margin-top: 12px; border-top: 1px dotted #94a3b8; width: 180px; text-align: center; font-size: 10px; }
            .dates-row { display: flex; justify-content: space-between; font-weight: bold; padding: 4px 0; }
            .branding { text-align: right; font-size: 9px; color: #94a3b8; font-style: italic; }
            textarea { width: 100%; border: none; font-family: inherit; font-size: 11px; resize: none; background: transparent; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    // 6. Trigger print cleanly inside the frame
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 300);

    showSuccess("PDF print dialog opened.");
  };

  // Handler: "Download All" - uses the same hidden inline iframe pipeline
  const handleDownloadAll = async () => {
    // 1. Sync live values from textareas into DOM text
    document.querySelectorAll('textarea').forEach(textarea => {
      textarea.innerText = textarea.value;
    });

    // 2. Clone the report card element
    const reportElement = wrapperRef.current || (document.querySelector('.reports-print-wrapper') as HTMLElement | null);
    if (!reportElement) {
      showError("Report card container not found.");
      return;
    }
    const printContent = reportElement.cloneNode(true) as HTMLElement;

    // 3. Remove .no-print elements (save buttons, top controls)
    printContent.querySelectorAll('.no-print, [data-html2canvas-ignore]').forEach(el => el.remove());

    // 4. Create or reuse a hidden iframe
    let printFrame = document.getElementById('pdf-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'pdf-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    // 5. Write the printable content into the iframe
    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      showError("Could not access print iframe document.");
      return;
    }
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CBC_Report_Card_All</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { background: #ffffff; padding: 0; margin: 0; }
            @page { size: A4 portrait; margin: 5mm; }
            .reports-print-wrapper {
              width: 100%;
              padding: 10mm;
              border: none !important;
              box-shadow: none !important;
              font-size: 11px;
              line-height: 1.3;
            }
            .school-header { text-align: center; margin-bottom: 8px; }
            .school-name { font-size: 13px; font-weight: bold; }
            .school-motto { font-style: italic; color: #4b5563; margin: 2px 0; }
            .report-subtitle { font-weight: bold; color: #1e3a8a; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin-top: 4px; }
            .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 10px; }
            .meta-item { display: flex; gap: 4px; }
            .meta-label { font-weight: bold; }
            .grading-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .grading-table th, .grading-table td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            .grading-table th { background: #f1f5f9; font-weight: bold; }
            .admin-block { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
            .remark-box { border: 1px solid #e2e8f0; padding: 6px; }
            .remark-header { font-weight: bold; margin-bottom: 4px; }
            .signature-line { margin-top: 12px; border-top: 1px dotted #94a3b8; width: 180px; text-align: center; font-size: 10px; }
            .dates-row { display: flex; justify-content: space-between; font-weight: bold; padding: 4px 0; }
            .branding { text-align: right; font-size: 9px; color: #94a3b8; font-style: italic; }
            textarea { width: 100%; border: none; font-family: inherit; font-size: 11px; resize: none; background: transparent; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    // 6. Trigger print cleanly inside the frame
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 300);

    showSuccess("Bulk PDF print dialog opened.");
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
          [data-html2canvas-ignore] { display: none !important; }
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

        /* PDF Header Styles */
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #4f46e5;
        }
        .pdf-school-name {
          font-size: 18px;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pdf-motto {
          font-size: 11px;
          font-weight: 700;
          font-style: italic;
          color: #4f46e5;
          margin: 0 0 4px 0;
        }
        .pdf-address {
          font-size: 10px;
          color: #64748b;
          margin: 0 0 2px 0;
        }
        .pdf-contact {
          font-size: 9px;
          color: #94a3b8;
          margin: 0 0 8px 0;
        }
        .pdf-divider {
          height: 2px;
          background: linear-gradient(90deg, #4f46e5, #06b6d4);
          margin: 8px auto;
          width: 60%;
          border-radius: 1px;
        }
        .pdf-report-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pdf-header-info {
          font-size: 9px;
          color: #64748b;
          margin: 2px 0;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CBC Report Generator</h1>
        </div>
        <div className="flex gap-2">
          {/* Button 1: Download Current */}
          <Button 
            onClick={handleDownloadCurrent}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2 no-print"
            disabled={isExportingCurrent}
          >
            {isExportingCurrent ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Current
          </Button>

          {/* Button 2: Download All */}
          <Button 
            onClick={handleDownloadAll}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2 no-print"
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

            {/* Dynamic Term Calendar Dates Settings */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">Term Calendar Dates</span>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 ml-1">Closing Date</Label>
                <Input 
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 ml-1">Next Term Opening Date</Label>
                <Input 
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>
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
            {(searchTerm ?? '').trim()
              ? `Filtered individual search: Previewing ${filteredStudents.length} report card(s) for "${searchTerm}". Click "Download Current" to download.`
              : `Previewing ${filteredStudents.length} report cards for Grade ${grade} (${year}). Type a learner's name in the search box to download an individual report.`}
          </p>
        </div>
      </div>

      {/* A4 Single-Page Report Cards Container */}
      <div 
        ref={wrapperRef} 
        className="reports-print-wrapper flex flex-col items-center gap-6 w-full max-w-[190mm] mx-auto"
        data-html2canvas-ignore="false"
      >
        {filteredStudents.map((s, idx) => {
          const cat = getCategory(s.grade);
          const subjects = SUBJECT_MAP[cat];

          return (
            <Card 
              key={s.id} 
              className="report-card bg-white w-full max-w-[190mm] shadow-sm rounded-sm p-6 border border-slate-200 space-y-4 box-border"
            >
              {/* 1. Header Letterhead - Standard Vertical Stack with Explicit Margins */}
              <div className="w-full flex flex-col items-center text-center border-b border-slate-200 pb-3 overflow-visible">
                <h2 className="font-bold text-sm uppercase tracking-tight text-slate-900 mb-[4px]">
                  MUNYAKA PRIMARY AND JUNIOR SCHOOL
                </h2>
                <p className="font-bold text-[10px] text-slate-600 mb-[2px]">
                  P.O. BOX 5239-30100, ELDORET
                </p>
                <p className="italic text-[9.5px] text-slate-500 font-medium mb-[12px]">
                  MOTTO: Knowledge is Power
                </p>
                <h3 className="font-black text-[10.5px] uppercase tracking-wider text-slate-800 bg-slate-100 px-4 py-1.5 rounded mb-[16px] block border border-slate-200">
                  COMPETENCY BASED CURRICULUM PROGRESS REPORT — {term.toUpperCase()} · ACADEMIC YEAR {year}
                </h3>
              </div>

              {/* 2. Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 p-2.5 rounded-md border border-slate-100 text-[10px] mt-[16px] mb-2">
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
              <div className="overflow-hidden border border-slate-300 rounded mb-2">
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

              {/* 4. Remarks & Signatures Section */}
              <div className="remarks-block space-y-3 pt-3 border-t border-slate-200 mt-5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Class Teacher's Remarks */}
                  <div className="space-y-1 p-2 bg-slate-50/70 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center no-print">
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
                    <div className="flex justify-between items-center no-print">
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
                <div className="flex items-center justify-between text-[7.5px] font-bold text-slate-500 bg-slate-100/70 p-2 rounded mt-4">
                  <div className="flex gap-4">
                    <span>Closing Date: <span className="text-slate-900 font-black">{formatDateDisplay(closingDate)}</span></span>
                    <span>Opening Date: <span className="text-slate-900 font-black">{formatDateDisplay(openingDate)}</span></span>
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
            {(searchTerm ?? '').trim()
              ? `Ready to download individual 1-page portrait report for ${filteredStudents[0]?.name || 'searched learner'}`
              : `Type a learner's name in search to download their individual report card`}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Button 1: Download Current */}
          <Button 
            onClick={handleDownloadCurrent}
            variant="outline"
            className="rounded-xl border-slate-200 bg-white font-bold h-11 px-6 text-slate-700 no-print"
            disabled={isExportingCurrent}
          >
            {isExportingCurrent ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download Current
          </Button>

          {/* Button 2: Download All */}
          <Button 
            onClick={handleDownloadAll}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 px-8 gap-2 no-print"
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