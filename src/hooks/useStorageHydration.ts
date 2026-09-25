import { useEffect, useState } from 'react';
import { initialSeedData, SEED_VERSION, initialExams, initialExamSchedules, initialExamTypes, initialMarks, initialQuestions, initialReportCards, initialFeeStructures, initialFeePayments, initialStudyCorner, initialLibraryBooks, initialLibraryLogs } from '@/data/initialSeedData';

/** Key mapping from initialSeedData fields to their respective LocalStorage keys. */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_students',
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
    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    const seedVersion = SEED_VERSION;
    const currentVersion = localStorage.getItem('stored_seed_version') || localStorage.getItem('munyaka_seed_version');
    const attendanceRaw = localStorage.getItem('munyaka_attendance');
    const ictRaw = localStorage.getItem('munyaka_ict_lab');
    const scienceRaw = localStorage.getItem('munyaka_science_lab');
    const storeRaw = localStorage.getItem('munyaka_store_items');
    const settingsRaw = localStorage.getItem('munyaka_system_settings_v3') || localStorage.getItem('munyaka_settings');
    const noticesRaw = localStorage.getItem('munyaka_notices');
    const eventsRaw = localStorage.getItem('munyaka_events');
    const examsRaw = localStorage.getItem('all_set_exams') || localStorage.getItem('exams');
    const schedulesRaw = localStorage.getItem('examSchedules');
    const examTypesRaw = localStorage.getItem('munyaka_exam_types');
    const marksRaw = localStorage.getItem('marked_student_submissions') || localStorage.getItem('marks');
    const questionsRaw = localStorage.getItem('question_bank') || localStorage.getItem('questions');
    const reportCardsRaw = localStorage.getItem('munyaka_report_cards');
    const feeStructuresRaw = localStorage.getItem('munyaka_fee_structures');
    const paymentsRaw = localStorage.getItem('munyaka_payments') || localStorage.getItem('munyaka_fees');
    const studyCornerRaw = localStorage.getItem('munyaka_study_materials');
    const libraryBooksRaw = localStorage.getItem('munyaka_library_books');
    const libraryLogsRaw = localStorage.getItem('munyaka_library_borrowings');
    
    const isAttendanceEmpty = !attendanceRaw || attendanceRaw === '{}' || attendanceRaw === '[]' || attendanceRaw.length < 5;
    const isIctEmpty = !ictRaw || ictRaw === '[]' || ictRaw.length < 5;
    const isScienceEmpty = !scienceRaw || scienceRaw === '[]' || scienceRaw.length < 5;
    const isStoreEmpty = !storeRaw || storeRaw === '[]' || storeRaw.length < 5;
    const isSettingsEmpty = !settingsRaw || settingsRaw === '{}' || settingsRaw.length < 5;
    const isNoticesEmpty = !noticesRaw || noticesRaw === '[]' || noticesRaw.length < 5;
    const isEventsEmpty = !eventsRaw || eventsRaw === '[]' || eventsRaw.length < 5;
    const isExamsEmpty = !examsRaw || examsRaw === '[]' || examsRaw.length < 5;
    const isSchedulesEmpty = !schedulesRaw || schedulesRaw === '[]' || schedulesRaw.length < 5;
    const isExamTypesEmpty = !examTypesRaw || examTypesRaw === '[]' || examTypesRaw.length < 5;
    const isMarksEmpty = !marksRaw || marksRaw === '[]' || marksRaw.length < 5;
    const isQuestionsEmpty = !questionsRaw || questionsRaw === '[]' || questionsRaw.length < 5;
    const isReportCardsEmpty = !reportCardsRaw || reportCardsRaw === '[]' || reportCardsRaw.length < 5;
    const isFeeStructuresEmpty = !feeStructuresRaw || feeStructuresRaw === '[]' || feeStructuresRaw.length < 5;
    const isPaymentsEmpty = !paymentsRaw || paymentsRaw === '[]' || paymentsRaw.length < 5;
    const isStudyCornerEmpty = !studyCornerRaw || studyCornerRaw === '[]' || studyCornerRaw.length < 5;
    const isLibraryBooksEmpty = !libraryBooksRaw || libraryBooksRaw === '[]' || libraryBooksRaw.length < 5;
    const isLibraryLogsEmpty = !libraryLogsRaw || libraryLogsRaw === '[]' || libraryLogsRaw.length < 5;

    if (!isInitialized || currentVersion !== seedVersion || isAttendanceEmpty || isIctEmpty || isScienceEmpty || isStoreEmpty || isSettingsEmpty || isNoticesEmpty || isEventsEmpty || isExamsEmpty || isSchedulesEmpty || isExamTypesEmpty || isMarksEmpty || isQuestionsEmpty || isReportCardsEmpty || isFeeStructuresEmpty || isPaymentsEmpty || isStudyCornerEmpty || isLibraryBooksEmpty || isLibraryLogsEmpty) {
      console.log('[StorageHydration] First-boot storage hydration: Forcing full portal hydration across all menus (exams, fees, report cards, library, inventory, settings)...');

      const snapshot = {
        students: (initialSeedData as any).students || [],
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
      localStorage.setItem('question_bank', JSON.stringify(initialQuestions));
      localStorage.setItem('questions', JSON.stringify(initialQuestions));
      localStorage.setItem('munyaka_report_cards', JSON.stringify(initialReportCards));
      localStorage.setItem('munyaka_fee_structures', JSON.stringify(initialFeeStructures));
      localStorage.setItem('munyaka_payments', JSON.stringify(initialFeePayments));
      // Hydrate fees & payments from initialSeedData if empty
      const existingFees = localStorage.getItem('munyaka_fees');
      const existingPayments = localStorage.getItem('munyaka_payments');
      const existingFeesRecords = localStorage.getItem('munyaka_fees_records');

      if (!existingFees || JSON.parse(existingFees || '[]').length === 0) {
        localStorage.setItem('munyaka_fees', JSON.stringify((initialSeedData as any).fees || initialFeePayments));
      }
      if (!existingPayments || JSON.parse(existingPayments || '[]').length === 0) {
        localStorage.setItem('munyaka_payments', JSON.stringify((initialSeedData as any).payments || (initialSeedData as any).fees || initialFeePayments));
      }
      if (!existingFeesRecords || JSON.parse(existingFeesRecords || '[]').length === 0) {
        localStorage.setItem('munyaka_fees_records', JSON.stringify((initialSeedData as any).fees || initialFeePayments));
      }
      localStorage.setItem('munyaka_study_materials', JSON.stringify(initialStudyCorner));
      localStorage.setItem('munyaka_library_books', JSON.stringify(initialLibraryBooks));
      localStorage.setItem('munyaka_library_borrowings', JSON.stringify(initialLibraryLogs));
      localStorage.setItem('munyaka_attendance', JSON.stringify((initialSeedData as any).attendance || []));
      localStorage.setItem('munyaka_ict_lab', JSON.stringify((initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || []));
      localStorage.setItem('munyaka_science_lab', JSON.stringify((initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || []));
      localStorage.setItem('munyaka_store_items', JSON.stringify((initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || []));
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));
      localStorage.setItem('settings', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));
      localStorage.setItem('munyaka_notices', JSON.stringify((initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || []));
      localStorage.removeItem('munyaka_events');
      localStorage.removeItem('events');
      localStorage.setItem('munyaka_events', JSON.stringify([]));

      // Dispatch event to notify listeners
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'full-portal-seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));
      window.dispatchEvent(new CustomEvent('storage', { key: 'stored_seed_version' } as any));

      console.log('[StorageHydration] 100% full portal data parity achieved. All menu modules successfully hydrated from initialSeedData.');
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
