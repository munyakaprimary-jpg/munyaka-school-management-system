import { CentralDataService, STORAGE_KEYS } from './centralDataService';

export const STAFF_MASTER_KEY = STORAGE_KEYS.STAFF;

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
  return r.includes('librarian') || r.includes('bursar') || r.includes('store') || r.includes('lab') || r.includes('ict') || r.includes('support');
};

export const isLibrarianDesignation = (role: string): boolean => {
  return (role || '').toLowerCase().includes('librarian');
};

export const mapDesignationToSystemRole = (role: string): MasterSystemRole => {
  const r = (role || '').toLowerCase();
  if (r.includes('head')) return 'head_teacher';
  if (r.includes('senior')) return 'senior_teacher';
  if (r.includes('class')) return 'class_teacher';
  if (r.includes('librarian')) return 'librarian';
  if (r.includes('bursar') || r.includes('account')) return 'bursar';
  if (r.includes('store')) return 'storekeeper';
  if (r.includes('lab')) return 'lab_assistant';
  if (r.includes('ict')) return 'ict_technician';
  return 'subject_teacher';
};

export const initializeStaffMaster = (): void => {};

export const getStaffMaster = (): MasterStaffRecord[] => {
  if (localStorage.getItem('munyaka_staff_cleared_explicitly') === 'true') {
    return [];
  }
  const staff = CentralDataService.getStaff();
  return (staff || []).map((s: any) => ({
    id: s.id,
    name: s.name || s.full_name || 'Staff Member',
    nationalId: s.nationalId || s.id_no || `ID-${s.id}`,
    email: s.email || '',
    phone: s.phone || '',
    tscNumber: s.tscNumber || s.tsc_no,
    role: s.role || 'Teacher',
    systemRole: s.systemRole || 'subject_teacher',
    department: s.department || 'Administration',
    status: s.status || 'Pre-Registered',
    staffId: s.staffId || s.staff_id,
    tempAccessCode: s.tempAccessCode || s.access_key || s.ref,
    joinedDate: s.joinedDate || s.joined,
  }));
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
  const teaching = staff.filter(s => TEACHING_SYSTEM_ROLES.includes(s.systemRole)).length;
  const nonTeaching = staff.length - teaching;
  return { teaching, nonTeaching };
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

export const verifyStaffLogin = (_identifier: string, _pass: string) => null;
export const isTeachingRole = (_role: string) => true;
