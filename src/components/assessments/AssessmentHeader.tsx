"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Save, Loader2 } from "lucide-react";

interface AssessmentHeaderProps {
  onExport: () => void;
  onSave: () => void;
  isSaving: boolean;
  isExporting: boolean;
}

const AssessmentHeader = ({ onExport, onSave, isSaving, isExporting }: AssessmentHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full max-w-full overflow-x-auto whitespace-nowrap break-words">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marks Entry</h1>
        <p className="text-sm text-slate-500">Record results for all learners in the selected class.</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="rounded-xl h-10 px-4 border-slate-200 bg-white gap-2 text-sm font-bold shadow-sm hover:bg-slate-50" 
          onClick={onExport} 
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />} Export CSV
        </Button>
        <Button 
          className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2" 
          onClick={onSave} 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All
        </Button>
      </div>
    </div>
  );
};

export default AssessmentHeader;