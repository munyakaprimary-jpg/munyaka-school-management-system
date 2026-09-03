/**
 * useTeacherRoster — single source of truth for the Teacher/Admin Dashboard
 * roster & roll-call view.
 *
 * Wires the "Filters & Roster" component (now part of the Teacher Dashboard)
 * to live learner data + today's attendance records from localStorage. Every
 * counter in the menu is computed from the same dataset the Students page
 * uses, so all admin views agree.
 *
 * Storage sources consulted:
 *   - school_learners_data                 → learner roster (status, grade, stream, admNo)
 *   - school_attendance_logs               → flat per-day attendance log
 *   - munyaka_attendance_records           → nested per-class records
 *   - munyaka_attendance_v2_<grade>_<stream> → per-class v2 registers
 *
 * The hook recomputes whenever any of those keys change, when the tab is
 * refocused, and on a 30-second polling interval while focused.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import {
  type AttendanceStatus,
  type LearnerMenuFilter,
  type LearnerMenuItem,
} from '@/types/learnerMenu';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  LEARNERS: 'school_learners_data',
  ATTENDANCE: 'school_attendance_logs',
  ATTENDANCE_V2_PREFIX: 'munyaka_attendance_v2_',
  ATTENDANCE_V1_OBJECT: 'munyaka_attendance_records',
  ACTIVE_SCHOOL_ID: 'munyaka_active_school_id',
  SCHOOL_PROFILE: 'munyaka_school_profile',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const getTodayDate = (): string => {
  const t = new Date();
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, '0');
  const dd = String(t.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getActiveSchoolId = (): string | null => {
  try {
    const direct = localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID);
    if (direct) return direct;
    const profile = safeParse<{ schoolId?: string }>(
      localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE)
    );
    return profile?.schoolId ?? null;
  } catch {
    return null;
  }
};

const matchesActiveSchool = (
  row: { schoolId?: string },
  activeSchoolId: string | null
): boolean => {
  if (!activeSchoolId) return true;
  if (!row.schoolId) return true;
  return row.schoolId === activeSchoolId;
};

// ─── Internal types ──────────────────────────────────────────────────────────

interface RawLearner {
  id: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  status?: string;
  schoolId?: string;
  gender?: string;
  attendanceStatus?: AttendanceStatus;
  avatarUrl?: string | null;
  guardian?: string;
  phone?: string;
  birthCertificateNo?: string;
}

interface RawAttendanceLog {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  schoolId?: string;
}

interface V2AttendanceEntry {
  date?: string;
  studentId?: string;
  morning?: { status?: string } | string;
  afternoon?: { status?: string } | string;
}

export interface TeacherRosterCounts {
  totalEnrolled: number;
  active: number;
  present: number;
  absent: number;
  suspended: number;
  unmarked: number;
  late: number;
}

export interface TeacherRosterData {
  /** All learners (Active + Suspended + Graduated) so counts are accurate. */
  learners: LearnerMenuItem[];
  /** Filter / navigation list for the menu. */
  filters: LearnerMenuFilter[];
  /** Currently selected filter id. */
  activeFilterId: string;
  /** Convenience aggregate — already baked into the filter counts. */
  counts: TeacherRosterCounts;
  /** Today's date in YYYY-MM-DD form. */
  todayDate: string;
  /** Loading flag (true only on the very first compute on SSR). */
  isLoading: boolean;
  /** Optional error message (only set if a fatal parse error happens). */
  error: string | null;
}

// ─── Data loaders ────────────────────────────────────────────────────────────

const loadLearners = (): RawLearner[] => {
  const fromLS = safeParse<RawLearner[]>(
    localStorage.getItem(STORAGE_KEYS.LEARNERS)
  );
  if (Array.isArray(fromLS) && fromLS.length > 0) return fromLS;
  if (Array.isArray(INITIAL_SEED_DATA.students)) {
    return INITIAL_SEED_DATA.students as unknown as RawLearner[];
  }
  return [];
};

