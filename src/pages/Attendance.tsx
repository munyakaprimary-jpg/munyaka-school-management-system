"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Clock, Sun, Sunset, AlertCircle, Download, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AttendancePasswordModal } from "@/components/ui/AttendancePasswordModal";

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
  const [selectedGrade, setSelectedGrade] = useState("grade4");
  const [isExporting, setIsExporting] = useState(false);
  const [editingSession, setEditingSession] = useState<{ studentId: number; session: 'morning' | 'afternoon' } | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [password, setPassword] = useState('');

  // Load saved attendance from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMarkedStudents(parsed);
        }
      } catch (e) {
        console.error("Error loading saved attendance:", e);
      }
    }
  }, []);

  // Save attendance to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(markedStudents).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markedStudents));
    }
  }, [markedStudents]);

  const students = [
    { id: 1, name: "Brian Kiptoo", assessment: "A827361" },
    { id: 2, name: "Mary Atieno", assessment: "A827362" },
    { id: 3, name: "Emmanuel Maina", assessment: "A827363" },
    { id: 4, name: "Sheila Chepkoech", assessment: "A827364" },
    { id: 5, name: "David Mutua", assessment: "A827365" },
  ];

  const markAttendance = useCallback(
    (id: number, session: 'morning' | 'afternoon', status: string) => {
      const timestamp = format(new Date(), "HH:mm");
      // Check if this session is already marked
      const prev = markedStudents[id];
      const alreadyMarked = prev?.[session]?.status !== undefined;

      if (alreadyMarked) {
        // Need password verification before allowing change
        setEditingSession({ studentId: id, session });
        setPasswordModalOpen(true);
        return;
      }

      const timestamp = format(new Date(), "HH:mm");
      setMarkedStudents(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [session]: { status, time: timestamp }
        }
      }));
      showSuccess(`Attendance marked as ${status}`);
    }, []);
  };

  const handleVerify = () => {
    const adminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    if (password === adminPass) {
      setIsVerifying(false);
      setAuthError('');
      setPasswordModalOpen(false);
      setEditingSession(null);
      onVerify();
    } else {
      setAuthError('Invalid admin password');
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    const adminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    if (password === adminPass) {
      setIsVerifying(false);
      setAuthError('');
      setPasswordModalOpen(false);
      setEditingSession(null);
      onVerify();
    } else {
      setAuthError('Invalid admin password');
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    handleVerify();
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      // ... existing export logic ...
      setIsExporting(false);
      showSuccess('Attendance register exported successfully!');
    }, 1000);
  };

  const getStatusBadge = (sessionData?: SessionAttendance) => {
    if (!sessionData) {
      return <span className="text-xs text-slate-400 italic">Not marked</span>;
    }
    const { status, time } = sessionData;
    let badgeClass = '';
    let label = '';
    if (status === 'P') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50';
      label = 'Present';
    } else if (status === 'A') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50';
      label = 'Absent';
    } else {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50';
      label = 'Late';
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
    </div>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
          <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="rounded-xl bg-white border-slate-200 font-bold text-slate-700 gap-2 hover:bg-slate-50 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Export Register
              </Button>
            ) : (
              <Download size={16} /> Export Register
            )}
          </Button>
        </div>
      </div>

      {/* Password verification modal */}
      {editingSession && (
        <AttendancePasswordModal
          isOpen={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
            setEditingSession(null);
          }}
          studentId={editingSession.studentId}
          session={editingSession.session}
          onVerify={handleVerify}
          authError={authError}
          setAuthError={setAuthError}
          isVerifying={isVerifying}
          setIsVerifying={setIsVerifying}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Sun size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Morning Session</p>
              <h3 className="text-lg font-black text-slate-900">
                {students.filter(s => markedStudents[s.id]?.morning?.status === 'P').length} / {students.length} Present
              </h3>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Sunset size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Afternoon Session</p>
              <h3 className="text-lg font-black text-slate-900">
                {students.filter(s => markedStudents[s.id]?.afternoon?.status === 'P').length} / {students.length} Present
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Morning Session</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-center border-l border-slate-100">Afternoon Session</th>
              </tr>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-400 font-medium">Assessment ID: {student.assessment}</p>
                    </td>
                    {/* Morning Session Column */}
                    <td className="px-8 py-6 border-l border-slate-100">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <span className="text-sm text-slate-600">{markedStudents[student.id]?.morning?.status || 'Not marked'}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAttendance(student.id, 'morning', 'P')}
                            className="rounded-xl h-9 w-9 p-0"
                            title="Mark Present"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAttendance(student.id, 'morning', 'L')}
                            className={`rounded-xl h-9 w-9 p-0 ${markedStudents[student.id]?.morning?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                            title="Mark Late"
                          >
                            <L size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAttendance(student.id, 'morning', 'A')}
                            className={`rounded-xl h-9 w-9 p-0 ${markedStudents[student.id]?.morning?.status === 'A' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                            title="Mark Absent"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </td>

                      {/* Afternoon Session Column */}
                      <td className="px-8 py-6 border-l border-slate-100">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-24 flex justify-center">
                            {getStatusBadge(markedStudents[student.id]?.afternoon)}
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAttendance(student.id, 'afternoon', 'P')}
                              className="rounded-xl h-9 w-9 p-0"
                              title="Mark Present"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAttendance(student.id, 'afternoon', 'L')}
                              className={`rounded-xl h-9 w-9 p-0 ${markedStudents[student.id]?.afternoon?.status === 'L' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                              title="Mark Late"
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAttendance(student.id, 'afternoon', 'A')}
                              className={`rounded-xl h-9 w-9 p-0 ${markedStudents[student.id]?.afternoon?.status === 'A' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                              title="Mark Absent"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;