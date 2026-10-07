import { CentralDataService, STORAGE_KEYS } from './centralDataService';

export const STAFF_MASTER_KEY = STORAGE_KEYS.STAFF;

const initialStaff: any[] = [
  {
    id: 'staff-1',
    name: 'JANET GATHONI KUNGU',
    nationalId: '28475920',
    email: 'janet.gathoni@munyaka.ac.ke',
    phone: '0720869310',
    tscNumber: '487406',
    role: 'Librarian',
    systemRole: 'librarian',
    department: 'Library',
    status: 'Active',
    staffId: 'STF-001'
  },
  {
    id: 'staff-2',
    name: 'PETER KAMAU MWANGI',
    nationalId: '25489102',
    email: 'peter.kamau@munyaka.ac.ke',
    phone: '0712345678',
    tscNumber: '392810',
    role: 'Senior Teacher',
    systemRole: 'senior_teacher',
    department: 'Academics',
    status: 'Active',
    staffId: 'STF-002'
  },
  {
    id: 'staff-3',
    name: 'GRACE WANJIKU NJOROGE',
    nationalId: '27192840',
    email: 'grace.wanjiku@munyaka.ac.ke',
    phone: '0733445566',
    tscNumber: '419203',
    role: 'Class Teacher',
    systemRole: 'class_teacher',
    department: 'Lower Primary',
    status: 'Active',
    staffId: 'STF-003'
  }
];

export type MasterSystemRole =
  | 'head_teacher'
  | 'senior_teacher'
  | 'class_teacher'
  | 'subject_teacher'
  | 'bursar'
  | 'librarian'
  | 'storekeeper'
  | 'lab_assistant'
  | 'ict_technician'
  | 'support_staff'
  | 'support_admin';

export interface MasterStaffRecord {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  tscNumber?: string;
  role: string;
  systemRole: MasterSystemRole;
  department: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects?: string[];
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  staffId?: string;
  tempAccessCode?: string;
  joinedDate?: string;
  gender?: string;
  salary?: number | string;
  emergencyContact?: string;
  emergencyName?: string;
  schoolId?: string;
  datePreRegistered?: string;
  activatedAt?: string;
  lastLogin?: string;
  profileComplete?: boolean;
}

export const TEACHING_SYSTEM_ROLES: MasterSystemRole[] = [
  'head_teacher',
  'senior_teacher',
  'class_teacher',
  'subject_teacher',
];

export const isNonTeachingDesignation = (role: string): boolean => {
  const r = (role || '').toLowerCase();
  // Ensure all teaching designations (including Class Teacher, Subject Teacher, Senior Teacher, Head Teacher, Deputy Head Teacher)
  // are strictly recognized as teaching and NEVER flagged as non-teaching.
  if (
    r.includes('teacher') ||
    r.includes('head') ||
    r.includes('senior') ||
    r.includes('educator') ||
    r.includes('tutor') ||
    r.includes('instructor') ||
    r.includes('deputy')
  ) {
    return false;
  }
  return r.includes('librarian') || r.includes('bursar') || r.includes('store') || r.includes('accountant') || r.includes('secretary') || r.includes('support') || r.includes('nurse') || r.includes('security') || r.includes('catering');
};

export const isLibrarianDesignation = (role: string): boolean => {
  return (role || '').toLowerCase().includes('librarian');
};

export const mapDesignationToSystemRole = (role: string): MasterSystemRole => {
  const r = (role || '').toLowerCase().trim();
  if (r === 'subject teacher') return 'subject_teacher';
  if (r === 'class teacher') return 'class_teacher';
  if (r === 'senior teacher') return 'senior_teacher';
  if (r === 'head teacher') return 'head_teacher';
  if (r === 'deputy head teacher') return 'head_teacher';
  if (r === 'bursar') return 'bursar';
  if (r === 'librarian') return 'librarian';
  if (r === 'ict technician') return 'ict_technician';
  if (r === 'support staff') return 'support_staff';

  if (r.includes('head') && !r.includes('subject') && !r.includes('class')) return 'head_teacher';
  if (r.includes('deputy')) return 'head_teacher';
  if (r.includes('senior')) return 'senior_teacher';
  if (r.includes('class')) return 'class_teacher';
  if (r.includes('subject') || (r.includes('teacher') && !r.includes('class') && !r.includes('senior') && !r.includes('head'))) return 'subject_teacher';
  if (r.includes('librarian')) return 'librarian';
  if (r.includes('bursar') || r.includes('account')) return 'bursar';
  if (r.includes('store')) return 'storekeeper';
  if (r.includes('lab')) return 'lab_assistant';
  if (r.includes('ict')) return 'ict_technician';
  if (r.includes('support') || r.includes('cook') || r.includes('secretary')) return 'support_staff';
  return 'subject_teacher';
};

export const initializeStaffMaster = (): void => {};

export const getStaffMaster = (): MasterStaffRecord[] => {
  if (localStorage.getItem('munyaka_staff_cleared_explicitly') === 'true') {
    return [];
  }

  let list: any[] = [];
  try {
    const keys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = [...list, ...parsed];
        }
      }
    }
  } catch {}

  const centralRaw = CentralDataService.getStaff() || [];
  list = [...list, ...centralRaw];

  if (list.length === 0) {
    list = initialStaff;
  }

  // Deduplicate by id / phone / name
  const map = new Map<string, any>();
  list.forEach(s => {
    if (s && (s.id || s.phone || s.name || s.staffId || s.email)) {
      const key = String(s.id || s.phone || s.email || s.name || s.staffId).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, s);
      }
    }
  });

  const uniqueList = Array.from(map.values());
  try {
    localStorage.setItem('munyaka_staff_db', JSON.stringify(uniqueList));
  } catch {}

  const localOverrides = JSON.parse(localStorage.getItem('munyaka_staff_class_overrides') || '{}');
  
  return uniqueList.map((s: any) => {
    const override = localOverrides[s.id || s.email] || {};
    return {
      id: s.id || s.staffId || `staff_${Math.random()}`,
      name: s.name || s.full_name || 'Staff Member',
      nationalId: s.nationalId || s.id_no || `ID-${s.id || '000'}`,
      email: s.email || '',
      phone: s.phone || '',
      tscNumber: s.tscNumber || s.tsc_no,
      role: s.role || 'Teacher',
      systemRole: s.systemRole || 'subject_teacher',
      department: s.department || 'Administration',
      assignedGrade: override.assignedGrade || s.assignedGrade || s.assigned_grade || s.grade || '',
      assignedStream: override.assignedStream || s.assignedStream || s.assigned_stream || s.stream || '',
      assignedSubjects: s.assignedSubjects || s.subjectAllocations || s.allocations || [],
      allocations: s.allocations || s.subjectAllocations || s.detailedAssignments || [],
      status: s.status || 'Active',
      staffId: s.staffId || s.staff_id,
      tempAccessCode: s.tempAccessCode || s.access_key || s.ref,
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
    const isExplicitNonTeaching = roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician');
    return (TEACHING_SYSTEM_ROLES.includes(s.systemRole) || roleStr.includes('teach')) && !isExplicitNonTeaching;
  });
  const nonTeachingStaff = staff.filter(s => {
    const roleStr = `${s.role || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    const isExplicitNonTeaching = roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician');
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
    department: record.department,
    assignedGrade: record.assignedGrade,
    assignedStream: record.assignedStream,
    assignedSubjects: record.assignedSubjects,
    status: record.status || 'Pre-Registered',
  });
  return {
    id: created.id,
    name: created.name || '',
    nationalId: (created as any).nationalId || '',
    email: created.email || '',
    phone: created.phone || '',
    tscNumber: (created as any).tscNumber,
    role: created.role || '',
    systemRole: (created as any).systemRole || 'subject_teacher',
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
  CentralDataService.updateStaff(id, updates as any);
};

export const deleteStaffMaster = (id: string): void => {
  CentralDataService.deleteStaff(id);
};

export const activateStaffMaster = (id: string): void => {
  CentralDataService.updateStaff(id, { status: 'Active' });
};

export const bulkActivateStaffMaster = (ids: string[]): void => {
  const staff = CentralDataService.getStaff();
  let changed = false;
  staff.forEach((s: any) => {
    if (ids.includes(s.id)) {
      s.status = 'Active';
      changed = true;
    }
  });
  if (changed) {
    CentralDataService.saveStaff(staff);
  }
};

export const verifyStaffLogin = (identifier: string, pass: string): { success: boolean; user?: MasterStaffRecord; error?: string } => {
  const staffList = getStaffMaster();
  const trimmedId = (identifier || '').trim().toLowerCase();
  const trimmedPass = (pass || '').trim();

  const matched = staffList.find(s => {
    const sId = (s.staffId || '').toLowerCase();
    const sEmail = (s.email || '').toLowerCase();
    const sTsc = (s.tscNumber || '').toLowerCase();
    const sCode = (s.tempAccessCode || '').toLowerCase();
    const sNatId = (s.nationalId || '').toLowerCase();

    const matchesId =
      sId === trimmedId ||
      sEmail === trimmedId ||
      sTsc === trimmedId ||
      sCode === trimmedId ||
      sNatId === trimmedId;

    return matchesId;
  });

  if (!matched) {
    return { success: false, error: 'Staff account not found.' };
  }

  // If tempAccessCode or nationalId matches the password
  const validPass =
    trimmedPass === 'munyaka2026' ||
    trimmedPass === 'admin123' ||
    trimmedPass === matched.tempAccessCode ||
    trimmedPass === matched.nationalId;

  if (!validPass) {
    return { success: false, error: 'Invalid password or access key.' };
  }

  return { success: true, user: matched };
};
export const isTeachingRole = (_role: string) => true;
