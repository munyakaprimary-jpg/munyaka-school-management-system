import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Sanitizes a learner object to ensure single field names instead of duplicated aliases
 * before syncing to Firestore.
 * 
 * Standardized schema:
 * - id: unique identifier
 * - admissionNo: admission number (from admissionNo, admNo, or admissionNumber)
 * - assessmentNo: assessment number (from assessmentNo, assessment, or assessmentNumber)
 * - fullName: full name (from fullName or name)
 * - gender: gender (defaults to 'Male')
 * - grade: grade level
 * - guardian: guardian info
 * - createdAt: creation timestamp
 */
export const sanitizeLearnerForFirestore = (learner: any): any => {
  if (!learner) return null;

  return {
    id: learner.id || `learner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    admissionNo: learner.admissionNo || learner.admNo || learner.admissionNumber || '',
    assessmentNo: learner.assessmentNo || learner.assessment || learner.assessmentNumber || '',
    fullName: learner.fullName || learner.name || '',
    gender: learner.gender || 'Male',
    grade: learner.grade || '',
    guardian: learner.guardian || '',
    createdAt: learner.createdAt || new Date().toISOString()
  };
};

/**
 * Syncs a single learner to Firestore 'learners' collection.
 * Sanitizes the learner object first to ensure consistent schema.
 * 
 * @param learner - The learner object from local storage
 * @returns Promise that resolves when the sync is complete
 */
export const syncLearnerToFirestore = async (learner: any): Promise<void> => {
  const cleanLearner = sanitizeLearnerForFirestore(learner);
  
  if (!cleanLearner) {
    console.warn('[firebaseSync] Invalid learner object, skipping sync');
    return;
  }

  // Use a consistent document ID format: learner-{id}
  const docId = `learner-${cleanLearner.id}`;
  
  try {
    await setDoc(doc(db, 'learners', docId), cleanLearner, { merge: true });
    console.log(`[firebaseSync] Synced learner ${cleanLearner.id} to Firestore`);
  } catch (error) {
    console.error('[firebaseSync] Failed to sync learner to Firestore:', error);
    throw error;
  }
};

/**
 * Syncs multiple learners to Firestore in batch.
 * 
 * @param learners - Array of learner objects from local storage
 * @returns Promise that resolves with count of successfully synced learners
 */
export const syncLearnersToFirestore = async (learners: any[]): Promise<number> => {
  if (!Array.isArray(learners) || learners.length === 0) {
    return 0;
  }

  let successCount = 0;
  
  for (const learner of learners) {
    try {
      await syncLearnerToFirestore(learner);
      successCount++;
    } catch (error) {
      console.error('[firebaseSync] Failed to sync learner:', learner?.id, error);
    }
  }

  console.log(`[firebaseSync] Successfully synced ${successCount}/${learners.length} learners to Firestore`);
  return successCount;
};

/**
 * Fetches all learners from Firestore 'learners' collection.
 * 
 * @returns Promise that resolves with array of learner objects
 */
export const fetchLearnersFromFirestore = async (): Promise<any[]> => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const querySnapshot = await getDocs(collection(db, 'learners'));
    const learners: any[] = [];
    
    querySnapshot.forEach((docSnap) => {
      learners.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    console.log(`[firebaseSync] Fetched ${learners.length} learners from Firestore`);
    return learners;
  } catch (error) {
    console.error('[firebaseSync] Failed to fetch learners from Firestore:', error);
    return [];
  }
};