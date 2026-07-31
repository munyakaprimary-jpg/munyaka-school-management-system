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
  Download, 
  Search, 
  Printer, 
  School, 
  Save, 
  Loader2, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
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

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
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
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .reports-print-wrapper { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        .report-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always;
          font-size: 11px;
          border: 1px solid #e2e8f0;
        }
        .report-card table, .report-card tr, .report-card td, .report-card th {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
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
                  <SelectItem value="PP1">PP1</SelectItem><SelectItem value="PP2">PP2</SelectItem>
                  {[1,2,3,4,5,6,7,8,9].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stream</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Streams</SelectItem><SelectItem value="A">Stream A</SelectItem><SelectItem value="B">Stream B</SelectItem></SelectContent>
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
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Search Learner..." 
                  className="pl-9 h-10 rounded-xl bg-slate-50 border-none text-xs font-bold"
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
            <h1 className="text-2xl font-black text-slate-900">CBC Report Generator</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Previewing {filteredStudents.length} report cards in 2-column grid layout.</p>
        </div>
      </div>

      {/* Reports Grid Wrapper */}
      <div 
        ref={wrapperRef} 
        className="reports-print-wrapper grid grid-cols-1 md:grid-cols-2 gap-[0.5cm] w-full"
      >
        {filteredStudents.map((s, idx) => {
          const cat = getCategory(s.grade);
          const subjects = SUBJECT_MAP[cat];

          return (
            <Card key={s.id} className="report-card bg-white rounded-none shadow-none p-[0.4rem] space-y-2.5">
              {/* Header Letterhead */}
              <div className="text-center space-y-0.5">
                <h2 className="font-black text-sm uppercase leading-tight">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h2>
                <p className="font-bold text-[10px]">P.O.BOX 5239-30100, ELDORET</p>
                <p className="italic text-[10px] text-slate-500 font-medium">MOTTO: Knowledge is Power</p>
                <div className="bg-slate-100 py-1 px-2 inline-block rounded-md mt-1">
                  <p className="font-black text-[9px] uppercase tracking-tighter text-indigo-900">
                    Competency-Based Curriculum Progress Report - {term.toUpperCase()} · Academic Year {year}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="font-black text-slate-400 uppercase text-[8px]">Name:</span><span className="font-black uppercase truncate max-w-[120px]">{s.name}</span></div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="font-black text-slate-400 uppercase text-[8px]">ULI:</span><span className="font-black font-mono">{s.assessment}</span></div>
                <div className="flex justify-between"><span className="font-black text-slate-400 uppercase text-[8px]">Grade Stream:</span><span className="font-black">{s.grade} {s.stream}</span></div>
                <div className="flex justify-between"><span className="font-black text-slate-400 uppercase text-[8px]">Overall Rank:</span><span className="font-black text-indigo-600">#{idx + 1} / {filteredStudents.length}</span></div>
              </div>

              {/* Grading Table */}
              <div className="overflow-hidden border border-slate-300 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr className="text-[9px] font-black uppercase">
                      <th className="px-2 py-1.5 border-r border-slate-300">Subject / Learning Area</th>
                      <th className="px-1 py-1.5 text-center border-r border-slate-300 w-12">Mid</th>
                      <th className="px-1 py-1.5 text-center border-r border-slate-300 w-12">End</th>
                      <th className="px-1 py-1.5 text-center border-r border-slate-300 w-12 bg-indigo-50/50">Avg</th>
                      <th className="px-2 py-1.5 text-center w-16">Rubric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subjects.map((sub, i) => {
                      const mid = 70 + (i % 25);
                      const end = 72 + (i % 20);
                      const avg = Math.round((mid + end) / 2);
                      const r = getRubric(avg);
                      return (
                        <tr key={i} className="text-[10px]">
                          <td className="px-2 py-1 border-r border-slate-200 font-bold text-slate-700">{sub}</td>
                          <td className="px-1 py-1 text-center border-r border-slate-200">{mid}</td>
                          <td className="px-1 py-1 text-center border-r border-slate-200">{end}</td>
                          <td className="px-1 py-1 text-center border-r border-slate-200 font-black text-indigo-700 bg-indigo-50/20">{avg}%</td>
                          <td className="px-2 py-1 text-center font-black text-[9px]">{r.code}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Admin Block Footer */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 p-2 bg-slate-50/50 rounded-lg border border-slate-100 relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black uppercase text-slate-400">Class Teacher's Remarks</span>
                      <Button size="sm" className="no-print h-5 px-2 bg-slate-900 text-[#CCFF00] font-bold text-[8px] rounded-md gap-1">
                        <Save size={10} /> Save
                      </Button>
                    </div>
                    <textarea rows={1} className="w-full bg-transparent border-none p-0 text-[9px] italic text-slate-600 resize-none outline-none font-medium" defaultValue="Excellent performance. Very disciplined learner." />
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Sign: .......................................</p>
                  </div>
                  <div className="space-y-1 p-2 bg-slate-50/50 rounded-lg border border-slate-100 relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black uppercase text-slate-400">HOI Remarks</span>
                      <Button size="sm" className="no-print h-5 px-2 bg-slate-900 text-[#CCFF00] font-bold text-[8px] rounded-md gap-1">
                        <Save size={10} /> Save
                      </Button>
                    </div>
                    <textarea rows={1} className="w-full bg-transparent border-none p-0 text-[9px] italic text-slate-600 resize-none outline-none font-medium" defaultValue="Maintain the same effort in Term 2." />
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Sign & Stamp: .............................</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 bg-slate-100/50 p-1.5 rounded-md">
                  <div className="flex gap-4">
                    <span>Closing Date: <span className="text-slate-900">10/04/2026</span></span>
                    <span>Opening Date: <span className="text-slate-900">04/05/2026</span></span>
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
          <span>Ready to export {filteredStudents.length} records. Layout: A4 Landscape</span>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => downloadPDF('current')}
            variant="outline"
            className="rounded-xl border-slate-200 bg-white font-bold h-11 px-6 text-slate-700"
          >
            Download Current
          </Button>
          <Button 
            onClick={() => downloadPDF('all')}
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 px-8 gap-2"
          >
            <Download size={16} /> Download All ({filteredStudents.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCards;