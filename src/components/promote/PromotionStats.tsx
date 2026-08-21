"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Clock, 
  Wallet, 
  UserCheck, 
  GraduationCap,
  FileText,
  TrendingUp
} from 'lucide-react';
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
  <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
    <div className="flex items-center gap-4 mb-6">
      <div className={`p-3 ${bg} ${color} rounded-2xl`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
    {subtitle && (
      <div className="flex items-center justify-between text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
        <span>{subtitle}</span>
      </div>
    )}
    {progress !== undefined && (
      <Progress value={progress} className="h-1.5" />
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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