const loadAttendanceStatusByStudent = (
  today: string,
  activeSchoolId: string | null
): Map<string, AttendanceStatus> => {
  const map = new Map<string, AttendanceStatus>();

  // Source 1: flat school_attendance_logs
  const flat = safeParse<RawAttendanceLog[]>(
    localStorage.getItem(STORAGE_KEYS.ATTENDANCE)
  );
  if (Array.isArray(flat) && flat.length > 0) {
    for (const log of flat) {
      if (!log || log.date !== today) continue;
      if (!matchesActiveSchool(log, activeSchoolId)) continue;
      if (!log.studentId) continue;
      const status: AttendanceStatus =
        log.status === 'present' || log.status === 'late'
          ? log.status === 'late'
            ? 'Late'
            : 'Present'
          : log.status === 'absent'
            ? 'Absent'
            : 'Unmarked';
      map.set(log.studentId, status);
    }
    return map;
  }

  // Source 2: per-class v2 keys (munyaka_attendance_v2_*)
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const record = safeParse<Record<string, V2AttendanceEntry>>(raw);
    if (!record) continue;
    for (const entry of Object.values(record)) {
      if (!entry || entry.date !== today || !entry.studentId) continue;
      const morning = entry.morning;
      const afternoon = entry.afternoon;
      const mStatus = typeof morning === 'string' ? morning : morning?.status;
      const aStatus =
        typeof afternoon === 'string' ? afternoon : afternoon?.status;
      let status: AttendanceStatus = 'Unmarked';
      if (mStatus === 'P' || aStatus === 'P') status = 'Present';
      else if (mStatus === 'L' || aStatus === 'L') status = 'Late';
      else if (mStatus === 'A' || aStatus === 'A') status = 'Absent';
      map.set(entry.studentId, status);
    }
  }

  // Source 3: nested munyaka_attendance_records (legacy)
  const legacy = safeParse<Record<string, V2AttendanceEntry>>(
    localStorage.getItem(STORAGE_KEYS.ATTENDANCE_V1_OBJECT)
  );
  if (legacy && typeof legacy === 'object') {
    for (const entry of Object.values(legacy)) {
      if (!entry || entry.date !== today || !entry.studentId) continue;
      const morning = entry.morning;
      const afternoon = entry.afternoon;
      const mStatus = typeof morning === 'string' ? morning : morning?.status;
      const aStatus =
        typeof afternoon === 'string' ? afternoon : afternoon?.status;
      const existing = map.get(entry.studentId);
      // Don't downgrade a more specific status from a later source.
      if (existing && existing !== 'Unmarked') continue;
      let status: AttendanceStatus = 'Unmarked';
      if (mStatus === 'P' || aStatus === 'P') status = 'Present';
      else if (mStatus === 'L' || aStatus === 'L') status = 'Late';
      else if (mStatus === 'A' || aStatus === 'A') status = 'Absent';
      map.set(entry.studentId, status);
    }
  }

  return map;
};

// ─── Filter builder ──────────────────────────────────────────────────────────

const buildFilters = (
  counts: TeacherRosterCounts,
  activeFilterId: string
): LearnerMenuFilter[] => [
  {
    id: 'all',
    label: 'All Learners',
    count: counts.totalEnrolled,
    icon: UsersIcon,
    isActive: activeFilterId === 'all',
    accent: 'indigo',
    hint: 'Total enrolled',
  },
  {
    id: 'active',
    label: 'Active Roster',
    count: counts.active,
    icon: UserCheckIcon,
    isActive: activeFilterId === 'active',
    accent: 'emerald',
    hint: 'On the active list',
  },
  {
    id: 'present',
    label: 'Present Today',
    count: counts.present,
    icon: UserCheckIcon,
    isActive: activeFilterId === 'present',
    accent: 'emerald',
    hint: 'Checked in for roll call',
  },
  {
    id: 'absent',
    label: 'Absent Today',
    count: counts.absent,
    icon: UserMinusIcon,
    isActive: activeFilterId === 'absent',
    accent: 'rose',
    hint: 'Need follow-up',
  },
  {
    id: 'suspended',
    label: 'Suspended',
    count: counts.suspended,
    icon: UserCogIcon,
    isActive: activeFilterId === 'suspended',
    accent: 'amber',
    hint: 'Temporarily off roster',
  },
];

// Inline icon stubs so this file doesn't import from lucide-react (keeping
// the data layer decoupled from UI). The component swaps in real Lucide
// icons when rendering — the `icon` field is just a component reference.
const UsersIcon = () => null;
const UserCheckIcon = () => null;
const UserMinusIcon = () => null;
const UserCogIcon = () => null;

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseTeacherRosterOptions {
  /**
   * Initial filter selection. Defaults to `'all'`.
   */
  initialFilterId?: string;
}

export interface UseTeacherRosterResult extends TeacherRosterData {
  setActiveFilterId: (id: string) => void;
  refresh: () => void;
}

