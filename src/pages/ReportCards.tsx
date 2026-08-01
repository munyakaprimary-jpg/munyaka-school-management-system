"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const students = [
  {
    name: "BRIAN KIPTOO",
    uli: "A827361",
    gradeStream: "4 Blue",
    rank: "#1 / 1",
    grades: [ /* English, Kiswahili, Math... */ ],
  },
  {
    name: "FAITH CHEPKEMOI",
    uli: "A827362",
    gradeStream: "4 Blue",
    rank: "#2 / 2",
    grades: [ /* ... */ ],
  },
];

const ReportCards = () => {
  return (
    <div className="report-cards-container">
      {students.map((student) => (
        <div key={student.uli} className="student-page-break">
          <Card className="report-card">
            {/* Header */}
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-bold text-slate-900">{student.name}</CardTitle>
            </CardHeader>
            
            {/* Grading Table */}
            <CardContent className="p-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[9px] font-black text-slate-400 tracking-widest">
                    <th className="px-6 py-5">Learner Name</th>
                    <th className="px-6 py-5">Assessment ID</th>
                    <th className="px-6 py-5">Grade Stream</th>
                    <th className="px-6 py-5">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{student.name}</p>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{student.uli}</code>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-700">{student.gradeStream}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-500">{student.rank}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ReportCards;

// CSS for page breaks
<style>
.student-page-break {
  page-break-after: always;
  break-after: page;
}
</style><dyad-write path="src/pages/ReportCards.tsx" description="Map over students array with page-break containers for clean PDF output">
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/ui/BackButton";
import { 
  Download, 
  Search, 
  Printer, 
  School, 
  Save, 
  Loader2, 
  Layers,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import html2pdf from 'html2pdf.js';

// Import FileSpreadsheet to fix missing reference
import { Download, Search, Printer, School, Save, Loader2, Layers, ChevronDown, FileSpreadsheet } from 'lucide-react';

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

const ReportCards = () => {
  // Filters State
  const [year, setYear] = useState("2026");
  const [grade, setGrade] = useState("4");
  const [stream, setStream] = useState("all");
  const [term, setTerm] = useState("term1");
  const [type, setType] = useState("endterm");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isExporting, setIsExporting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Derived Data
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade;
      const matchesStream = stream === "all" || s.stream.toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  const downloadPDF = async (mode: 'current' | 'all') => {
    setIsExporting(true);
    const element = wrapperRef.current;
    if (!element) return;

    // Temporarily hide UI elements that shouldn't appear in the PDF
    const elementsToHide = element.querySelectorAll('.no-print');
    const originalDisplayValues: string[] = [];
    elementsToHide.forEach((el, index) => {
      originalDisplayValues[index] = (el as HTMLElement).style.display;
      (el as HTMLElement).style.display = 'none';
    });

    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `munyaka_reports_${grade}_${term}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      showSuccess("PDF generated successfully!");
    } catch (err) {
      showError("Export failed.");
    } finally {
      // Restore original display values
      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplayValues[index];
      });
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Page Break Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .reports-print-wrapper { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        .report-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          font-size: 11px;
          border: 1px solid #e2e8f0;
        }
        .report-card table, .report-card tr, .report-card td, .report-card th {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .student-page-break {
          page-break-after: always !important;
          break-after: page !important;
        }
        .exporting-pdf .no-print { display: none !important; }
      `}</style>

      {/* Top Controls Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start no-print">
        {/* Left Side: Buttons & Filters Stack */}
        <div className="w-full lg:w-72 space-y-6">
          <div className="flex gap-2">
            <Button 
              onClick={() => downloadPDF('current')}
              className="flex-1 bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
            >
              <Download size={16} /> Download Current
            </Button>
            <Button 
              onClick={() => downloadPDF('all')}
              className="flex-1 bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
            >
              <FileSpreadsheet size={16} /> Download All
            </Button>
          </div>

          <div className="space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Academic Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="PP1">PP1</SelectItem>
                  <SelectItem value="PP2">PP2</SelectItem>
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stream</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Streams</SelectItem>
                  <SelectItem value="A">Stream A</SelectItem>
                  <SelectItem value="B">Stream B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Active Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                  <SelectItem value="term3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Exam Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opener">Opener</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="endterm">Endterm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Search Learner</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Search Learner..." 
                  className="pl-9 h-10 rounded-2xl bg-slate-50 border-none text-xs font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Page Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <BackButton fallback="/" />
            <div>
              <h1 className="text-3xl font-black text-slate-900">Results Analysis</h1>
              <p className="text-muted-foreground font-medium">Performance analytics, subject rankings, and class score sheets.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => downloadPDF('current')}
              className="rounded-2xl border-slate-200 gap-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <FileDown size={16} /> Download CSV
            </Button>
            <Button 
              onClick={() => downloadPDF('all')}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              <Printer size={16} /> Print Report / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Grid Wrapper */}
      <div className="reports-print-wrapper grid grid-cols-1 md:grid-cols-2 gap-[0.5cm] w-full">
        {filteredStudents.map((s, idx) => (
          <div key={s.id} className="student-page-break">
            <Card className="report-card bg-white rounded-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-xl font-bold text-slate-900">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b">
                    <tr className="text-[9px] text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-5">Learner Name</th>
                      <th className="px-6 py-5">Assessment ID</th>
                      <th className="px-6 py-5">Grade Stream</th>
                      <th className="px-6 py-5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {s.grades.map((g, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">{s.name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{s.assessment}</code>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-slate-600 font-bold">{g.grade}</span> <span className="text-slate-400">{g.stream}</span>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-indigo-600">{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => downloadPDF('current')}
            className="rounded-xl border-slate-200 bg-white font-bold text-slate-700 h-11 px-6"
          >
            <Download size={16} /> Download Current
          </Button>
          <Button 
            onClick={() => downloadPDF('all')}
            className="rounded-xl bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2"
          >
            <Download size={16} /> Download All ({filteredStudents.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCards;