/**
 * schemaMigrations.ts — Schema versioning and legacy data migration
 *
 * This module runs at app startup to:
 *   1. Detect the current schema version stored in IndexedDB.
 *   2. Identify and clear legacy mock-key data from localStorage
 *      (the "mock arrays" from src/lib/mock-data.ts that were previously
 *      imported directly into components).
 *   3. Migrate any legacy structured localStorage data into IndexedDB.
 *   4. Bump the schema version so future launches are a no-op.
 *
 * Schema version history
 * ──────────────────────
 *   0  — legacy localStorage-only era (no IndexedDB, no schema version stored)
 *   1  — IndexedDB-backed storage (this implementation)
 */

import { idbStore, IDB_SCHEMA } from './idbStore';

// ─── Version constants ───────────────────────────────────────────────────────

export const SCHEMA_META_KEY = 'schema_meta';
export const CURRENT_SCHEMA_VERSION = 1;
export const LEGACY_SCHEMA_VERSION = 0; // localStorage era (no IDB)

// ─── Legacy localStorage keys to detect ─────────────────────────────────────

/**
 * Keys that existed before IndexedDB and contain structured data.
 * Their presence in localStorage indicates this browser has been used before.
 */
const LEGACY_STRUCTURED_KEYS = [
  'school_learners_data',
  'munyaka_students',
  'munyaka_students_master',
  'munyaka_staff_directory',
  'munyaka_staff',
  'munyaka_staff_prereg',
  'munyaka_grades',
  'munyaka_exam_types',
  'munyaka_learning_areas',
  'munyaka_cbc_learning_areas',
  'munyaka_assessment_scores',
  'all_set_exams',
  'munyaka_attendance_v2_',
  'munyaka_attendance_records',
  'munyaka_fee_structures',
  'munyaka_fees_records',
  'munyaka_student_fees',
  'munyaka_transactions',
  'munyaka_library_books',
  'munyaka_ict_assets',
  'munyaka_notices',
  'munyaka_messages',
  'munyaka_portfolio_artifacts',
  'munyaka_promotions',
  'munyaka_transfers',
  'munyaka_system_settings_v3',
  'munyaka_subscriptions',
  'munyaka_billing_settings',
  'app_seed_version',
] as const;

type LegacyKey = (typeof LEGACY_STRUCTURED_KEYS)[number];

/**
 * Keys that contain hardcoded mock arrays (from src/lib/mock-data.ts).
 * These are always safe to clear — they are never real user data.
 */
const LEGACY_MOCK_KEYS = [
  'mock_marks',
  'mock_students',
  'mock_exams',
  'mock_attendance',
  'mock_fees',
  'mock_messages',
  'mock_notices',
  'mock_books',
  'mock_assets',
  'mock_events',
  'mock_timetable',
  'mock_attendance_trend',
  'mock_results_breakdown',
  'mock_marks_entries',
  'mock_teachers',
  'mock_admins',
] as const;

type MockKey = (typeof LEGACY_MOCK_KEYS)[number];

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsGet<T>(key: string): T | null {
  const ls = safeLocalStorage();
  if (!ls) return null;
  return safeParse<T>(ls.getItem(key));
}

function lsHasKey(key: string): boolean {
  const ls = safeLocalStorage();
  if (!ls) return false;
  return ls.getItem(key) !== null;
}

function lsRemove(key: string): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.removeItem(key);
}

function lsRemovePrefixed(prefix: string): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  const toRemove: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  for (const k of toRemove) ls.removeItem(k);
}

// ─── Schema meta (stored in IndexedDB) ───────────────────────────────────────

interface SchemaMeta {
  key: string;
  version: number;
  migratedAt: string;
  legacyKeysCleared: number;
  idbRecordsWritten: number;
}

async function readSchemaMeta(): Promise<SchemaMeta | null> {
  try {
    return await idbStore.get<SchemaMeta>(SCHEMA_META_KEY, SCHEMA_META_KEY);
  } catch {
    return null;
  }
}

async function writeSchemaMeta(meta: SchemaMeta): Promise<void> {
  await idbStore.put(SCHEMA_META_KEY, meta);
}

// ─── Migration: v0 → v1 ──────────────────────────────────────────────────────

/**
 * Migration step: localStorage era → IndexedDB era.
 *
 * Actions:
 *  1. Parse every legacy structured key from localStorage.
 *  2. Write records into the corresponding IndexedDB store.
 *  3. Remove legacy mock keys (the hardcoded mock arrays).
 *  4. Keep the structured keys in localStorage as a safety mirror
 *     until we are confident the IndexedDB layer is fully stable.
 *     (We mark them as "migrated" so they won't be processed again.)
 *  5. Write the new schema version to IndexedDB.
 */
async function migrateToV1(): Promise<{
  legacyKeysCleared: number;
  idbRecordsWritten: number;
}> {
  const ls = safeLocalStorage();
  let idbRecordsWritten = 0;
  let legacyKeysCleared = 0;

  // ── 1. Learners → IndexedDB ───────────────────────────────────────────
  const learners = lsGet<Record<string, unknown>[]>(
    'school_learners_data'
  ) ?? lsGet('munyaka_students') ?? lsGet('munyaka_students_master') ?? null;
  if (Array.isArray(learners) && learners.length > 0) {
    const valid = learners.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('learners', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 2. Staff → IndexedDB ────────────────────────────────────────────
  const staff =
    lsGet<Record<string, unknown>[]>('munyaka_staff_directory') ??
    lsGet('munyaka_staff') ??
    null;
  if (Array.isArray(staff) && staff.length > 0) {
    const valid = staff.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('staff', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 3. Staff Pre-Registration → IndexedDB ───────────────────────────
  const staffPrereg = lsGet<Record<string, unknown>[]>('munyaka_staff_prereg');
  if (Array.isArray(staffPrereg) && staffPrereg.length > 0) {
    const valid = staffPrereg.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('staff_prereg', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 4. Grades → IndexedDB ─────────────────────────────────────────────
  const grades = lsGet<Record<string, unknown>[]>('munyaka_grades');
  if (Array.isArray(grades) && grades.length > 0) {
    const valid = grades.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('grades', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 5. Streams (derived from grades) → IndexedDB ────────────────────
  const gradesForStreams = lsGet<Record<string, unknown>[]>('munyaka_grades');
  if (Array.isArray(gradesForStreams) && gradesForStreams.length > 0) {
    const streams: Record<string, unknown>[] = [];
    for (const grade of gradesForStreams) {
      const gradeStreams = grade.streams as Record<string, unknown>[] | undefined;
      if (Array.isArray(gradeStreams)) {
        for (const stream of gradeStreams) {
          streams.push({ ...stream, gradeId: grade.id ?? grade.gradeId });
        }
      }
    }
    if (streams.length > 0) {
      const valid = streams.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
      await idbStore.putMany('streams', valid);
      idbRecordsWritten += valid.length;
    }
  }

  // ── 6. Exam Types → IndexedDB ─────────────────────────────────────────
  const examTypes = lsGet<Record<string, unknown>[]>('munyaka_exam_types');
  if (Array.isArray(examTypes) && examTypes.length > 0) {
    const valid = examTypes.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('exam_types', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 7. Learning Areas → IndexedDB ───────────────────────────────────
  const learningAreas =
    lsGet<Record<string, unknown>[]>('munyaka_learning_areas') ??
    lsGet('munyaka_cbc_learning_areas') ??
    null;
  if (Array.isArray(learningAreas) && learningAreas.length > 0) {
    const valid = learningAreas.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('learning_areas', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 8. Assessment Scores → IndexedDB ────────────────────────────────
  const scores = lsGet<Record<string, unknown>[]>('munyaka_assessment_scores');
  if (Array.isArray(scores) && scores.length > 0) {
    const valid = scores.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('assessment_scores', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 9. Exams → IndexedDB ─────────────────────────────────────────────
  const exams = lsGet<Record<string, unknown>[]>('all_set_exams');
  if (Array.isArray(exams) && exams.length > 0) {
    const valid = exams.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('exams', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 10. Attendance V2 → IndexedDB ───────────────────────────────────
  // Keys look like: 'munyaka_attendance_v2_2024-01-15'
  const attendanceKeys: string[] = [];
  if (ls) {
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith('munyaka_attendance_v2_')) attendanceKeys.push(k);
    }
  }
  for (const key of attendanceKeys) {
    const records = lsGet<Record<string, unknown>[]>(key);
    if (Array.isArray(records) && records.length > 0) {
      const valid = records.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
      await idbStore.putMany('attendance_v2', valid);
      idbRecordsWritten += valid.length;
    }
  }

  // ── 11. Staff Attendance → IndexedDB ────────────────────────────────
  const staffAttendance = lsGet<Record<string, unknown>[]>('munyaka_attendance_records');
  if (Array.isArray(staffAttendance) && staffAttendance.length > 0) {
    const valid = staffAttendance.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('staff_attendance', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 12. Fee Ledgers → IndexedDB ─────────────────────────────────────
  const feeLedgers =
    lsGet<Record<string, unknown>[]>('munyaka_fees_records') ??
    lsGet('munyaka_student_fees') ??
    null;
  if (Array.isArray(feeLedgers) && feeLedgers.length > 0) {
    const valid = feeLedgers.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('fee_ledgers', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 13. Fee Structures → IndexedDB ──────────────────────────────────
  const feeStructures = lsGet<Record<string, unknown>[]>('munyaka_fee_structures');
  if (Array.isArray(feeStructures) && feeStructures.length > 0) {
    const valid = feeStructures.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('fee_structures', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 14. Transactions → IndexedDB ────────────────────────────────────
  const transactions = lsGet<Record<string, unknown>[]>('munyaka_transactions');
  if (Array.isArray(transactions) && transactions.length > 0) {
    const valid = transactions.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('transactions', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 15. Library Books → IndexedDB ───────────────────────────────────
  const books = lsGet<Record<string, unknown>[]>('munyaka_library_books');
  if (Array.isArray(books) && books.length > 0) {
    const valid = books.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('library_books', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 16. ICT Assets → IndexedDB ───────────────────────────────────────
  const assets = lsGet<Record<string, unknown>[]>('munyaka_ict_assets');
  if (Array.isArray(assets) && assets.length > 0) {
    const valid = assets.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('ict_assets', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 17. Notices → IndexedDB ─────────────────────────────────────────
  const notices = lsGet<Record<string, unknown>[]>('munyaka_notices');
  if (Array.isArray(notices) && notices.length > 0) {
    const valid = notices.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('notices', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 18. Messages → IndexedDB ────────────────────────────────────────
  const messages = lsGet<Record<string, unknown>[]>('munyaka_messages');
  if (Array.isArray(messages) && messages.length > 0) {
    const valid = messages.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('messages', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 19. Portfolio Artifacts → IndexedDB ─────────────────────────────
  const artifacts = lsGet<Record<string, unknown>[]>('munyaka_portfolio_artifacts');
  if (Array.isArray(artifacts) && artifacts.length > 0) {
    const valid = artifacts.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('portfolio_artifacts', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 20. Promotions → IndexedDB ──────────────────────────────────────
  const promotions = lsGet<Record<string, unknown>[]>('munyaka_promotions');
  if (Array.isArray(promotions) && promotions.length > 0) {
    const valid = promotions.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('promotions', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 21. Transfers → IndexedDB ───────────────────────────────────────
  const transfers = lsGet<Record<string, unknown>[]>('munyaka_transfers');
  if (Array.isArray(transfers) && transfers.length > 0) {
    const valid = transfers.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('transfers', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 22. System Settings → IndexedDB ──────────────────────────────────
  const settings = lsGet<Record<string, unknown>>('munyaka_system_settings_v3');
  if (settings && typeof settings === 'object') {
    await idbStore.put('system_settings', { id: 'settings', ...settings });
    idbRecordsWritten += 1;
  }

  // ── 23. Subscriptions → IndexedDB ───────────────────────────────────
  const subs = lsGet<Record<string, unknown>[]>('munyaka_subscriptions');
  if (Array.isArray(subs) && subs.length > 0) {
    const valid = subs.filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object');
    await idbStore.putMany('subscriptions', valid);
    idbRecordsWritten += valid.length;
  }

  // ── 24. Billing Settings → IndexedDB ────────────────────────────────
  const billing = lsGet<Record<string, unknown>>('munyaka_billing_settings');
  if (billing && typeof billing === 'object') {
    await idbStore.put('subscriptions', { id: 'billing', ...billing });
  }

  // ── 25. Clear hardcoded mock keys (always safe to remove) ──────────
  for (const key of LEGACY_MOCK_KEYS) {
    if (lsHasKey(key)) {
      lsRemove(key);
      legacyKeysCleared++;
    }
  }

  // ── 26. Write schema meta ───────────────────────────────────────────
  await writeSchemaMeta({
    key: SCHEMA_META_KEY,
    version: CURRENT_SCHEMA_VERSION,
    migratedAt: new Date().toISOString(),
    legacyKeysCleared,
    idbRecordsWritten,
  });

  return { legacyKeysCleared, idbRecordsWritten };
}

// ─── Main entry point ───────────────────────────────────────────────────────

export interface MigrationResult {
  schemaVersion: number;
  isFirstRun: boolean;
  migrated: boolean;
  legacyKeysCleared: number;
  idbRecordsWritten: number;
}

/**
 * Run all pending migrations.
 *
 * Call this once at app startup (before any component renders).
 * Returns a MigrationResult describing what happened.
 */
export async function runMigrations(): Promise<MigrationResult> {
  try {
    // Open IndexedDB so we can read/write schema_meta
    await idbStore.open();

    const meta = await readSchemaMeta();

    // No schema meta → first run on this browser → run v0→v1
    if (!meta) {
      const { legacyKeysCleared, idbRecordsWritten } = await migrateToV1();
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        isFirstRun: true,
        migrated: true,
        legacyKeysCleared,
        idbRecordsWritten,
      };
    }

    // Already on current version → nothing to do
    if (meta.version >= CURRENT_SCHEMA_VERSION) {
      return {
        schemaVersion: meta.version,
        isFirstRun: false,
        migrated: false,
        legacyKeysCleared: 0,
        idbRecordsWritten: 0,
      };
    }

    // Legacy version (< CURRENT_SCHEMA_VERSION) → run migrations sequentially
    let legacyKeysCleared = 0;
    let idbRecordsWritten = 0;

    if (meta.version < 1) {
      const result = await migrateToV1();
      legacyKeysCleared += result.legacyKeysCleared;
      idbRecordsWritten += result.idbRecordsWritten;
    }

    // Future migration steps would go here:
    // if (meta.version < 2) { const r = await migrateToV2(); ... }

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      isFirstRun: false,
      migrated: true,
      legacyKeysCleared,
      idbRecordsWritten,
    };
  } catch (err) {
    console.error('[SchemaMigration] Migration failed:', err);
    return {
      schemaVersion: 0,
      isFirstRun: false,
      migrated: false,
      legacyKeysCleared: 0,
      idbRecordsWritten: 0,
    };
  }
}

/**
 * Force re-run all migrations from scratch.
 * Use this from an admin "Reset all data" action.
 */
export async function forceReMigrate(): Promise<MigrationResult> {
  try {
    await idbStore.deleteDatabase();
    await idbStore.open();
    return await runMigrations();
  } catch (err) {
    console.error('[SchemaMigration] Force re-migration failed:', err);
    return {
      schemaVersion: 0,
      isFirstRun: false,
      migrated: false,
      legacyKeysCleared: 0,
      idbRecordsWritten: 0,
    };
  }
}
