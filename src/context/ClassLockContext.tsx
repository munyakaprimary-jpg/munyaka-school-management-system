import React, { createContext, useContext } from 'react';
import { useTeacherScope, TeacherScope } from '@/hooks/useTeacherScope';
import { parseBoundClass, ParsedClass } from '@/utils/classLockUtils';

interface ClassLockContextType extends TeacherScope {
  activeClass: ParsedClass;
  rawAssignedClass: string;
  selectedClassOverride: string | null;
  setSelectedClassOverride: (classStr: string | null) => void;
  filterLearners: <T>(learners: T[]) => T[];
  getAllowedGradeOptions: () => string[];
  getAllowedStreamOptions: () => string[];
}

const ClassLockContext = createContext<ClassLockContextType | undefined>(undefined);

export const ClassLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scope = useTeacherScope();

  const activeClass: ParsedClass = {
    grade: scope.grade,
    stream: scope.stream,
    displayGrade: scope.grade,
    displayStream: scope.stream,
    isLocked: scope.isLocked
  };

  const rawAssignedClass = scope.fullClass;

  const filterLearners = <T extends any>(learners: T[]): T[] => {
    return scope.filterRecords(learners);
  };

  const getAllowedGradeOptions = (): string[] => {
    return scope.getAllowedGrades();
  };

  const getAllowedStreamOptions = (): string[] => {
    return scope.getAllowedStreams();
  };

  return (
    <ClassLockContext.Provider
      value={{
        ...scope,
        activeClass,
        rawAssignedClass,
        selectedClassOverride: scope.selectedOverride,
        setSelectedClassOverride: scope.setSelectedOverride,
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

