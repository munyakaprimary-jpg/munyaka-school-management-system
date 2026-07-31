"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Lock } from "lucide-react";

interface SessionAttendance {
  status: string;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

interface Student {
  id: number;
  name: string;
  assessment: string;
}

interface AttendanceTableProps {
  students: Student[];
  markedStudents: Record<number, StudentAttendance>;
  onMarkAttendance: (id: number, session: 'morning' | 'afternoon', status: string) => void;
  isEditing: boolean;
}

const AttendanceTable = ({ students, markedStudents, onMarkAttendance, isEditing }: AttendanceTableProps) => {
  const getStatusBadge = (sessionData?: SessionAttendance) => {
    if (!sessionData) {
      return <span className="text-xs text-slate-400 italic">Not marked</span>;
    }
    
    const { status, time } = sessionData;
    let badgeClass = "";
    let label = "";

    if (status === 'P') {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
      label = "Present";
    } else if (status === 'A') {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
      label = "Absent";
    } else {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
      label = "Late";
    }

    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="outline" className={`font-bold rounded-lg px-2.5 py-0.5 ${badgeClass}`}>
          {label}
        </Badge>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock size={10} /> {time}
        </span>
      </div>
    );
  };

  const renderSessionColumn = (
    record: StudentAttendance | undefined,
    session: 'morning' | 'afternoon',
    studentId: number
  ) => {
    const sessionData = record?.[session];
    return (
      <td className="px-8 py-6 border-l border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-24 flex justify-center">
            {getStatusBadge(sessionData)}
          </div>
          
          {isEditing && (
            <div className="flex gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onMarkAttendance(studentId, session, 'P')}
                className={`rounded-xl h-9 w-9 p-0 ${sessionData?.status === 'P' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                title="Mark Present"
              >
                <Check size={16} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onMarkAttendance(studentId, session, 'L')}
                className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${sessionData?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                title="Mark Late"
              >
                L
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onMarkAttendance(studentId, session, 'A')}
                className={`rounded-xl h-9 w-9 p-0 ${sessionData?.status === 'A' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                title="Mark Absent"
              >
                <X size={16} />
              </Button>
            </div>
          )}
          
          {!isEditing && (
            <div className="w-[102px] flex justify-center opacity-40">
              <Lock size={14} className="text-slate-300" />
            </div>
          )}
        </div>
      </td>
    );
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Morning Session</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Afternoon Session</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => {
                const record = markedStudents[student.id] || {};
                return (
                  <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-base">{student.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Assessment ID: {student.assessment}</p>
                    </td>
                    {renderSessionColumn(record, 'morning', student.id)}
                    {renderSessionColumn(record, 'afternoon', student.id)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;