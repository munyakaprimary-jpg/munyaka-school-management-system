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

interface LowerPrimaryReportCardProps {
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

// 8-Tier CBC Evaluation Rubric Legend
const CBC_8_TIER_RUBRIC = [
  { band: 'EE4', range: '85 - 100%', level: 'Exceeding Expectations', desc: 'Consistently demonstrates deep conceptual mastery & innovation.' },
  { band: 'EE3', range: '75 - 84%', level: 'Exceeding Expectations', desc: 'Exceeds standard learning outcomes independently.' },
  { band: 'ME2', range: '65 - 74%', level: 'Meeting Expectations', desc: 'Fully meets required competency benchmarks.' },
  { band: 'ME1', range: '50 - 64%', level: 'Meeting Expectations', desc: 'Meets core expectations with minor guidance.' },
  { band: 'AE2', range: '40 - 49%', level: 'Approaching Expectations', desc: 'Developing competency; requires routine practice.' },
  { band: 'AE1', range: '30 - 39%', level: 'Approaching Expectations', desc: 'Partial understanding; requires close monitoring.' },
  { band: 'BE2', range: '20 - 29%', level: 'Below Expectations', desc: 'Struggling with fundamentals; needs remedial help.' },
  { band: 'BE1', range: '0 - 19%', level: 'Below Expectations', desc: 'Requires intensive individual support intervention.' },
];

export const LowerPrimaryReportCard: React.FC<LowerPrimaryReportCardProps> = ({
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

  return (
    <Card className="max-w-4xl mx-auto border border-slate-200 shadow-md rounded-none bg-white p-6 md:p-10 print:shadow-none print:p-0 print:border-none print:page-break-after">
      <CardContent className="space-y-6 p-0">
        {/* Header */}
        <div className="text-center space-y-1.5 border-b-2 border-indigo-600 pb-4 relative">
          <div className="absolute left-2 top-1 hidden sm:block">
            <School size={50} className="text-indigo-600 opacity-20" />
          </div>
          <h2 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Munyaka Primary School</h2>
          <p className="text-xs font-bold text-slate-600">P.O. Box 5239-30100 Eldoret • Tel: +254 700 000 000</p>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase font-black tracking-widest px-3 py-0.5">
            Lower Primary CBC Progress Report (Grades 1-3)
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
            <p className="font-bold text-slate-900">{student.dob || '2016-01-01'}</p>
          </div>
        </div>

        {/* 5-Column Report Card Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-indigo-600 pl-2">
            Academic Performance Summary
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
                const itemMarks = marks[area.id] || { mid_term: 70, end_term: 78 };
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

        {/* 8-Tier CBC Evaluation Rubric Legend */}
        <div className="space-y-2 pt-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900 border-b pb-1">
            Official 8-Tier CBC Evaluation Rubric Legend
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            {CBC_8_TIER_RUBRIC.map((rubric) => (
              <div key={rubric.band} className="p-2 rounded bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-black text-indigo-700">{rubric.band}</span>
                  <span className="text-slate-500 font-semibold">{rubric.range}</span>
                </div>
                <p className="font-bold text-slate-800 text-[9px]">{rubric.level}</p>
                <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{rubric.desc}</p>
              </div>
            ))}
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
          Official computer-generated progress report for Munyaka Primary School Lower Primary Section.
        </div>
      </CardContent>
    </Card>
  );
};