export const useTeacherRoster = (
  options: UseTeacherRosterOptions = {}
): UseTeacherRosterResult => {
  const { initialFilterId = 'all' } = options;

  const [activeFilterId, setActiveFilterId] = useState(initialFilterId);
  const [dataVersion, setDataVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(
    typeof window === 'undefined'
  );

  const refresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  // ── Cross-tab + same-tab storage sync ────────────────────────────────────
  useEffect(() => {
    const watchedKeys = [
      STORAGE_KEYS.LEARNERS,
      STORAGE_KEYS.ATTENDANCE,
      STORAGE_KEYS.ACTIVE_SCHOOL_ID,
      STORAGE_KEYS.SCHOOL_PROFILE,
    ];

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        watchedKeys.includes(e.key as any) ||
        e.key.startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)
      ) {
        refresh();
      }
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key) {
        if (
          !watchedKeys.includes(detail.key) &&
          !String(detail.key).startsWith(STORAGE_KEYS.ATTENDANCE_V2_PREFIX)
        ) {
          return;
        }
      }
      refresh();
    };

    const onActivity = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener(
      'munyaka:data-changed',
      onCustom as EventListener
    );
    window.addEventListener(
      'munyaka:activity-log-changed',
      onActivity
    );

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(
        'munyaka:data-changed',
        onCustom as EventListener
      );
      window.removeEventListener(
        'munyaka:activity-log-changed',
        onActivity
      );
    };
  }, [refresh]);

  // ── Visibility + polling ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    const interval = window.setInterval(refresh, 30_000);
    setIsLoading(false);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(interval);
    };
  }, [refresh]);

  // ── Compute derived data ────────────────────────────────────────────────
  const { learners, counts, todayDate, error } = useMemo(() => {
    try {
      const today = getTodayDate();
      const activeSchoolId = getActiveSchoolId();
      const rawLearners = loadLearners();
      const attendanceMap = loadAttendanceStatusByStudent(
        today,
        activeSchoolId
      );

      // Apply school-tenant + active filtering, but keep Suspended/Graduated
      // so they can be counted in their own buckets.
      const inScope = rawLearners.filter((l) => {
        if (!l) return false;
        if (!matchesActiveSchool(l, activeSchoolId)) return false;
        // Hide transferred (they live in the archive)
        if (l.status === 'TRANSFERRED') return false;
        return true;
      });

      const menuLearners: LearnerMenuItem[] = inScope.map((l) => {
        const attendanceFromLog = attendanceMap.get(l.id);
        const attendanceStatus: AttendanceStatus =
          attendanceFromLog ?? l.attendanceStatus ?? 'Unmarked';
        return {
          id: l.id,
          admNo: l.admNo ?? '',
          fullName: l.name ?? '—',
          grade: l.grade ?? '',
          stream: l.stream ?? '',
          status: (l.status as LearnerMenuItem['status']) ?? 'Active',
          attendanceStatus,
          avatarUrl: l.avatarUrl ?? null,
          guardian: l.guardian,
          phone: l.phone,
          birthCertificateNo: l.birthCertificateNo,
        };
      });

      const c: TeacherRosterCounts = {
        totalEnrolled: menuLearners.length,
        active: menuLearners.filter((l) => l.status === 'Active').length,
        present: menuLearners.filter(
          (l) =>
            l.attendanceStatus === 'Present' ||
            l.attendanceStatus === 'Late'
        ).length,
        late: menuLearners.filter((l) => l.attendanceStatus === 'Late')
          .length,
        absent: menuLearners.filter((l) => l.attendanceStatus === 'Absent')
          .length,
        suspended: menuLearners.filter((l) => l.status === 'Suspended')
          .length,
        unmarked: menuLearners.filter(
          (l) => l.attendanceStatus === 'Unmarked'
        ).length,
      };

      return {
        learners: menuLearners,
        counts: c,
        todayDate: today,
        error: null,
      };
    } catch (err) {
      console.error('useTeacherRoster compute error:', err);
      return {
        learners: [] as LearnerMenuItem[],
        counts: {
          totalEnrolled: 0,
          active: 0,
          present: 0,
          absent: 0,
          suspended: 0,
          unmarked: 0,
          late: 0,
        } as TeacherRosterCounts,
        todayDate: getTodayDate(),
        error:
          err instanceof Error
            ? err.message
            : 'Failed to compute roster data',
      };
    }
  }, [dataVersion]);

  // ── Apply active filter to the embedded learner preview list ────────────
  const filteredLearners = useMemo(() => {
    switch (activeFilterId) {
      case 'active':
        return learners.filter((l) => l.status === 'Active');
      case 'present':
        return learners.filter(
          (l) =>
            l.attendanceStatus === 'Present' ||
            l.attendanceStatus === 'Late'
        );
      case 'absent':
        return learners.filter((l) => l.attendanceStatus === 'Absent');
      case 'suspended':
        return learners.filter((l) => l.status === 'Suspended');
      case 'all':
      default:
        return learners;
    }
  }, [learners, activeFilterId]);

  const filters = useMemo(
    () => buildFilters(counts, activeFilterId),
    [counts, activeFilterId]
  );

  return {
    learners: filteredLearners,
    filters,
    activeFilterId,
    counts,
    todayDate,
    isLoading,
    error,
    setActiveFilterId,
    refresh,
  };
};

export default useTeacherRoster;
