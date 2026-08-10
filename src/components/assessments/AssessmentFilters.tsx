"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Grade, Stream } from '@/lib/mock-data';
import { ExamTypeOption } from '@/types/assessments';

interface AssessmentFiltersProps {
  gradesList: Grade[];
  selectedGradeId: string;
  setSelectedGradeId: (val: string) => void;
  availableStreams: Stream[];
  selectedStreamId: string;
  setSelectedStreamId: (val: string) => void;
  examTypesList: ExamTypeOption[];
  examType: string;
  setExamType: (val: string) => void;
  term: string;
  setTerm: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  academicYear: string;
  setAcademicYear: (val: string) => void;
}

const AssessmentFilters = ({
  gradesList,
  selectedGradeId,
  setSelectedGradeId,
  availableStreams,
  selectedStreamId,
  setSelectedStreamId,
  examTypesList,
  examType,
  setExamType,
  term,
  setTerm,
  searchTerm,
  setSearchTerm,
  academicYear,
  setAcademicYear
}: AssessmentFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString());

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Academic Year</label>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade</label>
          <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              {gradesList.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stream</label>
          <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              {availableStreams.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Exam Type</label>
          <Select value={examType} onValueChange={setExamType}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Exam Type" />
            </SelectTrigger>
            <SelectContent>
              {examTypesList.map((et) => (
                <SelectItem key={et.id} value={et.code}>
                  {et.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Term</label>
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

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Find Learner</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Name/ID..." 
              className="pl-9 h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AssessmentFilters;