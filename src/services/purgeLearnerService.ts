import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';
const DELETED_IDS_KEY = 'deleted_learner_ids';

export const trackDeletedId = (learner: any) => {
  if (!learner) return;
  try {
    const deletedSet = new Set(JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]'));
    const targetId = String(learner.id || learner._id || '').trim();
    const targetAdm = String(learner.admissionNo || learner.admissionNumber || learner.admNo || '').trim();
    const targetAssess = String(learner.assessmentNo || learner.assessmentNumber || '').trim();

    if (targetId) deletedSet.add(targetId);
    if (targetAdm) deletedSet.add(targetAdm);
    if (targetAssess) deletedSet.add(targetAssess);

    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
};

export const purgeLearnerPermanently = async (targetLearner: any, setLearnersList?: (list: any[]) => void) => {
  if (!targetLearner) return [];

  // Extract all identifier keys
  const targetId = String(targetLearner.id || targetLearner._id || '').trim();
  const targetAdm = String(targetLearner.admissionNo || targetLearner.admissionNumber || targetLearner.admNo || '').trim();
  const targetAssess = String(targetLearner.assessmentNo || targetLearner.assessmentNumber || '').trim();

  // A. Track deleted identifiers to block Firestore listener re-hydration
  trackDeletedId(targetLearner);

  // B. Route Deletion directly through CENTRAL STORAGE KEY
  let existingRecords: any[] = [];
  try {
    existingRecords = JSON.parse(localStorage.getItem(UNIFIED_STORAGE_KEY) || localStorage.getItem('cached_learners') || '[]');
    if (!Array.isArray(existingRecords)) existingRecords = [];
  } catch {
    existingRecords = [];
  }
  
  const remainingRecords = existingRecords.filter((item: any) => {
    if (!item) return false;
    const itemId = String(item.id || item._id || '').trim();
    const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
    const itemAssess = String(item.assessmentNo || item.assessmentNumber || '').trim();

    const isMatch =
      (targetId && itemId === targetId) ||
      (targetAdm && itemAdm === targetAdm) ||
      (targetAssess && itemAssess === targetAssess);

    return !isMatch; // Retain only non-matching records
  });

  // Commit clean list back to central storage
  localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(remainingRecords));

  // C. Wipe legacy cache keys
  ['cached_learners', 'students', 'learners', 'school_learners', 'munyaka_students', 'school_learners_data'].forEach((key) => {
    localStorage.removeItem(key);
  });

  // D. Execute Physical Cloud Deletion in Firestore
  if (db && targetId) {
    try {
      await deleteDoc(doc(db, "learners", targetId));
      if (targetId.startsWith('learner-')) {
        const rawNumeric = targetId.replace('learner-', '');
        await deleteDoc(doc(db, "learners", rawNumeric)).catch(() => {});
      }
    } catch (cloudErr) {
      console.warn("[Storage Purge] Offline mode active; local record permanently purged:", cloudErr);
    }
  }

  if (db && targetAdm) {
    try {
      await deleteDoc(doc(db, "learners", targetAdm)).catch(() => {});
    } catch {}
  }

  // E. Update UI state directly if setter provided
  if (setLearnersList && typeof setLearnersList === 'function') {
    setLearnersList(remainingRecords);
  }

  // F. Broadcast mandatory state refresh event
  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));

  return remainingRecords;
};
