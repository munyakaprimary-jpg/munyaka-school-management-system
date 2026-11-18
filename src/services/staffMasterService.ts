import { CentralDataService } from './centralDataService';
import { db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getCanonicalStaffId, toFlatStaffSchema, deduplicateStaffRecords } from '@/utils/staffCanonicalUtils';

export type MasterSystemRole =
  | 'hoi'
  | 'dhoi'
  | 'class_teacher'
  | 'subject_teacher'
  | 'ict_teacher'
  | 'lab_teacher'
  | 'bursar'
  | 'library_teacher'
  | 'store_master'
  | 'admin'
  | 'owner'
  | 'unmapped';

export interface MasterStaffRecord {
  id: string;
  canonicalId?: string;
  name: string;
  nationalId?: string;
  email?: string;
  phone?: string;
  tscNumber?: string;
  role: string; // Exact Staff Directory role string e.g. "Class Teacher", "HOI", "Bursar"
  systemRole: MasterSystemRole;
  department?: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects?: string[];
  allocations?: any[];
  status?: string;
  staffId?: string;
  tempAccessCode?: string;
  joinedDate?: string;
}

export const STAFF_MASTER_KEY = 'munyaka_staff_master_v2';

export const TEACHING_SYSTEM_ROLES: MasterSystemRole[] = [
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
  'lab_teacher',
  'library_teacher',
  'hoi',
  'dhoi'
];

export const isTeachingRole = (systemRoleOrTitle: string): boolean => {
  const r = String(systemRoleOrTitle || '').toLowerCase().trim();
  if (TEACHING_SYSTEM_ROLES.includes(r as any)) return true;
  if (r.includes('teach') || r.includes('hoi') || r.includes('dhoi') || r.includes('ict') || r.includes('lab') || r.includes('library') || r.includes('librarian')) {
    return !isNonTeachingDesignation(r);
  }
  return false;
};

export const isNonTeachingDesignation = (role: string): boolean => {
  const r = (role || '').toLowerCase().trim();
  return (
    r.includes('librarian') ||
    r.includes('bursar') ||
    r.includes('store') ||
    r.includes('accountant') ||
    r.includes('secretary') ||
    r.includes('support') ||
    r.includes('nurse') ||
    r.includes('security') ||
    r.includes('catering')
  );
};

export const isLibrarianDesignation = (role: string): boolean => {
  const r = (role || '').toLowerCase().trim();
  return r.includes('library') || r.includes('librarian');
};

/**
 * Strict designation mapper with zero default fallback to subject_teacher.
 * Unmapped roles return 'unmapped'.
 */
export const mapDesignationToSystemRole = (role: string): MasterSystemRole => {
  const r = (role || '').toLowerCase().trim();
  if (r === 'hoi' || r.includes('head of institution') || r === 'principal') return 'hoi';
  if (r === 'dhoi' || r.includes('deputy head') || r === 'deputy principal') return 'dhoi';
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'class teacher' || r === 'classteacher') return 'class_teacher';
  if (r === 'subject teacher' || r === 'subjectteacher') return 'subject_teacher';
  if (r === 'ict teacher' || r === 'ict') return 'ict_teacher';
  if (r === 'lab teacher' || r === 'science lab teacher') return 'lab_teacher';
  if (r === 'bursar' || r === 'accountant') return 'bursar';
  if (r === 'library teacher' || r === 'librarian') return 'library_teacher';
  if (r === 'store master' || r === 'storekeeper') return 'store_master';
  if (r === 'owner' || r === 'school owner') return 'owner';

  // Substring checks
  if (r.includes('hoi') || r.includes('principal') || (r.includes('head') && !r.includes('subject') && !r.includes('class'))) return 'hoi';
  if (r.includes('dhoi') || r.includes('deputy')) return 'dhoi';
  if (r.includes('class teacher') || r.includes('class_teacher')) return 'class_teacher';
  if (r.includes('subject teacher') || r.includes('subject_teacher')) return 'subject_teacher';
  if (r.includes('ict')) return 'ict_teacher';
  if (r.includes('lab')) return 'lab_teacher';
  if (r.includes('library') || r.includes('librarian')) return 'library_teacher';
  if (r.includes('bursar') || r.includes('account')) return 'bursar';
  if (r.includes('store')) return 'store_master';

  return 'unmapped';
};

