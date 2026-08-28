"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { StudentResult } from '@/lib/resultsUtils';

interface ResultsBreakdownTableProps {
  studentResults: StudentResult[];
  learningAreas: string[];
  showStreamColumn: boolean;
  getRubricColor: (level: 'EE' | 'ME' | 'AE' | 'BE') => string;
}

const ResultsBreakdownTable: React.FC<ResultsBreakdownTableProps> = ({
  studentResults,
  learningAreas,
  showStreamColumn,
  getRubricColor,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    if (tableContainerRef.current && learningAreas.length > 0) {
      const scroller = tableContainerRef.current;
      scroller.scrollLeft = 0;
    }
  }, [learningAreas.length, studentResults.length]);

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden print:shadow-none print:rounded-none">
      <div
        ref={tableContainerRef}
        className="relative w-full overflow-x-auto custom-scrollbar"
        style={{ scrollbarWidth: 'thin' }}
      >
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r w-16 text-center"
              >
                Rank
              </th>
              <th
                rowSpan={2}
                className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r min-w-[200px]"
              >
                Student Name & Admin No
              </th>
              {showStreamColumn && (
                <th
                  rowSpan={2}
                  className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r min-w-[90px]"
                >
                  Stream
                </th>
              )}
              {learningAreas.map(area => (
                <th
                  key={area}
                  rowSpan={2}
                  className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-600 text-center border-r min-w-[100px] max-w-[140px]"
                >
                  {area}
                </th>
              ))}
              <th
                rowSpan={2}
                className="bg-indigo-50 px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center min-w-[100px] border-l"
              >
                TOTAL
              </th>
              <th
                rowSpan={2}
                className="bg-indigo-50 px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 text-center min-w-[100px]"
              >
                Mean (%)
              </th>
              <th
                rowSpan={2}
                className="px-5 py-5 font-black text-[10px] uppercase tracking-widest text-slate-700 text-center min-w-[90px]"
              >
                Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentResults.length > 0 ? (
              studentResults.map((student) => {
                const isHovered = hoveredRow === student.studentId;
                return (
                  <tr
                    key={student.studentId}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      isHovered && "bg-slate-50"
                    )}
                    onMouseEnter={() => setHoveredRow(student.studentId)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 font-black text-center border-r text-slate-900">
                      #{student.rank}
                    </td>
                    <td className="px-6 py-4 border-r">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Admin No: {student.assessmentNo}</p>
                    </td>
                    {showStreamColumn && (
                      <td className="px-4 py-4 text-center font-bold text-slate-600 border-r">
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                          {student.stream}
                        </Badge>
                      </td>
                    )}
                    {learningAreas.map(area => (
                      <td
                        key={area}
                        className="px-2 py-3 border-r text-center font-bold text-slate-700"
                      >
                        {student.scores[area] !== undefined ? student.scores[area] : "—"}
                      </td>
                    ))}
                    <td className="bg-indigo-50/20 px-4 py-4 text-center font-black text-indigo-900">
                      {student.totalMarks}
                    </td>
                    <td className="bg-indigo-50/20 px-4 py-4 text-center font-black text-indigo-700 text-base">
                      {student.meanScore}%
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn("font-bold", getRubricColor(student.level))}
                      >
                        {student.level}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4 + learningAreas.length} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                      <Search size={32} />
                    </div>
                    <p className="text-slate-800 font-bold text-base">No student result records found for the selected Grade and Stream.</p>
                    <p className="text-xs text-slate-400 font-medium max-w-sm">
                      Try selecting a different grade and stream from the controls above to view their results.
                    </p>
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

export default ResultsBreakdownTable;