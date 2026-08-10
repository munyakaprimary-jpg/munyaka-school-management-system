"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calculator, TrendingUp } from 'lucide-react';

interface FeeStatsProps {
  currentTermFee: number;
  totalCollected: number;
  totalPossible: number;
  totalPending: number;
}

const FeeStats = ({ currentTermFee, totalCollected, totalPossible, totalPending }: FeeStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="rounded-xl bg-indigo-600 text-white p-5 border border-indigo-700 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
        <Calculator size={96} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100 mb-1">Term Fee Setting</p>
        <h2 className="text-2xl font-bold text-white mb-1">KES {currentTermFee.toLocaleString()}</h2>
      </div>
      <p className="text-xs font-medium text-indigo-200 mt-2">Active for selected filters</p>
    </Card>
    
    <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">KES {totalCollected.toLocaleString()}</h2>
      </div>
      <Progress value={(totalCollected / (totalPossible || 1)) * 100} className="h-1.5" />
    </Card>

    <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Balances</p>
        <h2 className="text-2xl font-bold text-rose-600 mb-2">KES {totalPending.toLocaleString()}</h2>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <TrendingUp size={14} className="text-rose-500" /> Action Required
      </div>
    </Card>
  </div>
);

export default FeeStats;