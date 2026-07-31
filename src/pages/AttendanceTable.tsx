"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionAttendance } from "./AttendanceTypes";
import { getStatusBadge } from "./AttendanceUtils";

interface AttendanceTableProps {
  students: any[];
  markedStudents: Record<number, any>;
  selectedGrade: string;
  getStatusBadge: (sessionData?: SessionAttendance) => React.ReactNode;
  markAttendance: (id: number, session: 'morning' | 'afternoon', status: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  markedStudents,
  selectedGrade,
  getStatusBadge,
  markAttendance
}) => {
  const handleMark = (id: number, session: 'morning' | 'afternoon', status: string) => {
    markAttendance(id, session, status);
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50/50 border-b">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Morning Session</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Afternoon Session</th>
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
                      
                      {/* Morning Session Column */}
                      <td className="px-8 py-6 border-l border-slate-100">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <div className="w-24 flex justify-center">
                            {getStatusBadge(record.morning)}
                          </div>
                          <div className="flex gap-1.5">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'morning', 'P')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.morning?.status === 'P' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'morning', 'L')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${record.morning?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'morning', 'A')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.morning?.status === 'A' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                              title="Mark Absent"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      </td>

                      {/* Afternoon Session Column */}
                      <td className="px-8 py-6 border-l border-slate-100">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <div className="w-24 flex justify-center">
                            {getStatusBadge(record.afternoon)}
                          </div>
                          <div className="flex gap-1.5">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'afternoon', 'P')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.afternoon?.status === 'P' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'afternoon', 'L')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${record.afternoon?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleMark(student.id, 'afternoon', 'A')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.afternoon?.status === 'A' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                              title="Mark Absent"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
};

export default AttendanceTable;