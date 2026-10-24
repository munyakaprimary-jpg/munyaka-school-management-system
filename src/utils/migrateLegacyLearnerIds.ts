import { db } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export const migrateLegacyLearnerIds = async () => {
  try {
    console.log('[Firestore Purge] Scanning learners collection for legacy non-prefixed IDs...');
    const learnersRef = collection(db, 'learners');
    const snapshot = await getDocs(learnersRef);
    
    let purgedCount = 0;

    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      // Identify all documents whose Document ID does NOT start with 'learner-'
      if (!docId.startsWith('learner-')) {
        const oldDocRef = doc(db, 'learners', docId);
        await deleteDoc(oldDocRef);
        purgedCount++;
        console.log(`[Firestore Purge] Deleted legacy non-prefixed learner document ID: ${docId}`);
      }
    }

    console.log(`[Firestore Purge] Completed. Removed ${purgedCount} legacy documents.`);
    return { success: true, purgedCount };
  } catch (error) {
    console.error('[Firestore Purge Error] Failed to purge legacy IDs:', error);
    return { success: false, error };
  }
};
