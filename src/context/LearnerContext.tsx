import React, { createContext, useContext, useState, useEffect } from 'react';
import { CentralDataService } from '../services/centralDataService';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => void;
  resetToSeedData: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearners] = useState<any[]>(() => CentralDataService.getLearners());

  useEffect(() => {
    if (learners.length > 0) {
      CentralDataService.saveLearners(learners);
    }
  }, [learners]);

  const addLearner = (newLearner: any) => {
    setLearners((prev) => {
      const updated = [...prev, newLearner];
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
    <LearnerContext.Provider value={{ learners, setLearners, addLearner, resetToSeedData }}>
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