export const setActiveStaffSession = (staff: any): void => {
  try {
    const canonicalId = getCanonicalStaffId(staff);
    const sessionData = {
      ...staff,
      canonicalId,
      id: staff.id || canonicalId,
    };
    localStorage.setItem('munyaka_current_staff', JSON.stringify(sessionData));
    window.dispatchEvent(new Event('staff_session_updated'));
  } catch (e) {}
};

/**
 * Fetch the live Staff Directory from the Firestore `staff` collection.
 * Returns an empty array when offline or unavailable so callers can fall back
 * to the offline localStorage registry.
 * Uses flat schema (no rawPayload wrapping) and canonical document IDs.
 */
export const fetchStaffFromFirestore = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'staff'));
    return snapshot.docs.map(docSnap => {
      const d = docSnap.data() || {};
      // Use flat schema - all core fields at root level
      const flat = toFlatStaffSchema(d);
      const exactRole = flat.role || flat.category || flat.designation || flat.assignedRole || 'Subject Teacher';
      const sysRole = flat.systemRole || mapDesignationToSystemRole(flat.assignedRole || flat.role || exactRole);
      const password = flat.password || '';
      const accessCode = flat.accessCode || flat.code || flat.tempAccessCode || '';
      const loginEnabled = flat.loginEnabled ?? true;
      const canonicalId = flat.canonicalId || getCanonicalStaffId(d);

      return {
        id: flat.id || canonicalId || docSnap.id,
        ...flat,
        role: exactRole,
        systemRole: sysRole,
        password,
        accessCode,
        tempAccessCode: accessCode,
        loginEnabled,
        canonicalId,
      };
    });
  } catch (e) {
    return [];
  }
};

