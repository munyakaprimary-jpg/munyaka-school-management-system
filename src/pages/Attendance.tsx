"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Clock, Sun, Sunset, AlertCircle } from "lucide-react";
import { showSuccess } from '@/utils/toast';

interface SessionAttendance {
  status: string; // 'P' | 'A' | 'L' (Present, Absent, Late)
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

const Attendance = () => {
  const [markedStudents, setMarkedStudents] = useState<Record<number, StudentAttendance>>({});

  const students = [
    { id: 1, name: "Brian Kiptoo", assessment: "A827361" },
    { id: 2, name: "Mary Atieno", assessment: "A827362" },
    { id: 3, name: "Emmanuel Maina", assessment: "A827363" },
    { id: 4, name: "Sheila Chepkoech", assessment: "A827364" },
    { id: 5, name: "David Mutua", assessment: "A827365" },
  ];

  const markAttendance = (id: number, session: 'morning' | 'afternoon', status: string) => {
    const timestamp = format(new Date(), "HH:mm");
    setMarkedStudents(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [session]: { status, time: timestamp }
      }
    }));
  };

  const handleSave = () => {
    showSuccess("Attendance register saved successfully!");
  };

  const getStatusBadge = (sessionData?: SessionAttendance) => {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
          <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="grade4">
            <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade4">Grade 4 - Blue</SelectItem>
              <SelectItem value="grade5">Grade 5 - Green</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl bg-white border-slate-200 font-bold text-slate-700">
            {format(new Date(), "PP")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Sun size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Morning Session</p>
            <h3 className="text-lg font-black text-slate-900">
              {students.filter(s => markedStudents[s.id]?.morning?.status === 'P').length} / {students.length} Present
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
              {students.filter(s => markedStudents[s.id]?.afternoon?.status === 'P').length} / {students.length} Present
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
                              onClick={() => markAttendance(student.id, 'morning', 'P')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.morning?.status === 'P' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => markAttendance(student.id, 'morning', 'L')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${record.morning?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => markAttendance(student.id, 'morning', 'A')}
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
                              onClick={() => markAttendance(student.id, 'afternoon', 'P')}
                              className={`rounded-xl h-9 w-9 p-0 ${record.afternoon?.status === 'P' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => markAttendance(student.id, 'afternoon', 'L')}
                              className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${record.afternoon?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => markAttendance(student.id, 'afternoon', 'A')}
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
      
      <div className="flex justify-end">
        <Button size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
          Save Register
        </Button>
      </div>
    </div>
  );
};

export default Attendance;