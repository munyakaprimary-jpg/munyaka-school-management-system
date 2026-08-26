"use client";

import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  UserX, 
  Search, 
  RefreshCw, 
  Radio, 
  CheckCircle2, 
  Filter, 
  Calendar,
  ShieldCheck,
  Building2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  teacherName: string;
  department: string;
  date: string;
  arrival: string;
  departure: string;
  status: "Present" | "Departed" | "Early Departure" | "Absent";
  earlyDepartureReason?: string;
  avatarBg?: string;
}

const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: "1",
    teacherName: "Dr. Margaret Ochieng",
    department: "Mathematics & STEM",
    date: "2025-05-18",
    arrival: "07:15 AM",
    departure: "Active",
    status: "Present",
    avatarBg: "bg-emerald-600"
  },
  {
    id: "2",
    teacherName: "Mr. David Kimani",
    department: "Humanities & History",
    date: "2025-05-18",
    arrival: "07:22 AM",
    departure: "03:45 PM",
    status: "Departed",
    avatarBg: "bg-blue-600"
  },
  {
    id: "3",
    teacherName: "Mrs. Sarah Mwangi",
    department: "Languages & Literature",
    date: "2025-05-18",
    arrival: "07:05 AM",
    departure: "01:30 PM",
    status: "Early Departure",
    earlyDepartureReason: "Medical Appointment / Dental Checkup",
    avatarBg: "bg-amber-600"
  },
  {
    id: "4",
    teacherName: "Mr. James Omondi",
    department: "Science & Physics",
    date: "2025-05-18",
    arrival: "-",
    departure: "-",
    status: "Absent",
    earlyDepartureReason: "Sick Leave (Approved)",
    avatarBg: "bg-rose-600"
  },
  {
    id: "5",
    teacherName: "Ms. Amina Abdi",
    department: "Creative Arts",
    date: "2025-05-18",
    arrival: "07:40 AM",
    departure: "Active",
    status: "Present",
    avatarBg: "bg-indigo-600"
  },
  {
    id: "6",
    teacherName: "Mr. Peter Kamau",
    department: "Physical Education",
    date: "2025-05-18",
    arrival: "07:10 AM",
    departure: "04:00 PM",
    status: "Departed",
    avatarBg: "bg-blue-600"
  }
];

