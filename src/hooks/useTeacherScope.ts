import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSchoolStore } from '@/store/useSchoolStore';
import { db } from '@/config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface TeacherScope {
  grade: string;
  stream: string;
  fullClass: string;
  isLocked: boolean;
  isAdmin: boolean;
  selectedOverride: string | null;
  setSelectedOverride: (val: string | null) => void;
  matchesScope: (record: any) => boolean;
  filterRecords: <T>(records: T[]) => T[];
  getAllowedGrades: () => string[];
  getAllowedStreams: () => string[];
}

/**
 * Single centralized source of truth for teacher class filtering and live Firestore sync.
 */
export function useTeacherScope(): TeacherScope {
  const { user } = useAuth();
  const { staff } = useSchoolStore();
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const [liveStaffDoc, setLiveStaffDoc] = useState<any>(null);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user.role || '').toLowerCase();
    const rbac = String((user as any).rbacRole || '').toLowerCase();
    return role === 'admin' || role === 'owner' || role === 'super_admin' || rbac === 'admin' || rbac === 'owner' || rbac === 'super_admin';
  }, [user]);

  // Subscribe via Firestore onSnapshot to staff record changes
  useEffect(() => {
    if (!user || isAdmin) {
      setLiveStaffDoc(null);
      return;
    }

    const email = String(user.email || '').toLowerCase();
    const userId = String(user.id || '');
    const tsc = String((user as any).identifier || (user as any).tscNumber || '');

    let unsubscribe = () => {};
    try {
      const staffRef = collection(db, 'staff');
      unsubscribe = onSnapshot(staffRef, (snapshot) => {
        let found: any = null;
        snapshot.forEach((d) => {
          const data = d.data();
          const matchId = d.id === userId || data.id === userId || data.staffId === userId;
          const matchEmail = email && String(data.email || '').toLowerCase() === email;
          const matchTsc = tsc && String(data.tscNumber || data.nationalId || data.identifier || '') === tsc;
          if (matchId || matchEmail || matchTsc) {
            found = { id: d.id, ...data };
          }
        });

        if (found) {
          setLiveStaffDoc(found);
          try {
            const raw = found.assignedGrade && found.assignedStream 
              ? `${found.assignedGrade} ${found.assignedStream}`
              : (found.assignedClass || (found.homeroomGrade && found.homeroomStream ? `${found.homeroomGrade} ${found.homeroomStream}` : ''));
            if (raw && raw !== 'No Class Assigned') {
              const curr = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
              curr.assignedClass = raw;
              curr.assignedGrade = found.assignedGrade || found.homeroomGrade || curr.assignedGrade;
              curr.assignedStream = found.assignedStream || found.homeroomStream || curr.assignedStream;
              localStorage.setItem('munyaka_current_user', JSON.stringify(curr));
            }
          } catch (e) {
            console.error("Error caching staff snapshot", e);
          }
        }
      }, (err) => {
        console.warn("Staff snapshot error:", err);
      });
    } catch (e) {
      console.warn("Failed to subscribe to staff collection", e);
    }

    return () => {
      unsubscribe();
    };
  }, [user, isAdmin]);

  // Matched staff record fallback from store
  const matchedStaff = useMemo(() => {
    if (!user || isAdmin) return null;
    if (liveStaffDoc) return liveStaffDoc;
    return staff.find((s: any) => 
      String(s.email || '').toLowerCase() === String(user.email || '').toLowerCase() ||
      String(s.id || '').toLowerCase() === String(user.id || '').toLowerCase() ||
      String(s.staffId || '').toLowerCase() === String(user.staff_id || '').toLowerCase()
    );
  }, [user, staff, isAdmin, liveStaffDoc]);

  // Raw assigned class string
  const rawAssignedClass = useMemo(() => {
    if (isAdmin) return '';
    if (selectedOverride) return selectedOverride;

    const sources = [
      liveStaffDoc?.assignedGrade && liveStaffDoc?.assignedStream ? `${liveStaffDoc.assignedGrade} ${liveStaffDoc.assignedStream}` : null,
      liveStaffDoc?.assignedClass,
      liveStaffDoc?.homeroomGrade && liveStaffDoc?.homeroomStream ? `${liveStaffDoc.homeroomGrade} ${liveStaffDoc.homeroomStream}` : null,
      (user as any)?.assignedClass,
      (user as any)?.gradeStream,
      (user as any)?.assignedGrade,
      matchedStaff?.assignedGrade && matchedStaff?.assignedStream ? `${matchedStaff.assignedGrade} ${matchedStaff.assignedStream}` : null,
      matchedStaff?.assignedClass,
      matchedStaff?.homeroomGrade && matchedStaff?.homeroomStream ? `${matchedStaff.homeroomGrade} ${matchedStaff.homeroomStream}` : null,
      Array.isArray(matchedStaff?.assignedClasses) && matchedStaff.assignedClasses[0] ? matchedStaff.assignedClasses[0] : null,
      Array.isArray((user as any)?.assignedClasses) && (user as any).assignedClasses[0] ? (user as any).assignedClasses[0] : null,
    ].filter(Boolean) as string[];

    // Also check munyaka_current_user in localStorage
    try {
      const localCurr = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
      if (localCurr.assignedClass && localCurr.assignedClass !== 'No Class Assigned') {
        sources.unshift(localCurr.assignedClass);
      }
    } catch {}

    const valid = sources.find(s => s && s !== 'No Class Assigned' && s !== 'All Grades' && s !== 'all');
    return valid || (sources.length > 0 ? sources[0] : 'Grade 4 Yellow');
  }, [user, matchedStaff, liveStaffDoc, isAdmin, selectedOverride]);

  // Normalized grade and stream
  const { grade, stream, fullClass } = useMemo(() => {
    if (isAdmin || !rawAssignedClass || rawAssignedClass === 'No Class Assigned') {
      return { grade: '', stream: '', fullClass: '' };
    }

    const clean = String(rawAssignedClass).replace(/\([^)]*\)/g, '').trim();
    const parts = clean.split(/\s+/);
    let g = '';
    let s = '';

    if (parts.length >= 2) {
      s = parts[parts.length - 1];
      g = parts.slice(0, parts.length - 1).join(' ');
    } else {
      g = clean;
    }

    const parenMatch = String(rawAssignedClass).match(/\(([^)]+)\)/);
    const parenStream = parenMatch ? parenMatch[1].trim() : '';
    const finalStream = s || parenStream;

    const normGrade = g.toLowerCase().includes('grade') ? g : `Grade ${g}`.trim();
    const normStream = finalStream;

    return {
      grade: normGrade,
      stream: normStream,
      fullClass: `${normGrade} ${normStream}`.trim()
    };
  }, [isAdmin, rawAssignedClass]);

  const isLocked = !isAdmin && Boolean(grade);

  // Robust matching helper
  const matchesScope = useCallback((record: any): boolean => {
    if (isAdmin || !isLocked) return true;
    if (!record) return false;

    // Gather candidate grade & stream from record (learner, attendance, marks, etc.)
    const recGrade = String(
      record.grade || record.gradeLevel || record.class || record.classLevel || record.currentGrade || record.assignedGrade || ''
    ).trim();
    const recStream = String(
      record.stream || record.departmentOrStream || record.assignedStream || ''
    ).trim();

    const targetGradeNum = grade.replace(/grade/gi, '').trim().toLowerCase();
    const recGradeNum = recGrade.replace(/grade/gi, '').trim().toLowerCase();

    const gradeMatches = !targetGradeNum || recGradeNum === targetGradeNum || recGrade.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(recGrade.toLowerCase());

    const targetStreamLower = stream.toLowerCase();
    const recStreamLower = recStream.toLowerCase();

    const streamMatches = !targetStreamLower || recStreamLower === targetStreamLower || recStreamLower.includes(targetStreamLower) || targetStreamLower.includes(recStreamLower);

    return gradeMatches && streamMatches;
  }, [isAdmin, isLocked, grade, stream]);

  const filterRecords = useCallback(<T extends any>(records: T[]): T[] => {
    if (isAdmin || !isLocked) return records;
    if (!records || !Array.isArray(records)) return [];
    return records.filter(record => matchesScope(record));
  }, [isAdmin, isLocked, matchesScope]);

  const getAllowedGrades = useCallback((): string[] => {
    if (isAdmin) {
      return ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    }
    return grade ? [grade] : ['Grade 4'];
  }, [isAdmin, grade]);

  const getAllowedStreams = useCallback((): string[] => {
    if (isAdmin) {
      return ['Yellow', 'Green', 'Blue', 'Red', 'East', 'West', 'North', 'South', 'Jupiter', 'Mars', 'Venus'];
    }
    return stream ? [stream] : ['Yellow'];
  }, [isAdmin, stream]);

  return {
    grade,
    stream,
    fullClass,
    isLocked,
    isAdmin,
    selectedOverride,
    setSelectedOverride,
    matchesScope,
    filterRecords,
    getAllowedGrades,
    getAllowedStreams,
  };
}
