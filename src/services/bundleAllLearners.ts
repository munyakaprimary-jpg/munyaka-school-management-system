import { db } from '../config/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { initialSeedData } from '../data/initialSeedData';

const CENTRAL_KEY = 'munyaka_learners_v2';
const LEGACY_KEYS = ['cached_learners', 'students', 'learners', 'school_learners', 'school_learners_data', 'munyaka_students'];

export const bundleAllLearnersToCentral = async () => {
  console.log("[Bundler] Starting migration & bundling of all registered learners...");

  const learnerMap = new Map<string, any>();

  const addLearnerToMap = (learner: any) => {
    if (!learner) return;

    // Create unique deduplication key based on admission number or ID
    const admKey = String(learner.admissionNo || learner.admissionNumber || learner.admNo || '').trim().toUpperCase();
    const idKey = String(learner.id || learner._id || '').trim();
    const mapKey = admKey || idKey || `temp-${Math.random()}`;

    if (!mapKey) return;

    const existing = learnerMap.get(mapKey) || {};

    // Standardize schema format
    const standardized = {
      ...existing,
      ...learner,
      id: learner.id || existing.id || `learner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: (learner.name || learner.fullName || existing.name || '').trim(),
      fullName: (learner.fullName || learner.name || existing.fullName || '').trim(),
      admissionNo: learner.admissionNo || learner.admissionNumber || existing.admissionNo || '',
      admissionNumber: learner.admissionNo || learner.admissionNumber || existing.admissionNumber || '',
      assessmentNo: learner.assessmentNo || learner.assessmentNumber || existing.assessmentNo || '',
      grade: learner.grade || existing.grade || 'Grade 1',
      stream: learner.stream || existing.stream || 'Green',
      updatedAt: new Date().toISOString()
    };

    learnerMap.set(mapKey, standardized);
  };

  // A. Gather from static seed data fallback
  const seedStudents = (initialSeedData as any)?.students || (initialSeedData as any)?.learners || [];
  if (Array.isArray(seedStudents)) {
    seedStudents.forEach(addLearnerToMap);
  }

  // B. Gather from all legacy local storage keys
  LEGACY_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(addLearnerToMap);
        }
      }
    } catch (e) {
      console.warn(`[Bundler] Error parsing legacy key ${key}:`, e);
    }
  });

  // C. Gather from active central storage key (`munyaka_learners_v2`)
  try {
    const existingCentral = localStorage.getItem(CENTRAL_KEY);
    if (existingCentral) {
      const parsed = JSON.parse(existingCentral);
      if (Array.isArray(parsed)) {
        parsed.forEach(addLearnerToMap);
      }
    }
  } catch (e) {
    console.warn("[Bundler] Error reading central key:", e);
  }

  // D. Gather from Cloud Firestore
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, "learners"));
      querySnapshot.forEach((docSnap) => {
        addLearnerToMap({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (cloudErr) {
      console.warn("[Bundler] Offline mode or cloud read error:", cloudErr);
    }
  }

  // E. Construct Consolidated Final Learner List
  const bundledLearners = Array.from(learnerMap.values());

  // F. Write exclusively to Central Storage Key
  localStorage.setItem(CENTRAL_KEY, JSON.stringify(bundledLearners));

  // G. Sync back to Firestore so cloud database is 100% up to date
  if (db) {
    for (const learner of bundledLearners) {
      if (learner.id) {
        try {
          await setDoc(doc(db, "learners", learner.id), learner, { merge: true });
        } catch (err) {
          // Continue offline sync
        }
      }
    }
  }

  // H. Clean up and wipe legacy storage keys
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

  // I. Dispatch global UI refresh
  window.dispatchEvent(new Event('learners_updated'));
  window.dispatchEvent(new Event('students-updated'));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka:data-changed'));

  console.log(`[Bundler] Successfully bundled ${bundledLearners.length} total learners into ${CENTRAL_KEY}!`);
  return bundledLearners;
};