export default function AttendanceMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Format current time HH:MM:SS
  const updateRefreshTime = () => {
    const now = new Date();
    setLastRefresh(now.toLocaleTimeString("en-US", { hour12: false }));
  };

  useEffect(() => {
    updateRefreshTime();
  }, []);

  // Live auto-refresh every 8 seconds when active
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      updateRefreshTime();
      // Simulate slight live updates or check-ins
      setRecords(prev => [...prev]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleManualRefresh = () => {
    updateRefreshTime();
  };

  // Filtered records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const presentCount = records.filter(r => r.status === "Present").length;
  const departedCount = records.filter(r => r.status === "Departed").length;
  const earlyDepartureCount = records.filter(r => r.status === "Early Departure").length;
  const absentCount = records.filter(r => r.status === "Absent").length;
  const totalActiveTeachers = records.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/80 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Attendance Monitor</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>LIVE</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Principal's real-time tracking dashboard • Last refresh: <span className="font-mono text-indigo-400">{lastRefresh || "00:00:00"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 px-3">
            <Radio className={cn("w-4 h-4", isLive ? "text-emerald-400 animate-pulse" : "text-slate-500")} />
            <span className="text-xs font-bold text-slate-300">Live Updates</span>
            <Switch 
              checked={isLive} 
              onCheckedChange={setIsLive} 
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualRefresh}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white border-slate-700 gap-1.5 text-xs font-bold h-9 px-3.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Present Card */}
        <Card 
          onClick={() => setStatusFilter(statusFilter === "Present" ? "All" : "Present")}
          className={cn(
            "border-slate-800 bg-slate-900/90 rounded-[1.75rem] shadow-lg cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-slate-900",
            statusFilter === "Present" && "ring-2 ring-emerald-500 bg-slate-900"
          )}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Present</p>
              <h3 className="text-3xl font-black text-emerald-400">{presentCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Currently on school grounds</p>
            </div>
            <div className="w-14 h-14 bg-emerald-950/60 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
              <UserCheck size={26} />
            </div>
          </CardContent>
        </Card>

        {/* Departed Card */}
        <Card 
          onClick={() => setStatusFilter(statusFilter === "Departed" ? "All" : "Departed")}
          className={cn(
            "border-slate-800 bg-slate-900/90 rounded-[1.75rem] shadow-lg cursor-pointer transition-all hover:border-blue-500/50 hover:bg-slate-900",
            statusFilter === "Departed" && "ring-2 ring-blue-500 bg-slate-900"
          )}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Departed</p>
              <h3 className="text-3xl font-black text-blue-400">{departedCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Checked out after hours</p>
            </div>
            <div className="w-14 h-14 bg-blue-950/60 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
              <Clock size={26} />
            </div>
          </CardContent>
        </Card>

        {/* Early Departure Card */}
        <Card 
          onClick={() => setStatusFilter(statusFilter === "Early Departure" ? "All" : "Early Departure")}
          className={cn(
            "border-slate-800 bg-slate-900/90 rounded-[1.75rem] shadow-lg cursor-pointer transition-all hover:border-amber-500/50 hover:bg-slate-900",
            statusFilter === "Early Departure" && "ring-2 ring-amber-500 bg-slate-900"
          )}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Early Departure</p>
              <h3 className="text-3xl font-black text-amber-400">{earlyDepartureCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Left before end of day</p>
            </div>
            <div className="w-14 h-14 bg-amber-950/60 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
              <AlertTriangle size={26} />
            </div>
          </CardContent>
        </Card>

        {/* Absent Card */}
        <Card 
          onClick={() => setStatusFilter(statusFilter === "Absent" ? "All" : "Absent")}
          className={cn(
            "border-slate-800 bg-slate-900/90 rounded-[1.75rem] shadow-lg cursor-pointer transition-all hover:border-rose-500/50 hover:bg-slate-900",
            statusFilter === "Absent" && "ring-2 ring-rose-500 bg-slate-900"
          )}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Absent</p>
              <h3 className="text-3xl font-black text-rose-400">{absentCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Not checked in today</p>
            </div>
            <div className="w-14 h-14 bg-rose-950/60 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner">
              <UserX size={26} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            type="text" 
            placeholder="Search teacher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          {["All", "Present", "Departed", "Early Departure", "Absent"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                statusFilter === status 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" 
                  : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-slate-800 bg-slate-900/90 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-400" size={20} />
            <h3 className="font-bold text-white text-lg">Staff Attendance Register</h3>
          </div>
          <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-300 font-mono text-xs">
            {filteredRecords.length} records displayed
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-black uppercase tracking-wider">
                <th className="py-4 px-6">Teacher Name</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Arrival</th>
                <th className="py-4 px-6">Departure</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Early Departure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md", row.avatarBg || "bg-indigo-600")}>
                          {row.teacherName.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{row.teacherName}</p>
                          <p className="text-xs text-slate-400 font-normal">{row.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono text-xs">{row.date}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {row.arrival}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {row.departure === "Active" ? (
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/25">
                          Active on Site
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-slate-300">
                          {row.departure}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {row.status === "Present" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Present
                        </span>
                      )}
                      {row.status === "Departed" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-400 border border-blue-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Departed
                        </span>
                      )}
                      {row.status === "Early Departure" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Early Departure
                        </span>
                      )}
                      {row.status === "Absent" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Absent
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {row.earlyDepartureReason ? (
                        <span className="italic text-amber-300/90 bg-amber-950/30 px-2 py-1 rounded-md border border-amber-500/20">
                          {row.earlyDepartureReason}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-800">
                        <Calendar size={32} />
                      </div>
                      <p className="text-slate-300 font-bold text-base">No attendance records for today yet</p>
                      <p className="text-slate-500 text-xs max-w-sm">
                        Check-ins will appear here in real-time as teachers scan or check in through the portal.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-600")}></span>
            <span>Auto-refreshes every 8s when live • <strong className="text-white">{totalActiveTeachers}</strong> active teachers on register</span>
          </div>
          <p className="font-mono text-[11px] text-slate-500">Munyaka Secure Attendance Engine v3.4</p>
        </div>
      </Card>

    </div>
  );
}
