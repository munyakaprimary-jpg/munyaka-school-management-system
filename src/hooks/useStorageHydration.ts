import { useEffect, useState } from 'react';
import { initialSeedData, SEED_VERSION } from '@/data/initialSeedData';

/** Key mapping from initialSeedData fields to their respective LocalStorage keys. */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_students',
  learners: 'school_learners_data',
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
    const storedSeedVersion = localStorage.getItem('stored_seed_version') || localStorage.getItem('munyaka_seed_version');
    
    // Check if learners, staff, or exams arrays are missing or empty in localStorage
    const learnersRaw = localStorage.getItem('school_learners_data') || localStorage.getItem('munyaka_students');
    const staffRaw = localStorage.getItem('munyaka_staff');
    const examsRaw = localStorage.getItem('munyaka_exams') || localStorage.getItem('munyaka_exam_types');

    let isLearnersEmpty = true;
    let isStaffEmpty = true;
    let isExamsEmpty = true;

    try {
      const parsedLearners = learnersRaw ? JSON.parse(learnersRaw) : [];
      isLearnersEmpty = !Array.isArray(parsedLearners) || parsedLearners.length === 0;
    } catch {
      isLearnersEmpty = true;
    }

    try {
      const parsedStaff = staffRaw ? JSON.parse(staffRaw) : [];
      isStaffEmpty = !Array.isArray(parsedStaff) || parsedStaff.length === 0;
    } catch {
      isStaffEmpty = true;
    }

    try {
      const parsedExams = examsRaw ? JSON.parse(examsRaw) : [];
      isExamsEmpty = !Array.isArray(parsedExams) || parsedExams.length === 0;
    } catch {
      isExamsEmpty = true;
    }

    const needsRehydration = 
      storedSeedVersion !== SEED_VERSION || 
      isLearnersEmpty || 
      isStaffEmpty || 
      isExamsEmpty ||
      localStorage.getItem('munyaka_initialized') !== 'true';

    if (needsRehydration) {
      console.log('[StorageHydration] Forced seed versioning & re-hydration triggered. SEED_VERSION:', SEED_VERSION, 'stored:', storedSeedVersion);

      // Explicitly write every single array and key exported from initialSeedData.ts into localStorage
      const seedSnapshot: Record<string, any> = {
        learners: initialSeedData.learners || [],
        students: initialSeedData.students || [],
        staff: initialSeedData.staff || [],
        teachers: initialSeedData.staff || [],
        exams: initialSeedData.exams || [],
        allSetExams: initialSeedData.exams || [],
        examTypes: initialSeedData.examTypes || [],
        assessments: initialSeedData.assessments || initialSeedData.marks || {},
        grades: initialSeedData.grades || {},
        streams: initialSeedData.streams || [],
        fees: initialSeedData.fees || initialSeedData.feePayments || [],
        feeStructures: initialSeedData.feeStructures || [],
        library: initialSeedData.libraryBooks || [],
        libraryBooks: initialSeedData.libraryBooks || [],
        libraryLogs: initialSeedData.libraryLogs || [],
        inventory: initialSeedData.storeInventory || [],
        storeInventory: initialSeedData.storeInventory || [],
        ictEquipment: initialSeedData.ictEquipment || [],
        scienceInventory: initialSeedData.scienceInventory || [],
        studyCorner: initialSeedData.studyCorner || [],
        learningAreas: initialSeedData.learningAreas || [],
        attendance: initialSeedData.attendance || {},
        reportCards: initialSeedData.reportCards || [],
        settings: initialSeedData.settings || {},
      };

      // Overwrite local storage keys directly with values from initialSeedData.ts
      Object.entries(seedSnapshot).forEach(([key, value]) => {
        const localStorageKey = KEY_MAPPING[key] || `munyaka_${key}`;
        if (value !== undefined) {
          localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
      });

      // Also set explicit direct keys requested by step 2a/2b
      localStorage.setItem('learners', JSON.stringify(initialSeedData.learners || []));
      localStorage.setItem('school_learners_data', JSON.stringify(initialSeedData.learners || []));
      localStorage.setItem('munyaka_students', JSON.stringify(initialSeedData.students || []));
      localStorage.setItem('staff', JSON.stringify(initialSeedData.staff || []));
      localStorage.setItem('munyaka_staff', JSON.stringify(initialSeedData.staff || []));
      localStorage.setItem('exams', JSON.stringify(initialSeedData.exams || []));
      localStorage.setItem('munyaka_exams', JSON.stringify(initialSeedData.exams || []));
      localStorage.setItem('assessments', JSON.stringify(initialSeedData.assessments || {}));
      localStorage.setItem('grades', JSON.stringify(initialSeedData.grades || {}));
      localStorage.setItem('streams', JSON.stringify(initialSeedData.streams || []));
      localStorage.setItem('fees', JSON.stringify(initialSeedData.fees || []));
      localStorage.setItem('library', JSON.stringify(initialSeedData.libraryBooks || []));
      localStorage.setItem('inventory', JSON.stringify(initialSeedData.storeInventory || []));

      // Also populate all_set_exams and question_bank for Exam Creator
      if (initialSeedData.exams && Array.isArray(initialSeedData.exams)) {
        try {
          localStorage.setItem('all_set_exams', JSON.stringify(initialSeedData.exams));
          if (initialSeedData.exams.length > 0) {
            const firstExam = initialSeedData.exams[0] as any;
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
              savedAt: firstExam.createdAt || new Date().toISOString(),
            }));
          }
        } catch {}
      }

      // Save stored_seed_version and munyaka_initialized
      localStorage.setItem('stored_seed_version', SEED_VERSION);
      localStorage.setItem('munyaka_seed_version', SEED_VERSION);
      localStorage.setItem('munyaka_initialized', 'true');

      // Force an immediate state refresh so UI components display all records without requiring manual page reset
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'forced-seed-rehydration', version: SEED_VERSION } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: { rehydrated: true } }));
      window.dispatchEvent(new Event('assessments_updated'));
      window.dispatchEvent(new Event('storage'));

      console.log('[StorageHydration] SUCCESS: Forced re-hydration completed with SEED_VERSION:', SEED_VERSION);
    }
  } catch (error) {
    console.error('[StorageHydration] Error during forced re-hydration:', error);
  }
}

/** Global React Hook for automatic first-boot storage hydration. */
export function useStorageHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateFromInitialSeed();
    setHydrated(true);

    const handleStorageChange = () => {
      setHydrated((prev) => !prev);
    };

    window.addEventListener('munyaka:data-changed', handleStorageChange);
    window.addEventListener('munyaka_learners_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('munyaka:data-changed', handleStorageChange);
      window.removeEventListener('munyaka_learners_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { hydrated };
}
