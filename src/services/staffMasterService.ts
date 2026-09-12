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
const LEGACY_STAFF_KEY    = 'munyaka_staff';

/**
 * Teaching staff system roles — these roles are directly involved in
 * classroom instruction and student academic development.
 */
export const TEACHING_SYSTEM_ROLES = [
  'head_teacher',
  'deputy_head_teacher',
  'senior_teacher',
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
] as const;

export type TeachingRole = typeof TEACHING_SYSTEM_ROLES[number];

/**
 * Designation to System Role mapping for dynamic role synchronization.
 * When a staff member's designation changes, this mapping determines their system role.
 */
export const DESIGNATION_TO_SYSTEM_ROLE: Record<string, MasterSystemRole> = {
  // Teaching designations
  'HEAD TEACHER': 'head_teacher',
  'HEADTEACHER': 'head_teacher',
  'PRINCIPAL': 'head_teacher',
  'DEPUTY HEAD TEACHER': 'deputy_head_teacher',
  'DEPUTY HEAD': 'deputy_head_teacher',
  'SENIOR TEACHER': 'senior_teacher',
  'CLASS TEACHER': 'class_teacher',
  'SUBJECT TEACHER': 'subject_teacher',
  'ICT TEACHER': 'ict_teacher',
  // Non-teaching designations
  'LIBRARIAN': 'librarian',
  'LIBRARY': 'librarian',
  'BURSAR': 'bursar',
  'FINANCE': 'bursar',
  'STOREKEEPER': 'storekeeper',
  'STORES': 'storekeeper',
  'LAB ASSISTANT': 'lab_assistant',
  'LABORATORY ASSISTANT': 'lab_assistant',
  'ICT TECHNICIAN': 'ict_technician',
  'ICT TECH': 'ict_technician',
  'SUPPORT STAFF': 'support_staff',
  'ADMIN': 'support_admin',
  'ADMINISTRATOR': 'support_admin',
};

/**
 * Maps a designation string to its corresponding system role.
 * Returns undefined if no mapping exists (keeps existing role).
 */
export const mapDesignationToSystemRole = (designation: string): MasterSystemRole | undefined => {
  const normalized = designation.toUpperCase().trim();
  return DESIGNATION_TO_SYSTEM_ROLE[normalized];
};

/**
 * Returns true if the designation indicates a librarian role.
 */
export const isLibrarianDesignation = (designation: string): boolean => {
  const normalized = designation.toUpperCase().trim();
  return normalized === 'LIBRARIAN' || normalized === 'LIBRARY';
};

/**
 * Returns true if the designation indicates a non-teaching/support role.
 */
export const isNonTeachingDesignation = (designation: string): boolean => {
  const role = mapDesignationToSystemRole(designation);
  return role ? isNonTeachingRole(role) : false;
};

/**
 * Returns true if the given systemRole is a teaching role.
 */
export const isTeachingRole = (systemRole?: string): boolean => {
  if (!systemRole) return false;
  // Explicitly exclude librarian from teaching roles
  if (systemRole === 'librarian') return false;
  return TEACHING_SYSTEM_ROLES.includes(systemRole as TeachingRole);
};

/**
 * Returns true if the given systemRole is a non-teaching role.
 */
export const isNonTeachingRole = (systemRole?: string): boolean => {
  return !isTeachingRole(systemRole);
};

/**
 * Check if a staff member is a librarian based on their systemRole or designation.
 * Used in staff lookup helpers like isTeacher(), canMarkRegister().
 */
export const isLibrarian = (staff: { systemRole?: string; role?: string } | null | undefined): boolean => {
  if (!staff) return false;
  const systemRole = (staff.systemRole || '').toLowerCase().trim();
  const designation = (staff.role || '').toUpperCase().trim();
  if (systemRole === 'librarian') return true;
  if (designation === 'LIBRARIAN' || designation === 'LIBRARY') return true;
  return false;
};

/**
 * Check if a staff member is a teacher (not librarian, not non-teaching).
 * Used in staff lookup helpers.
 */
export const isTeacher = (staff: { systemRole?: string; role?: string; isTeacher?: boolean } | null | undefined): boolean => {
  if (!staff) return false;
  // Explicitly return false for librarian
  if (isLibrarian(staff)) return false;
  // Check explicit flag first
  if (staff.isTeacher === true) return true;
  // Check system role
  if (staff.systemRole) return isTeachingRole(staff.systemRole);
  return false;
};

/**
 * Check if a staff member can mark the attendance register.
 * Librarians and non-teaching staff should return false.
 */
