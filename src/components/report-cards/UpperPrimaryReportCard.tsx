"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";
import { 
  Student, 
  LearningArea, 
  SubjectMarks, 
  calculatePerformanceLevel, 
  getPerformanceLabel 
} from '@/lib/report-card-store';
import { ReportCardRemarks } from './ReportCardRemarks';

interface UpperPrimaryReportCardProps {
  student: Student;
  learningAreas: LearningArea[];
  marks: Record<string, SubjectMarks>;
  teacherRemark: string;
  hoiRemark: string;
  onSaveTeacher: (remark: string) => void;
  onSaveHOI: (remark: string) => void;
  closingDate?: string;
  nextOpeningDate?: string;
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
  closingDate = '2024-10-25',
  nextOpeningDate = '2024-11-04',
  term = 'Term 1',
  year = '2024',
}) => {
  const getBadgeStyle = (lvl: string) => {
    switch (lvl) {
      case 'EE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ME': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AE': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  // Aggregate Calculations
  const validAverages = learningAreas.map(la => {
    const itemMarks = marks[la.id] || { mid_term: 70, end_term: 75 };
    return Math.round((itemMarks.mid_term + itemMarks.end_term) / 2);
  });
  const totalScore = validAverages.reduce((a, b) => a + b, 0);
  const meanScore = validAverages.length > 0 ? Math.round(totalScore / validAverages.length) : 0;

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
            <span><strong>Academic Year:</strong> {year}</span>
            <span><strong>Grade:</strong> Grade {student.current_grade} ({student.stream})</span>
          </div>
        </div>

        {/* Student Metadata Header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Student Name</p>
            <p className="font-bold text-slate-900 truncate">{student.name}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Admission / KNEC No.</p>
            <p className="font-bold text-slate-900">{student.assessment_number}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Grade Level</p>
            <p className="font-bold text-slate-900">Grade {student.current_grade}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Stream</p>
            <p className="font-bold text-slate-900">{student.stream}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Gender</p>
            <p className="font-bold text-slate-900">{student.gender === 'M' ? 'Male' : 'Female'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Date of Birth</p>
            <p className="font-bold text-slate-900">{student.dob || '2014-01-01'}</p>
          </div>
        </div>

        {/* 5-Column Performance Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-emerald-600 pl-2">
            Academic Score Matrix
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b">
                <th className="px-3 py-2 text-left font-bold border-r">Subject</th>
                <th className="px-3 py-2 text-center font-bold border-r w-28">Mid Term Score</th>
                <th className="px-3 py-2 text-center font-bold border-r w-28">End Term Score</th>
                <th className="px-3 py-2 text-center font-bold border-r w-28">Average Score</th>
                <th className="px-3 py-2 text-center font-bold w-40">Performance Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {learningAreas.map((area) => {
                const itemMarks = marks[area.id] || { mid_term: 70, end_term: 75 };
                const midTerm = itemMarks.mid_term;
                const endTerm = itemMarks.end_term;
                const avgScore = Math.round((midTerm + endTerm) / 2);
                const level = calculatePerformanceLevel(avgScore);
                const label = getPerformanceLabel(level);

                return (
                  <tr key={area.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 font-bold text-slate-800 border-r">{area.name}</td>
                    <td className="px-3 py-2 text-center text-slate-600 border-r">{midTerm}%</td>
                    <td className="px-3 py-2 text-center text-slate-600 border-r">{endTerm}%</td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-900 border-r">{avgScore}%</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className={`font-bold text-[10px] px-2 py-0.5 ${getBadgeStyle(level)}`}>
                        {level} - {label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Aggregate Summary Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-900 text-white p-4 rounded-xl text-center">
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Total Mark Aggregate</p>
            <p className="text-xl font-black text-indigo-400">{totalScore} / {learningAreas.length * 100}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Mean Percentage</p>
            <p className="text-xl font-black text-emerald-400">{meanScore}%</p>
          </div>
        </div>

        {/* Term Dates Summary Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">School Closing Date</span>
            <span className="text-slate-900 font-bold">{closingDate}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Next Term Opening Date</span>
            <span className="text-indigo-700 font-bold">{nextOpeningDate}</span>
          </div>
        </div>

        {/* Interactive Remarks Footer */}
        <ReportCardRemarks
          teacherRemark={teacherRemark}
          hoiRemark={hoiRemark}
          onSaveTeacher={onSaveTeacher}
          onSaveHOI={onSaveHOI}
        />

        <div className="text-center pt-2 text-[9px] text-slate-400 border-t border-slate-100">
          Official computer-generated academic report card for Munyaka Primary School.
        </div>
      </CardContent>
    </Card>
  );
};