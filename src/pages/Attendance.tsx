"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { useAuth } from '@/context/AuthContext';
import { useSchoolStore } from '@/store/useSchoolStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Printer, Save, Loader2, Calendar, CheckCircle2,
  XCircle, Clock, ShieldCheck, UserCheck, Users, AlertCircle,
  Search, Sun, Moon, Lock, Unlock, Info,
  LockKeyhole, ShieldAlert, Shield, BarChart3, TrendingUp,
  ClipboardList, Eye, Edit3, Layers, Sparkles, Activity,
  RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { useFileDownload } from "@/utils/fileDownloader";
import { cn } from "@/lib/utils";
import { logActivity } from '@/services/activityLog';
import { useLiveStreamAttendance } from '@/hooks/useLiveStreamAttendance';
import { useGradesStreamsConfig, useStreamsForGrade } from '@/hooks/useGradesStreams';
import { getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { DualScrollContainer } from '@/hooks/useHorizontalScroll';

type AttendanceStatus = 'P' | 'A' | 'L' | 'E'; // Present, Absent, Late, Excused
type SessionType = 'morning' | 'afternoon';
type ViewMode = 'marking' | 'oversight';

interface Learner {
  id: string;
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

interface SessionLock {
  locked: boolean;
  lockedAt?: string; // ISO timestamp
  lockedBy?: string; // admin/teacher who locked
  reason?: string;
}

interface Filters {
  date: string;
  grade: string;
  stream: string;
}

interface SessionWindow {
  startHour: number;   // inclusive
  startMinute: number;
  endHour: number;     // inclusive
  endMinute: number;
  label: string;
  description: string;
}

const ATTENDANCE_CUTOFF_CONFIG_KEY = 'munyaka_attendance_cutoffs';

interface CutoffConfig {
  morning: { hour: number; minute: number }; // Default: 8:00 AM
  afternoon: { hour: number; minute: number }; // Default: 2:00 PM
  enabled: boolean;
}

const DEFAULT_CUTOFFS: CutoffConfig = {
  morning: { hour: 8, minute: 0 },  // 8:00 AM cutoff - register locks after this time
  afternoon: { hour: 14, minute: 0 }, // 2:00 PM cutoff
  enabled: true,
};

const getCutoffConfig = (): CutoffConfig => {
  if (typeof window === 'undefined') return DEFAULT_CUTOFFS;
  try {
    const raw = localStorage.getItem(ATTENDANCE_CUTOFF_CONFIG_KEY);
    if (!raw) return DEFAULT_CUTOFFS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as CutoffConfig;
    return DEFAULT_CUTOFFS;
  } catch {
    return DEFAULT_CUTOFFS;
  }
};

const saveCutoffConfig = (config: CutoffConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATTENDANCE_CUTOFF_CONFIG_KEY, JSON.stringify(config));
    notifyDataChanged(ATTENDANCE_CUTOFF_CONFIG_KEY);
  } catch (e) {
    console.error('Error saving cutoff config:', e);
  }
};

const isPastCutoff = (session: SessionType, now: Date, config: CutoffConfig): boolean => {
  if (!config.enabled) return false;
  const cutoff = session === 'morning' ? config.morning : config.afternoon;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = cutoff.hour * 60 + cutoff.minute;
  return nowMinutes >= cutoffMinutes;
};

const SESSION_WINDOWS: Record<SessionType, SessionWindow> = {
  morning: {
    startHour: 6,
    startMinute: 0,
    endHour: 11,
    endMinute: 59,
    label: 'Morning',
    description: '6:00 AM – 11:59 AM',
  },
  afternoon: {
    startHour: 12,
    startMinute: 0,
    endHour: 18, // 6:00 PM expressed in 24h; "6:00 PM" is end of day
    endMinute: 0,
    label: 'Afternoon',
    description: '12:00 PM – 6:00 PM',
  },
};

const ATTENDANCE_ADMIN_BYPASS_KEY = 'munyaka_attendance_admin_bypass';
const ATTENDANCE_LOCKS_KEY = 'munyaka_attendance_locks';
const ATTENDANCE_DEFAULT_PASSWORD = 'munyaka5239';
const STUDENTS_STORAGE_KEY = 'school_learners_data';

/**
 * ============================================
 * Session window utilities
 * ============================================
 */

const toMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;

const format12h = (date: Date): string => {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const mm = String(minutes).padStart(2, '0');
  return `${hours12}:${mm} ${ampm}`;
};

const getActiveSession = (date: Date): SessionType | null => {
  const nowMinutes = toMinutes(date.getHours(), date.getMinutes());
  const morning = SESSION_WINDOWS.morning;
  const afternoon = SESSION_WINDOWS.afternoon;
  const morningStart = toMinutes(morning.startHour, morning.startMinute);
  const morningEnd = toMinutes(morning.endHour, morning.endMinute);
  const afternoonStart = toMinutes(afternoon.startHour, afternoon.startMinute);
  const afternoonEnd = toMinutes(afternoon.endHour, afternoon.endMinute);

  if (nowMinutes >= morningStart && nowMinutes <= morningEnd) return 'morning';
  if (nowMinutes >= afternoonStart && nowMinutes <= afternoonEnd) return 'afternoon';
  return null;
};

const buildLockKey = (grade: string, stream: string, date: string, session: SessionType): string =>
  `${grade}__${stream}__${date}__${session}`;

const readLocksMap = (): Record<string, SessionLock> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ATTENDANCE_LOCKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, SessionLock>;
    return {};
  } catch (e) {
    console.error('Error reading attendance locks map:', e);
    return {};
  }
};

const writeLocksMap = (next: Record<string, SessionLock>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATTENDANCE_LOCKS_KEY, JSON.stringify(next));
    notifyDataChanged('munyaka_attendance_locks');
  } catch (e) {
    console.error('Error persisting attendance locks map:', e);
  }
};

