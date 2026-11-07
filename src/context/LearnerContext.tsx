import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { generateLearnerId, formatLearnerDoc, findExistingLearner, dedupeLearnersById, deduplicateLearners } from '../services/learnerService';
import { bundleAllLearnersToCentral } from '../services/bundleAllLearners';
import { purgeLearnerPermanently } from '../services/purgeLearnerService';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';

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

export const STORAGE_KEY_LEARNERS_V2 = 'munyaka_learners_v2';
export const STORAGE_KEY_MUNYAKA_LEARNERS = 'munyaka_learners';

export const LearnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to filter learners based on user role and assigned grade/stream
  const filterLearnersForUser = useCallback((rawLearners: any[]) => {
    const allLearners = (rawLearners || []).map(formatLearnerDoc);
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

  const [learners, setLearnersState] = useState<any[]>(() => {
    try {
      const deduplicateLearners = (list: any[]) => {
        const seen = new Set();
        return list.filter((learner) => {
          const key = learner.admNo || learner.admissionNumber || learner.id || `${learner.fullName || learner.name || ''}-${learner.dob || ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };
      const stored = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_v2');
      const parsed = stored ? JSON.parse(stored) : [];
      const clean = deduplicateLearners(parsed);
      localStorage.setItem('munyaka_learners', JSON.stringify(clean));
      return clean;
    } catch (e) {
      console.error("Failed to parse learners storage", e);
      return [];
    }
  });
  const learnersRef = useRef(learners);
  learnersRef.current = learners;

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

  // Non-destructive initialization & Firestore Sync
  useEffect(() => {
    let isMounted = true;

    const initializeLearners = async () => {
      try {
        const localData = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
        const initialLearners = localData ? JSON.parse(localData) : [];

        if (initialLearners.length > 0 && isMounted) {
          setLearners(filterLearnersForUser(initialLearners));
          setLoading(false);
        }

        // Fetch from Firestore learners collection non-destructively
        try {
          const snapshot = await getDocs(collection(db, 'learners'));
          if (!snapshot.empty) {
            const cloudLearners = snapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            }));
            const combined = deduplicateLearners([...cloudLearners, ...initialLearners]);
            localStorage.setItem(STORAGE_KEY_MUNYAKA_LEARNERS, JSON.stringify(combined));
            localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(combined));
            if (isMounted) {
              setLearners(filterLearnersForUser(combined));
              setLoading(false);
            }
          } else {
            if (initialLearners.length > 0 && isMounted) {
              setLearners(filterLearnersForUser(initialLearners));
            } else if (isMounted) {
              setLearners(filterLearnersForUser([]));
            }
            setLoading(false);
          }
        } catch (error) {
          console.warn('Offline mode: Using cached learners from local storage');
          if (initialLearners.length > 0 && isMounted) {
            setLearners(filterLearnersForUser(initialLearners));
          } else if (isMounted) {
            setLearners(filterLearnersForUser([]));
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[LearnerContext] Initialization error:', err);
        if (isMounted) {
          setLearners(filterLearnersForUser([]));
          setLoading(false);
        }
      }
    };

    initializeLearners();

    const handleStorageChange = () => {
      if (!isMounted) return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setLearners(filterLearnersForUser(parsed));
          }
        }
      } catch {}
    };

    window.addEventListener('munyaka:learners-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('munyaka:learners-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [filterLearnersForUser, setLearners]);

  // Unified addLearner: Saves both to React State AND localStorage simultaneously before Firestore sync
  const addLearner = useCallback(async (newLearner: any) => {
    const normalizedNew = {
      ...newLearner,
      id: newLearner.id ? String(newLearner.id) : generateLearnerId(),
      createdAt: newLearner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const rawStored = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
      const currentStored = rawStored ? JSON.parse(rawStored) : [];
      const existing = findExistingLearner(currentStored, normalizedNew);

      let updatedList: any[] = [];
      if (existing) {
        updatedList = currentStored.map((l: any) => {
          const lId = String(l.id || (l as any).learnerId || '');
          const existingId = String(existing.id || (existing as any).learnerId || '');
          const match = (lId && existingId && lId === existingId) ||
            (l.admissionNumber && existing.admissionNumber && l.admissionNumber === existing.admissionNumber);
          return match ? { ...l, ...normalizedNew, id: lId || normalizedNew.id } : l;
        });
      } else {
        updatedList = [normalizedNew, ...currentStored];
      }

      updatedList = dedupeLearnersById(updatedList);

      // Save simultaneously to localStorage
      localStorage.setItem(STORAGE_KEY_MUNYAKA_LEARNERS, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(updatedList));
      localStorage.setItem('school_learners_data', JSON.stringify(updatedList));
      localStorage.setItem('munyaka_students', JSON.stringify(updatedList));
      localStorage.setItem('cached_learners', JSON.stringify(updatedList));

      // Update React State immediately
      setLearners(filterLearnersForUser(updatedList));

      // Attempt Firestore sync
      if (db) {
        try {
          await setDoc(doc(db, 'learners', String(normalizedNew.id)), normalizedNew, { merge: true });
        } catch (fsErr) {
          console.warn('[LearnerContext] Firestore sync warning on addLearner:', fsErr);
        }
      }

      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('learners-updated'));
      window.dispatchEvent(new Event('learners_updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] addLearner error:', err);
    }
  }, [filterLearnersForUser, setLearners]);

  const updateLearner = useCallback(async (admissionNumber: string, updatedData: any) => {
    try {
      const rawStored = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
      const currentStored = rawStored ? JSON.parse(rawStored) : [];
      let targetId = '';

      const updatedList = currentStored.map((l: any) => {
        const adm = l.admissionNumber || l.admission_number || l.admNo;
        if (adm === admissionNumber || l.id === admissionNumber) {
          targetId = l.id;
          return { ...l, ...updatedData, updatedAt: new Date().toISOString() };
        }
        return l;
      });

      const deduped = dedupeLearnersById(updatedList);

      // Save simultaneously to localStorage
      localStorage.setItem(STORAGE_KEY_MUNYAKA_LEARNERS, JSON.stringify(deduped));
      localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(deduped));
      localStorage.setItem('school_learners_data', JSON.stringify(deduped));
      localStorage.setItem('munyaka_students', JSON.stringify(deduped));
      localStorage.setItem('cached_learners', JSON.stringify(deduped));

      // Update React State immediately
      setLearners(filterLearnersForUser(deduped));

      if (targetId && db) {
        try {
          const found = deduped.find((l: any) => l.id === targetId);
          if (found) {
            await setDoc(doc(db, 'learners', String(targetId)), found, { merge: true });
          }
        } catch (fsErr) {
          console.warn('[LearnerContext] Firestore sync warning on updateLearner:', fsErr);
        }
      }

      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('learners-updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] updateLearner error:', err);
    }
  }, [filterLearnersForUser, setLearners]);

  const deleteLearner = useCallback(async (admissionNumber: string) => {
      try {
        const rawStored = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
        const currentStored = rawStored ? JSON.parse(rawStored) : [];
        
        const learnerToDelete = currentStored.find((l: any) => {
          const adm = String(l.admissionNumber || l.admission_number || l.admNo || l.admissionNo || '');
          const lId = String(l.id || l._id || '');
          return adm === admissionNumber || lId === admissionNumber || adm === String(admissionNumber) || lId === String(admissionNumber);
        });
  
        if (!learnerToDelete) {
          console.warn('[LearnerContext] Learner not found for deletion:', admissionNumber);
          return;
        }

        // Optimistically remove from local storage and state first
        const remaining = currentStored.filter((l: any) => {
          const adm = String(l.admissionNumber || l.admission_number || l.admNo || l.admissionNo || '');
          const lId = String(l.id || l._id || '');
          return adm !== admissionNumber && lId !== admissionNumber && adm !== String(admissionNumber) && lId !== String(admissionNumber);
        });

        localStorage.setItem(STORAGE_KEY_MUNYAKA_LEARNERS, JSON.stringify(remaining));
        localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(remaining));
        setLearners(filterLearnersForUser(remaining));
  
        const updatedList = await purgeLearnerPermanently(learnerToDelete);
        setLearners(filterLearnersForUser(updatedList));
  
        window.dispatchEvent(new Event('students-updated'));
        window.dispatchEvent(new Event('learners-updated'));
        window.dispatchEvent(new Event('learners_updated'));
        window.dispatchEvent(new Event('munyaka:data-changed'));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('[LearnerContext] deleteLearner error:', err);
      }
    }, [filterLearnersForUser, setLearners]);

  const refreshLearners = useCallback(() => {
    try {
      const rawStored = localStorage.getItem(STORAGE_KEY_MUNYAKA_LEARNERS) || localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (Array.isArray(parsed)) {
          setLearners(filterLearnersForUser(parsed));
          return;
        }
      }
      setLearners(filterLearnersForUser([]));
    } catch {
      setLearners(filterLearnersForUser([]));
    }
  }, [filterLearnersForUser, setLearners]);

  const resetToSeedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_LEARNERS_V2);
    localStorage.removeItem(STORAGE_KEY_MUNYAKA_LEARNERS);
    localStorage.removeItem('school_learners_data');
    localStorage.removeItem('munyaka_students');
    localStorage.removeItem('cached_learners');

    setLearners(filterLearnersForUser([]));
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
  }, [filterLearnersForUser, setLearners]);

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
