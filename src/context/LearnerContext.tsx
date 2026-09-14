import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearners] = useState(() => {
    const primary = localStorage.getItem('munyaka_learners');
    if (primary && JSON.parse(primary).length > 0) return JSON.parse(primary);

    const legacy1 = localStorage.getItem('learners');
    if (legacy1 && JSON.parse(legacy1).length > 0) return JSON.parse(legacy1);

    const legacy2 = localStorage.getItem('students');
    if (legacy2 && JSON.parse(legacy2).length > 0) return JSON.parse(legacy2);

    return initialSeedData.students || (initialSeedData as any).munyaka_learners || [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('munyaka_learners', JSON.stringify(learners));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: learners }));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners' } }));
    } catch (err) {
      console.error('[LearnerContext] Failed to sync learners to localStorage:', err);
    }
  }, [learners]);

  const addLearner = (newLearner: any) => {
    setLearners((prev) => {
      const exists = prev.some(
        (l) => l.id === newLearner.id || l.admNo === newLearner.admNo
      );
      if (exists) {
        // Update existing record instead of creating duplicate
        return prev.map((l) =>
          l.id === newLearner.id || l.admNo === newLearner.admNo ? newLearner : l
        );
      }
      return [...prev, newLearner];
    });
  };

  return (
    <LearnerContext.Provider value={{ learners, setLearners, addLearner }}>
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