const formatLockedAt = (iso: string | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCutoffTime = (cutoff: { hour: number; minute: number }): string => {
  const ampm = cutoff.hour >= 12 ? 'PM' : 'AM';
  const hour12 = cutoff.hour % 12 || 12;
  const min = String(cutoff.minute).padStart(2, '0');
  return `${hour12}:${min} ${ampm}`;
};

const Attendance = () => {
  // ── Auth & Role ────────────────────────────────────────────
  const { user } = useAuth();
  const userRole = user?.role ?? '';
  const userId = user?.id ?? '';
  const isAdminRole = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'super_admin' || userRole.toLowerCase() === 'owner';
  const isTeacherRole = userRole.toLowerCase() === 'teacher' || userRole.toLowerCase() === 'class_teacher' || userRole.toLowerCase() === 'subject_teacher' || userRole.toLowerCase() === 'senior_teacher';

  // ── Global School Store (eliminating separate storage layer) ──
  const { learners: rawLearners, attendance: globalAttendanceStore, setAttendance: setGlobalAttendanceStore } = useSchoolStore();
  const learners = useMemo(() => {
    if (Array.isArray(rawLearners)) return rawLearners;
    if (rawLearners && typeof rawLearners === 'object' && Array.isArray((rawLearners as any).learners)) return (rawLearners as any).learners;
    return [];
  }, [rawLearners]);

  // If user is a teacher with an assigned class/stream, automatically set default filter
  const assignedClassStr = (user as any)?.assignedClass || '';
  const initialGrade = useMemo(() => {
    if (assignedClassStr) {
      const parts = assignedClassStr.split(' ');
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
      return assignedClassStr;
    }
    return 'Grade 6';
  }, [assignedClassStr]);

  const initialStream = useMemo(() => {
    if (assignedClassStr) {
      const parts = assignedClassStr.split(' ');
      if (parts.length >= 3) return parts.slice(2).join(' ').toUpperCase();
      if (parts.length === 2) return parts[1].toUpperCase();
    }
    return 'YELLOW';
  }, [assignedClassStr]);

  // ============================================
  // Role-adaptive view state
  // ============================================
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (isTeacherRole && !isAdminRole) return 'marking';
    return 'oversight';
  });

  // Filters state — used in the marking register view
  const [filters, setFilters] = useState<Filters>({
    date: (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })(),
    grade: initialGrade || 'Grade 6',
    stream: initialStream || 'YELLOW',
  });

  // ── Oversight view filters (admin roll call dashboard) ──────
  const [ovGrade, setOvGrade] = useState<string>('all');
  const [ovStream, setOvStream] = useState<string>('all');
  const [ovSearch, setOvSearch] = useState<string>('');

  // ── Historical date selection for oversight view ──────────────
  const getTodayDateStr = (): string => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };
  const [ovDate, setOvDate] = useState<string>(getTodayDateStr);

  // Whether the selected oversight date is today
  const isOversightToday = useMemo(() => {
    return ovDate === getTodayDateStr();
  }, [ovDate]);

  // Navigate one day back
  const ovGoToPrevDay = () => {
    const d = new Date(ovDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setOvDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // Navigate one day forward
  const ovGoToNextDay = () => {
    const d = new Date(ovDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setOvDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // Jump back to today
  const ovGoToToday = () => setOvDate(getTodayDateStr());

  // Attendance state — keyed by student id, then session type
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Per-session lock state
  const [locksMap, setLocksMap] = useState<Record<string, SessionLock>>(() => readLocksMap());

  useEffect(() => {
    writeLocksMap(locksMap);
  }, [locksMap]);

  const morningLockKey = buildLockKey(filters.grade, filters.stream, filters.date, 'morning');
  const afternoonLockKey = buildLockKey(filters.grade, filters.stream, filters.date, 'afternoon');

  const morningLock: SessionLock = useMemo(() => {
    return locksMap[morningLockKey] || { locked: false };
  }, [locksMap, morningLockKey]);

  const afternoonLock: SessionLock = useMemo(() => {
    return locksMap[afternoonLockKey] || { locked: false };
  }, [locksMap, afternoonLockKey]);

  const isMorningLocked = morningLock.locked;
  const isAfternoonLocked = afternoonLock.locked;

  // Lock / unlock confirmation modal state
  const [lockAuthOpen, setLockAuthOpen] = useState<boolean>(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | null>(null);
  const [lockTargetSession, setLockTargetSession] = useState<SessionType | null>(null);
  const [adminAuthPassword, setAdminAuthPassword] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string>('');
  const [isAdminAuthVerifying, setIsAdminAuthVerifying] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>('');

  // Time-window state
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Cutoff configuration state
  const [cutoffConfig, setCutoffConfig] = useState<CutoffConfig>(() => getCutoffConfig());
  const [showCutoffSettings, setShowCutoffSettings] = useState(false);

  // Derive whether a session is past its cutoff time
  const isMorningPastCutoff = useMemo(() => isPastCutoff('morning', currentTime, cutoffConfig), [currentTime, cutoffConfig]);
  const isAfternoonPastCutoff = useMemo(() => isPastCutoff('afternoon', currentTime, cutoffConfig), [currentTime, cutoffConfig]);

  // Admin override persisted to localStorage so it survives page reloads.
  const [adminBypass, setAdminBypass] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ATTENDANCE_ADMIN_BYPASS_KEY) === 'true';
  });

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    setCurrentTime(new Date());
    return () => clearInterval(id);
  }, []);

  // RBAC guard: if a non-admin (teacher/staff) is currently viewing
  // the page, force adminBypass off and prevent it from being toggled
  // on. This ensures stale localStorage state from a previous admin
  // session can never elevate a teacher's permissions.
  useEffect(() => {
    if (!isAdminRole && adminBypass) {
      setAdminBypass(false);
    }
  }, [isAdminRole, adminBypass]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAdminRole) {
      localStorage.setItem(ATTENDANCE_ADMIN_BYPASS_KEY, 'false');
      return;
    }
    localStorage.setItem(ATTENDANCE_ADMIN_BYPASS_KEY, adminBypass ? 'true' : 'false');
    notifyDataChanged('munyaka_attendance_admin_bypass');
  }, [adminBypass, isAdminRole]);

  // Unified file-download state for CSV export
  const csvExport = useFileDownload();

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = filters.date.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  }, [filters.date]);

  const isSelectedDateToday = useMemo(() => {
    const t = new Date();
    return (
      selectedDateObj.getFullYear() === t.getFullYear() &&
      selectedDateObj.getMonth() === t.getMonth() &&
      selectedDateObj.getDate() === t.getDate()
    );
  }, [selectedDateObj]);

  const isSessionEditable = (session: SessionType): boolean => {
    const sessionLock = session === 'morning' ? morningLock : afternoonLock;
    // Explicit admin lock always blocks editing (unless admin bypass is on)
    if (sessionLock.locked) return false;
    // Admin bypass can override both time windows and cutoff restrictions
    if (adminBypass) return true;
    // Only allow editing for today's date
    if (!isSelectedDateToday) return false;
    // Check if current time is within the active session window
    if (getActiveSession(currentTime) !== session) return false;
    // Check if past the cutoff time for this session
    const isPastCutoff = session === 'morning' ? isMorningPastCutoff : isAfternoonPastCutoff;
    if (isPastCutoff && !adminBypass) return false;
    return true;
  };

  const isMorningEditable = isSessionEditable('morning');
  const isAfternoonEditable = isSessionEditable('afternoon');

  // Determine lock reason for display purposes
  const getMorningLockReason = (): string | null => {
    if (morningLock.locked) return morningLock.reason || 'Manually sealed';
    if (!isSelectedDateToday) return 'Viewing past date';
    if (!getActiveSession(currentTime) && !adminBypass) return 'Morning session not active';
    if (isMorningPastCutoff && !adminBypass) return `Cutoff time (${formatCutoffTime(cutoffConfig.morning)}) exceeded`;
    return null;
  };

  const getAfternoonLockReason = (): string | null => {
    if (afternoonLock.locked) return afternoonLock.reason || 'Manually sealed';
    if (!isSelectedDateToday) return 'Viewing past date';
    if (!getActiveSession(currentTime) && !adminBypass) return 'Afternoon session not active';
    if (isAfternoonPastCutoff && !adminBypass) return `Cutoff time (${formatCutoffTime(cutoffConfig.afternoon)}) exceeded`;
    return null;
  };

  const activeSession = isSelectedDateToday ? getActiveSession(currentTime) : null;

  // ── Live student records ────────────────────────────────────────────────
    const [liveStudents, setLiveStudents] = useState<Learner[]>([]);
    const [allStudents, setAllStudents] = useState<Learner[]>([]);

  // Normalize grade comparison: handles case differences and extracts numeric portion
  const normalizeGrade = (grade: string | null | undefined): string => {
    if (!grade) return '';
    // Extract numeric portion (e.g., "Grade 6" -> "6", "grade 6" -> "6")
    const numericMatch = String(grade).replace(/\D/g, '');
    return numericMatch || String(grade).toLowerCase().trim();
  };

  // Normalize stream comparison: case-insensitive, trimmed
  const normalizeStream = (stream: string | null | undefined): string => {
    return String(stream || '').toLowerCase().trim();
  };

  // Helper to match grade with flexible comparison
  const matchGrade = (studentGrade: string | undefined, selectedGrade: string): boolean => {
    if (!studentGrade && !selectedGrade) return true;
    if (!studentGrade || !selectedGrade) return false;
    const normStudent = normalizeGrade(studentGrade);
    const normSelected = normalizeGrade(selectedGrade);
    // Direct lowercase match
    if (normStudent === normSelected) return true;
    // Numeric-only match (e.g., "6" matches "Grade 6")
    if (normStudent === normSelected && /^\d+$/.test(normStudent)) return true;
    // Check if numeric portions match
    const studentNumeric = normalizeGrade(studentGrade);
    const selectedNumeric = normalizeGrade(selectedGrade);
    if (studentNumeric && selectedNumeric && studentNumeric === selectedNumeric) return true;
    return false;
  };

  // Helper to match stream with case-insensitive comparison
  const matchStream = (studentStream: string | undefined, selectedStream: string): boolean => {
    if (!studentStream && !selectedStream) return true;
    if (!studentStream || !selectedStream) return false;
    return normalizeStream(studentStream) === normalizeStream(selectedStream);
  };

  const loadLiveStudents = useCallback(() => {
    // Adopt Admin Roll Call Master Storage Keys: 'school_learners_v1'
    const storageKeys = [
      'school_learners_v1',
      'school_learners_data',
      'students',
      'learners',
      'pupils',
      'school_students',
      'registered_students',
    ];

    try {
      let raw: string | null = null;
      let parsedData: Array<{
        id: string;
        name?: string;
        grade?: string;
        stream?: string;
        class?: string; // Alternative to grade
        status?: string;
        admNo?: string;
        gender?: string;
      }> | null = null;

      // Try each storage key until we find data
      for (const key of storageKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              raw = data;
              parsedData = parsed;
              break;
            }
          }
        } catch {
          // Continue to next key if parsing fails
          continue;
        }
      }

      if (!parsedData) {
              setLiveStudents([]);
              setAllStudents([]);
              return;
            }
      
            // Normalize all students from storage for downstream use
            const normalized: Learner[] = parsedData
              .filter(s => !!s)
              .map(s => ({
                id: String(s.id),
                name: s.name || 'Unknown',
                assessment: s.admNo || s.id || '',
                grade: s.grade || s.class || '',
                stream: s.stream || '',
                gender: (s.gender || 'M') as 'M' | 'F',
              }));
      
            setAllStudents(normalized);
      
            // Filter to active students matching the selected grade+stream
            // Using case-insensitive and normalized comparison
            const filtered = parsedData
              .filter(s => {
                if (!s) return false;
                // Skip inactive students
                if (s.status && s.status !== 'Active' && s.status !== 'active') return false;
                // Match grade (check both grade and class fields)
                const studentGrade = s.grade || s.class || '';
                if (!matchGrade(studentGrade, filters.grade)) return false;
                // Match stream with case-insensitive comparison
                if (!matchStream(s.stream, filters.stream)) return false;
                return true;
              })
              .map(s => ({
                id: String(s.id),
                name: s.name || 'Unknown',
                assessment: s.admNo || s.id || '',
                grade: s.grade || s.class || '',
                stream: s.stream || '',
                gender: (s.gender || 'M') as 'M' | 'F',
              }));
            setLiveStudents(filtered);
          } catch (e) {
            console.error('[Attendance] Error loading live students:', e);
            setLiveStudents([]);
            setAllStudents([]);
          }
        }, [filters.grade, filters.stream]);

  useEffect(() => {
    loadLiveStudents();
    const onStorage = (e: StorageEvent) => {
      const storageKeys = [
        'school_learners_data',
        'students',
        'learners',
        'pupils',
        'school_students',
        'registered_students',
      ];
      if (e.key && storageKeys.includes(e.key)) loadLiveStudents();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const storageKeys = [
        'school_learners_data',
        'students',
        'learners',
        'pupils',
        'school_students',
        'registered_students',
      ];
      if (detail?.key && storageKeys.includes(detail.key)) loadLiveStudents();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);
    const interval = window.setInterval(loadLiveStudents, 5000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      window.clearInterval(interval);
    };
  }, [loadLiveStudents]);

  // ── Live stream attendance summaries (admin oversight) ─────────────────
  const liveStreamData = useLiveStreamAttendance(
    ovDate,
    ovGrade,
    ovStream,
    ovSearch,
  );

  // Load attendance from localStorage on mount and when filters change
  useEffect(() => {
    try {
      const storageKey = `munyaka_attendance_v2_${filters.grade}_${filters.stream}_${filters.date}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setAttendance(parsed as Record<string, StudentAttendance>);
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

  // ============================================
    // ============================================
    // Dynamic stream options — sourced from the GradesStreamsConfig
    // and filtered to only show streams assigned to the selected grade.
    // ============================================
  
    // Read the centralized grades/streams configuration from localStorage
    const gradesConfig = useGradesStreamsConfig();
  
    // Get grade-specific streams; if no grade is selected, fall back to all configured streams
    const gradeSpecificStreams = useMemo(() => {
      if (!filters.grade || filters.grade === 'all') {
        // No grade selected — return all unique streams from the config
        return gradesConfig.streams.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      }
      return getStreamsForGrade(filters.grade, gradesConfig);
    }, [filters.grade, gradesConfig]);
  
    // Also gather any streams that actually appear in the student roster for the selected grade
    const rosterStreams = useMemo(() => {
      return Array.from(
        new Set(
          allStudents
            .filter(s => matchGrade(s.grade, filters.grade))
            .map(s => String(s.stream || '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [allStudents, filters.grade]);
  
    // Merge configured streams with roster-derived streams, then add "All Streams" as default
    const availableStreams = useMemo(() => {
      const merged = Array.from(new Set([...gradeSpecificStreams, ...rosterStreams]));
      return merged;
    }, [gradeSpecificStreams, rosterStreams]);
  
    // Whether the Stream dropdown should be disabled (no grade selected)
    const isStreamDisabled = !filters.grade || filters.grade === 'all';
  
    // Reset the Stream selection back to "All Streams" whenever the Grade changes
    useEffect(() => {
      // Always reset to "All Streams" (empty string means "all") when grade changes
      setFilters(prev => ({ ...prev, stream: '' }));
    }, [filters.grade]);
  
    const filteredLearners = useMemo(() => {
      const selectedGrade = filters.grade;
      const selectedStream = filters.stream;

      const getDigits = (val: any) => String(val ?? '').replace(/[^0-9]/g, '');

      const targetGradeDigits = getDigits(selectedGrade);
      const targetStream = String(selectedStream || '').toLowerCase().trim();

      return (Array.isArray(learners) ? learners : []).filter((l) => {
        if (!l) return false;
        if (l.status && l.status !== 'Active' && l.status !== 'active') return false;

        const learnerGradeDigits = getDigits(l.grade || l.class || l.gradeLevel);
        const learnerStream = String(l.stream || '').toLowerCase().trim();

        const matchesGrade =
          !selectedGrade ||
          selectedGrade === 'all' ||
          targetGradeDigits === '' ||
          learnerGradeDigits === targetGradeDigits;

        const matchesStream =
          !selectedStream ||
          selectedStream === 'all' ||
          targetStream === '' ||
          learnerStream === targetStream;

        return matchesGrade && matchesStream;
      }).map(l => ({
        id: String(l.id),
        name: l.name || 'Unknown',
        assessment: l.admNo || l.id || '',
        grade: l.grade || l.class || '',
        stream: l.stream || '',
        gender: (l.gender || 'M') as 'M' | 'F',
      }));
    }, [learners, filters.grade, filters.stream]);

  const isSessionFullyMarked = (session: SessionType): boolean => {
    if (filteredLearners.length === 0) return false;
    return filteredLearners.every(s => {
      const record = attendance[s.id];
      return !!(record?.[session]?.status);
    });
  };

  const isMorningFullyMarked = isSessionFullyMarked('morning');
  const isAfternoonFullyMarked = isSessionFullyMarked('afternoon');

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

  // ============================================
  // Aggregate oversight metrics (admin only) — derived from LIVE data
  // ============================================
  // `liveStreamData` is provided by useLiveStreamAttendance() which reads
  // directly from localStorage. It returns:
  //   - streams: the filtered list of StreamAttendanceRecord
  //   - totalLearners, streamsTotal, morningCompletedStreams,
  //     afternoonCompletedStreams, fullyCompletedStreams, averageRate
  const filteredStreamSummaries = liveStreamData.streams;
  const oversightMetrics = {
    totalLearners: liveStreamData.totalLearners,
    streamsTotal: liveStreamData.streamsTotal,
    morningCompletedStreams: liveStreamData.morningCompletedStreams,
    afternoonCompletedStreams: liveStreamData.afternoonCompletedStreams,
    fullyCompletedStreams: liveStreamData.fullyCompletedStreams,
    averageRate: liveStreamData.averageRate,
  };

  // ── Dynamic section title & subtitle for the oversight view ────────────
  const selectedGradeLabel = ovGrade !== 'all' ? ovGrade : null;
  const selectedStreamLabel = ovStream !== 'all' ? ovStream : null;

  const sectionTitle = (() => {
    if (selectedGradeLabel && selectedStreamLabel) {
      return `Roll Call Completion — ${selectedGradeLabel} ${selectedStreamLabel}`;
    }
    if (selectedGradeLabel) {
      return `Roll Call Completion — ${selectedGradeLabel} (All Streams)`;
    }
    if (selectedStreamLabel) {
      return `Roll Call Completion — All ${selectedStreamLabel} Streams`;
    }
    return 'Roll Call Completion — All Streams';
  })();

  const sectionSubtitle = (() => {
    const dateFormatted = new Date(ovDate + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    const isHistorical = !isOversightToday;
    if (isHistorical) {
      if (selectedGradeLabel && selectedStreamLabel) {
        return `Historical view of ${selectedGradeLabel} ${selectedStreamLabel} attendance submissions for ${dateFormatted}.`;
      }
      if (selectedGradeLabel) {
        return `Historical view of ${selectedGradeLabel} attendance submissions for ${dateFormatted}.`;
      }
      if (selectedStreamLabel) {
        return `Historical view of all ${selectedStreamLabel} streams across all grades for ${dateFormatted}.`;
      }
      return `Historical view of morning and afternoon attendance submissions for ${dateFormatted}.`;
    }
    if (selectedGradeLabel && selectedStreamLabel) {
      return `Live overview for ${selectedGradeLabel} ${selectedStreamLabel} attendance submissions for ${dateFormatted}.`;
    }
    if (selectedGradeLabel) {
      return `Live overview for ${selectedGradeLabel} attendance submissions for ${dateFormatted}.`;
    }
    if (selectedStreamLabel) {
      return `Live overview for all ${selectedStreamLabel} streams across all grades — ${dateFormatted}.`;
    }
    return `Live overview of morning and afternoon attendance submissions across every class — ${dateFormatted}.`;
  })();

  // Per-session lock handlers
  const openLockAuthModal = (action: 'lock' | 'unlock', session: SessionType) => {
    setLockAction(action);
    setLockTargetSession(session);
    setAdminAuthPassword('');
    setAdminAuthError('');
    setLockReason('');
    setLockAuthOpen(true);
  };

  const closeLockAuthModal = () => {
    setLockAuthOpen(false);
    setAdminAuthPassword('');
    setAdminAuthError('');
    setLockReason('');
    setIsAdminAuthVerifying(false);
    setLockAction(null);
    setLockTargetSession(null);
  };

  // Helper to build a lock object
  const buildLockObject = (opts: { reason: string }): SessionLock => ({
    locked: true,
    lockedAt: new Date().toISOString(),
    lockedBy: isAdminRole ? 'Administrator' : 'Class Teacher',
    reason: String(opts?.reason || '').trim() || 'Auto-locked after saving attendance',
  });

  // Lock a single stream for a given session and date
  const lockStreamSession = (grade: string, stream: string, date: string, session: SessionType, lock: SessionLock) => {
    const streamLockKey = `munyaka_attendance_lock_${grade}_${stream}_${date}_${session}`;
    localStorage.setItem(streamLockKey, JSON.stringify(lock));
    notifyDataChanged(streamLockKey);
  };

  // Unlock a single stream for a given session and date
  const unlockStreamSession = (grade: string, stream: string, date: string, session: SessionType) => {
    const streamLockKey = `munyaka_attendance_lock_${grade}_${stream}_${date}_${session}`;
    localStorage.removeItem(streamLockKey);
    notifyDataChanged(streamLockKey);
  };

  // Check if "All Grades" is selected
  const isAllGrades = !filters.grade || filters.grade === 'all';
  // Check if "All Streams" is selected
  const isAllStreams = !filters.stream;

  // Lock/unlock all streams under the selected grade (for "All Streams" scope)
  const applyLockToAllStreams = (session: SessionType, lock: SessionLock) => {
    const grades = isAllGrades ? gradesConfig.grades : [filters.grade];
    let totalLocked = 0;
    
    grades.forEach(grade => {
      const gradeStreams = getStreamsForGrade(grade, gradesConfig);
      const streamsToLock = isAllStreams ? gradeStreams : [filters.stream];
      
      streamsToLock.forEach(stream => {
        if (stream) {
          lockStreamSession(grade, stream, filters.date, session, lock);
          totalLocked++;
        }
      });
    });

    // Also update in-memory locks map for current stream
    const targetKey = session === 'morning' ? morningLockKey : afternoonLockKey;
    setLocksMap(prev => ({ ...prev, [targetKey]: lock }));
    
    return totalLocked;
  };

  const applyUnlockToAllStreams = (session: SessionType) => {
    const grades = isAllGrades ? gradesConfig.grades : [filters.grade];
    let totalUnlocked = 0;
    
    grades.forEach(grade => {
      const gradeStreams = getStreamsForGrade(grade, gradesConfig);
      const streamsToUnlock = isAllStreams ? gradeStreams : [filters.stream];
      
      streamsToUnlock.forEach(stream => {
        if (stream) {
          unlockStreamSession(grade, stream, filters.date, session);
          totalUnlocked++;
        }
      });
    });

    // Also update in-memory locks map for current stream
    const targetKey = session === 'morning' ? morningLockKey : afternoonLockKey;
    setLocksMap(prev => {
      const updated = { ...prev };
      delete updated[targetKey];
      return updated;
    });
    
    return totalUnlocked;
  };

  const buildAndPersistLock = (session: SessionType, opts: { reason: string }): SessionLock => {
    const lock = buildLockObject(opts);
    const isAllStreams = !filters.stream;
    
    if (isAllStreams && availableStreams.length > 0) {
      // Apply lock to all streams under the selected grade
      applyLockToAllStreams(session, lock);
    } else {
      // Single stream lock (current behavior)
      const targetKey = session === 'morning' ? morningLockKey : afternoonLockKey;
      setLocksMap(prev => ({ ...prev, [targetKey]: lock }));
    }
    return lock;
  };

  const applySessionLock = (session: SessionType) => {
    const lock = buildAndPersistLock(session, { reason: 'Auto-locked after saving attendance' });
    const sessionLabel = SESSION_WINDOWS[session].label;
    showSuccess(
      `Attendance saved and ${sessionLabel} session successfully locked at ${formatLockedAt(lock.lockedAt)}.`
    );
  };

  const handleConfirmLockAction = async () => {
    if (!lockAction || !lockTargetSession) return;
    if (!String(adminAuthPassword || '').trim()) {
      setAdminAuthError('Please enter the admin password to continue.');
      return;
    }

    setIsAdminAuthVerifying(true);
    setAdminAuthError('');

    await new Promise(resolve => setTimeout(resolve, 500));

    const storedPass = (typeof window !== 'undefined'
      ? localStorage.getItem('munyaka_admin_pass')
      : null) || ATTENDANCE_DEFAULT_PASSWORD;

    if (adminAuthPassword !== storedPass) {
      setAdminAuthError('Incorrect admin password. Please try again.');
      setIsAdminAuthVerifying(false);
      return;
    }

    const sessionLabel = SESSION_WINDOWS[lockTargetSession].label;
    const isAllStreams = !filters.stream;

    if (lockAction === 'lock') {
      if (isAllStreams && availableStreams.length > 0) {
        // Lock ALL streams under the selected grade
        const lock = buildLockObject({ reason: lockReason });
        applyLockToAllStreams(lockTargetSession, lock);
        showSuccess(
          `${sessionLabel} session locked across ${availableStreams.length} stream${availableStreams.length > 1 ? 's' : ''} (${availableStreams.slice(0, 3).join(', ')}${availableStreams.length > 3 ? '...' : ''}) in ${filters.grade} at ${formatLockedAt(lock.lockedAt)}.`
        );
      } else {
        // Single stream lock (current behavior)
        const lock = buildLockObject({ reason: lockReason });
        const targetKey = lockTargetSession === 'morning' ? morningLockKey : afternoonLockKey;
        setLocksMap(prev => ({ ...prev, [targetKey]: lock }));
        showSuccess(`${sessionLabel} session locked at ${formatLockedAt(lock.lockedAt)}.`);
      }
    } else {
      if (isAllStreams && availableStreams.length > 0) {
        // Unlock ALL streams under the selected grade
        applyUnlockToAllStreams(lockTargetSession);
        showSuccess(
          `${sessionLabel} session unlocked across ${availableStreams.length} stream${availableStreams.length > 1 ? 's' : ''} (${availableStreams.slice(0, 3).join(', ')}${availableStreams.length > 3 ? '...' : ''}) in ${filters.grade}. You may make corrections now.`
        );
      } else {
        // Single stream unlock
        const targetKey = lockTargetSession === 'morning' ? morningLockKey : afternoonLockKey;
        setLocksMap(prev => {
          const updated = { ...prev };
          delete updated[targetKey];
          return updated;
        });
        showSuccess(`${sessionLabel} session unlocked. You may make corrections now.`);
      }
    }

    setIsAdminAuthVerifying(false);
    closeLockAuthModal();
  };

  // Toggle individual student session status
  const setSessionStatus = (studentId: string, session: SessionType, status: AttendanceStatus) => {
    const sessionLock = session === 'morning' ? morningLock : afternoonLock;
    if (sessionLock.locked) {
      showError(
        `The ${SESSION_WINDOWS[session].label} session is locked. Tap "Unlock Session" in the session header to make corrections.`
      );
      return;
    }
    if (!isSessionEditable(session)) {
      showError(
        `The ${SESSION_WINDOWS[session].label} session is outside its recording window. Enable admin override to edit past or future sessions.`
      );
      return;
    }

    setAttendance(prev => {
      const currentRecord = prev[studentId] || {};
      const currentSession = currentRecord[session];

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
    const sessionLock = session === 'morning' ? morningLock : afternoonLock;
    if (sessionLock.locked) {
      showError(`The ${SESSION_WINDOWS[session].label} session is locked. Unlock the session to perform bulk actions.`);
      return;
    }
    if (!isSessionEditable(session)) {
      showError(
        `The ${SESSION_WINDOWS[session].label} session is locked. Enable admin override to use bulk actions.`
      );
      return;
    }

    const labels = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' } as const;
    const sessionLabel = session === 'morning' ? 'morning' : 'afternoon';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Check if "All Streams" is selected (empty string means "all")
    const isAllStreams = !filters.stream;

    if (isAllStreams && availableStreams.length > 0) {
      // Apply to ALL streams under the selected grade
      let totalMarked = 0;
      const streamsApplied: string[] = [];

      availableStreams.forEach(stream => {
        // Get students for this specific stream
        const streamStudents = allStudents.filter(s => {
          if (!matchGrade(s.grade, filters.grade)) return false;
          if (!matchStream(s.stream, stream)) return false;
          return true;
        });

        if (streamStudents.length === 0) return;

        // Create attendance entries for this stream
        const streamBulk: Record<string, StudentAttendance> = {};
        const streamStorageKey = `munyaka_attendance_v2_${filters.grade}_${stream}_${filters.date}`;
        
        streamStudents.forEach(s => {
          const existingStreamAttendance = (() => {
            try {
              const raw = localStorage.getItem(streamStorageKey);
              return raw ? JSON.parse(raw) : {};
            } catch { return {}; }
          })();
          const existing = existingStreamAttendance[s.id] || {};
          streamBulk[s.id] = {
            ...existing,
            [session]: { status, time: timestamp }
          };
        });

        // Save to localStorage for this stream
        localStorage.setItem(streamStorageKey, JSON.stringify(streamBulk));
        notifyDataChanged(streamStorageKey);
        totalMarked += streamStudents.length;
        streamsApplied.push(stream);
      });

      // Update master records
      const masterRaw = localStorage.getItem('munyaka_attendance_records') || '{}';
      const master = JSON.parse(masterRaw);
      availableStreams.forEach(stream => {
        const masterKey = `${filters.grade}_${stream}_${filters.date}`;
        master[masterKey] = {
          class: filters.grade,
          stream: stream,
          date: filters.date,
          savedAt: new Date().toISOString()
        };
      });
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(master));
      notifyDataChanged('munyaka_attendance_records');

      showSuccess(
        `Marked all ${totalMarked} learners across ${streamsApplied.length} stream${streamsApplied.length > 1 ? 's' : ''} (${streamsApplied.slice(0, 3).join(', ')}${streamsApplied.length > 3 ? '...' : ''}) as ${labels[status]} in the ${sessionLabel} session.`
      );

      // Refresh the current view
      loadLiveStudents();
    } else {
      // Apply to single stream (current behavior)
      const bulk: Record<string, StudentAttendance> = {};
      filteredLearners.forEach(s => {
        const existing = attendance[s.id] || {};
        bulk[s.id] = {
          ...existing,
          [session]: { status, time: timestamp }
        };
      });
      setAttendance(prev => ({ ...prev, ...bulk }));
      showSuccess(`Marked all ${filteredLearners.length} learners as ${labels[status]} in the ${sessionLabel} session.`);
    }
  };

  /**
   * Save attendance to localStorage, write an audit log entry capturing
   * the active session user ID and role, then trigger the auto-lock
   * for any fully-marked session.
   */
  const handleSaveAttendance = async () => {
    if (filteredLearners.length === 0) {
      showError('No learners to save. Adjust the filters and try again.');
      return;
    }
    setIsSaving(true);
    try {
      const storageKey = `munyaka_attendance_v2_${filters.grade}_${filters.stream}_${filters.date}`;
      localStorage.setItem(storageKey, JSON.stringify(attendance));
      notifyDataChanged(storageKey);

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
      notifyDataChanged('munyaka_attendance_records');

      // ============================================
      // AUDIT TRAIL: log every save action with the
      // active session user ID and role for proper
      // auditing. The dashboard "Recent Alerts" feed
      // surfaces this entry in real time.
      // ============================================
      const presentCount = metrics.present;
      const absentCount = metrics.absent;
      const lateCount = metrics.late;
      const excusedCount = metrics.excused;
      const auditTitle = isAdminRole
        ? 'Administrator saved attendance register'
        : 'Teacher saved attendance register';

      logActivity({
        type: 'attendance',
        title: auditTitle,
        metadata: {
          action: 'save_attendance',
          userId: userId || 'unknown',
          userName: user?.name || 'Unknown user',
          userRole: userRole || 'unknown',
          grade: filters.grade,
          stream: filters.stream,
          date: filters.date,
          totalLearners: filteredLearners.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          sessionsLockedMorning: isMorningFullyMarked,
          sessionsLockedAfternoon: isAfternoonFullyMarked,
          overrideUsed: adminBypass,
        },
      });

      setIsSaving(false);

      // AUTO-LOCK: After saving, if every learner has a status for a
      // given session, that session is auto-locked to prevent further
      // changes. Teachers can still unlock via the "Unlock Session"
      // button (which requires an admin password).
      const sessionsLocked: SessionType[] = [];
      if (isMorningFullyMarked && !isMorningLocked) {
        applySessionLock('morning');
        sessionsLocked.push('morning');
      }
      if (isAfternoonFullyMarked && !isAfternoonLocked) {
        applySessionLock('afternoon');
        sessionsLocked.push('afternoon');
      }

      let msg = 'Attendance saved successfully.';
      if (sessionsLocked.length === 2) {
        msg = 'Attendance saved and both sessions successfully locked.';
      } else if (sessionsLocked.length === 1) {
        msg = `Attendance saved and ${sessionsLocked[0]} session successfully locked.`;
      } else if (isMorningFullyMarked && isMorningLocked && isAfternoonFullyMarked && isAfternoonLocked) {
        msg = 'Attendance updated. Both sessions remain locked.';
      } else if (!isMorningFullyMarked && !isAfternoonFullyMarked) {
        msg = 'Attendance saved. Complete all learners to auto-lock sessions.';
      } else {
        const pending = !isMorningFullyMarked ? 'morning' : 'afternoon';
        const locked = isMorningFullyMarked ? 'morning' : 'afternoon';
        msg = `Attendance saved. ${locked.charAt(0).toUpperCase() + locked.slice(1)} session auto-locked. Complete ${pending} to lock it too.`;
      }
      showSuccess(msg);
    } catch (e) {
      setIsSaving(false);
      showError('Failed to save attendance.');
    }
  };

  // Print handler
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Unified CSV export — works for both admin and teacher
  const handleExportCSV = async () => {
    if (filteredLearners.length === 0) {
      showError('No students available to export.');
      return;
    }

    const currentDateStr = filters.date;
    const roleTag = isAdminRole ? 'ADMINISTRATOR OVERSIGHT' : 'TEACHER REGISTER';
    const row1 = 'MUNYAKA PRIMARY AND JUNIOR SCHOOL';
    const row2 = 'P.O. BOX 5239-30100, ELDORET';
    const row3 = 'MOTTO: KNOWLEDGE POWER';
    const row4 = `ATTENDANCE REGISTER - ${filters.grade.toUpperCase()} ${filters.stream.toUpperCase()} - DATE: ${currentDateStr}`;
    const row5 = `EXPORTED BY: ${user?.name ?? 'Unknown'} (${userRole || 'unknown'}) — ${roleTag}`;

    const headers = ['#', 'Learner Name', 'Admission/ID', 'Gender', 'Morning Status', 'Morning Time', 'Afternoon Status', 'Afternoon Time'];

    const getStatusLabel = (status?: AttendanceStatus) => {
      if (status === 'P') return 'Present';
      if (status === 'A') return 'Absent';
      if (status === 'L') return 'Late';
      if (status === 'E') return 'Excused';
      return 'Not Marked';
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

    const summaryRows = [
      ['', '', '', 'Morning Present', metrics.presentMorning, '', 'Afternoon Present', metrics.presentAfternoon],
      ['', '', '', 'Morning Absent', metrics.absentMorning, '', 'Afternoon Absent', metrics.absentAfternoon],
      ['', '', '', 'Morning Late', metrics.lateMorning, '', 'Afternoon Late', metrics.lateAfternoon],
      ['', '', '', 'Morning Excused', metrics.excusedMorning, '', 'Afternoon Excused', metrics.excusedAfternoon],
      ['', '', '', 'Overall Rate', `${metrics.rate}%`, '', '', ''],
    ];

    const csvContent = [
      row1,
      row2,
      row3,
      row4,
      row5,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      ['SUMMARY', '', '', '', '', '', '', ''],
      ...summaryRows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    await csvExport.download({
      filename: `attendance_${filters.grade.replace(/\s+/g, '_')}_${filters.stream}_${filters.date}.csv`,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
    });
  };

  // ============================================
  // Render helpers
  // ============================================
  const SessionHeader: React.FC<{ session: SessionType; label: string }> = ({ session, label }) => {
    const sessionLock = session === 'morning' ? morningLock : afternoonLock;
    const isEditable = session === 'morning' ? isMorningEditable : isAfternoonEditable;
    const isLocked = sessionLock.locked;
    const isPastCutoff = session === 'morning' ? isMorningPastCutoff : isAfternoonPastCutoff;
    const sessionColor = session === 'morning'
      ? { dot: 'bg-amber-500', tint: 'bg-amber-50', text: 'text-amber-700', sub: 'text-amber-600/80' }
      : { dot: 'bg-indigo-500', tint: 'bg-indigo-50', text: 'text-indigo-700', sub: 'text-indigo-600/80' };
    const isLive = !isLocked && activeSession === session;

    // Determine lock reason for tooltip
    const lockReason = session === 'morning' ? getMorningLockReason() : getAfternoonLockReason();
    const showLockedBadge = !isEditable && !isLocked;
    const showSealedBadge = isLocked;

    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        <div className="flex items-center gap-2">
          {session === 'morning' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{label}</span>
          {isLive && !isLocked && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black tracking-widest animate-pulse">LIVE</span>
          )}
          {/* Register Locked Badge - shows when outside time window OR past cutoff */}
          {showLockedBadge && (
            <span
              className={cn(
                "ml-1 px-1.5 py-0.5 rounded-md text-white text-[9px] font-black tracking-widest flex items-center gap-1",
                isPastCutoff ? "bg-orange-500" : "bg-slate-300 text-slate-700"
              )}
              title={lockReason || 'Register locked'}
            >
              <Lock size={9} /> {isPastCutoff ? 'CUTOFF' : 'LOCKED'}
            </span>
          )}
          {/* Admin Sealed Badge - shows when explicitly sealed by admin */}
          {showSealedBadge && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black tracking-widest flex items-center gap-1"
              title={lockReason || 'Manually sealed by admin'}
            >
              <Lock size={9} /> SEALED
            </span>
          )}
        </div>
        <span className={`text-[9px] font-black tracking-widest ${sessionColor.sub}`}>
          {SESSION_WINDOWS[session].description}
        </span>
        {isPastCutoff && cutoffConfig.enabled && !adminBypass && (
          <span className="text-[8px] font-medium text-orange-500 mt-0.5">
            Cutoff: {formatCutoffTime(session === 'morning' ? cutoffConfig.morning : cutoffConfig.afternoon)}
          </span>
        )}
      </div>
    );
  };

  const bulkSessionLabel = adminBypass
    ? 'All Sessions'
    : (activeSession === 'afternoon'
        ? 'Afternoon Session'
        : 'Morning Session');

  // ============================================
  // Render
  // ============================================

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* ============================================
          1. HEADER SECTION - stacks on mobile
          ============================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 action-bar w-full max-w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Calendar size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-normal break-words">Attendance</h1>
            <p className="text-xs text-slate-500 font-medium break-words hyphens-auto">
              {isTeacherRole
                ? 'Mark daily attendance for each class.'
                : viewMode === 'marking'
                  ? 'Manual register override — editing attendance.'
                  : 'Class-wide attendance oversight and roll call completion.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Admin: Lock/Unlock Register Toggle */}
          {isAdminRole && viewMode === 'marking' && (
            <Button
              onClick={() => {
                // Quick toggle: if any session is locked, unlock it; otherwise lock morning
                if (morningLock.locked || afternoonLock.locked) {
                  // Show unlock options
                  if (morningLock.locked) openLockAuthModal('unlock', 'morning');
                  else if (afternoonLock.locked) openLockAuthModal('unlock', 'afternoon');
                } else {
                  // Lock morning register
                  openLockAuthModal('lock', 'morning');
                }
              }}
              className={cn(
                "rounded-xl gap-2 text-sm font-bold h-11 px-4 shadow-lg transition-all",
                (morningLock.locked || afternoonLock.locked)
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100"
                  : "bg-slate-600 hover:bg-slate-700 text-white shadow-slate-100"
              )}
              title={(morningLock.locked || afternoonLock.locked) ? "Unlock Register" : "Lock Register"}
            >
              {(morningLock.locked || afternoonLock.locked) ? (
                <>
                  <Unlock size={16} />
                  Unlock
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Lock Register
                </>
              )}
            </Button>
          )}

          {/* Admin: Cutoff Settings Button */}
          {isAdminRole && viewMode === 'marking' && (
            <Button
              variant="outline"
              onClick={() => setShowCutoffSettings(true)}
              className="rounded-xl border-slate-200 bg-white gap-2 text-sm font-bold h-11 px-4 hover:bg-slate-50"
              title="Configure Register Cutoff Times"
            >
              <Clock size={16} />
              Cutoff Settings
            </Button>
          )}

          {/* Admin: prominent Manual Register Override / Edit Attendance toggle */}
          {isAdminRole && (
            <Button
              onClick={() => setViewMode(viewMode === 'marking' ? 'oversight' : 'marking')}
              className={cn(
                "rounded-xl gap-2 text-sm font-bold h-11 px-5 shadow-lg gap-2 transition-all",
                viewMode === 'marking'
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
              )}
              title={
                viewMode === 'marking'
                  ? 'Return to oversight dashboard'
                  : 'Open the interactive register to enter or correct attendance'
              }
            >
              {viewMode === 'marking' ? (
                <>
                  <Eye size={16} />
                  Back to Oversight
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  Manual Register Override
                </>
              )}
            </Button>
          )}
          {/* Shared tools — always visible to admins and teachers */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={csvExport.isDownloading}
            className="rounded-xl border-slate-200 bg-white gap-2 text-sm font-bold h-11 px-4 hover:bg-slate-50"
          >
            {csvExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            CSV Export
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl border-slate-200 bg-white gap-2 text-sm font-bold h-11 px-4 hover:bg-slate-50"
          >
            <Printer size={16} />
            Print
          </Button>
          {/* Save button is only visible inside the marking register */}
          {viewMode === 'marking' && (
            <Button
              onClick={handleSaveAttendance}
              disabled={isSaving || (isMorningLocked && isAfternoonLocked)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm font-bold h-11 px-5 shadow-lg shadow-emerald-100 disabled:opacity-50"
              title={
                (isMorningLocked && isAfternoonLocked)
                  ? 'Both sessions are already locked. Unlock a session to make changes.'
                  : 'Save attendance and auto-lock any fully-marked sessions.'
              }
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Attendance
            </Button>
          )}
        </div>
      </div>

      {/* ============================================
          2. FILTERS & GLOBAL ACTIONS (only in marking mode)
          ============================================ */}
      {viewMode === 'marking' && (
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

          {/* Date Picker */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="w-full pl-9 pr-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Grade Dropdown */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Grade
                      </label>
                      <Select
                        value={filters.grade}
                        onValueChange={(val) => setFilters(prev => ({ ...prev, grade: val, stream: '' }))}
                      >
                        <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold text-slate-700">
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">All Grades</SelectItem>
                          <SelectItem value="PP1" className="text-xs">PP1</SelectItem>
                          <SelectItem value="PP2" className="text-xs">PP2</SelectItem>
                          <SelectItem value="Grade 1" className="text-xs">Grade 1</SelectItem>
                          <SelectItem value="Grade 2" className="text-xs">Grade 2</SelectItem>
                          <SelectItem value="Grade 3" className="text-xs">Grade 3</SelectItem>
                          <SelectItem value="Grade 4" className="text-xs">Grade 4</SelectItem>
                          <SelectItem value="Grade 5" className="text-xs">Grade 5</SelectItem>
                          <SelectItem value="Grade 6" className="text-xs">Grade 6</SelectItem>
                          <SelectItem value="Grade 7" className="text-xs">Grade 7</SelectItem>
                          <SelectItem value="Grade 8" className="text-xs">Grade 8</SelectItem>
                          <SelectItem value="Grade 9" className="text-xs">Grade 9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
          
                    {/* Stream Dropdown — dynamically filtered by selected Grade */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Stream
                      </label>
                      <Select
                        value={filters.stream || 'all'}
                        onValueChange={(val) => setFilters(prev => ({ ...prev, stream: val === 'all' ? '' : val }))}
                        disabled={isStreamDisabled}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700",
                            isStreamDisabled
                              ? "bg-slate-100 opacity-60 cursor-not-allowed"
                              : "bg-slate-50"
                          )}
                        >
                          <SelectValue placeholder={isStreamDisabled ? "Select a grade first" : "All Streams"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">All Streams</SelectItem>
                          {availableStreams.map(stream => (
                            <SelectItem key={stream} value={stream} className="text-xs">
                              {stream}
                            </SelectItem>
                          ))}
                          {availableStreams.length === 0 && !isStreamDisabled && (
                            <SelectItem value="__none__" disabled className="text-xs">
                              No streams configured
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

          {/* Global bulk action buttons */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center justify-between flex-wrap gap-1">
              <span>Bulk Actions ({bulkSessionLabel})</span>
              <div className="flex items-center gap-2">
                {adminBypass && (
                  <span className="text-emerald-600 normal-case font-bold tracking-normal">Override on</span>
                )}
                {/* All Streams visual indicator */}
                {!filters.stream && filters.grade && filters.grade !== 'all' && availableStreams.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border border-indigo-200">
                    All {availableStreams.length} Streams in {filters.grade}
                  </span>
                )}
                {!filters.stream && (!filters.grade || filters.grade === 'all') && (
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border border-amber-200">
                    ALL GRADES × ALL STREAMS
                  </span>
                )}
              </div>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              <button
                onClick={() => markAllAs('P', activeSession ?? 'morning')}
                disabled={activeSession === 'afternoon' ? isAfternoonLocked : isMorningLocked}
                className="h-11 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-widest border border-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSession === 'afternoon' ? "Mark all as Present (Afternoon)" : "Mark all as Present (Morning)"}
              >
                <CheckCircle2 size={14} />
                <span>Present</span>
              </button>
              <button
                onClick={() => markAllAs('A', activeSession ?? 'morning')}
                disabled={activeSession === 'afternoon' ? isAfternoonLocked : isMorningLocked}
                className="h-11 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] uppercase tracking-widest border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSession === 'afternoon' ? "Mark all as Absent (Afternoon)" : "Mark all as Absent (Morning)"}
              >
                <XCircle size={14} />
                <span>Absent</span>
              </button>
              <button
                onClick={() => markAllAs('L', activeSession ?? 'morning')}
                disabled={activeSession === 'afternoon' ? isAfternoonLocked : isMorningLocked}
                className="h-11 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-widest border border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSession === 'afternoon' ? "Mark all as Late (Afternoon)" : "Mark all as Late (Morning)"}
              >
                <Clock size={14} />
                <span>Late</span>
              </button>
              <button
                onClick={() => markAllAs('E', activeSession ?? 'morning')}
                disabled={activeSession === 'afternoon' ? isAfternoonLocked : isMorningLocked}
                className="h-11 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] uppercase tracking-widest border border-sky-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSession === 'afternoon' ? "Mark all as Excused (Afternoon)" : "Mark all as Excused (Morning)"}
              >
                <ShieldCheck size={14} />
                <span>Excused</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* ============================================
          2a. REGISTER STATUS BANNER (Locked / Sealed / Cutoff)
          ============================================ */}
      {viewMode === 'marking' && (
        <>
          {/* Sealed Sessions Banner (manually locked) */}
          {(isMorningLocked || isAfternoonLocked) && (
            <div className="rounded-3xl p-5 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white shadow-xl shadow-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 ring-2 ring-white/30">
                  <LockKeyhole size={24} className="text-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-white/25 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/30">
                      {isMorningLocked && isAfternoonLocked
                        ? 'Both Sessions Sealed'
                        : isMorningLocked
                        ? 'Morning Sealed'
                        : 'Afternoon Sealed'}
                    </span>
                    <span className="text-xs font-medium text-rose-100 truncate">
                      {isMorningLocked && isAfternoonLocked
                        ? `Morning locked at ${formatLockedAt(morningLock.lockedAt)} • Afternoon locked at ${formatLockedAt(afternoonLock.lockedAt)}`
                        : isMorningLocked
                        ? `Locked at ${formatLockedAt(morningLock.lockedAt)}`
                        : `Locked at ${formatLockedAt(afternoonLock.lockedAt)}`}
                    </span>
                  </div>
                  <p className="font-bold text-sm sm:text-base mt-0.5 truncate">
                    Attendance saved. Status toggles and bulk actions are read-only for sealed sessions.
                    {(morningLock.reason || afternoonLock.reason) && (morningLock.reason || afternoonLock.reason) !== 'Auto-locked after saving attendance' && (
                      <span className="font-medium text-rose-100/80 ml-2">Reason: {morningLock.reason || afternoonLock.reason}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isMorningLocked && (
                  <Button
                    onClick={() => openLockAuthModal('unlock', 'morning')}
                    className="bg-white text-rose-600 hover:bg-rose-50 rounded-xl font-bold shrink-0 text-xs shadow-md gap-1.5"
                  >
                    <Unlock size={14} />
                    Unlock Morning
                  </Button>
                )}
                {isAfternoonLocked && (
                  <Button
                    onClick={() => openLockAuthModal('unlock', 'afternoon')}
                    className="bg-white text-rose-600 hover:bg-rose-50 rounded-xl font-bold shrink-0 text-xs shadow-md gap-1.5"
                  >
                    <Unlock size={14} />
                    Unlock Afternoon
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Cutoff Warning Banner (past cutoff but not manually locked) */}
          {(() => {
            const isPastCutoff = (isMorningPastCutoff || isAfternoonPastCutoff) && cutoffConfig.enabled;
            const showBanner = !isMorningLocked && !isAfternoonLocked && !adminBypass && isSelectedDateToday && isPastCutoff;
            if (!showBanner) return null;
            return (
              <div className="rounded-3xl p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Lock size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Register Cutoff {isMorningPastCutoff && isAfternoonPastCutoff ? 'Exceeded' : 'Reached'}</p>
                    <p className="text-xs text-orange-100">
                      {isMorningPastCutoff && isAfternoonPastCutoff
                        ? `Morning (${formatCutoffTime(cutoffConfig.morning)}) and Afternoon (${formatCutoffTime(cutoffConfig.afternoon)}) cutoffs have passed.`
                        : isMorningPastCutoff
                        ? `Morning cutoff (${formatCutoffTime(cutoffConfig.morning)}) has passed.`
                        : `Afternoon cutoff (${formatCutoffTime(cutoffConfig.afternoon)}) has passed.`}
                      {isAdminRole ? ' Enable admin override to edit.' : ' Please contact the administrator to unlock or adjust the attendance register.'}
                    </p>
                  </div>
                </div>
                {isAdminRole && (
                  <Button
                    onClick={() => setAdminBypass(true)}
                    className="bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-xs h-9 px-4 gap-1.5 shrink-0"
                  >
                    <Unlock size={14} />
                    Enable Override
                  </Button>
                )}
              </div>
            );
          })()}

          {/* Admin Override Active Banner */}
          {adminBypass && isAdminRole && !isMorningLocked && !isAfternoonLocked && (
            <div className="rounded-3xl p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Unlock size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Admin Override Active</p>
                  <p className="text-xs text-emerald-100">
                    You can edit all sessions regardless of time windows or cutoff settings.
                    Disable the toggle above to return to normal restrictions.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setAdminBypass(false)}
                className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-xs h-9 px-4 gap-1.5 shrink-0"
              >
                <Lock size={14} />
                Disable Override
              </Button>
            </div>
          )}
        </>
      )}

      {/* ============================================
                2b. TIME WINDOW BANNER + ADMIN OVERRIDE (RBAC-gated)
                ============================================ */}
      {viewMode === 'marking' && (
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                      <Clock size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Live System Clock
                      </p>
                      <p className="text-xl font-black font-mono text-slate-900 tracking-tight tabular-nums">
                        {format12h(currentTime)}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                        {activeSession === 'morning' ? (
                          <span className="text-amber-700">🌅 Morning session is live now (6:00 AM – 11:59 AM)</span>
                        ) : activeSession === 'afternoon' ? (
                          <span className="text-indigo-700">🌇 Afternoon session is live now (12:00 PM – 6:00 PM)</span>
                        ) : activeSession === null && isSelectedDateToday ? (
                          <span className="text-rose-600">⏰ No session is currently active. Morning begins at 6:00 AM.</span>
                        ) : (
                          <span className="text-slate-500">📅 Viewing {selectedDateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {adminBypass && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <Unlock size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 whitespace-nowrap">
                          Override Active
                        </span>
                      </div>
                    )}
                    {isAdminRole ? (
                      <>
                        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-100">
                          <Info size={14} className="text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 max-w-[200px] leading-tight">
                            Time windows enforce recording schedule
                          </p>
                        </div>
                        <label
                          htmlFor="admin-bypass-toggle"
                          className={cn(
                            "flex items-center gap-2.5 px-4 h-11 rounded-2xl border-2 cursor-pointer transition-all select-none",
                            adminBypass
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          )}
                          title="Override time windows to edit past or future sessions"
                        >
                          {adminBypass ? <Unlock size={16} /> : <Lock size={16} />}
                          <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                            Admin Override
                          </span>
                          <span
                            className={cn(
                              "relative inline-flex w-9 h-5 rounded-full transition-colors",
                              adminBypass ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                adminBypass && "translate-x-4"
                              )}
                            />
                          </span>
                          <input
                            id="admin-bypass-toggle"
                            type="checkbox"
                            className="sr-only"
                            checked={adminBypass}
                            onChange={(e) => setAdminBypass(e.target.checked)}
                            aria-label="Admin override of session time windows"
                          />
                        </label>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 border border-slate-200">
                        <Lock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Read-Only (Past Session)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
      )}

      {/* ============================================
          3a. SUMMARY METRICS CARDS — Overshight aggregate (admin)
          ============================================ */}
      {viewMode === 'oversight' && isAdminRole && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm rounded-2xl bg-indigo-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Total Learners</p>
                  <h3 className="text-3xl font-black text-indigo-700 mt-1">{oversightMetrics.totalLearners}</h3>
                  <p className="text-[10px] font-bold text-indigo-600 mt-1">across all streams</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Users size={22} />
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Streams Complete</p>
                  <h3 className="text-3xl font-black text-emerald-700 mt-1">
                    {oversightMetrics.fullyCompletedStreams}
                    <span className="text-base text-emerald-600/80">/{oversightMetrics.streamsTotal}</span>
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">morning + afternoon sealed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ClipboardList size={22} />
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-amber-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Roll Call Pending</p>
                  <h3 className="text-3xl font-black text-amber-700 mt-1">
                    {oversightMetrics.streamsTotal - oversightMetrics.fullyCompletedStreams}
                  </h3>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">streams awaiting teachers</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-purple-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Avg Attendance</p>
                  <h3 className="text-3xl font-black text-purple-700 mt-1">{oversightMetrics.averageRate}%</h3>
                  <p className="text-[10px] font-bold text-purple-600 mt-1">school-wide rate</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <TrendingUp size={22} />
                </div>
              </div>
            </Card>
          </div>

          {/* ============================================
              3b. ROLL CALL COMPLETION TABLE (per stream)
              ============================================ */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            {/* Filter Bar — controls for Grade, Stream, and free-text search */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Grade Select */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Grade
                  </label>
                  <Select value={ovGrade} onValueChange={setOvGrade}>
                    <SelectTrigger className="h-9 rounded-xl bg-white border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Grades</SelectItem>
                      <SelectItem value="PP1" className="text-xs">PP1</SelectItem>
                      <SelectItem value="PP2" className="text-xs">PP2</SelectItem>
                      <SelectItem value="Grade 1" className="text-xs">Grade 1</SelectItem>
                      <SelectItem value="Grade 2" className="text-xs">Grade 2</SelectItem>
                      <SelectItem value="Grade 3" className="text-xs">Grade 3</SelectItem>
                      <SelectItem value="Grade 4" className="text-xs">Grade 4</SelectItem>
                      <SelectItem value="Grade 5" className="text-xs">Grade 5</SelectItem>
                      <SelectItem value="Grade 6" className="text-xs">Grade 6</SelectItem>
                      <SelectItem value="Grade 7" className="text-xs">Grade 7</SelectItem>
                      <SelectItem value="Grade 8" className="text-xs">Grade 8</SelectItem>
                      <SelectItem value="Grade 9" className="text-xs">Grade 9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stream Select */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Stream
                  </label>
                  <Select value={ovStream} onValueChange={setOvStream}>
                    <SelectTrigger className="h-9 rounded-xl bg-white border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500">
                      <SelectValue placeholder="All Streams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Streams</SelectItem>
                      <SelectItem value="YELLOW" className="text-xs">Yellow</SelectItem>
                      <SelectItem value="BLUE" className="text-xs">Blue</SelectItem>
                      <SelectItem value="GREEN" className="text-xs">Green</SelectItem>
                      <SelectItem value="RED" className="text-xs">Red</SelectItem>
                      <SelectItem value="ALPHA" className="text-xs">Alpha</SelectItem>
                      <SelectItem value="BETA" className="text-xs">Beta</SelectItem>
                      <SelectItem value="MERCURY" className="text-xs">Mercury</SelectItem>
                      <SelectItem value="VENUS" className="text-xs">Venus</SelectItem>
                      <SelectItem value="JUPITER" className="text-xs">Jupiter</SelectItem>
                      <SelectItem value="NEPTUNE" className="text-xs">Neptune</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input
                      type="text"
                      placeholder="Search Grade, Stream..."
                      value={ovSearch}
                      onChange={(e) => setOvSearch(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-white border-slate-200 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Reset Filters Button */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    &nbsp;
                  </label>
                  <Button
                    onClick={() => {
                      setOvGrade('all');
                      setOvStream('all');
                      setOvSearch('');
                      setOvDate(getTodayDateStr());
                    }}
                    variant="outline"
                    className="w-full h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1.5 focus:ring-2 focus:ring-indigo-100"
                  >
                    <RefreshCw size={13} />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                  <BarChart3 size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {sectionTitle}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {sectionSubtitle}
                  </p>
                </div>
              </div>
              {/* Date navigation controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isOversightToday ? (
                  <Badge variant="outline" className="rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 font-black text-[10px] uppercase tracking-widest px-2.5 py-1">
                    <Sparkles size={12} className="mr-1" />
                    Today — Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-xl bg-amber-50 text-amber-700 border-amber-200 font-black text-[10px] uppercase tracking-widest px-2.5 py-1">
                    <Lock size={12} className="mr-1" />
                    Historical View
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Button
                    onClick={ovGoToPrevDay}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white text-slate-600"
                    title="Previous day"
                    aria-label="Previous day"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <div className="relative">
                    <input
                      type="date"
                      value={ovDate}
                      onChange={(e) => setOvDate(e.target.value)}
                      className="h-9 px-3 pr-9 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 tabular-nums"
                      aria-label="Select date for roll call review"
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                  <Button
                    onClick={ovGoToNextDay}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white text-slate-600"
                    title="Next day"
                    aria-label="Next day"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                <Button
                  onClick={ovGoToToday}
                  disabled={isOversightToday}
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Historical Read-Only banner shown when viewing a past date */}
            {!isOversightToday && (
              <div className={cn(
                "mx-6 sm:mx-8 mt-5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border",
                adminBypass
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    adminBypass ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {adminBypass ? <Unlock size={18} /> : <Lock size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-black tracking-tight",
                      adminBypass ? "text-emerald-900" : "text-amber-900"
                    )}>
                      {adminBypass
                        ? 'Historical Edit Mode Active'
                        : 'Historical View — Read-Only'}
                    </p>
                    <p className={cn(
                      "text-[11px] font-medium",
                      adminBypass ? "text-emerald-700" : "text-amber-700"
                    )}>
                      {adminBypass
                        ? 'Admin Override is enabled. Register rows below are editable for corrections.'
                        : 'You are viewing a past date. Register rows are read-only. Use Manual Register Override to make corrections.'}
                    </p>
                  </div>
                </div>
                {isAdminRole && !adminBypass && (
                  <Button
                    onClick={() => {
                      setViewMode('marking');
                      setAdminBypass(true);
                      setFilters(prev => ({ ...prev, date: ovDate }));
                    }}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    <Edit3 size={14} />
                    Manual Register Override
                  </Button>
                )}
              </div>
            )}

            <div className="p-2">
              <DualScrollContainer>
              <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-44 min-w-[150px] align-top text-left px-3 py-2 whitespace-nowrap font-black text-[10px] uppercase tracking-wider text-slate-500">CLASS / STREAM</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-slate-500">LEARNERS</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-amber-600 text-center">MORNING ROLL</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-amber-600 text-center">MORNING PRESENT</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-indigo-600 text-center">AFTERNOON ROLL</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-indigo-600 text-center">AFTERNOON PRESENT</th>
                    <th className="px-3 py-2 font-black text-[10px] uppercase tracking-wider text-slate-500 text-center">RATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStreamSummaries.length > 0 ? filteredStreamSummaries.map((s) => (
                    <tr key={`${s.grade}-${s.stream}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="w-44 min-w-[150px] align-top text-left px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Layers size={14} />
                          </div>
                          <div className="flex flex-col text-left whitespace-nowrap">
                            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                              {s.grade.toUpperCase().startsWith('GRADE ') ? s.grade.toUpperCase() : `GRADE ${s.grade}`}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase whitespace-nowrap">
                              {s.stream}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="space-y-1 max-w-[220px]">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide block mb-0.5">
                            {s.totalLearners} learner{s.totalLearners !== 1 ? 's' : ''}:
                          </span>
                          <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                            {s.learners && s.learners.length > 0 ? (
                              s.learners.map((learner, idx) => (
                                <div key={learner.id || idx} className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-mono">{idx + 1}.</span>
                                  <span className="truncate">{learner.name}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No learners enrolled</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top">
                        {s.morningCompleted ? (
                          <Badge variant="outline" className="rounded-md px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] uppercase tracking-wider inline-flex items-center">
                            <CheckCircle2 size={10} className="mr-0.5 shrink-0" /> Submitted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-md px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200 font-bold text-[9px] uppercase tracking-wider inline-flex items-center">
                            <Clock size={10} className="mr-0.5 shrink-0" /> Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700 text-xs align-top">
                        {s.morningCompleted ? `${s.morningPresent}/${s.totalLearners}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center align-top">
                        {s.afternoonCompleted ? (
                          <Badge variant="outline" className="rounded-md px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] uppercase tracking-wider inline-flex items-center">
                            <CheckCircle2 size={10} className="mr-0.5 shrink-0" /> Submitted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-md px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200 font-bold text-[9px] uppercase tracking-wider inline-flex items-center">
                            <Clock size={10} className="mr-0.5 shrink-0" /> Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700 text-xs align-top">
                        {s.afternoonCompleted ? `${s.afternoonPresent}/${s.totalLearners}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center align-top">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                s.rate >= 90 ? "bg-emerald-500" : s.rate >= 70 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${s.rate}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-bold tabular-nums",
                            s.rate >= 90 ? "text-emerald-700" : s.rate >= 70 ? "text-amber-700" : "text-rose-700"
                          )}>
                            {s.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                            <Search size={32} />
                          </div>
                          <p className="text-slate-800 font-bold text-sm">No classes found matching this filter combination.</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Try selecting "All Grades" or a different stream, or click below to clear your filters.
                          </p>
                          <Button
                            onClick={() => {
                              setOvGrade('all');
                              setOvStream('all');
                              setOvSearch('');
                              setOvDate(getTodayDateStr());
                            }}
                            variant="outline"
                            className="mt-2 h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1.5"
                          >
                            <RefreshCw size={13} />
                            Reset Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </DualScrollContainer>
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Activity size={12} className="text-indigo-500" />
                Showing <span className="text-slate-900 font-black">{filteredStreamSummaries.length}</span> stream{filteredStreamSummaries.length !== 1 ? 's' : ''} across <span className="text-slate-900 font-black">{oversightMetrics.totalLearners}</span> learners
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Updated {format12h(currentTime)} • Auto-syncs every minute
              </p>
            </div>
          </Card>

          {/* ============================================
              3c. AGGREGATE ATTENDANCE STATISTICS ACROSS GRADES
              ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                  <Layers size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Grade-Level Summary</h2>
                  <p className="text-xs text-slate-500 font-medium">Average attendance rate per grade level today.</p>
                </div>
              </div>
              <div className="space-y-3">
                {filteredStreamSummaries.slice(0, 6).map((s) => (
                  <div key={`grade-${s.grade}-${s.stream}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{s.grade} <span className="text-slate-400 font-medium">— {s.stream}</span></span>
                      <span className="font-black text-slate-900 tabular-nums">{s.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          s.rate >= 90 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : s.rate >= 70 ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-rose-500 to-rose-600"
                        )}
                        style={{ width: `${s.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <Clock size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Session Completion</h2>
                  <p className="text-xs text-slate-500 font-medium">Morning vs afternoon roll call coverage today.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-black uppercase tracking-widest text-amber-700">Morning</span>
                    <span className="font-black text-slate-900 tabular-nums">
                      {oversightMetrics.morningCompletedStreams}/{oversightMetrics.streamsTotal}
                    </span>
                  </div>
                  <div className="w-full bg-amber-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700"
                      style={{ width: `${oversightMetrics.streamsTotal > 0 ? (oversightMetrics.morningCompletedStreams / oversightMetrics.streamsTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    {oversightMetrics.streamsTotal > 0
                      ? `${Math.round((oversightMetrics.morningCompletedStreams / oversightMetrics.streamsTotal) * 100)}% of streams submitted`
                      : 'No streams to evaluate'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-black uppercase tracking-widest text-indigo-700">Afternoon</span>
                    <span className="font-black text-slate-900 tabular-nums">
                      {oversightMetrics.afternoonCompletedStreams}/{oversightMetrics.streamsTotal}
                    </span>
                  </div>
                  <div className="w-full bg-indigo-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${oversightMetrics.streamsTotal > 0 ? (oversightMetrics.afternoonCompletedStreams / oversightMetrics.streamsTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    {oversightMetrics.streamsTotal > 0
                      ? `${Math.round((oversightMetrics.afternoonCompletedStreams / oversightMetrics.streamsTotal) * 100)}% of streams submitted`
                      : 'No streams to evaluate'}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <Info size={14} className="text-indigo-500 shrink-0" />
                  <p>
                    Use <span className="font-black text-indigo-700">Manual Register Override</span> to correct any submitted register.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================
          3b. SUMMARY METRICS CARDS (marking mode)
          ============================================ */}
      {viewMode === 'marking' && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

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
      )}

      {/* ============================================
          4. STUDENT ATTENDANCE TABLE (Morning & Afternoon)
          ============================================ */}
      {viewMode === 'marking' && (
      <Card className={cn(
        "border-none shadow-sm rounded-[2rem] bg-white overflow-hidden transition-all",
        (isMorningLocked || isAfternoonLocked) && "ring-2 ring-rose-200/60"
      )}>

        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              (isMorningLocked || isAfternoonLocked)
                ? "bg-rose-100 text-rose-600"
                : "bg-indigo-100 text-indigo-600"
            )}>
              {(isMorningLocked && isAfternoonLocked) ? <Lock size={22} /> : <UserCheck size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {filters.grade} {filters.stream} — {filters.date}
                </h2>
                {isMorningLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                    <Lock size={10} /> Morning Sealed
                  </span>
                )}
                {isAfternoonLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                    <Lock size={10} /> Afternoon Sealed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Click a status button to mark each session. Click again to clear. Sessions auto-lock once every learner is marked and saved.
              </p>
            </div>
          </div>

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

        <div className="p-2">
          <DualScrollContainer>
          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th
                  rowSpan={2}
                  className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500 border-r border-slate-200 align-bottom min-w-[260px]"
                >
                  Learners
                </th>
                <th colSpan={4} className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-amber-700 text-center border-r border-slate-200">
                  <SessionHeader session="morning" label="Morning Session" />
                </th>
                <th colSpan={4} className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-indigo-700 text-center">
                  <SessionHeader session="afternoon" label="Afternoon Session" />
                </th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-emerald-600 text-center border-r border-slate-200 min-w-[80px]">Present</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-rose-600 text-center border-r border-slate-200 min-w-[80px]">Absent</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-amber-600 text-center border-r border-slate-200 min-w-[80px]">Late</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-sky-600 text-center border-r border-slate-200 min-w-[80px]">Excused</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-emerald-600 text-center border-r border-slate-200 min-w-[80px]">Present</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-rose-600 text-center border-r border-slate-200 min-w-[80px]">Absent</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-amber-600 text-center border-r border-slate-200 min-w-[80px]">Late</th>
                <th className="px-2 py-3 font-black text-[9px] uppercase tracking-widest text-sky-600 text-center min-w-[80px]">Excused</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-slate-100", (isMorningLocked && isAfternoonLocked) && "opacity-95")}>
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner, index) => {
                  const record = attendance[learner.id] || {};
                  const morningStatus = record.morning?.status;
                  const afternoonStatus = record.afternoon?.status;
                  return (
                    <tr key={learner.id} className="hover:bg-slate-50/50 transition-colors">
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

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="P"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isMorningEditable}
                          isLocked={isMorningLocked}
                          activeClass="bg-emerald-500 border-emerald-500 text-white shadow-md"
                          inactiveClass="bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="A"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isMorningEditable}
                          isLocked={isMorningLocked}
                          activeClass="bg-rose-500 border-rose-500 text-white shadow-md"
                          inactiveClass="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="L"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isMorningEditable}
                          isLocked={isMorningLocked}
                          activeClass="bg-amber-500 border-amber-500 text-white shadow-md"
                          inactiveClass="bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-200 text-center">
                        <SessionStatusButton
                          status="E"
                          session="morning"
                          studentId={learner.id}
                          currentStatus={morningStatus}
                          currentTime={record.morning?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isMorningEditable}
                          isLocked={isMorningLocked}
                          activeClass="bg-sky-500 border-sky-500 text-white shadow-md"
                          inactiveClass="bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="P"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isAfternoonEditable}
                          isLocked={isAfternoonLocked}
                          activeClass="bg-emerald-500 border-emerald-500 text-white shadow-md"
                          inactiveClass="bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="A"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isAfternoonEditable}
                          isLocked={isAfternoonLocked}
                          activeClass="bg-rose-500 border-rose-500 text-white shadow-md"
                          inactiveClass="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        />
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 text-center">
                        <SessionStatusButton
                          status="L"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isAfternoonEditable}
                          isLocked={isAfternoonLocked}
                          activeClass="bg-amber-500 border-amber-500 text-white shadow-md"
                          inactiveClass="bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                        />
                      </td>

                      <td className="px-2 py-3 text-center">
                        <SessionStatusButton
                          status="E"
                          session="afternoon"
                          studentId={learner.id}
                          currentStatus={afternoonStatus}
                          currentTime={record.afternoon?.time}
                          onSetStatus={setSessionStatus}
                          isEditable={isAfternoonEditable}
                          isLocked={isAfternoonLocked}
                          activeClass="bg-sky-500 border-sky-500 text-white shadow-md"
                          inactiveClass="bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                              <tr>
                                <td colSpan={9} className="px-8 py-16 text-center">
                                  <div className="flex flex-col items-center gap-4">
                                    <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full text-amber-500 shadow-inner">
                                      <Users size={36} />
                                    </div>
                                    <div className="space-y-1.5 max-w-md">
                                      {String(searchTerm || '').trim() ? (
                                                                              <>
                                                                                <p className="text-slate-900 font-black text-base">
                                                                                  No learners match "{searchTerm}"
                                                                                </p>
                                                                                <p className="text-xs text-slate-500 font-medium">
                                                                                  Try searching with a different name or admission number. {liveStudents.length === 0 && `No students are registered for ${filters.grade} ${filters.stream}.`}
                                                                                </p>
                                                                              </>
                                                                            ) : (
                                        <>
                                          <p className="text-slate-900 font-black text-base">
                                            No learners registered under {filters.grade} {filters.stream}
                                          </p>
                                          <p className="text-xs text-slate-500 font-medium">
                                            There are currently no active students assigned to this class and stream. Add learners to start marking attendance.
                                          </p>
                                        </>
                                      )}
                                    </div>
                                    {liveStudents.length === 0 && (
                                      <p className="text-[11px] text-slate-400 font-medium italic mt-2">
                                        Please contact an administrator to register learners for this class and stream.
                                      </p>
                                    )}
                                    {String(searchTerm || '').trim() && liveStudents.length > 0 && (
                                      <button
                                        onClick={() => setSearchTerm('')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs h-10 px-5 transition-colors"
                                      >
                                        <RefreshCw size={14} />
                                        Clear Search
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
            </tbody>
          </table>
          </DualScrollContainer>
        </div>

        {filteredLearners.length > 0 && (
          <div className={cn(
            "px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2",
            (isMorningLocked && isAfternoonLocked) ? "bg-rose-50/40" : "bg-slate-50/50"
          )}>
            <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
              {(isMorningLocked || isAfternoonLocked) && <Lock size={12} className="text-rose-500" />}
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
      )}

      {/* ============================================
          4b. CUTOFF TIME SETTINGS MODAL (Admin Only)
          ============================================ */}
      {showCutoffSettings && isAdminRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCutoffSettings(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b bg-indigo-50 border-indigo-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Register Cutoff Times
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    Configure when each session becomes locked (non-editable) for teachers.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Enable/Disable Cutoff Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    cutoffConfig.enabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Enable Cutoff Enforcement</p>
                    <p className="text-xs text-slate-500">When enabled, registers auto-lock after cutoff time</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = { ...cutoffConfig, enabled: !cutoffConfig.enabled };
                    setCutoffConfig(next);
                    saveCutoffConfig(next);
                  }}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors",
                    cutoffConfig.enabled ? "bg-emerald-500" : "bg-slate-300"
                  )}
                  aria-label="Toggle cutoff enforcement"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
                      cutoffConfig.enabled ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Morning Cutoff Time */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Sun size={14} className="text-amber-500" />
                  Morning Session Cutoff
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={`${String(cutoffConfig.morning.hour).padStart(2, '0')}:${String(cutoffConfig.morning.minute).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const next = { ...cutoffConfig, morning: { hour: h, minute: m } };
                      setCutoffConfig(next);
                      saveCutoffConfig(next);
                    }}
                    className="flex-1 h-12 px-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                  <span className="text-sm font-medium text-slate-500">
                    {formatCutoffTime(cutoffConfig.morning)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  After this time, the morning register becomes locked for teachers.
                </p>
              </div>

              {/* Afternoon Cutoff Time */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Moon size={14} className="text-indigo-500" />
                  Afternoon Session Cutoff
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={`${String(cutoffConfig.afternoon.hour).padStart(2, '0')}:${String(cutoffConfig.afternoon.minute).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const next = { ...cutoffConfig, afternoon: { hour: h, minute: m } };
                      setCutoffConfig(next);
                      saveCutoffConfig(next);
                    }}
                    className="flex-1 h-12 px-4 rounded-xl bg-indigo-50 border border-indigo-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="text-sm font-medium text-slate-500">
                    {formatCutoffTime(cutoffConfig.afternoon)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  After this time, the afternoon register becomes locked for teachers.
                </p>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-2">
                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 font-medium">
                  Admins with <strong>Admin Override</strong> enabled can always edit registers regardless of cutoff times.
                  Sessions can also be manually locked/unlocked from the header or session banner.
                </p>
              </div>
            </div>

            <div className="p-5 border-t bg-white border-slate-100 flex gap-2 justify-end shrink-0">
              <Button
                variant="ghost"
                onClick={() => setShowCutoffSettings(false)}
                className="rounded-xl font-bold h-11 px-5"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  saveCutoffConfig(cutoffConfig);
                  setShowCutoffSettings(false);
                  showSuccess('Cutoff settings saved successfully');
                }}
                className="rounded-xl font-bold h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg gap-2"
              >
                <Save size={16} />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          5. ADMIN AUTHORIZATION MODAL (LOCK / UNLOCK)
          ============================================ */}
      {lockAuthOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLockAuthModal();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className={cn(
              "p-6 border-b",
              lockAction === 'lock' ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  lockAction === 'lock' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                )}>
                  {lockAction === 'lock' ? <LockKeyhole size={24} /> : <Unlock size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {lockAction === 'lock'
                      ? `Lock ${lockTargetSession ? SESSION_WINDOWS[lockTargetSession].label : ''} Session`
                      : `Unlock ${lockTargetSession ? SESSION_WINDOWS[lockTargetSession].label : ''} Session`}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {lockAction === 'lock'
                      ? 'Seal the session to prevent further edits.'
                      : 'Re-open the session to make corrections.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Register</p>
                <p className="text-sm font-bold text-slate-900">
                  {filters.grade} {filters.stream}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {filters.date} — {lockTargetSession ? SESSION_WINDOWS[lockTargetSession].label : ''} session
                </p>
                {lockAction === 'unlock' && lockTargetSession && (
                  <p className="text-[10px] font-bold text-slate-500 mt-1">
                    Locked: {formatLockedAt(
                      lockTargetSession === 'morning'
                        ? morningLock.lockedAt
                        : afternoonLock.lockedAt
                    )}
                  </p>
                )}
              </div>

              {adminAuthError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={16} className="shrink-0" />
                  {adminAuthError}
                </div>
              )}

              {lockAction === 'lock' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Lock Reason (Optional)
                  </label>
                  <Input
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="e.g. Finalized and signed off by class teacher"
                    className="rounded-xl h-11 bg-slate-50 border-none font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Admin Password / PIN
                </label>
                <Input
                  type="password"
                  value={adminAuthPassword}
                  onChange={(e) => {
                    setAdminAuthPassword(e.target.value);
                    if (adminAuthError) setAdminAuthError('');
                  }}
                  placeholder="••••••••"
                  className="rounded-xl h-11 bg-slate-50 border-none font-bold"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2">
                <Shield size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium">
                  {lockAction === 'lock'
                    ? 'Locking is permanent until the admin explicitly unlocks the session.'
                    : 'Unlocking re-opens the session for edits. The session will auto-lock again the next time it is saved with all learners marked.'}
                </p>
              </div>
            </div>

            <div className={cn(
              "p-5 border-t flex gap-2 justify-end",
              lockAction === 'lock' ? "bg-rose-50/30 border-rose-100" : "bg-amber-50/30 border-amber-100"
            )}>
              <Button
                variant="ghost"
                onClick={closeLockAuthModal}
                disabled={isAdminAuthVerifying}
                className="rounded-xl font-bold h-11 px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmLockAction}
                disabled={isAdminAuthVerifying}
                className={cn(
                  "rounded-xl font-bold h-11 px-6 text-white shadow-lg gap-2",
                  lockAction === 'lock'
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                )}
              >
                {isAdminAuthVerifying ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : lockAction === 'lock' ? (
                  <Lock size={16} />
                ) : (
                  <Unlock size={16} />
                )}
                {lockAction === 'lock'
                  ? `Confirm Lock${lockTargetSession ? ` (${SESSION_WINDOWS[lockTargetSession].label})` : ''}`
                  : `Confirm Unlock${lockTargetSession ? ` (${SESSION_WINDOWS[lockTargetSession].label})` : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Session-specific status toggle button
interface SessionStatusButtonProps {
  status: AttendanceStatus;
  session: SessionType;
  studentId: string;
  currentStatus?: AttendanceStatus;
  currentTime?: string;
  onSetStatus: (studentId: string, session: SessionType, status: AttendanceStatus) => void;
  isEditable: boolean;
  isLocked: boolean;
  activeClass: string;
  inactiveClass: string;
}

const SessionStatusButton: React.FC<SessionStatusButtonProps> = ({
  status,
  session,
  studentId,
  currentStatus,
  isEditable,
  isLocked,
  onSetStatus,
  activeClass,
  inactiveClass
}) => {
  const isActive = currentStatus === status;
  const labels = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' };

  const disabledReason = isLocked
    ? `${labels[status]} (${session}) — session is locked. Tap "Unlock Session" to make corrections.`
    : !isEditable
    ? `${labels[status]} (${session}) — session is outside its recording window. Enable admin override to edit.`
    : `${labels[status]} (${session})`;

  return (
    <button
      type="button"
      onClick={() => onSetStatus(studentId, session, status)}
      disabled={!isEditable || isLocked}
      title={disabledReason}
      aria-label={disabledReason}
      aria-pressed={isActive}
      className={cn(
        "w-8 h-8 rounded-lg border-2 font-bold text-[10px] uppercase tracking-widest transition-all duration-200 active:scale-90 flex items-center justify-center mx-auto",
        (!isEditable || isLocked)
          ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-60"
          : isActive
            ? activeClass
            : inactiveClass
      )}
    >
      {(!isEditable || isLocked) ? (
        <Lock size={12} />
      ) : isActive ? (
        <CheckCircle2 size={14} />
      ) : (
        <span className="text-[9px]">{labels[status][0]}</span>
      )}
    </button>
  );
};

export default Attendance;
