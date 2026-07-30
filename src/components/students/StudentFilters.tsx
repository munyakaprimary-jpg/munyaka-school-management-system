"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from 'lucide-react';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterGrade: string;
  setFilterGrade: (value: string) => void;
  filterStream: string;
  setFilterStream: (value: string) => void;
  gradesList: any[];
  uniqueStreams: string[];
  onClearFilters: () => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterGrade,
  setFilterGrade,
  filterStream,
  setFilterStream,
  gradesList,
  uniqueStreams,
  onClearFilters
}) => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name/ID..." 
            className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grade Levels</SelectItem>
              {gradesList.map((grade: any) => (
                <SelectItem key={grade.name} value={grade.name}>
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Streams</SelectItem>
              {uniqueStreams.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="ghost" 
          className="h-12 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-2 font-bold transition-colors"
          onClick={onClearFilters}
        >
          <X size={18} /> Clear Filters
        </Button>
      </div>
    </Card>
  );
};