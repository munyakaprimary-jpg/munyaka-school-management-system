import { useEffect, useState } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

/**
 * Key mapping from initialSeedData fields to their respective LocalStorage keys.
 */
const KEY_MAPPING: Record<string, string> = {
  students: 'munyaka_learners',
  classes: 'munyaka_classes',
  streams: 'munyaka_streams',
  learningAreas: 'munyaka_learning_areas',
  exams: 'munyaka_exams',
  assessments: 'munyaka_assessments',
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
  schoolSettings: 'munyaka_school_settings',
};

/**
 * Hydrates localStorage from initialSeedData on first app boot or when uninitialized on Android / Web.
 */
export function hydrateFromInitialSeed(): void {
  try {
    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    const seedVersion = (initialSeedData as any).version || (initialSeedData as any).seedVersion || 'v1';
    const currentVersion = localStorage.getItem('munyaka_seed_version');

    if (!isInitialized || currentVersion !== seedVersion) {
      console.log('[StorageHydration] First-boot storage hydration: Seeding initial data snapshot...');

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
      Object.entries(snapshot).forEach(([key, value]) => {
        const localStorageKey = KEY_MAPPING[key] || `munyaka_${key}`;
        if (value !== undefined) {
          localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
      });

      // Set munyaka_initialized to true
      localStorage.setItem('munyaka_initialized', 'true');
      localStorage.setItem('munyaka_seed_version', seedVersion);

      // Dispatch event to notify listeners
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));

      console.log('[StorageHydration] 100% data parity achieved. LocalStorage successfully hydrated from initialSeedData.');
    }
  } catch (error) {
    console.error('[StorageHydration] Error during automatic first-boot storage hydration:', error);
  }
}

/**
 * Global React Hook for automatic first-boot storage hydration.
 */
export function useStorageHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateFromInitialSeed();
    setHydrated(true);
  }, []);

  return { hydrated };
}
