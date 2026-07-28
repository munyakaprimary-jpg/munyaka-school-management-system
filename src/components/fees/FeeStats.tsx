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
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 relative overflow-hidden shadow-2xl shadow-indigo-100">
      <div className="absolute right-[-20px] top-[-20px] opacity-10"><Calculator size={140} /></div>
      <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Term Fee Setting</p>
      <h2 className="text-3xl font-black mb-2">KES {currentTermFee.toLocaleString()}</h2>
      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Active for selected filters</p>
    </Card>
    
    <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-8 flex flex-col justify-center">
      <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Total Collected</p>
      <h2 className="text-3xl font-black text-slate-900 mb-2">KES {totalCollected.toLocaleString()}</h2>
      <Progress value={(totalCollected / (totalPossible || 1)) * 100} className="h-1.5" />
    </Card>

    <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-8 flex flex-col justify-center">
      <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Pending Balances</p>
      <h2 className="text-3xl font-black text-rose-500 mb-2">KES {totalPending.toLocaleString()}</h2>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <TrendingUp size={12} className="text-rose-500" /> Action Required
      </div>
    </Card>
  </div>
);

export default FeeStats;