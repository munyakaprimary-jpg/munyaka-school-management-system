"use client";

import React from 'react';
import { Users, Sun, Moon, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface AttendanceStatsProps {
  students: { id: number; name: string; assessment: string }[];
  markedStudents: Record<number, { morning?: { status: string; time: string }; afternoon?: { status: string; time: string } }>;
}

const AttendanceStats = ({ students, markedStudents }: AttendanceStatsProps) => {
  const totalLearners = students.length;
  
  const presentMorning = students.filter(s => markedStudents[s.id]?.morning?.status === 'P').length;
  const absentMorning = students.filter(s => markedStudents[s.id]?.morning?.status === 'A').length;
  
  const presentAfternoon = students.filter(s => markedStudents[s.id]?.afternoon?.status === 'P').length;
  const absentAfternoon = students.filter(s => markedStudents[s.id]?.afternoon?.status === 'A').length;
  
  const lateCount = students.filter(s => 
    markedStudents[s.id]?.morning?.status === 'L' || markedStudents[s.id]?.afternoon?.status === 'L'
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 w-full">
      {/* 1. Total Learners */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Learners</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">{totalLearners}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Enrolled in register</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-blue-50 text-blue-600">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 2. Present Morning */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Present Morning</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600">{presentMorning}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Out of {totalLearners} learners</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-emerald-50 text-emerald-600">
          <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 3. Absent Morning */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent Morning</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-rose-600">{absentMorning}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Morning roll call</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-rose-50 text-rose-600">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 4. Present Afternoon */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Present Afternoon</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-indigo-600">{presentAfternoon}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Out of {totalLearners} learners</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-indigo-50 text-indigo-600">
          <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 5. Absent Afternoon */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent Afternoon</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">{absentAfternoon}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Afternoon roll call</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-amber-50 text-amber-600">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 6. Late */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Late Arrivals</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-orange-600">{lateCount}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Marked late in session</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-orange-50 text-orange-600">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
