"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, Grade } from '@/lib/mock-data';

interface StudentMark {
  id: number;
  name: string;
  score: string;
  performance: string;
  comment: string;
}

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

const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    description: "Early childhood development learning areas",
    learningAreas: [
      { id: "pp-1", name: "Mathematical Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-2", name: "Language Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-3", name: "Environmental Activities", periodsPerWeek: 4, type: "Core" },
      { id: "pp-4", name: "Psychomotor Activities", periodsPerWeek: 5, type: "Core" },
      { id: "pp-5", name: "Religious Education", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    description: "Foundational learning areas for Grades 1-3",
    learningAreas: [
      { id: "lp-1", name: "Mathematics Activities", periodsPerWeek: 5, type: "Core" },
      { id: "lp-2", name: "English Language Activities", periodsPerWeek: 5, type: "Core" },
      { id: "lp-3", name: "Kiswahili Language Activities", periodsPerWeek: 4, type: "Core" },
      { id: "lp-4", name: "Environmental Activities", periodsPerWeek: 4, type: "Core" },
      { id: "lp-5", name: "Hygiene and Nutrition", periodsPerWeek: 2, type: "Core" },
      { id: "lp-6", name: "Movement and Creative Activities", periodsPerWeek: 4, type: "Core" },
      { id: "lp-7", name: "Religious Education", periodsPerWeek: 3, type: "Core" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    description: "Intermediate learning areas for Grades 4-6",
    learningAreas: [
      { id: "up-1", name: "Mathematics", periodsPerWeek: 5, type: "Core" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "up-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "up-4", name: "Science and Technology", periodsPerWeek: 4, type: "Core" },
      { id: "up-5", name: "Agriculture and Nutrition", periodsPerWeek: 4, type: "Core" },
      { id: "up-6", name: "Creative Arts", periodsPerWeek: 3, type: "Core" },
      { id: "up-7", name: "Social Studies", periodsPerWeek: 3, type: "Core" },
      { id: "up-8", name: "Religious Education", periodsPerWeek: 2, type: "Core" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    description: "Secondary preparation learning areas for Grades 7-9",
    learningAreas: [
      { id: "js-1", name: "Mathematics", periodsPerWeek: 5, type: "Core" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core" },
      { id: "js-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core" },
      { id: "js-4", name: "Integrated Science", periodsPerWeek: 5, type: "Core" },
      { id: "js-5", name: "Health Education", periodsPerWeek: 2, type: "Core" },
      { id: "js-6", name: "Pre-Technical Studies", periodsPerWeek: 4, type: "Core" },
      { id: "js-7", name: "Social Studies", periodsPerWeek: 3, type: "Core" },
      { id: "js-8", name: "Agriculture", periodsPerWeek: 3, type: "Core" }
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
    { code: "BE", label: "Below Expectation", color: "bg-red-100 text-red-700" },
  ];

  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([
    { id: 1, name: "Brian Kiptoo", score: "", performance: "", comment: "" },
    { id: 2, name: "Mary Atieno", score: "", performance: "", comment: "" },
    { id: 3, name: "Emmanuel Maina", score: "", performance: "", comment: "" },
    { id: 4, name: "Sheila Chepkoech", score: "", performance: "", comment: "" },
    { id: 5, name: "David Mutua", score: "", performance: "", comment: "" },
  ]);

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

  const [selectedGradeId, setSelectedGradeId] = useState<string>(() => gradesList[0]?.id || "");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [examType, setExamType] = useState<string>(() => examTypes[0]?.code || "SUMMATIVE");
  const [year, setYear] = useState("2024");
  const [term, setTerm] = useState("term1");
  const [subject, setSubject] = useState<string>("");

  const currentGrade = gradesList.find(g => g.id === selectedGradeId);
  const availableStreams = currentGrade ? currentGrade.streams : [];

  const getFilteredLearningAreas = (): LearningArea[] => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    const category = currentGrade.category;

    let matchedClusters: ClusterData[] = [];
    if (gradeName.includes("grade 1") || gradeName.includes("grade 2") || gradeName.includes("grade 3")) {
      matchedClusters = clusters.filter(c => c.id === 'lower-primary');
    } else if (gradeName.includes("grade 4") || gradeName.includes("grade 5") || gradeName.includes("grade 6")) {
      matchedClusters = clusters.filter(c => c.id === 'upper-primary');
    } else if (gradeName.includes("pp") || category === 'Pre-Primary') {
      matchedClusters = clusters.filter(c => c.id === 'pre-primary');
    } else {
      matchedClusters = clusters.filter(c => c.id === 'junior-school');
    }
    return matchedClusters.flatMap(c => c.learningAreas);
  };

  const filteredLearningAreas = getFilteredLearningAreas();

  useEffect(() => {
    if (availableStreams.length > 0) {
      setSelectedStreamId(availableStreams[0].id);
    } else {
      setSelectedStreamId("");
    }
  }, [selectedGradeId]);

  useEffect(() => {
    const areas = getFilteredLearningAreas();
    if (areas.length > 0) {
      setSubject(areas[0].id);
    } else {
      setSubject("");
    }
  }, [selectedGradeId]);

  const getPerformanceFromScore = (scoreStr: string): string => {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return "";
    if (score >= 80) return "EE";
    if (score >= 50) return "ME";
    if (score >= 30) return "AE";
    return "BE";
  };

  const handleScoreChange = (id: number, scoreVal: string) => {
    let cleanScore = scoreVal.replace(/[^0-9]/g, '');
    if (cleanScore !== '') {
      const num = parseInt(cleanScore);
      if (num > 100) cleanScore = "100";
      if (num < 0) cleanScore = "0";
    }
    const autoPerformance = getPerformanceFromScore(cleanScore);

    setStudentMarks(prev => prev.map(student => {
      if (student.id === id) {
        return {
          ...student,
          score: cleanScore,
          performance: autoPerformance || student.performance
        };
      }
      return student;
    }));
  };

  const handleSubmit = () => {
    showSuccess('Marks submitted and saved successfully!');
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CBC Marksheet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Grade students on specific learning outcomes.</p>
        </div>
        <Button className="rounded-xl h-9 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5" onClick={handleSubmit}>
          <Save size={15} /> Submit Marks
        </Button>
      </div>

      <Card className="border-none bg-indigo-50/50 shadow-none rounded-2xl p-4 border border-indigo-100">
        <div className="flex items-center gap-3">
          <Info className="text-indigo-600 shrink-0" size={18} />
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Performance Levels:</span>
            {performanceLevels.map(lvl => (
              <div key={lvl.code} className="flex items-center gap-1.5">
                <Badge className={`${lvl.color} font-bold text-[10px] px-2 py-0.5`}>{lvl.code}</Badge>
                <span className="text-xs font-medium text-slate-600">{lvl.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade Level</label>
            <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stream</label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId} disabled={availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map(et => (
                  <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Area</label>
            <Select value={subject} onValueChange={setSubject} disabled={filteredLearningAreas.length === 0}>
              <SelectTrigger className="rounded-xl h-9 text-xs bg-slate-50 border-none">
                <SelectValue placeholder="Learning Area" />
              </SelectTrigger>
              <SelectContent>
                {filteredLearningAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Task / Topic</label>
            <Input placeholder="Task description..." className="rounded-xl h-9 bg-slate-50 border-none text-xs" />
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-500">Student Name</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-500 w-32">Score (%)</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-500 w-44">Performance Level</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-500">Teacher Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentMarks.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{student.name}</td>
                    <td className="px-5 py-3.5">
                      <Input 
                        type="text"
                        value={student.score}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        className="w-16 h-8 rounded-lg text-center font-bold bg-slate-50 border-slate-100 text-xs"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <Select 
                        value={student.performance} 
                        onValueChange={(val) => {
                          setStudentMarks(prev => prev.map(s => s.id === student.id ? { ...s, performance: val } : s));
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 rounded-lg bg-slate-50 border-slate-100 text-xs font-bold">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {performanceLevels.map(lvl => (
                            <SelectItem key={lvl.code} value={lvl.code}>
                              <span className="font-bold">{lvl.code}</span> - {lvl.label.split(' ')[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3.5">
                      <Input 
                        value={student.comment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentMarks(prev => prev.map(s => s.id === student.id ? { ...s, comment: val } : s));
                        }}
                        className="h-8 rounded-lg bg-slate-50 border-slate-100 text-xs" 
                        placeholder="e.g. Good progress" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessments;