import { INITIAL_SEED_DATA } from '../data/initialSeedData';
import { lsSet, notifyDataChanged, lsRead } from '@/utils/storage';

const SEED_VERSION_KEY = 'app_seed_version';
const CURRENT_SEED_VERSION = 'v_full_sync_v3';

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
    // Use lsRead so the getItem is also guarded (handles blocked localStorage)
    const storedVersion = lsRead<string | null>(SEED_VERSION_KEY, null);

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
    // All lsSet calls are already try-catch wrapped internally.

    // Students / Learners — NEVER pre-seed. The app boots with an empty roster.
    lsSet('school_learners_data', []);
    lsSet('munyaka_students', []);

    // Staff — also starts empty. Staff are added via pre-registration and
    // the Add Staff modal (stored in the staff master service, not here).
    lsSet('munyaka_staff_directory', []);
    lsSet('munyaka_staff', []);

    // Staff Pre-Registration
    if (Array.isArray(INITIAL_SEED_DATA?.staffPrereg) && INITIAL_SEED_DATA.staffPrereg.length > 0) {
      lsSet('munyaka_staff_prereg', INITIAL_SEED_DATA.staffPrereg);
    }

    // Fees / Fee Ledgers
    if (Array.isArray(INITIAL_SEED_DATA?.fees)) {
      lsSet('munyaka_fees_records', INITIAL_SEED_DATA.fees);
      lsSet('munyaka_student_fees', INITIAL_SEED_DATA.fees);
    }

    // Fee Structures
    if (Array.isArray(INITIAL_SEED_DATA?.feeStructures)) {
      lsSet('munyaka_fee_structures', INITIAL_SEED_DATA.feeStructures);
    }

    // Transactions
    if (Array.isArray(INITIAL_SEED_DATA?.transactions)) {
      lsSet('munyaka_transactions', INITIAL_SEED_DATA.transactions);
    }

    // Attendance
    if (INITIAL_SEED_DATA?.attendance) {
      lsSet('munyaka_attendance_records', INITIAL_SEED_DATA.attendance);
    }

    // Grades / Classes
    if (Array.isArray(INITIAL_SEED_DATA?.grades)) {
      lsSet('munyaka_grades', INITIAL_SEED_DATA.grades);
    }

    // Exam Types
    if (Array.isArray(INITIAL_SEED_DATA?.examTypes)) {
      lsSet('munyaka_exam_types', INITIAL_SEED_DATA.examTypes);
    }

    // Learning Areas
    if (Array.isArray(INITIAL_SEED_DATA?.learningAreas)) {
      lsSet('munyaka_learning_areas', INITIAL_SEED_DATA.learningAreas);
    }

    // Assessment Scores
    if (INITIAL_SEED_DATA?.assessmentScores) {
      lsSet('munyaka_assessment_scores', INITIAL_SEED_DATA.assessmentScores);
    }

    // Library Books
    if (Array.isArray(INITIAL_SEED_DATA?.libraryBooks)) {
      lsSet('munyaka_library_books', INITIAL_SEED_DATA.libraryBooks);
    }

    // ICT Assets
    if (Array.isArray(INITIAL_SEED_DATA?.ictAssets)) {
      lsSet('munyaka_ict_assets', INITIAL_SEED_DATA.ictAssets);
    }

    // Notices / Announcements
    if (Array.isArray(INITIAL_SEED_DATA?.notices)) {
      lsSet('munyaka_notices', INITIAL_SEED_DATA.notices);
    }

    // System Settings
    if (INITIAL_SEED_DATA?.settings) {
      lsSet('munyaka_system_settings_v3', INITIAL_SEED_DATA.settings);
    }

    // ── 2. Mark the current seed version so the next launch is a no-op ──
    lsSet(SEED_VERSION_KEY, CURRENT_SEED_VERSION);

    // ── 3. Broadcast a global change event so all subscribed hooks refresh ─
    notifyDataChanged();
    console.log(
      `[StorageSync] Root data seeding complete (${CURRENT_SEED_VERSION}). ` +
      `Baseline: ${INITIAL_SEED_DATA?.students?.length ?? 0} students, ` +
      `${INITIAL_SEED_DATA?.staff?.length ?? 0} staff.`
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SEED_VERSION_KEY);
    }
  } catch {
    /* no-op */
  }
  initializeAppStorage();
}
