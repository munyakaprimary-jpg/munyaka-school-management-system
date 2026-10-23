"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from 'lucide-react';

const WarningBanner: React.FC = () => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-amber-50/50 border border-amber-200 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-amber-800 mb-2">⚠️ Critical Action Required</h3>
            <p className="text-sm text-amber-700 mb-3">
              The "Promote Learners" feature is designed for end-of-year grade advancement.
              This action will permanently change student grades and cannot be easily undone.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-amber-800">
              <div className="flex items-center gap-1">
                <CheckCircle size={14} /> Students in highest grade become "Graduated"
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={14} /> Streams/colors remain unchanged
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={14} /> This action is irreversible
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarningBanner;