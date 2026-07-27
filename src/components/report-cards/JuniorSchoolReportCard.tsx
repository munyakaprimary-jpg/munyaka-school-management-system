"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Award } from "lucide-react";
import { Student, LearningArea } from '@/lib/report-card-store';
import { ReportCardRemarks } from './ReportCardRemarks';

interface JuniorSchoolReportCardProps {
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

export const JuniorSchoolReportCard: React.FC<JuniorSchoolReportCardProps> = ({
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
        <div className="text-center space-y-1.5 border-b-2 border-indigo-700 pb-4 relative">
          <div className="absolute left-2 top-1 hidden sm:block">
            <School size={50} className="text-indigo-700 opacity-20" />
          </div>
          <h2 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Munyaka Junior School</h2>
          <p className="text-xs font-bold text-slate-600">P.O. Box 5239-30100 Eldoret • Junior Secondary Section</p>
          <Badge className="bg-indigo-900 text-white border-none text-[10px] uppercase font-black tracking-widest px-3 py-0.5">
            Junior Secondary Key Stage Report (Grades 7-9)
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
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">KNEC Assessment ID</p>
            <p className="font-bold text-slate-900 text-sm">{student.assessment_number}</p>
          </div>
        </div>

        {/* Junior Secondary Specific Matrix */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-indigo-700 pl-2">
              Key Stage Learning Areas Summary
            </h3>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Pre-Technical & STEM Focus
            </span>
          </div>
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b">
                <th className="px-3 py-2 text-left font-bold">Learning Area</th>
                <th className="px-3 py-2 text-center font-bold">Continuous (40%)</th>
                <th className="px-3 py-2 text-center font-bold">Summative (60%)</th>
                <th className="px-3 py-2 text-center font-bold">Total Score</th>
                <th className="px-3 py-2 text-center font-bold">Points</th>
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
                const isKeyStageArea = ['Pre-Technical Studies', 'Integrated Science', 'Health Education'].includes(area.name);

                return (
                  <tr key={area.id} className={isKeyStageArea ? "bg-indigo-50/40 hover:bg-indigo-50/70" : "hover:bg-slate-50/80"}>
                    <td className="px-3 py-2 font-bold text-slate-800 flex items-center gap-1.5">
                      {isKeyStageArea && <Award size={12} className="text-indigo-600 shrink-0" />}
                      {area.name}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">{formScore}%</td>
                    <td className="px-3 py-2 text-center text-slate-600">{sumScore}%</td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-950">{score}%</td>
                    <td className="px-3 py-2 text-center font-bold text-emerald-700">{pts}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="font-bold text-[10px] px-2 py-0.5 bg-white border-slate-200">
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
        <div className="grid grid-cols-3 gap-4 bg-indigo-950 text-white p-4 rounded-xl text-center">
          <div>
            <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-widest">Aggregate Score</p>
            <p className="text-xl font-black text-indigo-300">{totalScore} / {learningAreas.length * 100}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-widest">Mean Score</p>
            <p className="text-xl font-black text-emerald-400">{meanScore}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-widest">Total Points</p>
            <p className="text-xl font-black text-amber-300">{totalPoints} pts</p>
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
          Official computer-generated academic report card for Munyaka Junior Secondary School.
        </div>
      </CardContent>
    </Card>
  );
};