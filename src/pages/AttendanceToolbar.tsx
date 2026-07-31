"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ToolbarProps {
  isExporting: boolean;
  handleExport: () => void;
}

export const AttendanceToolbar: React.FC<ToolbarProps> = ({ isExporting, handleExport }) => (
  <div className="flex flex-wrap gap-2">
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={isExporting}
      className="rounded-xl bg-white border-slate-200 font-bold text-slate-700 gap-2 hover:bg-slate-50 shadow-sm"
    >
      {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
      Export Register
    </Button>
  </div>
);

export default AttendanceToolbar;