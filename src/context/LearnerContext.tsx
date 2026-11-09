import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
const initialSeedData: { learners: any[] } = { learners: [] };

const STORAGE_KEY = 'munyaka_learners';

interface LearnerContextType {
  learners: any[];
  loading: boolean;
  addLearner: (newLearner: any) => Promise<void> | void;
  updateLearner: (id: string, updatedData: any) => void;
  deleteLearner: (id: string) => void;
  refreshLearners: () => void;
  resetToSeedData: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export const getStoredLearners = () => {
  try {
    const data = localStorage.getItem('munyaka_learners');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse learners storage", e);
  }
  return [];
};

export const saveStoredLearners = (learners: any[]) => {
  const serialized = JSON.stringify(learners);
  localStorage.setItem('munyaka_learners', serialized);
  localStorage.setItem(STORAGE_KEY, serialized);
  localStorage.setItem('munyaka_learners_v2', serialized);
  localStorage.setItem('school_learners_data', serialized);
  localStorage.setItem('munyaka_students', serialized);
  localStorage.setItem('munyaka_app_learners_v1', serialized);
};

const deduplicateLearners = (list: any[]) => {
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const l of list || []) {
    if (!l) continue;
    const name = String(l.fullName || l.name || l.studentName || '').trim();
    if (!name || name === 'undefined undefined' || name === 'null null' || name === 'Unnamed Learner') continue;
    const id = String(l.id || l._id || l.admissionNo || l.admissionNumber || '');
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    unique.push(l);
  }
  return unique;
};

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learners, setLearnersState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_learners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const parsed = getStoredLearners();
      const clean = deduplicateLearners(parsed);
      saveStoredLearners(clean);
      return clean;
    } catch (e) {
      console.error("Failed to parse learners storage", e);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  const setLearners = useCallback((newLearners: any[] | ((prev: any[]) => any[])) => {
    try {
      const resolved = typeof newLearners === 'function' ? newLearners(learners) : newLearners;
      const clean = deduplicateLearners(resolved);
      setLearnersState(clean);
      saveStoredLearners(clean);
    } catch (e) {
      console.error("Failed to update learners", e);
    }
  }, [learners]);

  const setLearnersStateRaw = useCallback((newLearners: any[] | ((prev: any[]) => any[])) => {
    try {
      const resolved = typeof newLearners === 'function' ? newLearners(learners) : newLearners;
      const clean = deduplicateLearners(resolved);
      setLearnersState(clean);
      saveStoredLearners(clean);
    } catch (e) {
      console.error("Failed to update learners raw", e);
    }
  }, [learners]);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const data = localStorage.getItem('munyaka_learners');
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setLearnersState(deduplicateLearners(parsed));
          }
        }
      } catch (e) {
        console.error("Storage sync error", e);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_learners_updated', handleStorage);
    window.addEventListener('munyaka:data-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_learners_updated', handleStorage);
      window.removeEventListener('munyaka:data-changed', handleStorage);
    };
  }, []);

  const addLearner = useCallback(async (newLearner: any) => {
    try {
      const current = getStoredLearners();
      const formatted = {
        ...newLearner,
        id: newLearner.id || `learner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        admissionNumber: newLearner.admissionNumber || newLearner.admissionNo || newLearner.admNo || `MUN-${String(current.length + 1).padStart(3, '0')}-${new Date().getFullYear()}`,
        admissionNo: newLearner.admissionNo || newLearner.admissionNumber || newLearner.admNo || `MUN-${String(current.length + 1).padStart(3, '0')}-${new Date().getFullYear()}`,
        fullName: newLearner.fullName || newLearner.name || '',
        name: newLearner.name || newLearner.fullName || '',
        createdAt: newLearner.createdAt || new Date().toISOString()
      };

      const updated = [formatted, ...current];
      const clean = deduplicateLearners(updated);
      setLearnersState(clean);
      saveStoredLearners(clean);

      window.dispatchEvent(new Event('munyaka_learners_updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] addLearner error:', err);
    }
  }, []);

  const updateLearner = useCallback((id: string, updatedData: any) => {
    try {
      const current = getStoredLearners();
      const updated = current.map(l => (l.id === id || l.admissionNo === id || l.admissionNumber === id) ? { ...l, ...updatedData } : l);
      const clean = deduplicateLearners(updated);
      setLearnersState(clean);
      saveStoredLearners(clean);

      window.dispatchEvent(new Event('munyaka_learners_updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] updateLearner error:', err);
    }
  }, []);

  const deleteLearner = useCallback((id: string) => {
    try {
      const current = getStoredLearners();
      const filtered = current.filter(l => l.id !== id && l.admissionNo !== id && l.admissionNumber !== id && l.admNo !== id);
      const clean = deduplicateLearners(filtered);
      setLearnersState(clean);
      saveStoredLearners(clean);

      window.dispatchEvent(new Event('munyaka_learners_updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] deleteLearner error:', err);
    }
  }, []);

  const refreshLearners = useCallback(() => {
    try {
      const data = getStoredLearners();
      const clean = deduplicateLearners(data);
      setLearnersState(clean);
    } catch (err) {
      console.error('[LearnerContext] refreshLearners error:', err);
    }
  }, []);

  const resetToSeedData = useCallback(() => {
    try {
      const seed = (initialSeedData as any).learners || [];
      const clean = deduplicateLearners(seed);
      setLearnersState(clean);
      saveStoredLearners(clean);
    } catch (err) {
      console.error('[LearnerContext] resetToSeedData error:', err);
    }
  }, []);

  return (
    <LearnerContext.Provider
      value={{
        learners,
        loading,
        addLearner,
        updateLearner,
        deleteLearner,
        refreshLearners,
        resetToSeedData,
      }}
    >
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
