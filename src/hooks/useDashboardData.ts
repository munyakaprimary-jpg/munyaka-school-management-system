import { useState, useEffect, useCallback } from 'react';
import { INITIAL_SEED_DATA } from '../data/initialSeedData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Learner {
  id: string;
  status?: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  schoolId?: string;       // multi-school isolation
  isTeacher?: boolean;     // some flat stores use this flag for role classification
  role?: string;
  gender?: string;
}

interface Teacher {
  id: string;
  status?: string;
  name?: string;
  role?: string;
  schoolId?: string;
  isTeacher?: boolean;
  systemRole?: string;     // "subject_teacher" | "senior_teacher" | "head_teacher" | "class_teacher"
  department?: string;
}

interface AttendanceLog {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  schoolId?: string;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  isLoading: boolean;
}

// ─── Storage keys watched by this hook ────────────────────────────────────────

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

/**
 * Resolve the currently active school id from localStorage so the
 * tallies are isolated per school. Returns `null` for single-tenant
 * installs where everything is one school.
 */
const getActiveSchoolId = (): string | null => {
  try {
    const direct = localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID);
    if (direct) return direct;
    const profile = safeParse<{ schoolId?: string }>(localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE));
    return profile?.schoolId ?? null;
  } catch {
    return null;
  }
};

// ─── Teacher-role matching ───────────────────────────────────────────────────
//
// Returns true when the row should be counted as a teacher. The hook
// recognises every role label the system uses for teachers:
//   - systemRole: subject_teacher | senior_teacher | class_teacher | head_teacher | ict_teacher
//   - role text:  teacher, class teacher, senior teacher, subject teacher, head teacher, ict teacher
//   - department: 'Mathematics' / 'Languages' / 'School Administration' (school-staff signature)
//   - the explicit `isTeacher` flag (used by flat stores)
//
const TEACHER_KEYWORDS = /(teacher|head teacher|principal|ict|class teacher|subject teacher|senior teacher)/i;
const TEACHER_SYSTEM_ROLES = new Set([
  'subject_teacher',
  'senior_teacher',
  'class_teacher',
  'head_teacher',
  'ict_teacher',
  'teacher',
]);

const isTeacherRecord = (t: Teacher): boolean => {
  if (!t) return false;
  if (t.isTeacher === true) return true;
  const systemRole = (t.systemRole || '').toLowerCase().trim();
  if (systemRole && TEACHER_SYSTEM_ROLES.has(systemRole)) return true;
  if (TEACHER_KEYWORDS.test(t.role || '')) return true;
  return false;
};

// ─── School-id filter ─────────────────────────────────────────────────────────
//
// Records that DON'T carry a `schoolId` field are treated as belonging to the
// active school — that's the legacy single-school data shape — so existing
// installs keep working without migration. Multi-tenant installs where every
// row is school-stamped will be properly isolated.
const matchesActiveSchool = (row: { schoolId?: string }, activeSchoolId: string | null): boolean => {
  if (!activeSchoolId) return true;     // single-tenant → include everything
  if (!row.schoolId) return true;       // legacy row → trust the active school
  return row.schoolId === activeSchoolId;
};

// ─── Stat computation ─────────────────────────────────────────────────────────

