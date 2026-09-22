"use client";

/**
 * useLiveStreamAttendance
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides live, reactive stream-level attendance summaries for the
 * Administrator Oversight view. Reads from:
 *
 *   1. school_learners_data   — active student records (hydrateAllStores seed)
 *   2. munyaka_attendance_v2_ — per-grade/stream/date session registers
 *   3. munyaka_attendance_records — master record map
 *
 * The hook recomputes whenever localStorage changes (save, edit, delete)
 * so the oversight dashboard and all summary cards stay in sync with the
 * active attendance session without requiring a page reload.
 *
 * Storage key format:
 *   munyaka_attendance_v2_{grade}_{stream}_{date}
 *   e.g.  munyaka_attendance_v2_Grade 6_YELLOW_2026-08-28
 *
 * Register entry format:
 *   { session, class, stream, date, savedAt, [studentId]: status }
 *   where status = 'P' | 'A' | 'L' | 'E'
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getLocalStorage, tryParse } from '@/utils/storageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamAttendanceRecord {
  grade: string;       // e.g. "Grade 6"
  stream: string;       // e.g. "Yellow"
  totalLearners: number;
  morningCompleted: boolean;
  afternoonCompleted: boolean;
  morningPresent: number;
  afternoonPresent: number;
  rate: number;        // combined morning+afternoon present %
  learners: Array<{ id: string; name: string }>;
}

interface LiveRegisterEntry {
  session?: string;
  class?: string;
  stream?: string;
  date?: string;
  savedAt?: string;
  [studentId: string]: string | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ATTENDANCE_V2_PREFIX = 'munyaka_attendance_v2_';
const ATTENDANCE_RECORDS_KEY = 'munyaka_attendance_records';
const STUDENTS_KEY = 'school_learners_data';

const normalizeStream = (s: string): string =>
  String(s || '').trim().toLowerCase().replace(/\s+/g, '');

const streamMatchesFilter = (registerStream: string, filterStream: string): boolean => {
  if (filterStream === 'all') return true;
  return normalizeStream(registerStream) === normalizeStream(filterStream);
};

/**
 * Build the localStorage key used by the attendance v2 registers.
 * grade and stream are written as-is (with spaces), underscores removed from key.
 */
