"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PromotionRecord {
  id: string;
  date: string;
  promotedBy: string;
  totalPromoted: number;
  newGrades?: {
    student: string;
    from: string;
    to: string;
  }[];
}

interface PromotionHistoryTableProps {
  history: PromotionRecord[];
}

const PromotionHistoryTable: React.FC<PromotionHistoryTableProps> = ({ history }) => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-slate-500 bg-slate-50/50 border-b">
            <tr>
              <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Promotion ID</th>
              <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Promoted By</th>
              <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Total Promoted</th>
              <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-8 py-6 font-bold text-indigo-600">{record.id}</td>
                <td className="px-8 py-6 font-medium text-slate-600">{record.date}</td>
                <td className="px-8 py-6 font-medium text-slate-600">{record.promotedBy}</td>
                <td className="px-8 py-6 text-right font-bold text-slate-900">{record.totalPromoted}</td>
                <td className="px-8 py-6 text-right">
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default PromotionHistoryTable;