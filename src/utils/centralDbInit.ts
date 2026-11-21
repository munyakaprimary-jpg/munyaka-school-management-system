import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Ensures LocalStorage has default state initialized on first boot and hydrates from Firestore root collections if empty.
 */
export const initializeCentralStorage = () => {
  initializeCentralDb();
  hydrateFromFirestoreIfEmpty();
};

export const hydrateFromFirestoreIfEmpty = async () => {
  if (typeof window === 'undefined') return;
  try {
    const learnersRaw = localStorage.getItem('munyaka_learners');
    const staffRaw = localStorage.getItem('munyaka_staff');

    const needsLearners = !learnersRaw || learnersRaw === '[]';
    const needsStaff = !staffRaw || staffRaw === '[]';

    if (needsLearners) {
      try {
        const snap = await getDocs(collection(db, 'learners'));
        if (!snap.empty) {
          const cloudLearners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          localStorage.setItem('munyaka_learners', JSON.stringify(cloudLearners));
          localStorage.setItem('munyaka_learners_v2', JSON.stringify(cloudLearners));
        }
      } catch (err) {
        console.warn('Could not hydrate learners from Firestore:', err);
      }
    }

    if (needsStaff) {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        if (!snap.empty) {
          const cloudStaff = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          localStorage.setItem('munyaka_staff', JSON.stringify(cloudStaff));
        }
      } catch (err) {
        console.warn('Could not hydrate staff from Firestore:', err);
      }
    }
  } catch (err) {
    console.warn('Hydration from Firestore failed:', err);
  }
};

export const initializeCentralDb = () => {
  try {
    const existingDb = localStorage.getItem('munyaka_central_db');
    if (!existingDb) {
      const defaultDb = {
        learners: [],
        staff: [],
        settings: {},
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('munyaka_central_db', JSON.stringify(defaultDb));
    }

    const existingLearners = localStorage.getItem('munyaka_learners_v2');
    if (!existingLearners) {
      localStorage.setItem('munyaka_learners_v2', JSON.stringify([]));
    }

    const existingLegacy = localStorage.getItem('munyaka_learners');
    if (!existingLegacy) {
      localStorage.setItem('munyaka_learners', JSON.stringify([]));
    }
  } catch (e) {
    console.warn('[initializeCentralDb] Error initializing storage:', e);
  }
};