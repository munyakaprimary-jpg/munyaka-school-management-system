"use client";

import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Edit3, Check } from "lucide-react";
import { GRADES_DATA } from '@/lib/mock-data';

interface AttendanceHeaderProps {
  selectedGradeId: string;
  setSelectedGradeId: (val: string) => void;
  isExporting: boolean;
  onExport: () => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const AttendanceHeader = ({ 
  selectedGradeId, 
  setSelectedGradeId, 
  isExporting, 
  onExport,
  isEditing,
  setIsEditing
}: AttendanceHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
        <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
          <SelectTrigger className="w-[220px] rounded-xl bg-white border-slate-200 font-bold text-slate-700">
            <SelectValue placeholder="Select Grade" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {GRADES_DATA.map((grade) => (
              <SelectItem key={grade.id} value={grade.id} className="rounded-xl">
                {grade.name} - {grade.category}
              </SelectItem>
            ))}
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

        <Button variant="outline" className="rounded-xl bg-white border-slate-200 font-bold text-slate-700 cursor-default">
          {format(new Date(), "PP")}
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