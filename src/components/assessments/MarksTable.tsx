"use client";

import React, { useMemo } from 'react';
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
  // Calculate subject totals and MSS for summary rows
  const subjectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredLearningAreas.forEach(area => {
      let sum = 0;
      let count = 0;
      filteredStudents.forEach(student => {
        const studentMarks = marksMatrix[student.id] || {};
        const val = studentMarks[area.id];
        if (val !== undefined && val !== "") {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      totals[area.id] = sum;
    });
    return totals;
  }, [filteredLearningAreas, filteredStudents, marksMatrix]);

  const subjectMSS = useMemo(() => {
    const mss: Record<string, number> = {};
    filteredLearningAreas.forEach(area => {
      let sum = 0;
      let count = 0;
      filteredStudents.forEach(student => {
        const studentMarks = marksMatrix[student.id] || {};
        const val = studentMarks[area.id];
        if (val !== undefined && val !== "") {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      mss[area.id] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    });
    return mss;
  }, [filteredLearningAreas, filteredStudents, marksMatrix]);

  // Calculate grand totals
  const grandTotalSum = useMemo(() => {
    return Object.values(subjectTotals).reduce((sum, val) => sum + val, 0);
  }, [subjectTotals]);

  const grandTotalMSS = useMemo(() => {
    const values = Object.values(subjectMSS).filter(v => v > 0);
    if (values.length === 0) return 0;
    return parseFloat((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2));
  }, [subjectMSS]);

  // Calculate individual student totals
  const studentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredStudents.forEach(student => {
      const studentMarks = marksMatrix[student.id] || {};
      let sum = 0;
      let hasMarks = false;
      filteredLearningAreas.forEach(area => {
        const val = studentMarks[area.id];
        if (val !== undefined && val !== "") {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            sum += num;
            hasMarks = true;
          }
        }
      });
      totals[student.id] = hasMarks ? sum : 0;
    });
    return totals;
  }, [filteredStudents, filteredLearningAreas, marksMatrix]);

  const numSubjectCols = filteredLearningAreas.length;
  const totalCols = numSubjectCols + 2; // +2 for Learner Details and Total columns

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <div className="overflow-x-auto w-full max-w-full whitespace-nowrap break-words">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="sticky left-0 bg-white z-30 px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-64 min-w-[200px]">
                          Learner Details
                        </th>
                        {filteredLearningAreas.map(area => (
                          <th key={area.id} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center border-r min-w-[100px] max-w-[120px]">
                            {area.name}
                          </th>
                        ))}
                        <th className="bg-indigo-50 px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center min-w-[90px] border-l">
                          Total
                        </th>
                      </tr>
                    </thead>
          <tbody className="divide-y">
            {filteredStudents.length > 0 ? (
              <>
                {filteredStudents.map((student) => {
                  const studentMarks = marksMatrix[student.id] || {};
                  const totalMarks = studentTotals[student.id] || 0;
                  const hasMarks = totalMarks > 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-20 px-6 py-4 border-r min-w-[200px]">
                                              <p className="font-bold text-slate-900 truncate">{student?.name ?? 'Unknown'}</p>
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                ID: {student.assessment} • Stream: {student.stream}
                                              </p>
                                            </td>
                                            {filteredLearningAreas.map(area => (
                                              <td key={area.id} className="px-2 py-3 border-r text-center min-w-[100px] max-w-[120px]">
                                                <Input
                                                  value={marksMatrix[student.id]?.[area.id] || ""}
                                                  onChange={(e) => onMarkChange(student.id, area.id, e.target.value)}
                                                  placeholder="—"
                                                  className="w-16 h-10 mx-auto text-center font-black text-sm rounded-lg bg-slate-50 border-none focus:bg-white focus:ring-2 ring-indigo-100 transition-all"
                                                />
                                              </td>
                                            ))}
                                            <td className="bg-indigo-50 px-4 py-3 text-center font-black text-sm text-indigo-600 min-w-[90px] border-l">
                                              {hasMarks ? totalMarks : "—"}
                                            </td>
                    </tr>
                  );
                })}
                
                {/* Summary Row 1: Subject Totals */}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="sticky left-0 bg-slate-50 z-10 px-6 py-4 border-r font-black text-slate-900 min-w-[200px]">
                    Subject Totals
                  </td>
                  {filteredLearningAreas.map(area => (
                    <td key={`total-${area.id}`} className="px-2 py-3 border-r text-center font-bold text-slate-700 min-w-[100px] max-w-[120px] bg-slate-50">
                      {subjectTotals[area.id] || 0}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-indigo-100/50 z-10 px-4 py-3 text-center font-black text-indigo-700 min-w-[90px] border-l">
                    {grandTotalSum}
                  </td>
                </tr>

                {/* Summary Row 2: Subject MSS */}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="sticky left-0 bg-slate-50 z-10 px-6 py-4 border-r font-black text-slate-900 min-w-[200px]">
                    Subject MSS
                  </td>
                  {filteredLearningAreas.map(area => (
                    <td key={`mss-${area.id}`} className="px-2 py-3 border-r text-center font-bold text-slate-700 min-w-[100px] max-w-[120px] bg-slate-50">
                      {subjectMSS[area.id]?.toFixed(2) || "0.00"}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-indigo-100/50 z-10 px-4 py-3 text-center font-black text-indigo-700 min-w-[90px] border-l">
                    {grandTotalMSS.toFixed(2)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan={totalCols} className="px-8 py-20 text-center">
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