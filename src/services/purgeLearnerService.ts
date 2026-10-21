import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const purgeLearnerRecord = async (targetLearner: any, setLearnersList?: (list: any[]) => void) => {
  if (!targetLearner) return;

  const targetId = String(targetLearner.id || targetLearner._id || targetLearner.learnerId || '');
  const targetAdm = String(targetLearner.admissionNo || targetLearner.admissionNumber || targetLearner.admNo || '');
  const targetAssess = String(targetLearner.assessmentNo || targetLearner.assessmentNumber || '');

  // 1. Purge from primary unified localStorage key
  const UNIFIED_KEY = 'munyaka_learners_v2';
  let existing: any[] = [];
  try {
    existing = JSON.parse(localStorage.getItem(UNIFIED_KEY) || localStorage.getItem('cached_learners') || '[]');
  } catch {
    existing = [];
  }
  
  const purgedList = existing.filter((item: any) => {
    if (!item) return false;
    const itemId = String(item.id || item._id || item.learnerId || '');
    const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '');
    const itemAssess = String(item.assessmentNo || item.assessmentNumber || '');

    const isMatch = 
      (targetId && itemId === targetId) ||
      (targetAdm && itemAdm === targetAdm) ||
      (targetAssess && itemAssess === targetAssess);

    return !isMatch; // Keep only non-matching records
  });

  localStorage.setItem(UNIFIED_KEY, JSON.stringify(purgedList));

  // 2. Clear legacy storage keys to prevent re-hydration
  ['munyaka_students', 'cached_learners', 'learners', 'students', 'school_learners', 'school_learners_data'].forEach((key) => {
    const legacyData = localStorage.getItem(key);
    if (legacyData) {
      try {
        const legacyList = JSON.parse(legacyData);
        if (Array.isArray(legacyList)) {
          const filtered = legacyList.filter((item: any) => {
            if (!item) return false;
            const itemId = String(item.id || item._id || item.learnerId || '');
            const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '');
            const isMatch = 
              (targetId && itemId === targetId) ||
              (targetAdm && itemAdm === targetAdm);
            return !isMatch;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}
    }
  });

  // 3. Delete document from Firestore
  if (targetId) {
    try {
      await deleteDoc(doc(db, "learners", targetId));
      if (targetId.startsWith('learner-')) {
        const rawNumeric = targetId.replace('learner-', '');
        await deleteDoc(doc(db, "learners", rawNumeric)).catch(() => {});
      }
    } catch (cloudErr) {
      console.warn("[Firestore] Deletion completed locally (offline):", cloudErr);
    }
  }

  if (targetAdm) {
    try {
      await deleteDoc(doc(db, "learners", targetAdm)).catch(() => {});
    } catch {}
  }

  // 4. Direct UI State Mutation if provided
  if (setLearnersList && typeof setLearnersList === 'function') {
    setLearnersList(purgedList);
  }

  // 5. Broadcast global refresh event
  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));
};
