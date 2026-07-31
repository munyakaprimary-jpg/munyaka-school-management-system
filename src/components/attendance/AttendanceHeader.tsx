"use client";

import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Edit3, Check } from "lucide-react";

interface AttendanceHeaderProps {
  selectedGrade: string;
  setSelectedGrade: (val: string) => void;
  isExporting: boolean;
  onExport: () => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const AttendanceHeader = ({ 
  selectedGrade, 
  setSelectedGrade, 
  isExporting, 
  onExport,
  isEditing,
  setIsEditing
}: AttendanceHeaderProps) => {
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
            <SelectItem value="grade4">Grade 4 - Blue</SelectItem>
            <SelectItem value="grade5">Grade 5 - Green</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant={isEditing ? "default" : "outline"} 
          onClick={() => setIsEditing(!isEditing)}
          className={`rounded-xl font-bold gap-2 transition-all ${isEditing ? "bg-indigo-600 shadow-indigo-100" : "bg-white border-slate-200 text-slate-700"}`}
        >
          {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
          {isEditing ? "Finish Editing" : "Edit Register"}
        </Button>

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
          Export
        </Button>
      </div>
    </div>
  );
};

export default AttendanceHeader;