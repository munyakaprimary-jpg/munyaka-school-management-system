"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save } from "lucide-react";
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, Grade, Stream } from '@/lib/mock-data';

interface StudentMark {
  id: number;
  name: string;
  score: string;
  performance: string;
  comment: string;
}

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

  // Load dynamic grades and streams
  const [gradesList, setGradesList] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Dropdown states
  const [selectedGradeId, setSelectedGradeId] = useState<string>(() => {
    return gradesList.length > 0 ? gradesList[0].id : "";
  });
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [examType, setExamType] = useState("summative");
  const [year, setYear] = useState("2024");
  const [term, setTerm] = useState("term1");
  const [subject, setSubject] = useState("math");

  // Get streams for the currently selected grade
  const currentGrade = gradesList.find(g => g.id === selectedGradeId);
  const availableStreams = currentGrade ? currentGrade.streams : [];

  // Automatically select the first stream when grade changes
  useEffect(() => {
    if (availableStreams.length > 0) {
      setSelectedStreamId(availableStreams[0].id);
    } else {
      setSelectedStreamId("");
    }
  }, [selectedGradeId, gradesList]);

  // Helper to automatically determine performance level based on score (0-100)
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

  const handlePerformanceChange = (id: number, perfVal: string) => {
    setStudentMarks(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, performance: perfVal };
      }
      return student;
    }));
  };

  const handleCommentChange = (id: number, commentVal: string) => {
    setStudentMarks(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, comment: commentVal };
      }
      return student;
    }));
  };

  const handleSubmit = () => {
    showSuccess('Marks submitted and saved successfully!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CBC Marksheet</h1>
          <p className="text-muted-foreground">Grade students based on specific learning outcomes and scores.</p>
        </div>
        <Button size="lg" className="rounded-2xl px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2" onClick={handleSubmit}>
          <Save size={18} /> Submit Marks
        </Button>
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

      {/* Dropdown Selectors Grid */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade Level</label>
            <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradesList.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stream</label>
            <Select value={selectedStreamId} onValueChange={setSelectedStreamId} disabled={availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder={availableStreams.length === 0 ? "No Streams" : "Select Stream"} />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Exam Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formative">Formative Assessment</SelectItem>
                <SelectItem value="summative">Summative Assessment</SelectItem>
                <SelectItem value="opener">Opener Exam</SelectItem>
                <SelectItem value="midterm">Mid-Term Exam</SelectItem>
                <SelectItem value="endterm">End Term Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Area</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
                <SelectValue placeholder="Learning Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="english">English Language</SelectItem>
                <SelectItem value="kiswahili">Kiswahili</SelectItem>
                <SelectItem value="science">Science & Tech</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Task / Topic</label>
            <Input placeholder="Search or enter assessment task (e.g., Fractions, Oral Narrative)..." className="rounded-xl h-11 bg-slate-50 border-none text-sm" />
          </div>
        </div>
      </Card>

      {/* Marksheet Table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Student Name</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-40">Score (0-100)</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-56">Performance Level</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Teacher's Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentMarks.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900 text-base">{student.name}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="text"
                          value={student.score}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className="w-20 h-11 rounded-xl text-center font-bold text-slate-800 bg-slate-50 border-slate-100 focus:bg-white"
                          placeholder="0"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Select 
                        value={student.performance} 
                        onValueChange={(val) => handlePerformanceChange(student.id, val)}
                      >
                        <SelectTrigger className="w-44 h-11 rounded-xl bg-slate-50 border-slate-100 font-bold">
                          <SelectValue placeholder="Select Level" />
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
                    <td className="px-8 py-5">
                      <Input 
                        value={student.comment}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
                        className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white text-sm" 
                        placeholder="e.g. Consistent effort" 
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