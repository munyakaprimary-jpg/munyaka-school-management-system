"use client";

import React from 'react';
import { Info } from "lucide-react";

const AssessmentInstructions = () => {
  return (
    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
      <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
      <div className="space-y-1">
        <p className="text-sm font-bold text-indigo-900">Sheet Instructions</p>
        <p className="text-xs text-indigo-700/80 leading-relaxed">
          Enter numerical scores (0-100) in the boxes. The system automatically calculates total marks per learner in real time. 
          Levels (EE, ME, etc.) will be calculated automatically on save based on the school's configured grading scale.
        </p>
      </div>
    </div>
  );
};

export default AssessmentInstructions;