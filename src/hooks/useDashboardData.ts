import { useState, useEffect, useCallback } from 'react';
import { getLocalStorage, tryParse } from '@/utils/storageUtils';
import { centralGetStaff } from '@/hooks/useCentralData';
const STAFF_MASTER_KEY = 'munyaka_staff_v2';

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
  TEACHERS:             STAFF_MASTER_KEY,          // single source of truth
  TEACHERS_LEGACY:      'munyaka_staff_directory',  // legacy, still written by mutations
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

/**
 * Resolve the currently active school id from localStorage so the
 * tallies are isolated per school. Returns `null` for single-tenant
 * installs where everything is one school.
 */
const getActiveSchoolId = (): string | null => {
  try {
    const ls = getLocalStorage();
    const direct = ls?.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID) ?? null;
    if (direct) return direct;
    const profileRaw = ls?.getItem(STORAGE_KEYS.SCHOOL_PROFILE) ?? null;
    const profile = tryParse<{ schoolId?: string }>(profileRaw);
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
    const lsForRead = getLocalStorage();
    const learnersFromLS = tryParse<Learner[]>(lsForRead?.getItem(STORAGE_KEYS.LEARNERS) ?? null);
    // Pure localStorage read — no seed fallback. Empty array = zero learners.
    const learners: Learner[] = Array.isArray(learnersFromLS) ? learnersFromLS : [];

    const totalStudents = learners.filter((l) => {
      if (!l) return false;
      if (!matchesActiveSchool(l, activeSchoolId)) return false;
      if (l.status) return l.status === 'Active' || l.status === 'active';
      return true;
    }).length;

    // ── 2. Teachers ─────────────────────────────────────────────────────────
        // Read from the single master ledger — no more merging pre-reg + directory
        // since the master already contains all staff in one place.
        const master = centralGetStaff();
        const teachers: Teacher[] = master as unknown as Teacher[];

    const totalTeachers = teachers.filter((t) => {
      if (!t) return false;
      if (!matchesActiveSchool(t, activeSchoolId)) return false;
      // Count every teacher-classified record regardless of status.
      // The previous version dropped records whose status was not
      // exactly "Active" (e.g. missing, "Pending", "Verified"), which
      // caused the dashboard to show 1 instead of 7. The dashboard
      // should reflect the full registered roster.
      return isTeacherRecord(t);
    }).length;

    // ── 3. Today's attendance % — deduplicated by studentId, capped at 100% ─
    const flatAttendance = tryParse<AttendanceLog[]>(lsForRead?.getItem(STORAGE_KEYS.ATTENDANCE) ?? null) ?? [];
    const presentStudentIds = new Set<string>();
    const ls = getLocalStorage();

    if (Array.isArray(flatAttendance) && flatAttendance.length > 0) {
      flatAttendance.forEach((a) => {
        if (!a) return;
        if (a.date !== todayStr) return;
        if (!matchesActiveSchool(a, activeSchoolId)) return;
        if (a.status === 'present' || a.status === 'late') {
          if (a.studentId) presentStudentIds.add(a.studentId);
        }
      });
    } else if (ls) {
      // Walk all v2 per-grade registers
      try {
        Object.keys(ls).forEach((key) => {
          if (!key?.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) return;
          try {
            const raw = ls.getItem(key);
            if (!raw) return;
            // Parse the raw string directly (avoid re-keying safeParse)
            const record = JSON.parse(raw) as Record<string, any> | null;
            if (!record || typeof record !== 'object') return;
            Object.values(record).forEach((entry: any) => {
              if (!entry || typeof entry !== 'object') return;
              if (entry?.date && entry?.date !== todayStr) return;
              const morning = entry?.morning?.status || entry?.morning;
              const afternoon = entry?.afternoon?.status || entry?.afternoon;
              if (morning === 'P' || afternoon === 'P') {
                if (entry?.studentId) presentStudentIds.add(entry.studentId);
              }
            });
          } catch { /* ignore individual records */ }
        });
      } catch { /* ignore outer loop */ }
    }

    // Deduplicated count — each student counted at most once
    const uniquePresentStudents = presentStudentIds.size;

    // Capped at 100% — prevents over-100% when presentToday > totalStudents
    const todayAttendanceRate = totalStudents > 0
      ? Math.min(100, Math.round((uniquePresentStudents / totalStudents) * 100))
      : 0;

    return {
      totalStudents,
      totalTeachers,
      todayAttendanceRate,
      isLoading: false,
    };
  } catch (err) {
    console.error('useDashboardData compute error:', err);
    // On error, return zero counts — never fall back to seed data.
    return {
      totalStudents: 0,
      totalTeachers: 0,
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
          STORAGE_KEYS.TEACHERS,          // munyaka_staff_master (primary)
          STORAGE_KEYS.TEACHERS_LEGACY,   // munyaka_staff_directory (legacy, still written)
          STORAGE_KEYS.TEACHERS_FALLBACK,
          STORAGE_KEYS.TEACHERS_PREREG,
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
                  STORAGE_KEYS.TEACHERS_LEGACY,
                  STORAGE_KEYS.TEACHERS_FALLBACK,
                  STORAGE_KEYS.TEACHERS_PREREG,
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