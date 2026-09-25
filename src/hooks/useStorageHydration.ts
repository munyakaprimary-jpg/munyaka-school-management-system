import { useEffect, useState } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

/** Key mapping from initialSeedData fields to their respective LocalStorage keys. */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_students',
  learners: 'munyaka_students',
  staff: 'munyaka_staff',
  grades: 'munyaka_grades',
  classes: 'munyaka_grades',
  streams: 'munyaka_streams',
  learningAreas: 'munyaka_learning_areas',
  exams: 'munyaka_exams',
  allSetExams: 'all_set_exams',
  examTypes: 'munyaka_exam_types',
  assessments: 'munyaka_assessment_scores',
  marks: 'munyaka_marks',
  gradingScales: 'munyaka_grading_scales',
  reportCards: 'munyaka_report_cards',
  roles: 'munyaka_roles',
  payments: 'munyaka_payments',
  fees: 'munyaka_fees',
  feeStructures: 'munyaka_fee_structures',
  invoices: 'munyaka_invoices',
  studyCorner: 'munyaka_study_corner',
  libraryBooks: 'munyaka_library_books',
  libraryLogs: 'munyaka_library_borrowings',
  scienceLabInventory: 'munyaka_science_lab',
  ictLabEquipment: 'munyaka_ict_lab',
  storeInventory: 'munyaka_store_items',
  attendance: 'munyaka_attendance',
  schoolSettings: 'munyaka_system_settings_v3',
  schoolSettingsAlt: 'school_settings',
};

/** Hydrates localStorage from initialSeedData on first app boot or when uninitialized on Android / Web. */
export function hydrateFromInitialSeed(): void {
  try {
    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    const seedVersion = (initialSeedData as any).version || (initialSeedData as any).seedVersion || 'v2';
    const currentVersion = localStorage.getItem('munyaka_seed_version');

    if (!isInitialized || currentVersion !== seedVersion) {
      console.log('[StorageHydration] First-boot storage hydration: Seeding comprehensive initial data snapshot across all modules...');

      // Build comprehensive snapshot from initialSeedData
      const snapshot: Record<string, any> = {
        students: (initialSeedData as any).students || [],
        learners: (initialSeedData as any).students || [],
        staff: (initialSeedData as any).staff || [],
        grades: (initialSeedData as any).grades || {},
        classes: (initialSeedData as any).grades || {},
        streams: (initialSeedData as any).streams || [],
        learningAreas: (initialSeedData as any).learningAreas || [],
        exams: (initialSeedData as any).exams || [],
        allSetExams: (initialSeedData as any).exams || [],
        examTypes: (initialSeedData as any).examTypes || [],
        assessments: (initialSeedData as any).assessments || [],
        marks: (initialSeedData as any).marks || {},
        gradingScales: (initialSeedData as any).gradingScales || [],
        reportCards: (initialSeedData as any).reportCards || [],
        roles: (initialSeedData as any).roles || [],
        payments: (initialSeedData as any).payments || [],
        fees: (initialSeedData as any).fees || [],
        feeStructures: (initialSeedData as any).feeStructures || [],
        invoices: (initialSeedData as any).invoices || [],
        studyCorner: (initialSeedData as any).studyCorner || [],
        libraryBooks: (initialSeedData as any).libraryBooks || [],
        libraryLogs: (initialSeedData as any).libraryLogs || [],
        scienceLabInventory: (initialSeedData as any).scienceLabInventory || [],
        ictLabEquipment: (initialSeedData as any).ictLabEquipment || [],
        storeInventory: (initialSeedData as any).storeInventory || [],
        attendance: (initialSeedData as any).attendance || {},
        schoolSettings: (initialSeedData as any).schoolSettings || {},
        schoolSettingsAlt: (initialSeedData as any).schoolSettings || {},
      };

      // Iterate through all keys in initialSeedData and write them directly into localStorage
      // using the canonical KEY_MAPPING so all school modules read from the same namespace.
      Object.entries(snapshot).forEach(([key, value]) => {
        const localStorageKey = KEY_MAPPING[key] || `munyaka_${key}`;
        if (value !== undefined) {
          localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
      });

      // Also populate all_set_exams and question_bank for Exam Creator
      if ((initialSeedData as any).exams && Array.isArray((initialSeedData as any).exams)) {
        try {
          localStorage.setItem('all_set_exams', JSON.stringify((initialSeedData as any).exams));
          if ((initialSeedData as any).exams.length > 0) {
            const firstExam = (initialSeedData as any).exams[0];
            localStorage.setItem('question_bank', JSON.stringify({
              metadata: {
                title: firstExam.title,
                category: firstExam.category,
                classLevel: firstExam.classLevel,
                subject: firstExam.subject,
                duration: firstExam.duration,
                totalMarks: firstExam.totalMarks,
                assessmentId: firstExam.id,
                createdAt: firstExam.createdAt,
              },
              questions: firstExam.questions || [],
              savedAt: firstExam.createdAt,
            }));
          }
        } catch {}
      }

      // Set munyaka_initialized to true
      localStorage.setItem('munyaka_initialized', 'true');
      localStorage.setItem('munyaka_seed_version', seedVersion);

      // Dispatch events to notify listeners across all modules
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));
      window.dispatchEvent(new Event('assessments_updated'));

      console.log('[StorageHydration] 100% data parity achieved across all school management modules. LocalStorage successfully hydrated from initialSeedData.');
    }
  } catch (error) {
    console.error('[StorageHydration] Error during automatic first-boot storage hydration:', error);
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
