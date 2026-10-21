import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export const purgeLearnerPermanently = async (targetLearner: any, setLearnersList?: (list: any[]) => void) => {
  if (!targetLearner) return;

  const targetId = String(targetLearner.id || targetLearner._id || targetLearner.learnerId || '').trim();
  const targetAdm = String(targetLearner.admissionNo || targetLearner.admissionNumber || targetLearner.admNo || '').trim();
  const targetAssess = String(targetLearner.assessmentNo || targetLearner.assessmentNumber || '').trim();

  // 1. Purge from primary unified storage
  const UNIFIED_KEY = 'munyaka_learners_v2';
  let currentUnified: any[] = [];
  try {
    currentUnified = JSON.parse(localStorage.getItem(UNIFIED_KEY) || localStorage.getItem('cached_learners') || '[]');
  } catch {
    currentUnified = [];
  }
  
  const cleanUnifiedList = currentUnified.filter((item: any) => {
    if (!item) return false;
    const itemId = String(item.id || item._id || item.learnerId || '').trim();
    const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
    const itemAssess = String(item.assessmentNo || item.assessmentNumber || '').trim();

    const isMatch = 
      (targetId && itemId === targetId) ||
      (targetAdm && itemAdm === targetAdm) ||
      (targetAssess && itemAssess === targetAssess);

    return !isMatch;
  });

  localStorage.setItem(UNIFIED_KEY, JSON.stringify(cleanUnifiedList));

  // 2. Wipe across legacy cache keys to prevent re-hydration
  ['munyaka_students', 'cached_learners', 'learners', 'students', 'school_learners', 'school_learners_data'].forEach((key) => {
    const legacyData = localStorage.getItem(key);
    if (legacyData) {
      try {
        const legacyList = JSON.parse(legacyData);
        if (Array.isArray(legacyList)) {
          const filtered = legacyList.filter((item: any) => {
            if (!item) return false;
            const itemId = String(item.id || item._id || item.learnerId || '').trim();
            const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
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
      console.warn("[Firestore] Local purge completed; cloud delete offline:", cloudErr);
    }
  }

  if (targetAdm) {
    try {
      await deleteDoc(doc(db, "learners", targetAdm)).catch(() => {});
    } catch {}
  }

  // 4. Update UI state directly & dispatch update event
  if (setLearnersList && typeof setLearnersList === 'function') {
    setLearnersList(cleanUnifiedList);
  }

  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));
};
