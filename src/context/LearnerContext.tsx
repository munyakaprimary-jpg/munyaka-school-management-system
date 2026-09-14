import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSeedData } from '../data/initialSeedData';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner?: (newLearner: any) => void;
  resetToSeedData: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

// Helper to normalize schema discrepancies
const normalizeLearnerData = (data: any[]) => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    ...item,
    name: item.name || item.fullName || 'Unknown',
    fullName: item.fullName || item.name || 'Unknown'
  }));
};

const getInitialLearners = () => {
  const rawSeed = initialSeedData?.students || initialSeedData?.learners || [];
  const normalizedSeed = normalizeLearnerData(rawSeed);

  try {
    const saved = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_students');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only keep localStorage if it has AT LEAST as many learners as our seed file
      if (Array.isArray(parsed) && parsed.length >= normalizedSeed.length) {
        return normalizeLearnerData(parsed);
      }
    }
  } catch (e) {
    console.error("Storage parse error:", e);
  }

  // Fallback directly to physical seed file
  return normalizedSeed;
};

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearners] = useState<any[]>(getInitialLearners);

  useEffect(() => {
    localStorage.setItem('munyaka_learners', JSON.stringify(learners));
  }, [learners]);

  const addLearner = (newLearner: any) => {
    setLearners((prev) => [...prev, newLearner]);
  };

  const resetToSeedData = () => {
    const rawSeed = initialSeedData?.students || initialSeedData?.learners || [];
    const normalized = normalizeLearnerData(rawSeed);
    setLearners(normalized);
    localStorage.setItem('munyaka_learners', JSON.stringify(normalized));
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