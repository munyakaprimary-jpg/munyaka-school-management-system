"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface StaffPreRegistrationHeaderProps {
  onAddClick: () => void;
  onExportClick: () => void;
  isExporting: boolean;
}

const StaffPreRegistrationHeader: React.FC<StaffPreRegistrationHeaderProps> = ({
  onAddClick,
  onExportClick,
  isExporting
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Pre-Registration</h1>
          <p className="text-muted-foreground">Pre-authorize teacher system access credentials and manage activation keys.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="h-11 px-6 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 shadow-sm hover:bg-slate-50 transition-colors"
          onClick={onExportClick}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          Export CSV
        </Button>
        <Button className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold gap-2 transition-all active:scale-95" onClick={onAddClick}>
          <Plus size={18} /> Add Staff
        </Button>
      </div>
    </div>
  );
};

export default StaffPreRegistrationHeader;