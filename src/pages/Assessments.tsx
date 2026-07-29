"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save, FileDown, Loader2, Search } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, STUDENTS, Grade } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface LearningArea {
  id: string;
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
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
}

const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    description: "Early childhood development learning areas (PP1 & PP2)",
    learningAreas: [
      { id: "pp-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "pp-2", name: "Language", periodsPerWeek: 5, type: "Core" },
      { id: "pp-3", name: "Env", periodsPerWeek: 4, type: "Core" },
      { id: "pp-4", name: "Creative", periodsPerWeek: 5, type: "Core" },
      { id: "pp-5", name: "RE", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    description: "Foundational learning areas for Grades 1, 2, and 3",
    learningAreas: [
      { id: "lp-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "lp-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "lp-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "lp-4", name: "Env", periodsPerWeek: 4, type: "Core" },
      { id: "lp-5", name: "Nutrition", periodsPerWeek: 2, type: "Core" },
      { id: "lp-6", name: "Creative", periodsPerWeek: 4, type: "Core" },
      { id: "lp-7", name: "RE", periodsPerWeek: 3, type: "Core" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    description: "Intermediate learning areas for Grades 4, 5, and 6",
    learningAreas: [
      { id: "up-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "up-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "up-4", name: "Science", periodsPerWeek: 4, type: "Core" },
      { id: "up-5", name: "Agri", periodsPerWeek: 4, type: "Core" },
      { id: "up-6", name: "Arts", periodsPerWeek: 3, type: "Core" },
      { id: "up-7", name: "Social", periodsPerWeek: 3, type: "Core" },
      { id: "up-8", name: "RE", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    description: "Secondary preparation learning areas for Grades 7, 8, and 9",
    learningAreas: [
      { id: "js-1", name: "Math", periodsPerWeek: 5, type: "Core" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "js-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "js-4", name: "Science", periodsPerWeek: 5, type: "Core" },
      { id: "js-5", name: "Health", periodsPerWeek: 2, type: "Core" },
      { id: "js-6", name: "Tech", periodsPerWeek: 4, type: "Core" },
      { id: "js-7", name: "Social", periodsPerWeek: 3, type: "Core" },
      { id: "js-8", name: "Agri", periodsPerWeek: 3, type: "Core" },
      { id: "js-9", name: "Business", periodsPerWeek: 3, type: "Core" }
    ]
  }
];

const FALLBACK_EXAM_TYPES: ExamType[] = [
  { id: "et-1", name: "Formative", code: "FORMATIVE", weight: 40, category: "Formative" },
  { id: "et-2", name: "Summative", code: "SUMMATIVE", weight: 60, category: "Summative" },
  { id: "et-3", name: "Opener", code: "OPENER", weight: 0, category: "Other" },
  { id: "et-4", name: "Mid-Term", code: "MIDTERM", weight: 0, category: "Other" }
];

const Assessments = () => {
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filters
  const [selectedGradeId, setSelectedGradeId] = useState<string>(gradesList[0]?.id || "");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [examType, setExamType] = useState<string>(examTypes[0]?.code || "SUMMATIVE");
  const [term, setTerm] = useState("term1");

  // Marks data: Record<studentId, Record<subjectId, string>>
  const [marksGrid, setMarksGrid] = useState<Record<string, Record<string, string>>>({});

  // Derived
  const currentGrade = useMemo(() => gradesList.find(g => g.id === selectedGradeId), [selectedGradeId, gradesList]);
  const availableStreams = useMemo(() => currentGrade ? currentGrade.streams : [], [currentGrade]);

  const filteredStudents = useMemo(() => {
    if (!currentGrade || !selectedStreamId) return [];
    const selectedStreamObj = availableStreams.find(s => s.id === selectedStreamId);
    if (!selectedStreamObj) return [];
    
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');
    let list = STUDENTS.filter(s => 
      (s.grade === gradeNum || s.grade === currentGrade.name) && 
      s.stream.toLowerCase() === selectedStreamObj.name.toLowerCase()
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(query) || s.assessment.toLowerCase().includes(query));
    }

    return list;
  }, [currentGrade, selectedStreamId, availableStreams, searchQuery]);

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
    if (availableStreams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(availableStreams[0].id);
    }
  }, [availableStreams, selectedStreamId]);

  // Handlers
  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, '');
    if (clean !== '' && parseInt(clean) > 100) clean = "100";
    
    setMarksGrid(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: clean
      }
    }));
  };

  const getPerfLevel = (scoreStr: string) => {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return null;
    if (score >= 80) return { code: "EE", color: "text-emerald-600 bg-emerald-50" };
    if (score >= 50) return { code: "ME", color: "text-blue-600 bg-blue-50" };
    if (score >= 30) return { code: "AE", color: "text-amber-600 bg-amber-50" };
    return { code: "BE", color: "text-rose-600 bg-rose-50" };
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners to export.");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      const headers = ["Learner Name", "Assessment ID", ...filteredLearningAreas.map(a => a.name)];
      const rows = filteredStudents.map(s => [
        s.name,
        s.assessment,
        ...filteredLearningAreas.map(a => marksGrid[s.id]?.[a.id] || "")
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `marks_${currentGrade?.name}_${examType}_${term}.csv`;
      link.click();
      setIsExporting(false);
      showSuccess("Marksheet downloaded successfully.");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marks Entry Ledger</h1>
          <p className="text-sm text-slate-500">Record assessment results across all subjects for a class.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl h-10 border-slate-200 bg-white gap-2 text-xs font-bold shadow-sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
            Download Class Ledger
          </Button>
          <Button 
            className="rounded-xl h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-sm"
            onClick={() => showSuccess("Class marks saved successfully!")}
          >
            <Save size={16} /> Save All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm rounded-2xl bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grade Level</Label>
            <Select value={selectedGradeId} onValueChange={(v) => { setSelectedGradeId(v); setSelectedStreamId(""); }}>
              <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stream</Label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId} disabled={availableStreams.length === 0}>
              <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Exam Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map(et => <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-bold">
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
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quick Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find learner..." 
                className="h-10 pl-8 rounded-lg bg-slate-50 border-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 sticky left-0 bg-slate-50/50 z-10 w-64">Learner Name</th>
                {filteredLearningAreas.map(area => (
                  <th key={area.id} className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center min-w-[120px]">
                    {area.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{student.assessment}</p>
                    </td>
                    {filteredLearningAreas.map(area => {
                      const score = marksGrid[student.id]?.[area.id] || "";
                      const perf = getPerfLevel(score);
                      return (
                        <td key={area.id} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <Input 
                              value={score}
                              onChange={(e) => handleMarkChange(student.id, area.id, e.target.value)}
                              className="w-16 h-9 rounded-lg text-center font-bold text-slate-800 bg-slate-50 border-none focus:bg-white"
                              placeholder="-"
                            />
                            {perf && (
                              <Badge className={cn("rounded-md text-[10px] font-black border-none px-2 py-0", perf.color)}>
                                {perf.code}
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={filteredLearningAreas.length + 1} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Info size={40} strokeWidth={1} />
                      <p className="font-medium">Please select a Grade and Stream to load learners.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Guide Banner */}
      <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
          <Info size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">Direct Spreadsheet Entry</p>
          <p className="text-xs text-indigo-700/80">You are in class-wide entry mode. Scores are automatically categorized (EE, ME, AE, BE) as you type.</p>
        </div>
      </div>
    </div>
  );
};

export default Assessments;