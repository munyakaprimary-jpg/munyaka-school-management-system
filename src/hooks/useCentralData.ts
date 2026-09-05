// ─────────────────────────────────────────────────────────────────────────────
// Unified Central Data Hook — single source of truth for students, staff, attendance
// ─────────────────────────────────────────────────────────────────────────────
// Both Dashboard Overview and Central Data Service MUST use this hook to ensure
// identical counts and real-time sync across views.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_SEED_DATA } from '../data/initialSeedData';
import { lsSet, notifyDataChanged as fireDataChanged, lsRead } from '@/utils/storage';
import { getLocalStorage } from '@/utils/storageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  /**
   * Sub-count of teachers whose status is "Active" / "Verified".
   * Optional because not every consumer needs it; when absent
   * the consumer should treat `totalTeachers` as the canonical count.
   */
  activeTeacherCount?: number;
  todayAttendanceRate: number;
  isLoading: boolean;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  LEARNERS:             'school_learners_data',
  TEACHERS:             'munyaka_staff_directory',
  TEACHERS_FALLBACK:    'munyaka_staff',
  ATTENDANCE:           'school_attendance_logs',
  ATTENDANCE_V2_PREFIX: 'munyaka_attendance_v2_',
  ACTIVE_SCHOOL_ID:     'munyaka_active_school_id',
  SCHOOL_PROFILE:       'munyaka_school_profile',
} as const;

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

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

// ─── Teacher-role matching ───────────────────────────────────────────────────

const TEACHER_KEYWORDS = /(teacher|head teacher|principal|ict|class teacher|subject teacher|senior teacher)/i;
const TEACHER_SYSTEM_ROLES = new Set([
  'subject_teacher', 'senior_teacher', 'class_teacher', 'head_teacher', 'ict_teacher', 'teacher',
]);