const computeStats = (): DashboardStats => {
  try {
    const activeSchoolId = getActiveSchoolId();
    const todayStr = getTodayDate();

    // ── 1. Learners ─────────────────────────────────────────────────────────
    const learnersFromLS = safeParse<Learner[]>(localStorage.getItem(STORAGE_KEYS.LEARNERS));
    let learners: Learner[] = [];
    if (Array.isArray(learnersFromLS) && learnersFromLS.length > 0) {
      learners = learnersFromLS;
    } else if (Array.isArray(INITIAL_SEED_DATA.students) && INITIAL_SEED_DATA.students.length > 0) {
      learners = INITIAL_SEED_DATA.students as unknown as Learner[];
    }

    const totalStudents = learners.filter((l) => {
      if (!l) return false;
      if (!matchesActiveSchool(l, activeSchoolId)) return false;
      if (l.status) return l.status === 'Active' || l.status === 'active';
      return true;
    }).length;

    // ── 2. Teachers ─────────────────────────────────────────────────────────
    let teachers: Teacher[] = [];
    const teachersFromLS = safeParse<Teacher[]>(localStorage.getItem(STORAGE_KEYS.TEACHERS));
    if (Array.isArray(teachersFromLS) && teachersFromLS.length > 0) {
      teachers = teachersFromLS;
    } else {
      const teachersFromFallback = safeParse<Teacher[]>(localStorage.getItem(STORAGE_KEYS.TEACHERS_FALLBACK));
      if (Array.isArray(teachersFromFallback) && teachersFromFallback.length > 0) {
        teachers = teachersFromFallback;
      } else if (Array.isArray(INITIAL_SEED_DATA.staff) && INITIAL_SEED_DATA.staff.length > 0) {
        teachers = INITIAL_SEED_DATA.staff as unknown as Teacher[];
      }
    }

    const totalTeachers = teachers.filter((t) => {
      if (!t) return false;
      if (!matchesActiveSchool(t, activeSchoolId)) return false;
      if (t.status && t.status !== 'Active' && t.status !== 'active') return false;
      return isTeacherRecord(t);
    }).length;

    // ── 3. Today's attendance % ─────────────────────────────────────────────
    // Reads the modern flat attendance log first, then walks the per-grade
    // v2 records (`munyaka_attendance_v2_<gradeId>`) and counts each P-marked
    // student against totalStudents.
    const flatAttendance = safeParse<AttendanceLog[]>(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) ?? [];
    let presentToday = 0;

    if (Array.isArray(flatAttendance) && flatAttendance.length > 0) {
      presentToday = flatAttendance.filter((a) => {
        if (!a) return false;
        if (a.date !== todayStr) return false;
        if (!matchesActiveSchool(a, activeSchoolId)) return false;
        return a.status === 'present' || a.status === 'late';
      }).length;
    } else {
      // Walk all v2 per-grade registers
      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) return;
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const record = safeParse<Record<string, any>>(raw);
          if (!record) return;
          Object.values(record).forEach((entry: any) => {
            if (!entry || typeof entry !== 'object') return;
            // entry may carry its own date; if so, only count today's
            if (entry.date && entry.date !== todayStr) return;
            const morning = entry.morning?.status || entry.morning;
            const afternoon = entry.afternoon?.status || entry.afternoon;
            if (morning === 'P' || afternoon === 'P') presentToday += 1;
          });
        } catch { /* ignore individual records */ }
      });
    }

    const todayAttendanceRate = totalStudents > 0
      ? Math.round((presentToday / totalStudents) * 100)
      : 0;

    return {
      totalStudents,
      totalTeachers,
      todayAttendanceRate,
      isLoading: false,
    };
  } catch (err) {
    console.error('useDashboardData compute error:', err);

    let fallbackStudents = 0;
    let fallbackTeachers = 0;
    try {
      if (Array.isArray(INITIAL_SEED_DATA.students)) fallbackStudents = INITIAL_SEED_DATA.students.length;
      if (Array.isArray(INITIAL_SEED_DATA.staff))    fallbackTeachers  = INITIAL_SEED_DATA.staff.length;
    } catch { /* ignore */ }

    return {
      totalStudents: fallbackStudents,
      totalTeachers: fallbackTeachers,
      todayAttendanceRate: 0,
      isLoading: false,
    };
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDashboardData = (): DashboardStats => {
  // Synchronous initial compute from localStorage / seed data
  const [stats, setStats] = useState<DashboardStats>(() => {
    if (typeof window === 'undefined') {
      return { totalStudents: 0, totalTeachers: 0, todayAttendanceRate: 0, isLoading: true };
    }
    return computeStats();
  });

  // Stable recompute handle
  const refresh = useCallback(() => {
    setStats(computeStats());
  }, []);

  // ── Re-compute on mount + visibility changes + every 30s while focused ────
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

  // ── Real-time sync via the storage event ───────────────────────────────────
  // Fires when a DIFFERENT tab/window modifies any of the watched keys.
  // For same-tab updates we expose a CustomEvent below.
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

  // ── Same-tab sync via custom event ─────────────────────────────────────────
  // Modules that mutate the data (Students, Staff, Attendance) dispatch
  // `munyaka:data-changed` after writing to localStorage so this hook
  // recomputes immediately rather than waiting for the cross-tab storage event.
  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // If a specific key changed, only refresh when relevant
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

/**
 * Helper exported for other modules: call after a mutation to localStorage
 * so every mounted `useDashboardData` consumer re-aggregates immediately.
 *
 *   localStorage.setItem('school_learners_data', JSON.stringify(updated));
 *   notifyDataChanged('school_learners_data');
 */
export const notifyDataChanged = (key?: string) => {
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key } }));
  } catch { /* SSR / no window */ }
};

export default useDashboardData;