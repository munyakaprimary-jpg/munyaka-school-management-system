import { initialSeedData, SEED_VERSION } from '../data/initialSeedData';

// Canonical storage keys — unified namespace used across all modules.
const CANONICAL_KEYS = {
  LEARNERS: 'school_learners_data',
  STUDENTS: 'munyaka_students',
  STAFF: 'munyaka_staff_directory',
  STAFF_LEGACY: 'munyaka_staff',
  EXAMS: 'munyaka_exams',
  EXAM_TYPES: 'munyaka_exam_types',
  LIBRARY: 'munyaka_library_books',
  TRANSACTIONS: 'munyaka_transactions',
  FEES_RECORDS: 'munyaka_fees_records',
  FEE_STRUCTURES: 'munyaka_fee_structures',
  ATTENDANCE: 'munyaka_attendance_records',
  GRADES: 'munyaka_grades',
  STREAMS: 'munyaka_streams',
  LEARNING_AREAS: 'munyaka_learning_areas',
  ASSESSMENT_SCORES: 'munyaka_assessment_scores',
  ICT_ASSETS: 'munyaka_ict_assets',
  STORE_INVENTORY: 'munyaka_store_items',
  SYSTEM_SETTINGS: 'munyaka_system_settings_v3',
} as const;

export const initializeApplicationStorage = (): void => {
  try {
    const storedSeedVersion = localStorage.getItem('stored_seed_version') || localStorage.getItem('munyaka_seed_version');
    
    let isLearnersEmpty = true;
    let isStaffEmpty = true;
    let isExamsEmpty = true;

    try {
      const l = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      isLearnersEmpty = !Array.isArray(l) || l.length === 0;
    } catch { isLearnersEmpty = true; }

    try {
      const s = JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
      isStaffEmpty = !Array.isArray(s) || s.length === 0;
    } catch { isStaffEmpty = true; }

    try {
      const e = JSON.parse(localStorage.getItem('munyaka_exams') || '[]');
      isExamsEmpty = !Array.isArray(e) || e.length === 0;
    } catch { isExamsEmpty = true; }

    const needsRehydration = 
      storedSeedVersion !== SEED_VERSION || 
      isLearnersEmpty || 
      isStaffEmpty || 
      isExamsEmpty ||
      localStorage.getItem('munyaka_initialized') !== 'true';

    if (needsRehydration) {
      console.log('[StorageInit] Forced seed versioning & re-hydration. Version:', SEED_VERSION);

      const seedMappings: Array<{ key: string; data: unknown }> = [
        { key: CANONICAL_KEYS.LEARNERS, data: initialSeedData.students || initialSeedData.learners },
        { key: CANONICAL_KEYS.STUDENTS, data: initialSeedData.students || initialSeedData.learners },
        { key: CANONICAL_KEYS.STAFF, data: initialSeedData.staff },
        { key: CANONICAL_KEYS.STAFF_LEGACY, data: initialSeedData.staff },
        { key: CANONICAL_KEYS.EXAMS, data: initialSeedData.exams || [] },
        { key: CANONICAL_KEYS.EXAM_TYPES, data: initialSeedData.examTypes || [] },
        { key: CANONICAL_KEYS.LIBRARY, data: initialSeedData.libraryBooks || [] },
        { key: CANONICAL_KEYS.TRANSACTIONS, data: initialSeedData.feePayments || [] },
        { key: CANONICAL_KEYS.FEES_RECORDS, data: initialSeedData.feePayments || [] },
        { key: CANONICAL_KEYS.FEE_STRUCTURES, data: initialSeedData.feeStructures || [] },
        { key: CANONICAL_KEYS.ATTENDANCE, data: initialSeedData.attendance || {} },
        { key: CANONICAL_KEYS.GRADES, data: initialSeedData.grades || {} },
        { key: CANONICAL_KEYS.STREAMS, data: initialSeedData.streams || [] },
        { key: CANONICAL_KEYS.LEARNING_AREAS, data: initialSeedData.learningAreas || [] },
        { key: CANONICAL_KEYS.ASSESSMENT_SCORES, data: initialSeedData.marks || {} },
        { key: CANONICAL_KEYS.ICT_ASSETS, data: initialSeedData.ictEquipment || [] },
        { key: CANONICAL_KEYS.STORE_INVENTORY, data: initialSeedData.storeInventory || [] },
        { key: CANONICAL_KEYS.SYSTEM_SETTINGS, data: initialSeedData.settings || {} },
      ];

      seedMappings.forEach(({ key, data }) => {
        if (data !== undefined) {
          localStorage.setItem(key, JSON.stringify(data));
        }
      });

      // Direct keys specified by requirements
      localStorage.setItem('learners', JSON.stringify(initialSeedData.learners || []));
      localStorage.setItem('staff', JSON.stringify(initialSeedData.staff || []));
      localStorage.setItem('exams', JSON.stringify(initialSeedData.exams || []));
      localStorage.setItem('assessments', JSON.stringify(initialSeedData.assessments || {}));
      localStorage.setItem('grades', JSON.stringify(initialSeedData.grades || {}));
      localStorage.setItem('streams', JSON.stringify(initialSeedData.streams || []));
      localStorage.setItem('fees', JSON.stringify(initialSeedData.fees || []));
      localStorage.setItem('library', JSON.stringify(initialSeedData.libraryBooks || []));
      localStorage.setItem('inventory', JSON.stringify(initialSeedData.storeInventory || []));

      // Save stored_seed_version
      localStorage.setItem('stored_seed_version', SEED_VERSION);
      localStorage.setItem('munyaka_seed_version', SEED_VERSION);
      localStorage.setItem('munyaka_initialized', 'true');

      // Force immediate state refresh events
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'storageInit', version: SEED_VERSION } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: { rehydrated: true } }));
      window.dispatchEvent(new Event('assessments_updated'));
      window.dispatchEvent(new Event('storage'));

      console.log('[StorageInit] Re-hydration complete. stored_seed_version set to:', SEED_VERSION);
    }
  } catch (error) {
    console.error('[StorageInit] Error during initializeApplicationStorage:', error);
  }
};

export default initializeApplicationStorage;
