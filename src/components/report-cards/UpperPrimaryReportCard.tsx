"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";
import { Student, LearningArea } from '@/lib/report-card-store';
import { ReportCardRemarks } from './ReportCardRemarks';

interface UpperPrimaryReportCardProps {
  student: Student;
  learningAreas: LearningArea[];
  marks: Record<string, { score: number; performance_level: 'EE' | 'ME' | 'AE' | 'BE' }>;
  teacherRemark: string;
  hoiRemark: string;
  onSaveTeacher: (remark: string) => void;
  onSaveHOI: (remark: string) => void;
  term?: string;
  year?: string;
}

export const UpperPrimaryReportCard: React.FC<UpperPrimaryReportCardProps> = ({
  student,
  learningAreas,
  marks,
  teacherRemark,
  hoiRemark,
  onSaveTeacher,
  onSaveHOI,
  term = 'One',
  year = '2024',
}) => {
  // Aggregate Calculations
  const validMarks = learningAreas.map(la => marks[la.id]?.score || 0);
  const totalScore = validMarks.reduce((a, b) => a + b, 0);
  const meanScore = validMarks.length > 0 ? Math.round(totalScore / validMarks.length) : 0;

  const getPoints = (score: number) => {
    if (score >= 80) return 4;
    if (score >= 65) return 3;
    if (score >= 50) return 2;
    return 1;
  };

  const totalPoints = learningAreas.reduce((acc, la) => acc + getPoints(marks[la.id]?.score || 0), 0);

  return (
    <Card className="max-w-4xl mx-auto border border-slate-200 shadow-md rounded-none bg-white p-6 md:p-10 print:shadow-none print:p-0 print:border-none print:page-break-after">
      <CardContent className="space-y-6 p-0">
        {/* Header */}
        <div className="text-center space-y-1.5 border-b-2 border-indigo-600 pb-4 relative">
          <div className="absolute left-2 top-1 hidden sm:block">
            <School size={50} className="text-indigo-600 opacity-20" />
          </div>
          <h2 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Munyaka Primary School</h2>
          <p className="text-xs font-bold text-slate-600">P.O. Box 5239-30100 Eldoret • Upper Primary Section</p>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-black tracking-widest px-3 py-0.5">
            Upper Primary Academic Performance Matrix (Grades 4-6)
          </Badge>

          <div className="flex justify-between text-xs pt-3 font-semibold text-slate-700 max-w-xl mx-auto">
            <span><strong>Term:</strong> {term}</span>
            <span><strong>Year:</strong> {year}</span>
            <span><strong>Grade:</strong> Grade {student.current_grade} ({student.stream})</span>
          </div>
        </div>

        {/* Student Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Learner Name</p>
            <p className="font-bold text-slate-900 text-sm">{student.name}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Assessment Number</p>
            <p className="font-bold text-slate-900 text-sm">{student.assessment_number}</p>
          </div>
        </div>

        {/* Performance Matrix */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-emerald-600 pl-2">
            Academic Score Matrix & Point Allocation
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b">
                <th className="px-3 py-2 text-left font-bold">Learning Area</th>
                <th className="px-3 py-2 text-center font-bold">Formative (40%)</th>
                <th className="px-3 py-2 text-center font-bold">Summative (60%)</th>
                <th className="px-3 py-2 text-center font-bold">Total Score</th>
                <th className="px-3 py-2 text-center font-bold">Points (4.0)</th>
                <th className="px-3 py-2 text-center font-bold">Grade Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {learningAreas.map((area) => {
                const mark = marks[area.id];
                const score = mark ? mark.score : 0;
                const formScore = Math.round(score * 0.4);
                const sumScore = Math.round(score * 0.6);
                const pts = getPoints(score);
                const lvl = mark ? mark.performance_level : 'ME';

                return (
                  <tr key={area.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 font-bold text-slate-800">{area.name}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{formScore}%</td>
                    <td className="px-3 py-2 text-center text-slate-600">{sumScore}%</td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-900">{score}%</td>
                    <td className="px-3 py-2 text-center font-bold text-emerald-700">{pts}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="font-bold text-[10px] px-2 py-0.5 bg-slate-50 border-slate-200">
                        {lvl}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Aggregate Summary Box */}
        <div className="grid grid-cols-3 gap-4 bg-slate-900 text-white p-4 rounded-xl text-center">
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Total Mark Aggregate</p>
            <p className="text-xl font-black text-indigo-400">{totalScore} / {learningAreas.length * 100}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Mean Percentage</p>
            <p className="text-xl font-black text-emerald-400">{meanScore}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Cumulative Points</p>
            <p className="text-xl font-black text-amber-400">{totalPoints} pts</p>
          </div>
        </div>

        {/* Interactive Remarks Footer */}
        <ReportCardRemarks
          teacherRemark={teacherRemark}
          hoiRemark={hoiRemark}
          onSaveTeacher={onSaveTeacher}
          onSaveHOI={onSaveHOI}
        />

        <div className="text-center pt-4 text-[9px] text-slate-400 border-t border-slate-100">
          Official computer-generated academic report card for Munyaka Primary School.
        </div>
      </CardContent>
    </Card>
  );
};