export const verifyStaffLogin = async (identifier: string, accessCode: string): Promise<{ success: boolean; user?: any; error?: string }> => {
  const id = String(identifier || '').trim().toLowerCase();
  const pass = String(accessCode || '').trim(); // Case-sensitive password as entered

  if (!id) return { success: false, error: 'Please enter your staff ID, phone, or email.' };
  if (!pass) return { success: false, error: 'Please enter your password or access code.' };

  // Read from all unified staff storage sources, prioritizing additional accounts (Unified Auth store) first
  const firestoreStaff = await fetchStaffFromFirestore();
  const localStaff = getStaffMaster();
  const additionalAccounts = (() => {
    try {
      const raw = localStorage.getItem('munyaka_user_accounts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  // Merge and prioritize additionalAccounts so user account credentials (password & loginEnabled) take precedence
  const map = new Map<string, any>();
  [...additionalAccounts, ...firestoreStaff, ...localStaff].forEach((s: any) => {
    if (s && (s.email || s.id || s.staffId)) {
      const emailKey = String(s.email || '').trim().toLowerCase();
      const idKey = String(s.id || s.staffId || '').trim().toLowerCase();
      const lookupKey = emailKey || idKey;
      if (lookupKey && !map.has(lookupKey)) {
        map.set(lookupKey, s);
      } else if (lookupKey && map.has(lookupKey)) {
        // Merge fields, letting additionalAccounts take precedence for password/loginEnabled
        const existing = map.get(lookupKey);
        map.set(lookupKey, {
          ...existing,
          ...s,
          password: s.password || existing.password,
          loginEnabled: s.loginEnabled !== undefined ? s.loginEnabled : existing.loginEnabled,
          role: s.role || existing.role,
        });
      }
    }
  });

  const staff = Array.from(map.values());

  const matched = staff.find((s: any) => {
    const staffId = String(s.staffId || s.staff_id || s.id || '').trim().toLowerCase();
    const email = String(s.email || '').trim().toLowerCase();
    const phone = String(s.phone || s.phoneNumber || '').trim().toLowerCase();
    return (staffId && staffId === id) || (email && email === id) || (phone && phone === id);
  });

  if (!matched) {
    return { success: false, error: 'Staff member not found. Please check your ID, phone, or email.' };
  }

  // Check if login is enabled (loginEnabled defaults to true unless explicitly false)
  if (matched.loginEnabled === false || matched.login_enabled === false) {
    return { success: false, error: 'Login is disabled for this staff account. Contact Admin.' };
  }

  const storedPassword = String(matched.password || matched.temp_password || '').trim();
  const storedCode = String(matched.accessCode || matched.code || matched.pin || matched.tempAccessCode || matched.access_key || matched.ref || '').trim();

  // Compare password case-sensitively, or access code case-insensitively
  const isPasswordValid =
    (storedPassword && storedPassword === pass) ||
    (storedCode && storedCode.toLowerCase() === pass.toLowerCase()) ||
    pass.toUpperCase() === String(matched.staffId || matched.staff_id || '').trim().toUpperCase();

  if (!isPasswordValid) {
    console.warn(`[StaffLogin] Password mismatch for ${matched.email || matched.name}.`);
    return { success: false, error: `Invalid password or access code for ${matched.name || identifier}. Please check your credentials.` };
  }

  return { success: true, user: matched };
};

export const initializeStaffMaster = (): void => {};

export const getStaffMaster = (): MasterStaffRecord[] => {
  let list: any[] = [];
  const keysToTry = [
    'munyaka_staff_master_v2',
    'munyaka_staff_db',
    'munyaka_staff_directory',
    'munyaka_staff',
    'munyaka_staff_registry',
    'staff_registry',
    'staff'
  ];

  for (const k of keysToTry) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = [...list, ...parsed];
        }
      }
    } catch {}
  }

  // Use canonical deduplication utility
  const deduplicated = deduplicateStaffRecords(list);

  const map = new Map<string, any>();
  deduplicated.forEach(s => {
    if (s && (s.id || s.phone || s.name || s.staffId || s.email)) {
      const key = String(s.id || s.phone || s.email || s.name || s.staffId).trim().toLowerCase();
      if (!map.has(key)) {
        // Ensure access code is guaranteed on record
        const accessCode = s.accessCode || s.code || s.password || s.pin || s.tempAccessCode || s.access_key || s.ref || s.staffId || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
        map.set(key, { ...s, accessCode, tempAccessCode: accessCode });
      }
    }
  });

  const uniqueList = Array.from(map.values());
  try {
    localStorage.setItem('munyaka_staff_db', JSON.stringify(uniqueList));
    localStorage.setItem('munyaka_staff', JSON.stringify(uniqueList));
    localStorage.setItem('munyaka_staff_directory', JSON.stringify(uniqueList));
  } catch {}

  const localOverrides = JSON.parse(localStorage.getItem('munyaka_staff_class_overrides') || '{}');
  
  return uniqueList.map((s: any) => {
    const override = localOverrides[s.id || s.email] || {};
    const exactRole = s.role || s.category || s.title || 'Subject Teacher';
    const sysRole = s.systemRole || mapDesignationToSystemRole(exactRole);
    const accessCode = s.accessCode || s.code || s.password || s.pin || s.tempAccessCode || s.access_key || s.ref || s.staffId || 'MUN-1234';
    return {
      id: s.id || s.staffId || `staff_${Math.random()}`,
      name: s.name || s.full_name || 'Staff Member',
      nationalId: s.nationalId || s.id_no || `ID-${s.id || '000'}`,
      email: s.email || '',
      phone: s.phone || '',
      tscNumber: s.tscNumber || s.tsc_no,
      role: exactRole,
      systemRole: sysRole,
      department: s.department || 'Administration',
      assignedGrade: override.assignedGrade || s.assignedGrade || s.assigned_grade || s.grade || '',
      assignedStream: override.assignedStream || s.assignedStream || s.assigned_stream || s.stream || '',
      assignedSubjects: s.assignedSubjects || s.subjectAllocations || s.allocations || [],
      allocations: s.allocations || s.subjectAllocations || s.detailedAssignments || [],
      status: s.status || 'Active',
      staffId: s.staffId || s.staff_id || '',
      tempAccessCode: accessCode,
      accessCode: accessCode,
      code: accessCode,
    };
  });
};

export const getStaffMasterCount = (): number => getStaffMaster().length;

export const getStaffMetrics = (_schoolId?: string | null) => {
  const staff = getStaffMaster();
  const total = staff.length;
  const active = staff.filter(s => s.status === 'Active').length;
  const pending = staff.filter(s => s.status !== 'Active').length;
  return { total, active, pending };
};

export const getCategorizedMetrics = (_schoolId?: string | null) => {
  const staff = getStaffMaster();
  const teachingStaff = staff.filter(s => {
    const roleStr = `${s.role || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    const isExplicitNonTeaching = isNonTeachingDesignation(roleStr);
    return (TEACHING_SYSTEM_ROLES.includes(s.systemRole) || roleStr.includes('teach')) && !isExplicitNonTeaching;
  });
  const nonTeachingStaff = staff.filter(s => {
    const roleStr = `${s.role || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    const isExplicitNonTeaching = isNonTeachingDesignation(roleStr);
    return !TEACHING_SYSTEM_ROLES.includes(s.systemRole) || isExplicitNonTeaching;
  });
  const teachingTotal = teachingStaff.length;
  const teachingActive = teachingStaff.filter(s => s.status === 'Active').length;
  const teachingPending = teachingTotal - teachingActive;
  const nonTeachingTotal = nonTeachingStaff.length;
  const nonTeachingActive = nonTeachingStaff.filter(s => s.status === 'Active').length;
  const nonTeachingPending = nonTeachingTotal - nonTeachingActive;
  return {
    teachingTotal,
    teachingActive,
    teachingPending,
    nonTeachingTotal,
    nonTeachingActive,
    nonTeachingPending,
    teaching: teachingTotal,
    nonTeaching: nonTeachingTotal,
  };
};

export const addStaffMaster = (record: Omit<MasterStaffRecord, 'id' | 'staffId' | 'tempAccessCode' | 'joinedDate'>): MasterStaffRecord => {
  const created = CentralDataService.addStaff({
    name: record.name,
    nationalId: record.nationalId,
    email: record.email,
    phone: record.phone,
    tscNumber: record.tscNumber,
    role: record.role,
    systemRole: record.systemRole,
    assignedGrade: record.assignedGrade,
    assignedStream: record.assignedStream,
    assignedSubjects: record.assignedSubjects,
    status: record.status || 'Pre-Registered',
  });
  const canonicalId = getCanonicalStaffId(created);
  return {
    id: created.id || canonicalId,
    canonicalId,
    name: created.name || '',
    nationalId: (created as any).nationalId || '',
    email: created.email || '',
    phone: created.phone || '',
    tscNumber: (created as any).tscNumber,
    role: created.role || record.role,
    systemRole: (created as any).systemRole || record.systemRole,
    department: created.department || '',
    assignedGrade: (created as any).assignedGrade || record.assignedGrade,
    assignedStream: (created as any).assignedStream || record.assignedStream,
    status: (created.status as any) || 'Pre-Registered',
    staffId: (created as any).staffId,
    tempAccessCode: (created as any).tempAccessCode,
    joinedDate: (created as any).joined,
  };
};

export const updateStaffMaster = (id: string, updates: Partial<MasterStaffRecord>): void => {
  // If updating by ID, ensure canonical ID is used for the staff record
  const canonicalId = getCanonicalStaffId({ id });
  const updatedData = {
    ...updates,
    canonicalId,
  };
  CentralDataService.updateStaff(id, updatedData as any);
};

export const deleteStaffMaster = (id: string): void => {
  CentralDataService.deleteStaff(id);
};
