"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, UserCheck, GraduationCap, BookOpen, FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DirectoryStaff {
  id: string;
  id_no: string;
  tsc_no?: string;
  name: string;
  role: string;
  subjects: string[];
  email: string;
  phone: string;
  status: string;
  department: string;
}

const StaffCheckInSelector = () => {
  const navigate = useNavigate();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [staffDirectory, setStaffDirectory] = useState<DirectoryStaff[]>([]);

  // Live clock state - stores current Date object
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live clock interval reference for cleanup
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update time every 1000ms with proper cleanup on unmount
  useEffect(() => {
    // Set initial time immediately
    setCurrentTime(new Date());

    // Start the 1-second interval
    clockIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup function - clears interval on component unmount to prevent memory leaks
    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    };
  }, []);

  // Format time as HH:MM:SS AM/PM
  const formattedTime = useMemo(() => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss} ${ampm}`;
  }, [currentTime]);

  // Format date as "Thursday, Aug 27, 2026"
  const formattedDate = useMemo(() => {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekday = weekdayNames[currentTime.getDay()];
    const month = monthNames[currentTime.getMonth()];
    const day = currentTime.getDate();
    const year = currentTime.getFullYear();
    return `${weekday}, ${month} ${day}, ${year}`;
  }, [currentTime]);

  // Load staff from localStorage with fallback to mock data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('munyaka_staff_directory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaffDirectory(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading staff directory:", e);
    }

    // Fallback: try central seed data
    import('../data/initialSeedData').then((module) => {
      if (module?.INITIAL_SEED_DATA?.staff && Array.isArray(module.INITIAL_SEED_DATA.staff)) {
        setStaffDirectory(module.INITIAL_SEED_DATA.staff);
      }
    }).catch(() => {
      // Silent fallback - empty directory
    });
  }, []);

  const selectedStaff = useMemo(() => {
    return staffDirectory.find(s => s.id === selectedStaffId);
  }, [selectedStaffId, staffDirectory]);

  const handleProceed = () => {
    if (!selectedStaff) return;
    // Navigate to existing check-in route, passing the staff member via URL query param
    const params = new URLSearchParams({
      staffId: selectedStaff.id,
      name: selectedStaff.name,
      role: selectedStaff.role || '',
    });
    navigate(`/staff-checkin?${params.toString()}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Vibrant Gradient Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-15%] w-[45%] h-[45%] bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[20%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md sm:max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="bg-slate-900/80 backdrop-blur-md border border-indigo-500/20 rounded-[2.5rem] shadow-2xl shadow-indigo-900/40 overflow-hidden p-1">
          <div className="p-8 sm:p-10 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              {/* Live Clock Widget - replaced static icon with dynamic clock */}
              <div className="flex justify-center mb-2">
                <div
                  className="
                    relative inline-flex flex-col items-center justify-center
                    px-6 py-4 rounded-3xl
                    bg-gradient-to-tr from-indigo-500 to-violet-500
                    shadow-2xl shadow-indigo-500/50
                    ring-4 ring-indigo-500/20
                    animate-pulse
                  "
                  aria-label="Live clock"
                >
                  {/* Soft radial glow layer (sits behind text) */}
                  <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
                    }}
                  />

                  {/* Time row with live indicator dot */}
                  <div className="relative flex items-center gap-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <Clock className="text-white drop-shadow-lg" size={26} strokeWidth={2.5} />
                    <span className="font-mono font-black text-white text-2xl tracking-wider drop-shadow-md tabular-nums">
                      {formattedTime}
                    </span>
                  </div>

                  {/* Date row */}
                  <div className="relative mt-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-100/90">
                    {formattedDate}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                  <span className="bg-gradient-to-r from-white via-indigo-100 to-violet-100 bg-clip-text text-transparent">Attendance</span>
                </h1>
                <p className="text-sm sm:text-base text-indigo-200/80 font-medium max-w-sm mx-auto">
                  Select your name, then choose an action
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Geofence Active</span>
              </div>
            </div>

            {/* Teacher Selection Dropdown */}
            <div className="space-y-3">
              <label htmlFor="teacher-select" className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                <UserCheck size={14} className="text-violet-400" />
                Select Teacher
              </label>

              <div className="relative">
                <select
                  id="teacher-select"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full appearance-none bg-slate-950/60 border border-indigo-500/30 text-white font-bold text-sm rounded-2xl px-4 py-4 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 transition-all cursor-pointer hover:border-indigo-400/50 shadow-inner shadow-indigo-950/50"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Choose your name --
                  </option>
                  {staffDirectory
                    .filter(s => s.status === 'Active' || s.status === 'Pre-Registered')
                    .map((staff) => (
                      <option key={staff.id} value={staff.id} className="bg-slate-900 text-white">
                        {staff.name} {staff.role ? `(${staff.role})` : ''}
                      </option>
                    ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-indigo-300 pointer-events-none" size={18} />
              </div>

              {/* Selected Staff Preview Card */}
              {selectedStaff && (
                <div className="animate-in slide-in-from-top-2 duration-300 bg-gradient-to-br from-slate-950/80 to-indigo-950/40 border border-indigo-400/40 rounded-2xl p-4 space-y-2 shadow-lg shadow-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/40">
                      {selectedStaff.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-sm truncate">{selectedStaff.name}</p>
                      <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider truncate">
                        {selectedStaff.role || 'Staff Member'}
                      </p>
                    </div>
                  </div>
                  {selectedStaff.subjects && selectedStaff.subjects.length > 0 && (
                    <div className="flex items-start gap-2 pt-2 border-t border-indigo-500/20">
                      <BookOpen size={12} className="text-indigo-300 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStaff.subjects.slice(0, 3).map((subj, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/20"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Proceed Button */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={!selectedStaffId}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base shadow-2xl shadow-indigo-600/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:from-slate-700 disabled:to-slate-700 flex items-center justify-center gap-2 hover:shadow-indigo-500/60 hover:shadow-2xl"
            >
              Proceed to Check-In
              <ChevronRight size={20} strokeWidth={3} />
            </button>

            {/* Footer Info */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300/60">
              <FlaskConical size={12} className="text-violet-400" />
              <span>Munyaka Staff Portal v4.0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StaffCheckInSelector;