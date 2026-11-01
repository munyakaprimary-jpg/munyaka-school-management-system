import { initialSeedData } from '@/data/initialSeedData';

/**
 * Ensures LocalStorage has default state initialized on first boot.
 * Does NOT auto-populate hardcoded students if storage is cleared.
 */
export const initializeCentralDb = () => {
  try {
    const existingDb = localStorage.getItem('munyaka_central_db');
    if (!existingDb) {
      const defaultDb = {
        learners: [],
        staff: initialSeedData.staff || [],
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
