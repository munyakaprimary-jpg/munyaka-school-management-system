import { CentralDataService, STORAGE_KEYS } from './centralDataService';

export const STAFF_MASTER_KEY = STORAGE_KEYS.STAFF;

export interface StaffMember {
  id: string;
  name: string;
  category?: string;
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
  status: 'Active' | 'Pre-Registered' | 'Suspended' | 'On Leave' | 'Inactive';
  staffId?: string;
  tempAccessCode?: string;
  accessCode?: string;
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

export const initialStaff: StaffMember[] = [];

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

export const initializeStaffMaster = (): void => {
  try {
    const raw = localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff_db') || localStorage.getItem('munyaka_staff');
    let list: any[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
    const hasJames = list.some(s => {
      const email = String(s.email || '').toLowerCase();
      const name = String(s.name || '').toLowerCase();
      return email.includes('ndiki') || name.includes('james ndiki');
    });
    if (!hasJames || list.length === 0) {
      list = [
        {
          id: 'staff_james_ndiki',
          staffId: 'MUN-4058',
          name: 'James Ndiki',
          email: 'ndiki@munyaka.sc.ke',
          phone: '+254 740 583 662',
          role: 'Senior Teacher',
          systemRole: 'senior_teacher',
          department: 'Academics',
          assignedGrade: 'Grade 5',
          assignedStream: 'Blue',
          status: 'Active',
          tempAccessCode: 'MUN-4058',
          accessCode: 'MUN-4058'
        }
      ];
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(list));
      localStorage.setItem('munyaka_staff_db', JSON.stringify(list));
    }
  } catch {}
};

export const getStaffMaster = (): MasterStaffRecord[] => {
  initializeStaffMaster();
  let list: any[] = [];
  try {
    const raw = localStorage.getItem('munyaka_master_staff_list') || localStorage.getItem('munyaka_staff_db') || localStorage.getItem('munyaka_staff');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch {}

  // Ensure default bootstrap active accounts if empty
  if (list.length === 0) {
    list = [
      {
        id: 'staff_james_ndiki',
        staffId: 'MUN-4058',
        name: 'James Ndiki',
        email: 'ndiki@munyaka.sc.ke',
        phone: '+254 740 583 662',
        role: 'Senior Teacher',
        systemRole: 'senior_teacher',
        department: 'Academics',
        assignedGrade: 'Grade 5',
        assignedStream: 'Blue',
        status: 'Active',
        tempAccessCode: 'MUN-4058',
        accessCode: 'MUN-4058'
      }
    ];
  } else {
    // Ensure James Ndiki is always present in the bootstrap ledger
    const hasJames = list.some(s => {
      const email = String(s.email || '').toLowerCase();
      const name = String(s.name || '').toLowerCase();
      return email.includes('ndiki') || name.includes('james ndiki');
    });
    if (!hasJames) {
      list.unshift({
        id: 'staff_james_ndiki',
        staffId: 'MUN-4058',
        name: 'James Ndiki',
        email: 'ndiki@munyaka.sc.ke',
        phone: '+254 740 583 662',
        role: 'Senior Teacher',
        systemRole: 'senior_teacher',
        department: 'Academics',
        assignedGrade: 'Grade 5',
        assignedStream: 'Blue',
        status: 'Active',
        tempAccessCode: 'MUN-4058',
        accessCode: 'MUN-4058'
      });
    }
  }

  const map = new Map<string, any>();
  list.forEach(s => {
    if (s && (s.id || s.phone || s.name || s.staffId || s.email)) {
      const key = String(s.email || s.id || s.phone || s.name).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, s);
      }
    }
  });

  const uniqueList = Array.from(map.values());
  try {
    localStorage.setItem('munyaka_master_staff_list', JSON.stringify(uniqueList));
    localStorage.setItem('munyaka_staff_db', JSON.stringify(uniqueList));
  } catch {}

  return uniqueList.map((s: any) => {
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
      assignedGrade: s.assignedGrade || s.assigned_grade || s.grade || '',
      assignedStream: s.assignedStream || s.assigned_stream || s.stream || '',
      assignedSubjects: s.assignedSubjects || s.subjectAllocations || s.allocations || [],
      status: s.status || 'Active',
      staffId: s.staffId || s.staff_id,
      tempAccessCode: s.tempAccessCode || s.accessCode || s.access_key || s.ref,
      accessCode: s.accessCode || s.tempAccessCode || s.access_key || s.ref,
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
  const cleanInput = trimmedId.includes('@') ? trimmedId : `${trimmedId}@munyaka.sc.ke`;
  const normalizedPass = trimmedPass.toUpperCase();

  const matched = staffList.find(s => {
    const sEmail = (s.email || '').toLowerCase().trim();
    const sStaffId = (s.staffId || '').toLowerCase().trim();
    const sId = (s.id || '').toLowerCase().trim();
    const sName = (s.name || '').toLowerCase().trim();
    return (
      sEmail === cleanInput ||
      sEmail === trimmedId ||
      sStaffId === trimmedId ||
      sId === trimmedId ||
      sName === trimmedId ||
      sEmail.split('@')[0] === trimmedId.split('@')[0]
    );
  });

  if (!matched) {
    return { success: false, error: 'Staff account not found. Please enter your full school email ending with @munyaka.sc.ke.' };
  }

  const storedCode = (matched.tempAccessCode || (matched as any).accessCode || '').trim();
  const normalizedStoredCode = storedCode.toUpperCase();
  const legacyNumericCode = storedCode.replace(/[^0-9]/g, '');
  const inputNumericCode = trimmedPass.replace(/[^0-9]/g, '');

  const validPass =
    storedCode !== '' &&
    (normalizedStoredCode === normalizedPass ||
     storedCode === trimmedPass ||
     (legacyNumericCode !== '' && inputNumericCode !== '' && legacyNumericCode === inputNumericCode));

  if (!validPass) {
    return { success: false, error: 'Invalid access code. Please check your assigned MUNYAKA-XXXX or legacy numeric staff code against the master staff ledger.' };
  }

  return { success: true, user: matched };
};
export const isTeachingRole = (_role: string) => true;
