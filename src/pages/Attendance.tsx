"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, Printer, Save, Loader2, Calendar, CheckCircle2, 
  XCircle, Clock, ShieldCheck, UserCheck, Users, AlertCircle,
  FileDown, Search
} from "lucide-react";
import { useFileDownload } from "@/utils/fileDownloader";
import { cn } from "@/lib/utils";

type AttendanceStatus = 'P' | 'A' | 'L' | 'E'; // Present, Absent, Late, Excused
type SessionType = 'morning' | 'afternoon';

interface Learner {
  id: number;
  name: string;
  assessment: string;
  gender?: 'M' | 'F';
  grade?: string;
  stream?: string;
}

interface SessionAttendance {
  status: AttendanceStatus;
  time: string;
}

interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}

interface Filters {
  date: string;
  grade: string;
  stream: string;
}

// Mock data — in real implementation, this comes from useStudents() or localStorage
const MOCK_LEARNERS: Learner[] = [
  { id: 1, name: "BRIAN KIPTOO", assessment: "MPS/2025/005", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 2, name: "MARY ATIENO", assessment: "MPS/2025/012", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 3, name: "EMMANUEL MAINA", assessment: "MPS/2025/018", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 4, name: "SHEILA CHEPKOECH", assessment: "MPS/2025/023", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 5, name: "DAVID MUTUA", assessment: "MPS/2025/031", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 6, name: "GRACE WANJIKU", assessment: "MPS/2025/037", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 7, name: "JOSEPH KARIUKI", assessment: "MPS/2025/042", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 8, name: "FAITH NJERI", assessment: "MPS/2025/048", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 9, name: "GEORGE OCHIENG", assessment: "MPS/2025/054", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 10, name: "HELEN MORAA", assessment: "MPS/2025/061", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 11, name: "SAMUEL KAMAU", assessment: "MPS/2025/068", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 12, name: "WINNIE ACHIENG", assessment: "MPS/2025/073", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 13, name: "PETER ODHIAMBO", assessment: "MPS/2025/081", gender: "M", grade: "Grade 6", stream: "YELLOW" },
  { id: 14, name: "JANE MWANGI", assessment: "MPS/2025/089", gender: "F", grade: "Grade 6", stream: "YELLOW" },
  { id: 15, name: "DAVID MAINA", assessment: "MPS/2025/094", gender: "M", grade: "Grade 6", stream: "YELLOW" },
];

