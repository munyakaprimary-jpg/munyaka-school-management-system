import { INITIAL_SEED_DATA } from '../data/initialSeedData';

const SEED_VERSION_KEY = 'app_seed_version';
const CURRENT_SEED_VERSION = 'v_full_sync_v2';

/**
 * Storage Initialization Service
 * ────────────────────────────────────────────────────────────────
 * Initializes localStorage with the latest dataset from INITIAL_SEED_DATA
 * whenever the app version stored in `app_seed_version` does not match
 * the current `CURRENT_SEED_VERSION`.
 *
 * This guarantees that:
 *  - Fresh APK installs always have the correct baseline (14 learners, 6 staff, etc.)
 *  - When the seed file is updated, the next app launch will rehydrate
 *    the new baseline so existing builds pick up new defaults.
 *  - All keys used across the application are populated with the same
 *    shape of data so every hook/component gets a consistent view.
 */
export function initializeAppStorage(): void {
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);

    // If the app has already been initialized at the current seed version,
    // there is nothing to do — preserve any user data already entered.
    if (storedVersion === CURRENT_SEED_VERSION) {
      return;
    }

    console.log(
      `[StorageSync] Seeding localStorage with version ${CURRENT_SEED_VERSION} ` +
      `(previous: ${storedVersion ?? 'none'})...`
    );

    // ── 1. Persist every top-level entity in INITIAL_SEED_DATA ────────────
    // Each block writes to BOTH the canonical key and any legacy mirror
    // keys that older code paths may read from.

    // Students / Learners
    if (Array.isArray(INITIAL_SEED_DATA.students) && INITIAL_SEED_DATA.students.length > 0) {
      localStorage.setItem('school_learners_data', JSON.stringify(INITIAL_SEED_DATA.students));
      localStorage.setItem('munyaka_students', JSON.stringify(INITIAL_SEED_DATA.students));
    }

    // Staff
    if (Array.isArray(INITIAL_SEED_DATA.staff) && INITIAL_SEED_DATA.staff.length > 0) {
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(INITIAL_SEED_DATA.staff));
      localStorage.setItem('munyaka_staff', JSON.stringify(INITIAL_SEED_DATA.staff));
    }

    // Staff Pre-Registration
    if (Array.isArray(INITIAL_SEED_DATA.staffPrereg) && INITIAL_SEED_DATA.staffPrereg.length > 0) {
      localStorage.setItem('munyaka_staff_prereg', JSON.stringify(INITIAL_SEED_DATA.staffPrereg));
    }

    // Fees / Fee Ledgers
    if (Array.isArray(INITIAL_SEED_DATA.fees)) {
      localStorage.setItem('munyaka_fees_records', JSON.stringify(INITIAL_SEED_DATA.fees));
      localStorage.setItem('munyaka_student_fees', JSON.stringify(INITIAL_SEED_DATA.fees));
    }

    // Fee Structures
    if (Array.isArray(INITIAL_SEED_DATA.feeStructures)) {
      localStorage.setItem('munyaka_fee_structures', JSON.stringify(INITIAL_SEED_DATA.feeStructures));
    }

    // Transactions
    if (Array.isArray(INITIAL_SEED_DATA.transactions)) {
      localStorage.setItem('munyaka_transactions', JSON.stringify(INITIAL_SEED_DATA.transactions));
    }

    // Attendance
    if (INITIAL_SEED_DATA.attendance) {
      localStorage.setItem('munyaka_attendance_records', JSON.stringify(INITIAL_SEED_DATA.attendance));
    }

    // Grades / Classes
    if (Array.isArray(INITIAL_SEED_DATA.grades)) {
      localStorage.setItem('munyaka_grades', JSON.stringify(INITIAL_SEED_DATA.grades));
    }

    // Exam Types
    if (Array.isArray(INITIAL_SEED_DATA.examTypes)) {
      localStorage.setItem('munyaka_exam_types', JSON.stringify(INITIAL_SEED_DATA.examTypes));
    }

    // Learning Areas
    if (Array.isArray(INITIAL_SEED_DATA.learningAreas)) {
      localStorage.setItem('munyaka_learning_areas', JSON.stringify(INITIAL_SEED_DATA.learningAreas));
    }

    // Assessment Scores
    if (INITIAL_SEED_DATA.assessmentScores) {
      localStorage.setItem('munyaka_assessment_scores', JSON.stringify(INITIAL_SEED_DATA.assessmentScores));
    }

    // Library Books
    if (Array.isArray(INITIAL_SEED_DATA.libraryBooks)) {
      localStorage.setItem('munyaka_library_books', JSON.stringify(INITIAL_SEED_DATA.libraryBooks));
    }

    // ICT Assets
    if (Array.isArray(INITIAL_SEED_DATA.ictAssets)) {
      localStorage.setItem('munyaka_ict_assets', JSON.stringify(INITIAL_SEED_DATA.ictAssets));
    }

    // Notices / Announcements
    if (Array.isArray(INITIAL_SEED_DATA.notices)) {
      localStorage.setItem('munyaka_notices', JSON.stringify(INITIAL_SEED_DATA.notices));
    }

    // System Settings
    if (INITIAL_SEED_DATA.settings) {
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(INITIAL_SEED_DATA.settings));
    }

    // ── 2. Mark the current seed version so the next launch is a no-op ──
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
    console.log(
      `[StorageSync] Root data seeding complete (${CURRENT_SEED_VERSION}). ` +
      `Baseline: ${INITIAL_SEED_DATA.students?.length ?? 0} students, ` +
      `${INITIAL_SEED_DATA.staff?.length ?? 0} staff.`
    );
  } catch (e) {
    console.error('[StorageSync] Failed to initialize storage from seed data:', e);
  }
}

/**
 * Force a full re-seed of the storage. Used by the Central Data Service
 * when an admin explicitly re-imports a seed bundle.
 */
export function forceReseedFromSeed(): void {
  try {
    localStorage.removeItem(SEED_VERSION_KEY);
  } catch {
    /* no-op */
  }
  initializeAppStorage();
}
