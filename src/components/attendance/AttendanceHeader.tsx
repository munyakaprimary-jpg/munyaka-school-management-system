"use client";

import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { GRADES_DATA } from '@/lib/mock-data';

interface AttendanceHeaderProps {
  selectedGrade: string;
  setSelectedGrade: (val: string) => void;
  selectedStream: string;
  setSelectedStream: (val: string) => void;
  isExporting: boolean;
  onExport: () => void;
}

const AttendanceHeader = ({ 
  selectedGrade, 
  setSelectedGrade, 
  selectedStream, 
  setSelectedStream, 
  isExporting, 
  onExport 
}: AttendanceHeaderProps) => {
  // Get available streams for the selected grade
  const availableStreams = React.useMemo(() => {
    const grade = GRADES_DATA.find(g => g.id === selectedGrade);
    return grade ? grade.streams : [];
  }, [selectedGrade]);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
        <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADES_DATA.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedStream} onValueChange={setSelectedStream}>
          <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200">
            <SelectValue placeholder="Stream" />
          </SelectTrigger>
          <SelectContent>
            {availableStreams.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="rounded-xl bg-white border-slate-200 font-bold text-slate-700">
          {format(new Date(), "PP")}
        </Button>
        <Button 
          variant="outline" 
          onClick={onExport}
          disabled={isExporting}
          className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold gap-2 hover:bg-slate-50 shadow-sm"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          Export Register
        </Button>
      </div>
    </div>
  );
};

export default AttendanceHeader;