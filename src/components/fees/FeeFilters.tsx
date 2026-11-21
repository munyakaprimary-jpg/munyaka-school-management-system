"use client";

import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGradesStreamsConfig } from "@/hooks/useGradesStreams";

interface FeeFiltersProps {
  year: string;
  setYear: (v: string) => void;
  term: string;
  setTerm: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
  stream: string;
  setStream: (v: string) => void;
}

const FeeFilters = ({ year, setYear, term, setTerm, grade, setGrade, stream, setStream }: FeeFiltersProps) => {
  const config = useGradesStreamsConfig();

  // Get available streams for the selected grade from Grades & Stream configuration
  const availableStreams = React.useMemo(() => {
    if (!grade || grade === "all" || grade === "ALL") {
      return config.streams.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    let streams = config.gradeStreamMap[grade];
    
    if (!streams) {
      const matchKey = grade.toLowerCase().replace(/\s+/g, '');
      streams = config.gradeStreamMap[matchKey];
    }

    if (!streams) {
      for (const key of Object.keys(config.gradeStreamMap)) {
        if (key.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(key.toLowerCase())) {
          streams = config.gradeStreamMap[key];
          break;
        }
      }
    }

    if (!streams) {
      const match = grade.match(/(\d+)/);
      if (match) {
        streams = config.gradeStreamMap[`grade${match[1]}`];
      }
    }

    return (streams || []).slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [grade, config]);

  // Reset invalid stream selection when grade changes
  useEffect(() => {
    if (!grade || grade === "all" || grade === "ALL") {
      if (stream !== "all") {
        setStream("all");
      }
      return;
    }

    const normalizedCurrent = stream?.toLowerCase().trim();
    const streamExists = availableStreams.some(
      s => s.toLowerCase().trim() === normalizedCurrent
    );

    if (stream && stream !== "all" && !streamExists) {
      setStream("all");
    } else if (availableStreams.length === 0 && stream && stream !== "all") {
      setStream("all");
    }
  }, [grade, availableStreams, stream, setStream]);

  return (
    <div className="action-bar">
      <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="all">All Grades</SelectItem>
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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stream</Label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-medium text-slate-800">
                <SelectValue placeholder={availableStreams.length === 0 ? "No streams configured" : "All Streams"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {availableStreams.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                    No streams configured for this grade
                  </div>
                ) : (
                  availableStreams.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableStreams.length === 0 && grade !== "all" && grade !== "ALL" && (
              <p className="text-[10px] text-amber-600 mt-1">
                No streams configured yet in Grades &amp; Stream menu. Showing All Streams.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeeFilters;
