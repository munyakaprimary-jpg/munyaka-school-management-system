"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StudentPreview {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
  nextGrade: string;
  isHighest: boolean;
}

interface PromotionPreviewTableProps {
  students: StudentPreview[];
}

const PromotionPreviewTable: React.FC<PromotionPreviewTableProps> = ({ students }) => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b bg-slate-50/50">
        <CardTitle className="text-lg">Promotion Preview</CardTitle>
        <p className="text-sm text-slate-400 font-medium">Review which students will be promoted before executing</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Current Grade</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Next Grade</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Stream</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-900">{student.name}</td>
                  <td className="px-8 py-5 font-medium text-slate-600">{student.grade}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "font-bold",
                      student.isHighest ? "text-emerald-600" : "text-indigo-600"
                    )}>
                      {student.nextGrade}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                      {student.stream}
                    </Badge>
                  </td>
                  <td className="px-8 py-5">
                    <Badge className={cn(
                      "rounded-lg border-none font-bold",
                      student.isHighest ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                    )}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromotionPreviewTable;