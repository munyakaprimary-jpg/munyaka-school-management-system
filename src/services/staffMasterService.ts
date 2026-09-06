/**
 * Staff Master Service
 * ===================
 *
 * Single source of truth for ALL staff records across the application.
 *
 * Storage layout
 * ─────────────
 * `munyaka_master_staff_list` — the canonical ledger. Every staff member lives here
 *   once, with fields covering both the directory view (role, department, email)
 *   and the pre-registration view (tempAccessCode, status, systemRole).
 *
 * Bootstrap
 * ────────
 * On first launch `initializeStaffMaster()` seeds `munyaka_master_staff_list` from
 * the merged seed set (INITIAL_PRE_REGISTERED_STAFF + INITIAL_SEED_DATA.staff).
 * All subsequent reads/writes go through this service so every view —
 * Dashboard counters, Central Data Service, Staff Directory, and Access Master
 * Ledger — always sees the same data.
 *
 * Migration
 * ────────
 * On startup, `migrateStaffAccessKeys()` normalises every access key to the
 * strict `MUNYAKA-XXXX` format (e.g. MUNYAKA-4827) by converting any old
 * formats (PR-staff-178845..., bare timestamps, UUIDs, etc.).
 *
 * Backwards compatibility
 * ─────────────────────
 * Every mutation also writes to `munyaka_staff_directory` and
 * `munyaka_staff_prereg` so legacy hooks (useCentralData, useDashboardData)
 * and existing components that read those keys continue working without changes.
 */

import { notifyDataChanged } from '@/utils/storage';
import { generateAccessKey, isOldAccessKeyFormat } from './staffAccessService';
import type { MasterAccessStatus, MasterSystemRole } from '@/types/staff-access';

// Re-export for consumers that import from this service
export type { MasterAccessStatus, MasterSystemRole };

// ─── Constants ────────────────────────────────────────────────────────────────

export const STAFF_MASTER_KEY = 'munyaka_master_staff_list';

/** Legacy keys still written by mutations for backwards compatibility. */
const LEGACY_DIRECTORY_KEY = 'munyaka_staff_directory';
const LEGACY_PREREG_KEY   = 'munyaka_staff_prereg';

/**
 * Teaching staff system roles — these roles are directly involved in
 * classroom instruction and student academic development.
 */
export const TEACHING_SYSTEM_ROLES: readonly MasterSystemRole[] = [
  'head_teacher',
  'deputy_head_teacher',
  'senior_teacher',
  'class_teacher',
  'subject_teacher',
];

/**
 * Non-teaching staff system roles — administrative, support, and
 * auxiliary personnel who do not have classroom teaching duties.
 */
export const NON_TEACHING_SYSTEM_ROLES: readonly MasterSystemRole[] = [
  'bursar',
  'support_admin',
  'ict_admin',
  'librarian',
  'nurse',
  'counselor',
  'cleaner',
  'security',
  'cook',
  'driver',
];

/**
 * Categorized staff metrics for UI display.
 * Breaks down total staff into Teaching vs Non-Teaching with active/pending counts.
 */
export interface CategorizedStaffMetrics {
  total: {
    count: number;
    active: number;
    pending: number;
  };
  teaching: {
    count: number;
    active: number;
    pending: number;
  };
  nonTeaching: {
    count: number;
    active: number;
    pending: number;
  };
}

/** Returns true if the given systemRole is a teaching role. */
export function isTeachingRole(systemRole: string): boolean {
  return TEACHING_SYSTEM_ROLES.includes(systemRole as MasterSystemRole);
}

/** Returns true if the given systemRole is a non-teaching role. */
export function isNonTeachingRole(systemRole: string): boolean {
  return NON_TEACHING_SYSTEM_ROLES.includes(systemRole as MasterSystemRole);
}

/**
 * Count active records (status is 'active', case-insensitive).
 */
function countActive(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'active').length;
}

/**
 * Count pending records (status is 'pre-registered', case-insensitive).
 */
function countPending(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'pre-registered').length;
}

// ─── Type ────────────────────────────────────────────────────────────────────

export interface MasterStaffRecord {
  // Directory / operational fields
  id: string;
  name: string;
  nationalId: string;   // id_no / national ID
  email: string;
  phone: string;
  tscNumber?: string;
  role: string;          // display role label e.g. "Head Teacher", "Teacher"
  systemRole: MasterSystemRole; // canonical system role
  department?: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects?: string[];
  gender?: string;
  salary?: number;
  joinedDate?: string;
  emergencyContact?: string;
  emergencyName?: string;
  schoolId?: string;

  // Pre-registration / auth fields
  staffId: string;      // login username e.g. "T001"
  accessKey?: string;   // alias for staffId in MUNYAKA-XXXX format (added for compatibility)
  tempAccessCode: string; // primary password (MUNYAKA-XXXX)
  status: MasterAccessStatus;
  datePreRegistered?: string;
  activatedAt?: string;
  lastLogin?: string;
  profileComplete?: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

/**
 * The canonical seed set for `munyaka_master_staff_list`.
 *
 * Combines staff from:
 *   - `INITIAL_PRE_REGISTERED_STAFF` (the 6 pre-registration records with
 *     `tempAccessCode` and `staffId` needed for portal authentication)
 *   - `INITIAL_SEED_DATA.staff` (the directory entries with operational
 *     fields like salary, emergency contact, department)
 *
 * Where a person appears in both, their records are merged so every field
 * is present in the master ledger.
 */
const MASTER_SEED: MasterStaffRecord[] = [
  // ── From INITIAL_PRE_REGISTERED_STAFF (auth fields + core identity) ─────────
  {
    id: 'PR-1787658909839',
    staffId: 'T001',
    name: 'Grace Njeri',
    nationalId: '30291847',
    tscNumber: 'TSC-719203',
    email: 'grace.njeri@munyaka.sc.ke',
    phone: '+254 700 000 111',
    systemRole: 'head_teacher',
    role: 'Head Teacher',
    department: 'School Administration',
    assignedSubjects: ['Administration'],
    tempAccessCode: 'MUNYAKA-9632',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    // Enriched from INITIAL_SEED_DATA.staff
    gender: 'Female',
    salary: 95000,
    joinedDate: '2018-01-15',
    emergencyContact: '+254711001001',
    emergencyName: 'John Njeri',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'PR-1787658904111',
    staffId: 'T002',
    name: 'Peter Omondi',
    nationalId: '25839102',
    tscNumber: 'TSC-382910',
    email: 'peter.omondi@munyaka.sc.ke',
    phone: '+254 733 456 789',
    systemRole: 'subject_teacher',
    role: 'Subject Teacher',
    department: 'School Administration',
    assignedSubjects: ['Pre-Technical', 'Computer Science'],
    tempAccessCode: 'MUNYAKA-2647',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    // Enriched from INITIAL_SEED_DATA.staff
    gender: 'Male',
    salary: 73000,
    joinedDate: '2019-09-01',
    emergencyContact: '+254722004004',
    emergencyName: 'Jane Omondi',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'PR-1787658895559',
    staffId: 'T003',
    name: 'Jane Mwangi',
    nationalId: '28374615',
    tscNumber: 'TSC-482910',
    email: 'jane.mwangi@munyaka.sc.ke',
    phone: '+254 712 345 678',
    systemRole: 'class_teacher',
    role: 'Class Teacher',
    department: 'School Administration',
    assignedSubjects: ['Mathematics', 'Science & Tech'],
    tempAccessCode: 'MUNYAKA-9020',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'PR-1787658885534',
    staffId: 'T004',
    name: 'Sarah Chebet',
    nationalId: '29482019',
    tscNumber: 'TSC-610293',
    email: 'sarah.chebet@munyaka.sc.ke',
    phone: '+254 701 112 233',
    systemRole: 'class_teacher',
    role: 'Class Teacher',
    department: 'School Administration',
    assignedSubjects: ['Kiswahili', 'CRE'],
    tempAccessCode: 'MUNYAKA-7496',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'PR-1787658875279',
    staffId: 'T005',
    name: 'John Kamau',
    nationalId: '31948201',
    tscNumber: 'TSC-592014',
    email: 'john.kamau@munyaka.sc.ke',
    phone: '+254 722 987 654',
    systemRole: 'senior_teacher',
    role: 'Senior Teacher',
    department: 'School Administration',
    assignedSubjects: ['English', 'Social Studies'],
    tempAccessCode: 'MUNYAKA-2116',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    // Enriched from INITIAL_SEED_DATA.staff
    gender: 'Male',
    salary: 75000,
    joinedDate: '2020-03-01',
    emergencyContact: '+254722002002',
    emergencyName: 'Mary Kamau',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'PR-1787658841599',
    staffId: 'T006',
    name: 'JOEL MWANGI',
    nationalId: '122654',
    tscNumber: '1234566',
    email: 'joelmwangi@school.ac.ke',
    phone: '0768234567',
    systemRole: 'subject_teacher',
    role: 'Subject Teacher',
    department: 'School Administration',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-7849',
    status: 'Active',
    datePreRegistered: '2026-08-25',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  // ── Additional staff from INITIAL_SEED_DATA.staff not in pre-reg seed ────────
  {
    id: 'staff-003',
    staffId: 'T007',
    name: 'Sarah Achieng',
    nationalId: '33445566',
    tscNumber: 'TSC-66211',
    email: 'sarah.achieng@munyaka.sc.ke',
    phone: '+254 720 003 003',
    systemRole: 'class_teacher',
    role: 'Teacher',
    department: 'School Administration',
    assignedGrade: 'Grade 4',
    assignedStream: 'Blue',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-3108',
    status: 'Active',
    datePreRegistered: '2021-06-10',
    gender: 'Female',
    salary: 72000,
    joinedDate: '2021-06-10',
    emergencyContact: '+254722003003',
    emergencyName: 'Peter Achieng',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-005',
    staffId: 'T008',
    name: 'Mary Wanjiku',
    nationalId: '55667788',
    tscNumber: 'TSC-44019',
    email: 'mary.wanjiku@munyaka.sc.ke',
    phone: '+254 720 005 005',
    systemRole: 'class_teacher',
    role: 'Teacher',
    department: 'School Administration',
    assignedGrade: 'Grade 5',
    assignedStream: 'Alpha',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-5721',
    status: 'Active',
    datePreRegistered: '2022-01-20',
    gender: 'Female',
    salary: 71000,
    joinedDate: '2022-01-20',
    emergencyContact: '+254722005005',
    emergencyName: 'Joseph Wanjiku',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-006',
    staffId: 'T009',
    name: 'David Kiprotich',
    nationalId: '66778899',
    tscNumber: 'TSC-33128',
    email: 'david.kiprotich@munyaka.sc.ke',
    phone: '+254 720 006 006',
    systemRole: 'bursar',
    role: 'Bursar',
    department: 'Finance',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-4893',
    status: 'Active',
    datePreRegistered: '2017-04-05',
    gender: 'Male',
    salary: 80000,
    joinedDate: '2017-04-05',
    emergencyContact: '+254722006006',
    emergencyName: 'Grace Kiprotich',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

const mapSystemRoleToRoleLabel = (role: MasterSystemRole): string => {
  switch (role) {
    case 'head_teacher':   return 'Head Teacher';
    case 'senior_teacher': return 'Senior Teacher';
    case 'class_teacher':  return 'Class Teacher';
    case 'subject_teacher': return 'Subject Teacher';
    case 'bursar':         return 'Bursar';
    case 'support_admin':   return 'System Admin';
    default:               return 'Teacher';
  }
};

// ─── Hard Purge ───────────────────────────────────────────────────────────────

interface PurgeResult {
  storageKeysRemoved: number;
  recordsPurged: number;
  recordIdsRemoved: string[];
}

/**
 * Execute a hard purge on every app boot.
 *
 * 1. Scans localStorage and sessionStorage for keys matching:
 *      "james", "ndiki", "PR-staff-1788", "prereg", "u3uh5j"
 *    and removes every match — no stale or ghost records can survive a page reload.
 *
 * 2. Explicitly calls `localStorage.removeItem()` on:
 *      munyaka_staff_prereg, prereg_staff, munyaka_staff_migrated,
 *      MUNYAKA_STAFF_PREREG, prereg_staff_list, staff_prereg_backup
 *
 * 3. Filters the master ledger (`munyaka_master_staff_list`) and permanently
 *    removes records where:
 *      - name contains "james" or "ndiki" (case-insensitive)
 *      - email contains "james", "ndiki", or "u3uh5j" (case-insensitive)
 *      - id contains "PR-staff-1788" (the broken timestamp-ID generator)
 *      - nationalId contains "u3uh5j"
 *    Saves the cleaned array back and broadcasts the change.
 *
 * Returns a summary of what was removed so callers can log it.
 */
export function purgeLegacyAndSuspectRecords(): PurgeResult {
  const PURGE_KEY_PATTERNS = [
    /james/i, /ndiki/i, /PR-staff-1788/i,
    /prereg/i,               // catches munyaka_staff_prereg, prereg_staff, etc.
    /u3uh5j/i,
  ];
  const PURGE_NAME_PATTERNS = [/james/i, /ndiki/i];
  const PURGE_EMAIL_PATTERNS = [/james/i, /ndiki/i, /u3uh5j/i];
  // Only remove records with the specific broken ID format "PR-staff-1788...".
  // Legitimate seed IDs like "PR-1787658909839" (PR-1787…) are NOT targeted;
  // migrateStaffAccessKeys() will normalise them to MUNYAKA-XXXX on the same boot.
  const PURGE_ID_PATTERNS = [/PR-staff-1788/i];
  const EXPLICIT_KEYS = [
    'munyaka_staff_prereg',
    'prereg_staff',
    'munyaka_staff_migrated',
    // Also nuke the orphan migrated variant (different casing)
    'MUNYAKA_STAFF_PREREG',
    'prereg_staff_list',
    'staff_prereg_backup',
  ];

  const matchesAny = (text: string, patterns: RegExp[]): boolean =>
    patterns.some(p => p.test(text));

  // ── 1. Scan & purge localStorage keys ────────────────────────────────────────
  let storageKeysRemoved = 0;
  const toRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';
    if (matchesAny(key, PURGE_KEY_PATTERNS)) toRemove.push(key);
    if (EXPLICIT_KEYS.includes(key)) toRemove.push(key);
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
    storageKeysRemoved++;
    console.log(`[staffMasterService] PURGE removed localStorage key: "${key}"`);
  }

  // ── 2. Scan & purge sessionStorage keys ─────────────────────────────────────
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i) ?? '';
    if (matchesAny(key, PURGE_KEY_PATTERNS)) {
      sessionStorage.removeItem(key);
      storageKeysRemoved++;
      console.log(`[staffMasterService] PURGE removed sessionStorage key: "${key}"`);
    }
  }

  // ── 3. Sanitize the master ledger ────────────────────────────────────────────
  let recordsPurged = 0;
  const recordIdsRemoved: string[] = [];

  try {
    const raw = localStorage.getItem(STAFF_MASTER_KEY);
    if (raw) {
      const records: MasterStaffRecord[] = JSON.parse(raw);
      const cleaned: MasterStaffRecord[] = records.filter(record => {
        const shouldRemove =
          matchesAny(record.name ?? '', PURGE_NAME_PATTERNS) ||
          matchesAny(record.email ?? '', PURGE_EMAIL_PATTERNS) ||
          matchesAny(record.id ?? '', PURGE_ID_PATTERNS) ||
          matchesAny(record.nationalId ?? '', [/u3uh5j/i]);

        if (shouldRemove) {
          recordsPurged++;
          recordIdsRemoved.push(record.id);
          console.log(
            `[staffMasterService] PURGE removed staff record: "${record.name}" ` +
            `<${record.email}> id="${record.id}"`
          );
        }
        return !shouldRemove;
      });

      if (recordsPurged > 0) {
        persist(cleaned);
        broadcast();
        console.log(
          `[staffMasterService] PURGE complete — ${recordsPurged} record(s) removed, ` +
          `${cleaned.length} remain in ledger`
        );
      }
    }
  } catch (err) {
    console.error('[staffMasterService] PURGE failed during master ledger sanitisation:', err);
  }

  return { storageKeysRemoved, recordsPurged, recordIdsRemoved };
}

// ─── Migration ────────────────────────────────────────────────────────────────

interface MigrationResult {
  updated: number;
  unchanged: number;
  total: number;
}

/**
 * Migrate all staff access keys to the MUNYAKA-XXXX format on startup.
 * This converts any old-format keys (PR-staff-*, timestamps, UUIDs) to
 * the standardized MUNYAKA-XXXX format.
 *
 * Returns migration summary: counts of updated, unchanged, and total records.
 */
export function migrateStaffAccessKeys(): MigrationResult {
  try {
    const raw = localStorage.getItem(STAFF_MASTER_KEY);
    if (!raw) return { updated: 0, unchanged: 0, total: 0 };

    const records: MasterStaffRecord[] = JSON.parse(raw);
    if (!Array.isArray(records) || records.length === 0) {
      return { updated: 0, unchanged: 0, total: 0 };
    }

    let updated = 0;
    const migrated: MasterStaffRecord[] = records.map(record => {
      const tempNeedsFix   = isOldAccessKeyFormat(record.tempAccessCode);
      const idNeedsFix     = isOldAccessKeyFormat(record.id);
      const accessKeyNeedsFix = isOldAccessKeyFormat(record.accessKey);

      if (tempNeedsFix || idNeedsFix || accessKeyNeedsFix) {
        const newKey = generateAccessKey();
        updated++;
        return {
          ...record,
          id:            idNeedsFix        ? newKey : record.id,
          accessKey:     accessKeyNeedsFix ? newKey : record.accessKey,
          tempAccessCode: tempNeedsFix      ? newKey : record.tempAccessCode,
        };
      }
      return record;
    });

    if (updated > 0) {
      persist(migrated);
      broadcast();
      console.log(`[staffMasterService] Migrated ${updated} staff access keys to MUNYAKA-XXXX format`);
    }

    return {
      updated,
      unchanged: records.length - updated,
      total: records.length,
    };
  } catch (err) {
    console.error('[staffMasterService] migrateStaffAccessKeys failed:', err);
    return { updated: 0, unchanged: 0, total: 0 };
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Write to master key AND update legacy keys for backwards compatibility. */
function persist(records: MasterStaffRecord[]): void {
  const json = JSON.stringify(records);
  localStorage.setItem(STAFF_MASTER_KEY, json);
  // Legacy directory format (flat fields, no tempAccessCode)
  localStorage.setItem(LEGACY_DIRECTORY_KEY, JSON.stringify(records.map(r => ({
    id: r.id,
    id_no: r.nationalId,
    full_name: r.name,
    tsc_no: r.tscNumber,
    phone: r.phone,
    email: r.email,
    role: r.role,
    systemRole: r.systemRole,
    department: r.department,
    status: r.status,
    is_active: r.status === 'Active' ? 1 : 0,
    salary: r.salary,
    gender: r.gender,
    joined: r.joinedDate,
    emergencyContact: r.emergencyContact,
    emergencyName: r.emergencyName,
    schoolId: r.schoolId,
    subjects: r.assignedSubjects ?? [],
    profileComplete: r.profileComplete,
  }))));
  // Legacy pre-reg format (PreRegisteredStaff fields)
  localStorage.setItem(LEGACY_PREREG_KEY, JSON.stringify(records.map(r => ({
    id: r.id,
    staffId: r.staffId,
    fullName: r.name,
    nationalId: r.nationalId,
    tscNumber: r.tscNumber,
    email: r.email,
    phone: r.phone,
    systemRole: r.systemRole,
    department: r.department,
    assignedGrade: r.assignedGrade,
    assignedStream: r.assignedStream,
    assignedSubjects: r.assignedSubjects ?? [],
    tempAccessCode: r.tempAccessCode,
    status: r.status,
    datePreRegistered: r.datePreRegistered,
    activatedAt: r.activatedAt,
    lastLogin: r.lastLogin,
  }))));
}

/** Fire change events so all hooks and components refresh. */
function broadcast(): void {
  notifyDataChanged(STAFF_MASTER_KEY);
  notifyDataChanged(LEGACY_DIRECTORY_KEY);
  notifyDataChanged(LEGACY_PREREG_KEY);
  window.dispatchEvent(new Event('staff-changed'));
  window.dispatchEvent(new CustomEvent('munyaka:staff-directory-changed'));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the staff master ledger on app boot.
 *
 * Call this once (e.g. in `hydrateAllStores` or `AuthProvider`) before
 * any component reads `STAFF_MASTER_KEY`. Safe to call multiple times —
 * if `munyaka_master_staff_list` already exists it is left unchanged.
 *
 * Execution order on every boot:
 *   1. purgeLegacyAndSuspectRecords()  — nuke James Ndiki, all prereg orphans,
 *      legacy keys, and any PR-staff-1788 timestamp IDs from storage.
 *   2. migrateStaffAccessKeys()        — normalise remaining keys to MUNYAKA-XXXX.
 *   3. Seed with MASTER_SEED only if no ledger exists.
 */
export function initializeStaffMaster(): void {
  try {
    // ── Step 1: hard purge — runs every boot so no polluted state can survive ───
    const purge = purgeLegacyAndSuspectRecords();
    if (purge.recordsPurged > 0 || purge.storageKeysRemoved > 0) {
      console.log(
        `[staffMasterService] Purge results: ${purge.recordsPurged} records removed, ` +
        `${purge.storageKeysRemoved} storage keys removed`
      );
    }

    // ── Step 2: access key migration ────────────────────────────────────────────
    migrateStaffAccessKeys();

    // ── Step 3: seed if empty ───────────────────────────────────────────────────
    const existing = localStorage.getItem(STAFF_MASTER_KEY);
    if (existing !== null) return;

    persist(MASTER_SEED);
    console.log('[staffMasterService] Staff master ledger seeded with initial data');
  } catch (err) {
    console.error('[staffMasterService] initializeStaffMaster failed:', err);
  }
}

/** Return the full staff master ledger. Empty array if not yet initialised. */
export function getStaffMaster(): MasterStaffRecord[] {
  try {
    const raw = localStorage.getItem(STAFF_MASTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Return staff filtered by `schoolId` (or all if `schoolId` is null). */
export function getStaffMasterBySchool(schoolId: string | null): MasterStaffRecord[] {
  return getStaffMaster().filter(r =>
    !schoolId || !r.schoolId || r.schoolId === schoolId
  );
}

/** Return staff matching the `Active` status. */
export function getActiveStaffMaster(): MasterStaffRecord[] {
  return getStaffMaster().filter(r => r.status === 'Active');
}

/**
 * Return a stable count suitable for Dashboard / Central Data counters.
 * Filters out archived / deleted records.
 */
export function getStaffMasterCount(schoolId: string | null = null): {
  total: number;
  active: number;
} {
  const records = schoolId
    ? getStaffMasterBySchool(schoolId)
    : getStaffMaster();
  const active = records.filter(r =>
    r.status === 'Active' && !r.schoolId?.includes('archived')
  );
  return { total: records.length, active: active.length };
}

/**
 * Return detailed staff metrics for UI counters.
 * All status comparisons are case-insensitive for robustness.
 */
export function getStaffMetrics(schoolId: string | null = null): {
  total: number;
  active: number;
  pending: number;
} {
  const records = schoolId
    ? getStaffMasterBySchool(schoolId)
    : getStaffMaster();

  const total = records.length;
  const active = records.filter(r => {
    const status = (r.status || '').toLowerCase();
    return status === 'active';
  }).length;
  const pending = records.filter(r => {
    const status = (r.status || '').toLowerCase();
    return status === 'pre-registered';
  }).length;

  return { total, active, pending };
}

// ─── Teaching vs Non-Teaching Classification ───────────────────────────────────

/** Canonical teaching system roles */
export const TEACHING_SYSTEM_ROLES = [
  'head_teacher',
  'deputy_head_teacher',
  'senior_teacher',
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
] as const;

export type TeachingRole = typeof TEACHING_SYSTEM_ROLES[number];

/** Helper to check if a system role is a teaching role */
export function isTeachingRole(systemRole?: string): boolean {
  return TEACHING_SYSTEM_ROLES.includes(systemRole as TeachingRole);
}

/** Helper to check if a system role is a non-teaching role */
export function isNonTeachingRole(systemRole?: string): boolean {
  return !isTeachingRole(systemRole);
}

/** Count active staff in an array */
function countActive(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'active').length;
}

/** Count pending/pre-registered staff in an array */
function countPending(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'pre-registered').length;
}

/** Return type for categorized staff metrics */
export interface CategorizedStaffMetrics {
  total: { count: number; active: number; pending: number };
  teaching: { count: number; active: number; pending: number };
  nonTeaching: { count: number; active: number; pending: number };
}

/**
 * Return categorized staff metrics for UI display.
 * Splits total staff into Teaching vs Non-Teaching categories with
 * active/pending breakdowns for each.
 */
export function getCategorizedMetrics(schoolId: string | null = null): CategorizedStaffMetrics {
  const records = schoolId
    ? getStaffMasterBySchool(schoolId)
    : getStaffMaster();

  const teachingRecords = records.filter(r => isTeachingRole(r.systemRole));
  const nonTeachingRecords = records.filter(r => isNonTeachingRole(r.systemRole));

  // For records with unrecognized/empty roles, include them in non-teaching
  const unclassifiedRecords = records.filter(
    r => !isTeachingRole(r.systemRole) && !isNonTeachingRole(r.systemRole)
  );

  const allNonTeaching = [...nonTeachingRecords, ...unclassifiedRecords];

  return {
    total: {
      count: records.length,
      active: countActive(records),
      pending: countPending(records),
    },
    teaching: {
      count: teachingRecords.length,
      active: countActive(teachingRecords),
      pending: countPending(teachingRecords),
    },
    nonTeaching: {
      count: allNonTeaching.length,
      active: countActive(allNonTeaching),
      pending: countPending(allNonTeaching),
    },
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Add a new staff record to the master ledger.
 * Generates a `staffId` (T010, T011…) and a `tempAccessCode` (MUNYAKA-XXXX).
 * Returns the newly created record.
 */
export function addStaffMaster(
  data: Partial<MasterStaffRecord> & { name: string; nationalId: string; email: string; phone: string }
): MasterStaffRecord {
  const existing = getStaffMaster();
  const accessKey = generateAccessKey();
  const newRecord: MasterStaffRecord = {
    id: accessKey,                        // MUNYAKA-XXXX format (consistent with accessKey)
    staffId: accessKey,
    name: data.name,
    nationalId: data.nationalId,
    email: data.email,
    phone: data.phone,
    tscNumber: data.tscNumber,
    role: data.role ?? mapSystemRoleToRoleLabel(data.systemRole ?? 'subject_teacher'),
    systemRole: data.systemRole ?? 'subject_teacher',
    department: data.department ?? 'School Administration',
    assignedGrade: data.assignedGrade,
    assignedStream: data.assignedStream,
    assignedSubjects: data.assignedSubjects ?? [],
    gender: data.gender,
    salary: data.salary,
    joinedDate: data.joinedDate ?? new Date().toISOString().split('T')[0],
    emergencyContact: data.emergencyContact,
    emergencyName: data.emergencyName,
    schoolId: data.schoolId ?? 'munyaka-sc',
    accessKey,                           // MUNYAKA-XXXX key
    tempAccessCode: accessKey,           // password matches accessKey for simplicity
    status: data.status ?? 'Pre-Registered',
    datePreRegistered: data.datePreRegistered ?? new Date().toISOString().split('T')[0],
    profileComplete: data.profileComplete ?? false,
  };
  const updated = [newRecord, ...existing];
  persist(updated);
  broadcast();
  return newRecord;
}

/** Update an existing staff record by `id`. Returns the updated record or null. */
export function updateStaffMaster(
  id: string,
  patch: Partial<MasterStaffRecord>
): MasterStaffRecord | null {
  const existing = getStaffMaster();
  const idx = existing.findIndex(r => r.id === id);
  if (idx < 0) return null;
  const updated = [...existing];
  updated[idx] = { ...existing[idx], ...patch };
  persist(updated);
  broadcast();
  return updated[idx];
}

/** Delete a staff record by `id`. Returns true if a record was removed. */
export function deleteStaffMaster(id: string): boolean {
  const existing = getStaffMaster();
  const idx = existing.findIndex(r => r.id === id);
  if (idx < 0) return false;
  const updated = existing.filter(r => r.id !== id);
  persist(updated);
  broadcast();
  return true;
}

/**
 * Activate a pre-registered staff member (flip status to Active, set activatedAt).
 * Returns the updated record or null.
 */
export function activateStaffMaster(id: string): MasterStaffRecord | null {
  return updateStaffMaster(id, {
    status: 'Active',
    activatedAt: new Date().toISOString(),
  });
}

/**
 * Bulk-activate multiple staff members.
 * Returns the number of records updated.
 */
export function bulkActivateStaffMaster(ids: string[]): number {
  const idSet = new Set(ids);
  const existing = getStaffMaster();
  let updatedCount = 0;
  const now = new Date().toISOString();
  const updated = existing.map(r => {
    if (!idSet.has(r.id)) return r;
    updatedCount++;
    return { ...r, status: 'Active' as MasterAccessStatus, activatedAt: now };
  });
  if (updatedCount === 0) return 0;
  persist(updated);
  broadcast();
  return updatedCount;
}

/**
 * Merge a PreRegisteredStaff-shaped record into the master ledger.
 * If a record with the same `nationalId` already exists, it is updated
 * with the provided data. Otherwise a new record is added.
 * This is used by the Access Master Ledger when onboarding a new staff member.
 */
export function upsertFromPreReg(data: {
  fullName: string;
  nationalId: string;
  staffId?: string;
  email: string;
  phone: string;
  tscNumber?: string;
  systemRole?: MasterSystemRole;
  department?: string;
  assignedSubjects?: string[];
  tempAccessCode: string;
  status?: MasterAccessStatus;
}): MasterStaffRecord {
  const existing = getStaffMaster();
  const byNatId = existing.findIndex(r => r.nationalId === data.nationalId);
  if (byNatId >= 0) {
    // Merge into existing record
    const updated = [...existing];
    updated[byNatId] = {
      ...existing[byNatId],
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      tscNumber: data.tscNumber ?? existing[byNatId].tscNumber,
      systemRole: data.systemRole ?? existing[byNatId].systemRole,
      department: data.department ?? existing[byNatId].department,
      assignedSubjects: data.assignedSubjects ?? existing[byNatId].assignedSubjects,
      tempAccessCode: data.tempAccessCode,
      status: data.status ?? existing[byNatId].status,
    };
    persist(updated);
    broadcast();
    return updated[byNatId];
  }
  return addStaffMaster({
    name: data.fullName,
    nationalId: data.nationalId,
    staffId: data.staffId,
    email: data.email,
    phone: data.phone,
    tscNumber: data.tscNumber,
    systemRole: data.systemRole,
    department: data.department,
    assignedSubjects: data.assignedSubjects,
    tempAccessCode: data.tempAccessCode,
    status: data.status ?? 'Pre-Registered',
  });
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
// Re-export the canonical access key generator for consumers of this service.
export { generateAccessKey } from './staffAccessService';
