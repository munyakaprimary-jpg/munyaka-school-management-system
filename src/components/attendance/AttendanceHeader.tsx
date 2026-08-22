"use client";

import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Edit3, Check, Calendar } from "lucide-react";
import { GRADES_DATA } from '@/lib/mock-data';

interface AttendanceHeaderProps {
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedStream: string;
  setSelectedStream: (val: string) => void;
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  isExporting: boolean;
  onExport: () => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const STREAM_OPTIONS = [
  { value: 'all', label: 'All Streams' },
  { value: 'Stream A', label: 'Stream A' },
  { value: 'Stream B', label: 'Stream B' },
  { value: 'Stream C', label: 'Stream C' },
  { value: 'East', label: 'East' },
  { value: 'West', label: 'West' },
  { value: 'North', label: 'North' },
  { value: 'South', label: 'South' },
];

const CLASS_OPTIONS = [
  { value: 'PP1', label: 'PP1' },
  { value: 'PP2', label: 'PP2' },
  { value: 'Grade 1', label: 'Grade 1' },
  { value: 'Grade 2', label: 'Grade 2' },
  { value: 'Grade 3', label: 'Grade 3' },
  { value: 'Grade 4', label: 'Grade 4' },
  { value: 'Grade 5', label: 'Grade 5' },
  { value: 'Grade 6', label: 'Grade 6' },
  { value: 'Grade 7', label: 'Grade 7' },
  { value: 'Grade 8', label: 'Grade 8' },
  { value: 'Grade 9', label: 'Grade 9' },
];

const AttendanceHeader = ({ 
  selectedClass, 
  setSelectedClass, 
  selectedStream,
  setSelectedStream,
  selectedDate,
  setSelectedDate,
  isExporting, 
  onExport,
  isEditing,
  setIsEditing
}: AttendanceHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar flex-wrap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
        <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200 font-bold text-slate-700">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {CLASS_OPTIONS.map((cls) => (
              <SelectItem key={cls.value} value={cls.value} className="rounded-xl">
                {cls.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStream} onValueChange={setSelectedStream}>
          <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200 font-bold text-slate-700">
            <SelectValue placeholder="Select Stream" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {STREAM_OPTIONS.map((stream) => (
              <SelectItem key={stream.value} value={stream.value} className="rounded-xl">
                {stream.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px] pl-10 pr-4 py-2.5 rounded-xl bg-white border-slate-200 font-bold text-slate-700 focus:ring-2 ring-indigo-100 outline-none"
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        
        <Button 
          variant={isEditing ? "default" : "outline"} 
          onClick={() => setIsEditing(!isEditing)}
          className={`rounded-xl font-bold gap-2 transition-all ${isEditing ? "bg-indigo-600 shadow-indigo-100" : "bg-white border-slate-200 text-slate-700"}`}
        >
          {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
          {isEditing ? "Finish Editing" : "Edit Register"}
        </Button>

        <Button 
          variant="outline" 
          onClick={onExport}
          disabled={isExporting}
          className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          Export
        </Button>
      </div>
    </div>
  );
};

export default AttendanceHeader;