"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save } from "lucide-react";
import { showSuccess } from '@/utils/toast';

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
    { id: 1, name: "Brian Kiptoo", score: "85", performance: "EE", comment: "Excellent understanding of concepts" },
    { id: 2, name: "Mary Atieno", score: "72", performance: "ME", comment: "Good progress, very active" },
    { id: 3, name: "Emmanuel Maina", score: "45", performance: "AE", comment: "Needs more practice in algebra" },
    { id: 4, name: "Sheila Chepkoech", score: "92", performance: "EE", comment: "Outstanding performance" },
    { id: 5, name: "David Mutua", score: "28", performance: "BE", comment: "Requires remedial support" },
  ]);

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
    // Limit score between 0 and 100
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select defaultValue="math">
          <SelectTrigger className="rounded-2xl h-12 bg-white border-none shadow-sm">
            <SelectValue placeholder="Learning Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="english">English Language</SelectItem>
            <SelectItem value="kiswahili">Kiswahili</SelectItem>
            <SelectItem value="science">Science & Tech</SelectItem>
            <SelectItem value="custom">Custom Subject...</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="formative">
          <SelectTrigger className="rounded-2xl h-12 bg-white border-none shadow-sm">
            <SelectValue placeholder="Assessment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formative">Formative (Task-based)</SelectItem>
            <SelectItem value="summative">Summative (End of Term)</SelectItem>
            <SelectItem value="project">Project / Portfolio</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search Assessment Task..." className="rounded-2xl h-12 bg-white border-none shadow-sm px-4" />
      </div>

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