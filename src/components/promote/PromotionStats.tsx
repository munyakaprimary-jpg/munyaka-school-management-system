"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  subtitle?: string;
  progress?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  subtitle,
  progress 
}) => (
  <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${bg} ${color} rounded-lg`}>
        <Icon className="text-xs" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-sm font-bold text-slate-900">{value}</h3>
      </div>
    </div>
    {subtitle && (
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
      </div>
    )}
    {progress !== undefined && (
      <Progress value={progress} className="h-1" />
    )}
  </Card>
);

interface PromotionStatsProps {
  stats: {
    totalStudents: number;
    activeStudents: number;
    graduatedStudents: number;
    highestGrade: string;
  };
}

const PromotionStats: React.FC<PromotionStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <StatsCard
        title="Total Students"
        value={stats.totalStudents}
        icon={Users}
        color="text-indigo-600"
        bg="bg-indigo-50"
      />
      <StatsCard
        title="Active Students"
        value={stats.activeStudents}
        icon={UserCheck}
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <StatsCard
        title="Graduated"
        value={stats.graduatedStudents}
        icon={GraduationCap}
        color="text-purple-600"
        bg="bg-purple-50"
      />
      <StatsCard
        title="Highest Grade"
        value={stats.highestGrade}
        icon={FileText}
        color="text-slate-600"
        bg="bg-slate-50"
      />
    </div>
  );
};

export default PromotionStats;