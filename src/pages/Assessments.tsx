"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Save, FileDown, Loader2, Search } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, STUDENTS, Grade, Stream } from '@/lib/mock-data';

interface LearningArea {
  id: string;
  name: string;
  type: 'Core' | 'Elective';
}

interface ClusterData {
  id: string;
  name: string;
  learningAreas: LearningArea[];
}

const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    learningAreas: [
      { id: "pp-1", name: "Math", type: "Core" },
      { id: "pp-2", name: "Language", type: "Core" },
      { id: "pp-3", name: "Env", type: "Core" },
      { id: "pp-4", name: "Creative", type: "Core" },
      { id: "pp-5", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    learningAreas: [
      { id: "lp-1", name: "Math", type: "Core" },
      { id: "lp-2", name: "English", type: "Core" },
      { id: "lp-3", name: "Kiswahili", type: "Core" },
      { id: "lp-4", name: "Env", type: "Core" },
      { id: "lp-5", name: "Hygiene", type: "Core" },
      { id: "lp-6", name: "Creative", type: "Core" },
      { id: "lp-7", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    learningAreas: [
      { id: "up-1", name: "Math", type: "Core" },
      { id: "up-2", name: "English", type: "Core" },
      { id: "up-3", name: "Kiswahili", type: "Core" },
      { id: "up-4", name: "Science", type: "Core" },
      { id: "up-5", name: "Agri", type: "Core" },
      { id: "up-6", name: "Arts", type: "Core" },
      { id: "up-7", name: "Social", type: "Core" },
      { id: "up-8", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    learningAreas: [
      { id: "js-1", name: "Math", type: "Core" },
      { id: "js-2", name: "English", type: "Core" },
      { id: "js-3", name: "Kiswahili", type: "Core" },
      { id: "js-4", name: "Science", type: "Core" },
      { id: "js-5", name: "Health", type: "Core" },
      { id: "js-6", name: "Pre-Tech", type: "Core" },
      { id: "js-7", name: "Social", type: "Core" },
      { id: "js-8", name: "Agri", type: "Core" },
      { id: "js-9", name: "Business", type: "Core" }
    ]
  }
];

const Assessments = () => {
  // Dynamically load grades and streams from localStorage or default data
  const gradesList = useMemo(() => {
    const saved = localStorage.getItem('munyaka_grades');
    const rawList: Grade[] = saved ? JSON.parse(saved) : GRADES_DATA;

    return [...rawList].sort((a, b) => {
      const categoryRank: Record<string, number> = {
        'Pre-Primary': 1,
        'Primary': 2,
        'Junior School': 3
      };
      
      const rankA = categoryRank[a.category] || 99;
      const rankB = categoryRank[b.category] || 99;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      const extractNumber = (name: string) => {
        const match = name.match(/\d+/);
        if (match) return parseInt(match[0], 10);
        if (name.toUpperCase().includes('PP1')) return 1;
        if (name.toUpperCase().includes('PP2')) return 2;
        return 0;
      };

      return extractNumber(a.name) - extractNumber(b.name);
    });
  }, []);

  // Filter States
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("all");
  const [examType, setExamType] = useState<string>("SUMMATIVE");
  const [term, setTerm] = useState("term1");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data States
  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Set default selected grade to the first sorted grade on initial load
  useEffect(() => {
    if (!selectedGradeId && gradesList.length > 0) {
      setSelectedGradeId(gradesList[0].id);
    }
  }, [gradesList, selectedGradeId]);

  // Reset stream to 'all' whenever Grade Level changes
  useEffect(() => {
    if (selectedGradeId) {
      setSelectedStreamId("all");
    }
  }, [selectedGradeId]);

  const currentGrade = useMemo(() => 
    gradesList.find((g: Grade) => g.id === selectedGradeId), 
    [selectedGradeId, gradesList]
  );

  // Streams derived dynamically from the selected Grade
  const availableStreams = useMemo(() => 
    currentGrade ? currentGrade.streams : [], 
    [currentGrade]
  );

  const filteredLearningAreas = useMemo(() => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    let clusterId = 'lower-primary';
    if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) clusterId = 'upper-primary';
    else if (gradeName.includes("pp")) clusterId = 'pre-primary';
    else if (currentGrade.category === 'Junior School') clusterId = 'junior-school';
    
    return FALLBACK_CLUSTERS.find(c => c.id === clusterId)?.learningAreas || [];
  }, [currentGrade]);

  // Dynamically filter students based on Grade, Stream, and Search term
  const filteredStudents = useMemo(() => {
    if (!currentGrade) return [];
    
    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');

    return STUDENTS.filter(s => {
      // Match Grade
      const matchesGrade = 
        s.grade === gradeNum || 
        s.grade === currentGrade.name ||
        `Grade ${s.grade}` === currentGrade.name;

      // Match Stream
      let matchesStream = true;
      if (selectedStreamId !== "all") {
        const streamObj = availableStreams.find((sItem: Stream) => sItem.id === selectedStreamId);
        if (streamObj) {
          matchesStream = s.stream.toLowerCase() === streamObj.name.toLowerCase();
        }
      }

      // Match Search Query
      const matchesSearch = 
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.assessment.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [currentGrade, selectedStreamId, availableStreams, searchTerm]);

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    let clean = value.replace(/[^0-9]/g, '');
    if (clean !== '' && parseInt(clean, 10) > 100) clean = "100";
    
    setMarksMatrix(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: clean
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    showSuccess("Marks saved successfully for the selected class.");
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      showSuccess("Exporting class performance report...");
      setIsExporting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marks Entry</h1>
          <p className="text-sm text-slate-500">Record results for all learners in the selected class.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm" onClick={handleExport} disabled={isExporting}>
            <FileDown size={16} /> Export CSV
          </Button>
          <Button className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Grade Level Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade</label>
            <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map((g: Grade) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Stream Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stream</label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {availableStreams.map((s: Stream) => (
                  <SelectItem key={s.id} value={s.id}>
                    Stream {s.name} ({s.teacher})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Type Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FORMATIVE">Formative Task</SelectItem>
                <SelectItem value="SUMMATIVE">Summative Exam</SelectItem>
                <SelectItem value="OPENER">Opener Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Term Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Find Learner</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Name/ID..." 
                className="pl-9 h-10 rounded-xl bg-slate-50 border-none font-bold text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Marks Matrix Table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="sticky left-0 bg-slate-50 z-10 px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-64">
                  Learner Details
                </th>
                {filteredLearningAreas.map(area => (
                  <th key={area.id} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center border-r min-w-[100px]">
                    {area.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-6 py-4 border-r">
                      <p className="font-bold text-slate-900 truncate">{student.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        ID: {student.assessment} • Stream: {student.stream}
                      </p>
                    </td>
                    {filteredLearningAreas.map(area => (
                      <td key={area.id} className="px-2 py-3 border-r text-center">
                        <Input 
                          value={marksMatrix[student.id]?.[area.id] || ""}
                          onChange={(e) => handleMarkChange(student.id, area.id, e.target.value)}
                          placeholder="—"
                          className="w-16 h-10 mx-auto text-center font-black text-sm rounded-lg bg-slate-50 border-none focus:bg-white focus:ring-2 ring-indigo-100 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={filteredLearningAreas.length + 1} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300"><Search size={32} /></div>
                      <p className="text-slate-500 font-bold">No learners found for the selected Grade and Stream.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
        <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
        <div className="space-y-1">
          <p className="text-sm font-bold text-indigo-900">Sheet Instructions</p>
          <p className="text-xs text-indigo-700/80 leading-relaxed">
            Enter numerical scores (0-100) in the boxes. The system automatically handles validation. 
            Levels (EE, ME, etc.) will be calculated automatically on save based on the school's configured grading scale.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assessments;