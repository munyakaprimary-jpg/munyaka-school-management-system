"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  Award, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  ArrowUpRight,
  School,
  Trophy,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  Download
} from 'lucide-react';
import { GRADES_DATA, Grade } from '@/lib/mock-data';
import { getStudents } from '@/services/persistentStore';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useFileDownload } from '@/utils/fileDownloader';

// Types
interface StudentResult {
  rank: number;
  studentId: string;
  name: string;
  assessmentNo: string;
  stream: string;
  scores: Record<string, number>;
  totalMarks: number;
  meanScore: number;
  level: 'EE' | 'ME' | 'AE' | 'BE';
}

interface SubjectSummary {
  id: string;
  name: string;
  mean: number;
  highest: number;
  lowest: number;
  passRate: number;
}

const STORAGE_KEY = 'munyaka_marks_records';

// Grade level ordering for sorting
const GRADE_ORDER = [
  'playgroup', 'pp1', 'pp2', 'grade 1', 'grade 2', 'grade 3',
  'grade 4', 'grade 5', 'grade 6', 'grade 7', 'grade 8', 'grade 9',
  'grade 10', 'grade 11', 'grade 12'
];

const getGradeSortIndex = (gradeName: string): number => {
  const normalized = String(gradeName || '').toLowerCase().trim();
  const index = GRADE_ORDER.findIndex(g => normalized.includes(g));
  return index !== -1 ? index : 999;
};

