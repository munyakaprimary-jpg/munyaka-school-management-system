"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Edit3, Check, Calendar, Clock } from "lucide-react";
import { useAttendance } from '@/hooks/useAttendance';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AttendanceTable from '@/components/attendance/AttendanceTable';
import { useFileDownload } from '@/utils/fileDownloader';

const CLASS_OPTIONS = [
  { value: 'PP1', label: 'PP1' },
  { value: 'PP2', label: 'PP2' },
  { value: 'Grade 1', label: 'Grade 1' },
  { value: 'Grade 2', label: 'Grade 2' },
  { value: 'Grade 3', label: 'Grade 3' },
  { value: 'Grade 4', label: 'Grade 4' },
  { value: 'Grade 5', label: 'Grade 5' },
  { value: 'Grade 6', label: 'Grade 6' },
  { value: 'Grade 7', label: 'Grade 7' },
  { value: 'Grade 8', label: 'Grade 8' },
  { value: 'Grade 9', label: 'Grade 9' },
];

// Helper: get streams for selected class from munyaka_grades
const getStreamsForClass = (selectedClass: string): string[] => {
  try {
    const raw = localStorage.getItem('munyaka_grades');
    if (!raw) return ['All Streams'];
    const parsed = JSON.parse(raw);
    const activeGrade = parsed.find((g: any) => g.name === selectedClass || g.id === selectedClass);
    if (activeGrade && Array.isArray(activeGrade.streams)) {
      return ['All Streams', ...activeGrade.streams.map((s: any) =>
        typeof s === 'string' ? s : s.name
      )];
    }
  } catch (e) {}
  return ['All Streams'];
};

