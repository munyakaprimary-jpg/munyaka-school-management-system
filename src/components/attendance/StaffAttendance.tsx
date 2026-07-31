"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Lock, MapPin, AlertCircle } from 'lucide-react';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { format } from "date-fns";

interface StaffAttendanceProps {
  staffId: string;
  staffName: string;
}

const StaffAttendance = ({ staffId, staffName }: StaffAttendanceProps) => {
  const { location, accuracy, error, isLoading: geoLoading } = useGeolocation();
  const { attendanceRecords, loading, markAttendance, getAttendanceForDate } = useStaffAttendance(location);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentDate = format(new Date(), "yyyy-MM-dd");
  const attendanceData = getAttendanceForDate(currentDate);

  const handleMarkAttendance = async (session: 'morning' | 'afternoon', status: string) => {
    const success = await markAttendance(currentDate, session, status);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = [
        "Staff Name,Date,Morning Session,Morning Time,Afternoon Session,Afternoon Time,Location,Accuracy",
        `${staffName},${currentDate},"${attendanceData.morning?.status || 'Not Marked'}","${attendanceData.morning?.time || '—'}","${attendanceData.afternoon?.status || 'Not Marked'}","${attendanceData.afternoon?.time || '—'}","${location ? `${location.lat}, ${location.lng}` : 'Not Available'}","${accuracy || 'N/A'}"`
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `staff_attendance_${staffName.replace(/\s+/g, '_')}_${currentDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 500);
  };

  const getStatusBadge = (sessionData?: { status: string; time: string }) => {
    if (!sessionData) {
      return <span className="text-xs text-slate-400 italic">Not marked</span>;
    }
    
    const { status, time } = sessionData;
    let badgeClass = "";
    let label = "";

    if (status === 'present') {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
      label = "Present";
    } else if (status === 'absent') {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
      label = "Absent";
    } else {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
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

  const renderSessionColumn = (
    record: { morning?: { status: string; time: string }; afternoon?: { status: string; time: string } },
    session: 'morning' | 'afternoon',
    staffId: string
  ) => {
    const sessionData = record?.[session];
    return (
      <td className="px-8 py-6 border-l border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-24 flex justify-center">
            {getStatusBadge(sessionData)}
          </div>
          
          {isEditing && (
            <div className="flex gap-1.5 animate-in fade-in zoom-in-95 duration-200">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleMarkAttendance(session, 'present')}
                className={`rounded-xl h-9 w-9 p-0 ${sessionData?.status === 'present' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-600 text-slate-400"}`}
                title="Mark Present"
              >
                <Check size={16} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleMarkAttendance(session, 'late')}
                className={`rounded-xl h-9 w-9 p-0 font-bold text-xs ${sessionData?.status === 'late' ? "bg-amber-500 text-white hover:bg-amber-600" : "hover:bg-amber-50 hover:text-amber-600 text-slate-400"}`}
                title="Mark Late"
              >
                L
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleMarkAttendance(session, 'absent')}
                className={`rounded-xl h-9 w-9 p-0 ${sessionData?.status === 'absent' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:bg-rose-50 hover:text-rose-600 text-slate-400"}`}
                title="Mark Absent"
              >
                <X size={16} />
              </Button>
            </div>
          )}
          
          {!isEditing && (
            <div className="w-[102px] flex justify-center opacity-40">
              <Lock size={14} className="text-slate-300" />
            </div>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance Register</h1>
          <p className="text-muted-foreground">Track staff attendance with geolocation and timestamps.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={isEditing ? "default" : "outline"} 
            onClick={() => setIsEditing(!isEditing)}
            className={`rounded-xl font-bold gap-2 transition-all ${isEditing ? "bg-indigo-600 shadow-indigo-100" : "bg-white border-slate-200 text-slate-700"}`}
          >
            {isEditing ? <Check size={16} /> : <Clock size={16} />}
            {isEditing ? "Finish Editing" : "Edit Register"}
          </Button>

          <Button variant="outline" className="rounded-xl bg-white border-slate-200 font-bold text-slate-700 cursor-default">
            {format(new Date(), "PP")}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Export
          </Button>
        </div>
      </div>

      {/* Location Status Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Current Location Status</h3>
              <p className="text-sm text-slate-500">Geofence verification required for attendance marking</p>
            </div>
          </div>
          <div className="text-right">
            {geoLoading ? (
              <Badge className="bg-amber-50 text-amber-700 border-none">
                <Loader2 className="animate-spin mr-1" size={14} /> Detecting...
              </Badge>
            ) : error ? (
              <Badge className="bg-rose-50 text-rose-700 border-none">
                <AlertCircle size={14} className="mr-1" /> Error: {error}
              </Badge>
            ) : location ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-none">
                <Check size={14} className="mr-1" /> Within School Geofence
              </Badge>
            ) : (
              <Badge className="bg-slate-50 text-slate-500 border-none">
                <AlertCircle size={14} className="mr-1" /> Location Not Available
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-slate-500 border-b bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 bg-slate-50/50 z-10">Staff Details</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Morning Session</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Afternoon Session</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    <p className="font-bold text-slate-900 text-base">{staffName}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">ID: {staffId}</p>
                  </td>
                  {renderSessionColumn(attendanceData, 'morning', staffId)}
                  {renderSessionColumn(attendanceData, 'afternoon', staffId)}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAttendance;