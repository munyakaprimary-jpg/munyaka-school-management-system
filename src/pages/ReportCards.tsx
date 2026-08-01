"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { 
  Download, 
  Search, 
  Printer, 
  Loader2, 
  FileSpreadsheet,
  School,
  FileText
} from 'lucide-react';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Rubric Evaluation Helper
const getRubric = (score: number) => {
  if (score >= 80) return { code: 'EE', label: 'Exceeding Expectations' };
  if (score >= 65) return { code: 'ME', label: 'Meets Expectations' };
  if (score >= 50) return { code: 'AE', label: 'Approaching Expectations' };
  return { code: 'BE', label: 'Below Expectations' };
};

// Learning Areas Mapping by Category
const SUBJECT_MAP: Record<string, string[]> = {
  'PP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Psychomotor Activities', 'Religious Activities'],
  'Lower': ['Literacy', 'English', 'Kiswahili', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Education'],
  'Upper': ['English', 'Kiswahili', 'Mathematics', 'Science & Tech', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts', 'Religious Education'],
  'Junior': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Pre-Technical Studies', 'Social Studies', 'Agriculture & Nutrition', 'Creative Arts & Sports', 'Religious Education']
};

const getCategory = (gradeName: string) => {
  const g = gradeName.toUpperCase();
  if (g.includes('PP')) return 'PP';
  const num = parseInt(g.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num)) {
    if (num <= 3) return 'Lower';
    if (num <= 6) return 'Upper';
    return 'Junior';
  }
  return 'Upper';
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
  const index = GRADE_ORDER.findIndex(g => normalized.includes(g));
  return index !== -1 ? index : 999;
};