const Attendance = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Grade 6');
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [availableStreams, setAvailableStreams] = useState<string[]>(['All Streams']);
  const [activeSession, setActiveSession] = useState<'morning' | 'afternoon'>(() => {
    const hour = new Date().getHours();
    return hour >= 12 ? 'afternoon' : 'morning';
  });
  const [registerLocked, setRegisterLocked] = useState(false);

  // ====== Unified file-download state for CSV export ======
  const registerExport = useFileDownload();

  const { 
    students, 
    markedStudents, 
    markAttendance,
    availableStreams: hookAvailableStreams,
    isRegisterSubmitted
  } = useAttendance();

  // Update streams when class changes
  useEffect(() => {
    const streams = getStreamsForClass(selectedClass);
    setAvailableStreams(streams);
    // Reset stream if current selection not in new list
    if (!streams.includes(selectedStream)) {
      setSelectedStream('all');
    }
  }, [selectedClass]);

  // Determine active session based on current time and selected date
  useEffect(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const isToday = selectedDate === todayStr;
    const currentHour = now.getHours();

    if (isToday) {
      if (currentHour < 12) {
        setActiveSession('morning');
      } else {
        setActiveSession('afternoon');
      }
    } else {
      // Past date: default to morning but allow viewing both
      setActiveSession('morning');
    }
  }, [selectedDate]);

  // Check if register is locked (attendance already saved)
  useEffect(() => {
    const checkLock = () => {
      try {
        const raw = localStorage.getItem('munyaka_attendance_records');
        if (!raw) return false;
        const records = JSON.parse(raw);
        const key = `${selectedClass}_${selectedStream}_${selectedDate}_${activeSession}`;
        return !!records[key];
      } catch (e) {
        return false;
      }
    };
    setRegisterLocked(checkLock());
  }, [selectedClass, selectedStream, selectedDate, activeSession]);

  // ====== UNIFIED DOWNLOAD HANDLER: CSV export ======
  const handleExport = async () => {
    if (students.length === 0) {
      showError("No students available to export.");
      return;
    }

    const currentDateStr = format(new Date(selectedDate), "PP");
    const streamLabel = selectedStream === 'all' ? 'All Streams' : selectedStream;
    
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100, ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = `CLASS ATTENDANCE REGISTER - ${selectedClass.toUpperCase()} - ${streamLabel.toUpperCase()} - DATE: ${currentDateStr}`;

    const headers = ["Learner Name", "Assessment ID", "Morning Session", "Morning Time", "Afternoon Session", "Afternoon Time"];

    const getStatusLabel = (status?: string) => {
      if (status === 'P') return "Present";
      if (status === 'A') return "Absent";
      if (status === 'L') return "Late";
      return "Not Marked";
    };

    const rows = students.map(learner => {
      const record = markedStudents[learner.id] || {};
      return [
        `"${learner.name.replace(/"/g, '""')}"`,
        `"${learner.assessment.replace(/"/g, '""')}"`,
        `"${getStatusLabel(record.morning?.status)}"`,
        `"${record.morning?.time || '—'}"`,
        `"${getStatusLabel(record.afternoon?.status)}"`,
        `"${record.afternoon?.time || '—'}"`
      ];
    });

    const csvContent = [row1, row2, row3, row4, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    await registerExport.download({
      filename: `attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedStream}_${selectedDate}.csv`,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
      pendingMessage: 'Downloading attendance register...',
      successMessage: 'Attendance register downloaded successfully.',
      errorMessage: 'Download failed. Please check app permissions.',
    });
  };

  const handleSave = () => {
    // Save attendance records to localStorage
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '{}');
      const key = `${selectedClass}_${selectedStream}_${selectedDate}_${activeSession}`;
      records[key] = {
        session: activeSession,
        class: selectedClass,
        stream: selectedStream,
        date: selectedDate,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(records));
      setRegisterLocked(true);
      showSuccess("Attendance register saved successfully!");
    } catch (e) {
      showError("Failed to save attendance register.");
    }
  };

  const handleSubmitRegister = () => {
    handleSave();
  };

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();
  const showMorningOnly = isToday && currentHour < 12;
  const showAfternoonOnly = isToday && currentHour >= 12;

  // Transform students for AttendanceTable component
  const tableStudents = useMemo(() => {
    return students.map(s => ({
      id: s.id,
      name: s.name,
      assessment: s.assessment
    }));
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 table-scroll-viewport">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Attendance</h1>
          <p className="text-muted-foreground">Mark morning and afternoon roll calls with real-time timestamps.</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          {/* Grade Dropdown with Label */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GRADE</span>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200 font-bold text-slate-700">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {CLASS_OPTIONS.map((cls) => (
                  <SelectItem key={cls.value} value={cls.value} className="rounded-xl">
                    {cls.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stream Dropdown with Label */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">STREAM</span>
            <Select value={selectedStream} onValueChange={setSelectedStream}>
              <SelectTrigger className="w-[180px] rounded-xl bg-white border-slate-200 font-bold text-slate-700">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {availableStreams.map((stream: string) => (
                  <SelectItem key={stream} value={stream} className="rounded-xl">
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px] pl-10 pr-4 py-2.5 rounded-xl bg-white border-slate-200 font-bold text-slate-700 focus:ring-2 ring-indigo-100 outline-none"
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          
          <Button 
            variant={isEditing ? "default" : "outline"} 
            onClick={() => setIsEditing(!isEditing)}
            disabled={registerLocked}
            className={cn(
              "rounded-xl font-bold gap-2 transition-all",
              registerLocked 
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 hover:bg-gray-100" 
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer"
            )}
          >
            {registerLocked ? "Edit Register (Locked)" : "Edit Register"}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={registerExport.isDownloading}
            className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {registerExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Export
          </Button>
        </div>
      </div>

      {/* Session indicator */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Clock size={20} className="text-indigo-600" />
        <div>
          <p className="font-bold text-slate-900">
            Active Session: <span className="text-indigo-600 capitalize">{activeSession}</span>
          </p>
          <p className="text-xs text-slate-500">
            {showMorningOnly && "Only Morning session is available before 12:00 PM"}
            {showAfternoonOnly && "Only Afternoon session is available from 12:00 PM onwards"}
            {!showMorningOnly && !showAfternoonOnly && "Both sessions available for past dates"}
          </p>
        </div>
      </div>

      {/* Attendance Table - Now properly rendered! */}
      <AttendanceTable
        students={tableStudents}
        markedStudents={markedStudents}
        onMarkAttendance={markAttendance}
        isEditing={isEditing}
      />

      <div className="flex justify-end gap-3">
        {isEditing && (
          <Button 
            size="lg" 
            className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95" 
            onClick={handleSave}
          >
            Save Changes
          </Button>
        )}
        {!registerLocked && (
          <Button 
            size="lg" 
            className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95" 
            onClick={handleSubmitRegister}
          >
            Submit Register
          </Button>
        )}
      </div>
    </div>
  );
};

export default Attendance;