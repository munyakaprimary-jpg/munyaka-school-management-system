"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from 'lucide-react';
import { useGradesStreams } from '@/hooks/useGradesStreams';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterGrade: string;
  setFilterGrade: (value: string) => void;
  filterStream: string;
  setFilterStream: (value: string) => void;
  onClearFilters: () => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterGrade,
  setFilterGrade,
  filterStream,
  setFilterStream,
  onClearFilters
}) => {
  const { grades, streams, isLoading } = useGradesStreams();

  const uniqueStreams = React.useMemo(() => {
    const streamNames = new Set<string>();
    streams.forEach(s => streamNames.add(s.name));
    return Array.from(streamNames).sort();
  }, [streams]);

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name/ID..." 
            className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium text-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade} disabled={isLoading}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 disabled:opacity-50">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grade Levels</SelectItem>
              {isLoading ? (
                <SelectItem disabled value="">Loading grades...</SelectItem>
              ) : grades.length === 0 ? (
                <SelectItem disabled value="">No grades configured</SelectItem>
              ) : (
                grades.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
          <Select value={filterStream} onValueChange={setFilterStream} disabled={isLoading}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 disabled:opacity-50">
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
          className="h-12 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-2 font-bold transition-colors w-full sm:col-span-2 lg:col-span-1"
          onClick={onClearFilters}
        >
          <X size={18} /> Clear Filters
        </Button>
      </div>
    </Card>
  );
};

export default StudentFilters;