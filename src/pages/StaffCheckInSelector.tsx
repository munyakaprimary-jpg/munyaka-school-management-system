"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md sm:max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-1">
          <div className="p-8 sm:p-10 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-2">
                <Clock className="text-white" size={40} strokeWidth={2.5} />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Attendance</h1>
                <p className="text-sm sm:text-base text-slate-400 font-medium max-w-sm mx-auto">
                  Select your name, then choose an action
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Geofence Active</span>
              </div>
            </div>

            {/* Teacher Selection Dropdown */}
            <div className="space-y-3">
              <label htmlFor="teacher-select" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <UserCheck size={14} className="text-indigo-400" />
                Select Teacher
              </label>

              <div className="relative">
                <select
                  id="teacher-select"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full appearance-none bg-slate-950/60 border border-slate-700 text-white font-bold text-sm rounded-2xl px-4 py-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all cursor-pointer hover:border-slate-600"
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
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" size={18} />
              </div>

              {/* Selected Staff Preview Card */}
              {selectedStaff && (
                <div className="animate-in slide-in-from-top-2 duration-300 bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                      {selectedStaff.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-sm truncate">{selectedStaff.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {selectedStaff.role || 'Staff Member'}
                      </p>
                    </div>
                  </div>
                  {selectedStaff.subjects && selectedStaff.subjects.length > 0 && (
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                      <BookOpen size={12} className="text-slate-500 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStaff.subjects.slice(0, 3).map((subj, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300"
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
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base shadow-2xl shadow-indigo-900/50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:from-slate-700 disabled:to-slate-700 flex items-center justify-center gap-2"
            >
              Proceed to Check-In
              <ChevronRight size={20} strokeWidth={3} />
            </button>

            {/* Footer Info */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <FlaskConical size={12} className="text-indigo-400" />
              <span>Munyaka Staff Portal v4.0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StaffCheckInSelector;