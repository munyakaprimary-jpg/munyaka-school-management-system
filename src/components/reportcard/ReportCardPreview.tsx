"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReportCardPreviewProps {
  student: any;
  gradeName: string;
  streamName: string;
  term: string;
  academicYear: string;
  subjects: any[];
  attendance: { present: number; absent: number };
  teacherName: string;
  principalName: string;
}

const ReportCardPreview: React.FC<ReportCardPreviewProps> = ({ 
  student, 
  gradeName, 
  streamName, 
  term, 
  academicYear, 
  subjects, 
  attendance, 
  teacherName, 
  principalName 
}) => {
  const getPerformanceBadgeClass = (lvl: string) => {
    switch (lvl) {
      case 'EE':
        return "bg-emerald-50 text-emerald-700 border-none";
      case 'ME':
        return "bg-blue-50 text-blue-700 border-none";
      case 'AE':
        return "bg-amber-50 text-amber-700 border-none";
      default:
        return "bg-rose-50 text-rose-700 border-none";
    }
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="text-center space-y-2 border-b-2 border-primary pb-6 relative">
          <div className="absolute left-0 top-0 hidden md:block">
            <School size={60} className="text-primary opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Munyaka Primary and Junior School</h2>
          <p className="text-sm font-bold">P.O. Box 5239-30100 Eldoret</p>
          <p className="text-sm font-medium uppercase text-slate-500">Academic Progress Report</p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-left text-xs">
              <p><span className="text-muted-foreground">Year:</span> {academicYear}</p>
              <p className="text-sm font-bold">Term: {term}</p>
            </div>
            <div className="text-left text-xs">
              <p><span className="text-muted-foreground">Grade:</span> {gradeName}</p>
              <p><span className="text-muted-foreground">Stream:</span> {streamName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8">
          <div className="md:col-span-1">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto">
              <div className="text-4xl font-black text-slate-400">
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>
            <div className="text-center mt-4">
              <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
              <p className="text-sm text-slate-600">ID: {student.admissionNumber}</p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance Summary</h3>
            <table className="w-full text-sm border">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-slate-500 uppercase tracking-widest">Learning Area</th>
                  <th className="px-4 py-3 text-center text-slate-500 uppercase tracking-widest">Score/Grade</th>
                  <th className="px-4 py-3 text-center text-slate-500 uppercase tracking-widest">Level</th>
                  <th className="px-4 py-3 text-center text-slate-500 uppercase tracking-widest">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((subject, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-bold text-slate-900">{subject.name}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">{subject.score}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={getPerformanceBadgeClass(subject.lvl)}>
                        {subject.lvl}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{subject.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 pt-0">
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase">Attendance Summary</p>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-sm font-bold text-slate-500">Days Present</p>
                <p className="text-lg font-bold text-emerald-600">{attendance.present}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-sm font-bold text-slate-500">Days Absent</p>
                <p className="text-lg font-bold text-rose-600">{attendance.absent}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher's Remarks</p>
            <p className="text-sm italic border-b border-dotted pb-2">
              A very hardworking and disciplined student. Keep it up!
            </p>
            <p className="text-xs font-bold pt-4">Sign: ............................................</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase">Headteacher's Message</p>
            <p className="text-sm italic border-b border-dotted pb-2">
              Outstanding performance across all learning areas.
            </p>
            <p className="text-xs font-bold pt-4">Sign: ............................................</p>
          </div>
        </div>

        <div className="text-center pt-8 text-[10px] text-slate-400">
          This is an official computer-generated report card for Munyaka Primary School.
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCardPreview;