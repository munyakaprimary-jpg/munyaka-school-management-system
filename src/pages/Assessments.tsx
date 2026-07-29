"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save, Users, CheckCircle, XCircle, User, FileDown, Loader2 } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, STUDENTS, Grade, Stream } from '@/lib/mock-data';

interface LearningArea {
  id: string;
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
  description?: string;
}

interface ClusterData {
  id: string;
  name: string;
  description: string;
  learningAreas: LearningArea[];
}

interface ExamType {
  id: string;
  name: string;
  code: string;
  weight: number;
  category: string;
  description?: string;
}

interface SubjectScore {
  subjectId: string;
  subjectName: string;
  score: string;
  performance: string;
  comment: string;
}

const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    description: "Early childhood development learning areas (PP1 & PP2)",
    learningAreas: [
      { id: "pp-1", name: "Mathematical Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-2", name: "Language Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-3", name: "Environmental Activities", periodsPerWeek: 4, type: "Core" },
      { id: "pp-4", name: "Psychomotor and Creative Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-5", name: "Religious Education Activities", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    description: "Foundational learning areas for Grades 1, 2, and 3",
    learningAreas: [
      { id: "lp-1", name: "Mathematics Activities", periodsPerWeek: 5, type: "Core" },
      { id: "lp-2", name: "English Language Activities", periodsPerWeek: 5, type: "Core" },
      { id: "lp-3", name: "Kiswahili Language Activities / KSL", periodsPerWeek: 4, type: "Core" },
      { id: "lp-4", name: "Environmental Activities", periodsPerWeek: 4, type: "Core" },
      { id: "lp-5", name: "Hygiene and Nutrition Activities", periodsPerWeek: 2, type: "Core" },
      { id: "lp-6", name: "Movement and Creative Activities", periodsPerWeek: 4, type: "Core" },
      { id: "lp-7", name: "Religious Education (CRE/IRE/HRE)", periodsPerWeek: 3, type: "Core" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    description: "Intermediate learning areas for Grades 4, 5, and 6",
    learningAreas: [
      { id: "up-1", name: "Mathematics", periodsPerWeek: 5, type: "Core" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "up-3", name: "Kiswahili / Kenya Sign Language", periodsPerWeek: 4, type: "Core" },
      { id: "up-4", name: "Science and Technology", periodsPerWeek: 4, type: "Core" },
      { id: "up-5", name: "Agriculture and Nutrition", periodsPerWeek: 4, type: "Core" },
      { id: "up-6", name: "Creative Arts (Art, Craft & Music)", periodsPerWeek: 3, type: "Core" },
      { id: "up-7", name: "Social Studies", periodsPerWeek: 3, type: "Core" },
      { id: "up-8", name: "Religious Education (CRE/IRE/HRE)", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    description: "Secondary preparation learning areas for Grades 7, 8, and 9",
    learningAreas: [
      { id: "js-1", name: "Mathematics", periodsPerWeek: 5, type: "Core" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "js-3", name: "Kiswahili / Kenya Sign Language", periodsPerWeek: 4, type: "Core" },
      { id: "js-4", name: "Integrated Science", periodsPerWeek: 5, type: "Core" },
      { id: "js-5", name: "Health Education", periodsPerWeek: 2, type: "Core" },
      { id: "js-6", name: "Pre-Technical Studies", periodsPerWeek: 4, type: "Core" },
      { id: "js-7", name: "Social Studies", periodsPerWeek: 3, type: "Core" },
      { id: "js-8", name: "Agriculture", periodsPerWeek: 3, type: "Core" },
      { id: "js-9", name: "Business Studies", periodsPerWeek: 3, type: "Core" },
      { id: "js-10", name: "Computer Science", periodsPerWeek: 3, type: "Elective" },
      { id: "js-11", name: "Foreign Languages (French/German)", periodsPerWeek: 3, type: "Elective" }
    ]
  }
];

const FALLBACK_EXAM_TYPES: ExamType[] = [
  { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative" },
  { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative" },
  { id: "et-3", name: "Opener Exam", code: "OPENER", weight: 0, category: "Other" },
  { id: "et-4", name: "Mid-Term Exam", code: "MIDTERM", weight: 0, category: "Other" }
];

const Assessments = () => {
  const performanceLevels = [
    { code: "EE", label: "Exceeding Expectation", color: "bg-emerald-100 text-emerald-700" },
    { code: "ME", label: "Meeting Expectation", color: "bg-blue-100 text-blue-700" },
    { code: "AE", label: "Approaching Expectation", color: "bg-amber-100 text-amber-700" },
    { code: "BE", label: "Below Expectation", color: "bg-rose-100 text-rose-700" },
  ];

  // States
  const [isExporting, setIsExporting] = useState(false);
  const [gradesList] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });
  const [clusters] = useState<ClusterData[]>(() => {
    const saved = localStorage.getItem('munyaka_learning_areas');
    return saved ? JSON.parse(saved) : FALLBACK_CLUSTERS;
  });
  const [examTypes] = useState<ExamType[]>(() => {
    const saved = localStorage.getItem('munyaka_exam_types');
    return saved ? JSON.parse(saved) : FALLBACK_EXAM_TYPES;
  });

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

  // Dropdown states
  const [selectedGradeId, setSelectedGradeId] = useState<string>(gradesList[0]?.id || "");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [examType, setExamType] = useState<string>(examTypes[0]?.code || "SUMMATIVE");
  const [year, setYear] = useState(currentYear.toString());
  const [term, setTerm] = useState("term1");

  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  // Derived
  const currentGrade = useMemo(() => gradesList.find(g => g.id === selectedGradeId), [selectedGradeId, gradesList]);
  const availableStreams = useMemo(() => currentGrade ? currentGrade.streams : [], [currentGrade]);

  const filteredStudents = useMemo(() => {
    if (!currentGrade || !selectedStreamId) return [];
    const selectedStreamObj = availableStreams.find(s => s.id === selectedStreamId);
    if (!selectedStreamObj) return [];
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');
    return STUDENTS.filter(s => (s.grade === gradeNum || s.grade === currentGrade.name) && s.stream.toLowerCase() === selectedStreamObj.name.toLowerCase());
  }, [currentGrade, selectedStreamId, availableStreams]);

  const filteredLearningAreas = useMemo(() => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    const category = currentGrade.category;
    let matched: ClusterData[] = [];
    if (gradeName.includes("grade 1") || gradeName.includes("grade 2") || gradeName.includes("grade 3")) matched = clusters.filter(c => c.id === 'lower-primary');
    else if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) matched = clusters.filter(c => c.id === 'upper-primary');
    else if (gradeName.includes("pp") || category === 'Pre-Primary') matched = clusters.filter(c => c.id === 'pre-primary');
    else if (category === 'Junior School') matched = clusters.filter(c => c.id === 'junior-school');
    return matched.flatMap(c => c.learningAreas);
  }, [currentGrade, clusters]);

  // Effects
  useEffect(() => {
    if (availableStreams.length > 0 && !selectedStreamId) setSelectedStreamId(availableStreams[0].id);
  }, [availableStreams, selectedStreamId]);

  useEffect(() => {
    if (filteredStudents.length > 0 && !selectedStudentId) setSelectedStudentId(filteredStudents[0].id);
  }, [filteredStudents, selectedStudentId]);

  useEffect(() => {
    if (filteredLearningAreas.length > 0) {
      setSubjectScores(filteredLearningAreas.map(area => ({
        subjectId: area.id, subjectName: area.name, score: "", performance: "", comment: ""
      })));
    } else {
      setSubjectScores([]);
    }
  }, [filteredLearningAreas]);

  // Handlers
  const handleScoreChange = (subjectId: string, scoreVal: string) => {
    let clean = scoreVal.replace(/[^0-9]/g, '');
    if (clean !== '' && parseInt(clean) > 100) clean = "100";
    const score = parseInt(clean);
    const perf = isNaN(score) ? "" : (score >= 80 ? "EE" : score >= 50 ? "ME" : score >= 30 ? "AE" : "BE");
    setSubjectScores(prev => prev.map(s => s.subjectId === subjectId ? { ...s, score: clean, performance: perf || s.performance } : s));
  };

  const handleDownloadMarks = () => {
    if (!currentGrade || !selectedStreamId || filteredStudents.length === 0) {
      showSuccess("No learners found for the current selection.");
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      const subjects = filteredLearningAreas.map(a => a.name);
      const headers = ["Student Name", "Assessment ID", ...subjects, "Mean Score", "Grade Status"];
      
      const rows = filteredStudents.map(student => {
        // In a real app, we'd fetch actual stored marks here.
        // For now, we generate a template row for the selected class.
        const mockScores = subjects.map(() => ""); 
        return [student.name, student.assessment, ...mockScores, "", "Pending"];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const streamName = availableStreams.find(s => s.id === selectedStreamId)?.name || "";
      link.setAttribute("href", url);
      link.setAttribute("download", `marks_${currentGrade.name}_${streamName}_${term}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      showSuccess(`Marks sheet for ${currentGrade.name} ${streamName} exported.`);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marks Entry</h1>
          <p className="text-muted-foreground">Record assessments and export class performance data.</p>
        </div>
        <Button 
          variant="outline" 
          disabled={isExporting}
          onClick={handleDownloadMarks}
          className="rounded-2xl h-11 px-6 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
          Export Marks Sheet
        </Button>
      </div>

      <Card className="border-none bg-indigo-50/50 shadow-none rounded-3xl overflow-hidden border border-indigo-100">
        <CardContent className="p-6 flex items-center gap-4">
          <Info className="text-indigo-600 shrink-0" size={24} />
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs font-black text-indigo-800 uppercase tracking-wider">Scoring Guide:</span>
            {performanceLevels.map(lvl => (
              <div key={lvl.code} className="flex items-center gap-2">
                <Badge className={`${lvl.color} font-bold shadow-none rounded-lg px-2.5 py-0.5`}>{lvl.code}</Badge>
                <span className="text-xs font-bold text-slate-600">{lvl.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Grade Level</label>
            <Select value={selectedGradeId} onValueChange={(v) => { setSelectedGradeId(v); setSelectedStreamId(""); setSelectedStudentId(""); }}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Stream</label>
            <Select value={selectedStreamId} onValueChange={(v) => { setSelectedStreamId(v); setSelectedStudentId(""); }} disabled={availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Learner</label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={filteredStudents.length === 0}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Learner" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map(et => <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Term</label>
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
        </div>
      </Card>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Scores: {STUDENTS.find(s => s.id === selectedStudentId)?.name || 'Select a learner'}
          </CardTitle>
          <Button variant="ghost" className="rounded-xl font-bold text-indigo-600 hover:bg-indigo-50" onClick={() => showSuccess("Bulk mode disabled")}>Bulk Entry Mode</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Learning Area</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-32">Score (%)</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-48">Level</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjectScores.map((subject) => (
                  <tr key={subject.subjectId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">{subject.subjectName}</td>
                    <td className="px-8 py-5">
                      <Input 
                        value={subject.score} 
                        onChange={(e) => handleScoreChange(subject.subjectId, e.target.value)}
                        className="w-20 h-11 rounded-xl text-center font-bold text-slate-800 bg-slate-50 border-none"
                      />
                    </td>
                    <td className="px-8 py-5">
                      <Select value={subject.performance} onValueChange={(val) => setSubjectScores(prev => prev.map(s => s.subjectId === subject.subjectId ? { ...s, performance: val } : s))}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Level" /></SelectTrigger>
                        <SelectContent>{performanceLevels.map(lvl => <SelectItem key={lvl.code} value={lvl.code}>{lvl.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-8 py-5">
                      <Input value={subject.comment} onChange={(e) => setSubjectScores(prev => prev.map(s => s.subjectId === subject.subjectId ? { ...s, comment: e.target.value } : s))} className="h-11 rounded-xl bg-slate-50 border-none text-sm" placeholder="Brief remark..." />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess("Progress saved!")}>
          <Save size={18} /> Save Progress
        </Button>
      </div>
    </div>
  );
};

export default Assessments;