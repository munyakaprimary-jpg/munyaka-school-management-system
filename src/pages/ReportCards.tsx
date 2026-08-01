"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { Download, Search, Save, Loader2, Layers, FileSpreadsheet } from 'lucide-react';
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

// Helper to get filtered students
const getFilteredStudents = (storedGrades: Grade[], searchTerm: string, gradeId: string, streamId: string) => {
  return storedGrades.filter(s => {
    const matchesSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeId === 'all' || s.grade === gradeId;
    const matchesStream = streamId === 'all' || s.stream.toLowerCase() === streamId.toLowerCase();
    return matchesSearch && matchesGrade && matchesStream;
  });
};

// Helper to get next grade name for ranking
const getGradeRank = (name: string) => {
  const match = name.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (name.toUpperCase().includes('PP1')) return 1;
  if (name.toUpperCase().includes('PP2')) return 2;
  return 0;
};

// Main Component
const ReportCards = () => {
  // State Management
  const [year, setYear] = useState("2026");
  const [grade, setGrade] = useState("4");
  const [stream, setStream] = useState("all");
  const [term, setTerm] = useState("term1");
  const [type, setType] = useState("endterm");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load stored grades from localStorage
  const [storedGrades, setStoredGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Sync localStorage on changes
  useEffect(() => {
    localStorage.setItem('munyaka_grades', JSON.stringify(storedGrades));
  }, [storedGrades]);

  // Compute filtered students based on current filters
  const filteredStudents = useMemo(() => {
    return getFilteredStudents(storedGrades, searchTerm, grade, stream);
  }, [storedGrades, searchTerm, grade, stream]);

  // Compute available streams for current grade
  const availableStreams = useMemo(() => {
    if (!storedGrades || grade === 'all') return [];
    const gradeObj = storedGrades.find(g => g.name === `Grade ${grade}` || g.name === grade);
    return gradeObj?.streams?.map(s => s.name) || [];
  }, [storedGrades, grade]);

  // Compute grade ranking for sorting
  const sortedGrades = useMemo(() => {
    return [...storedGrades].sort((a, b) => {
      const rankA = getGradeRank(a.name);
      const rankB = getGradeRank(b.name);
      if (rankA !== rankB) return rankA - rankB;
      const numA = a.name.replace(/[^0-9]/g, '') || 0;
      const numB = b.name.replace(/[^0-9]/g, '') || 0;
      return numA - numB;
    });
  }, [storedGrades]);

  // Compute grade distribution for stats
  const gradeDistribution = useMemo(() => {
    const counts = { EE: 0, ME: 0, AE: 0, BE: 0 };
    filteredStudents.forEach(s => {
      const score = getScoreForStudentSubject(s.id, 'any', storedGrades);
      if (score >= 80) counts.EE++;
      else if (score >= 50) counts.ME++;
      else if (score >= 30) counts.AE++;
      else counts.BE++;
    });
    return counts;
  }, [filteredStudents]);

  // Calculate class mean score
  const classMeanScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const total = filteredStudents.reduce((sum, s) => sum + getScoreForStudentSubject(s.id, 'any', storedGrades), 0);
    return Math.round((total / filteredStudents.length) * 10) / 10;
  }, [filteredStudents.length, storedGrades]);

  // Download PDF handler
  const handleDownloadPDF = () => {
    setIsExporting(true);
    const element = wrapperRef.current;
    if (!element) {
      setIsExporting(false);
      return;
    }
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `munyaka_report_${grade}_${term}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
    setIsExporting(false);
  };

  // Download CSV handler
  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners found for the current filters.");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      const headers = [
        "Rank", "Assessment No", "Student Name", "Stream", "Grade", "Term", "Total Marks", "Mean Score", "Level"
      ];
      const rows = filteredStudents.map((s, idx) => {
        const scores = getScoresForStudent(s.id, storedGrades);
        const total = scores.reduce((a, b) => a + b, 0);
        const mean = Math.round((total / subjectsCount) * 10) / 10;
        const level = getRubric(mean);
        return [
          `${idx + 1}`,
          `"${s.assessment}"`,
          `"${s.name}"`,
          `"${s.stream}"`,
          `"Grade ${s.grade}"`,
          `"${term}"`,
          `${total}`,
          `${mean}%`,
          `${level}`
        ];
      });
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `munyaka_report_${grade}_${term}_${year}.csv`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      showSuccess(`Exported ${filteredStudents.length} learners to CSV`);
    }, 800);
  };

  // Download current learner data
  const downloadCurrentLearner = (learnerId: string) => {
    const learner = filteredStudents.find(l => l.id === learnerId);
    if (!learner) {
      showError("Learner not found");
      return;
    }
    const csvContent = [
      "Learner ID,Name,Assessment No,Grade,Stream,Term,Total Marks,Mean Score,Level",
      `"${learner.id}","${learner.name}","${learner.assessment}","${learner.grade}","${learner.stream}","${term}","${learner.totalMarks}","${learner.meanScore}%","${learner.level}"`
    ].split('\n').join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${learner.name}_current.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess(`Downloaded ${learner.name}'s data`);
  };

  // Helper to get scores for a student
  const getScoresForStudent = (studentId: string) => {
    const scores: Record<string, number> = {};
    filteredStudents.forEach(s => {
      if (s.id === studentId) {
        storedGrades.forEach(g => {
          if (g.id === s.grade) {
            g.learningAreas.forEach(area => {
              const score = getScoreForStudentSubject(studentId, area.id, storedGrades);
              if (score !== undefined) scores[area.id] = score;
            });
          }
        });
      }
    });
    return scores;
  };

  // Helper to get total marks for a student
  const getScoreForStudentSubject = (studentId: string, subjectId: string, grades: Grade[]) => {
    if (!storedGrades) return 0;
    const student = filteredStudents.find(s => s.id === studentId);
    if (!student) return 0;
    const gradeObj = storedGrades.find(g => g.id === student.grade);
    if (!gradeObj) return 0;
    const score = getScoreForStudentSubject(studentId, subjectId, storedGrades);
    return score;
  };

  // Get total marks for a student
  const getStudentTotal = (studentId: string) => {
    const scores = getScoresForStudent(studentId);
    return Object.values(scores).reduce((a, b) => a + b, 0);
  };

  // Get learner data for a specific ID
  const getLearnerData = (learnerId: string) => {
    const learner = filteredStudents.find(l => l.id === learnerId);
    if (!learner) return null;
    return {
      id: learner.id,
      name: learner.name,
      assessment: learner.assessment,
      grade: learner.grade,
      stream: learner.stream,
      totalMarks: getStudentTotal(learnerId),
      meanScore: getStudentMean(learnerId),
      level: getLevel(learnerId)
    };
  };

  // Helper functions
  const getStudentMean = (studentId: string) => {
    const scores = getScoresForStudent(studentId);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return total / Object.keys(scores).length;
  };

  const getStudentMean = (studentId: string) => {
    const scores = getScoresForStudent(studentId);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return total / Object.keys(scores).length;
  };

  const getLevel = (score: number) => {
    if (score >= 80) return 'EE';
    if (score >= 50) return 'ME';
    if (score >= 30) return 'AE';
    return 'BE';
  };

  // Download current learner data
  const downloadCurrentLearner = (learnerId: string) => {
    const learner = filteredStudents.find(l => l.id === learnerId);
    if (!learner) {
      showError("Learner not found");
      return;
    }
    const csvContent = [
      "Learner ID,Name,Assessment No,Grade,Stream,Term,Total Marks,Mean Score,Level",
      `"${learner.id}","${learner.name}","${learner.assessment}","${learner.grade}","${learner.stream}","${term}","${learner.totalMarks}","${learner.meanScore}%","${learner.level}"`
    ].split('\n').join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${learner.name}_current.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess(`Downloaded ${learner.name}'s data`);
  };

  // Render learner selection modal
  const [isLearnerModalOpen, setIsLearnerModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  const openLearnerModal = () => {
    setSelectedLearner(null);
    setIsLearnerModalOpen(true);
  };

  const handleLearnerSelect = (id: string) => {
    setSelectedLearner(id);
  };

  // Modal content
  const learnerModal = (
    <Modal
      isOpen={isLearnerModalOpen}
      onClose={() => setIsLearnerModalOpen(false)}
      title="Select Learner to Download"
      description="Choose a learner from the filtered list."
      footer={
        <>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400">Learner</Label>
            <Select value={selectedLearner} onValueChange={setSelectedLearner}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="Select learner..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {filteredStudents.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
          </SelectContent>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setIsLearnerModalOpen(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8"
            onClick={() => selectedLearner && downloadCurrentLearner(selectedLearner)}
          >
            Download
          </Button>
        </div>
      </footer>
    </>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section with New Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">CBC Report Generator</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Current Button */}
          <Button 
            variant="outline"
            onClick={handleOpenLearnerModal}
            disabled={!selectedLearner}
            className="rounded-2xl h-11 px-6 bg-slate-200 hover:bg-slate-300 text-slate-600 font-medium gap-2 shadow-sm"
          >
            <Plus size={18} /> Download Current
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadCSV}
            className="rounded-xl h-12 px-5 border-slate-200 bg-white gap-2 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
            Download CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            className="rounded-xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Academic Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {["2024", "2025", "2026"].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {storedGrades.map(g => (
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
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                    <SelectValue placeholder="All Streams" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {availableStreams.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
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
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
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
                <Input 
                  placeholder="Search by name/ID..." 
                  className="pl-11 rounded-2xl h-12 bg-slate-50 border-none font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-indigo-600 text-white p-5">
              <CardContent>
                <p className="text-xs text-white uppercase tracking-widest">Total Students</p>
                <h3 className="text-2xl font-black text-white">{filteredStudents.length}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white p-5">
              <div className="flex items-center gap-2">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-indigo-500">Total Students</p>
                  <h3 className="text-2xl font-black text-white">{filteredStudents.length}</h3>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => (
              <Card key={student.id} className="border-none shadow-sm hover:shadow-md rounded-[2rem] bg-white overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Box size={28} />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-500">ID: {student.assessment}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-lg border-none text-xs font-bold text-slate-400">
                        {student.grade}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {student.stream}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400">Score: {student.scores[0]} / 100</p>
                    <p className="text-sm text-slate-400">Status: {learnerLevel(learner.id)}</p>
                  </div>
                </div>
              </CardContent>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Learner Selection */}
      <Modal
        isOpen={isLearnerModalOpen}
        onClose={() => setIsLearnerModalOpen(false)}
        title="Select Learner to Download"
        description="Choose a learner from the filtered list."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400">Learner</Label>
            <Select value={selectedLearner} onValueChange={setSelectedLearner}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="Select learner..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {filteredStudents.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsLearnerModalOpen(false)} 
              className="rounded-xl font-bold h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8"
              onClick={() => selectedLearner && downloadCurrentLearner(selectedLearner)}
            >
              <Button size={16} /> Download
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-indigo-600 text-white p-5">
          <CardContent>
            <p className="text-xs font-black text-slate-400 uppercase">Class Mean Score</p>
            <h2 className="text-3xl font-black text-white">{classMeanScore}%</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white p-5">
          <CardContent>
            <p className="text-xs text-slate-500">Total Students</p>
            <h3 className="text-2xl font-black text-slate-900">{filteredStudents.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white p-5">
          <CardContent>
            <p className="text-xs text-slate-500">Highest Grade</p>
            <h3 className="text-2xl font-black text-rose-600">{studentResults[0]?.name}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Media Viewer Modal */}
      <ArtifactViewerModal 
        artifact={selectedArtifact} 
        onClose={() => setSelectedArtifact(null)} 
      />

      {/* Export Controls */}
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="ghost" 
          onClick={handleDownloadCSV}
          disabled={isExporting}
          className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold h-11 px-6 gap-2"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={16} />}
          Download CSV
        </Button>
        <Button 
          onClick={handleDownloadPDF}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 shadow-lg shadow-indigo-100 gap-2"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
          Download PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportCards;