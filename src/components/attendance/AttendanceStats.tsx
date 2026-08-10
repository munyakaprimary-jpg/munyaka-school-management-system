"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Sunset, AlertCircle } from "lucide-react";

interface AttendanceStatsProps {
  students: { id: number; name: string; assessment: string }[];
  markedStudents: Record<number, { morning?: { status: string; time: string }; afternoon?: { status: string; time: string } }>;
}

const AttendanceStats = ({ students, markedStudents }: AttendanceStatsProps) => {
  const morningPresent = students.filter(s => markedStudents[s.id]?.morning?.status === 'P').length;
  const afternoonPresent = students.filter(s => markedStudents[s.id]?.afternoon?.status === 'P').length;

  return (
    <div className="action-bar">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Sun size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Morning Session</p>
            <h3 className="text-lg font-black text-slate-900">
              {morningPresent} / {students.length} Present
            </h3>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Sunset size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Afternoon Session</p>
            <h3 className="text-lg font-black text-slate-900">
              {afternoonPresent} / {students.length} Present
            </h3>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Status</p>
            <h3 className="text-lg font-black text-slate-900">Active Register</h3>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceStats;