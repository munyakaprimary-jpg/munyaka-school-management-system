"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from 'lucide-react';
import { GRADES_DATA } from '@/lib/mock-data';

interface PortfolioFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedGrade: string;
  setSelectedGrade: (value: string) => void;
  selectedStream: string;
  setSelectedStream: (value: string) => void;
  selectedArea: string;
  setSelectedArea: (value: string) => void;
  uniqueStreams: string[];
  onClearFilters: () => void;
}

export const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedGrade,
  setSelectedGrade,
  selectedStream,
  setSelectedStream,
  selectedArea,
  setSelectedArea,
  uniqueStreams,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm !== "" || selectedGrade !== "all" || selectedStream !== "all" || selectedArea !== "all";

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Learner & Artifact Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search learner name, ID, or title..." 
            className="pl-11 rounded-2xl h-12 bg-slate-50 border-none font-medium text-sm focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grade Level Dropdown */}
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-700 text-sm">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">All Grade Levels</SelectItem>
            {GRADES_DATA.map(g => (
              <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stream Dropdown */}
        <Select value={selectedStream} onValueChange={setSelectedStream}>
          <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-700 text-sm">
            <SelectValue placeholder="All Streams" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">All Streams</SelectItem>
            {uniqueStreams.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Learning Area Dropdown */}
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-700 text-sm">
            <SelectValue placeholder="All Learning Areas" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">All Learning Areas</SelectItem>
            <SelectItem value="Creative Arts">Creative Arts</SelectItem>
            <SelectItem value="English">English Language</SelectItem>
            <SelectItem value="Kiswahili">Kiswahili</SelectItem>
            <SelectItem value="Science">Science & Tech</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="Agriculture">Agriculture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 rounded-xl gap-1.5 h-8"
          >
            <X size={14} /> Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};