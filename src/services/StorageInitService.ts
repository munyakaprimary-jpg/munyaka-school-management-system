import { INITIAL_SEED_DATA } from '../data/initialSeedData';

const SEED_VERSION_KEY = 'app_seed_version';
const CURRENT_SEED_VERSION = 'v_full_sync_v1';

/**
 * Initializes localStorage with data from INITIAL_SEED_DATA if empty or out-of-date (version check).
 * Ensures APK compilation always has correct initial seed data across all keys.
 */
export function initializeAppStorage() {
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
    
    // If app_seed_version does not match v_full_sync_v1, clear and write every key from INITIAL_SEED_DATA
    if (storedVersion !== CURRENT_SEED_VERSION) {
      console.log(`[StorageSync] Forcing root data seeding to version ${CURRENT_SEED_VERSION}...`);
      
      localStorage.clear();
      
      // 1. If localStorageSnapshot dictionary is present, write every key directly
      if (INITIAL_SEED_DATA.localStorageSnapshot && typeof INITIAL_SEED_DATA.localStorageSnapshot === 'object') {
        Object.entries(INITIAL_SEED_DATA.localStorageSnapshot).forEach(([key, val]) => {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        });
      }
      
      // 2. Also ensure standard keys are correctly populated from top-level properties
      if (INITIAL_SEED_DATA.students) {
        localStorage.setItem('school_learners_data', JSON.stringify(INITIAL_SEED_DATA.students));
        localStorage.setItem('munyaka_students', JSON.stringify(INITIAL_SEED_DATA.students));
      }
      if (INITIAL_SEED_DATA.staff) {
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(INITIAL_SEED_DATA.staff));
      }
      if (INITIAL_SEED_DATA.staffPrereg) {
        localStorage.setItem('munyaka_staff_prereg', JSON.stringify(INITIAL_SEED_DATA.staffPrereg));
      }
      if (INITIAL_SEED_DATA.fees) {
        localStorage.setItem('munyaka_fees_records', JSON.stringify(INITIAL_SEED_DATA.fees));
      }
      if (INITIAL_SEED_DATA.transactions) {
        localStorage.setItem('munyaka_transactions', JSON.stringify(INITIAL_SEED_DATA.transactions));
      }
      if (INITIAL_SEED_DATA.attendance) {
        localStorage.setItem('munyaka_attendance_records', JSON.stringify(INITIAL_SEED_DATA.attendance));
      }
      if (INITIAL_SEED_DATA.grades) {
        localStorage.setItem('munyaka_grades', JSON.stringify(INITIAL_SEED_DATA.grades));
      }
      if (INITIAL_SEED_DATA.examTypes) {
        localStorage.setItem('munyaka_exam_types', JSON.stringify(INITIAL_SEED_DATA.examTypes));
      }
      if (INITIAL_SEED_DATA.learningAreas) {
        localStorage.setItem('munyaka_learning_areas', JSON.stringify(INITIAL_SEED_DATA.learningAreas));
      }
      if (INITIAL_SEED_DATA.assessmentScores) {
        localStorage.setItem('munyaka_assessment_scores', JSON.stringify(INITIAL_SEED_DATA.assessmentScores));
      }
      if (INITIAL_SEED_DATA.libraryBooks) {
        localStorage.setItem('munyaka_library_books', JSON.stringify(INITIAL_SEED_DATA.libraryBooks));
      }
      if (INITIAL_SEED_DATA.ictAssets) {
        localStorage.setItem('munyaka_ict_assets', JSON.stringify(INITIAL_SEED_DATA.ictAssets));
      }
      if (INITIAL_SEED_DATA.settings) {
        localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(INITIAL_SEED_DATA.settings));
      }
      
      // Update version tag
      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
      console.log('[StorageSync] Root data seeding complete (v_full_sync_v1).');
    }
  } catch (e) {
    console.error('[StorageSync] Failed to initialize storage from seed data:', e);
  }
}
