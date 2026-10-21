import { db } from '../config/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

export const migrateLegacyLearnerIds = async () => {
  try {
    console.log('[Migration] Starting learner ID normalization...');
    const learnersRef = collection(db, 'learners');
    const snapshot = await getDocs(learnersRef);
    
    const batch = writeBatch(db);
    let migratedCount = 0;

    snapshot.docs.forEach((docSnap) => {
      const rawId = docSnap.id;
      const data = docSnap.data();

      // Check if ID is purely numeric (legacy format)
      if (/^\d+$/.test(rawId)) {
        const newStandardizedId = `learner-${rawId}`;
        
        // 1. Create new document with standardized ID
        const newDocRef = doc(db, 'learners', newStandardizedId);
        batch.set(newDocRef, {
          ...data,
          id: newStandardizedId,
          legacyId: rawId, // preserve trace of old ID
          updatedAt: new Date().toISOString()
        });

        // 2. Delete old legacy numeric document
        const oldDocRef = doc(db, 'learners', rawId);
        batch.delete(oldDocRef);

        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      await batch.commit();
      console.log(`[Migration Success] Standardized ${migratedCount} learner document IDs.`);
      return { success: true, count: migratedCount };
    } else {
      console.log('[Migration] All learner IDs are already standardized!');
      return { success: true, count: 0 };
    }
  } catch (error) {
    console.error('[Migration Error] Failed to normalize learner IDs:', error);
    return { success: false, error };
  }
};
