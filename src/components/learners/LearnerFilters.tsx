"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useGradesStreamsConfig } from "@/hooks/useGradesStreams";

interface LearnerFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterGrade: string;
  setFilterGrade: (value: string) => void;
  filterStream: string;
  setFilterStream: (value: string) => void;
  onClearFilters: () => void;
}

const LearnerFilters: React.FC<LearnerFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterGrade,
  setFilterGrade,
  filterStream,
  setFilterStream,
  onClearFilters
}) => {
  const config = useGradesStreamsConfig();
  
  const filterGradeNumber = React.useMemo(() => {
    if (filterGrade === "all" || !filterGrade) return null;
    const match = filterGrade.match(/\d+/);
    return match ? match[0] : null;
  }, [filterGrade]);

  const availableStreams = React.useMemo(() => {
    if (filterGrade === "all" || !filterGrade) {
      return config.streams.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    
    const matchKey = filterGrade.toLowerCase().replace(/\s+/g, '');
    let streams = config.gradeStreamMap[filterGrade] || config.gradeStreamMap[matchKey];
    
    if (!streams) {
      for (const key of Object.keys(config.gradeStreamMap)) {
        if (key.toLowerCase().includes(filterGrade.toLowerCase()) ||
            filterGrade.toLowerCase().includes(key.toLowerCase())) {
          streams = config.gradeStreamMap[key];
          break;
        }
      }
    }
    
    if (!streams) {
      const gradeMatch = filterGrade.match(/(\d+)/);
      if (gradeMatch) {
        const numericKey = `grade${gradeMatch[1]}`;
        streams = config.gradeStreamMap[numericKey];
      }
    }
    
    return (streams || []).slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [filterGrade, config]);
  
  React.useEffect(() => {
    if (filterGrade === "all" || !filterGrade) {
      if (filterStream !== "all") {
        setFilterStream("all");
      }
      return;
    }
    
    const normalizedStream = filterStream?.toLowerCase().trim();
    const streamExists = availableStreams.some(
      s => s.toLowerCase() === normalizedStream
    );
    
    if (filterStream && !streamExists && availableStreams.length > 0) {
      setFilterStream(availableStreams[0]);
    } else if (availableStreams.length === 0 && filterStream && filterStream !== "all") {
      setFilterStream("all");
    }
  }, [filterGrade, availableStreams]);

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
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
            Grade
          </Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grade Levels</SelectItem>
              {config.grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
            Stream
          </Label>
          <Select
            value={filterStream}
            onValueChange={setFilterStream}
            disabled={!filterGrade || filterGrade === "all"}
          >
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder={!filterGrade || filterGrade === "all" ? "Select grade first..." : "All Streams"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Streams</SelectItem>
              {availableStreams.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
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

export default LearnerFilters;
