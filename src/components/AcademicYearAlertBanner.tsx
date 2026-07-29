"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const AcademicYearAlertBanner: React.FC<{ onPromote: () => void }> = ({ onPromote }) => {
  const { academicYear, promotionsCompleted } = useAcademicYear();
  const currentYear = new Date().getFullYear();
  const promotionNeeded = academicYear !== currentYear || !promotionsCompleted;

  if (!promotionNeeded) return null;

  return (
    <div className="fixed top-4 left-0 w-full bg-amber-600 text-white p-4 shadow-lg z-50 animate-in slide-in-from-right">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-amber-600" />
          <div>
            <h3 className="text-lg font-bold text-white">Action Required: New Academic Year Detected</h3>
            <p className="text-sm text-amber-200">
              The system has detected a new academic year. Please run student promotion to advance classes to the next grade and mark final-year students as Graduated.
            </p>
          </div>
        </div>
        <Button 
          variant="solid" 
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={onPromote}
        >
          <Plus size={18} /> <span className="text-sm">Promote Students</span>
        </Button>
      </div>
    </div>
  );
};

export default AcademicYearAlertBanner;