const isTeacherRecord = (t: Teacher): boolean => {
  if (!t) return false;
  if (t.isTeacher === true) return true;
  const systemRole = (t.systemRole || '').toLowerCase().trim();
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

// ─── Core data selectors (memoized) ───────────────────────────────────────────

const getLearners = (): Learner[] => {
  const fromLS = safeParse<Learner[]>(localStorage?.getItem(STORAGE_KEYS.LEARNERS) ?? null);
  if (Array.isArray(fromLS) && fromLS.length > 0) return fromLS;
  const seedStudents = INITIAL_SEED_DATA?.students;
  if (Array.isArray(seedStudents) && seedStudents.length > 0) {
    return seedStudents as unknown as Learner[];
  }
  return [];
};

const getTeachers = (): Teacher[] => {
  const fromLS = safeParse<Teacher[]>(localStorage?.getItem(STORAGE_KEYS.TEACHERS) ?? null);
  if (Array.isArray(fromLS) && fromLS.length > 0) return fromLS;
  const fromFallback = safeParse<Teacher[]>(localStorage?.getItem(STORAGE_KEYS.TEACHERS_FALLBACK) ?? null);
  if (Array.isArray(fromFallback) && fromFallback.length > 0) return fromFallback;
  const seedStaff = INITIAL_SEED_DATA?.staff;
  if (Array.isArray(seedStaff) && seedStaff.length > 0) {
    return seedStaff as unknown as Teacher[];
  }
  return [];
};

const getTodayAttendanceLogs = (): AttendanceLog[] => {
  const todayStr = getTodayDate();
  const activeSchoolId = getActiveSchoolId();

  // 1. Flat attendance log
  const flat = safeParse<AttendanceLog[]>(
    getLocalStorage()?.getItem(STORAGE_KEYS.ATTENDANCE) ?? null,
    []
  );
  if (Array.isArray(flat) && flat.length > 0) {
    return flat.filter((a) => {
      if (!a) return false;
      if (a.date !== todayStr) return false;
      if (!matchesActiveSchool(a, activeSchoolId)) return false;
      return a.status === 'present' || a.status === 'late';
    });
  }

  // 2. Per-grade v2 registers
  const logs: AttendanceLog[] = [];
  const ls = getLocalStorage();
  if (!ls) return logs;
  try {
    Object.keys(ls).forEach((key) => {
      if (!key?.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) return;
      try {
        const raw = ls.getItem(key);
        if (!raw) return;
        const record = safeParse<Record<string, any>>(raw, null);
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

// ─── Computation ──────────────────────────────────────────────────────────────

const computeStats = (): CentralDataStats => {
  try {
    const activeSchoolId = getActiveSchoolId();
    const todayStr = getTodayDate();

    // ── Learners ──
    const allLearners = getLearners();
    const activeLearners = allLearners.filter((l) => {
      if (!l) return false;
      if (!matchesActiveSchool(l, activeSchoolId)) return false;
      if (!isActiveRecord(l)) return false;
      if (l.status) return l.status === 'Active' || l.status === 'active';
      return true;
    });
    const totalStudents = activeLearners.length;

    // ── Teachers ──
    const allTeachers = getTeachers();
    // Track BOTH totals separately so callers can distinguish:
    //   - totalTeachers       → every teacher-classified record (active + pending)
    //   - activeTeacherCount  → only Active status rows
    // The dashboard "Registered Teachers" card shows the total, while
    // an "Active" badge can show the active sub-count.
    //
    // The server now returns a `status` field ('Active' | 'Pre-Registered')
    // derived from `is_active`. Use it directly instead of inferring
    // from the integer column. Fall back to the legacy is_active
    // boolean for locally-created records that haven't been synced.
    const allTeacherRecords = allTeachers.filter((t) => {
      if (!t) return false;
      if (!matchesActiveSchool(t, activeSchoolId)) return false;
      if (!isActiveRecord(t)) return false;
      return isTeacherRecord(t);
    });
    const totalTeachers = allTeacherRecords.length;
    const activeTeacherCount = allTeacherRecords.filter((t) => {
      const status = String(t?.status || '').toLowerCase();
      if (status) {
        // Server returns 'Active' or 'Pre-Registered' — use it directly
        return status === 'active';
      }
      // Legacy local record: fall back to is_active boolean
      const flag = t?.is_active;
      return flag !== 0 && flag !== false && flag !== '0';
    }).length;

    // ── Today's attendance — deduplicated by studentId ──
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
      todayAttendanceRate,
      isLoading: false,
    };
  } catch (err) {
    console.error('useCentralData compute error:', err);
    let fallbackStudents = 0;
    let fallbackTeachers = 0;
    try {
      if (Array.isArray(INITIAL_SEED_DATA?.students)) fallbackStudents = INITIAL_SEED_DATA.students.length;
      if (Array.isArray(INITIAL_SEED_DATA?.staff))    fallbackTeachers  = INITIAL_SEED_DATA?.staff?.length ?? 0;
    } catch { /* ignore */ }
    return {
      totalStudents: fallbackStudents,
      totalTeachers: fallbackTeachers,
      activeTeacherCount: fallbackTeachers,
      todayAttendanceRate: 0,
      isLoading: false,
    };
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCentralData = (): CentralDataStats => {
  const [stats, setStats] = useState<CentralDataStats>(() => {
    if (typeof window === 'undefined') {
      return { totalStudents: 0, totalTeachers: 0, activeTeacherCount: 0, todayAttendanceRate: 0, isLoading: true };
    }
    return computeStats();
  });

  const refresh = useCallback(() => {
    setStats(computeStats());
  }, []);

  // Mount + visibility + 30s polling
  useEffect(() => {
    refresh();
    const onVisibility = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [refresh]);

  // Cross-tab storage events
  useEffect(() => {
    const watchedKeys = [
      STORAGE_KEYS.LEARNERS,
      STORAGE_KEYS.TEACHERS,
      STORAGE_KEYS.TEACHERS_FALLBACK,
      STORAGE_KEYS.ATTENDANCE,
      STORAGE_KEYS.ACTIVE_SCHOOL_ID,
      STORAGE_KEYS.SCHOOL_PROFILE,
    ];
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (watchedKeys.includes(e.key as any) || e.key.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  // Same-tab custom events
  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key) {
        const watched = [
          STORAGE_KEYS.LEARNERS,
          STORAGE_KEYS.TEACHERS,
          STORAGE_KEYS.TEACHERS_FALLBACK,
          STORAGE_KEYS.ATTENDANCE,
          STORAGE_KEYS.ACTIVE_SCHOOL_ID,
          STORAGE_KEYS.SCHOOL_PROFILE,
        ];
        if (!watched.includes(detail.key) && !detail.key.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) {
          return;
        }
      }
      refresh();
    };
    window.addEventListener('munyaka:data-changed', onChanged as EventListener);
    return () => window.removeEventListener('munyaka:data-changed', onChanged as EventListener);
  }, [refresh]);

  return stats;
};

// ─── Exported helpers for other modules ───────────────────────────────────────

/** Call after mutating localStorage to trigger immediate recompute everywhere. */
export const notifyDataChanged = (key?: string) => {
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
  } catch { /* SSR / no window */ }
};

/** Get raw active learners array (for Central Data view details). */
export const getActiveLearners = (): Learner[] => {
  const activeSchoolId = getActiveSchoolId();
  return getLearners().filter((l) => {
    if (!l) return false;
    if (!matchesActiveSchool(l, activeSchoolId)) return false;
    if (!isActiveRecord(l)) return false;
    if (l.status) return l.status === 'Active' || l.status === 'active';
    return true;
  });
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