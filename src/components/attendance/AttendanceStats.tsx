"use client";

import React from 'react';
import { Users, Sun, Moon, AlertTriangle, CheckCircle2 } from "lucide-react";

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
  
  const storedCount = Object.keys(markedStudents).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', width: '100%' }}>
      {/* Card 1: Total Learners */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Learners</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">{totalLearners}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Enrolled in register</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-blue-50 text-blue-600">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card 2: Present Morning */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Present Morning</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600">{presentMorning}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Out of {totalLearners} learners</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-emerald-50 text-emerald-600">
          <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card 3: Absent Morning */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent Morning</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-rose-600">{absentMorning}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Morning roll call</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-rose-50 text-rose-600">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card 4: Present Afternoon */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Present Afternoon</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-indigo-600">{presentAfternoon}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Out of {totalLearners} learners</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-indigo-50 text-indigo-600">
          <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card 5: Absent Afternoon */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent Afternoon</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">{absentAfternoon}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Afternoon roll call</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-amber-50 text-amber-600">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card 6: Roll Storage (Synced) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll Storage</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">{storedCount}</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">records stored</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2 bg-violet-50 text-violet-600">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
