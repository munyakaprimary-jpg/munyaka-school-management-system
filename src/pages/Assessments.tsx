"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save, Users, CheckCircle, XCircle, User } from "lucide-react";
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

  // Load dynamic grades and streams
  const [gradesList, setGradesList] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Load dynamic learning areas
  const [clusters, setClusters] = useState<ClusterData[]>(() => {
    const saved = localStorage.getItem('munyaka_learning_areas');
    return saved ? JSON.parse(saved) : FALLBACK_CLUSTERS;
  });

  // Load dynamic exam types
  const [examTypes, setExamTypes] = useState<ExamType[]>(() => {
    const saved = localStorage.getItem('munyaka_exam_types');
    return saved ? JSON.parse(saved) : FALLBACK_EXAM_TYPES;
  });

  // Generate dynamic years
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

  // Dropdown states
  const [selectedGradeId, setSelectedGradeId] = useState<string>(() => {
    return gradesList.length > 0 ? gradesList[0].id : "";
  });
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [examType, setExamType] = useState<string>(() => {
    return examTypes.length > 0 ? examTypes[0].code : "SUMMATIVE";
  });
  const [year, setYear] = useState(currentYear.toString());
  const [term, setTerm] = useState("term1");

  // Subject scores state for individual learner
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  // Get current grade and available streams
  const currentGrade = useMemo(() => gradesList.find(g => g.id === selectedGradeId), [selectedGradeId, gradesList]);
  const availableStreams = useMemo(() => currentGrade ? currentGrade.streams : [], [currentGrade]);

  // Dynamically filter students based on selected grade and stream
  const filteredStudents = useMemo(() => {
    if (!currentGrade || !selectedStreamId) return [];
    
    const selectedStreamObj = availableStreams.find(s => s.id === selectedStreamId);
    if (!selectedStreamObj) return [];

    const gradeNum = currentGrade.name.replace(/[^0-9]/g, '');

    return STUDENTS.filter(s => {
      const matchesGrade = s.grade === gradeNum || s.grade === currentGrade.name;
      const matchesStream = s.stream.toLowerCase() === selectedStreamObj.name.toLowerCase();
      return matchesGrade && matchesStream;
    });
  }, [currentGrade, selectedStreamId, availableStreams]);

  // Handle grade change
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedStreamId("");
    setSelectedStudentId("");
  };

  // Handle stream change
  const handleStreamChange = (streamId: string) => {
    setSelectedStreamId(streamId);
    setSelectedStudentId("");
  };

  // Automatically select the first stream/student when lists update
  useEffect(() => {
    if (availableStreams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(availableStreams[0].id);
    }
  }, [availableStreams, selectedStreamId]);

  useEffect(() => {
    if (filteredStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  // Get learning areas filtered by selected grade
  const filteredLearningAreas = useMemo(() => {
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
    } else if (category === 'Junior School' || gradeName.includes("grade 7") || gradeName.includes("grade 8") || gradeName.includes("grade 9")) {
      matchedClusters = clusters.filter(c => c.id === 'junior-school');
    } else {
      if (category === 'Pre-Primary') matchedClusters = clusters.filter(c => c.id === 'pre-primary');
      else if (category === 'Primary') matchedClusters = clusters.filter(c => c.id === 'lower-primary' || c.id === 'upper-primary');
      else if (category === 'Junior School') matchedClusters = clusters.filter(c => c.id === 'junior-school');
    }

    return matchedClusters.flatMap(c => c.learningAreas);
  }, [currentGrade, clusters]);

  // Initialize subject scores
  useEffect(() => {
    if (filteredLearningAreas.length > 0) {
      setSubjectScores(filteredLearningAreas.map(area => ({
        subjectId: area.id,
        subjectName: area.name,
        score: "",
        performance: "",
        comment: ""
      })));
    } else {
      setSubjectScores([]);
    }
  }, [filteredLearningAreas]);

  // Scoring Logic
  const getPerformanceFromScore = (scoreStr: string): string => {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return "";
    if (score >= 80) return "EE";
    if (score >= 50) return "ME";
    if (score >= 30) return "AE";
    return "BE";
  };

  const handleScoreChange = (subjectId: string, scoreVal: string) => {
    let cleanScore = scoreVal.replace(/[^0-9]/g, '');
    if (cleanScore !== '') {
      const num = parseInt(cleanScore);
      if (num > 100) cleanScore = "100";
    }
    const autoPerformance = getPerformanceFromScore(cleanScore);
    setSubjectScores(prev => prev.map(s => s.subjectId === subjectId ? { ...s, score: cleanScore, performance: autoPerformance || s.performance } : s));
  };

  const handlePerformanceChange = (subjectId: string, perfVal: string) => {
    setSubjectScores(prev => prev.map(s => s.subjectId === subjectId ? { ...s, performance: perfVal } : s));
  };

  const handleCommentChange = (subjectId: string, commentVal: string) => {
    setSubjectScores(prev => prev.map(s => s.subjectId === subjectId ? { ...s, comment: commentVal } : s));
  };

  const handleSubmitAll = () => {
    const hasScores = subjectScores.some(s => s.score.trim() !== "");
    if (!hasScores) {
      showSuccess("Please enter at least one subject score before saving.");
      return;
    }
    const studentName = STUDENTS.find(s => s.id === selectedStudentId)?.name || 'Selected Student';
    showSuccess(`Subject scores saved successfully for ${studentName}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marks Entry</h1>
          <p className="text-muted-foreground">Enter scores for all subjects for an individual learner.</p>
        </div>
      </div>

      {/* Performance Levels Info */}
      <Card className="border-none bg-indigo-50/50 shadow-none rounded-3xl overflow-hidden border border-indigo-100">
        <CardContent className="p-6 flex items-center gap-4">
          <Info className="text-indigo-600 shrink-0" size={24} />
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs font-black text-indigo-800 uppercase tracking-wider">Performance Levels:</span>
            {performanceLevels.map(lvl => (
              <div key={lvl.code} className="flex items-center gap-2">
                <Badge className={`${lvl.color} font-bold shadow-none rounded-lg px-2.5 py-0.5`}>{lvl.code}</Badge>
                <span className="text-xs font-bold text-slate-600">{lvl.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Grid */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Grade Level</label>
            <Select value={selectedGradeId} onValueChange={handleGradeChange}>
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
            <Select value={selectedStreamId} onValueChange={handleStreamChange} disabled={availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder={availableStreams.length === 0 ? "No Streams" : "Select Stream"} />
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
                <SelectValue placeholder={filteredStudents.length === 0 ? "No Learners" : "Select Learner"} />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Exam Type" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map(et => <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(yr => <SelectItem key={yr} value={yr}>{yr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
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
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Assessment Task / Topic</label>
            <Input placeholder="e.g. Fractions, Oral Narrative..." className="rounded-xl h-11 bg-slate-50 border-none text-sm" />
          </div>
        </div>
      </Card>

      {/* Scores Table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <CardTitle className="text-lg">
            Scores: {STUDENTS.find(s => s.id === selectedStudentId)?.name || 'Please select a learner'}
          </CardTitle>
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
                {subjectScores.length > 0 ? (
                  subjectScores.map((subject) => (
                    <tr key={subject.subjectId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900">{subject.subjectName}</td>
                      <td className="px-8 py-5">
                        <Input 
                          type="text" 
                          value={subject.score} 
                          onChange={(e) => handleScoreChange(subject.subjectId, e.target.value)}
                          className="w-20 h-11 rounded-xl text-center font-bold text-slate-800 bg-slate-50 border-none"
                        />
                      </td>
                      <td className="px-8 py-5">
                        <Select value={subject.performance} onValueChange={(val) => handlePerformanceChange(subject.subjectId, val)}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {performanceLevels.map(lvl => (
                              <SelectItem key={lvl.code} value={lvl.code}>{lvl.code} - {lvl.label.split(' ')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-8 py-5">
                        <Input 
                          value={subject.comment} 
                          onChange={(e) => handleCommentChange(subject.subjectId, e.target.value)}
                          className="h-11 rounded-xl bg-slate-50 border-none text-sm" 
                          placeholder="e.g. Consistent effort" 
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                      Select a Grade to load Learning Areas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleSubmitAll}>
          <Save size={18} /> Save All Subjects
        </Button>
      </div>
    </div>
  );
};

export default Assessments;