const Attendance = () => {
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    date: '2026-08-28',
    grade: 'Grade 6',
    stream: 'YELLOW',
  });

  // Attendance state — keyed by student id, then session type
  const [attendance, setAttendance] = useState<Record<number, StudentAttendance>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ====== Unified file-download state for CSV export ======
  const csvExport = useFileDownload();

  // Load attendance from localStorage on mount and when filters change
  useEffect(() => {
    try {
      const storageKey = `munyaka_attendance_v2_${filters.grade}_${filters.stream}_${filters.date}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setAttendance(parsed as Record<number, StudentAttendance>);
        } else {
          setAttendance({});
        }
      } else {
        setAttendance({});
      }
    } catch (e) {
      console.error("Error loading attendance:", e);
      setAttendance({});
    }
  }, [filters.grade, filters.stream, filters.date]);

  // Filtered students by search
  const filteredLearners = useMemo(() => {
    if (!searchTerm.trim()) return MOCK_LEARNERS;
    const term = searchTerm.toLowerCase();
    return MOCK_LEARNERS.filter(
      s => s.name.toLowerCase().includes(term) || 
           s.assessment.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Compute summary metrics — combined across both sessions
  const metrics = useMemo(() => {
    const total = filteredLearners.length;
    let presentMorning = 0;
    let absentMorning = 0;
    let lateMorning = 0;
    let excusedMorning = 0;
    let presentAfternoon = 0;
    let absentAfternoon = 0;
    let lateAfternoon = 0;
    let excusedAfternoon = 0;

    filteredLearners.forEach(s => {
      const record = attendance[s.id] || {};
      if (record.morning?.status === 'P') presentMorning++;
      if (record.morning?.status === 'A') absentMorning++;
      if (record.morning?.status === 'L') lateMorning++;
      if (record.morning?.status === 'E') excusedMorning++;
      if (record.afternoon?.status === 'P') presentAfternoon++;
      if (record.afternoon?.status === 'A') absentAfternoon++;
      if (record.afternoon?.status === 'L') lateAfternoon++;
      if (record.afternoon?.status === 'E') excusedAfternoon++;
    });

    // Combined totals
    const present = presentMorning + presentAfternoon;
    const absent = absentMorning + absentAfternoon;
    const late = lateMorning + lateAfternoon;
    const excused = excusedMorning + excusedAfternoon;
    const totalMarks = present + absent + late + excused;
    const rate = totalMarks > 0 ? Math.round((present / totalMarks) * 100) : 0;

    return { 
      total, 
      present, 
      absent, 
      late, 
      excused, 
      rate,
      presentMorning,
      absentMorning,
      lateMorning,
      excusedMorning,
      presentAfternoon,
      absentAfternoon,
      lateAfternoon,
      excusedAfternoon,
    };
  }, [filteredLearners, attendance]);

  // Toggle individual student session status
  const setSessionStatus = (studentId: number, session: SessionType, status: AttendanceStatus) => {
    setAttendance(prev => {
      const currentRecord = prev[studentId] || {};
      const currentSession = currentRecord[session];
      
      // Click the active button again to deselect (clear status)
      if (currentSession?.status === status) {
        const { [session]: _, ...rest } = currentRecord;
        const updated = { ...prev };
        if (Object.keys(rest).length === 0) {
          delete updated[studentId];
        } else {
          updated[studentId] = rest;
        }
        return updated;
      }

      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return {
        ...prev,
        [studentId]: {
          ...currentRecord,
          [session]: { status, time: timestamp }
        }
      };
    });
  };

  // Bulk action: set all students in a given session to a status
  const markAllAs = (status: AttendanceStatus, session: SessionType = 'morning') => {
    const bulk: Record<number, StudentAttendance> = {};
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    filteredLearners.forEach(s => {
      const existing = attendance[s.id] || {};
      bulk[s.id] = {
        ...existing,
        [session]: { status, time: timestamp }
      };
    });
    setAttendance(prev => ({ ...prev, ...bulk }));
    const labels = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' } as const;
    const sessionLabel = session === 'morning' ? 'morning' : 'afternoon';
    showSuccess(`Marked all ${filteredLearners.length} learners as ${labels[status]} in the ${sessionLabel} session.`);
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      const storageKey = `munyaka_attendance_v2_${filters.grade}_${filters.stream}_${filters.date}`;
      // Store as {studentId: {morning: {...}, afternoon: {...}}}
      localStorage.setItem(storageKey, JSON.stringify(attendance));
      
      // Also update the master record map used by the dashboard
      const masterRaw = localStorage.getItem('munyaka_attendance_records') || '{}';
      const master = JSON.parse(masterRaw);
      const masterKey = `${filters.grade}_${filters.stream}_${filters.date}`;
      master[masterKey] = { 
        class: filters.grade, 
        stream: filters.stream, 
        date: filters.date, 
        savedAt: new Date().toISOString() 
      };
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(master));
      
      setIsSaving(false);
      showSuccess(`Attendance for ${filters.grade} ${filters.stream} on ${filters.date} saved!`);
    } catch (e) {
      setIsSaving(false);
      showError("Failed to save attendance.");
    }
  };

  // Print handler
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // ====== UNIFIED DOWNLOAD HANDLER: CSV export ======
  const handleExportCSV = async () => {
    if (filteredLearners.length === 0) {
      showError("No students available to export.");
      return;
    }

    const currentDateStr = filters.date;
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100, ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = `ATTENDANCE REGISTER - ${filters.grade.toUpperCase()} ${filters.stream.toUpperCase()} - DATE: ${currentDateStr}`;

    const headers = ["#", "Learner Name", "Admission/ID", "Gender", "Morning Status", "Morning Time", "Afternoon Status", "Afternoon Time"];

    const getStatusLabel = (status?: AttendanceStatus) => {
      if (status === 'P') return "Present";
      if (status === 'A') return "Absent";
      if (status === 'L') return "Late";
      if (status === 'E') return "Excused";
      return "Not Marked";
    };

    const rows = filteredLearners.map((learner, idx) => {
      const record = attendance[learner.id] || {};
      return [
        idx + 1,
        `"${learner.name.replace(/"/g, '""')}"`,
        `"${learner.assessment.replace(/"/g, '""')}"`,
        learner.gender === 'M' ? 'Male' : learner.gender === 'F' ? 'Female' : 'Other',
        getStatusLabel(record.morning?.status),
        record.morning?.time || '—',
        getStatusLabel(record.afternoon?.status),
        record.afternoon?.time || '—'
      ];
    });

    // Summary rows
    const summaryRows = [
      ["", "", "", "Morning Present", metrics.presentMorning, "", "Afternoon Present", metrics.presentAfternoon],
      ["", "", "", "Morning Absent", metrics.absentMorning, "", "Afternoon Absent", metrics.absentAfternoon],
      ["", "", "", "Morning Late", metrics.lateMorning, "", "Afternoon Late", metrics.lateAfternoon],
      ["", "", "", "Morning Excused", metrics.excusedMorning, "", "Afternoon Excused", metrics.excusedAfternoon],
      ["", "", "", "Overall Rate", `${metrics.rate}%`, "", "", ""],
    ];

    const csvContent = [
      row1,
      row2,
      row3,
      row4,
      "",
      headers.join(","),
      ...rows.map(r => r.join(",")),
      "",
      ["SUMMARY", "", "", "", "", "", "", ""],
      ...summaryRows.map(r => r.map(c => `"${c}"`).join(","))
    ].join("\n");

    await csvExport.download({
      filename: `attendance_${filters.grade.replace(/\s+/g, '_')}_${filters.stream}_${filters.date}.csv`,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-full">
      
      {/* ============================================
          1. HEADER SECTION
          ============================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendance</h1>
            <p className="text-sm text-slate-500 font-medium">Mark daily attendance for each class.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={csvExport.isDownloading}
            className="rounded-xl border-slate-200 bg-white gap-2 text-sm font-bold h-11 px-4 hover:bg-slate-50"
          >
            {csvExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl border-slate-200 bg-white gap-2 text-sm font-bold h-11 px-4 hover:bg-slate-50"
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm font-bold h-11 px-5 shadow-lg shadow-indigo-100"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Attendance
          </Button>
        </div>
      </div>

      {/* ============================================
          2. FILTERS & GLOBAL ACTIONS
          ============================================ */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          
          {/* Date Picker */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Grade Dropdown */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Grade
            </label>
            <Select value={filters.grade} onValueChange={(val) => setFilters({...filters, grade: val})}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PP1">PP1</SelectItem>
                <SelectItem value="PP2">PP2</SelectItem>
                <SelectItem value="Grade 1">Grade 1</SelectItem>
                <SelectItem value="Grade 2">Grade 2</SelectItem>
                <SelectItem value="Grade 3">Grade 3</SelectItem>
                <SelectItem value="Grade 4">Grade 4</SelectItem>
                <SelectItem value="Grade 5">Grade 5</SelectItem>
                <SelectItem value="Grade 6">Grade 6</SelectItem>
                <SelectItem value="Grade 7">Grade 7</SelectItem>
                <SelectItem value="Grade 8">Grade 8</SelectItem>
                <SelectItem value="Grade 9">Grade 9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stream Dropdown */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Stream
            </label>
            <Select value={filters.stream} onValueChange={(val) => setFilters({...filters, stream: val})}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YELLOW">YELLOW</SelectItem>
                <SelectItem value="BLUE">BLUE</SelectItem>
                <SelectItem value="GREEN">GREEN</SelectItem>
                <SelectItem value="RED">RED</SelectItem>
                <SelectItem value="ALPHA">ALPHA</SelectItem>
                <SelectItem value="BETA">BETA</SelectItem>
                <SelectItem value="MERCURY">MERCURY</SelectItem>
                <SelectItem value="VENUS">VENUS</SelectItem>
                <SelectItem value="JUPITER">JUPITER</SelectItem>
                <SelectItem value="NEPTUNE">NEPTUNE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Global bulk action buttons */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              Bulk Actions (Morning Session)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              <button
                onClick={() => markAllAs('P', 'morning')}
                className="h-11 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-widest border border-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                title="Mark all as Present in morning"
              >
                <CheckCircle2 size={14} />
                <span>Present</span>
              </button>
              <button
                onClick={() => markAllAs('A', 'morning')}
                className="h-11 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] uppercase tracking-widest border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                title="Mark all as Absent in morning"
              >
                <XCircle size={14} />
                <span>Absent</span>
              </button>
              <button
                onClick={() => markAllAs('L', 'morning')}
                className="h-11 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-widest border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                title="Mark all as Late in morning"
              >
                <Clock size={14} />
                <span>Late</span>
              </button>
              <button
                onClick={() => markAllAs('E', 'morning')}
                className="h-11 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] uppercase tracking-widest border border-sky-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                title="Mark all as Excused in morning"
              >
                <ShieldCheck size={14} />
                <span>Excused</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================
          3. SUMMARY METRICS CARDS (Combined totals)
          ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Total Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1">learners in class</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
        </Card>

        {/* Present Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Present</p>
              <h3 className="text-3xl font-black text-emerald-700 mt-1">{metrics.present}</h3>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">sessions marked</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </Card>

        {/* Absent Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-rose-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Absent</p>
              <h3 className="text-3xl font-black text-rose-700 mt-1">{metrics.absent}</h3>
              <p className="text-[10px] font-bold text-rose-600 mt-1">sessions missed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle size={22} />
            </div>
          </div>
        </Card>

        {/* Late Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Late</p>
              <h3 className="text-3xl font-black text-amber-700 mt-1">{metrics.late}</h3>
              <p className="text-[10px] font-bold text-amber-600 mt-1">tardy sessions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
        </Card>

        {/* Rate Card with Progress Bar */}
        <Card className="border-none shadow-sm rounded-2xl bg-indigo-50 p-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Rate</p>
                <h3 className="text-3xl font-black text-indigo-700 mt-1">{metrics.rate}%</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <UserCheck size={22} />
              </div>
            </div>
            <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out" 
                style={{ width: `${metrics.rate}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-indigo-600 mt-1.5">overall attendance rate</p>
          </div>
        </Card>
      </div>

      {/* ============================================
          4. STUDENT ATTENDANCE TABLE (Morning & Afternoon)
          ============================================ */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        
        {/* Section header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {filters.grade} {filters.stream} — {filters.date}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Click a status button to mark each session. Click again to clear.
              </p>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search learner name or ID..."
              className="pl-10 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Structured Table with Morning/Afternoon sub-rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
            <thead>
              {/* Group header */}
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th 
                  rowSpan={2} 
                  className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500 border-r border-slate-200 align-bottom min-w-[260px]"
                >
                  Learners
                </th>
                <th colSpan={4} className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-amber-700 text-center border-r border-slate-200">
                  <div className="flex items-center justify-center gap-2">
                    <span>☀</span> Morning Session
                  </div>
                </th>
                <th colSpan={4} className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-indigo-700 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span>🌙</span> Afternoon Session
                  </div>
                </th>
              </tr>
              {/* Sub-header row with status column names */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-emerald-600 text-center border-r border-slate-200 min-w-[80px]">
                  Present
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-rose-600 text-center border-r border-slate-200 min-w-[80px]">
                  Absent
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-amber-600 text-center border-r border-slate-200 min-w-[80px]">
                  Late
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-sky-600 text-center border-r border-slate-200 min-w-[80px]">
                  Excused
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-emerald-600 text-center border-r border-slate-200 min-w-[80px]">
                  Present
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-rose-600 text-center border-r border-slate-200 min-w-[80px]">
                  Absent
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-amber-600 text-center border-r border-slate-200 min-w-[80px]">
                  Late
                </th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-sky-600 text-center min-w-[80px]">
                  Excused
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner, index) => {
                  const record = attendance[learner.id] || {};
                  const morningStatus = record.morning?.status;
                  const afternoonStatus = record.afternoon?.status;
                  return (
                    <tr key={learner.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Learners column: index, name, ID, gender */}
                      <td className="px-6 py-4 border-r border-slate-100 min-w-[260px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{learner.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {learner.assessment}
                              </p>
                              <span className="text-slate-300">•</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "rounded-md font-black text-[9px] uppercase tracking-widest px-1.5 py-0 leading-tight",
                                  learner.gender === 'M' 
                                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                                    : "bg-pink-50 text-pink-700 border-pink-200"
                                )}
                              >
                                {learner.gender === 'M' ? 'Male' : 'Female'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Morning session — Present */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="P"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-emerald-500 border-emerald-500 text-white shadow-md"
                          inactiveClass="bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        />
                      </td>

                      {/* Morning session — Absent */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="A"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-rose-500 border-rose-500 text-white shadow-md"
                          inactiveClass="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        />
                      </td>

                      {/* Morning session — Late */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="L"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-amber-500 border-amber-500 text-white shadow-md"
                          inactiveClass="bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                        />
                      </td>

                      {/* Morning session — Excused */}
                      <td className="px-2 py-3 border-r border-slate-200 text-center">
                        <SessionStatusButton
                          status="E"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-sky-500 border-sky-500 text-white shadow-md"
                          inactiveClass="bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
                        />
                      </td>

                      {/* Afternoon session — Present */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="P"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-emerald-500 border-emerald-500 text-white shadow-md"
                          inactiveClass="bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        />
                      </td>

                      {/* Afternoon session — Absent */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="A"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-rose-500 border-rose-500 text-white shadow-md"
                          inactiveClass="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        />
                      </td>

                      {/* Afternoon session — Late */}
                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="L"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-amber-500 border-amber-500 text-white shadow-md"
                          inactiveClass="bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                        />
                      </td>

                      {/* Afternoon session — Excused */}
                      <td className="px-2 py-3 text-center">
                        <SessionStatusButton
                          status="E"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          activeClass="bg-sky-500 border-sky-500 text-white shadow-md"
                          inactiveClass="bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-800 font-bold">No learners match your search.</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Try a different name or admission number above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {filteredLearners.length > 0 && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-bold text-slate-500">
              <span className="text-slate-900 font-black">{metrics.total}</span> learners × 2 sessions = <span className="text-slate-900 font-black">{metrics.total * 2}</span> total slots
            </p>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {metrics.present} P</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {metrics.absent} A</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {metrics.late} L</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> {metrics.excused} E</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Session-specific status toggle button
interface SessionStatusButtonProps {
  status: AttendanceStatus;
  session: SessionType;
  studentId: number;
  currentStatus?: AttendanceStatus;
  currentTime?: string;
  onSetStatus: (studentId: number, session: SessionType, status: AttendanceStatus) => void;
  activeClass: string;
  inactiveClass: string;
}

const SessionStatusButton: React.FC<SessionStatusButtonProps> = ({ 
  status, 
  session, 
  studentId, 
  currentStatus, 
  onSetStatus,
  activeClass, 
  inactiveClass 
}) => {
  const isActive = currentStatus === status;
  const labels = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' };
  return (
    <button
      type="button"
      onClick={() => onSetStatus(studentId, session, status)}
      title={`${labels[status]} (${session})`}
      aria-label={`${labels[status]} (${session})`}
      aria-pressed={isActive}
      className={cn(
        "w-8 h-8 rounded-lg border-2 font-bold text-[10px] uppercase tracking-widest transition-all duration-200 active:scale-90 flex items-center justify-center mx-auto",
        isActive ? activeClass : inactiveClass
      )}
    >
      {isActive ? <CheckCircle2 size={14} /> : <span className="text-[9px]">{labels[status][0]}</span>}
    </button>
  );
};

export default Attendance;