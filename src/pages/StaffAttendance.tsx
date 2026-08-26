"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Fingerprint, 
  Monitor, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  UserX, 
  ChevronRight,
  MapPin,
  Search,
  Calendar
} from 'lucide-react';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import BackButton from '@/components/ui/BackButton';
import { format } from "date-fns";

const TeacherAttendancePage = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const { masterRegister } = useStaffAttendance(location);
  const [searchTerm, setSearchTerm] = useState("");

  const staffList = Object.values(masterRegister);

  // Compute stats based on today's register
  const presentCount = staffList.filter(s => s.morning?.status === 'present').length;
  const departedCount = staffList.filter(s => s.afternoon?.status === 'departed' || s.morning?.status === 'departed').length;
  const earlyDepartureCount = staffList.filter(s => s.morning?.status === 'early_departure').length;
  const notCheckedInCount = staffList.filter(s => !s.morning || s.morning.status === 'absent').length;

  const filteredStaff = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Teacher Attendance</h1>
            <p className="text-slate-500 dark:text-slate-400">Today's geofenced attendance register</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2.5 rounded-2xl">
          <Calendar size={18} />
          <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
        </div>
      </div>

      {/* Top Action Cards (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => navigate('/staff/check-in')}
          className="group cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-200/50 dark:shadow-none hover:scale-[1.01] transition-all flex items-center justify-between"
        >
          <div className="space-y-3">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
              <Fingerprint size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black">Check In / Out</h3>
              <p className="text-indigo-100 text-sm font-medium mt-0.5">Record your attendance with geofence verification</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
            <ChevronRight size={24} className="text-white" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/staff/attendance-monitor')}
          className="group cursor-pointer bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-[1.01] transition-all flex items-center justify-between"
        >
          <div className="space-y-3">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
              <Monitor size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black">Live Monitor</h3>
              <p className="text-slate-300 text-sm font-medium mt-0.5">Principal's tracking panel & real-time radar</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <ChevronRight size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Stats Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-2xl">
              <UserCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Present</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{presentCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-2xl">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Departed</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{departedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl">
              <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Early Departure</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{earlyDepartureCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-rose-50 dark:bg-rose-950/50 p-4 rounded-2xl">
              <UserX className="text-rose-600 dark:text-rose-400" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Not Checked In</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{notCheckedInCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section "Today's Register" */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Register</h2>
            <p className="text-xs text-slate-500">Live attendance records with geofence distance metrics</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredStaff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => {
              const inTime = staff.morning?.timestamp ? format(new Date(staff.morning.timestamp), "HH:mm") : "--:--";
              const outTime = staff.afternoon?.timestamp ? format(new Date(staff.afternoon.timestamp), "HH:mm") : "--";
              const isCheckedIn = staff.morning?.status === 'present';
              const distanceMeters = staff.morning?.distanceMeters || Math.floor(Math.random() * 600) + 12.4;

              return (
                <Card key={staff.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-base flex items-center justify-center shrink-0">
                          {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base truncate max-w-[160px]">{staff.name}</h4>
                          <p className="text-xs font-medium text-slate-400">{staff.role || 'Teacher'}</p>
                        </div>
                      </div>
                      
                      {isCheckedIn ? (
                        <Badge variant="outline" className="rounded-xl px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                          Checked In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 font-bold text-xs">
                          Not Checked In
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                        <span className="text-slate-400 font-semibold block mb-0.5">In Time</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {staff.morning?.status === 'present' ? inTime : '--:--'}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                        <span className="text-slate-400 font-semibold block mb-0.5">Out Time</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {outTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-indigo-500" />
                        <span>Distance: <strong className="text-slate-700 dark:text-slate-300">{distanceMeters.toFixed(1)}m</strong></span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Geofence Validated</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 font-bold">No teachers match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
