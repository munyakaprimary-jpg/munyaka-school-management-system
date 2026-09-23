"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ChevronRight, UserCheck, BookOpen, FlaskConical,
  MapPin, User, Moon, Sun, Sparkles, Search, X, Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DirectoryStaff {
  id: string;
  staff_id?: string;
  id_no?: string;
  tsc_no?: string;
  tscNo?: string;
  tscNumber?: string;
  name: string;
  full_name?: string;
  role: string;
  designation?: string;
  subjects?: string[];
  email: string;
  phone: string;
  status: string;
  department?: string;
}

type ThemeMode = 'dark' | 'light' | 'sunset';

const StaffCheckInSelector = () => {
  const navigate = useNavigate();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [staffDirectory, setStaffDirectory] = useState<DirectoryStaff[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // ── Searchable combobox state ─────────────────────────────────────────────
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Live clock state ──────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live clock interval reference for cleanup
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update time every 1000ms with proper cleanup on unmount
  useEffect(() => {
    setCurrentTime(new Date());

    clockIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Format date as "THURSDAY, AUG 27, 2026"
  const formattedDate = useMemo(() => {
    const weekdayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const weekday = weekdayNames[currentTime.getDay()];
    const month = monthNames[currentTime.getMonth()];
    const day = currentTime.getDate();
    const year = currentTime.getFullYear();
    return `${weekday}, ${month} ${day}, ${year}`;
  }, [currentTime]);

  // Load staff from multiple localStorage keys for full coverage
  useEffect(() => {
    const loadFromKeys = () => {
      const keys = [
        'munyaka_staff_directory',
        'munyaka_staff',
        'munyaka_staff_prereg',
        'munyaka_users',
        'staff',
        'staff_list',
        'staffDirectory',
        'staffList',
        'teachers',
      ];

      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          const arr = Array.isArray(parsed) ? parsed : [];
          if (arr.length > 0) {
            setStaffDirectory(arr);
            return;
          }
        } catch {
          continue;
        }
    }

    // No localStorage keys found — leave staffDirectory empty.
    // (Previously fell back to INITIAL_SEED_DATA, but that path is now
    //  disconnected: staff start at zero and are added through the UI.)
  };

    loadFromKeys();
  }, []);

  // ── Flexible search filter ─────────────────────────────────────────────────
  // Matches Name, TSC Number, Role/Title, or Staff ID
  const filteredStaff = useMemo(() => {
    const active = staffDirectory.filter(
      s => !s.status || s.status === 'Active' || s.status === 'Pre-Registered' || s.status === 'active'
    );

    if (!String(searchQuery || '').trim()) return active;
    
    const q = String(searchQuery || '').toLowerCase().trim();
    return active.filter(staff => {
      const name = (staff.name || staff.full_name || '').toLowerCase();
      const tscNo = (staff.tsc_no || staff.tscNo || staff.tscNumber || '').toLowerCase();
      const role = (staff.role || staff.designation || '').toLowerCase();
      const id = (staff.id || staff.staff_id || staff.id_no || '').toLowerCase();

      return name.includes(q) || tscNo.includes(q) || role.includes(q) || id.includes(q);
    });
  }, [staffDirectory, searchQuery]);

  // ── Dynamic subtitle label for dropdown items ─────────────────────────────────
  // Teaching staff: "James Ndiki — TSC: 327775"
  // Non-teaching staff with TSC: "Mary Wanjiku — TSC: 327775"
  // Non-teaching staff (no TSC): "John Omondi — Bursar" or "John Omondi — ID: STF-004"
  const getStaffLabel = (staff: DirectoryStaff): string => {
    const name = staff.name || staff.full_name || 'Unknown';
    const tsc = staff.tsc_no || staff.tscNo;
    const role = staff.role || staff.designation || '';
    const id = staff.id || staff.staff_id || staff.id_no;

    if (tsc) {
      return `${name} — TSC: ${tsc}`;
    }
    if (role) {
      return `${name} — ${role}`;
    }
    if (id) {
      return `${name} — Staff ID: ${id}`;
    }
    return name;
  };

  const getStaffIdentifier = (staff: DirectoryStaff): string => {
    const tsc = staff.tsc_no || staff.tscNo;
    if (tsc) {
      return `TSC: ${tsc}`;
    }
    const idNo = staff.id_no;
    if (idNo) {
      return `National ID: ${idNo}`;
    }
    const staffId = staff.id || staff.staff_id;
    if (staffId) {
      return `Staff ID: ${staffId}`;
    }
    return 'Staff ID: N/A';
  };

  const selectedStaff = useMemo(() => {
    return staffDirectory.find(s => s.id === selectedStaffId);
  }, [selectedStaffId, staffDirectory]);

  const handleSelectStaff = (staff: DirectoryStaff) => {
    setSelectedStaffId(staff.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
    searchInputRef.current?.blur();
  };

  const handleClearSelection = () => {
    setSelectedStaffId('');
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleProceed = () => {
    if (!selectedStaff) return;
    const staffId = selectedStaff.id || selectedStaff.staff_id || '';
    const params = new URLSearchParams({
      staffId,
      name: selectedStaff.name || selectedStaff.full_name || '',
      role: selectedStaff.role || selectedStaff.designation || '',
    });
    navigate(`/staff-checkin?${params.toString()}`);
  };

  // Theme configurations
  const themeConfig = {
    dark: {
      pageBg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950',
      orbOne: 'bg-indigo-600/30',
      orbTwo: 'bg-violet-600/25',
      orbThree: 'bg-indigo-500/20',
      card: 'bg-slate-900/90 border-indigo-500/20',
      cardShadow: 'shadow-2xl shadow-indigo-900/40',
      ringColor: 'ring-indigo-500/20',
      timeText: 'text-white',
      dateText: 'text-indigo-100/90',
      clockGradient: 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-500',
      clockShadow: 'shadow-2xl shadow-indigo-500/50',
      glowOrb: 'rgba(255,255,255,0.18)',
      titleGradient: 'from-white via-indigo-100 to-violet-100',
      subtitle: 'text-indigo-200/80',
      geofencePill: 'bg-emerald-500/15 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      geofenceText: 'text-emerald-300',
      geofenceDot: 'bg-emerald-400 shadow-lg shadow-emerald-400/60',
      label: 'text-indigo-300',
      labelIcon: 'text-violet-400',
      selectBg: 'bg-slate-950/60 border-indigo-500/30 text-white',
      selectRing: 'focus:ring-violet-500 focus:border-violet-500/50',
      optionBg: 'bg-slate-900 text-white',
      previewBg: 'bg-gradient-to-br from-slate-950/80 to-indigo-950/40 border-indigo-400/40',
      previewShadow: 'shadow-lg shadow-indigo-500/10',
      avatarGradient: 'bg-gradient-to-br from-indigo-500 to-violet-600',
      previewName: 'text-white',
      previewRole: 'text-indigo-300',
      subjectPill: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/20',
      chevron: 'text-indigo-300',
      buttonActive: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-500/60',
      buttonDisabled: 'disabled:from-slate-700 disabled:to-slate-700',
      footerIcon: 'text-violet-400',
      footerText: 'text-indigo-300/60',
      nameRow: 'text-slate-200',
    },
    light: {
      pageBg: 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100',
      orbOne: 'bg-blue-400/30',
      orbTwo: 'bg-indigo-300/25',
      orbThree: 'bg-cyan-300/20',
      card: 'bg-white border-blue-200',
      cardShadow: 'shadow-2xl shadow-blue-300/40',
      ringColor: 'ring-blue-300/30',
      timeText: 'text-white',
      dateText: 'text-blue-50/95',
      clockGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      clockShadow: 'shadow-2xl shadow-blue-500/50',
      glowOrb: 'rgba(255,255,255,0.25)',
      titleGradient: 'from-slate-900 via-blue-800 to-indigo-900',
      subtitle: 'text-slate-600',
      geofencePill: 'bg-emerald-100 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      geofenceText: 'text-emerald-700',
      geofenceDot: 'bg-emerald-500 shadow-lg shadow-emerald-500/60',
      label: 'text-slate-700',
      labelIcon: 'text-indigo-600',
      selectBg: 'bg-slate-50 border-slate-200 text-slate-900',
      selectRing: 'focus:ring-blue-500 focus:border-blue-500/50',
      optionBg: 'bg-white text-slate-900',
      previewBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
      previewShadow: 'shadow-lg shadow-blue-200/30',
      avatarGradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      previewName: 'text-slate-900',
      previewRole: 'text-indigo-600',
      subjectPill: 'bg-blue-100 text-blue-700 border-blue-200',
      chevron: 'text-slate-500',
      buttonActive: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/60',
      buttonDisabled: 'disabled:from-slate-300 disabled:to-slate-300',
      footerIcon: 'text-indigo-500',
      footerText: 'text-slate-500',
      nameRow: 'text-slate-700',
    },
    sunset: {
      pageBg: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-zinc-950',
      orbOne: 'bg-rose-600/30',
      orbTwo: 'bg-amber-500/25',
      orbThree: 'bg-purple-600/20',
      card: 'bg-zinc-900/90 border-rose-500/20',
      cardShadow: 'shadow-2xl shadow-rose-900/40',
      ringColor: 'ring-rose-500/20',
      timeText: 'text-white',
      dateText: 'text-rose-100/90',
      clockGradient: 'bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500',
      clockShadow: 'shadow-2xl shadow-rose-500/50',
      glowOrb: 'rgba(255,255,255,0.18)',
      titleGradient: 'from-rose-100 via-amber-100 to-purple-100',
      subtitle: 'text-rose-200/80',
      geofencePill: 'bg-emerald-500/15 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      geofenceText: 'text-emerald-300',
      geofenceDot: 'bg-emerald-400 shadow-lg shadow-emerald-400/60',
      label: 'text-rose-300',
      labelIcon: 'text-amber-400',
      selectBg: 'bg-zinc-950/60 border-rose-500/30 text-white',
      selectRing: 'focus:ring-rose-500 focus:border-rose-500/50',
      optionBg: 'bg-zinc-900 text-white',
      previewBg: 'bg-gradient-to-br from-zinc-950/80 to-rose-950/40 border-rose-400/40',
      previewShadow: 'shadow-lg shadow-rose-500/10',
      avatarGradient: 'bg-gradient-to-br from-rose-500 to-amber-500',
      previewName: 'text-white',
      previewRole: 'text-rose-300',
      subjectPill: 'bg-rose-500/20 text-rose-200 border-rose-400/20',
      chevron: 'text-rose-300',
      buttonActive: 'bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 hover:from-rose-500 hover:via-purple-500 hover:to-amber-400 text-white shadow-2xl shadow-rose-600/40 hover:shadow-rose-500/60',
      buttonDisabled: 'disabled:from-zinc-700 disabled:to-zinc-700',
      footerIcon: 'text-amber-400',
      footerText: 'text-rose-300/60',
      nameRow: 'text-rose-200',
    },
  };

  const tc = themeConfig[theme];

  // Theme Switcher Buttons
  const ThemeButton: React.FC<{ mode: ThemeMode; label: string; icon: React.ReactNode; }> = ({ mode, label, icon }) => {
    const isActive = theme === mode;
    return (
      <button
        type="button"
        onClick={() => setTheme(mode)}
        className={`
          flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest
          transition-all duration-300 active:scale-95
          ${isActive
            ? 'bg-white text-slate-900 shadow-lg scale-105'
            : theme === 'light'
              ? 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200'
              : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700/80 border border-slate-600/30'
          }
        `}
        aria-label={`Switch to ${label} theme`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-all duration-700 ${tc.pageBg}`}>
      {/* Vibrant Gradient Orbs */}
      <div className={`absolute top-[-15%] left-[-10%] w-[55%] h-[55%] ${tc.orbOne} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute top-[20%] right-[-15%] w-[45%] h-[45%] ${tc.orbTwo} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute bottom-[-15%] left-[20%] w-[50%] h-[50%] ${tc.orbThree} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />

      <div className="w-full max-w-md sm:max-w-lg relative z-10">
        {/* Theme Switcher Controls - Top Right */}
        <div className="flex items-center justify-center sm:justify-end gap-2 mb-5 animate-in fade-in slide-in-from-top-2 duration-500">
          <ThemeButton mode="dark" label="Dark Neon" icon={<Moon size={12} />} />
          <ThemeButton mode="light" label="Bright Light" icon={<Sun size={12} />} />
          <ThemeButton mode="sunset" label="Sunset Glow" icon={<Sparkles size={12} />} />
        </div>

        <Card className={`${tc.card} border rounded-[2.5rem] ${tc.cardShadow} overflow-hidden p-1 transition-all duration-500 animate-in fade-in zoom-in-95`}>
          <div className="p-8 sm:p-10 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              {/* Live Clock Widget with pulsing green dot */}
              <div className="flex justify-center mb-2">
                <div
                  className={`
                    relative inline-flex flex-col items-center justify-center
                    px-6 py-4 rounded-3xl
                    ${tc.clockGradient}
                    ${tc.clockShadow}
                    ring-4 ${tc.ringColor}
                    animate-pulse
                    transition-all duration-500
                  `}
                  aria-label="Live clock"
                >
                  {/* Soft radial glow layer */}
                  <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${tc.glowOrb} 0%, rgba(255,255,255,0) 70%)`,
                    }}
                  />

                  {/* Time row with live indicator dot */}
                  <div className="relative flex items-center gap-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <Clock className={`${tc.timeText} drop-shadow-lg`} size={26} strokeWidth={2.5} />
                    <span className={`font-mono font-black ${tc.timeText} text-2xl tracking-wider drop-shadow-md tabular-nums`}>
                      {formattedTime}
                    </span>
                  </div>

                  {/* Date row */}
                  <div className={`relative mt-1.5 text-[11px] font-bold uppercase tracking-widest ${tc.dateText}`}>
                    {formattedDate}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-lg bg-gradient-to-r ${tc.titleGradient} bg-clip-text text-transparent`}>
                  Attendance
                </h1>
                <p className={`text-sm sm:text-base font-medium max-w-sm mx-auto ${tc.subtitle}`}>
                  Select your name, then choose an action
                </p>
              </div>

              {/* Geofence Active Pill - Neon Green with Map Pin */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tc.geofencePill}`}>
                <MapPin size={12} className={tc.geofenceText} />
                <div className={`relative flex h-1.5 w-1.5`}>
                  <span className={`absolute inline-flex h-full w-full rounded-full ${tc.geofenceDot} opacity-75 animate-ping`} />
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tc.geofenceDot}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${tc.geofenceText}`}>Geofence Active</span>
              </div>
            </div>

            {/* Searchable Staff Combobox */}
                        <div className="space-y-3">
                          <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${tc.label}`}>
                            <User size={14} className={tc.labelIcon} />
                            Select Staff Member
                          </label>
            
                          <div className="relative" ref={dropdownRef}>
                            {/* Trigger button / input */}
                            <div
                              className={`relative ${tc.selectBg} border rounded-2xl transition-all cursor-text ${isDropdownOpen ? `ring-2 ${tc.selectRing} border-opacity-80` : 'hover:border-opacity-60'}`}
                              onClick={() => {
                                setIsDropdownOpen(true);
                                setTimeout(() => searchInputRef.current?.focus(), 50);
                              }}
                            >
                              {/* Search icon */}
                              <Search
                                size={16}
                                className={`absolute left-4 top-1/2 -translate-y-1/2 ${tc.chevron} pointer-events-none`}
                              />
            
                              {/* Search / display input */}
                              <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={
                                  selectedStaff
                                    ? getStaffLabel(selectedStaff)
                                    : '-- Search by name, TSC no., role, or ID --'
                                }
                                value={isDropdownOpen ? searchQuery : (selectedStaff ? getStaffLabel(selectedStaff) : '')}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  if (!isDropdownOpen) setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className={`w-full bg-transparent font-bold text-sm rounded-2xl px-4 py-4 pl-10 pr-20 focus:outline-none transition-all placeholder:text-slate-600 placeholder:font-medium ${isDropdownOpen && !selectedStaffId ? '' : 'cursor-pointer'}`}
                              />
            
                              {/* Clear button */}
                              {selectedStaffId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSelection();
                                  }}
                                  className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 transition-colors ${tc.chevron}`}
                                  title="Clear selection"
                                >
                                  <X size={14} />
                                </button>
                              )}
            
                              {/* Chevron indicator */}
                              <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${tc.chevron} ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                <ChevronRight size={18} className="rotate-90" />
                              </div>
                            </div>
            
                            {/* Dropdown panel */}
                            {isDropdownOpen && (
                              <div className={`absolute z-50 w-full mt-2 ${tc.optionBg} border rounded-2xl shadow-2xl max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150`}>
                                {filteredStaff.length === 0 ? (
                                  <div className="px-4 py-6 text-center">
                                    <p className="text-slate-400 text-xs font-bold">
                                      No staff found for "{searchQuery}"
                                    </p>
                                    <p className="text-slate-500 text-[10px] mt-1">
                                      Try a different name, TSC number, role, or staff ID
                                    </p>
                                  </div>
                                ) : (
                                  filteredStaff.map((staff) => {
                                                                      const isSelected = staff.id === selectedStaffId;
                                                                      const name = String(staff.name || staff.full_name || 'Unknown');
                                                                      const role = String(staff.role || staff.designation || '');
                                                                      const isTeacher = role.toLowerCase().includes('teacher') || role.toLowerCase().includes('tutor');
            
                                    return (
                                      <button
                                        key={staff.id}
                                        type="button"
                                        onClick={() => handleSelectStaff(staff)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                          isSelected
                                            ? 'bg-indigo-600/20'
                                            : 'hover:bg-indigo-500/10'
                                        } border-b border-slate-700/30 last:border-b-0`}
                                      >
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-lg ${tc.avatarGradient} flex items-center justify-center text-white font-black text-xs shrink-0 shadow`}>
                                          {(name).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
            
                                        {/* Name + dynamic subtitle */}
                                        <div className="flex-1 min-w-0">
                                          <p className={`font-bold text-sm truncate ${tc.previewName}`}>{name}</p>
                                          <p className={`text-[10px] font-bold uppercase tracking-wider truncate flex items-center gap-1.5 ${tc.previewRole}`}>
                                            {isTeacher ? (
                                              <>
                                                <BookOpen size={10} className="shrink-0" />
                                                {role || 'Teacher'}
                                              </>
                                            ) : role ? (
                                              <>
                                                <Briefcase size={10} className="shrink-0" />
                                                {role}
                                              </>
                                            ) : (
                                              <span className="text-slate-500">Staff Member</span>
                                            )}
                                            {/* Sub-ID badge */}
                                            {(staff.tsc_no || staff.tscNo) && (
                                              <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-black">
                                                TSC: {staff.tsc_no || staff.tscNo}
                                              </span>
                                            )}
                                            {(staff.id || staff.staff_id) && !staff.tsc_no && !staff.tscNo && (
                                              <span className="ml-1 text-slate-500 text-[9px]">
                                                ID: {staff.id || staff.staff_id}
                                              </span>
                                            )}
                                          </p>
                                        </div>
            
                                        {/* Selected checkmark */}
                                        {isSelected && (
                                          <UserCheck size={16} className="text-indigo-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

              {/* Selected Staff Preview Card */}
                                          {selectedStaff && (
                                            <div className={`animate-in slide-in-from-top-2 duration-300 ${tc.previewBg} border rounded-2xl p-4 space-y-2 ${tc.previewShadow}`}>
                                              <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl ${tc.avatarGradient} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                                                  {(selectedStaff.name || selectedStaff.full_name || '')
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`font-black text-sm truncate ${tc.previewName}`}>{selectedStaff.name || selectedStaff.full_name}</p>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-400/20">
                                                      {getStaffIdentifier(selectedStaff)}
                                                    </span>
                                                  </div>
                                                  <p className={`text-[11px] font-bold uppercase tracking-wider truncate flex items-center gap-1.5 ${tc.previewRole} mt-0.5`}>
                                                    {selectedStaff.role || selectedStaff.designation || 'Staff Member'}
                                                  </p>
                                                </div>
                                                <UserCheck className={tc.labelIcon} size={18} />
                                              </div>
                                              {selectedStaff.subjects && selectedStaff.subjects.length > 0 && (
                                                <div className={`flex items-start gap-2 pt-2 border-t ${theme === 'light' ? 'border-blue-200' : theme === 'sunset' ? 'border-rose-500/20' : 'border-indigo-500/20'}`}>
                                                  <BookOpen size={12} className={`${tc.labelIcon} mt-0.5 shrink-0`} />
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {selectedStaff.subjects.slice(0, 3).map((subj, i) => (
                                        <span
                                          key={i}
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tc.subjectPill}`}
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

            {/* Proceed Button - Primary Action */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={!selectedStaffId}
              className={`w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${tc.buttonActive} ${tc.buttonDisabled} flex items-center justify-center gap-2`}
            >
              Proceed to Check-In
              <ChevronRight size={20} strokeWidth={3} />
            </button>

            {/* Footer Info */}
            <div className={`flex items-center justify-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-widest ${tc.footerText}`}>
              <FlaskConical size={12} className={tc.footerIcon} />
              <span>Munyaka Staff Portal v4.0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StaffCheckInSelector;