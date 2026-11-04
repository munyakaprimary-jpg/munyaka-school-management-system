import { useEffect, useState } from 'react';
import { initialSeedData, SEED_VERSION, initialExams, initialExamSchedules, initialExamTypes, initialMarks, initialQuestions, initialReportCards, initialFeeStructures, initialFeePayments, initialStudyCorner, initialLibraryBooks, initialLibraryLogs } from '@/data/initialSeedData';

/** Key mapping from initialSeedData fields to their respective LocalStorage keys. */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_students',
  staff: 'munyaka_staff',
  classes: 'munyaka_grades',
  streams: 'munyaka_grades',
  learningAreas: 'munyaka_learning_areas',
  exams: 'all_set_exams',
  examSchedules: 'examSchedules',
  examTypes: 'munyaka_exam_types',
  marks: 'marked_student_submissions',
  questions: 'question_bank',
  reportCards: 'munyaka_report_cards',
  feeStructures: 'munyaka_fee_structures',
  payments: 'munyaka_payments',
  studyCorner: 'munyaka_study_materials',
  libraryBooks: 'munyaka_library_books',
  libraryLogs: 'munyaka_library_borrowings',
  scienceLabInventory: 'munyaka_science_lab',
  ictLabEquipment: 'munyaka_ict_lab',
  storeInventory: 'munyaka_store_items',
  attendance: 'munyaka_attendance',
  schoolSettings: 'munyaka_system_settings_v3',
};

/**
 * Hydrates localStorage from initialSeedData on first app boot or when uninitialized.
 * DISABLED: No automatic seeding from initialSeedData. When storage is empty, keep state strictly as [].
 */
export function hydrateFromInitialSeed(): void {
  try {
    const seedVersion = SEED_VERSION;
    const storedSeedVersion = localStorage.getItem('munyaka_seed_version') || localStorage.getItem('stored_seed_version');

    // If seed versions do not match, clear existing stale storage to force fresh master APK hydration
    if (storedSeedVersion !== seedVersion) {
      console.log(`[StorageHydration] New master seed version detected (${seedVersion} vs ${storedSeedVersion}). Purging stale storage.`);
      localStorage.clear();
      sessionStorage.clear();
    }

    // First-time boot: just mark as initialized without loading any seed data
    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    if (!isInitialized) {
      console.log('[StorageHydration] First boot: initialized without seed data');
      localStorage.setItem('munyaka_initialized', 'true');
      localStorage.setItem('stored_seed_version', seedVersion);
      localStorage.setItem('munyaka_seed_version', seedVersion);
      return;
    }

    // If already initialized, preserve existing user data - no re-seeding
    console.log('[StorageHydration] Already initialized: preserving existing data, no seeding');
  } catch (error) {
    console.error('[StorageHydration] Error during automatic storage hydration:', error);
  }
}

/** Global React Hook for automatic first-boot storage hydration. */
export function useStorageHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateFromInitialSeed();
    setHydrated(true);
  }, []);

  return { hydrated };
}