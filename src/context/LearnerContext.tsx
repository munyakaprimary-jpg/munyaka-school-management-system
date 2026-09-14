import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSeedData } from '../data/initialSeedData';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

const getInitialLearners = () => {
  try {
    const local = localStorage.getItem('munyaka_learners');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Storage parse error", e);
  }
  // Fallback to hardcoded seed data
  return initialSeedData?.learners || initialSeedData?.students || [];
};

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearners] = useState(getInitialLearners);

  // Only save to localStorage when learners array actually has items
  useEffect(() => {
    if (learners && learners.length > 0) {
      localStorage.setItem('munyaka_learners', JSON.stringify(learners));
      try {
        window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: learners }));
        window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners' } }));
      } catch (err) {
        // ignore dispatch errors in non-browser envs
      }
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
