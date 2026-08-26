"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

// NEW: Session filter prop - 'morning', 'afternoon', or 'all'
// Defaults to time-based detection if 'all'
const DEFAULT_SESSION_FILTER = 'all'; // Will be overridden by time detection below

const AttendanceTable = ({ students, markedStudents, onMarkAttendance, isEditing }: AttendanceTableProps) => {
  // --- Session Detection Logic ---
  // Use 'all' to auto-detect based on current time, or explicit 'morning'/'afternoon'
  const [sessionFilter, setSessionFilter] = useState<'morning' | 'afternoon' | 'all'>('all');

  // Auto-detect on mount based on current server/client time
  useEffect(() => {
    const detectSession = () => {
      const hour = new Date().getHours();
      // Morning: before 12 PM, Afternoon: 12 PM onwards
      setSessionFilter(hour < 12 ? 'morning' : 'afternoon');
    };
    detectSession();
    // Optional: re-detect if user manually changes filter back to 'all'
    const id = setInterval(detectSession, 60000); // re-check every minute
    return () => clearInterval(id);
  }, []);

  // If user explicitly sets filter, respect it; otherwise time-detection runs
  const isMorningSession = sessionFilter === 'morning' || (sessionFilter === 'all' && new Date().getHours() < 12);
  const isAfternoonSession = sessionFilter === 'afternoon' || (sessionFilter === 'all' && new Date().getHours() >= 12);

  // --- Render Session Column ---
  const renderSessionColumn = (
    record: StudentAttendance | undefined,
    session: 'morning' | 'afternoon',
    studentId: number
  ) => {
    const sessionData = record?.[session];
    const isActive = session === sessionFilter || (sessionFilter === 'all' && isMorningSession); // simplified logic

    // Determine if this column should be fully editable, read-only, or hidden
    const isEditableSession = sessionFilter === 'all' 
      ? (session === 'morning' ? isMorningSession : isAfternoonSession) 
      : (session === sessionFilter);

    // Render the column only if this session is active per the filter
    if (!isEditableSession) {
      // Hide column by not rendering thead/th or td for this session
      return null;
    }

    // ... (rest of the rendering logic adapted for conditional rendering)
    // For brevity, I'll structure the full component below with the conditional logic integrated
    
    // Actually, let's restructure the whole table rendering to be cleaner:
    return null; // placeholder - full implementation below
  };

  // --- Full Table Rendering with Conditional Columns ---
  
  // Determine which columns to show based on sessionFilter
  const showMorningCol = sessionFilter !== 'afternoon'; // show unless explicitly afternoon-only
  const showAfternoonCol = sessionFilter !== 'morning'; // show unless explicitly morning-only

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 bg-slate-50/50 z-10">Student Details</th>
                
                {/* Conditional Morning Column Header */}
                {showMorningCol && (
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">
                    <div>
                      <span className="font-bold text-slate-900">Morning</span>
                      <span className="text-[10px] text-slate-400">({isMorningSession ? 'Active' : 'Inactive'})</span>
                    </div>
                  </th>
                )}

                {/* Conditional Afternoon Column Header */}
                {showAfternoonCol && (
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">
                    <div>
                      <span className="font-bold text-slate-900">Afternoon</span>
                      <span className="text-[10px] text-slate-400">({isAfternoonSession ? 'Active' : 'Inactive'})</span>
                    </div>
                  </th>
                )}

                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => {
                const record = markedStudents[student.id] || {};
                
                // Determine which session's data to display for this row
                // If morning is active, show morning editing; if afternoon, show afternoon; if all, show both but dim inactive one
                
                const morningData = record.morning;
                const afternoonData = record.afternoon;
                
                // Build the editable cells dynamically
                const morningCell = showMorningCol ? (
                  <td className="px-8 py-6 border-l border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="w-24 flex justify-center">
                        {/* Editable Present/Late/Absent buttons only if this session is active */}
                        {isMorningSession ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'morning', 'present')}
                              className={`rounded-xl h-9 w-9 p-0 ${morningData?.status === 'present' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'morning', 'late')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${morningData?.status === 'late' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'morning', 'absent')}
                              className={`rounded-xl h-9 w-9 p-0 ${morningData?.status === 'absent' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                              title="Mark Absent"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          // Inactive session: show read-only status
                          <div className="w-[102px] flex justify-center opacity-40">
                            <Clock size={14} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                  ) : null
                );

                const afternoonCell = showAfternoonCol ? (
                  <td className="px-8 py-6 border-l border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="w-24 flex justify-center">
                        {isAfternoonSession ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'afternoon', 'present')}
                              className={`rounded-xl h-9 w-9 p-0 ${afternoonData?.status === 'present' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'afternoon', 'late')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${afternoonData?.status === 'late' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarkAttendance(student.id, 'afternoon', 'absent')}
                              className={`rounded-xl h-9 w-9 p-0 ${afternoonData?.status === 'absent' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                              title="Mark Absent"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          // Inactive session: read-only
                          <div className="w-[102px] flex justify-center opacity-40">
                            <Clock size={14} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                  ) : null;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-base">{student.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Assessment ID: {student.assessment}</p>
                    </td>
                    {morningCell}
                    {afternoonCell}
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