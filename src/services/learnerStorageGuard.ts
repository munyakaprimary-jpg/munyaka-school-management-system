import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const UNIFIED_STORAGE_KEY = 'munyaka_learners_v2';

export const registerLearnerGuarded = async (newLearnerData: any) => {
  // A. Validate mandatory fields
  if (!newLearnerData.name && !newLearnerData.fullName) {
    throw new Error("Registration Guard Blocked: Learner name is required.");
  }

  // Clean inputs
  const cleanAssessmentNo = newLearnerData.assessmentNumber?.trim().toUpperCase() || newLearnerData.assessmentNo?.trim().toUpperCase();
  const cleanBirthCertNo = newLearnerData.birthCertificateNo?.trim().toUpperCase();

  // Load existing records from munyaka_learners and munyaka_learners_v2
  let currentRecords: any[] = [];
  try {
    const rawV2 = localStorage.getItem(UNIFIED_STORAGE_KEY);
    const rawLegacy = localStorage.getItem('munyaka_learners');
    if (rawV2) {
      currentRecords = JSON.parse(rawV2);
    } else if (rawLegacy) {
      currentRecords = JSON.parse(rawLegacy);
    }
    if (!Array.isArray(currentRecords)) currentRecords = [];
  } catch {
    currentRecords = [];
  }

  // 1. Check for duplicate Assessment Number
  if (cleanAssessmentNo) {
    const duplicateAssessment = currentRecords.find(
      (l: any) => {
        const existingAssessment = (l.assessmentNumber || l.assessmentNo)?.trim().toUpperCase();
        return existingAssessment && existingAssessment === cleanAssessmentNo;
      }
    );
    if (duplicateAssessment) {
      const learnerName = duplicateAssessment.fullName || duplicateAssessment.name || 'Unknown Learner';
      const learnerGrade = duplicateAssessment.grade || duplicateAssessment.gradeLevel || 'Unknown Grade';
      throw new Error(`Registration Blocked: A learner with Assessment No "${cleanAssessmentNo}" is already registered (${learnerName}, ${learnerGrade}).`);
    }
  }

  // 2. Check for duplicate Birth Certificate Number
  if (cleanBirthCertNo) {
    const duplicateBirthCert = currentRecords.find(
      (l: any) => {
        const existingBirthCert = l.birthCertificateNo?.trim().toUpperCase();
        return existingBirthCert && existingBirthCert === cleanBirthCertNo;
      }
    );
    if (duplicateBirthCert) {
      const learnerName = duplicateBirthCert.fullName || duplicateBirthCert.name || 'Unknown Learner';
      const learnerGrade = duplicateBirthCert.grade || duplicateBirthCert.gradeLevel || 'Unknown Grade';
      throw new Error(`Registration Blocked: A learner with Birth Certificate No "${cleanBirthCertNo}" is already registered (${learnerName}, ${learnerGrade}).`);
    }
  }

  // B. Standardize Learner Record Schema
  const learnerId = String(newLearnerData.id || `LRN-${Date.now()}`);
  const genAdm = newLearnerData.admissionNo || newLearnerData.admissionNumber || newLearnerData.admNo || `MUN/${newLearnerData.grade || newLearnerData.gradeLevel || 'Grade'}/${Math.floor(1000 + Math.random() * 9000)}`;

  const formattedLearner = {
    ...newLearnerData,
    id: learnerId,
    name: (newLearnerData.name || newLearnerData.fullName || '').trim(),
    fullName: (newLearnerData.fullName || newLearnerData.name || '').trim(),
    admissionNo: genAdm,
    admissionNumber: genAdm,
    admNo: genAdm,
    assessmentNumber: cleanAssessmentNo,
    assessmentNo: cleanAssessmentNo,
    birthCertificateNo: cleanBirthCertNo,
    createdAt: newLearnerData.createdAt || new Date().toISOString()
  };

  // C. STRICT GUARD: Write exclusively to UNIFIED_STORAGE_KEY
  let currentRecords: any[] = [];
  try {
    currentRecords = JSON.parse(localStorage.getItem(UNIFIED_STORAGE_KEY) || '[]');
    if (!Array.isArray(currentRecords)) currentRecords = [];
  } catch {
    currentRecords = [];
  }
  
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

  // Save to unified local storage
  localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(updatedRecords));

  // D. STRICT GUARD: Purge any attempt to save into legacy keys
  ['cached_learners', 'students', 'learners', 'school_learners', 'school_learners_data', 'munyaka_students'].forEach((legacyKey) => {
    localStorage.removeItem(legacyKey);
  });

  // E. Sync to Firestore central database
  if (db) {
    try {
      await setDoc(doc(db, "learners", learnerId), formattedLearner, { merge: true });
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
