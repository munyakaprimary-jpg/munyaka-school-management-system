"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GRADES, STREAMS } from '@/lib/reportcard-data';

interface LearnerCardProps {
  learner: any;
  onGenerateReport: () => void;
  onViewReport: () => void;
}

const LearnerCard: React.FC<LearnerCardProps> = ({ learner, onGenerateReport, onViewReport }) => {
  const gradeName = GRADES.find(g => g.id === learner.gradeId)?.name || 'Unknown';
  const streamName = STREAMS.find(s => s.id === learner.streamId)?.name || 'Unknown';
  const statusBadgeClass = learner.status === 'Active' 
    ? "bg-emerald-50 text-emerald-600 border-none" 
    : "bg-slate-100 text-slate-600 border-none";

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100">
        <CardTitle className="text-lg font-bold text-slate-900">{learner.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{learner.admissionNumber}</span>
          <Badge variant="outline" className="ml-2 rounded-lg">
            {gradeName}
          </Badge>
          <Badge variant="outline" className="ml-2 rounded-lg">
            {streamName}
          </Badge>
        </div>
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-indigo-600 hover:text-indigo-700"
            onClick={onGenerateReport}
            title="Generate Report Card"
          >
            Generate Report
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-600 hover:text-slate-700"
            onClick={onViewReport}
            title="View Report Card"
          >
            View Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearnerCard;