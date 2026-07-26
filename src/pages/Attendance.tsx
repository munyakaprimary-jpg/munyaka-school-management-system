"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Save, Filter, Calendar as CalendarIcon, Users } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState<string>("4-Blue");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    showSuccess('Attendance register saved successfully!');
  };

  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'absent': return <XCircle className="text-red-500" size={20} />;
      case 'late': return <Clock className="text-amber-500" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Attendance</h1>
          <p className="text-muted-foreground">Mark and manage student presence for the current session.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 bg-white shadow-sm"
            onClick={() => showSuccess('Filters applied!')}
          >
            <Filter size={18} className="mr-2 text-slate-500" />
            Filters
          </Button>
          <Button 
            className="rounded-xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Register
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
            <div>
              <CardTitle className="text-lg">Student List</CardTitle>
              <CardDescription>Class: {selectedClass}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Users size={16} />
              <span>{STUDENTS.length} Students</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Student Name</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Assessment ID</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENTS.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-500 font-medium">
                      {student.assessment}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-lg",
                            attendance[student.id] === 'present' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "text-slate-400"
                          )}
                          onClick={() => handleStatusChange(student.id, 'present')}
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button
                          variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-lg",
                            attendance[student.id] === 'late' ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-slate-400"
                          )}
                          onClick={() => handleStatusChange(student.id, 'late')}
                        >
                          <Clock size={18} />
                        </Button>
                        <Button
                          variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-lg",
                            attendance[student.id] === 'absent' ? "bg-red-500 hover:bg-red-600 text-white" : "text-slate-400"
                          )}
                          onClick={() => handleStatusChange(student.id, 'absent')}
                        >
                          <XCircle size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Session Summary</CardTitle>
              <CardDescription>Real-time attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="font-bold text-emerald-900">Present</span>
                </div>
                <span className="font-black text-emerald-700">
                  {Object.values(attendance).filter(s => s === 'present').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Clock size={20} />
                  </div>
                  <span className="font-bold text-amber-900">Late</span>
                </div>
                <span className="font-black text-amber-700">
                  {Object.values(attendance).filter(s => s === 'late').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <XCircle size={20} />
                  </div>
                  <span className="font-bold text-red-900">Absent</span>
                </div>
                <span className="font-black text-red-700">
                  {Object.values(attendance).filter(s => s === 'absent').length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Current Date</p>
                  <p className="text-lg font-black">Oct 24, 2024</p>
                </div>
              </div>
              <p className="text-indigo-100 text-sm">
                Ensure all students are accounted for before submitting the daily register.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;