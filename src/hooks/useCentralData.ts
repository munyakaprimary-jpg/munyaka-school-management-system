"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { lsSet, notifyDataChanged as fireDataChanged, lsRead } from '@/utils/storage';
import { getLocalStorage, tryParse } from '@/utils/storageUtils';
import {
  STAFF_MASTER_KEY,
  initializeStaffMaster,
  getStaffMasterCount,
  getStaffMetrics,
  getCategorizedMetrics,
  getStaffMaster,
} from '@/services/staffMasterService';

// ─── Types ────────────────────────────────────────────────────────────────
export interface Learner {
  id: string;
  status?: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  schoolId?: string;
  isTeacher?: boolean;
  role?: string;
  gender?: string;
  isArchived?: boolean;
  deletedAt?: string;
}

export interface Teacher {
  id: string;
  status?: string;
  name?: string;
  role?: string;
  schoolId?: string;
  isTeacher?: boolean;
  systemRole?: string;
  department?: string;
  isArchived?: boolean;
  deletedAt?: string;
  is_active?: boolean | number | string;
}

export interface AttendanceLog {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  schoolId?: string;
  timestamp?: string;
}

export interface CentralDataStats {
  totalStudents: number;
  totalTeachers: number;
  activeTeacherCount?: number;
  pendingTeacherCount?: number;
  categorizedMetrics?: CategorizedStaffMetrics;
  todayAttendanceRate: number;
  isLoading: boolean;
}

export interface CategorizedStaffMetrics {
  teachingTotal: number;
  teachingActive: number;
  teachingPending: number;
  nonTeachingTotal: number;
  nonTeachingActive: number;
  nonTeachingPending: number;
  teaching?: number;
  nonTeaching?: number;
}

const STORAGE_KEYS = {
  LEARNERS:             'school_learners_data',
  TEACHERS:             STAFF_MASTER_KEY,
  TEACHERS_LEGACY:      'munyaka_staff_directory',
  TEACHERS_FALLBACK:    'munyaka_staff',
  TEACHERS_PREREG:      'munyaka_staff_prereg',
  ATTENDANCE:           'school_attendance_logs',
  ATTENDANCE_V2_PREFIX: 'munyaka_attendance_v2_',
  ACTIVE_SCHOOL_ID:     'munyaka_active_school_id',
  SCHOOL_PROFILE:       'munyaka_school_profile',
} as const;

const getTodayDate = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getActiveSchoolId = (): string | null => {
  try {
    const direct = lsRead<string>(STORAGE_KEYS.ACTIVE_SCHOOL_ID, '');
    if (direct) return direct;
    const profile = lsRead<{ schoolId?: string }>(STORAGE_KEYS.SCHOOL_PROFILE, {});
    return profile?.schoolId ?? null;
  } catch {
    return null;
  }
};

const TEACHER_KEYWORDS = /(teacher|head teacher|principal|ict|class teacher|subject teacher|senior teacher)/i;
const TEACHER_SYSTEM_ROLES = new Set([
  'subject_teacher', 'senior_teacher', 'class_teacher', 'head_teacher', 'ict_teacher', 'teacher',
]);

const NON_TEACHING_KEYWORDS = /(librarian|bursar|storekeeper|lab assistant|support staff|ict technician|admin)/i;

const isTeacherRecord = (t: Teacher): boolean => {
  if (!t) return false;
  if (t.isTeacher === true) return true;

  const systemRole = (t.systemRole || '').toLowerCase().trim();
  const role = (t.role || '').toUpperCase().trim();

  if (systemRole === 'librarian') return false;
  if (role === 'LIBRARIAN') return false;

  if (NON_TEACHING_KEYWORDS.test(t.role || '')) return false;

  if (systemRole && TEACHER_SYSTEM_ROLES.has(systemRole)) return true;
  if (TEACHER_KEYWORDS.test(t.role || '')) return true;
  return false;
};

const matchesActiveSchool = (row: { schoolId?: string }, activeSchoolId: string | null): boolean => {
  if (!activeSchoolId) return true;
  if (!row.schoolId) return true;
  return row.schoolId === activeSchoolId;
};

