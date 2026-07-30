"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Plus, Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface StudentHeaderProps {
  onExport: () => void;
  onAddClick: () => void;
  isExporting: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onExport,
  onAddClick,
  isExporting
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-muted-foreground">Manage learner profiles and class allocations.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="h-11 px-6 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 shadow-sm hover:bg-slate-50 transition-colors"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          Export CSV
        </Button>
        <Button className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold gap-2 transition-all active:scale-95" onClick={onAddClick}>
          <Plus size={18} /> Add Student
        </Button>
      </div>
    </div>
  );
};