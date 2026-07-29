"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Save, Users, CheckCircle, XCircle } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { PerformanceLevels } from "@/components/assessments/PerformanceLevels";
import { GradeSelectors } from "@/components/assessments/GradeSelectors";
import { SubjectScoreRow } from "@/components/assessments/SubjectScoreRow";
import { SubjectScore, PerformanceLevel, StudentMark } from "@/components/assessments/types";
import { GRADES_DATA, Grade } from "@/lib/mock-data";
import { FALLBACK_CLUSTERS, ClusterData } from "@/components/assessments/Clusters";
import { performanceLevels } from "@/components/assessments/PerformanceLevels";

const Assessments = () => {
  // State
  const [selectedGradeId, setSelectedGradeId] = useState<string>(() => {
    const saved = localStorage.getItem('selectedGradeId');
    return saved ? saved : GRADES_DATA[0].id;
  });
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [examType, setExamType] = useState<string>(() => {
    const saved = localStorage.getItem('examType');
    return saved ? saved : 'SUMMATIVE';
  });
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [term, setTerm] = useState('term1');
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  // Load student names
  const [studentNames, setStudentNames] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    const mockStudents = [
      { id: 1, name: 'Brian Kiptoo' },
      { id: 2, name: 'Mary Atieno' },
      { id: 3, name: 'Emmanuel Maina' },
      { id: 4, name: 'Sheila Chepkoech' },
      { id: 5, name: 'David Mutua' },
    ];
    setStudentNames(mockStudents);
  }, []);

  // Get streams for the currently selected grade
  const currentGrade = useMemo(() => {
    return gradesList.find(g => g.id === selectedGradeId);
  }, [selectedGradeId, gradesList]);

  const availableStreams = useMemo(() => {
    return currentGrade ? currentGrade.streams : [];
  }, [currentGrade]);

  // Get filtered learning areas
  const getFilteredLearningAreas = () => {
    if (!currentGrade) return [];
    const gradeName = currentGrade.name.toLowerCase();
    const category = currentGrade.category;

    let matchedClusters: ClusterData[] = [];

    if (gradeName.includes('grade 1') || gradeName.includes('grade 2') || gradeName.includes('grade 3')) {
      matchedClusters = clusters.filter(c => c.id === 'lower-primary');
    } else if (gradeName.includes('grade 4') || gradeName.includes('grade 5') || gradeName.includes('grade 6')) {
      matchedClusters = clusters.filter(c => c.id === 'upper-primary');
    } else if (gradeName.includes('pp') || category === 'Pre-Primary') {
      matchedClusters = clusters.filter(c => c.id === 'pre-primary');
    } else if (category === 'Junior School' || gradeName.includes('grade 7') || gradeName.includes('grade 8') || gradeName.includes('grade 9')) {
      matchedClusters = clusters.filter(c => c.id === 'junior-school');
    } else {
      if (category === 'Pre-Primary') {
        matchedClusters = clusters.filter(c => c.id === 'pre-primary');
      } else if (category === 'Primary') {
        matchedClusters = clusters.filter(c => c.id === 'lower-primary' || c.id === 'upper-primary');
      } else if (category === 'Junior School') {
        matchedClusters = clusters.filter(c => c.id === 'junior-school');
      }
    }
    return matchedClusters.flatMap(c => c.learningAreas);
  };

  const filteredLearningAreas = useMemo(() => getFilteredLearningAreas(), [selectedGradeId, clusters]);

  // Initialize subject scores when learning areas change
  useEffect(() => {
    const areas = getFilteredLearningAreas();
    if (areas.length > 0) {
      setSubjectScores(areas.map(area => ({
        subjectId: area.id,
        subjectName: area.name,
        score: '',
        performance: '',
        comment: ''
      })));
    } else {
      setSubjectScores([]);
    }
  }, [selectedGradeId, clusters]);

  // Load student names
  useEffect(() => {
    const mockStudents = [
      { id: 1, name: 'Brian Kiptoo' },
      { id: 2, name: 'Mary Atieno' },
      { id: 3, name: 'Emmanuel Maina' },
      { id: 4, name: 'Sheila Chepkoech' },
      { id: 5, name: 'David Mutua' },
    ];
    setStudentNames(mockStudents);
  }, []);

  // Helper functions
  const getPerformanceFromScore = (scoreStr: string): string => {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return '';
    if (score >= 80) return 'EE';
    if (score >= 50) return 'ME';
    if (score >= 30) return 'AE';
    return 'BE';
  };

  const handleScoreChange = (subjectId: string, scoreVal: string) => {
    let cleanScore = scoreVal.replace(/[^0-9]/g, '');
    if (cleanScore !== '') {
      const num = parseInt(cleanScore);
      if (num > 100) cleanScore = '100';
      if (num < 0) cleanScore = '0';
    }
    const autoPerformance = getPerformanceFromScore(cleanScore);
    setSubjectScores(prev => prev.map(s => {
      if (s.subjectId === subjectId) {
        return { ...s, score: cleanScore, performance: autoPerformance || s.performance };
      }
      return s;
    }));
  };

  const handlePerformanceChange = (subjectId: string, perfVal: string) => {
    setSubjectScores(prev => prev.map(s => {
      if (s.subjectId === subjectId) {
        return { ...s, performance: perfVal };
      }
      return s;
    }));
  };

  const handleCommentChange = (subjectId: string, commentVal: string) => {
    setSubjectScores(prev => prev.map(s => {
      if (s.subjectId === subjectId) {
        return { ...s, comment: commentVal };
      }
      return s;
    }));
  };

  const handleSetAllScores = () => {
    const defaultScore = '75';
    const autoPerformance = 'ME';
    setSubjectScores(prev => prev.map(s => ({
      ...s,
      score: defaultScore,
      performance: autoPerformance
    })));
  };

  const handleClearAllScores = () => {
    setSubjectScores(prev => prev.map(s => ({
      ...s,
      score: '',
      performance: '',
      comment: ''
    })));
  };

  const handleSubmitAll = () => {
    const hasScores = subjectScores.some(s => s.score.trim() !== '');
    if (!hasScores) {
      showSuccess('Please enter at least one subject score before saving.');
      return;
    }
    const savedCount = subjectScores.filter(s => s.score.trim() !== '').length;
    showSuccess(`${savedCount} subject scores saved successfully for ${studentMarks.find(s => s.id === selectedStudentId)?.name || 'selected student'}!`);
  };

  // Get student marks for display (optional)
  const studentMarks = useMemo(() => {
    if (selectedStudentId) {
      return studentMarks.filter(m => m.id === selectedStudentId);
    }
    return [];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CBC Marksheet</h1>
          <p className="text-muted-foreground">Enter scores for all subjects for an individual learner.</p>
        </div>
        <Button size="lg" className="rounded-2xl px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2" onClick={handleSubmitAll}>
          <Save size={18} /> Save All Subjects
        </Button>
      </div>

      {/* Performance Levels */}
      <PerformanceLevels levels={performanceLevels} />

      {/* Grade and Learner Selectors */}
      <GradeSelectors
        selectedGradeId={selectedGradeId}
        onGradeChange={setSelectedGradeId}
        selectedStreamId={selectedStreamId}
        onStreamChange={setSelectedStreamId}
        availableStreams={availableStreams}
        selectedStudentId={selectedStudentId}
        onStudentChange={setSelectedStudentId}
        studentNames={studentNames}
        examType={examType}
        onExamTypeChange={setExamType}
        examTypes={examTypes}
        year={year}
        onYearChange={setYear}
        academicYears={academicYears}
        term={term}
        onTermChange={setTerm}
        gradesList={gradesList}
      />

      {/* Subject Scores */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Enter Scores for: {studentMarks.find(s => s.id === selectedStudentId)?.name || 'Selected Student'}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl text-xs font-bold"
              onClick={handleSetAllScores}
            >
              <CheckCircle size={14} className="mr-1" /> Set All to 75
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl text-xs font-bold text-rose-600 border-rose-200"
              onClick={handleClearAllScores}
            >
              <XCircle size={14} className="mr-1" /> Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-1/3">Learning Area</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-1/6">Score (0-100)</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 w-1/6">Performance Level</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500">Teacher's Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjectScores.length > 0 ? (
                  subjectScores.map((subject) => (
                    <SubjectScoreRow
                      key={subject.subjectId}
                      subject={subject}
                      onScoreChange={(sid, val) => handleScoreChange(sid, val)}
                      onPerformanceChange={(sid, val) => handlePerformanceChange(sid, val)}
                      onCommentChange={(sid, val) => handleCommentChange(sid, val)}
                      performanceLevels={performanceLevels}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                      No learning areas found for the selected grade level.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessments;