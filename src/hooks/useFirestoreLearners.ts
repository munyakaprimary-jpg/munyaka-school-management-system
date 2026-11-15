import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { getStoredLearners, saveStoredLearners } from '@/context/LearnerContext';

export interface FirestoreLearner {
  id: string;
  admissionNo: string;
  admissionNumber?: string;
  admNo?: string;
  fullName?: string;
  name?: string;
  studentName?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  dob?: string;
  guardianName?: string;
  guardianPhone?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

const LOCAL_STORAGE_KEY = 'munyaka_learners_directory';

export const normalizeFirestoreLearner = (docId: string, data: any): FirestoreLearner => {
  const admissionNo = String(
    data.admissionNo || data.admissionNumber || data.admNo || data.id || docId || ''
  ).trim();
  const fullName = String(
    data.fullName || data.name || data.studentName || data.student_name || ''
  ).trim();
  const grade = String(data.grade || data.gradeLevel || data.class || '').trim();
  const stream = String(data.stream || data.streamName || '').trim();
  const gender = String(data.gender || data.sex || '').trim();

  return {
    ...data,
    id: docId || data.id || admissionNo,
    admissionNo,
    admissionNumber: admissionNo,
    admNo: admissionNo,
    fullName: fullName || 'Unnamed Learner',
    name: fullName || 'Unnamed Learner',
    grade: grade || 'Grade 1',
    stream: stream || 'East',
    gender: gender || 'Other'
  };
};

/**
 * Hook to subscribe to real-time learner records from Firestore `"learners"` collection,
 * sorted by `admissionNo` and optionally filtered by grade and stream.
 * Maintains offline persistence and synchronizes with localStorage.
 */
export function useFirestoreLearners(selectedGrade?: string, selectedStream?: string) {
  const [learners, setLearners] = useState<FirestoreLearner[]>(() => {
    try {
      const stored = getStoredLearners();
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map(l => normalizeFirestoreLearner(l.id, l));
      }
    } catch (e) {
      console.error('[useFirestoreLearners] Initial load error:', e);
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      const learnersRef = collection(db, 'learners');
      // Sort by admissionNo in Firestore query
      const q = query(learnersRef, orderBy('admissionNo', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const list: FirestoreLearner[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push(normalizeFirestoreLearner(docSnap.id, data));
          });

          // Fallback sort if admissionNo sorting in query had missing fields
          list.sort((a, b) => (a.admissionNo || '').localeCompare(b.admissionNo || ''));

          setLearners(list);
          saveStoredLearners(list);
          setLoading(false);
          setError(null);

          // Broadcast update event to other modules
          window.dispatchEvent(new Event('munyaka_learners_updated'));
          window.dispatchEvent(new Event('munyaka:data-changed'));
        },
        (err) => {
          console.error('[useFirestoreLearners] Firestore snapshot error:', err);
          if (!isMounted) return;
          setError(err.message);
          setLoading(false);

          // Fallback to local storage cache if offline/error
          try {
            const fallback = getStoredLearners();
            if (Array.isArray(fallback) && fallback.length > 0) {
              const normalized = fallback.map(l => normalizeFirestoreLearner(l.id, l));
              normalized.sort((a, b) => (a.admissionNo || '').localeCompare(b.admissionNo || ''));
              setLearners(normalized);
            }
          } catch (localErr) {
            console.error('[useFirestoreLearners] Fallback load error:', localErr);
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err: any) {
      console.error('[useFirestoreLearners] Setup error:', err);
      if (isMounted) {
        setError(err?.message || 'Failed to initialize Firestore listener');
        setLoading(false);
      }
    }
  }, []);

  // Filter learners by grade and stream if provided
  const filteredLearners = useMemo(() => {
    return learners.filter((learner) => {
      if (selectedGrade && selectedGrade !== 'all' && selectedGrade !== 'All Grades') {
        const lGrade = (learner.grade || '').trim().toLowerCase();
        const targetGrade = selectedGrade.trim().toLowerCase();
        if (lGrade !== targetGrade) return false;
      }

      if (selectedStream && selectedStream !== 'all' && selectedStream !== 'All Streams' && selectedStream !== 'All') {
        const lStream = (learner.stream || '').trim().toLowerCase();
        const targetStream = selectedStream.trim().toLowerCase();
        if (lStream !== targetStream) return false;
      }

      return true;
    });
  }, [learners, selectedGrade, selectedStream]);

  return {
    learners,
    filteredLearners,
    loading,
    error
  };
}