// Deterministic score generation for demo data
const getScoreForStudentSubject = (
  studentId: string, 
  subjectId: string, 
  savedMarks: Record<string, Record<string, string>>
): number => {
  if (savedMarks[studentId]?.[subjectId]) {
    const parsed = parseInt(savedMarks[studentId][subjectId], 10);
    if (!isNaN(parsed)) return parsed;
  }
  // Deterministic seed
  let hash = 0;
  const str = `${studentId}-${subjectId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 55 + (Math.abs(hash) % 40);
};

const ResultsAnalysis = () => {
  // Filter States
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedGradeId, setSelectedGradeId] = useState<string>(GRADES_DATA[0]?.id || '');
  const [selectedStreamId, setSelectedStreamId] = useState<string>("all");
  const [examType, setExamType] = useState<string>("FORMATIVE");
  const [term, setTerm] = useState<string>("term1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSavedBadge, setShowSavedBadge] = useState<boolean>(false);

  // ====== Unified file-download state for CSV export ======
  const resultsExport = useFileDownload();

  // Load grades from localStorage with fallback
  const [storedGrades, setStoredGrades] = useState<Grade[]>(() => {
    try {
      const stored = localStorage.getItem("munyaka_grades");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading grades:", e);
    }
    return GRADES_DATA;
  });

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("munyaka_grades");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStoredGrades(parsed);
          }
        }
      } catch (e) {
        console.error("Error parsing grades:", e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sort grades logically
  const sortedGrades = useMemo(() => {
    return [...storedGrades].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return getGradeSortIndex(nameA) - getGradeSortIndex(nameB);
    });
  }, [storedGrades]);

  // Selected Grade Object
  const currentGrade = useMemo(() => {
    return storedGrades.find(g => g.id === selectedGradeId) || storedGrades[0];
  }, [storedGrades, selectedGradeId]);

  // Available Streams for the selected Grade
  const availableStreams = useMemo(() => {
    return currentGrade ? currentGrade.streams : [];
  }, [currentGrade]);

  // Learning Areas (Subjects) - filter out PPI and Pastoral
  const learningAreas = useMemo(() => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    let clusterId = 'lower-primary';
    if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) clusterId = 'upper-primary';
    else if (gradeName.includes("pp")) clusterId = 'pre-primary';
    else if (currentGrade.category === 'Junior School') clusterId = 'junior-school';
    
    // Use hardcoded subjects based on cluster
    const subjectMap: Record<string, string[]> = {
      'pre-primary': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Psychomotor & Creative Activities', 'Religious Education'],
      'lower-primary': ['Literacy', 'Kiswahili/Indigenous Language', 'English Language', 'Mathematical Activities', 'Environmental Activities', 'Hygiene & Nutrition Activities', 'Religious Education', 'Movement & Creative Activities'],
      'upper-primary': ['English', 'Kiswahili', 'Mathematics', 'Science & Technology', 'Agriculture & Nutrition', 'Social Studies', 'Religious Education (CRE/IRE/HRE)', 'Creative Arts'],
      'junior-school': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Agriculture & Nutrition', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Computer Science', 'Creative Arts & Sports']
    };
    
    const subjects = subjectMap[clusterId] || subjectMap['lower-primary'];
    return subjects.filter(subj => !subj.toLowerCase().includes('ppi') && !subj.toLowerCase().includes('pastoral'));
  }, [currentGrade]);

  // Filtered Students matching Grade, Stream, and Search
  const filteredStudents = useMemo(() => {
    if (!currentGrade) return [];
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');
    const students = getStudents();

    return students.filter(s => {
      const matchesGrade =
        s.grade === gradeNum ||
        s.grade === currentGrade.name ||
        `Grade ${s.grade}` === currentGrade.name;

      let matchesStream = true;
      if (selectedStreamId !== "all") {
        const streamObj = availableStreams.find(sItem => sItem.id === selectedStreamId);
        if (streamObj) {
          matchesStream = String(s.stream ?? "").toLowerCase() === streamObj.name.toLowerCase();
        }
      }

      const matchesSearch =
              !String(searchTerm || '').trim() ||
              (s.name && String(s.name).toLowerCase().includes(String(searchTerm || '').toLowerCase().trim())) ||
              (s.admNo && String(s.admNo).toLowerCase().includes(String(searchTerm || '').toLowerCase().trim())) ||
              (s.id && String(s.id).toLowerCase().includes(String(searchTerm || '').toLowerCase().trim()));

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [currentGrade, selectedStreamId, availableStreams, searchTerm]);

  // Calculate Student Results & Overall Rank
  const studentResults: StudentResult[] = useMemo(() => {
    const savedMarksRaw = localStorage.getItem(STORAGE_KEY);
    let savedMarks: Record<string, Record<string, string>> = {};
    if (savedMarksRaw) {
      try { savedMarks = JSON.parse(savedMarksRaw); } catch (e) {}
    }

    const rawResults = filteredStudents.map(student => {
      const scores: Record<string, number> = {};
      let total = 0;
      
      learningAreas.forEach(area => {
        const score = getScoreForStudentSubject(student.id, area, savedMarks);
        scores[area] = score;
        total += score;
      });

      const mean = learningAreas.length > 0 ? Math.round((total / learningAreas.length) * 10) / 10 : 0;
      
      let level: 'EE' | 'ME' | 'AE' | 'BE' = 'BE';
      if (mean >= 80) level = 'EE';
      else if (mean >= 65) level = 'ME';
      else if (mean >= 50) level = 'AE';

      return {
        studentId: student.id,
        name: student.name,
        assessmentNo: String((student as any).admissionNumber || (student as any).assessment || student.id),
        stream: student.stream,
        scores,
        totalMarks: total,
        meanScore: mean,
        level,
        rank: 0
      };
    });

    // Sort descending by Total Marks to establish Rank (handle ties)
    rawResults.sort((a, b) => b.totalMarks - a.totalMarks);

    // Assign ranks with tie handling
    let currentRank = 1;
    let previousScore = -1;
    return rawResults.map((item, index) => {
      if (item.totalMarks !== previousScore) {
        currentRank = index + 1;
        previousScore = item.totalMarks;
      }
      return { ...item, rank: currentRank };
    });
  }, [filteredStudents, learningAreas]);

  // Overall Class Mean Score
  const classMeanScore = useMemo(() => {
    if (studentResults.length === 0) return 0;
    const sum = studentResults.reduce((acc, s) => acc + s.meanScore, 0);
    return Math.round((sum / studentResults.length) * 10) / 10;
  }, [studentResults]);

  // Top 3 Performing Students
  const topPerformers = useMemo(() => {
    return studentResults.slice(0, 3);
  }, [studentResults]);

  // Grade Distribution Matrix
  const gradeDistribution = useMemo(() => {
    const counts = { EE: 0, ME: 0, AE: 0, BE: 0 };
    studentResults.forEach(s => {
      counts[s.level]++;
    });
    const total = studentResults.length || 1;
    return {
      EE: { count: counts.EE, pct: Math.round((counts.EE / total) * 100) },
      ME: { count: counts.ME, pct: Math.round((counts.ME / total) * 100) },
      AE: { count: counts.AE, pct: Math.round((counts.AE / total) * 100) },
      BE: { count: counts.BE, pct: Math.round((counts.BE / total) * 100) },
    };
  }, [studentResults]);

  // Subject Performance Ranking (sorted by Subject Mean descending)
  const subjectSummaries: SubjectSummary[] = useMemo(() => {
    if (studentResults.length === 0 || learningAreas.length === 0) return [];

    const summaries = learningAreas.map(area => {
      const allScores = studentResults.map(s => s.scores[area] || 0);
      const sum = allScores.reduce((a, b) => a + b, 0);
      const mean = Math.round((sum / allScores.length) * 10) / 10;
      const highest = Math.max(...allScores);
      const lowest = Math.min(...allScores);
      const passing = allScores.filter(sc => sc >= 50).length;
      const passRate = Math.round((passing / allScores.length) * 100);

      return {
        id: area,
        name: area,
        mean,
        highest,
        lowest,
        passRate
      };
    });

    summaries.sort((a, b) => b.mean - a.mean);
    return summaries;
  }, [studentResults, learningAreas]);

  // Selected Stream Name for Labels
  const selectedStreamName = useMemo(() => {
    if (selectedStreamId === "all") return "Combined (All Streams)";
    const strObj = availableStreams.find(s => s.id === selectedStreamId);
    return strObj ? `${strObj.name} Stream` : "Selected Stream";
  }, [selectedStreamId, availableStreams]);

  // ====== UNIFIED DOWNLOAD HANDLER: CSV export ======
  const handleDownloadCSV = async () => {
    if (studentResults.length === 0) {
      showSuccess("No result records available to export.");
      return;
    }

    const line1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const line2 = "P.O. BOX 5239-30100, ELDORET • TEL: +254 712 345 678";
    const line3 = "ACADEMIC RESULTS ANALYSIS REPORT";
    
    const termLabel = term === 'term1' ? 'Term 1' : term === 'term2' ? 'Term 2' : 'Term 3';

    const line4 = `YEAR: ${academicYear}, GRADE: ${currentGrade.name}, STREAM: ${selectedStreamName}, TERM: ${termLabel}, EXAM: ${examType}`;
    const line5 = `CLASS MEAN SCORE: ${classMeanScore}%, TOTAL LEARNERS: ${studentResults.length}`;

    const headers = ["Rank", "Assessment No", "Student Name", "Stream", ...learningAreas.map(a => (a as any).name), "Total Marks", "Mean Score (%)", "Grade Level"];

    const rows = studentResults.map(s => {
      const subjectScores = learningAreas.map(a => s.scores[a] || 0);
      return [
        s.rank,
        `"${s.assessmentNo}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.stream}"`,
        ...subjectScores,
        s.totalMarks,
        s.meanScore,
        `"${s.level}"`
      ];
    });

    const csvContent = [
      line1,
      line2,
      line3,
      line4,
      line5,
      "",
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const filename = `results_analysis_${currentGrade.name.toLowerCase().replace(/\s+/g, '_')}_${selectedStreamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${term}.csv`;

    await resultsExport.download({
      filename,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
      pendingMessage: 'Downloading results analysis...',
      successMessage: `Exported results analysis for ${studentResults.length} learners!`,
      errorMessage: 'Download failed. Please check app permissions.',
    });
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header & Export Action Controls - stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-full overflow-hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 whitespace-normal break-words">Results Analysis</h1>
            {showSavedBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 break-words hyphens-auto">
            Performance analytics, subject rankings, and class score sheets.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700 w-full sm:w-auto"
            onClick={handleDownloadCSV}
            disabled={resultsExport.isDownloading}
          >
            {resultsExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} className="text-emerald-600" />}
            Download CSV / Excel
          </Button>

          <Button
            variant="outline"
            className="rounded-xl h-11 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 text-slate-700 w-full sm:w-auto"
            onClick={handlePrint}
          >
            <Printer size={16} /> Print Report / Save PDF
          </Button>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY when printing) */}
      <div className="hidden print:block text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-1">
          <School size={36} className="text-slate-900" />
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
        </div>
        <p className="text-xs font-bold text-slate-700">P.O. Box 5239-30100 Eldoret • Tel: +254 712 345 678 • Email: info@munyaka.sc.ke</p>
        <p className="text-sm font-black uppercase tracking-widest text-indigo-900 pt-1">OFFICIAL ACADEMIC RESULTS ANALYSIS REPORT</p>
        <div className="flex justify-center flex-wrap gap-6 pt-2 text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span>Academic Year: {academicYear}</span>
          <span>Grade Level: {currentGrade.name}</span>
          <span>Stream: {selectedStreamName}</span>
          <span>Term: {term.toUpperCase()}</span>
          <span>Exam: {examType}</span>
        </div>
      </div>

      {/* Filter Toolbar (Hidden on Print) - responsive grid */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 print:hidden w-full max-w-full overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Year</label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026"].map(yr => <SelectItem key={yr} value={yr}>{yr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</label>
            <Select value={selectedGradeId} onValueChange={(val) => { setSelectedGradeId(val); setSelectedStreamId("all"); }}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedGrades.map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.category})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stream</label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Combined (All Streams)</SelectItem>
                {availableStreams.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} Stream ({s.studentsCount} Students)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FORMATIVE">Formative Assessment</SelectItem>
                <SelectItem value="SUMMATIVE">Summative Assessment</SelectItem>
                <SelectItem value="OPENER">Opener Exam</SelectItem>
                <SelectItem value="MIDTERM">Mid-Term Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Name/ID..." 
                className="pl-9 h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Average</label>
            <div className="h-11 rounded-xl bg-indigo-50 px-3 flex items-center justify-between">
              <span className="font-black text-indigo-700 text-sm">{classMeanScore}%</span>
              <span className="text-[10px] font-bold text-indigo-500">{studentResults.length} Students</span>
            </div>
          </div>

        </div>
      </Card>

      {/* Analytics Summary Stats (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-600 text-white p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
            <BarChart3 size={96} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Class Mean Score</p>
            <h3 className="text-4xl font-black text-white mt-1">{classMeanScore}%</h3>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-500/50 flex items-center justify-between text-xs font-bold text-indigo-100">
            <span>Overall Cohort Average</span>
            <Badge className="bg-white/20 text-white border-none">{currentGrade.name}</Badge>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Analyzed</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{studentResults.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={22} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-4">{selectedStreamName}</p>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Performer</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">
                {studentResults[0] ? `${studentResults[0].meanScore}%` : '0%'}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Trophy size={22} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-4">
            Top Student: {studentResults[0]?.name || 'N/A'}
          </p>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subjects Analyzed</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{learningAreas.length}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <BookOpen size={22} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-4">CBC Curriculum Areas</p>
        </Card>
      </div>

      {/* Grade Distribution & Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution Matrix */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white p-8">
          <CardHeader className="px-0 pt-0 pb-6 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black text-slate-900">Grade Distribution Matrix</CardTitle>
              <Badge variant="outline" className="rounded-lg border-slate-200 font-bold">
                {studentResults.length} Learners
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-emerald-600 text-white font-black text-[10px]">EE</Badge>
                  <span className="text-xs font-bold text-emerald-700">80-100%</span>
                </div>
                <p className="text-2xl font-black text-emerald-900">{gradeDistribution.EE.count}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">{gradeDistribution.EE.pct}% of class</p>
              </div>

              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-blue-600 text-white font-black text-[10px]">ME</Badge>
                  <span className="text-xs font-bold text-blue-700">65-79%</span>
                </div>
                <p className="text-2xl font-black text-blue-900">{gradeDistribution.ME.count}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">{gradeDistribution.ME.pct}% of class</p>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-amber-600 text-white font-black text-[10px]">AE</Badge>
                  <span className="text-xs font-bold text-amber-700">50-64%</span>
                </div>
                <p className="text-2xl font-black text-amber-900">{gradeDistribution.AE.count}</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">{gradeDistribution.AE.pct}% of class</p>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-rose-600 text-white font-black text-[10px]">BE</Badge>
                  <span className="text-xs font-bold text-rose-700">0-49%</span>
                </div>
                <p className="text-2xl font-black text-rose-900">{gradeDistribution.BE.count}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase mt-1">{gradeDistribution.BE.pct}% of class</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Class Performance Spread</p>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${gradeDistribution.EE.pct}%` }} className="bg-emerald-500 transition-all duration-500" title={`EE: ${gradeDistribution.EE.pct}%`} />
                <div style={{ width: `${gradeDistribution.ME.pct}%` }} className="bg-blue-500 transition-all duration-500" title={`ME: ${gradeDistribution.ME.pct}%`} />
                <div style={{ width: `${gradeDistribution.AE.pct}%` }} className="bg-amber-500 transition-all duration-500" title={`AE: ${gradeDistribution.AE.pct}%`} />
                <div style={{ width: `${gradeDistribution.BE.pct}%` }} className="bg-rose-500 transition-all duration-500" title={`BE: ${gradeDistribution.BE.pct}%`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Performing Students Card */}
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
          <CardHeader className="px-0 pt-0 pb-6 border-b">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="text-amber-500" size={22} /> Top Performers
            </CardTitle>
            <CardDescription>Highest ranking learners in this assessment cohort.</CardDescription>
          </CardHeader>

          <CardContent className="px-0 pt-6 space-y-4">
            {topPerformers.map((student, idx) => (
              <div key={student.studentId} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm",
                    idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-amber-700"
                  )}>
                    #{student.rank}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{student.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Stream: {student.stream} • ID: {student.assessmentNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600 text-base">{student.meanScore}%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{student.totalMarks} pts</p>
                </div>
              </div>
            ))}

            {topPerformers.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">
                No student results found for selected cohort.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Ranking Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/40">
          <CardTitle className="text-xl font-black text-slate-900">Subject Performance Ranking</CardTitle>
          <CardDescription>Learning areas ranked by average class score from highest to lowest.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Rank</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Learning Area</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Subject Mean</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Highest Score</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Lowest Score</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Pass Rate (≥50%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectSummaries.map((subj, idx) => (
                  <tr key={subj.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-8 py-5 font-bold text-slate-900">{subj.name}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                        {subj.mean}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-emerald-600">{subj.highest}%</td>
                    <td className="px-8 py-5 text-center font-bold text-rose-500">{subj.lowest}%</td>
                    <td className="px-8 py-5 text-right">
                      <Badge className={cn("font-bold", subj.passRate >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {subj.passRate}% Meeting Threshold
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Complete Class Breakdown Table - UNIFIED SCROLLING, NO STICKY COLUMNS */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden print:shadow-none print:rounded-none">
        <CardHeader className="p-8 border-b bg-slate-50/40 print:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 action-bar">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Class Results Breakdown</CardTitle>
              <CardDescription>Official score sheet showing individual subject scores, total marks, mean score, and overall rank.</CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-xl print:hidden">
              {studentResults.length} Students Ranked
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto block">
            <table className="w-full text-sm text-left border-collapse min-w-[650px] table-auto">
              <thead className="bg-slate-50/80 border-b">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-16 text-center">
                    Rank
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-slate-400 border-r min-w-[200px]">
                    Student Name & Admin No
                  </th>
                  {selectedStreamId === "all" && (
                    <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r">
                      Stream
                    </th>
                  )}
                  {learningAreas.map(area => (
                    <th key={area} className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-slate-600 text-center border-r min-w-[90px]">
                      {area}
                    </th>
                  ))}
                  <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-indigo-700 text-center bg-indigo-50/50 min-w-[90px]">
                    Total Marks
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-indigo-700 text-center bg-indigo-50/50 min-w-[90px]">
                    Mean (%)
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-slate-700 text-center min-w-[90px]">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentResults.length > 0 ? (
                  studentResults.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-black text-center border-r text-slate-900">
                        #{student.rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r">
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Admin No: {student.assessmentNo}</p>
                      </td>
                      {selectedStreamId === "all" && (
                        <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-slate-600 border-r">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                            {student.stream}
                          </Badge>
                        </td>
                      )}
                      {learningAreas.map(area => (
                        <td key={area} className="px-3 py-3 whitespace-nowrap border-r text-center font-bold text-slate-700">
                          {student.scores[area] !== undefined ? student.scores[area] : "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-indigo-50/20 font-black text-indigo-900">
                        {student.totalMarks}
                      </td>
                      <td className="px-4 py-4 text-center bg-indigo-50/20 font-black text-indigo-700 text-base">
                        {student.meanScore}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline" className={cn("font-bold", student.level === 'EE' && "bg-emerald-50 text-emerald-700 border-emerald-200", student.level === 'ME' && "bg-blue-50 text-blue-700 border-blue-200", student.level === 'AE' && "bg-amber-50 text-amber-700 border-amber-200", student.level === 'BE' && "bg-rose-50 text-rose-700 border-rose-200")}>
                          {student.level}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={learningAreas.length + 6} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Search size={36} />
                        </div>
                        <p className="text-slate-500 font-bold">No student result records found for the selected Grade and Stream.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Official Footer Notice (Visible ONLY on Print) */}
      <div className="hidden print:block text-center pt-8 border-t border-slate-300 text-xs text-slate-500 space-y-2">
        <div className="flex justify-between px-12 pt-6 pb-12 font-bold text-slate-800">
          <div>
            <p>Class Teacher Signature: .......................................</p>
            <p className="text-[10px] text-slate-400 font-normal mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p>Headteacher Stamp & Sign: .......................................</p>
            <p className="text-[10px] text-slate-400 font-normal mt-1">Official Seal</p>
          </div>
        </div>
        <p>This is an official computer-generated Results Analysis Report for Munyaka Primary and Junior School.</p>
      </div>

    </div>
  );
};

export default ResultsAnalysis;