export const canMarkRegister = (staff: { systemRole?: string; role?: string; isTeacher?: boolean } | null | undefined): boolean => {
  if (!staff) return false;
  // Librarians and non-teaching staff cannot mark registers
  if (isLibrarian(staff)) return false;
  if (staff.systemRole) return isTeachingRole(staff.systemRole);
  // Fallback: check designation for backward compatibility
  const designation = (staff.role || '').toUpperCase();
  const nonTeachingDesignations = ['LIBRARIAN', 'BURSAR', 'STOREKEEPER', 'LAB ASSISTANT', 'ICT TECHNICIAN', 'SUPPORT STAFF'];
  if (nonTeachingDesignations.some(d => designation.includes(d))) return false;
  return true;
};

/**
 * Categorized staff metrics for UI display.
 * Breaks down total staff into Teaching vs Non-Teaching with active/pending counts.
 */
export interface CategorizedStaffMetrics {
  total: { count: number; active: number; pending: number };
  teaching: { count: number; active: number; pending: number };
  nonTeaching: { count: number; active: number; pending: number };
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

const MASTER_SEED: MasterStaffRecord[] = [
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
  // Non-teaching / Support Staff
  {
    id: 'staff-010',
    staffId: 'S001',
    name: 'Grace Atieno',
    nationalId: '22334455',
    email: 'grace.atieno@munyaka.sc.ke',
    phone: '+254 720 010 010',
    systemRole: 'support_staff',
    role: 'Support Staff',
    department: 'Administration',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-1234',
    status: 'Active',
    datePreRegistered: '2020-03-15',
    gender: 'Female',
    salary: 45000,
    joinedDate: '2020-03-15',
    emergencyContact: '+254722010010',
    emergencyName: 'James Atieno',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-011',
    staffId: 'L001',
    name: 'Mary Wanjiku',
    nationalId: '33445566',
    email: 'mary.wanjiku@munyaka.sc.ke',
    phone: '+254 720 011 011',
    systemRole: 'librarian',
    role: 'Librarian',
    department: 'Library',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-5678',
    status: 'Active',
    datePreRegistered: '2019-08-20',
    gender: 'Female',
    salary: 55000,
    joinedDate: '2019-08-20',
    emergencyContact: '+254722011011',
    emergencyName: 'Peter Wanjiku',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-012',
    staffId: 'K001',
    name: 'Joseph Kimani',
    nationalId: '44556677',
    email: 'joseph.kimani@munyaka.sc.ke',
    phone: '+254 720 012 012',
    systemRole: 'storekeeper',
    role: 'Storekeeper',
    department: 'Procurement',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-9012',
    status: 'Active',
    datePreRegistered: '2018-01-10',
    gender: 'Male',
    salary: 50000,
    joinedDate: '2018-01-10',
    emergencyContact: '+254722012012',
    emergencyName: 'Anne Kimani',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-013',
    staffId: 'LA001',
    name: 'Samuel Otieno',
    nationalId: '55667788',
    email: 'samuel.otieno@munyaka.sc.ke',
    phone: '+254 720 013 013',
    systemRole: 'lab_assistant',
    role: 'Lab Assistant',
    department: 'Science',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-3456',
    status: 'Active',
    datePreRegistered: '2021-06-01',
    gender: 'Male',
    salary: 52000,
    joinedDate: '2021-06-01',
    emergencyContact: '+254722013013',
    emergencyName: 'Grace Otieno',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
  {
    id: 'staff-014',
    staffId: 'IT001',
    name: 'Daniel Mutua',
    nationalId: '66778899',
    email: 'daniel.mutua@munyaka.sc.ke',
    phone: '+254 720 014 014',
    systemRole: 'ict_technician',
    role: 'ICT Technician',
    department: 'ICT',
    assignedSubjects: [],
    tempAccessCode: 'MUNYAKA-7890',
    status: 'Active',
    datePreRegistered: '2020-09-15',
    gender: 'Male',
    salary: 65000,
    joinedDate: '2020-09-15',
    emergencyContact: '+254722014014',
    emergencyName: 'Catherine Mutua',
    profileComplete: true,
    schoolId: 'munyaka-sc',
  },
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

const mapSystemRoleToRoleLabel = (role: MasterSystemRole): string => {
  switch (role) {
    case 'head_teacher':    return 'Head Teacher';
    case 'senior_teacher':  return 'Senior Teacher';
    case 'class_teacher':   return 'Class Teacher';
    case 'subject_teacher': return 'Subject Teacher';
    case 'ict_teacher':     return 'ICT Teacher';
    case 'bursar':          return 'Bursar / Finance';
    case 'support_admin':   return 'System Admin';
    case 'support_staff':   return 'Support Staff';
    case 'librarian':       return 'Librarian';
    case 'storekeeper':     return 'Storekeeper';
    case 'lab_assistant':   return 'Lab Assistant';
    case 'ict_technician':  return 'ICT Technician';
    default:                 return 'Staff';
  }
};

/** Count active records (status is 'active', case-insensitive). */
function countActive(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'active').length;
}

/** Count pending records (status is 'pre-registered', case-insensitive). */
function countPending(records: MasterStaffRecord[]): number {
  return records.filter(r => (r.status || '').toLowerCase() === 'pre-registered').length;
}

// ─── Hard Purge ───────────────────────────────────────────────────────────────

interface PurgeResult {
  storageKeysRemoved: number;
  recordsPurged: number;
  recordIdsRemoved: string[];
}

export function purgeLegacyAndSuspectRecords(): PurgeResult {
  const PURGE_KEY_PATTERNS = [
    /james/i, /ndiki/i, /PR-staff-1788/i,
    /prereg/i,
    /u3uh5j/i,
  ];
  const PURGE_NAME_PATTERNS = [/james/i, /ndiki/i];
  const PURGE_EMAIL_PATTERNS = [/james/i, /ndiki/i, /u3uh5j/i];
  const PURGE_ID_PATTERNS = [/PR-staff-1788/i];
  const EXPLICIT_KEYS = [
    'munyaka_staff_prereg',
    'prereg_staff',
    'munyaka_staff_migrated',
    'MUNYAKA_STAFF_PREREG',
    'prereg_staff_list',
    'staff_prereg_backup',
  ];

  const matchesAny = (text: string, patterns: RegExp[]): boolean =>
    patterns.some(p => p.test(text));

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

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i) ?? '';
    if (matchesAny(key, PURGE_KEY_PATTERNS)) {
      sessionStorage.removeItem(key);
      storageKeysRemoved++;
      console.log(`[staffMasterService] PURGE removed sessionStorage key: "${key}"`);
    }
  }

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

/**
 * Migrate staff records to fix librarian role synchronization issues.
 * - Records with "LIBRARIAN" designation but non-librarian systemRole get corrected
 * - Records with librarian systemRole but teaching fields (assignedSubjects, etc.) get cleaned up
 * - Any staff member named "Mary Wairimu" or similar with librarian designation gets fixed
 */
interface LibrarianMigrationResult {
  migrated: number;
  cleaned: number;
  total: number;
}

export function migrateLibrarianRoles(): LibrarianMigrationResult {
  try {
    const raw = localStorage.getItem(STAFF_MASTER_KEY);
    if (!raw) return { migrated: 0, cleaned: 0, total: 0 };

    const records: MasterStaffRecord[] = JSON.parse(raw);
    if (!Array.isArray(records) || records.length === 0) {
      return { migrated: 0, cleaned: 0, total: 0 };
    }

    let migrated = 0;
    let cleaned = 0;
    const migratedRecords: MasterStaffRecord[] = records.map(record => {
      let needsPersist = false;
      let updatedRecord = { ...record };
      const designation = (record.role || '').toUpperCase().trim();

      // 1. Fix designation to systemRole synchronization
      if (designation === 'LIBRARIAN' && record.systemRole !== 'librarian') {
        updatedRecord.systemRole = 'librarian';
        needsPersist = true;
        migrated++;
        console.log(`[staffMasterService] Migrating librarian role: "${record.name}" (${record.id}) systemRole: "${record.systemRole}" -> "librarian"`);
      }

      // 2. Clean up teaching fields for librarians and non-teaching staff
      if (isNonTeachingRole(record.systemRole) || isLibrarianDesignation(designation)) {
        const hadTeachingFields =
          (updatedRecord.assignedSubjects && updatedRecord.assignedSubjects.length > 0) ||
          updatedRecord.assignedGrade ||
          updatedRecord.assignedStream;

        if (hadTeachingFields) {
          updatedRecord.assignedSubjects = [];
          updatedRecord.assignedGrade = undefined;
          updatedRecord.assignedStream = undefined;
          needsPersist = true;
          cleaned++;
          console.log(`[staffMasterService] Cleaning teaching fields for non-teaching staff: "${record.name}" (${record.id})`);
        }
      }

      // 3. Sync designation label to match system role (for consistency)
      const expectedRoleLabel = mapSystemRoleToRoleLabel(record.systemRole);
      if (designation && designation !== expectedRoleLabel.toUpperCase() && !designation.includes(expectedRoleLabel)) {
        // Only update if it's a known non-teaching designation mismatch
        if (isNonTeachingRole(record.systemRole) && isNonTeachingDesignation(designation)) {
          updatedRecord.role = expectedRoleLabel;
          needsPersist = true;
          migrated++;
        }
      }

      return needsPersist ? updatedRecord : record;
    });

    if (migrated > 0 || cleaned > 0) {
      persist(migratedRecords);
      broadcast();
      console.log(`[staffMasterService] Librarian migration complete: ${migrated} migrated, ${cleaned} cleaned`);
    }

    return {
      migrated,
      cleaned,
      total: records.length,
    };
  } catch (err) {
    console.error('[staffMasterService] migrateLibrarianRoles failed:', err);
    return { migrated: 0, cleaned: 0, total: 0 };
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function persist(records: MasterStaffRecord[]): void {
  const json = JSON.stringify(records);
  localStorage.setItem(STAFF_MASTER_KEY, json);
  localStorage.setItem('munyaka_staff', json);
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

function broadcast(): void {
  notifyDataChanged(STAFF_MASTER_KEY);
  notifyDataChanged(LEGACY_DIRECTORY_KEY);
  notifyDataChanged(LEGACY_PREREG_KEY);
  window.dispatchEvent(new Event('staff-changed'));
  window.dispatchEvent(new CustomEvent('munyaka:staff-directory-changed'));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function initializeStaffMaster(): void {
  try {
    const purge = purgeLegacyAndSuspectRecords();
    if (purge.recordsPurged > 0 || purge.storageKeysRemoved > 0) {
      console.log(
        `[staffMasterService] Purge results: ${purge.recordsPurged} records removed, ` +
        `${purge.storageKeysRemoved} storage keys removed`
      );
    }

    migrateStaffAccessKeys();

    // Migrate librarian roles if needed
    const existing = localStorage.getItem(STAFF_MASTER_KEY);
    if (existing !== null) {
      // Only migrate if there are existing records
      const migrateResult = migrateLibrarianRoles();
      if (migrateResult.migrated > 0 || migrateResult.cleaned > 0) {
        console.log(
          `[staffMasterService] Role sync: ${migrateResult.migrated} roles migrated, ` +
          `${migrateResult.cleaned} records cleaned`
        );
      }
      return;
    }

    persist(MASTER_SEED);
    console.log('[staffMasterService] Staff master ledger seeded with initial data');
  } catch (err) {
    console.error('[staffMasterService] initializeStaffMaster failed:', err);
  }
}

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

export function getStaffMasterBySchool(schoolId: string | null): MasterStaffRecord[] {
  return getStaffMaster().filter(r =>
    !schoolId || !r.schoolId || r.schoolId === schoolId
  );
}

export function getActiveStaffMaster(): MasterStaffRecord[] {
  return getStaffMaster().filter(r => r.status === 'Active');
}

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

export function addStaffMaster(
  data: Partial<MasterStaffRecord> & { name: string; nationalId: string; email: string; phone: string }
): MasterStaffRecord {
  const existing = getStaffMaster();
  const accessKey = generateAccessKey();
  const newRecord: MasterStaffRecord = {
    id: accessKey,
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
    accessKey,
    tempAccessCode: accessKey,
    status: data.status ?? 'Pre-Registered',
    datePreRegistered: data.datePreRegistered ?? new Date().toISOString().split('T')[0],
    profileComplete: data.profileComplete ?? false,
  };
  const updated = [newRecord, ...existing];
  persist(updated);
  broadcast();
  return newRecord;
}

export function updateStaffMaster(
  id: string,
  patch: Partial<MasterStaffRecord>
): MasterStaffRecord | null {
  const existing = getStaffMaster();
  const idx = existing.findIndex(r => r.id === id || r.staffId === id || r.email === patch.email);
  if (idx < 0) return null;
  const targetId = existing[idx].id;
  const updated = existing.map(r => r.id === targetId ? { ...r, ...patch } : r);
  persist(updated);
  broadcast();
  return updated.find(r => r.id === targetId) || null;
}

export function deleteStaffMaster(id: string): boolean {
  const existing = getStaffMaster();
  const idx = existing.findIndex(r => r.id === id);
  if (idx < 0) return false;
  const updated = existing.filter(r => r.id !== id);
  persist(updated);
  broadcast();
  return true;
}

export function activateStaffMaster(id: string): MasterStaffRecord | null {
  return updateStaffMaster(id, {
    status: 'Active',
    activatedAt: new Date().toISOString(),
  });
}

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
export { generateAccessKey } from './staffAccessService';
