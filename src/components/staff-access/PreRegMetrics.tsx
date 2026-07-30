"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Users, ShieldCheck, Key, ShieldAlert } from "lucide-react";

interface MetricsProps {
  metrics: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
}

const PreRegMetrics = ({ metrics }: MetricsProps) => {
  const cards = [
    { label: 'Total Pre-Registered', value: metrics.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Accounts', value: metrics.active, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Activation', value: metrics.pending, icon: Key, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Suspended Access', value: metrics.suspended, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="rounded-[2rem] bg-white border-none shadow-sm p-6 flex items-center gap-4">
          <div className={`p-3 ${card.bg} ${card.color} rounded-2xl shrink-0`}>
            <card.icon size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{card.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PreRegMetrics;