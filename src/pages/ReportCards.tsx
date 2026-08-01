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
  Save, 
  Loader2, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { STUDENTS, GRADES_DATA, Grade } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import html2pdf from 'html2pdf.js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

// Stream type for database
interface StreamData {
  id: string;
  name: string;
  grade_id: string;
}

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

  // Get the grade object from GRADES_DATA based on selected grade
  const selectedGradeObj = useMemo(() => {
    return GRADES_DATA.find(g => g.name === `Grade ${grade}` || g.name === grade);
  }, [grade]);

  const selectedGradeId = selectedGradeObj?.id || "";

  // Fetch live streams from Supabase database
  // If a specific grade is selected, filter by grade_id. If "all" grades, fetch all streams.
  const { data: streams, isLoading: isLoadingStreams, error: streamsError } = useQuery({
    queryKey: ['streams', selectedGradeId],
    queryFn: async () => {
      let query = supabase.from('streams').select('id, name, grade_id');
      
      // If a specific grade is selected (not "all"), filter by grade_id
      if (selectedGradeId) {
        query = query.eq('grade_id', selectedGradeId);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching streams:', error);
        throw error;
      }
      return data as StreamData[];
    },
    enabled: true, // Always fetch streams
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Derived Data
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade;
      const matchesStream = stream === "all" || s.stream.toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  const studentResults = useMemo(() => {
    const learningAreas = SUBJECT_MAP[getCategory(grade)] || [];
    return filteredStudents.map((s, idx) => {
      const scores: Record<string, number> = {};
      let total = 0;
      
      learningAreas.forEach((area, i) => {
        const score = 55 + (i * 7) + (idx % 15);
        scores[area] = score;
        total += score;
      });

      const mean = learningAreas.length > 0 ? Math.round((total / learningAreas.length) * 10) / 10 : 0;
      let level: 'EE' | 'ME' | 'AE' | 'BE' = 'BE';
      if (mean >= 80) level = 'EE';
      else if (mean >= 50) level = 'ME';
      else if (mean >= 30) level = 'AE';

      return {
        rank: idx + 1,
        studentId: s.id,
        name: s.name,
        assessmentNo: s.assessment,
        stream: s.stream,
        scores,
        totalMarks: total,
        meanScore: mean,
        level
      };
    });
  }, [filteredStudents, grade]);

  const classMeanScore = useMemo(() => {
    if (studentResults.length === 0) return 0;
    const sum = studentResults.reduce((acc, s) => acc + s.meanScore, 0);
    return Math.round((sum / studentResults.length) * 10) / 10;
  }, [studentResults]);

  const downloadPDF = async () => {
    setIsExporting(true);
    const element = wrapperRef.current;
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `munyaka_reports_${grade}_${term}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
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
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Controls Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start no-print">
        {/* Left Side: Buttons & Filters Stack */}
        <div className="w-full lg:w-72 space-y-6">
          <div className="flex gap-2">
            <Button 
              onClick={downloadPDF}
              className="flex-1 bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              Download PDF
            </Button>
            <Button 
              className="flex-1 bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 text-xs gap-2"
            >
              <FileSpreadsheet size={16} />
              Download CSV
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
                  {GRADES_DATA.map(g => <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stream</Label>
              <Select value={stream} onValueChange={setStream} disabled={isLoadingStreams || !!streamsError}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder={isLoadingStreams ? "Loading streams..." : "All Streams"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {isLoadingStreams ? (
                    <SelectItem disabled>
                      <Loader2 className="animate-spin mr-2" size={14} />
                      Loading streams...
                    </SelectItem>
                  ) : streamsError ? (
                    <SelectItem disabled>Error loading streams</SelectItem>
                  ) : streams?.length === 0 ? (
                    <SelectItem disabled>No streams configured</SelectItem>
                  ) : (
                    streams.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))
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
          <p className="text-slate-500 text-sm font-medium">Previewing {filteredStudents.length} report cards in A4 Portrait layout.</p>
        </div>
      </div>

      {/* A4 Portrait Reports Wrapper */}
      <div 
        ref={wrapperRef} 
        className="reports-print-wrapper flex flex-col items-center gap-6 w-full max-w-[794px] mx-auto"
      >
        {filteredStudents.map((s, idx) => {
          const cat = getCategory(s.grade);
          const subjects = SUBJECT_MAP[cat];

          return (
            <Card 
              key={s.id} 
              className="report-card bg-white w-full max-w-[210mm] min-h-[297mm] shadow-sm rounded-sm p-6 space-y-4"
            >
              {/* Header Letterhead - Stacked & Centered */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                <h2 className="font-black text-base uppercase tracking-tight text-slate-900 leading-tight">
                  MUNYAKA PRIMARY AND JUNIOR SCHOOL
                </h2>
                <p className="font-bold text-xs text-slate-600">P.O.BOX 5239-30100, ELDORET</p>
                <p className="italic text-xs text-slate-500 font-medium">MOTTO: Knowledge is Power</p>
                <div className="bg-slate-100 py-1 px-3 inline-block rounded-md mt-2">
                  <p className="font-black text-[9px] uppercase tracking-tighter text-indigo-900">
                    Competency-Based Curriculum Progress Report — {term.toUpperCase()} · Academic Year {year}
                  </p>
                </div>
              </div>

              {/* Metadata Grid - 2x2 Compact with Fixed Widths */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Name</span>
                  <span className="font-bold text-sm text-slate-900" style={{ minWidth: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">ULI</span>
                  <span className="font-black font-mono text-sm text-slate-900">{s.assessment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Grade / Stream</span>
                  <span className="font-bold text-sm text-slate-900">Grade {s.grade} — {s.stream}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Overall Rank</span>
                  <span className="font-black text-sm text-indigo-600">#{idx + 1} of {filteredStudents.length}</span>
                </div>
              </div>

              {/* Grading Table */}
              <div className="overflow-hidden border border-slate-300 rounded">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr className="text-[9px] font-black uppercase">
                      <th className="px-3 py-2 border-r border-slate-300 text-left min-w-[45%]">Subject / Learning Area</th>
                      <th className="px-2 py-2 text-center border-r border-slate-300 w-[12%]">Mid</th>
                      <th className="px-2 py-2 text-center border-r border-slate-300 w-[12%]">End</th>
                      <th className="px-2 py-2 text-center border-r border-slate-300 w-[12%] bg-indigo-50/50">Avg</th>
                      <th className="px-3 py-2 text-center w-[19%]">Rubric</th>
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
                          <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-700">{sub}</td>
                          <td className="px-2 py-1.5 text-center border-r border-slate-200 font-medium">{mid}</td>
                          <td className="px-2 py-1.5 text-center border-r border-slate-200 font-medium">{end}</td>
                          <td className="px-2 py-1.5 text-center border-r border-slate-200 font-black text-indigo-700 bg-indigo-50/20">{avg}%</td>
                          <td className="px-3 py-1.5 text-center font-black text-[9px]">
                            <Badge variant="outline" className={cn(
                              "rounded-md border-none font-black text-[9px] px-2 py-0.5",
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

              {/* Bottom Remarks Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {/* Class Teacher's Remarks */}
                  <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Class Teacher's Remarks</span>
                      <Button size="sm" className="no-print h-5 px-2 bg-slate-900 text-[#CCFF00] font-bold text-[8px] rounded gap-1">
                        <Save size={8} /> Save
                      </Button>
                    </div>
                    <textarea rows={1} className="w-full bg-transparent border-none p-0 text-[9px] italic text-slate-600 resize-none outline-none font-medium" defaultValue="Excellent performance. Very disciplined learner." />
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Sign: .......................................</p>
                  </div>

                  {/* HOI Remarks */}
                  <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">HOI Remarks</span>
                      <Button size="sm" className="no-print h-5 px-2 bg-slate-900 text-[#CCFF00] font-bold text-[8px] rounded gap-1">
                        <Save size={8} /> Save
                      </Button>
                    </div>
                    <textarea rows={1} className="w-full bg-transparent border-none p-0 text-[9px] italic text-slate-600 resize-none outline-none font-medium" defaultValue="Maintain the same effort in Term 2." />
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Sign & Stamp: .............................</p>
                  </div>
                </div>

                {/* Footer Zone */}
                <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 bg-slate-100/50 p-2 rounded">
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
          <span>Ready to export {filteredStudents.length} records. Format: A4 Portrait</span>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadPDF}
            variant="outline"
            className="rounded-xl border-slate-200 bg-white font-bold h-11 px-6 text-slate-700"
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download PDF
          </Button>
          <Button 
            className="bg-[#112A56] hover:bg-[#0d1f42] text-[#CCFF00] font-bold rounded-xl h-11 px-8 gap-2"
          >
            <FileSpreadsheet size={16} /> Download CSV
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCards;