"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserCircle, ChevronDown, ChevronRight, LogIn, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';

interface TeacherOption {
  id: string;
  name: string;
  role: string;
  email: string;
}

const STORAGE_KEYS = {
  STAFF_DIR: 'munyaka_staff_directory',
  STAFF_PREREG: 'munyaka_staff_prereg',
  USERS: 'munyaka_users',
  CURRENT_TEACHER: 'munyaka_current_checkin_teacher',
};

const loadTeachers = (currentUserName?: string): TeacherOption[] => {
  const teachersMap = new Map<string, TeacherOption>();

  // 1. Pull from staff directory
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_DIR);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          if (s && s.name) {
            teachersMap.set(s.name.toLowerCase(), {
              id: s.id || s.id_no || s.name,
              name: s.name,
              role: s.role || 'Teacher',
              email: s.email || ''
            });
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load staff directory', e);
  }

  // 2. Pull from pre-registration ledger
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_PREREG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((p: any) => {
          if (p && p.fullName) {
            const key = p.fullName.toLowerCase();
            if (!teachersMap.has(key)) {
              teachersMap.set(key, {
                id: p.id || p.nationalId || p.fullName,
                name: p.fullName,
                role: p.systemRole?.replace(/_/g, ' ').toUpperCase() || 'Staff',
                email: p.email || ''
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load staff pre-registration', e);
  }

  // 3. Pull from users collection
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.values(parsed).forEach((u: any) => {
          if (u && u.name) {
            const key = u.name.toLowerCase();
            if (!teachersMap.has(key)) {
              teachersMap.set(key, {
                id: u.id || u.email || u.name,
                name: u.name,
                role: (u.role || 'teacher').replace(/_/g, ' ').toUpperCase(),
                email: u.email || ''
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load users', e);
  }

  // 4. Make sure the currently-logged-in user is always included
  if (currentUserName) {
    const key = currentUserName.toLowerCase();
    if (!teachersMap.has(key)) {
      teachersMap.set(key, {
        id: `current-${currentUserName}`,
        name: currentUserName,
        role: 'Current User',
        email: ''
      });
    }
  }

  // Sort alphabetically by name
  return Array.from(teachersMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

const TeacherSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  const teacherOptions = useMemo(
    () => loadTeachers(user?.name),
    [user?.name]
  );

  // Pre-select the currently logged-in user if they exist in the list
  useEffect(() => {
    if (!selectedTeacher && user?.name) {
      const match = teacherOptions.find(
        (t) => t.name.toLowerCase() === user.name.toLowerCase()
      );
      if (match) {
        setSelectedTeacher(match.name);
      }
    }
  }, [user?.name, teacherOptions, selectedTeacher]);

  const handleProceed = () => {
    if (!selectedTeacher) {
      showError('Please select your name from the list to continue.');
      return;
    }

    // Persist the selection so the check-in page can read it
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, selectedTeacher);
    } catch (e) {
      console.error('Failed to persist selected teacher', e);
    }

    // Navigate into the existing Daily Duty Check-In page
    navigate('/staff/check-in', { state: { teacherName: selectedTeacher } });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center px-4 sm:px-6 py-10 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Logo / Brand Block */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Attendance
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-2 text-center max-w-xs">
            Select your name, then choose an action
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
          {/* User Profile Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-xl">
              <UserCircle size={56} strokeWidth={1.2} />
            </div>
          </div>

          {/* Dropdown */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block">
              Select your name...
            </label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="h-14 rounded-2xl bg-slate-950 border-slate-700 text-white font-bold text-sm focus:ring-2 ring-indigo-500/40 focus:border-indigo-500">
                <SelectValue placeholder="Select your name..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-slate-900 border-slate-700 text-slate-100 max-h-[300px]">
                {teacherOptions.length === 0 ? (
                  <SelectItem value="__none__" disabled className="rounded-xl">
                    No teachers found in staff directory
                  </SelectItem>
                ) : (
                  teacherOptions.map((teacher) => (
                    <SelectItem
                      key={teacher.id}
                      value={teacher.name}
                      className="rounded-xl font-medium"
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-bold text-sm">{teacher.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {teacher.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleProceed}
              disabled={!selectedTeacher}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base gap-2 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogIn size={20} /> Continue
              <ChevronRight size={18} />
            </Button>
          </div>

          {/* Footer Hint */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <MapPin size={12} className="text-indigo-400" />
            <span>GPS Geofence verification is active for this session.</span>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
          >
            <ChevronDown className="rotate-90" size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSelection;