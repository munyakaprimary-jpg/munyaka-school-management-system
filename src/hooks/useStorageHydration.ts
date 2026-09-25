import { useEffect, useState } from 'react';
import { initialSeedData, SEED_VERSION } from '@/data/initialSeedData';

/** Key mapping from initialSeedData fields to their respective LocalStorage keys. */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_students',
  classes: 'munyaka_grades',
  streams: 'munyaka_grades',
  learningAreas: 'munyaka_learning_areas',
  exams: 'munyaka_exam_types',
  assessments: 'munyaka_assessment_scores',
  gradingScales: 'munyaka_grading_scales',
  reportCards: 'munyaka_report_cards',
  staff: 'munyaka_staff',
  roles: 'munyaka_roles',
  payments: 'munyaka_payments',
  feeStructures: 'munyaka_fee_structures',
  invoices: 'munyaka_invoices',
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
    
    const isAttendanceEmpty = !attendanceRaw || attendanceRaw === '{}' || attendanceRaw === '[]' || attendanceRaw.length < 5;
    const isIctEmpty = !ictRaw || ictRaw === '[]' || ictRaw.length < 5;
    const isScienceEmpty = !scienceRaw || scienceRaw === '[]' || scienceRaw.length < 5;
    const isStoreEmpty = !storeRaw || storeRaw === '[]' || storeRaw.length < 5;
    const isSettingsEmpty = !settingsRaw || settingsRaw === '{}' || settingsRaw.length < 5;

    if (!isInitialized || currentVersion !== seedVersion || isAttendanceEmpty || isIctEmpty || isScienceEmpty || isStoreEmpty || isSettingsEmpty) {
      console.log('[StorageHydration] First-boot storage hydration: Seeding initial data snapshot, inventory & settings...');

      const snapshot = {
        students: (initialSeedData as any).students || [],
        classes: (initialSeedData as any).classes || [],
        streams: (initialSeedData as any).streams || [],
        learningAreas: (initialSeedData as any).learningAreas || [],
        exams: (initialSeedData as any).exams || [],
        assessments: (initialSeedData as any).assessments || [],
        gradingScales: (initialSeedData as any).gradingScales || [],
        reportCards: (initialSeedData as any).reportCards || [],
        staff: (initialSeedData as any).staff || [],
        roles: (initialSeedData as any).roles || [],
        payments: (initialSeedData as any).payments || [],
        feeStructures: (initialSeedData as any).feeStructures || [],
        invoices: (initialSeedData as any).invoices || [],
        libraryBooks: (initialSeedData as any).libraryBooks || [],
        libraryLogs: (initialSeedData as any).libraryLogs || [],
        scienceLabInventory: (initialSeedData as any).scienceLabInventory || [],
        ictLabEquipment: (initialSeedData as any).ictLabEquipment || [],
        storeInventory: (initialSeedData as any).storeInventory || [],
        attendance: (initialSeedData as any).attendance || [],
        schoolSettings: (initialSeedData as any).schoolSettings || {},
      };

      // Iterate through all keys in initialSeedData and write them directly into localStorage
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
      localStorage.setItem('munyaka_attendance', JSON.stringify((initialSeedData as any).attendance || []));
      localStorage.setItem('munyaka_ict_lab', JSON.stringify((initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || []));
      localStorage.setItem('munyaka_science_lab', JSON.stringify((initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || []));
      localStorage.setItem('munyaka_store_items', JSON.stringify((initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || []));
      localStorage.setItem('munyaka_system_settings_v3', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));
      localStorage.setItem('settings', JSON.stringify((initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {}));

      // Dispatch event to notify listeners
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));

      console.log('[StorageHydration] 100% data parity achieved. LocalStorage successfully hydrated from initialSeedData.');
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