"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, Download } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

interface PreRegHeaderProps {
  onExport: () => void;
  onAddClick: () => void;
}

const PreRegHeader = ({ onExport, onAddClick }: PreRegHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallback="/staff" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Pre-Registration</h1>
          <p className="text-muted-foreground">Pre-authorize teacher system access credentials and manage activation keys.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          className="h-11 px-5 rounded-2xl border-slate-200 bg-white text-sm font-bold gap-2 text-slate-700 hover:bg-slate-50 shadow-sm"
          onClick={onExport}
        >
          <Download size={18} /> Export Master CSV
        </Button>
        <Button 
          className="h-11 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
          onClick={onAddClick}
        >
          <UserPlus size={18} /> Pre-Register Staff
        </Button>
      </div>
    </div>
  );
};

export default PreRegHeader;