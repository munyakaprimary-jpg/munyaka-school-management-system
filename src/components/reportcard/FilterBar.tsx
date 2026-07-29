"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRADES, STREAMS } from '@/lib/reportcard-data';

interface FilterBarProps {
  onGradeChange: (grade: string) => void;
  onStreamChange: (stream: string) => void;
  onSearchChange: (searchTerm: string) => void;
  selectedGrade: string;
  selectedStream: string;
  searchTerm: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onGradeChange,
  onStreamChange,
  onSearchChange,
  selectedGrade,
  selectedStream,
  searchTerm,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</Label>
          <Select 
            value={selectedGrade} 
            onValueChange={onGradeChange}
          >
            <SelectTrigger className="rounded-lg h-11 bg-slate-50 border-none font-bold text-slate-800">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stream</Label>
          <Select 
            value={selectedStream} 
            onValueChange={onStreamChange}
            disabled={!selectedGrade}
          >
            <SelectTrigger className="rounded-lg h-11 bg-slate-50 border-none font-bold text-slate-800">
              <SelectValue placeholder="Select Stream" />
            </SelectTrigger>
            <SelectContent>
              {STREAMS.map((stream) => (
                <SelectItem key={stream.id} value={stream.id}>
                  {stream.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Learner</Label>
          <Input 
            placeholder="Search by name or ID..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:ring-2 ring-indigo-50 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;