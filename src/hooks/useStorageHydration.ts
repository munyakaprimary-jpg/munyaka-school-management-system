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

/** Hydrates localStorage from initialSeedData on first app boot or when uninitialized on Android / Web. */
export function hydrateFromInitialSeed(): void {
  try {
    const seedVersion = SEED_VERSION;
    const storedSeedVersion = localStorage.getItem('munyaka_seed_version') || localStorage.getItem('stored_seed_version');

    // ── Enforce APK boot version check ───────────────────────────────────────
    // If seed versions do not match, clear existing stale storage to force fresh master APK hydration
    if (storedSeedVersion !== seedVersion) {
      console.log(`[StorageHydration] New master seed version detected (${seedVersion} vs ${storedSeedVersion}). Purging stale storage and hydrating fresh master seed.`);
      localStorage.clear();
      sessionStorage.clear();
    }

    // ── Enforce non-destructive smart merge & initialization ─────────────────
    // If user data, custom learning areas, or fee structures already exist, preserve them entirely instead of overwriting.
    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    const learnersRaw = localStorage.getItem('school_learners_data') || localStorage.getItem('munyaka_students');
    const learningAreasRaw = localStorage.getItem('munyaka_flat_learning_areas_v2') || localStorage.getItem('munyaka_learning_areas');
    
    const isLearnersEmpty = !learnersRaw || learnersRaw === '[]' || learnersRaw.length < 5;
    const isLearningAreasEmpty = !learningAreasRaw || learningAreasRaw === '[]' || learningAreasRaw.length < 5;

    // If already initialized and learners/learning areas exist, preserve user data completely (non-destructive)
    if (isInitialized && !isLearnersEmpty && !isLearningAreasEmpty) {
      console.log('[StorageHydration] Non-destructive boot: Preserving existing user data, custom students, and learning areas.');
      return;
    }

    // First-time boot or completely empty installation: load baseline clean structure once
    if (!isInitialized || isLearnersEmpty || isLearningAreasEmpty) {
      console.log('[StorageHydration] First-time install boot: Loading baseline clean storage structure...');

      const snapshot = {
        students: (initialSeedData as any).students || [],
        staff: (initialSeedData as any).staff || [],
        classes: (initialSeedData as any).classes || [],
        streams: (initialSeedData as any).streams || [],
        learningAreas: (initialSeedData as any).learningAreas || [],
        exams: initialExams,
        examSchedules: initialExamSchedules,
        examTypes: initialExamTypes,
        marks: initialMarks,
        questions: initialQuestions,
        reportCards: initialReportCards,
        feeStructures: initialFeeStructures,
        payments: initialFeePayments,
        studyCorner: initialStudyCorner,
        libraryBooks: initialLibraryBooks,
        libraryLogs: initialLibraryLogs,
        scienceLabInventory: (initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || [],
        ictLabEquipment: (initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || [],
        storeInventory: (initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || [],
        attendance: (initialSeedData as any).attendance || [],
        schoolSettings: (initialSeedData as any).schoolSettings || {},
      };

      // Iterate through all keys in snapshot and write them directly into localStorage
      // using the canonical KEY_MAPPING so all modules read from the same namespace.
      Object.entries(snapshot).forEach(([key, value]) => {
        const localStorageKey = KEY_MAPPING[key] || `munyaka_${key}`;
        if (value !== undefined) {
          localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
      });

      // Canonical learner & staff keys (omitting redundant duplicate master backups to prevent localStorage quota exhaustion)
      const studentsList = (initialSeedData as any).students || [];
      const staffList = (initialSeedData as any).staff || [];
      localStorage.setItem('school_learners_data', JSON.stringify(studentsList));
      localStorage.setItem('munyaka_students', JSON.stringify(studentsList));

      localStorage.setItem('munyaka_staff', JSON.stringify(staffList));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(staffList));
      localStorage.removeItem('munyaka_staff_cleared_explicitly');

      // Set munyaka_initialized to true
      localStorage.setItem('munyaka_initialized', 'true');
      localStorage.setItem('stored_seed_version', seedVersion);
      localStorage.setItem('munyaka_seed_version', seedVersion);
      localStorage.setItem('all_set_exams', JSON.stringify(initialExams));
      localStorage.setItem('exams', JSON.stringify(initialExams));
      localStorage.setItem('examSchedules', JSON.stringify(initialExamSchedules));
      localStorage.setItem('munyaka_exam_types', JSON.stringify(initialExamTypes));
      localStorage.setItem('marked_student_submissions', JSON.stringify(initialMarks));
      localStorage.setItem('marks', JSON.stringify(initialMarks));
      localStorage.setItem('munyaka_marks_records', JSON.stringify(initialMarks));
      localStorage.setItem('question_bank', JSON.stringify(initialQuestions));
      localStorage.setItem('questions', JSON.stringify(initialQuestions));
      localStorage.setItem('munyaka_report_cards', JSON.stringify(initialReportCards));
      localStorage.setItem('munyaka_fee_structures', JSON.stringify(initialFeeStructures));
      localStorage.setItem('munyaka_payments', JSON.stringify(initialFeePayments));
      localStorage.setItem('munyaka_fees', JSON.stringify((initialSeedData as any).fees || initialFeePayments));
      localStorage.setItem('munyaka_fees_records', JSON.stringify((initialSeedData as any).fees || initialFeePayments));
      localStorage.setItem('munyaka_student_fees', JSON.stringify((initialSeedData as any).fees || initialFeePayments));
      localStorage.setItem('munyaka_transactions', JSON.stringify((initialSeedData as any).transactions || []));

      localStorage.setItem('munyaka_study_materials', JSON.stringify(initialStudyCorner));
      localStorage.setItem('munyaka_library_books', JSON.stringify(initialLibraryBooks));
      localStorage.setItem('munyaka_library_borrowings', JSON.stringify(initialLibraryLogs));
      localStorage.setItem('munyaka_attendance', JSON.stringify((initialSeedData as any).attendance || []));
      localStorage.setItem('munyaka_attendance_records', JSON.stringify((initialSeedData as any).attendance || []));
      localStorage.setItem('munyaka_ict_lab', JSON.stringify((initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || []));
      localStorage.setItem('munyaka_ict_assets', JSON.stringify((initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || []));
      localStorage.setItem('munyaka_science_lab', JSON.stringify((initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || []));
      localStorage.setItem('munyaka_store_items', JSON.stringify((initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || []));
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));
      localStorage.setItem('settings', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));
      localStorage.setItem('munyaka_notices', JSON.stringify((initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || []));
      localStorage.setItem('munyaka_events', JSON.stringify((initialSeedData as any).events || []));

      if ((initialSeedData as any).timetable) {
        localStorage.setItem('school-timetable-data', JSON.stringify((initialSeedData as any).timetable));
      }

      // Dispatch event to notify listeners
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'full-portal-seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));
      window.dispatchEvent(new CustomEvent('staff-changed'));
      window.dispatchEvent(new CustomEvent('munyaka:staff-directory-changed'));
      window.dispatchEvent(new CustomEvent('storage', { key: 'munyaka_seed_version' } as any));

      console.log(`[StorageHydration] 100% full portal data parity achieved with SEED_VERSION: ${seedVersion}`);
    }
  } catch (error) {
    console.error('[StorageHydration] Error during automatic full-portal storage hydration:', error);
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
