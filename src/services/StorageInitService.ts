import { INITIAL_SEED_DATA } from '../data/initialSeedData';

const SEED_VERSION_KEY = 'seed_version';
const CURRENT_SEED_VERSION = 'v_latest';

/**
 * Initializes localStorage with data from INITIAL_SEED_DATA if empty or out-of-date (version check).
 * Ensures APK compilation always has correct initial seed data.
 */
export function initializeAppStorage() {
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
    
    // Check if version matches or storage is uninitialized
    const learnersStored = localStorage.getItem('school_learners_data');
    const staffStored = localStorage.getItem('munyaka_staff_directory');
    
    if (storedVersion !== CURRENT_SEED_VERSION || !learnersStored || !staffStored) {
      console.log(`[StorageSync] Initializing/Updating storage to version ${CURRENT_SEED_VERSION}...`);
      
      // Store learners
      if (INITIAL_SEED_DATA.students && INITIAL_SEED_DATA.students.length > 0) {
        localStorage.setItem('school_learners_data', JSON.stringify(INITIAL_SEED_DATA.students));
        localStorage.setItem('munyaka_students', JSON.stringify(INITIAL_SEED_DATA.students));
      }
      
      // Store staff directory
      if (INITIAL_SEED_DATA.staff && INITIAL_SEED_DATA.staff.length > 0) {
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(INITIAL_SEED_DATA.staff));
      }
      
      // Store staff prereg
      if (INITIAL_SEED_DATA.staffPrereg && INITIAL_SEED_DATA.staffPrereg.length > 0) {
        localStorage.setItem('munyaka_staff_prereg', JSON.stringify(INITIAL_SEED_DATA.staffPrereg));
      }
      
      // Set version tag
      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
      console.log('[StorageSync] Storage initialization complete.');
    }
  } catch (e) {
    console.error('[StorageSync] Failed to initialize storage from seed data:', e);
  }
}
