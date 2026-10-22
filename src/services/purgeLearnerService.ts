import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';
const DELETED_IDS_KEY = 'deleted_learner_ids';
const LEARNER_ID_PREFIX = 'learner-';

/**
 * Strips the canonical `learner-` prefix so a legacy numeric id ('1789876543210')
 * and a prefixed id ('learner-1789876543210') resolve to the same bare key.
 */
export const toRawLearnerId = (value: any): string => {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (text.startsWith(LEARNER_ID_PREFIX)) {
    return text.slice(LEARNER_ID_PREFIX.length).trim();
  }
  return text;
};

/**
 * Every document id a learner may have been written under.
 */
export const getLearnerDocIdVariants = (learner: any): string[] => {
  if (!learner) return [];
  const source = learner.id ?? learner._id ?? learner.learnerId ?? learner.documentId;
  const rawId = toRawLearnerId(source);
  const variants: string[] = [];
  if (rawId) variants.push(rawId);
  if (rawId) variants.push(LEARNER_ID_PREFIX + rawId);
  const original = String(source ?? '').trim();
  if (original && variants.indexOf(original) === -1) variants.push(original);
  return variants.filter(Boolean);
};

/**
 * Tracks deleted identifiers so the Firestore listener never re-hydrates a purged
 * record. Both the bare and the `learner-` prefixed forms are stored.
 */
export const trackDeletedId = (learner: any) => {
  if (!learner) return;
  try {
    const deletedSet = new Set(JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]'));
    const targetAdm = String(learner.admissionNo || learner.admissionNumber || learner.admNo || '').trim();
    const targetAssess = String(learner.assessmentNo || learner.assessmentNumber || '').trim();

    getLearnerDocIdVariants(learner).forEach((id) => deletedSet.add(id));
    if (targetAdm) deletedSet.add(targetAdm);
    if (targetAssess) deletedSet.add(targetAssess);

    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch {}
};

export const purgeLearnerPermanently = async (targetLearner: any, setLearnersList?: (list: any[]) => void) => {
  if (!targetLearner) return [];

  // Standardize raw numeric ID vs prefixed ID
  const sourceId = targetLearner.id || targetLearner._id || targetLearner.learnerId || targetLearner.documentId || '';
  const rawId = toRawLearnerId(sourceId);
  const prefixedId = rawId ? LEARNER_ID_PREFIX + rawId : '';
  const targetAdm = String(targetLearner.admissionNo || targetLearner.admissionNumber || targetLearner.admNo || '').trim();
  const targetAssess = String(targetLearner.assessmentNo || targetLearner.assessmentNumber || '').trim();

  // 1. Target BOTH document ID variations in Firestore
  const targetDocIds = Array.from(new Set([rawId, prefixedId, String(sourceId).trim()])).filter(Boolean);

  if (db) {
    for (const docId of targetDocIds) {
      try {
        await deleteDoc(doc(db, 'learners', docId));
        console.log('[Firestore Delete] Successfully removed document: ' + docId);
      } catch (e) {
        console.warn('[Firestore Delete] Cloud delete attempted for ' + docId + ':', e);
      }
    }

    if (targetAdm) {
      try {
        await deleteDoc(doc(db, 'learners', targetAdm));
      } catch (e) {
        console.warn('[Firestore Delete] Cloud delete attempted for ' + targetAdm + ':', e);
      }
    }
  }

  // 2. Track deleted IDs to prevent snapshot re-hydration
  const existingDeleted = new Set(JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]'));
  targetDocIds.forEach((id) => existingDeleted.add(id));
  if (rawId) existingDeleted.add(rawId);
  if (prefixedId) existingDeleted.add(prefixedId);
  if (targetAdm) existingDeleted.add(targetAdm);
  if (targetAssess) existingDeleted.add(targetAssess);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(existingDeleted)));

  // 3. Purge from Central Local Storage (`munyaka_learners_v2`)
  let existingRecords: any[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(UNIFIED_STORAGE_KEY) || '[]');
    if (Array.isArray(parsed)) existingRecords = parsed;
  } catch {
    existingRecords = [];
  }

  const filteredLocal = existingRecords.filter((item: any) => {
    if (!item) return false;
    const itemRawId = toRawLearnerId(item.id || item._id || item.learnerId || item.documentId || '');
    const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '').trim();
    const itemAssess = String(item.assessmentNo || item.assessmentNumber || '').trim();

    const isMatch =
      (rawId && itemRawId === rawId) ||
      (targetAdm && itemAdm === targetAdm) ||
      (targetAssess && itemAssess === targetAssess);

    return !isMatch;
  });

  localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(filteredLocal));

  // 4. Wipe legacy cache keys so nothing can re-seed the purged learner
  ['cached_learners', 'students', 'learners', 'school_learners', 'munyaka_students', 'school_learners_data'].forEach((key) => {
    localStorage.removeItem(key);
  });

  // 5. Update UI state directly if setter provided
  if (setLearnersList && typeof setLearnersList === 'function') {
    setLearnersList(filteredLocal);
  }

  // 6. Broadcast global refresh events
  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));

  return filteredLocal;
};
