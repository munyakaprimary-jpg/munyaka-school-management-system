"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';

interface PromotionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterGrade: string;
  onGradeChange: (value: string) => void;
  filterStream: string;
  onStreamChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  grades: { grade: string; count: number }[];
  streams: { stream: string; count: number }[];
}

const PromotionFilters: React.FC<PromotionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterGrade,
  onGradeChange,
  filterStream,
  onStreamChange,
  filterStatus,
  onStatusChange,
  grades,
  streams,
}) => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search students..." 
            className="pl-10 h-11 rounded-xl bg-slate-50 border-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select value={filterGrade} onValueChange={onGradeChange}>
          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
            <SelectValue placeholder="Filter by Grade" />
          </SelectTrigger>
          <SelectContent>
            {grades.map(item => (
              <SelectItem key={item.grade} value={item.grade}>{item.grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStream} onValueChange={onStreamChange}>
          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
            <SelectValue placeholder="Filter by Stream" />
          </SelectTrigger>
          <SelectContent>
            {streams.map(item => (
              <SelectItem key={item.stream} value={item.stream}>{item.stream}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Graduated">Graduated</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

export default PromotionFilters;