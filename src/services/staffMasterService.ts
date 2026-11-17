import { CentralDataService } from './CentralDataService';

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

export const initializeStaffMaster = (): void => {};

export const getStaffMaster = (): MasterStaffRecord[] => {
  let list: any[] = [];
  try {
    const raw = localStorage.getItem('munyaka_staff_db') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('munyaka_staff');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch {}

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
    const exactRole = s.role || s.category || s.title || 'Subject Teacher';
    const sysRole = s.systemRole || mapDesignationToSystemRole(exactRole);
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
  return {
    id: created.id,
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
  CentralDataService.updateStaff(id, updates as any);
};

export const deleteStaffMaster = (id: string): void => {
  CentralDataService.deleteStaff(id);
};