const isActiveRecord = (row: { isArchived?: boolean; deletedAt?: string }): boolean => {
  if (row.isArchived === true) return false;
  if (row.deletedAt) return false;
  return true;
};

const getStoredLearners = (): Learner[] => {
  try {
    const ls = getLocalStorage();
    for (const k of ['munyaka_learners_db', 'munyaka_central_db', 'school_learners_master', 'school_learners_data', 'munyaka_students', 'students', 'learners']) {
      const raw = ls?.getItem(k);
      if (raw) {
        const parsed = tryParse<Learner[]>(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
};

const getLearners = (): Learner[] => {
  return getStoredLearners();
};

const getTeachers = (): Teacher[] => {
  try {
    const master = getStaffMaster();
    if (master.length > 0) {
      return master as unknown as Teacher[];
    }
    const ls = getLocalStorage();
    const fromLS = tryParse<Teacher[]>(ls?.getItem(STORAGE_KEYS.TEACHERS_LEGACY) ?? null);
    if (Array.isArray(fromLS) && fromLS.length > 0) return fromLS;
    const fromFallback = tryParse<Teacher[]>(ls?.getItem(STORAGE_KEYS.TEACHERS_FALLBACK) ?? null);
    if (Array.isArray(fromFallback) && fromFallback.length > 0) return fromFallback;
  } catch {
    // ignore
  }
  return [];
};

const getTodayAttendanceLogs = (): AttendanceLog[] => {
  const todayStr = getTodayDate();
  const activeSchoolId = getActiveSchoolId();

  const flat = tryParse<AttendanceLog[]>(
    getLocalStorage()?.getItem(STORAGE_KEYS.ATTENDANCE) ?? null
  );
  if (Array.isArray(flat) && flat.length > 0) {
    return flat.filter((a) => {
      if (!a) return false;
      if (a.date !== todayStr) return false;
      if (!matchesActiveSchool(a, activeSchoolId)) return false;
      return a.status === 'present' || a.status === 'late';
    });
  }

  const logs: AttendanceLog[] = [];
  const ls = getLocalStorage();
  if (!ls) return logs;
  try {
    Object.keys(ls).forEach((key) => {
      if (!key?.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) return;
      try {
        const raw = ls.getItem(key);
        if (!raw) return;
        const record = tryParse<Record<string, any>>(raw);
        if (!record || typeof record !== 'object') return;
        Object.values(record).forEach((entry: any) => {
          if (!entry || typeof entry !== 'object') return;
          if (entry?.date && entry?.date !== todayStr) return;
          const morning = entry?.morning?.status ?? entry?.morning;
          const afternoon = entry?.afternoon?.status ?? entry?.afternoon;
          if (morning === 'P' || afternoon === 'P') {
            logs.push({ studentId: entry?.studentId || '', date: todayStr, status: 'present' });
          }
        });
      } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
  return logs;
};

const computeStats = (): CentralDataStats => {
  try {
    const activeSchoolId = getActiveSchoolId();
    const todayStr = getTodayDate();

    const allLearners = getStoredLearners();
    const activeLearners = allLearners.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED');
    const totalStudents = activeLearners.length > 0 ? activeLearners.length : allLearners.length;

    const categorizedMetrics = getCategorizedMetrics(activeSchoolId);
    const staffMetrics = getStaffMetrics(activeSchoolId);

    const allTeachers: Teacher[] = getTeachers();
    const teacherRecords = allTeachers.filter((t) => {
      if (!t) return false;
      if (!matchesActiveSchool(t, activeSchoolId)) return false;
      if (!isActiveRecord(t)) return false;
      return isTeacherRecord(t);
    });

    const totalTeachers = staffMetrics.total;
    const activeTeacherCount = staffMetrics.active;
    const pendingTeacherCount = staffMetrics.pending;

    const todayLogs = getTodayAttendanceLogs();
    const uniquePresentStudents = new Set(
      todayLogs.filter((l) => l.status === 'present').map((l) => l.studentId)
    ).size;

    const todayAttendanceRate = totalStudents > 0
      ? Math.min(100, Math.round((uniquePresentStudents / totalStudents) * 100))
      : 0;

    return {
      totalStudents,
      totalTeachers,
      activeTeacherCount,
      pendingTeacherCount,
      categorizedMetrics,
      todayAttendanceRate,
      isLoading: false,
    };
  } catch (err) {
    console.error('useCentralData compute error:', err);
    return {
      totalStudents: 0,
      totalTeachers: 0,
      activeTeacherCount: 0,
      pendingTeacherCount: 0,
      categorizedMetrics: undefined,
      todayAttendanceRate: 0,
      isLoading: false,
    };
  }
};

const statsEqual = (a: CentralDataStats, b: CentralDataStats): boolean => {
  if (a.totalStudents !== b.totalStudents) return false;
  if (a.totalTeachers !== b.totalTeachers) return false;
  if (a.activeTeacherCount !== b.activeTeacherCount) return false;
  if (a.pendingTeacherCount !== b.pendingTeacherCount) return false;
  if (a.todayAttendanceRate !== b.todayAttendanceRate) return false;
  if (a.isLoading !== b.isLoading) return false;

  if (a.categorizedMetrics === undefined && b.categorizedMetrics === undefined) return true;
  if (a.categorizedMetrics === undefined || b.categorizedMetrics === undefined) return false;
  const am = a.categorizedMetrics;
  const bm = b.categorizedMetrics;
  return (
    am.teachingTotal === bm.teachingTotal &&
    am.teachingActive === bm.teachingActive &&
    am.teachingPending === bm.teachingPending &&
    am.nonTeachingTotal === bm.nonTeachingTotal &&
    am.nonTeachingActive === bm.nonTeachingActive &&
    am.nonTeachingPending === bm.nonTeachingPending &&
    am.teaching === bm.teaching &&
    am.nonTeaching === bm.nonTeaching
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useCentralData = (): CentralDataStats => {
  const [stats, setStats] = useState<CentralDataStats>(() => {
    if (typeof window === 'undefined') {
      return { totalStudents: 0, totalTeachers: 0, activeTeacherCount: 0, pendingTeacherCount: 0, todayAttendanceRate: 0, isLoading: true };
    }
    return computeStats();
  });

  const refresh = useCallback(() => {
      initializeStaffMaster();
      const newStats = computeStats();
      // Use functional update to avoid depending on `stats` in the closure
      setStats((currentStats) => {
        if (!statsEqual(currentStats, newStats)) {
          return newStats;
        }
        return currentStats;
      });
    }, []);

  // Stable ref so event listeners/intervals always call the freshest refresh
  // without re-running the listener-setup effect (guard against
  // "maximum update depth exceeded" on state-dependent callback changes).
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // One-time listeners + interval, never recreated.
  useEffect(() => {
    const refreshLatest = () => refreshRef.current();

    let mounted = true;

    const onVisibility = () => {
      if (!document.hidden) refreshLatest();
    };
    const onWindowFocus = () => refreshLatest();
    const onStorageCustom = () => refreshLatest();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('storage', onStorageCustom);
    window.addEventListener('munyaka:data-changed', onStorageCustom);

    const interval = window.setInterval(refreshLatest, 5_000);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('storage', onStorageCustom);
      window.removeEventListener('munyaka:data-changed', onStorageCustom);
      window.clearInterval(interval);
    };
  }, []);

  // One-time initial refresh with a mount guard.
  useEffect(() => {
    let mounted = true;
    refreshRef.current();
    return () => {
      mounted = false;
    };
  }, []);

  return stats;
};

// ─── Exported helpers for other modules ─────────────────────────────────────

/** Call after mutating localStorage to trigger immediate recompute everywhere. */
export const notifyDataChanged = (key?: string) => {
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
  } catch { /* SSR / no window */ }
};

/** Get raw active learners array (for Central Data view details). */
export const getActiveLearners = (): Learner[] => {
  const activeSchoolId = getActiveSchoolId();
  return getLearners();
};

/** Get raw active teachers array. */
export const getActiveTeachers = (): Teacher[] => {
  const activeSchoolId = getActiveSchoolId();
  return getTeachers().filter((t) => {
    if (!t) return false;
    if (!matchesActiveSchool(t, activeSchoolId)) return false;
    if (!isActiveRecord(t)) return false;
    if (t.status && t.status !== 'Active' && t.status !== 'active') return false;
    return isTeacherRecord(t);
  });
};

export default useCentralData;