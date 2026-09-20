import { initialSeedData } from '../data/initialSeedData';

// Canonical storage keys — unified namespace used across all modules.
const CANONICAL_KEYS = {
  LEARNERS: 'school_learners_data',
  STUDENTS: 'munyaka_students',
  STAFF: 'munyaka_staff_directory',
  STAFF_LEGACY: 'munyaka_staff',
  EXAMS: 'munyaka_exam_types',
  LIBRARY: 'munyaka_library_books',
  TRANSACTIONS: 'munyaka_transactions',
  FEES_RECORDS: 'munyaka_fees_records',
  FEE_STRUCTURES: 'munyaka_fee_structures',
  ATTENDANCE: 'munyaka_attendance_records',
  GRADES: 'munyaka_grades',
  LEARNING_AREAS: 'munyaka_learning_areas',
  ASSESSMENT_SCORES: 'munyaka_assessment_scores',
  ICT_ASSETS: 'munyaka_ict_assets',
  NOTICES: 'munyaka_notices',
  SYSTEM_SETTINGS: 'munyaka_system_settings_v3',
} as const;

export const initializeApplicationStorage = (): void => {
  const seedMappings: Array<{ key: string; data: unknown }> = [
    { key: CANONICAL_KEYS.LEARNERS, data: initialSeedData.students },
    { key: CANONICAL_KEYS.STUDENTS, data: initialSeedData.students },
    { key: CANONICAL_KEYS.STAFF, data: initialSeedData.staff },
    { key: CANONICAL_KEYS.STAFF_LEGACY, data: initialSeedData.staff },
    { key: CANONICAL_KEYS.EXAMS, data: initialSeedData.exams || [] },
    { key: CANONICAL_KEYS.LIBRARY, data: initialSeedData.libraryBooks || [] },
    { key: CANONICAL_KEYS.TRANSACTIONS, data: initialSeedData.transactions || [] },
    { key: CANONICAL_KEYS.FEES_RECORDS, data: (initialSeedData as any).fees || [] },
    { key: CANONICAL_KEYS.FEE_STRUCTURES, data: (initialSeedData as any).feeStructures || [] },
    { key: CANONICAL_KEYS.ATTENDANCE, data: (initialSeedData as any).attendance || [] },
    { key: CANONICAL_KEYS.GRADES, data: (initialSeedData as any).grades || [] },
    { key: CANONICAL_KEYS.LEARNING_AREAS, data: (initialSeedData as any).learningAreas || [] },
    { key: CANONICAL_KEYS.ASSESSMENT_SCORES, data: (initialSeedData as any).assessmentScores || [] },
    { key: CANONICAL_KEYS.ICT_ASSETS, data: (initialSeedData as any).ictAssets || [] },
    { key: CANONICAL_KEYS.NOTICES, data: (initialSeedData as any).notices || [] },
    { key: CANONICAL_KEYS.SYSTEM_SETTINGS, data: (initialSeedData as any).settings || {} },
  ];

  seedMappings.forEach(({ key, data }) => {
    const existing = localStorage.getItem(key);
    // STRICT NON-DESTRUCTIVE CHECK: Never overwrite existing populated storage with seed data
    if (existing === null || existing === undefined || existing === 'undefined' || existing === 'null') {
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }
    try {
      const parsed = JSON.parse(existing);
      // Re-seed ONLY if storage is an empty array and seed has items
      if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // Preserve existing
    }
  });
};

export default initializeApplicationStorage;