const buildV2Key = (grade: string, stream: string, date: string): string => {
  return `${ATTENDANCE_V2_PREFIX}${grade}_${stream}_${date}`;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns an array of StreamAttendanceRecord, one per unique grade+stream
 * combination found in the active students list. Each record includes
 * real-time morning/afternoon completion and present counts from localStorage.
 *
 * @param selectedDate  The date string (YYYY-MM-DD) to look up registers for.
 * @param filterGrade  'all' or a specific grade name (e.g. 'Grade 6').
 * @param filterStream 'all' or a specific stream name (e.g. 'YELLOW').
 * @param searchTerm   Free-text search (matches grade or stream name).
 */
export const useLiveStreamAttendance = (
  selectedDate: string,
  filterGrade: string,
  filterStream: string,
  searchTerm: string,
): {
  streams: StreamAttendanceRecord[];
  totalLearners: number;
  streamsTotal: number;
  morningCompletedStreams: number;
  afternoonCompletedStreams: number;
  fullyCompletedStreams: number;
  averageRate: number;
} => {
  const [rawStreams, setRawStreams] = useState<StreamAttendanceRecord[]>([]);

  const recompute = useCallback(() => {
    try {
      const ls = getLocalStorage();
      if (!ls) {
        setRawStreams([]);
        return;
      }

      // ── 1. Load active students ──────────────────────────────────────────────
      const studentsRaw = ls.getItem(STUDENTS_KEY);
      const students = tryParse<Array<{
        id: string;
        name?: string;
        grade?: string;
        stream?: string;
        status?: string;
        schoolId?: string;
      }>>(studentsRaw);

      if (!Array.isArray(students) || students.length === 0) {
        // Fallback: check localStorage keys for any classes/streams configured in students data or registration
        setRawStreams([]);
        return;
      }

      // Filter to active students only (or fall back if status field is missing / lenient)
      const active = students.filter((s) => {
        if (!s) return false;
        if (s.status && s.status !== 'Active' && s.status !== 'active') return false;
        return true;
      });

      const studentPool = active.length > 0 ? active : students;

      // ── 2. Group by grade + stream ───────────────────────────────────────────
      const gradeStreamMap = new Map<string, {
        grade: string;
        stream: string;
        studentIds: Set<string>;
        learners: Array<{ id: string; name: string }>;
      }>();

      for (const s of studentPool) {
        const grade = (s.grade || '').trim();
        const stream = (s.stream || '').trim();
        if (!grade || !stream) continue;

        const key = `${grade}::${stream}`;
        if (!gradeStreamMap.has(key)) {
          gradeStreamMap.set(key, { grade, stream, studentIds: new Set(), learners: [] });
        }
        const entry = gradeStreamMap.get(key)!;
        entry.studentIds.add(s.id);
        entry.learners.push({
          id: s.id,
          name: s.name || 'Unnamed Learner',
        });
      }

      // Sort learners alphabetically by name for each stream
      for (const [, data] of gradeStreamMap) {
        data.learners.sort((a, b) => a.name.localeCompare(b.name));
      }

      // ── 3. For each grade+stream, read the v2 register for selectedDate ─────
      const results: StreamAttendanceRecord[] = [];

      for (const [, { grade, stream, studentIds, learners }] of gradeStreamMap) {
        // Build the storage key — stream in the key uses underscores (no spaces)
        const v2Key = buildV2Key(grade, stream, selectedDate);
        const registerRaw = ls.getItem(v2Key);
        const register = tryParse<LiveRegisterEntry>(registerRaw);

        let morningPresent = 0;
        let afternoonPresent = 0;
        let morningCompleted = false;
        let afternoonCompleted = false;

        if (register && register.date === selectedDate) {
          // Count student entries that have a status (P/A/L/E)
          // The register maps studentId (string) -> status letter
          for (const [sid, status] of Object.entries(register)) {
            if (sid === 'session' || sid === 'class' || sid === 'stream' ||
                sid === 'date' || sid === 'savedAt') continue;

            if (status === 'P') {
              morningPresent++;
            }
          }

          // Also check the master record map for session-level completeness
          const masterRaw = ls.getItem(ATTENDANCE_RECORDS_KEY);
          const master = tryParse<Record<string, LiveRegisterEntry>>(masterRaw);
          const masterKey = `${grade}_${stream}_${selectedDate}`;
          const masterEntry = master?.[masterKey];

          if (masterEntry) {
            // Morning completion: any morning status exists for any student in register
            const morningSessionKey = `${masterKey}_morning`;
            if (master[morningSessionKey] || masterEntry.session === 'morning') {
              morningCompleted = true;
            }
            // Check if morning has at least one status entry in the v2 register
            const hasMorningStatus = Object.entries(register).some(([k, v]) =>
              !['session', 'class', 'stream', 'date', 'savedAt'].includes(k) &&
              v && typeof v === 'string' && ['P', 'A', 'L', 'E'].includes(v)
            );
            if (hasMorningStatus) morningCompleted = true;

            const afternoonSessionKey = `${masterKey}_afternoon`;
            if (master[afternoonSessionKey]) {
              afternoonCompleted = true;
            }
          }

          // Simpler check: if any student entry exists with a status, morning is done
          const hasAnyEntry = Object.entries(register).some(([k, v]) =>
            !['session', 'class', 'stream', 'date', 'savedAt'].includes(k) &&
            v && typeof v === 'string' && ['P', 'A', 'L', 'E'].includes(v)
          );
          if (hasAnyEntry) {
            // Count afternoon present from the register if afternoon session data exists
            // The current system uses a single register with morning entries
            // Afternoon is tracked via a separate key suffix or same key with afternoon marker
            const afternoonKey = buildV2Key(grade, stream, `${selectedDate}_afternoon`);
            const afternoonRaw = ls.getItem(afternoonKey);
            if (afternoonRaw) {
              const afternoonReg = tryParse<LiveRegisterEntry>(afternoonRaw);
              if (afternoonReg && afternoonReg.date === selectedDate) {
                afternoonCompleted = true;
                for (const [sid, status] of Object.entries(afternoonReg)) {
                  if (sid === 'session' || sid === 'class' || sid === 'stream' ||
                      sid === 'date' || sid === 'savedAt') continue;
                  if (status === 'P') afternoonPresent++;
                }
              }
            }
          }
        }

        // Compute combined rate (morning + afternoon present / total slots)
        const totalSlots = studentIds.size * 2; // 2 sessions per student
        const totalPresent = morningPresent + afternoonPresent;
        const rate = totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0;

        results.push({
          grade,
          stream,
          totalLearners: studentIds.size,
          morningCompleted,
          afternoonCompleted,
          morningPresent,
          afternoonPresent,
          rate,
          learners,
        });
      }

      // Sort by grade order, then stream
      const GRADE_ORDER = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
                          'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
      const gradeIdx = (g: string) => {
        const i = GRADE_ORDER.indexOf(g);
        return i === -1 ? 999 : i;
      };
      results.sort((a, b) => {
        const gi = gradeIdx(a.grade) - gradeIdx(b.grade);
        if (gi !== 0) return gi;
        return a.stream.localeCompare(b.stream);
      });

      setRawStreams(results);
    } catch (err) {
      console.error('[useLiveStreamAttendance] recompute error:', err);
      setRawStreams([]);
    }
  }, [selectedDate]);

  // Mount + storage event listeners
  useEffect(() => {
    recompute();

    const watchedKeys = [
      STUDENTS_KEY,
      ATTENDANCE_RECORDS_KEY,
    ];

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (watchedKeys.includes(e.key) || e.key.startsWith(ATTENDANCE_V2_PREFIX)) {
        recompute();
      }
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key) {
        if (watchedKeys.includes(detail.key) || detail.key.startsWith(ATTENDANCE_V2_PREFIX)) {
          recompute();
        }
      } else {
        // No specific key — recompute to be safe
        recompute();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);

    // Poll every 5 seconds as a fallback for same-tab updates
    const interval = window.setInterval(recompute, 5_000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      window.clearInterval(interval);
    };
  }, [recompute]);

  // ── Apply filter state ─────────────────────────────────────────────────────
  const filteredStreams = useMemo(() => {
      const q = String(searchTerm || '').trim().toLowerCase();
      return rawStreams.filter((s) => {
      const gradeMatch = filterGrade === 'all' || s.grade === filterGrade;
      const streamMatch = filterStream === 'all' ||
        normalizeStream(s.stream) === normalizeStream(filterStream);
      const searchMatch = !q
        || s.grade.toLowerCase().includes(q)
        || s.stream.toLowerCase().includes(q);
      return gradeMatch && streamMatch && searchMatch;
    });
  }, [rawStreams, filterGrade, filterStream, searchTerm]);

  // ── Aggregate metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const src = filteredStreams;
    const totalLearners = src.reduce((sum, s) => sum + s.totalLearners, 0);
    const streamsTotal = src.length;
    const morningCompletedStreams = src.filter(s => s.morningCompleted).length;
    const afternoonCompletedStreams = src.filter(s => s.afternoonCompleted).length;
    const fullyCompletedStreams = src.filter(
      s => s.morningCompleted && s.afternoonCompleted
    ).length;
    const averageRate = streamsTotal > 0
      ? Math.round(src.reduce((sum, s) => sum + s.rate, 0) / Math.max(streamsTotal, 1))
      : 0;

    return {
      totalLearners,
      streamsTotal,
      morningCompletedStreams,
      afternoonCompletedStreams,
      fullyCompletedStreams,
      averageRate,
    };
  }, [filteredStreams]);

  return {
    streams: filteredStreams,
    ...metrics,
  };
};
