"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LearningArea } from '@/types/assessments';

interface MarksTableProps {
  filteredLearningAreas: LearningArea[];
  filteredStudents: any[];
  marksMatrix: Record<string, Record<string, string>>;
  onMarkChange: (studentId: string, subjectId: string, value: string) => void;
}

const MarksTable = ({
  filteredLearningAreas,
  filteredStudents,
  marksMatrix,
  onMarkChange
}: MarksTableProps) => {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="sticky left-0 bg-slate-50 z-10 px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-64">
                Learner Details
              </th>
              {filteredLearningAreas.map(area => (
                <th key={area.id} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center border-r min-w-[100px]">
                  {area.name}
                </th>
              ))}
              <th className="px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center bg-indigo-50/50 min-w-[90px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const studentMarks = marksMatrix[student.id] || {};
                let hasMarks = false;
                const totalMarks = filteredLearningAreas.reduce((sum, area) => {
                  const rawVal = studentMarks[area.id];
                  if (rawVal !== undefined && rawVal !== "") {
                    hasMarks = true;
                    const num = parseInt(rawVal, 10);
                    return sum + (isNaN(num) ? 0 : num);
                  }
                  return sum;
                }, 0);

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-6 py-4 border-r">
                      <p className="font-bold text-slate-900 truncate">{student.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        ID: {student.assessment} • Stream: {student.stream}
                      </p>
                    </td>
                    {filteredLearningAreas.map(area => (
                      <td key={area.id} className="px-2 py-3 border-r text-center">
                        <Input 
                          value={marksMatrix[student.id]?.[area.id] || ""}
                          onChange={(e) => onMarkChange(student.id, area.id, e.target.value)}
                          placeholder="—"
                          className="w-16 h-10 mx-auto text-center font-black text-sm rounded-lg bg-slate-50 border-none focus:bg-white focus:ring-2 ring-indigo-100 transition-all"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center bg-indigo-50/30 font-black text-sm text-indigo-600">
                      {hasMarks ? totalMarks : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={filteredLearningAreas.length + 2} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-300"><Search size={32} /></div>
                    <p className="text-slate-500 font-bold">No learners found for the selected Grade and Stream.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MarksTable;