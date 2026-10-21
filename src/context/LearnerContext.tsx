import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CentralDataService } from '../services/centralDataService';
import { useAuth } from './AuthContext';

interface LearnerContextType {
  learners: any[];
  loading: boolean;
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => Promise<void> | void;
  updateLearner?: (admissionNumber: string, updatedData: any) => Promise<void> | void;
  deleteLearner: (admissionNumber: string) => Promise<void> | void;
  refreshLearners?: () => void;
  resetToSeedData: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [learners, setLearnersState] = useState<any[]>(() => CentralDataService.getLearners());
  const [loading, setLoading] = useState<boolean>(false);

  // Helper to fetch and filter learners based on user role
  const getFilteredLearners = useCallback(() => {
    const allLearners = CentralDataService.getLearners();
    const userRole = user?.role as string;
    if (!user || ['admin', 'owner', 'bursar', 'librarian', 'storekeeper', 'head_teacher', 'accountant', 'staff'].includes(userRole)) {
      return allLearners;
    }
    const assignedGrade = (user as any).assignedClass || (user as any).grade || '';
    const assignedStream = (user as any).assignedStream || (user as any).stream || '';
    if (!assignedGrade && !assignedStream) return allLearners;

    return allLearners.filter((l: any) => {
      const lGrade = l.grade || l.class || l.assignedClass || '';
      const lStream = l.stream || l.assignedStream || '';
      const gradeMatch = !assignedGrade || lGrade.toLowerCase().includes(assignedGrade.toLowerCase()) || assignedGrade.toLowerCase().includes(lGrade.toLowerCase());
      const streamMatch = !assignedStream || lStream.toLowerCase() === assignedStream.toLowerCase();
      return gradeMatch && streamMatch;
    });
  }, [user]);

  // Keep the latest filter function in a ref so the mount effect can run once
  // while always reading fresh data when storage events fire.
  const getFilteredLearnersRef = useRef(getFilteredLearners);
  getFilteredLearnersRef.current = getFilteredLearners;

  // Custom setter that prevents unneeded state updates if data hasn't changed
  const setLearners = useCallback((action: React.SetStateAction<any[]>) => {
    setLearnersState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, []);

  // Mount + event subscription — runs ONCE on mount.
  useEffect(() => {
    let isMounted = true;

    const updateFromSource = () => {
      if (!isMounted) return;
      const fresh = getFilteredLearnersRef.current();
      setLearners(fresh);
      setLoading(false);
    };

    updateFromSource();

    const handleStorageChange = () => {
      updateFromSource();
    };

    window.addEventListener('students-updated', handleStorageChange);
    window.addEventListener('learners-updated', handleStorageChange);
    window.addEventListener('munyaka:data-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('students-updated', handleStorageChange);
      window.removeEventListener('learners-updated', handleStorageChange);
      window.removeEventListener('munyaka:data-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setLearners]); // EMPTY DEPENDENCY ARRAY — runs once on mount

  // Re-sync when the active user identity changes (e.g. teacher logs in).
  // Primitive deps only — stable references, no re-render churn.
  useEffect(() => {
    setLearners(getFilteredLearnersRef.current());
    setLoading(false);
  }, [user?.role, user?.assignedClass, user?.assignedStream, setLearners]);

  const addLearner = useCallback(async (newLearner: any) => {
    setLearners((prev) => {
      const existingIndex = prev.findIndex(
        (l) => (l.admissionNumber || l.admission_number) === (newLearner.admissionNumber || newLearner.admission_number)
      );
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newLearner };
      } else {
        updated = [...prev, newLearner];
      }
      CentralDataService.saveLearners(updated);
      return updated;
    });
  }, [setLearners]);

  const updateLearner = useCallback(async (admissionNumber: string, updatedData: any) => {
    setLearners((prev) => {
      const updated = prev.map((l) => {
        if ((l.admissionNumber || l.admission_number) === admissionNumber) {
          return { ...l, ...updatedData };
        }
        return l;
      });
      CentralDataService.saveLearners(updated);
      return updated;
    });
  }, [setLearners]);

  const deleteLearner = useCallback(async (admissionNumber: string) => {
    setLearners((prev) => {
      const updated = prev.filter(
        (l) => (l.admissionNumber || l.admission_number) !== admissionNumber
      );
      CentralDataService.saveLearners(updated);
      return updated;
    });
  }, [setLearners]);

  const refreshLearners = useCallback(() => {
    setLearners(getFilteredLearnersRef.current());
  }, [setLearners]);

  const resetToSeedData = useCallback(() => {
    localStorage.removeItem('munyaka_learners');
    localStorage.removeItem('munyaka_students');
    setLearners(CentralDataService.getLearners());
  }, [setLearners]);

  const value = useMemo(
    () => ({
      learners,
      loading,
      setLearners,
      addLearner,
      updateLearner,
      deleteLearner,
      refreshLearners,
      resetToSeedData,
    }),
    [learners, loading, setLearners, addLearner, updateLearner, deleteLearner, refreshLearners, resetToSeedData]
  );

  return (
    <LearnerContext.Provider value={value}>
      {children}
    </LearnerContext.Provider>
  );
};

export const useLearners = () => {
  const context = useContext(LearnerContext);
  if (!context) {
    throw new Error('useLearners must be used within a LearnerProvider');
  }
  return context;
};
