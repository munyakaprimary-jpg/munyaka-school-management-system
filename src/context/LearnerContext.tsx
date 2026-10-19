import React, { createContext, useContext, useState, useEffect } from 'react';
import { CentralDataService } from '../services/centralDataService';
import { useAuth } from './AuthContext';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => Promise<void> | void;
  deleteLearner: (admissionNumber: string) => Promise<void> | void;
  resetToSeedData: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const allLearners = CentralDataService.getLearners();

  // If user is a teacher, filter learners strictly to their assigned grade and stream
  const filteredLearners = React.useMemo(() => {
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
  }, [allLearners, user]);

  const [learners, setLearners] = useState<any[]>(filteredLearners);

  // Sync state when filteredLearners content actually changes
  useEffect(() => {
    setLearners(filteredLearners);
  }, [JSON.stringify(filteredLearners)]);

  const addLearner = async (newLearner: any) => {
    // Local state & storage update
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
  };

  const deleteLearner = async (admissionNumber: string) => {
    // Local state & storage update
    setLearners((prev) => {
      const updated = prev.filter(
        (l) => (l.admissionNumber || l.admission_number) !== admissionNumber
      );
      CentralDataService.saveLearners(updated);
      return updated;
    });
  };

  const resetToSeedData = () => {
    localStorage.removeItem('munyaka_learners');
    localStorage.removeItem('munyaka_students');
    const resetList = CentralDataService.getLearners();
    setLearners(resetList);
  };

  return (
    <LearnerContext.Provider value={{ learners, setLearners, addLearner, deleteLearner, resetToSeedData }}>
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