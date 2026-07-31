"use client";

import { SessionAttendance } from '@/pages/AttendanceTypes';

export const getStatusBadge = (sessionData?: SessionAttendance) => {
  if (!sessionData) {
    return <span className="text-xs text-slate-400 italic">Not marked</span>;
  }
  
  const { status, time } = sessionData;
  let badgeClass = "";
  let label = "";

  if (status === 'P') {
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50";
    label = "Present";
  } else if (status === 'A') {
    badgeClass = "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50";
    label = "Absent";
  } else {
    badgeClass = "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50";
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