import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { parseBoundClass, ParsedClass } from '@/utils/classLockUtils';
import { useAuth } from '@/context/AuthContext';
import { useSchoolStore } from '@/store/useSchoolStore';

interface ClassLockContextType {
  activeClass: ParsedClass;
  rawAssignedClass: string;
  isAdmin: boolean;
  isLocked: boolean;
  selectedClassOverride: string | null;
  setSelectedClassOverride: (classStr: string | null) => void;
  filterLearners: <T>(learners: T[]) => T[];
  getAllowedGradeOptions: () => string[];
  getAllowedStreamOptions: () => string[];
}

const ClassLockContext = createContext<ClassLockContextType | undefined>(undefined);

export const ClassLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { staff } = useSchoolStore();
  const [selectedClassOverride, setSelectedClassOverride] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user.role || '').toLowerCase();
    const rbac = String((user as any).rbacRole || '').toLowerCase();
    return role === 'admin' || role === 'owner' || role === 'super_admin' || rbac === 'admin' || rbac === 'owner' || rbac === 'super_admin';
  }, [user]);

  // Find staff record if teacher
  const matchedStaff = useMemo(() => {
    if (!user || isAdmin) return null;
    return staff.find(s => 
      String(s.email || '').toLowerCase() === String(user.email || '').toLowerCase() ||
      String(s.id || '').toLowerCase() === String(user.id || '').toLowerCase() ||
      String(s.staffId || '').toLowerCase() === String(user.staff_id || '').toLowerCase()
    );
  }, [user, staff, isAdmin]);

  const rawAssignedClass = useMemo(() => {
    if (isAdmin) return '';
    if (selectedClassOverride) return selectedClassOverride;

    const sources = [
      (user as any)?.assignedClass,
      (user as any)?.gradeStream,
      (user as any)?.assignedGrade,
      matchedStaff?.assignedGrade && matchedStaff?.assignedStream ? `${matchedStaff.assignedGrade} ${matchedStaff.assignedStream}` : null,
      matchedStaff?.assignedClass,
      Array.isArray(matchedStaff?.assignedClasses) && matchedStaff.assignedClasses[0] ? matchedStaff.assignedClasses[0] : null,
      Array.isArray((user as any)?.assignedClasses) && (user as any).assignedClasses[0] ? (user as any).assignedClasses[0] : null,
    ].filter(Boolean) as string[];

    const valid = sources.find(s => s && s !== 'No Class Assigned' && s !== 'All Grades' && s !== 'all');
    return valid || (sources.length > 0 ? sources[0] : 'Grade 4 Yellow');
  }, [user, matchedStaff, isAdmin, selectedClassOverride]);

  const activeClass = useMemo(() => {
    if (isAdmin) {
      return { grade: '', stream: '', displayGrade: '', displayStream: '', isLocked: false };
    }
    return parseBoundClass(rawAssignedClass);
  }, [isAdmin, rawAssignedClass]);

  const isLocked = !isAdmin && activeClass.isLocked;

  const filterLearners = <T extends any>(learners: T[]): T[] => {
    if (isAdmin || !isLocked) return learners;
    if (!activeClass.grade && !activeClass.stream) return learners;

    const targetGradeNum = activeClass.grade.replace(/grade/gi, '').trim().toLowerCase();
    const targetStreamLower = activeClass.stream.toLowerCase();

    return learners.filter(learner => {
      if (!learner) return false;
      const lGrade = String(learner.grade || learner.gradeLevel || learner.class || learner.currentGrade || '').trim();
      const lStream = String(learner.stream || '').trim();

      const lGradeNum = lGrade.replace(/grade/gi, '').trim().toLowerCase();
      const gradeMatches = !targetGradeNum || lGradeNum === targetGradeNum || lGrade.toLowerCase().includes(activeClass.grade.toLowerCase());

      const lStreamLower = lStream.toLowerCase();
      const streamMatches = !targetStreamLower || lStreamLower === targetStreamLower || lStreamLower.includes(targetStreamLower) || targetStreamLower.includes(lStreamLower);

      return gradeMatches && streamMatches;
    });
  };

  const getAllowedGradeOptions = (): string[] => {
    if (isAdmin) {
      return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    }
    if (activeClass.grade) {
      return [activeClass.grade];
    }
    return ['Grade 4'];
  };

  const getAllowedStreamOptions = (): string[] => {
    if (isAdmin) {
      return ['Yellow', 'Green', 'Blue', 'Red', 'North', 'South', 'East', 'West'];
    }
    if (activeClass.stream) {
      return [activeClass.stream];
    }
    return ['Yellow'];
  };

  return (
    <ClassLockContext.Provider
      value={{
        activeClass,
        rawAssignedClass,
        isAdmin,
        isLocked,
        selectedClassOverride,
        setSelectedClassOverride,
        filterLearners,
        getAllowedGradeOptions,
        getAllowedStreamOptions,
      }}
    >
      {children}
    </ClassLockContext.Provider>
  );
};

export const useClassLock = () => {
  const context = useContext(ClassLockContext);
  if (!context) {
    throw new Error('useClassLock must be used within a ClassLockProvider');
  }
  return context;
};
