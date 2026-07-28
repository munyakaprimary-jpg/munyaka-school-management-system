"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GRADES_DATA } from '@/lib/mock-data';

interface FeeFiltersProps {
  year: string;
  setYear: (v: string) => void;
  term: string;
  setTerm: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
}

const FeeFilters = ({ year, setYear, term, setTerm, grade, setGrade }: FeeFiltersProps) => (
  <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Academic Year</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Term</Label>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="term1">Term 1</SelectItem>
            <SelectItem value="term2">Term 2</SelectItem>
            <SelectItem value="term3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Grade Level</Label>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GRADES_DATA.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  </Card>
);

export default FeeFilters;