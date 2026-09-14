import { useEffect, useState } from 'react';
import { initialSeedData } from '@/data/initialSeedData';

/**
 * Key mapping from initialSeedData fields to their respective LocalStorage keys.
 */
const KEY_MAPPING: Record<string, string[]> = {
  students: ['munyaka_learners', 'munyaka_learners_db', 'school_learners_data'],
  classes: ['munyaka_classes'],
  streams: ['munyaka_streams'],
  learningAreas: ['munyaka_learning_areas'],
  exams: ['munyaka_exams'],
  assessments: ['munyaka_assessments'],
  gradingScales: ['munyaka_grading_scales'],
  reportCards: ['munyaka_report_cards'],
  staff: ['munyaka_staff', 'munyaka_staff_directory', 'munyaka_master_staff_list'],
  roles: ['munyaka_roles'],
  payments: ['munyaka_payments'],
  feeStructures: ['munyaka_fee_structures'],
  invoices: ['munyaka_invoices'],
  libraryBooks: ['munyaka_library_books'],
  libraryLogs: ['munyaka_library_borrowings'],
  scienceLabInventory: ['munyaka_science_lab'],
  ictLabEquipment: ['munyaka_ict_lab'],
  storeInventory: ['munyaka_store_items'],
  attendance: ['munyaka_attendance'],
  schoolSettings: ['munyaka_school_settings', 'munyaka_system_settings_v3'],
};

/**
 * Hydrates localStorage from initialSeedData on first app boot or when uninitialized.
 */
export function hydrateFromInitialSeed(): void {
  try {
    const seedKeys = [
      { key: 'munyaka_learners', data: (initialSeedData as any).students },
      { key: 'munyaka_staff', data: (initialSeedData as any).staff },
      { key: 'munyaka_payments', data: (initialSeedData as any).payments || (initialSeedData as any).transactions },
      { key: 'munyaka_assessments', data: (initialSeedData as any).assessments || (initialSeedData as any).marks },
      { key: 'munyaka_attendance', data: (initialSeedData as any).attendance },
      { key: 'munyaka_science_lab', data: (initialSeedData as any).scienceLabInventory },
      { key: 'munyaka_learning_areas', data: (initialSeedData as any).learningAreas },
      { key: 'munyaka_study_content', data: (initialSeedData as any).cbcStudyContent },
    ];

    seedKeys.forEach(({ key, data }) => {
      if (!localStorage.getItem(key) && data) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    });

    const isInitialized = localStorage.getItem('munyaka_initialized') === 'true';
    const seedVersion = (initialSeedData as any).version || (initialSeedData as any).seedVersion || 'v1';
    const currentVersion = localStorage.getItem('munyaka_seed_version');

    if (!isInitialized || currentVersion !== seedVersion) {
      console.log('[StorageHydration] Seeding initial data from initialSeedData snapshot...');

      const seedObj = (initialSeedData as Record<string, any>) || {};

      // 1. Iterate through all keys in initialSeedData directly
      Object.entries(seedObj).forEach(([key, value]) => {
        if (value !== undefined) {
          const stringified = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(`munyaka_${key}`, stringified);

          // If mapped to multiple alias keys, populate each
          const aliases = KEY_MAPPING[key];
          if (aliases && aliases.length > 0) {
            aliases.forEach(aliasKey => {
              localStorage.setItem(aliasKey, stringified);
            });
          }
        }
      });

      // 2. Mark system as initialized and set current version
      localStorage.setItem('munyaka_initialized', 'true');
      localStorage.setItem('munyaka_seed_version', seedVersion);

      // 3. Dispatch data change event so all active listeners re-render
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { source: 'seed-hydration' } }));
      window.dispatchEvent(new CustomEvent('munyaka_learners_updated'));

      console.log('[StorageHydration] Initial seed data successfully hydrated into localStorage.');
    }
  } catch (error) {
    console.error('[StorageHydration] Error during seed hydration:', error);
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
