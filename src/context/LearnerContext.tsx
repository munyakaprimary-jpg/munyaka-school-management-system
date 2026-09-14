import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSeedData } from '../data/initialSeedData';

interface LearnerContextType {
  learners: any[];
  setLearners: React.Dispatch<React.SetStateAction<any[]>>;
  addLearner: (newLearner: any) => void;
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
  try {
    const saved = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_students');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeLearnerData(parsed);
      }
    }
  } catch (e) {
    console.error("Storage parse error:", e);
  }

  // Fallback directly to physical seed file
  const rawSeed = initialSeedData?.students || initialSeedData?.learners || [];
  return normalizeLearnerData(rawSeed);
};

export const LearnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [learners, setLearners] = useState(getInitialLearners);

  // Prevent overwriting storage if learners array is completely empty
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
