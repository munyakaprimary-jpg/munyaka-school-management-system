import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CentralDataService } from '../services/centralDataService';
import { generateLearnerId, formatLearnerDoc, findExistingLearner, dedupeLearnersById } from '../services/learnerService';
import { bundleAllLearnersToCentral } from '../services/bundleAllLearners';
import { purgeLearnerPermanently } from '../services/purgeLearnerService';
import { initialSeedData } from '../data/initialSeedData';
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

  const [learners, setLearnersState] = useState<any[]>([]);
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

  // One-time Migration & Complete Bundling of Seed Data & Legacy Records into munyaka_learners_v2
  useEffect(() => {
    let isMounted = true;

    const initializeLearners = async () => {
      try {
        // Execute complete bundling service to migrate all legacy keys, seed data, and cloud records into munyaka_learners_v2
        const bundledList = await bundleAllLearnersToCentral();
        const learnersList = dedupeLearnersById((bundledList || []).map(formatLearnerDoc));

        if (isMounted) {
          setLearners(filterLearnersForUser(learnersList));
          setLoading(false);
        }
      } catch (err) {
        console.error('[LearnerContext] Initialization & bundling error:', err);
        if (isMounted) {
          const fallback = filterLearnersForUser(
            (initialSeedData as any).students || (initialSeedData as any).learners || []
          );
          setLearners(fallback);
          setLoading(false);
        }
      }
    };

    initializeLearners();

    const handleStorageChange = () => {
      if (!isMounted) return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setLearners(filterLearnersForUser(parsed));
          }
        }
      } catch {}
    };

    window.addEventListener('students-updated', handleStorageChange);
    window.addEventListener('learners-updated', handleStorageChange);
    window.addEventListener('learners_updated', handleStorageChange);
    window.addEventListener('munyaka:data-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('students-updated', handleStorageChange);
      window.removeEventListener('learners-updated', handleStorageChange);
      window.removeEventListener('learners_updated', handleStorageChange);
      window.removeEventListener('munyaka:data-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [filterLearnersForUser, setLearners]);

  // Unified addLearner: Appends directly to munyaka_learners_v2, mirrors to helper keys, and syncs to Firestore
  const addLearner = useCallback(async (newLearner: any) => {
    const normalizedNew = {
      ...newLearner,
      id: newLearner.id ? String(newLearner.id) : generateLearnerId(),
      createdAt: newLearner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedList: any[] = [];
    
    try {
      const rawStored = localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
      const currentStored = rawStored ? JSON.parse(rawStored) : [];
      const existing = findExistingLearner(currentStored, normalizedNew);

      if (existing) {
        updatedList = currentStored.map((l: any) => {
          const lId = String(l.id || l.learnerId || '');
          const existingId = String(existing.id || existing.learnerId || '');
          const match = (lId && existingId && lId === existingId) ||
            (l.admissionNumber && existing.admissionNumber && l.admissionNumber === existing.admissionNumber);
          return match ? { ...l, ...normalizedNew, id: lId || normalizedNew.id } : l;
        });
      } else {
        updatedList = [normalizedNew, ...currentStored];
      }

      updatedList = dedupeLearnersById(updatedList);

      // Save to central storage key munyaka_learners_v2
      localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(updatedList));
      // Mirror to secondary keys for compatibility
      localStorage.setItem('school_learners_data', JSON.stringify(updatedList));
      localStorage.setItem('munyaka_students', JSON.stringify(updatedList));
      localStorage.setItem('cached_learners', JSON.stringify(updatedList));

      // Sync to Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'learners', String(normalizedNew.id)), normalizedNew, { merge: true });
        } catch (fsErr) {
          console.warn('[LearnerContext] Firestore sync warning on addLearner:', fsErr);
        }
      }

      // Also call CentralDataService
      CentralDataService.saveLearners(updatedList);

      setLearners(filterLearnersForUser(updatedList));

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
      const rawStored = localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
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
      localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(deduped));
      localStorage.setItem('school_learners_data', JSON.stringify(deduped));
      localStorage.setItem('munyaka_students', JSON.stringify(deduped));
      localStorage.setItem('cached_learners', JSON.stringify(deduped));

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

      CentralDataService.saveLearners(deduped);
      setLearners(filterLearnersForUser(deduped));

      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('learners-updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
    } catch (err) {
      console.error('[LearnerContext] updateLearner error:', err);
    }
  }, [filterLearnersForUser, setLearners]);

  const deleteLearner = useCallback(async (admissionNumber: string) => {
      try {
        const rawStored = localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
        const currentStored = rawStored ? JSON.parse(rawStored) : [];
        
        // Find the learner to delete by admissionNumber
        const learnerToDelete = currentStored.find((l: any) => {
          const adm = String(l.admissionNumber || l.admission_number || l.admNo || l.admissionNo || '');
          const lId = String(l.id || l._id || '');
          return adm === admissionNumber || lId === admissionNumber || adm === String(admissionNumber) || lId === String(admissionNumber);
        });
  
        if (!learnerToDelete) {
          console.warn('[LearnerContext] Learner not found for deletion:', admissionNumber);
          return;
        }
  
        // Use purgeLearnerPermanently for unified deletion across all storage layers
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
      const rawStored = localStorage.getItem(STORAGE_KEY_LEARNERS_V2);
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (Array.isArray(parsed)) {
          setLearners(filterLearnersForUser(parsed));
          return;
        }
      }
      const rawAll = CentralDataService.getLearners() || [];
      setLearners(filterLearnersForUser(rawAll));
    } catch {
      setLearners(filterLearnersForUser([]));
    }
  }, [filterLearnersForUser, setLearners]);

  const resetToSeedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_LEARNERS_V2);
    localStorage.removeItem('school_learners_data');
    localStorage.removeItem('munyaka_students');
    localStorage.removeItem('cached_learners');

    const seedStudents = (initialSeedData as any).students || (initialSeedData as any).learners || [];
    const seedList = dedupeLearnersById(seedStudents.map(formatLearnerDoc));

    localStorage.setItem(STORAGE_KEY_LEARNERS_V2, JSON.stringify(seedList));
    localStorage.setItem('school_learners_data', JSON.stringify(seedList));
    localStorage.setItem('munyaka_students', JSON.stringify(seedList));
    localStorage.setItem('cached_learners', JSON.stringify(seedList));

    setLearners(filterLearnersForUser(seedList));
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
