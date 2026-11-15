import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { syncLearnerToFirestore } from './firebaseSync';

const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';

export const registerLearnerGuarded = async (newLearnerData: any) => {
  // A. Validate mandatory fields
  if (!newLearnerData.name && !newLearnerData.fullName) {
    throw new Error("Registration Guard Blocked: Learner name is required.");
  }

  // B. Standardize Learner Record Schema
  const learnerId = String(newLearnerData.id || `learner-${Date.now()}`);
  const formattedLearner = {
    ...newLearnerData,
    id: learnerId,
    name: (newLearnerData.name || newLearnerData.fullName || '').trim(),
    fullName: (newLearnerData.fullName || newLearnerData.name || '').trim(),
    admissionNo: newLearnerData.admissionNo || newLearnerData.admissionNumber || newLearnerData.admNo || `MUN-${Date.now().toString().slice(-6)}`,
    admissionNumber: newLearnerData.admissionNo || newLearnerData.admissionNumber || newLearnerData.admNo || `MUN-${Date.now().toString().slice(-6)}`,
    createdAt: newLearnerData.createdAt || new Date().toISOString()
  };

  // C. STRICT GUARD: Write using mergeStoredLearners / saveMergedLearners
  const { mergeStoredLearners, saveMergedLearners } = await import('@/utils/learnerStorageMerge');
  const currentRecords = mergeStoredLearners();
  
  // Deduplicate by ID or Admission Number
  const updatedRecords = [
    formattedLearner,
    ...currentRecords.filter((item: any) => {
      if (!item) return false;
      const itemId = String(item.id || item._id || '');
      const itemAdm = String(item.admissionNo || item.admissionNumber || item.admNo || '');
      return itemId !== learnerId && itemAdm !== formattedLearner.admissionNo;
    })
  ];

  // Save to all unified storage keys
  saveMergedLearners(updatedRecords);

  // E. Sync to Firestore central database
    if (db) {
      try {
        await syncLearnerToFirestore(formattedLearner);
      } catch (cloudErr) {
        console.warn("[Storage Guard] Saved locally (offline-first mode):", cloudErr);
      }
    }

  // F. Dispatch global event to force instant refresh on LearnersDirectory
  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));

  return formattedLearner;
};
