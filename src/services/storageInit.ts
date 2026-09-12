/**
 * storageInit.ts — App initialization and IndexedDB migration runner
 *
 * This module MUST be imported and awaited at app startup (inside main.tsx or
 * App.tsx before any component renders) to guarantee the following sequence:
 *
 *   1. runMigrations()       — detect schema version, migrate legacy data to IDB
 *   2. hydrateAllStores()     — populate empty stores from INITIAL_SEED_DATA
 *   3. Return control        — React renders with live localStorage + IDB data
 *
 * Schema version history
 * ──────────────────────
 *   0  — legacy localStorage-only era (no IndexedDB)
 *   1  — IndexedDB-backed storage (this implementation)
 *
 * Legacy data handling
 * ───────────────────
 * • Hardcoded mock keys (`mock_students`, `mock_exams`, etc.) are ALWAYS cleared
 *   regardless of schema version. They are never real user data.
 * • Structured keys (`school_learners_data`, `munyaka_staff_directory`, etc.)
 *   are migrated into IndexedDB and left in localStorage as a safety mirror
 *   until the IndexedDB layer is confirmed stable.
 * • Any raw arrays from the legacy mock-data.ts era are flagged for review.
 */

import { runMigrations, forceReMigrate } from './schemaMigrations';
import { hydrateAllStores } from '@/utils/storage';
import { notifyDataChanged } from '@/utils/storage';

export { forceReMigrate };

export interface AppInitResult {
  /** The schema version now stored in IndexedDB. */
  schemaVersion: number;
  /** True on first run (no previous schema meta found in IDB). */
  isFirstRun: boolean;
  /** True if any data was migrated from localStorage → IndexedDB. */
  migrated: boolean;
  /** How many legacy mock keys were cleared. */
  legacyKeysCleared: number;
  /** How many records were written to IndexedDB. */
  idbRecordsWritten: number;
  /** How many stores were seeded from INITIAL_SEED_DATA. */
  storesHydrated: number;
  /** Any error that occurred during initialization. */
  error?: string;
}

/**
 * Initialize the app's persistence layer.
 *
 * Call this once at startup. It is idempotent — subsequent calls return
 * immediately without re-running migrations.
 */
export async function initializeApp(): Promise<AppInitResult> {
  try {
    // ── 1. Run schema migrations ──────────────────────────────────────────
    const migration = await runMigrations();

    // ── 2. Hydrate empty stores from seed data ────────────────────────────
    const hydration = hydrateAllStores();

    // ── 3. Fire a global change notification so all hooks recompute ────────
    notifyDataChanged();

    return {
      schemaVersion: migration.schemaVersion,
      isFirstRun: migration.isFirstRun,
      migrated: migration.migrated,
      legacyKeysCleared: migration.legacyKeysCleared,
      idbRecordsWritten: migration.idbRecordsWritten,
      storesHydrated: hydration.restoredFromSeed.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[storageInit] App initialization failed:', err);
    return {
      schemaVersion: 0,
      isFirstRun: false,
      migrated: false,
      legacyKeysCleared: 0,
      idbRecordsWritten: 0,
      storesHydrated: 0,
      error: message,
    };
  }
}
