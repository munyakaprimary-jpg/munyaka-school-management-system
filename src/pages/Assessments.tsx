"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save, FileDown, Loader2, Users, Search } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, STUDENTS, Grade } from '@/lib/mock-data';

interface LearningArea {
  id: string;
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
}

interface ClusterData {
  id: string;
  name: string;
  learningAreas: LearningArea[];
}

interface ExamType {
  id: string;
  name: string;
  code: string;
}

// Matrix state type: [studentId][subjectId] = score
type ScoreMatrix = Record<string, Record<string, string>>;

const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    learningAreas: [
      { id: "pp-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "pp-2", name: "Language", periodsPerWeek: 5, type: "Core" },
      { id: "pp-3", name: "Env", periodsPerWeek: 4, type: "Core" },
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    learningAreas: [
      { id: "lp-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "lp-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "lp-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "lp-4", name: "Env", periodsPerWeek: 4, type: "Core" },
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    learningAreas: [
      { id: "up-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "up-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "up-4", name: "Science", periodsPerWeek: 4, type: "Core" },
      { id: "up-5", name: "Agri", periodsPerWeek: 4, type: "Core" },
      { id: "up-6", name: "Arts", periodsPerWeek: 3, type: "Core" },
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    learningAreas: [
      { id: "js-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "js-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "js-4", name: "Science", periodsPerWeek: 5, type: "Core" },
      { id: "js-6", name: "Pre-Tech", periodsPerWeek: 4, type: "Core" },
    ]
  }
];

const FALLBACK_EXAM_TYPES: ExamType[] = [
  { id: "et-1", name: "Formative", code: "FORMATIVE" },
  { id: "et-2", name: "Summative", code: "SUMMATIVE" },
  { id: "et-3", name: "Mid-Term", code: "MIDTERM" }
];

const Assessments = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Setup data
  const gradesList = useMemo(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  }, []);
  
  const clusters = useMemo(() => {
    const saved = localStorage.getItem('munyaka_learning_areas');
    return saved ? JSON.parse(saved) : FALLBACK_CLUSTERS;
  }, []);

  // Filter States
  const [selectedGradeId, setSelectedGradeId] = useState<string>(gradesList[0]?.id || "");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [examType, setExamType] = useState<string>("SUMMATIVE");
  const [term, setTerm] = useState("term1");
  const [searchQuery, setSearchQuery] = useState("");

  // Matrix State
  const [scores, setScores] = useState<ScoreMatrix>({});

  // Derived Data
  const currentGrade = useMemo(() => gradesList.find((g: Grade) => g.id === selectedGradeId), [selectedGradeId, gradesList]);
  const availableStreams = useMemo(() => currentGrade ? currentGrade.streams : [], [currentGrade]);

  const filteredStudents = useMemo(() => {
    if (!currentGrade || !selectedStreamId) return [];
    const streamObj = availableStreams.find((s: any) => s.id === selectedStreamId);
    if (!streamObj) return [];
    
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');
    return STUDENTS.filter(s => {
      const matchesClass = (s.grade === gradeNum || s.grade === currentGrade.name) && 
                          s.stream.toLowerCase() === streamObj.name.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.assessment.includes(searchQuery);
      return matchesClass && matchesSearch;
    });
  }, [currentGrade, selectedStreamId, availableStreams, searchQuery]);

  const subjects = useMemo(() => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    const category = currentGrade.category;
    let clusterId = 'upper-primary';
    
    if (gradeName.includes("grade 1") || gradeName.includes("grade 2") || gradeName.includes("grade 3")) clusterId = 'lower-primary';
    else if (gradeName.includes("pp") || category === 'Pre-Primary') clusterId = 'pre-primary';
    else if (category === 'Junior School') clusterId = 'junior-school';
    
    return clusters.find((c: ClusterData) => c.id === clusterId)?.learningAreas || [];
  }, [currentGrade, clusters]);

  // Initial stream selection
  useEffect(() => {
    if (availableStreams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(availableStreams[0].id);
    }
  }, [availableStreams, selectedStreamId]);

  const handleScoreChange = (studentId: string, subjectId: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, '');
    if (clean !== '' && parseInt(clean) > 100) clean = "100";
    
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: clean
      }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    showSuccess("Class marks saved successfully!");
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) return;
    setIsExporting(true);
    setTimeout(() => {
      const headers = ["Learner Name", "Assessment ID", ...subjects.map(s => s.name)];
      const rows = filteredStudents.map(student => [
        student.name,
        student.assessment,
        ...subjects.map(s => scores[student.id]?.[s.id] || "")
      ]);
      
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marksheet_${currentGrade?.name}_${term}.csv`;
      link.click();
      setIsExporting(false);
      showSuccess("Marksheet downloaded.");
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Mark Sheet</h1>
          <p className="text-muted-foreground">Enter marks for all learners in {currentGrade?.name || 'selected grade'} at once.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white gap-2 font-bold shadow-sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />} Export CSV
          </Button>
          <Button className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold shadow-lg shadow-indigo-100" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save All Marks
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</label>
            <Select value={selectedGradeId} onValueChange={(v) => { setSelectedGradeId(v); setSelectedStreamId(""); }}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stream</label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId} disabled={availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FALLBACK_EXAM_TYPES.map(et => <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term</label>
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Learner name..." 
                className="rounded-xl h-11 bg-slate-50 border-none pl-9 text-xs" 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 bg-slate-50 z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Learner Details</th>
                {subjects.map(subject => (
                  <th key={subject.id} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-600 text-center min-w-[100px]">
                    {subject.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">{student.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{student.assessment}</p>
                        </div>
                      </div>
                    </td>
                    {subjects.map(subject => (
                      <td key={subject.id} className="px-4 py-4">
                        <div className="flex justify-center">
                          <Input 
                            value={scores[student.id]?.[subject.id] || ""} 
                            onChange={(e) => handleScoreChange(student.id, subject.id, e.target.value)}
                            className="w-14 h-9 text-center font-bold text-slate-700 bg-slate-50 border-none rounded-lg focus:ring-2 ring-indigo-100"
                            placeholder="-"
                            maxLength={3}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={subjects.length + 1} className="py-20 text-center">
                    <div className="flex flex-col items-center text-slate-300">
                      <Users size={48} className="mb-4" />
                      <p className="font-bold text-slate-400">No learners found for selection</p>
                      <p className="text-xs">Check your grade and stream filters above.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="p-2 bg-indigo-600 text-white rounded-lg"><Info size={20} /></div>
        <p className="text-sm font-medium text-indigo-900">
          Entering marks will automatically calculate performance levels based on Ministry guidelines (80+ EE, 50-79 ME, 30-49 AE, <30 BE) during final report generation.
        </p>
      </div>
    </div>
  );
};

export default Assessments;