const ReportCards = () => {
  // Filter States
  const [year, setYear] = useState("2026");
  const [grade, setGrade] = useState("4");
  const [stream, setStream] = useState("all");
  const [term, setTerm] = useState("term1");
  const [examType, setExamType] = useState("endterm");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isExportingCurrent, setIsExportingCurrent] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Dynamic Sorted Grades
  const sortedGrades = useMemo(() => {
    return [...GRADES_DATA].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return getGradeSortIndex(nameA) - getGradeSortIndex(nameB);
    });
  }, []);

  // Available Streams for Selected Grade
  const availableStreams = useMemo(() => {
    if (!GRADES_DATA || GRADES_DATA.length === 0) return [];
    if (grade === 'all') {
      const streamNames = new Set<string>();
      GRADES_DATA.forEach(g => g.streams?.forEach(s => streamNames.add(s.name)));
      return Array.from(streamNames).sort().map(name => ({ name }));
    }
    
    const gradeObj = GRADES_DATA.find(g => 
      g.name === `Grade ${grade}` || 
      g.name === grade || 
      g.name.replace(/[^0-9]/g, '') === grade
    );
    return gradeObj?.streams?.map(s => ({ name: s.name })) || [];
  }, [grade]);

  // Single Declaration of Filtered Students
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => {
      const matchesSearch = !searchTerm.trim() || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = grade === "all" || s.grade === grade || `Grade ${s.grade}` === grade;
      const matchesStream = stream === "all" || s.stream.toLowerCase() === stream.toLowerCase();
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, grade, stream]);

  // Active Learner for display
  const activeStudent = useMemo(() => {
    return filteredStudents.length > 0 ? filteredStudents[0] : null;
  }, [filteredStudents]);

  // Class Mean Score
  const classMeanScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    return 76.4;
  }, [filteredStudents]);

  // Export Individual Learner Report
  const handleDownloadCurrent = async () => {
    if (!activeStudent) {
      showError("No active learner found to export.");
      return;
    }

    setIsExportingCurrent(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const safeLearnerName = activeStudent.name.toLowerCase().replace(/\s+/g, '_');

      const content = [
        "MUNYAKA PRIMARY AND JUNIOR SCHOOL - INDIVIDUAL LEARNER REPORT",
        `Learner: ${activeStudent.name} | ULI: ${activeStudent.assessment}`,
        `Grade: Grade ${activeStudent.grade} — ${activeStudent.stream} Stream`,
        `Academic Year: ${year} | Term: ${term.toUpperCase()}`,
        `Generated: ${new Date().toLocaleString()}`,
        "--------------------------------------------------",
        `Guardian: ${activeStudent.guardian} | Contact: ${activeStudent.phone}`
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute("href", url);
      link.setAttribute("download", `report_card_${safeLearnerName}_${year}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported report card for ${activeStudent.name}`);
    } catch (err) {
      showError("Failed to export report card.");
    } finally {
      setIsExportingCurrent(false);
    }
  };

  // Export Bulk CSV for All Learners
  const handleDownloadAll = async () => {
    if (filteredStudents.length === 0) {
      showError("No learner records match the current filters.");
      return;
    }

    setIsDownloadingAll(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100, ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      const row4 = `GRADE: ${grade}, STREAM: ${stream}, YEAR: ${year}, TERM: ${term.toUpperCase()}`;
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
        row1, row2, row3, row4, row5, "",
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school_report_records_${year}_term_${term}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredStudents.length} learner records to CSV`);
    } catch (err) {
      showError("Failed to export bulk CSV.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentSubjects = SUBJECT_MAP[getCategory(grade)] || SUBJECT_MAP['Upper'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header & Controls (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Learner Progress Reports</h1>
            <p className="text-sm text-slate-500 font-medium">Generate, print, and export official CBC termly report cards.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
            className="rounded-2xl h-12 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 gap-2 shadow-sm"
          >
            {isDownloadingAll ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} className="text-emerald-600" />}
            Export Class CSV
          </Button>

          <Button 
            variant="outline"
            onClick={handleDownloadCurrent}
            disabled={isExportingCurrent || !activeStudent}
            className="rounded-2xl h-12 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 gap-2 shadow-sm"
          >
            {isExportingCurrent ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} className="text-indigo-600" />}
            Export Active Report
          </Button>

          <Button 
            onClick={handlePrint}
            className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2"
          >
            <Printer size={18} /> Print Report Card
          </Button>
        </div>
      </div>

      {/* Filter Controls Bar (Hidden on Print) */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
            <Select value={grade} onValueChange={val => { setGrade(val); setStream("all"); }}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {sortedGrades.map(g => (
                  <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                    {g.name} ({g.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stream</Label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Streams</SelectItem>
                {availableStreams.map(s => (
                  <SelectItem key={s.name} value={s.name}>{s.name} Stream</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term</Label>
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

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="endterm">End-Term Summative</SelectItem>
                <SelectItem value="midterm">Mid-Term Assessment</SelectItem>
                <SelectItem value="formative">Continuous Formative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Learner</Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name / ULI..."
                className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Official Printable Report Card View */}
      {activeStudent ? (
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-8 md:p-12 space-y-8 print:p-0 print:shadow-none print:rounded-none">
          
          {/* Institutional Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
            <div className="flex items-center justify-center gap-3 mb-1">
              <School size={40} className="text-indigo-600 print:text-slate-900" />
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">
                MUNYAKA PRIMARY AND JUNIOR SCHOOL
              </h1>
            </div>
            <p className="text-xs font-bold text-slate-600">P.O. Box 5239-30100 Eldoret • Tel: +254 712 345 678 • Email: info@munyaka.sc.ke</p>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-900">MOTTO: KNOWLEDGE IS POWER</p>
            
            <div className="pt-2">
              <Badge className="bg-slate-900 text-white font-black uppercase text-xs tracking-widest px-4 py-1 rounded-xl">
                COMPETENCY BASED CURRICULUM PROGRESS REPORT — {term.toUpperCase()} {year}
              </Badge>
            </div>
          </div>

          {/* Student Metadata Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learner Name</p>
              <p className="text-base font-black text-slate-900 uppercase">{activeStudent.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ULI / Assessment No</p>
              <p className="text-base font-black text-indigo-600">{activeStudent.assessment}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grade & Stream</p>
              <p className="text-base font-bold text-slate-800">Grade {activeStudent.grade} — {activeStudent.stream}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Overall Position / Rank</p>
              <p className="text-base font-black text-emerald-600">Rank #1 of {filteredStudents.length}</p>
            </div>
          </div>

          {/* CBC Performance Rubric Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Learning Area Evaluation</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr className="font-black text-slate-600 uppercase">
                    <th className="px-4 py-3 border-r">Learning Area / Subject</th>
                    <th className="px-3 py-3 text-center border-r w-20">Mid-Term</th>
                    <th className="px-3 py-3 text-center border-r w-20">End-Term</th>
                    <th className="px-3 py-3 text-center border-r w-20 bg-indigo-50/50">Average</th>
                    <th className="px-4 py-3 text-center w-48">Performance Rubric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSubjects.map((subject, idx) => {
                    const mid = 72 + (idx % 20);
                    const end = 75 + (idx % 22);
                    const avg = Math.round((mid + end) / 2);
                    const rubric = getRubric(avg);

                    return (
                      <tr key={subject} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 border-r">{subject}</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-600 border-r">{mid}%</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-600 border-r">{end}%</td>
                        <td className="px-3 py-3 text-center font-black text-indigo-700 bg-indigo-50/30 border-r">{avg}%</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={cn(
                            "font-bold text-[10px] rounded-lg px-2.5 py-0.5 border-none",
                            rubric.code === 'EE' && "bg-emerald-50 text-emerald-700",
                            rubric.code === 'ME' && "bg-blue-50 text-blue-700",
                            rubric.code === 'AE' && "bg-amber-50 text-amber-700",
                            rubric.code === 'BE' && "bg-rose-50 text-rose-700"
                          )}>
                            {rubric.code} — {rubric.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Remarks & Endorsement Box */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0">
                <FileText size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Class Teacher's Assessment Remarks</p>
                <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                  "{activeStudent.name} demonstrates excellent conceptual understanding across learning areas. Continues to show high aptitude in problem-solving and group activities."
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200/80 text-xs font-bold text-slate-700">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-black">Class Teacher Signature</p>
                <p className="mt-4 border-b border-dashed border-slate-400 pb-1">Signature: ...........................................</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-black">Headteacher Stamp & Sign</p>
                <p className="mt-4 border-b border-dashed border-slate-400 pb-1">Signature: ...........................................</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Learner Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Try adjusting the search query or class/stream filter to display report cards.</p>
        </Card>
      )}
    </div>
  );
};

export default ReportCards;