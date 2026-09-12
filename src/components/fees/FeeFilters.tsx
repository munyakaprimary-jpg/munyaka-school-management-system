"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface FeeFiltersProps {
  year: string;
  setYear: (v: string) => void;
  term: string;
  setTerm: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
}

const FeeFilters = ({ year, setYear, term, setTerm, grade, setGrade }: FeeFiltersProps) => (
  <div className="action-bar">
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-medium text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-medium text-slate-800">
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
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade Level</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-medium text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pp1">Pre-Primary 1</SelectItem>
              <SelectItem value="pp2">Pre-Primary 2</SelectItem>
              <SelectItem value="grade1">Grade 1</SelectItem>
              <SelectItem value="grade2">Grade 2</SelectItem>
              <SelectItem value="grade3">Grade 3</SelectItem>
              <SelectItem value="grade4">Grade 4</SelectItem>
              <SelectItem value="grade5">Grade 5</SelectItem>
              <SelectItem value="grade6">Grade 6</SelectItem>
              <SelectItem value="grade7">Grade 7</SelectItem>
              <SelectItem value="grade8">Grade 8</SelectItem>
              <SelectItem value="grade9">Grade 9</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  </div>
);

export default FeeFilters;